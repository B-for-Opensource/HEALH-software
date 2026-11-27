from datetime import datetime
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id, resolve_org_id, log_audit, emit_outbox_event
from realtime import ws_manager

router = APIRouter(prefix="/api/lab", tags=["Laboratory"])

def resolve_service_price(db: Session, branch_id: str, service_type: str, service_id: str, default_price: float) -> float:
    ov = db.query(models.BranchServicePriceOverride).filter(
        models.BranchServicePriceOverride.branch_id == branch_id,
        models.BranchServicePriceOverride.service_type == service_type,
        models.BranchServicePriceOverride.service_id == service_id,
        models.BranchServicePriceOverride.is_active == True,
    ).first()
    return ov.override_price if ov else default_price

@router.get("/services", response_model=schemas.ApiResponse)
def list_lab_services(request: Request, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    services = db.query(models.LabServiceMaster).filter(
        models.LabServiceMaster.organisation_id == org_id,
        models.LabServiceMaster.is_active == True
    ).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": s.id,
            "test_code": s.test_code,
            "test_name": s.test_name,
            "category": s.category,
            "sample_type": s.sample_type,
            "parameters": json.loads(s.parameters_json) if s.parameters_json else [],
            "default_price": s.default_price,
            "effective_price": resolve_service_price(db, branch_id, "LAB", s.id, s.default_price),
            "gst_percent": s.gst_percent,
        } for s in services]
    )

