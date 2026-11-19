from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=schemas.ApiResponse)
def get_dashboard_metrics(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    today = date.today()
    start_dt = datetime.combine(today, datetime.min.time())
    end_dt = datetime.combine(today, datetime.max.time())

    # Appointments today
    appts = db.query(models.Appointment).filter(
        models.Appointment.branch_id == branch_id,
        models.Appointment.appointment_date >= start_dt,
        models.Appointment.appointment_date <= end_dt
    ).all()

    today_patients = len(appts)
    waiting_count = sum(1 for a in appts if a.status == "Waiting")
    in_consult_count = sum(1 for a in appts if a.status in ("In-Consult", "Called"))
    completed_count = sum(1 for a in appts if a.status == "Completed")

    # Revenue today
    today_revenue = db.query(func.sum(models.Bill.net_amount)).filter(
        models.Bill.branch_id == branch_id,
        models.Bill.bill_date == today,
        models.Bill.status != "Cancelled"
    ).scalar() or 0.0

    today_paid = db.query(func.sum(models.Bill.amount_paid)).filter(
        models.Bill.branch_id == branch_id,
        models.Bill.bill_date == today,
        models.Bill.status != "Cancelled"
    ).scalar() or 0.0

    today_due = db.query(func.sum(models.Bill.balance_due)).filter(
        models.Bill.branch_id == branch_id,
        models.Bill.bill_date == today,
        models.Bill.status != "Cancelled"
    ).scalar() or 0.0

    # Payment modes
    cash_sum = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.branch_id == branch_id,
        models.Payment.payment_date == today,
        models.Payment.payment_mode == "Cash"
    ).scalar() or 0.0

    upi_sum = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.branch_id == branch_id,
        models.Payment.payment_date == today,
        models.Payment.payment_mode == "UPI"
    ).scalar() or 0.0

    card_sum = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.branch_id == branch_id,
        models.Payment.payment_date == today,
        models.Payment.payment_mode == "Card"
    ).scalar() or 0.0

    # Top Doctors (last 7 days)
    since_7d = today - timedelta(days=7)
    doctors = db.query(models.Staff).filter(models.Staff.role == "Doctor", models.Staff.branch_id == branch_id).all()
    top_docs = []
    for d in doctors:
        dept = db.query(models.Department).filter(models.Department.id == d.department_id).first()
        patients_cnt = db.query(models.Appointment).filter(
            models.Appointment.doctor_id == d.id,
            models.Appointment.appointment_date >= datetime.combine(since_7d, datetime.min.time())
        ).count()
        doc_rev = db.query(func.sum(models.Bill.net_amount)).filter(
            models.Bill.doctor_id == d.id,
            models.Bill.bill_date >= since_7d,
            models.Bill.status != "Cancelled"
        ).scalar() or 0.0
        top_docs.append({
            "name": d.full_name,
            "department": dept.name if dept else "General",
            "patients": patients_cnt,
            "revenue": float(doc_rev)
        })

    top_docs.sort(key=lambda x: x["revenue"], reverse=True)

    return schemas.ApiResponse(
        success=True,
        data={
            "today_patients": today_patients,
            "waiting_count": waiting_count,
            "in_consult_count": in_consult_count,
            "completed_count": completed_count,
            "today_revenue": float(today_revenue),
            "today_paid": float(today_paid),
            "today_due": float(today_due),
            "cash_collections": float(cash_sum),
            "upi_collections": float(upi_sum),
            "card_collections": float(card_sum),
            "top_doctors": top_docs[:5]
        }
    )
