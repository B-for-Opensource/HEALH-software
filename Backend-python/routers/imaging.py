from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id, resolve_org_id, log_audit, emit_outbox_event
from realtime import ws_manager

router = APIRouter(prefix="/api/imaging", tags=["Imaging & Radiology"])

@router.get("/services", response_model=schemas.ApiResponse)
def list_imaging_services(request: Request, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    org_id = resolve_org_id(current_user)
    services = db.query(models.ImagingServiceMaster).filter(
        models.ImagingServiceMaster.organisation_id == org_id,
        models.ImagingServiceMaster.is_active == True
    ).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": s.id, "service_code": s.service_code, "service_name": s.service_name,
            "modality": s.modality, "default_room": s.default_room, "default_price": s.default_price, "gst_percent": s.gst_percent
        } for s in services]
    )

@router.post("/services", response_model=schemas.ApiResponse)
def create_imaging_service(payload: dict = Body(...), db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    org_id = resolve_org_id(current_user)
    srv = models.ImagingServiceMaster(
        organisation_id=org_id,
        service_code=payload.get("service_code", "IMG-NEW"),
        service_name=payload["service_name"],
        modality=payload.get("modality", "X-Ray"),
        default_room=payload.get("default_room"),
        default_price=float(payload.get("default_price") or 0.0),
        gst_percent=float(payload.get("gst_percent") or 0.0),
    )
    db.add(srv)
    log_audit(db, action="CREATE", entity_type="ImagingServiceMaster", entity_id=srv.id, entity_ref=srv.service_code, user=current_user)
    db.commit()
    return schemas.ApiResponse(success=True, data={"id": srv.id})

@router.get("/orders", response_model=schemas.ApiResponse)
def list_imaging_orders(
    request: Request,
    status: Optional[str] = None,
    modality: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.ImagingOrder).filter(models.ImagingOrder.organisation_id == org_id)
    if current_user.role != "Super Admin":
        q = q.filter(models.ImagingOrder.branch_id == branch_id)
    if status and status != "all":
        q = q.filter(models.ImagingOrder.status == status)
    if modality and modality != "all":
        q = q.filter(models.ImagingOrder.modality == modality)

    orders = q.order_by(desc(models.ImagingOrder.created_at)).limit(100).all()
    data = []
    for o in orders:
        p = db.query(models.Patient).filter(models.Patient.id == o.patient_id).first()
        data.append({
            "id": o.id,
            "order_no": o.order_no,
            "encounter_id": o.encounter_id,
            "patient_id": o.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "modality": o.modality,
            "service_name": o.service_name,
            "room_equipment": o.room_equipment,
            "status": o.status,
            "technician_notes": o.technician_notes,
            "radiologist_findings": o.radiologist_findings,
            "image_file_url": o.image_file_url,
            "report_file_url": o.report_file_url,
            "price": o.price,
            "verified_at": o.verified_at.isoformat() if o.verified_at else None,
            "completed_at": o.completed_at.isoformat() if o.completed_at else None,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    return schemas.ApiResponse(success=True, data=data)

@router.post("/orders", response_model=schemas.ApiResponse)
def create_imaging_order(
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
    if not encounter_id:
        enc_count = db.query(models.Encounter).count()
        enc = models.Encounter(
            encounter_no=f"ENC-{str(enc_count + 1001).zfill(5)}",
            organisation_id=org_id,
            branch_id=branch_id,
            patient_id=patient_id,
            encounter_type="IMAGING",
            entry_source="IMAGING",
            status="IN_PROGRESS",
            created_by=current_user.id,
        )
        db.add(enc)
        db.flush()
        encounter_id = enc.id

    io_count = db.query(models.ImagingOrder).count()
    io = models.ImagingOrder(
        order_no=f"IMG-{str(io_count + 1001).zfill(5)}",
        organisation_id=org_id,
        branch_id=branch_id,
        encounter_id=encounter_id,
        patient_id=patient_id,
        ordered_by_doctor_id=current_user.id,
        service_id=payload.get("service_id"),
        modality=payload.get("modality", "X-Ray"),
        service_name=payload.get("service_name", "X-Ray Study"),
        room_equipment=payload.get("room_equipment"),
        status="ORDERED",
        technician_notes=payload.get("technician_notes"),
        price=float(payload.get("price") or 600.0),
        gst_percent=float(payload.get("gst_percent") or 0.0),
    )
    db.add(io)
    log_audit(db, action="CREATE", entity_type="ImagingOrder", entity_id=io.id, entity_ref=io.order_no, user=current_user, branch_id=branch_id)
    db.commit()
    ws_manager.broadcast_sync("ImagingOrderCreated", {"imaging_order_id": io.id, "order_no": io.order_no})
    return schemas.ApiResponse(success=True, data={"id": io.id, "order_no": io.order_no, "encounter_id": encounter_id})

@router.patch("/orders/{order_id}", response_model=schemas.ApiResponse)
def update_imaging_order(
    order_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    io = db.query(models.ImagingOrder).filter(models.ImagingOrder.id == order_id).first()
    if not io:
        raise HTTPException(status_code=404, detail="Imaging order not found")

    for field in ["status", "room_equipment", "technician_notes", "radiologist_findings", "image_file_url", "report_file_url"]:
        if field in payload and payload[field] is not None:
            setattr(io, field, payload[field])

    if io.status == "REPORT_READY":
        io.completed_at = datetime.utcnow()
    elif io.status == "VERIFIED":
        io.verified_by = current_user.id
        io.verified_at = datetime.utcnow()
        io.completed_at = io.completed_at or datetime.utcnow()

        existing_charge = db.query(models.PendingCharge).filter(
            models.PendingCharge.source_type == "IMAGING_ORDER",
            models.PendingCharge.source_id == io.id,
        ).first()
        if not existing_charge and io.price > 0:
            db.add(models.PendingCharge(
                organisation_id=io.organisation_id,
                branch_id=io.branch_id,
                encounter_id=io.encounter_id,
                patient_id=io.patient_id,
                source_type="IMAGING_ORDER",
                source_id=io.id,
                item_name=f"{io.modality}: {io.service_name} ({io.order_no})",
                quantity=1.0,
                unit_price=io.price,
                gst_percent=io.gst_percent,
            ))

        emit_outbox_event(
            db, event_type="ImagingReportVerified", payload={"imaging_order_id": io.id, "encounter_id": io.encounter_id},
            organisation_id=io.organisation_id, branch_id=io.branch_id, target_role="Doctor",
            notify_title=f"{io.modality} Report Verified", notify_message=f"{io.order_no}: {io.service_name} ready",
            resource_type="ImagingOrder", resource_id=io.id
        )

    log_audit(db, action="UPDATE", entity_type="ImagingOrder", entity_id=io.id, entity_ref=io.order_no, user=current_user, branch_id=io.branch_id, new_values={"status": io.status})
    db.commit()
    ws_manager.broadcast_sync("ImagingOrderUpdated", {"imaging_order_id": io.id, "status": io.status})
    return schemas.ApiResponse(success=True, data={"id": io.id, "status": io.status})
