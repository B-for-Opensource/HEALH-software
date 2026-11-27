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

router = APIRouter(prefix="/api/nursing", tags=["Nursing Station & Procedures"])

@router.get("/procedures", response_model=schemas.ApiResponse)
def list_nursing_procedures(
    request: Request,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.NursingProcedureOrder).filter(models.NursingProcedureOrder.organisation_id == org_id)
    if current_user.role != "Super Admin":
        q = q.filter(models.NursingProcedureOrder.branch_id == branch_id)
    if status and status != "all":
        q = q.filter(models.NursingProcedureOrder.status == status)

    rows = q.order_by(desc(models.NursingProcedureOrder.created_at)).limit(100).all()
    data = []
    for r in rows:
        p = db.query(models.Patient).filter(models.Patient.id == r.patient_id).first()
        data.append({
            "id": r.id, "encounter_id": r.encounter_id, "patient_id": r.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "procedure_name": r.procedure_name, "is_direct_entry": r.is_direct_entry,
            "status": r.status, "notes": r.notes, "next_action": r.next_action,
            "price": r.price, "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return schemas.ApiResponse(success=True, data=data)

@router.post("/procedures", response_model=schemas.ApiResponse)
def create_nursing_procedure(
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

    is_direct = bool(payload.get("is_direct_entry", False))
    encounter_id = payload.get("encounter_id")
    if not encounter_id:
        enc_count = db.query(models.Encounter).count()
        enc = models.Encounter(
            encounter_no=f"ENC-{str(enc_count + 1001).zfill(5)}",
            organisation_id=org_id, branch_id=branch_id, patient_id=patient_id,
            encounter_type="DIRECT_NURSING" if is_direct else "CONSULTATION",
            entry_source="NURSING" if is_direct else "RECEPTION",
            status="IN_PROGRESS", nurse_id=current_user.id, created_by=current_user.id,
        )
        db.add(enc)
        db.flush()
        encounter_id = enc.id

    po = models.NursingProcedureOrder(
        organisation_id=org_id, branch_id=branch_id, encounter_id=encounter_id,
        patient_id=patient_id,
        ordered_by_doctor_id=None if is_direct else payload.get("ordered_by_doctor_id"),
        nurse_id=current_user.id,
        procedure_name=payload.get("procedure_name", "Nursing Procedure"),
        is_direct_entry=is_direct,
        status="ORDERED",
        notes=payload.get("notes"),
        price=float(payload.get("price") or 350.0),
    )
    db.add(po)
    log_audit(db, action="CREATE", entity_type="NursingProcedureOrder", entity_id=po.id, entity_ref=po.procedure_name, user=current_user, branch_id=branch_id)
    db.commit()
    ws_manager.broadcast_sync("NursingProcedureCreated", {"procedure_id": po.id})
    return schemas.ApiResponse(success=True, data={"id": po.id, "encounter_id": encounter_id})

@router.patch("/procedures/{proc_id}/complete", response_model=schemas.ApiResponse)
def complete_nursing_procedure(
    proc_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    po = db.query(models.NursingProcedureOrder).filter(models.NursingProcedureOrder.id == proc_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Nursing procedure not found")

    po.status = "COMPLETED"
    po.nurse_id = current_user.id
    po.completed_at = datetime.utcnow()
    if payload.get("notes"):
        po.notes = payload["notes"]
    default_next = "BILLING" if po.is_direct_entry else "RETURN_TO_DOCTOR"
    po.next_action = payload.get("next_action", default_next)

    # Idempotent pending charge creation for Billing POS
    if po.price > 0:
        existing = db.query(models.PendingCharge).filter(
            models.PendingCharge.source_type == "NURSING_PROCEDURE",
            models.PendingCharge.source_id == po.id,
        ).first()
        if not existing:
            db.add(models.PendingCharge(
                organisation_id=po.organisation_id, branch_id=po.branch_id,
                encounter_id=po.encounter_id, patient_id=po.patient_id,
                source_type="NURSING_PROCEDURE", source_id=po.id,
                item_name=f"Nursing Procedure: {po.procedure_name}",
                quantity=1.0, unit_price=po.price, gst_percent=0.0,
            ))

    emit_outbox_event(
        db, event_type="ProcedureCompleted", payload={"procedure_id": po.id, "encounter_id": po.encounter_id, "next_action": po.next_action},
        organisation_id=po.organisation_id, branch_id=po.branch_id,
        target_role="Doctor" if po.next_action == "RETURN_TO_DOCTOR" else "Cashier",
        notify_title="Procedure Completed", notify_message=f"{po.procedure_name} completed ({po.next_action})",
        resource_type="NursingProcedureOrder", resource_id=po.id,
    )
    log_audit(db, action="COMPLETE", entity_type="NursingProcedureOrder", entity_id=po.id, entity_ref=po.procedure_name, user=current_user, branch_id=po.branch_id)
    db.commit()
    ws_manager.broadcast_sync("ProcedureCompleted", {"procedure_id": po.id, "next_action": po.next_action})
    return schemas.ApiResponse(success=True, data={"id": po.id, "status": po.status, "next_action": po.next_action})
