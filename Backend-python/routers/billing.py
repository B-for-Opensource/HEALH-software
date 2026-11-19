from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/bills", tags=["Billing & POS"])

def generate_bill_number(db: Session, branch_id: str) -> str:
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    bcode = branch.branch_code if branch and branch.branch_code else "KRN"
    today_str = date.today().strftime("%Y%m%d")
    count = db.query(models.Bill).filter(models.Bill.branch_id == branch_id).count()
    return f"INV-{bcode}-{today_str}-{str(count + 1).zfill(4)}"

@router.get("", response_model=schemas.ApiResponse)
def list_bills(
    request: Request,
    patient_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    query = db.query(models.Bill).filter(models.Bill.branch_id == branch_id)
    if patient_id:
        query = query.filter(models.Bill.patient_id == patient_id)

    bills = query.order_by(desc(models.Bill.created_at)).limit(limit).all()
    results = []
    for b in bills:
        p = db.query(models.Patient).filter(models.Patient.id == b.patient_id).first()
        results.append({
            "id": b.id,
            "bill_no": b.bill_no,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "-",
            "net_amount": b.net_amount,
            "amount_paid": b.amount_paid,
            "balance_due": b.balance_due,
            "payment_status": b.payment_status,
            "status": b.status,
            "bill_date": b.bill_date.isoformat() if b.bill_date else None,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })

    return schemas.ApiResponse(success=True, data=results)

@router.get("/{bill_id}", response_model=schemas.ApiResponse)
def get_bill(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    b = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bill not found")

    p = db.query(models.Patient).filter(models.Patient.id == b.patient_id).first()
    doc = db.query(models.Staff).filter(models.Staff.id == b.doctor_id).first()
    items = db.query(models.BillItem).filter(models.BillItem.bill_id == b.id).order_by(models.BillItem.sort_order.asc()).all()
    payments = db.query(models.Payment).filter(models.Payment.bill_id == b.id).all()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": b.id,
            "bill_no": b.bill_no,
            "patient_id": b.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "-",
            "doctor_name": doc.full_name if doc else None,
            "subtotal": b.subtotal,
            "discount_amount": b.discount_amount,
            "discount_remarks": b.discount_remarks,
            "taxable_amount": b.taxable_amount,
            "cgst_amount": b.cgst_amount,
            "sgst_amount": b.sgst_amount,
            "net_amount": b.net_amount,
            "amount_paid": b.amount_paid,
            "balance_due": b.balance_due,
            "payment_status": b.payment_status,
            "bill_date": b.bill_date.isoformat() if b.bill_date else None,
            "status": b.status,
            "items": [{
                "id": it.id,
                "item_type": it.item_type,
                "item_name": it.item_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "discount_amount": it.discount_amount,
                "cgst_percent": it.cgst_percent,
                "sgst_percent": it.sgst_percent,
                "line_total": it.line_total
            } for it in items],
            "payments": [{
                "id": py.id,
                "payment_mode": py.payment_mode,
                "amount": py.amount,
                "upi_ref": py.upi_ref,
                "card_last4": py.card_last4,
                "payment_date": py.payment_date.isoformat() if py.payment_date else None
            } for py in payments]
        }
    )

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_bill(
    req: schemas.BillCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    bill_no = generate_bill_number(db, branch_id)

    subtotal = 0.0
    total_disc = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_net = 0.0

    processed_items = []
    for idx, it in enumerate(req.items):
        qty = float(it.quantity or 1.0)
        rate = float(it.unit_price)
        disc = float(it.discount_amount or 0.0)
        line_sub = max(0.0, qty * rate - disc)
        cgst_pct = float(it.cgst_percent or 0.0)
        sgst_pct = float(it.sgst_percent or 0.0)
        cgst_amt = line_sub * (cgst_pct / 100.0)
        sgst_amt = line_sub * (sgst_pct / 100.0)
        line_total = line_sub + cgst_amt + sgst_amt

        subtotal += (qty * rate)
        total_disc += disc
        total_cgst += cgst_amt
        total_sgst += sgst_amt
        total_net += line_total

        processed_items.append({
            "item_type": it.item_type or "Consultation",
            "item_name": it.item_name,
            "item_code": it.item_code,
            "quantity": qty,
            "unit_price": rate,
            "discount_amount": disc,
            "taxable_amount": line_sub,
            "cgst_percent": cgst_pct,
            "sgst_percent": sgst_pct,
            "cgst_amount": cgst_amt,
            "sgst_amount": sgst_amt,
            "line_total": line_total,
            "sort_order": idx
        })

    total_paid = sum(float(p.amount) for p in (req.payments or []))
    balance_due = max(0.0, total_net - total_paid)
    pay_status = "Paid" if balance_due <= 0.01 else ("Partial" if total_paid > 0 else "Unpaid")

    bill = models.Bill(
        bill_no=bill_no,
        patient_id=req.patient_id,
        consultation_id=None,
        branch_id=branch_id,
        cashier_id=current_user.id,
        doctor_id=req.doctor_id,
        subtotal=subtotal,
        discount_amount=total_disc,
        discount_remarks=req.discount_remarks,
        taxable_amount=subtotal - total_disc,
        cgst_amount=total_cgst,
        sgst_amount=total_sgst,
        net_amount=total_net,
        amount_paid=total_paid,
        balance_due=balance_due,
        payment_status=pay_status,
        bill_date=date.today(),
        status="Active"
    )
    db.add(bill)
    db.flush()

    for pit in processed_items:
        bi = models.BillItem(
            bill_id=bill.id,
            **pit
        )
        db.add(bi)

    # Record payments
    for p in (req.payments or []):
        if float(p.amount) > 0:
            pm = models.Payment(
                bill_id=bill.id,
                patient_id=req.patient_id,
                branch_id=branch_id,
                cashier_id=current_user.id,
                payment_date=date.today(),
                payment_mode=p.payment_mode,
                card_last4=p.card_last4,
                upi_ref=p.upi_ref,
                amount=float(p.amount)
            )
            db.add(pm)

    # If appointment_id passed, mark completed
    if req.appointment_id:
        appt = db.query(models.Appointment).filter(models.Appointment.id == req.appointment_id).first()
        if appt:
            appt.status = "Completed"

    db.commit()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": bill.id,
            "bill_no": bill.bill_no,
            "net_amount": bill.net_amount,
            "amount_paid": bill.amount_paid,
            "balance_due": bill.balance_due,
            "payment_status": bill.payment_status,
            "bill_date": bill.bill_date.isoformat()
        },
        message="Bill generated successfully"
    )

@router.post("/{bill_id}/pay", response_model=schemas.ApiResponse)
def pay_bill(
    bill_id: str,
    req: schemas.RecordPaymentRequest,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    b = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bill not found")

    amount = float(req.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    pm = models.Payment(
        bill_id=b.id,
        patient_id=b.patient_id,
        branch_id=b.branch_id,
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
            "amount_paid": b.amount_paid,
            "balance_due": b.balance_due,
            "payment_status": b.payment_status
        },
        message="Payment recorded successfully"
    )

@router.put("/{bill_id}/cancel", response_model=schemas.ApiResponse)
def cancel_bill(
    bill_id: str,
    reason: str = Query("Cancelled by user"),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    b = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bill not found")

    b.status = "Cancelled"
    b.cancel_reason = reason
    b.cancelled_by = current_user.id
    b.cancelled_at = datetime.utcnow()
    db.commit()

    return schemas.ApiResponse(success=True, message="Bill cancelled successfully")
