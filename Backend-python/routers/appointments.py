from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/appointments", tags=["Appointments & Token Queue"])

def get_next_token_no(db: Session, branch_id: str, appt_date: date) -> int:
    start_dt = datetime.combine(appt_date, datetime.min.time())
    end_dt = datetime.combine(appt_date, datetime.max.time())
    max_token = db.query(func.max(models.Appointment.token_no)).filter(
        models.Appointment.branch_id == branch_id,
        models.Appointment.appointment_date >= start_dt,
        models.Appointment.appointment_date <= end_dt
    ).scalar()
    return (max_token or 0) + 1

@router.get("/followups", response_model=schemas.ApiResponse)
def get_followups(
    date_str: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()

    consults = db.query(models.Consultation).filter(
        models.Consultation.review_date == target_date
    ).all()

    results = []
    for c in consults:
        p = db.query(models.Patient).filter(models.Patient.id == c.patient_id).first()
        doc = db.query(models.Staff).filter(models.Staff.id == c.doctor_id).first()
        if p:
            results.append({
                "id": c.id,
                "patient_name": f"{p.first_name} {p.last_name or ''}".strip(),
                "first_name": p.first_name,
                "op_no": p.op_no,
                "phone": p.phone,
                "doctor_name": doc.full_name if doc else "Consulting Doctor",
                "review_date": c.review_date.isoformat() if c.review_date else None,
                "review_instructions": c.review_instructions,
                "purpose": c.diagnosis,
                "called": False
            })

    return schemas.ApiResponse(success=True, data=results)

@router.get("", response_model=schemas.ApiResponse)
def list_appointments(
    request: Request,
    date_str: Optional[str] = Query(None, alias="date"),
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()
    start_dt = datetime.combine(target_date, datetime.min.time())
    end_dt = datetime.combine(target_date, datetime.max.time())

    query = db.query(models.Appointment).filter(
        models.Appointment.branch_id == branch_id,
        models.Appointment.appointment_date >= start_dt,
        models.Appointment.appointment_date <= end_dt
    )

    if status and status != "all":
        query = query.filter(models.Appointment.status == status)

    appointments = query.order_by(models.Appointment.token_no.asc()).limit(limit).all()

    data = []
    for a in appointments:
        p = db.query(models.Patient).filter(models.Patient.id == a.patient_id).first()
        doc = db.query(models.Staff).filter(models.Staff.id == a.doctor_id).first()
        dept = db.query(models.Department).filter(models.Department.id == a.department_id).first()

        data.append({
            "id": a.id,
            "token_no": a.token_no,
            "patient_id": a.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "-",
            "phone": p.phone if p else "-",
            "doctor_id": a.doctor_id,
            "doctor_name": doc.full_name if doc else "Assigned Doctor",
            "department_id": a.department_id,
            "department_name": dept.name if dept else "General",
            "appointment_date": a.appointment_date.isoformat() if a.appointment_date else None,
            "visit_type": a.visit_type,
            "consultation_type": a.consultation_type,
            "purpose": a.purpose,
            "status": a.status,
            "token_printed": a.token_printed,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })

    return schemas.ApiResponse(success=True, data=data)

@router.get("/{appointment_id}", response_model=schemas.ApiResponse)
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    a = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    p = db.query(models.Patient).filter(models.Patient.id == a.patient_id).first()
    doc = db.query(models.Staff).filter(models.Staff.id == a.doctor_id).first()
    dept = db.query(models.Department).filter(models.Department.id == a.department_id).first()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": a.id,
            "token_no": a.token_no,
            "patient_id": a.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "-",
            "phone": p.phone if p else "-",
            "doctor_id": a.doctor_id,
            "doctor_name": doc.full_name if doc else "Doctor",
            "department_name": dept.name if dept else "General",
            "appointment_date": a.appointment_date.isoformat() if a.appointment_date else None,
            "visit_type": a.visit_type,
            "purpose": a.purpose,
            "status": a.status,
            "token_printed": a.token_printed
        }
    )

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_appointment_token(
    req: schemas.AppointmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    appt_dt = datetime.utcnow()
    if req.appointment_date:
        try:
            appt_dt = datetime.strptime(req.appointment_date, "%Y-%m-%d")
        except Exception:
            pass

    token_number = get_next_token_no(db, branch_id, appt_dt.date())

    doc = db.query(models.Staff).filter(models.Staff.id == req.doctor_id).first()
    dept_id = req.department_id or (doc.department_id if doc else None)

    appointment = models.Appointment(
        token_no=token_number,
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        branch_id=branch_id,
        department_id=dept_id,
        appointment_date=appt_dt,
        visit_type=req.visit_type or "Walk-in",
        consultation_type=req.consultation_type,
        purpose=req.purpose,
        status="Waiting",
        receptionist_id=current_user.id
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": appointment.id,
            "token_no": appointment.token_no,
            "token_number": appointment.token_no,
            "doctor_name": doc.full_name if doc else "Assigned Doctor",
            "department_name": dept.name if dept else "General",
            "status": appointment.status
        },
        message="Token issued successfully"
    )

@router.put("/{appointment_id}/status", response_model=schemas.ApiResponse)
def update_status(
    appointment_id: str,
    req: schemas.AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    a = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Appointment not found")

    a.status = req.status
    if req.status == "Cancelled":
        a.cancelled_by = current_user.id
        a.cancelled_at = datetime.utcnow()

    db.commit()
    return schemas.ApiResponse(success=True, message=f"Status updated to {req.status}")

@router.delete("/{appointment_id}", response_model=schemas.ApiResponse)
def cancel_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    a = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Appointment not found")

    a.status = "Cancelled"
    a.cancelled_by = current_user.id
    a.cancelled_at = datetime.utcnow()
    db.commit()
    return schemas.ApiResponse(success=True, message="Appointment cancelled")
