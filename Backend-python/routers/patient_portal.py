import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from config import settings
import models
import schemas
from auth import create_access_token, get_current_patient, log_audit

router = APIRouter(prefix="/api/patient-portal", tags=["Patient Web Portal"])

@router.post("/request-otp", response_model=schemas.ApiResponse)
def request_patient_otp(payload: dict = Body(...), db: Session = Depends(get_db)):
    phone = (payload.get("phone") or "").strip()
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Valid 10-digit phone number is required")

    patient = db.query(models.Patient).filter(models.Patient.phone == phone, models.Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="No patient record linked to this phone number")

    otp_code = f"{random.randint(100000, 999999)}"
    db.add(models.PatientOTP(
        phone=phone,
        otp_code=otp_code,
        patient_id=patient.id,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    ))
    db.commit()

    resp_data = {"phone": phone, "expires_in_seconds": 600}
    if settings.APP_ENV == "development":
        resp_data["dev_otp"] = otp_code  # Local dev convenience only
    return schemas.ApiResponse(success=True, message="OTP sent", data=resp_data)

@router.post("/verify-otp", response_model=schemas.ApiResponse)
def verify_patient_otp(payload: dict = Body(...), db: Session = Depends(get_db)):
    phone = (payload.get("phone") or "").strip()
    otp = (payload.get("otp") or "").strip()
    row = db.query(models.PatientOTP).filter(
        models.PatientOTP.phone == phone,
        models.PatientOTP.otp_code == otp,
        models.PatientOTP.is_used == False,
    ).order_by(desc(models.PatientOTP.created_at)).first()

    if not row or row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    row.is_used = True
    patient = db.query(models.Patient).filter(models.Patient.id == row.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    token = create_access_token({
        "id": patient.id,
        "subject_type": "PATIENT",
        "op_no": patient.op_no,
        "organisation_id": patient.organisation_id or "org-heal-001",
    })
    log_audit(db, action="PATIENT_PORTAL_LOGIN", entity_type="Patient", entity_id=patient.id, entity_ref=patient.op_no, source_app="PATIENT_PORTAL")
    db.commit()
    return schemas.ApiResponse(
        success=True,
        data={
            "token": token,
            "patient": {
                "id": patient.id, "op_no": patient.op_no,
                "first_name": patient.first_name, "last_name": patient.last_name,
                "phone": patient.phone, "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                "gender": patient.gender, "blood_group": patient.blood_group,
            }
        }
    )

@router.get("/me", response_model=schemas.ApiResponse)
def get_patient_profile(patient: models.Patient = Depends(get_current_patient)):
    return schemas.ApiResponse(
        success=True,
        data={
            "id": patient.id, "op_no": patient.op_no,
            "first_name": patient.first_name, "last_name": patient.last_name,
            "phone": patient.phone, "email": patient.email,
            "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "age_years": patient.age_years, "gender": patient.gender, "blood_group": patient.blood_group,
            "address": patient.address, "city": patient.city, "known_allergies": patient.known_allergies,
        }
    )

@router.get("/timeline", response_model=schemas.ApiResponse)
def get_patient_timeline(patient: models.Patient = Depends(get_current_patient), db: Session = Depends(get_db)):
    encounters = db.query(models.Encounter).filter(models.Encounter.patient_id == patient.id).order_by(desc(models.Encounter.created_at)).all()
    consultations = db.query(models.Consultation).filter(models.Consultation.patient_id == patient.id, models.Consultation.is_draft == False).order_by(desc(models.Consultation.consult_date)).all()
    prescriptions = db.query(models.Prescription).filter(models.Prescription.patient_id == patient.id).order_by(desc(models.Prescription.created_at)).all()
    # ONLY RELEASED lab orders and VERIFIED imaging reports are exposed!
    lab_orders = db.query(models.LabOrder).filter(models.LabOrder.patient_id == patient.id, models.LabOrder.status == "RELEASED").order_by(desc(models.LabOrder.released_at)).all()
    imaging_orders = db.query(models.ImagingOrder).filter(models.ImagingOrder.patient_id == patient.id, models.ImagingOrder.status == "VERIFIED").order_by(desc(models.ImagingOrder.verified_at)).all()
    procedures = db.query(models.NursingProcedureOrder).filter(models.NursingProcedureOrder.patient_id == patient.id, models.NursingProcedureOrder.status == "COMPLETED").order_by(desc(models.NursingProcedureOrder.completed_at)).all()
    bills = db.query(models.Bill).filter(models.Bill.patient_id == patient.id, models.Bill.status == "Active").order_by(desc(models.Bill.created_at)).all()

    rx_list = []
    for rx in prescriptions:
        items = db.query(models.PrescriptionItem).filter(models.PrescriptionItem.prescription_id == rx.id).all()
        rx_list.append({
            "id": rx.id, "rx_date": rx.rx_date.isoformat() if rx.rx_date else None,
            "status": rx.status, "general_advice": rx.general_advice,
            "items": [{"medicine_name": it.medicine_name, "dosage": it.dosage, "frequency": it.frequency, "duration_days": it.duration_days, "quantity": it.quantity} for it in items],
        })

    lab_list = []
    for lo in lab_orders:
        results = db.query(models.LabResult).filter(models.LabResult.lab_order_id == lo.id).all()
        lab_list.append({
            "id": lo.id, "order_no": lo.order_no,
            "released_at": lo.released_at.isoformat() if lo.released_at else None,
            "results": [{"parameter_name": r.parameter_name, "observed_value": r.observed_value, "unit": r.unit, "reference_range": r.reference_range, "is_abnormal": r.is_abnormal, "report_file_url": r.report_file_url} for r in results],
        })

    return schemas.ApiResponse(
        success=True,
        data={
            "encounters": [{"id": e.id, "encounter_no": e.encounter_no, "encounter_type": e.encounter_type, "status": e.status, "started_at": e.started_at.isoformat() if e.started_at else None} for e in encounters],
            "consultations": [{"id": c.id, "consult_date": c.consult_date.isoformat() if c.consult_date else None, "diagnosis": c.diagnosis, "treatment_plan": c.treatment_plan} for c in consultations],
            "prescriptions": rx_list,
            "lab_reports": lab_list,
            "imaging_reports": [{"id": io.id, "order_no": io.order_no, "modality": io.modality, "service_name": io.service_name, "radiologist_findings": io.radiologist_findings, "report_file_url": io.report_file_url, "verified_at": io.verified_at.isoformat() if io.verified_at else None} for io in imaging_orders],
            "procedures": [{"id": pr.id, "procedure_name": pr.procedure_name, "completed_at": pr.completed_at.isoformat() if pr.completed_at else None} for pr in procedures],
            "bills": [{"id": b.id, "bill_no": b.bill_no, "department_scope": b.department_scope, "net_amount": b.net_amount, "amount_paid": b.amount_paid, "balance_due": b.balance_due, "payment_status": b.payment_status, "bill_date": b.bill_date.isoformat() if b.bill_date else None} for b in bills],
        }
    )
