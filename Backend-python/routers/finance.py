from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id, resolve_org_id, log_audit, require_role

router = APIRouter(prefix="/api/finance", tags=["Finance, Charges & Notifications"])

@router.get("/pending-charges", response_model=schemas.ApiResponse)
def list_pending_charges(
    request: Request,
    patient_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.PendingCharge).filter(
        models.PendingCharge.organisation_id == org_id,
        models.PendingCharge.status == "UNBILLED"
    )
    if current_user.role != "Super Admin":
        q = q.filter(models.PendingCharge.branch_id == branch_id)
    if patient_id:
        q = q.filter(models.PendingCharge.patient_id == patient_id)

    rows = q.order_by(desc(models.PendingCharge.created_at)).all()
    data = []
    for c in rows:
        p = db.query(models.Patient).filter(models.Patient.id == c.patient_id).first()
        data.append({
            "id": c.id, "patient_id": c.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "encounter_id": c.encounter_id, "source_type": c.source_type, "source_id": c.source_id,
            "item_name": c.item_name, "quantity": c.quantity, "unit_price": c.unit_price, "gst_percent": c.gst_percent,
        })
    return schemas.ApiResponse(success=True, data=data)

@router.post("/refund-requests", response_model=schemas.ApiResponse)
def request_refund(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    bill_id = payload.get("bill_id")
    reason = (payload.get("reason") or "").strip()
    amount = float(payload.get("amount") or 0.0)
    if not bill_id or not reason or amount <= 0:
        raise HTTPException(status_code=400, detail="bill_id, positive amount, and reason are required")

    bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    rr = models.RefundRequest(
        organisation_id=resolve_org_id(current_user),
        branch_id=bill.branch_id,
        bill_id=bill.id,
        patient_id=bill.patient_id,
        amount=amount,
        reason=reason,
        requested_by=current_user.id,
        status="PENDING",
    )
    db.add(rr)
    log_audit(db, action="REFUND_REQUEST", entity_type="Bill", entity_id=bill.id, entity_ref=bill.bill_no, user=current_user, remarks=reason)
    db.commit()
    return schemas.ApiResponse(success=True, data={"id": rr.id, "status": rr.status})

@router.post("/refund-requests/{req_id}/approve", response_model=schemas.ApiResponse)
def approve_refund(
    req_id: str,
    payload: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(require_role(["Super Admin", "Branch Manager"]))
):
    rr = db.query(models.RefundRequest).filter(models.RefundRequest.id == req_id).first()
    if not rr:
        raise HTTPException(status_code=404, detail="Refund request not found")

    decision = payload.get("decision", "APPROVED")
    rr.status = decision
    rr.approved_by = current_user.id
    rr.approved_at = datetime.utcnow()
    if decision == "APPROVED":
        bill = db.query(models.Bill).filter(models.Bill.id == rr.bill_id).first()
        if bill:
            bill.payment_status = "Refunded"
    log_audit(db, action=f"REFUND_{decision}", entity_type="RefundRequest", entity_id=rr.id, user=current_user, remarks=rr.reason)
    db.commit()
    return schemas.ApiResponse(success=True, data={"id": rr.id, "status": rr.status})

@router.get("/notifications", response_model=schemas.ApiResponse)
def list_notifications(request: Request, db: Session = Depends(get_db), current_user: models.Staff = Depends(get_current_user)):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.Notification).filter(models.Notification.organisation_id == org_id)
    if current_user.role != "Super Admin":
        q = q.filter(models.Notification.branch_id == branch_id)
    rows = q.order_by(desc(models.Notification.created_at)).limit(40).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": n.id, "title": n.title, "message": n.message, "target_role": n.target_role,
            "resource_type": n.resource_type, "resource_id": n.resource_id,
            "is_read": n.is_read, "created_at": n.created_at.isoformat() if n.created_at else None
        } for n in rows]
    )
