from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/consultations", tags=["Clinical Consultations (EMR)"])

@router.get("", response_model=schemas.ApiResponse)
def get_consultations(
    appointment_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    if appointment_id:
        c = db.query(models.Consultation).filter(models.Consultation.appointment_id == appointment_id).order_by(desc(models.Consultation.created_at)).first()
        return schemas.ApiResponse(success=True, data=c.__dict__ if c else None)

    if patient_id:
        consults = db.query(models.Consultation).filter(models.Consultation.patient_id == patient_id).order_by(desc(models.Consultation.consult_date)).all()
        return schemas.ApiResponse(success=True, data=[c.__dict__ for c in consults])

    return schemas.ApiResponse(success=True, data=[])

@router.get("/{consultation_id}", response_model=schemas.ApiResponse)
def get_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    c = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation record not found")

    p = db.query(models.Patient).filter(models.Patient.id == c.patient_id).first()
    doc = db.query(models.Staff).filter(models.Staff.id == c.doctor_id).first()
    rx = db.query(models.Prescription).filter(models.Prescription.consultation_id == c.id).first()

    rx_data = None
    if rx:
        items = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.prescription_id == rx.id).all()
        rx_data = {
            "id": rx.id,
            "rx_date": rx.rx_date.isoformat() if rx.rx_date else None,
            "general_advice": rx.general_advice,
            "items": [it.__dict__ for it in items]
        }

    return schemas.ApiResponse(
        success=True,
        data={
            "id": c.id,
            "appointment_id": c.appointment_id,
            "patient_id": c.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "-",
            "doctor_name": doc.full_name if doc else "Doctor",
            "doctor_reg_no": doc.doctor_reg_no if doc else None,
            "consult_date": c.consult_date.isoformat() if c.consult_date else None,
            "bp_systolic": c.bp_systolic,
            "bp_diastolic": c.bp_diastolic,
            "pulse_rate": c.pulse_rate,
            "temperature_f": c.temperature_f,
            "spo2_percent": c.spo2_percent,
            "weight_kg": c.weight_kg,
            "height_cm": c.height_cm,
            "bmi": c.bmi,
            "known_conditions": c.known_conditions,
            "chief_complaints": c.chief_complaints,
            "complaint_duration": c.complaint_duration,
            "skin_type": c.skin_type,
            "examination_notes": c.examination_notes,
            "diagnosis": c.diagnosis,
            "treatment_plan": c.treatment_plan,
            "review_after_days": c.review_after_days,
            "review_date": c.review_date.isoformat() if c.review_date else None,
            "review_instructions": c.review_instructions,
            "is_draft": c.is_draft,
            "prescription": rx_data
        }
    )

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_consultation(
    req: schemas.ConsultationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    is_draft_bool = bool(req.is_draft)
    finalized_time = datetime.utcnow() if not is_draft_bool else None

    rdate = None
    if req.review_date:
        try:
            rdate = datetime.strptime(req.review_date, "%Y-%m-%d").date()
        except Exception:
            pass

    consultation = models.Consultation(
        appointment_id=req.appointment_id,
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        branch_id=branch_id,
        bp_systolic=req.bp_systolic,
        bp_diastolic=req.bp_diastolic,
        pulse_rate=req.pulse_rate,
        temperature_f=req.temperature_f,
        spo2_percent=req.spo2_percent,
        weight_kg=req.weight_kg,
        height_cm=req.height_cm,
        bmi=req.bmi,
        known_conditions=req.known_conditions,
        chief_complaints=req.chief_complaints,
        complaint_duration=req.complaint_duration,
        skin_type=req.skin_type,
        examination_notes=req.examination_notes,
        diagnosis=req.diagnosis,
        treatment_plan=req.treatment_plan,
        doctor_private_notes=req.doctor_private_notes,
        review_after_days=req.review_after_days,
        review_date=rdate,
        review_instructions=req.review_instructions,
        is_draft=is_draft_bool,
        finalized_at=finalized_time
    )
    db.add(consultation)

    if not is_draft_bool and req.appointment_id:
        appt = db.query(models.Appointment).filter(models.Appointment.id == req.appointment_id).first()
        if appt:
            appt.status = "Billing-Pending"

    db.commit()
    db.refresh(consultation)

    return schemas.ApiResponse(
        success=True,
        data={"id": consultation.id},
        message="Consultation saved successfully"
    )

@router.post("/{consultation_id}/finalize", response_model=schemas.ApiResponse)
def finalize_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    c = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")

    c.is_draft = False
    c.finalized_at = datetime.utcnow()

    if c.appointment_id:
        appt = db.query(models.Appointment).filter(models.Appointment.id == c.appointment_id).first()
        if appt:
            appt.status = "Billing-Pending"

    db.commit()
    return schemas.ApiResponse(success=True, message="Consultation finalized. Patient moved to billing.")

@router.put("/{consultation_id}", response_model=schemas.ApiResponse)
def update_consultation(
    consultation_id: str,
    req: schemas.ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    c = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if req.bp_systolic is not None: c.bp_systolic = req.bp_systolic
    if req.bp_diastolic is not None: c.bp_diastolic = req.bp_diastolic
    if req.pulse_rate is not None: c.pulse_rate = req.pulse_rate
    if req.temperature_f is not None: c.temperature_f = req.temperature_f
    if req.spo2_percent is not None: c.spo2_percent = req.spo2_percent
    if req.weight_kg is not None: c.weight_kg = req.weight_kg
    if req.height_cm is not None: c.height_cm = req.height_cm
    if req.bmi is not None: c.bmi = req.bmi
    if req.chief_complaints is not None: c.chief_complaints = req.chief_complaints
    if req.examination_notes is not None: c.examination_notes = req.examination_notes
    if req.diagnosis is not None: c.diagnosis = req.diagnosis
    if req.treatment_plan is not None: c.treatment_plan = req.treatment_plan

    db.commit()
    return schemas.ApiResponse(success=True, message="Consultation updated")
