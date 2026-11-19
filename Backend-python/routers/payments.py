from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.get("", response_model=schemas.ApiResponse)
def list_payments(
    bill_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    query = db.query(models.Payment)
    if bill_id:
        query = query.filter(models.Payment.bill_id == bill_id)
    if patient_id:
        query = query.filter(models.Payment.patient_id == patient_id)

    payments = query.order_by(desc(models.Payment.created_at)).all()
    results = []
    for p in payments:
        cashier = db.query(models.Staff).filter(models.Staff.id == p.cashier_id).first()
        results.append({
            "id": p.id,
            "bill_id": p.bill_id,
            "patient_id": p.patient_id,
            "payment_mode": p.payment_mode,
            "amount": p.amount,
            "card_last4": p.card_last4,
            "upi_ref": p.upi_ref,
            "payment_date": p.payment_date.isoformat() if p.payment_date else None,
            "cashier_name": cashier.full_name if cashier else "Cashier"
        })

    return schemas.ApiResponse(success=True, data=results)

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_payment(
    req: schemas.RecordPaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    b = db.query(models.Bill).filter(models.Bill.id == req.bill_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bill not found")

    amount = float(req.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    branch_id = resolve_branch_id(request, current_user)

    pm = models.Payment(
        bill_id=b.id,
        patient_id=b.patient_id,
        branch_id=branch_id,
        cashier_id=current_user.id,
        payment_date=date.today(),
        payment_mode=req.payment_mode,
        card_last4=req.card_last4,
        upi_ref=req.upi_ref,
        amount=amount
    )
    db.add(pm)

    b.amount_paid += amount
    b.balance_due = max(0.0, b.net_amount - b.amount_paid)
    b.payment_status = "Paid" if b.balance_due <= 0.01 else "Partial"

    db.commit()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": pm.id,
            "amount_paid": b.amount_paid,
            "balance_due": b.balance_due,
            "payment_status": b.payment_status
        },
        message="Payment recorded successfully"
    )
