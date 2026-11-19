from typing import Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/collection", response_model=schemas.ApiResponse)
def collection_report(
    request: Request,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    payment_mode: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    fdate = datetime.strptime(from_date, "%Y-%m-%d").date() if from_date else date.today()
    tdate = datetime.strptime(to_date, "%Y-%m-%d").date() if to_date else date.today()

    query = db.query(models.Bill).filter(
        models.Bill.branch_id == branch_id,
        models.Bill.bill_date >= fdate,
        models.Bill.bill_date <= tdate,
        models.Bill.status != "Cancelled"
    )

    bills = query.order_by(desc(models.Bill.created_at)).all()
    results = []
    for b in bills:
        p = db.query(models.Patient).filter(models.Patient.id == b.patient_id).first()
        doc = db.query(models.Staff).filter(models.Staff.id == b.doctor_id).first()

        cash_sum = db.query(func.sum(models.Payment.amount)).filter(
            models.Payment.bill_id == b.id, models.Payment.payment_mode == "Cash"
        ).scalar() or 0.0

        upi_sum = db.query(func.sum(models.Payment.amount)).filter(
            models.Payment.bill_id == b.id, models.Payment.payment_mode == "UPI"
        ).scalar() or 0.0

        card_sum = db.query(func.sum(models.Payment.amount)).filter(
            models.Payment.bill_id == b.id, models.Payment.payment_mode == "Card"
        ).scalar() or 0.0

        if payment_mode:
            if payment_mode == "Cash" and cash_sum <= 0: continue
            if payment_mode == "UPI" and upi_sum <= 0: continue
            if payment_mode == "Card" and card_sum <= 0: continue

        results.append({
            "id": b.id,
            "bill_no": b.bill_no,
            "bill_date": b.bill_date.isoformat() if b.bill_date else None,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "-",
            "doctor_name": doc.full_name if doc else "Clinic Team",
            "net_amount": b.net_amount,
            "amount_paid": b.amount_paid,
            "discount_amount": b.discount_amount,
            "payment_status": b.payment_status,
            "cash_amount": cash_sum,
            "upi_amount": upi_sum,
            "card_amount": card_sum,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })

    return schemas.ApiResponse(success=True, data=results)

@router.get("/trend", response_model=schemas.ApiResponse)
def collection_trend(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    trend = []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        day_label = "Today" if i == 0 else d.strftime("%a")

        rev = db.query(func.sum(models.Bill.amount_paid)).filter(
            models.Bill.branch_id == branch_id,
            models.Bill.bill_date == d,
            models.Bill.status != "Cancelled"
        ).scalar() or 0.0

        cnt = db.query(models.Bill).filter(
            models.Bill.branch_id == branch_id,
            models.Bill.bill_date == d,
            models.Bill.status != "Cancelled"
        ).count()

        trend.append({
            "day": day_label,
            "date": d.isoformat(),
            "revenue": float(rev),
            "patients": cnt
        })

    return schemas.ApiResponse(success=True, data=trend)

@router.get("/doctor", response_model=schemas.ApiResponse)
def doctor_report(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    doctors = db.query(models.Staff).filter(models.Staff.role == "Doctor", models.Staff.branch_id == branch_id).all()
    results = []
    for d in doctors:
        dept = db.query(models.Department).filter(models.Department.id == d.department_id).first()
        consult_count = db.query(models.Appointment).filter(
            models.Appointment.doctor_id == d.id,
            models.Appointment.status == "Completed"
        ).count()
        rev = db.query(func.sum(models.Bill.net_amount)).filter(
            models.Bill.doctor_id == d.id,
            models.Bill.status != "Cancelled"
        ).scalar() or 0.0

        results.append({
            "id": d.id,
            "doctor_name": d.full_name,
            "department_name": dept.name if dept else "General",
            "total_consults": consult_count,
            "total_revenue": float(rev)
        })
    return schemas.ApiResponse(success=True, data=results)

@router.get("/billing", response_model=schemas.ApiResponse)
def billing_summary(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    rows = db.query(
        models.Bill.bill_date,
        func.count(models.Bill.id).label("total_bills"),
        func.sum(models.Bill.subtotal).label("gross_amount"),
        func.sum(models.Bill.discount_amount).label("total_discount"),
        func.sum(models.Bill.net_amount).label("net_amount"),
        func.sum(models.Bill.amount_paid).label("collected_amount"),
        func.sum(models.Bill.balance_due).label("outstanding_amount")
    ).filter(
        models.Bill.branch_id == branch_id,
        models.Bill.status != "Cancelled"
    ).group_by(models.Bill.bill_date).order_by(desc(models.Bill.bill_date)).limit(30).all()

    results = []
    for r in rows:
        results.append({
            "bill_date": r.bill_date.isoformat() if r.bill_date else None,
            "total_bills": r.total_bills,
            "gross_amount": float(r.gross_amount or 0),
            "total_discount": float(r.total_discount or 0),
            "net_amount": float(r.net_amount or 0),
            "collected_amount": float(r.collected_amount or 0),
            "outstanding_amount": float(r.outstanding_amount or 0)
        })

    return schemas.ApiResponse(success=True, data=results)