@router.post("/services", response_model=schemas.ApiResponse)
def create_lab_service(payload: dict = Body(...), db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    org_id = resolve_org_id(current_user)
    srv = models.LabServiceMaster(
        organisation_id=org_id,
        test_code=payload.get("test_code", "LAB-NEW"),
        test_name=payload["test_name"],
        category=payload.get("category", "Biochemistry"),
        sample_type=payload.get("sample_type", "Blood / Serum"),
        parameters_json=json.dumps(payload.get("parameters", [])),
        default_price=float(payload.get("default_price") or 0.0),
        gst_percent=float(payload.get("gst_percent") or 0.0),
    )
    db.add(srv)
    log_audit(db, action="CREATE", entity_type="LabServiceMaster", entity_id=srv.id, entity_ref=srv.test_code, user=current_user)
    db.commit()
    return schemas.ApiResponse(success=True, data={"id": srv.id, "test_code": srv.test_code})

@router.get("/orders", response_model=schemas.ApiResponse)
def list_lab_orders(
    request: Request,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.LabOrder).filter(models.LabOrder.organisation_id == org_id)
    if current_user.role != "Super Admin":
        q = q.filter(models.LabOrder.branch_id == branch_id)
    if status and status != "all":
        q = q.filter(models.LabOrder.status == status)

    orders = q.order_by(desc(models.LabOrder.created_at)).limit(100).all()
    data = []
    for o in orders:
        p = db.query(models.Patient).filter(models.Patient.id == o.patient_id).first()
        items = db.query(models.LabOrderItem).filter(models.LabOrderItem.lab_order_id == o.id).all()
        results = db.query(models.LabResult).filter(models.LabResult.lab_order_id == o.id).all()
        data.append({
            "id": o.id,
            "order_no": o.order_no,
            "encounter_id": o.encounter_id,
            "patient_id": o.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "is_direct_entry": o.is_direct_entry,
            "status": o.status,
            "priority": o.priority,
            "clinical_notes": o.clinical_notes,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "verified_at": o.verified_at.isoformat() if o.verified_at else None,
            "released_at": o.released_at.isoformat() if o.released_at else None,
            "items": [{"id": it.id, "test_name": it.test_name, "sample_type": it.sample_type, "status": it.status, "price": it.price} for it in items],
            "results": [{
                "id": r.id, "parameter_name": r.parameter_name, "observed_value": r.observed_value,
                "unit": r.unit, "reference_range": r.reference_range, "is_abnormal": r.is_abnormal,
                "report_file_url": r.report_file_url, "status": r.status
            } for r in results],
        })
    return schemas.ApiResponse(success=True, data=data)

@router.post("/orders", response_model=schemas.ApiResponse)
def create_lab_order(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = payload.get("branch_id") or resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    patient_id = payload.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")

    encounter_id = payload.get("encounter_id")
    is_direct = bool(payload.get("is_direct_entry", False))
    if not encounter_id:
        enc_count = db.query(models.Encounter).count()
        enc = models.Encounter(
            encounter_no=f"ENC-{str(enc_count + 1001).zfill(5)}",
            organisation_id=org_id,
            branch_id=branch_id,
            patient_id=patient_id,
            encounter_type="DIRECT_LAB" if is_direct else "CONSULTATION",
            entry_source="LAB" if is_direct else "RECEPTION",
            status="IN_PROGRESS",
            created_by=current_user.id,
        )
        db.add(enc)
        db.flush()
        encounter_id = enc.id

    lo_count = db.query(models.LabOrder).count()
    lo = models.LabOrder(
        order_no=f"LAB-{str(lo_count + 1001).zfill(5)}",
        organisation_id=org_id,
        branch_id=branch_id,
        encounter_id=encounter_id,
        patient_id=patient_id,
        ordered_by_doctor_id=None if is_direct else current_user.id,
        is_direct_entry=is_direct,
        status="ORDERED",
        priority=payload.get("priority", "Routine"),
        clinical_notes=payload.get("clinical_notes"),
    )
    db.add(lo)
    db.flush()

    tests = payload.get("tests") or []
    for t in tests:
        price = float(t.get("price") or 0.0)
        if t.get("service_id"):
            srv = db.query(models.LabServiceMaster).filter(models.LabServiceMaster.id == t["service_id"]).first()
            if srv:
                price = resolve_service_price(db, branch_id, "LAB", srv.id, srv.default_price)
        db.add(models.LabOrderItem(
            lab_order_id=lo.id,
            service_id=t.get("service_id"),
            test_name=t.get("test_name", "Lab Test"),
            sample_type=t.get("sample_type", "Blood / Serum"),
            price=price,
            gst_percent=float(t.get("gst_percent") or 0.0),
        ))

    log_audit(db, action="CREATE", entity_type="LabOrder", entity_id=lo.id, entity_ref=lo.order_no, user=current_user, branch_id=branch_id)
    db.commit()
    ws_manager.broadcast_sync("LabOrderCreated", {"lab_order_id": lo.id, "order_no": lo.order_no})
    return schemas.ApiResponse(success=True, data={"id": lo.id, "order_no": lo.order_no, "encounter_id": encounter_id})

@router.patch("/orders/{order_id}/status", response_model=schemas.ApiResponse)
def update_lab_order_status(
    order_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    lo = db.query(models.LabOrder).filter(models.LabOrder.id == order_id).first()
    if not lo:
        raise HTTPException(status_code=404, detail="Lab order not found")

    new_status = payload.get("status", lo.status)
    lo.status = new_status
    if new_status == "SAMPLE_COLLECTED":
        lo.sample_collected_at = datetime.utcnow()
        lo.sample_collected_by = current_user.id
    elif new_status == "VERIFIED":
        lo.verified_by = current_user.id
        lo.verified_at = datetime.utcnow()
    elif new_status == "RELEASED":
        if not lo.verified_at:
            lo.verified_by = current_user.id
            lo.verified_at = datetime.utcnow()
        lo.released_at = datetime.utcnow()

        # Idempotent pending charge creation for billing
        existing_charge = db.query(models.PendingCharge).filter(
            models.PendingCharge.source_type == "LAB_ORDER",
            models.PendingCharge.source_id == lo.id,
        ).first()
        if not existing_charge:
            items = db.query(models.LabOrderItem).filter(models.LabOrderItem.lab_order_id == lo.id).all()
            total_price = sum(it.price for it in items)
            if total_price > 0:
                db.add(models.PendingCharge(
                    organisation_id=lo.organisation_id,
                    branch_id=lo.branch_id,
                    encounter_id=lo.encounter_id,
                    patient_id=lo.patient_id,
                    source_type="LAB_ORDER",
                    source_id=lo.id,
                    item_name=f"Lab Tests ({lo.order_no}): " + ", ".join(it.test_name for it in items[:3]),
                    quantity=1.0,
                    unit_price=total_price,
                    gst_percent=0.0,
                ))

        emit_outbox_event(
            db, event_type="LabResultVerified", payload={"lab_order_id": lo.id, "encounter_id": lo.encounter_id},
            organisation_id=lo.organisation_id, branch_id=lo.branch_id, target_role="Doctor",
            notify_title="Lab Result Released", notify_message=f"Results ready for {lo.order_no}",
            resource_type="LabOrder", resource_id=lo.id
        )

    log_audit(db, action="STATUS_UPDATE", entity_type="LabOrder", entity_id=lo.id, entity_ref=lo.order_no, user=current_user, branch_id=lo.branch_id, new_values={"status": new_status})
    db.commit()
    ws_manager.broadcast_sync("LabOrderUpdated", {"lab_order_id": lo.id, "status": new_status})
    return schemas.ApiResponse(success=True, data={"id": lo.id, "status": lo.status})

@router.post("/orders/{order_id}/results", response_model=schemas.ApiResponse)
def save_lab_results(
    order_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    lo = db.query(models.LabOrder).filter(models.LabOrder.id == order_id).first()
    if not lo:
        raise HTTPException(status_code=404, detail="Lab order not found")

    rows = payload.get("results") or []
    for r in rows:
        db.add(models.LabResult(
            lab_order_id=lo.id,
            lab_order_item_id=r.get("lab_order_item_id"),
            parameter_name=r.get("parameter_name", "Result"),
            observed_value=str(r.get("observed_value", "")),
            unit=r.get("unit"),
            reference_range=r.get("reference_range"),
            is_abnormal=bool(r.get("is_abnormal", False)),
            report_file_url=r.get("report_file_url") or payload.get("report_file_url"),
            entered_by=current_user.id,
            status="RESULT_DRAFT",
        ))
    lo.status = "RESULT_DRAFT"
    log_audit(db, action="ENTER_RESULTS", entity_type="LabOrder", entity_id=lo.id, entity_ref=lo.order_no, user=current_user, branch_id=lo.branch_id)
    db.commit()
    return schemas.ApiResponse(success=True, message="Lab results saved as draft for verification")
