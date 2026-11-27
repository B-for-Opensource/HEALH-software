from datetime import datetime, date
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id, resolve_org_id, log_audit, emit_outbox_event
from realtime import ws_manager

router = APIRouter(prefix="/api/encounters", tags=["Encounters & Pipeline"])

def next_encounter_no(db: Session) -> str:
    count = db.query(models.Encounter).count()
    return f"ENC-{str(count + 1001).zfill(5)}"

def calc_age_from_dob(dob: Optional[date]) -> Optional[int]:
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

@router.get("/pipeline/summary", response_model=schemas.ApiResponse)
def get_pipeline_summary(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)

    enc_q = db.query(models.Encounter).filter(models.Encounter.organisation_id == org_id)
    if current_user.role != "Super Admin":
        enc_q = enc_q.filter(models.Encounter.branch_id == branch_id)
    encounters = enc_q.order_by(desc(models.Encounter.created_at)).limit(200).all()

    appts_q = db.query(models.Appointment)
    if current_user.role != "Super Admin":
        appts_q = appts_q.filter(models.Appointment.branch_id == branch_id)
    appts = appts_q.all()

    lab_q = db.query(models.LabOrder).filter(models.LabOrder.organisation_id == org_id)
    img_q = db.query(models.ImagingOrder).filter(models.ImagingOrder.organisation_id == org_id)
    rx_q = db.query(models.Prescription).filter(models.Prescription.organisation_id == org_id)
    proc_q = db.query(models.NursingProcedureOrder).filter(models.NursingProcedureOrder.organisation_id == org_id)
    charges_q = db.query(models.PendingCharge).filter(models.PendingCharge.status == "UNBILLED")

    if current_user.role != "Super Admin":
        lab_q = lab_q.filter(models.LabOrder.branch_id == branch_id)
        img_q = img_q.filter(models.ImagingOrder.branch_id == branch_id)
        proc_q = proc_q.filter(models.NursingProcedureOrder.branch_id == branch_id)
        charges_q = charges_q.filter(models.PendingCharge.branch_id == branch_id)

    # Returned with verified/released results for Doctors
    returned_items = []
    for lo in lab_q.filter(models.LabOrder.status.in_(["VERIFIED", "RELEASED"])).order_by(desc(models.LabOrder.verified_at)).limit(20).all():
        p = db.query(models.Patient).filter(models.Patient.id == lo.patient_id).first()
        returned_items.append({
            "type": "LAB",
            "order_id": lo.id,
            "order_no": lo.order_no,
            "encounter_id": lo.encounter_id,
            "patient_id": lo.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "department": "Laboratory",
            "status": lo.status,
            "verified_at": lo.verified_at.isoformat() if lo.verified_at else None,
        })
    for io in img_q.filter(models.ImagingOrder.status.in_(["REPORT_READY", "VERIFIED"])).order_by(desc(models.ImagingOrder.completed_at)).limit(20).all():
        p = db.query(models.Patient).filter(models.Patient.id == io.patient_id).first()
        returned_items.append({
            "type": "IMAGING",
            "order_id": io.id,
            "order_no": io.order_no,
            "encounter_id": io.encounter_id,
            "patient_id": io.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "department": f"Imaging ({io.modality})",
            "investigation": io.service_name,
            "status": io.status,
            "verified_at": (io.verified_at or io.completed_at).isoformat() if (io.verified_at or io.completed_at) else None,
        })

    return schemas.ApiResponse(
        success=True,
        data={
            "counts": {
                "reception_waiting": sum(1 for e in encounters if e.status == "WAITING" and e.entry_source == "RECEPTION"),
                "nurse_waiting": sum(1 for a in appts if a.status in ["Waiting", "With-Nurse", "Nurse-Station"]),
                "doctor_waiting": sum(1 for a in appts if a.status in ["Ready-For-Doctor", "Called", "In-Consult"]),
                "pharmacy_pending": rx_q.filter(models.Prescription.status.in_(["NEW", "PROCESSING", "PARTIAL"])).count(),
                "lab_pending": lab_q.filter(models.LabOrder.status.in_(["ORDERED", "SAMPLE_PENDING", "SAMPLE_COLLECTED", "PROCESSING", "RESULT_DRAFT"])).count(),
                "imaging_pending": img_q.filter(models.ImagingOrder.status.in_(["ORDERED", "SCHEDULED", "IN_PROGRESS"])).count(),
                "nursing_procedures": proc_q.filter(models.NursingProcedureOrder.status.in_(["ORDERED", "IN_PROGRESS"])).count(),
                "unbilled_charges": charges_q.count(),
                "returned_with_results": len(returned_items),
                "completed_encounters": sum(1 for e in encounters if e.status == "COMPLETED"),
            },
            "returned_with_results": returned_items,
        }
    )

@router.get("", response_model=schemas.ApiResponse)
def list_encounters(
    request: Request,
    status: Optional[str] = None,
    encounter_type: Optional[str] = None,
    patient_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    org_id = resolve_org_id(current_user)
    q = db.query(models.Encounter).filter(models.Encounter.organisation_id == org_id)
    if current_user.role != "Super Admin":
        q = q.filter(models.Encounter.branch_id == branch_id)
    if status:
        q = q.filter(models.Encounter.status == status)
    if encounter_type:
        q = q.filter(models.Encounter.encounter_type == encounter_type)
    if patient_id:
        q = q.filter(models.Encounter.patient_id == patient_id)

    rows = q.order_by(desc(models.Encounter.created_at)).limit(100).all()
    result = []
    for e in rows:
        p = db.query(models.Patient).filter(models.Patient.id == e.patient_id).first()
        result.append({
            "id": e.id,
            "encounter_no": e.encounter_no,
            "patient_id": e.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Patient",
            "op_no": p.op_no if p else "",
            "date_of_birth": p.date_of_birth.isoformat() if p and p.date_of_birth else None,
            "age_years": calc_age_from_dob(p.date_of_birth) if p and p.date_of_birth else (p.age_years if p else None),
            "encounter_type": e.encounter_type,
            "entry_source": e.entry_source,
            "status": e.status,
            "branch_id": e.branch_id,
            "doctor_id": e.doctor_id,
            "started_at": e.started_at.isoformat() if e.started_at else None,
            "completed_at": e.completed_at.isoformat() if e.completed_at else None,
        })
    return schemas.ApiResponse(success=True, data=result)

@router.post("", response_model=schemas.ApiResponse)
def create_encounter(
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

    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    enc = models.Encounter(
        encounter_no=next_encounter_no(db),
        organisation_id=org_id,
        branch_id=branch_id,
        patient_id=patient_id,
        appointment_id=payload.get("appointment_id"),
        encounter_type=payload.get("encounter_type", "CONSULTATION"),
        entry_source=payload.get("entry_source", "RECEPTION"),
        status=payload.get("status", "WAITING"),
        doctor_id=payload.get("doctor_id"),
        created_by=current_user.id,
    )
    db.add(enc)
    db.flush()

    emit_outbox_event(
        db,
        event_type="EncounterCreated",
        payload={"encounter_id": enc.id, "encounter_no": enc.encounter_no, "patient_id": patient_id, "type": enc.encounter_type},
        organisation_id=org_id,
        branch_id=branch_id,
        target_role="Nurse" if enc.encounter_type == "CONSULTATION" else None,
        notify_title="New Patient Encounter",
        notify_message=f"{patient.first_name} ({patient.op_no}) queued under {enc.encounter_type}",
        resource_type="Encounter",
        resource_id=enc.id,
    )
    log_audit(db, action="CREATE", entity_type="Encounter", entity_id=enc.id, entity_ref=enc.encounter_no, user=current_user, branch_id=branch_id)
    db.commit()
    ws_manager.broadcast_sync("EncounterCreated", {"encounter_id": enc.id, "encounter_no": enc.encounter_no, "branch_id": branch_id})

    return schemas.ApiResponse(success=True, data={"id": enc.id, "encounter_no": enc.encounter_no, "status": enc.status})

@router.post("/{encounter_id}/nursing-assessment", response_model=schemas.ApiResponse)
def save_nursing_assessment(
    encounter_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    enc = db.query(models.Encounter).filter(models.Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")
    patient = db.query(models.Patient).filter(models.Patient.id == enc.patient_id).first()

    weight = payload.get("weight_kg")
    height = payload.get("height_cm")
    bmi = payload.get("bmi")
    if weight and height and float(height) > 0:
        h_m = float(height) / 100.0
        bmi = round(float(weight) / (h_m * h_m), 1)

    age_years = calc_age_from_dob(patient.date_of_birth) if patient and patient.date_of_birth else payload.get("age_years")
    if patient and payload.get("blood_group"):
        patient.blood_group = payload.get("blood_group")
    if patient and age_years is not None:
        patient.age_years = age_years

    assess = models.NursingAssessment(
        organisation_id=enc.organisation_id,
        branch_id=enc.branch_id,
        encounter_id=enc.id,
        patient_id=enc.patient_id,
        nurse_id=current_user.id,
        age_years=age_years,
        weight_kg=weight,
        height_cm=height,
        bmi=bmi,
        blood_group=payload.get("blood_group"),
        bp_systolic=payload.get("bp_systolic"),
        bp_diastolic=payload.get("bp_diastolic"),
        pulse_rate=payload.get("pulse_rate"),
        temperature_f=payload.get("temperature_f"),
        spo2_percent=payload.get("spo2_percent"),
        respiratory_rate=payload.get("respiratory_rate"),
        notes=payload.get("notes"),
        next_action=payload.get("next_action", "PASS_TO_DOCTOR"),
    )
    db.add(assess)
    enc.nurse_id = current_user.id
    if payload.get("doctor_id"):
        enc.doctor_id = payload.get("doctor_id")
    enc.status = "WAITING" if assess.next_action == "PASS_TO_DOCTOR" else "IN_PROGRESS"

    if enc.appointment_id:
        appt = db.query(models.Appointment).filter(models.Appointment.id == enc.appointment_id).first()
        if appt:
            appt.status = "Ready-For-Doctor" if assess.next_action == "PASS_TO_DOCTOR" else appt.status

    emit_outbox_event(
        db,
        event_type="NursingAssessmentCompleted",
        payload={"encounter_id": enc.id, "patient_id": enc.patient_id, "bmi": bmi},
        organisation_id=enc.organisation_id,
        branch_id=enc.branch_id,
        target_role="Doctor",
        notify_title="Patient Ready for Doctor",
        notify_message=f"Vitals & BMI ({bmi or '-'}) recorded for {patient.first_name if patient else 'Patient'}",
        resource_type="Encounter",
        resource_id=enc.id,
    )
    log_audit(db, action="CREATE", entity_type="NursingAssessment", entity_id=assess.id, entity_ref=enc.encounter_no, user=current_user, branch_id=enc.branch_id)
    db.commit()
    ws_manager.broadcast_sync("NursingAssessmentCompleted", {"encounter_id": enc.id, "branch_id": enc.branch_id})

    return schemas.ApiResponse(success=True, data={"id": assess.id, "bmi": bmi, "age_years": age_years})

@router.post("/{encounter_id}/doctor-orders", response_model=schemas.ApiResponse)
def create_multi_department_orders(
    encounter_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    """
    Allows a Doctor to create simultaneous independent orders in one consultation:
    - prescription_items -> Prescription (Pharmacy)
    - lab_tests -> LabOrder (Laboratory)
    - imaging_orders -> ImagingOrder (X-Ray / MRI / CT / USG)
    - nursing_procedures -> NursingProcedureOrder (Nursing)
    """
    enc = db.query(models.Encounter).filter(models.Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")

    created_summary = {"prescription_id": None, "lab_order_id": None, "imaging_order_ids": [], "nursing_procedure_ids": []}

    # 1. Pharmacy Prescription
    rx_items = payload.get("prescription_items") or []
    if rx_items:
        rx = models.Prescription(
            organisation_id=enc.organisation_id,
            branch_id=enc.branch_id,
            encounter_id=enc.id,
            consultation_id=payload.get("consultation_id"),
            patient_id=enc.patient_id,
            doctor_id=current_user.id,
            status="NEW",
            general_advice=payload.get("general_advice"),
        )
        db.add(rx)
        db.flush()
        for idx, item in enumerate(rx_items):
            db.add(models.PrescriptionItem(
                prescription_id=rx.id,
                medicine_id=item.get("medicine_id"),
                medicine_name=item.get("medicine_name", "Medicine"),
                generic_name=item.get("generic_name"),
                dosage_form=item.get("dosage_form", "Tablet"),
                dosage=item.get("dosage"),
                frequency=item.get("frequency"),
                timing=item.get("timing"),
                duration_days=int(item.get("duration_days") or 5),
                quantity=int(item.get("quantity") or 1),
                unit=item.get("unit", "Tab"),
                special_instructions=item.get("special_instructions"),
                sort_order=idx,
            ))
        created_summary["prescription_id"] = rx.id
        emit_outbox_event(
            db, event_type="PharmacyOrderReceived", payload={"prescription_id": rx.id, "encounter_id": enc.id},
            organisation_id=enc.organisation_id, branch_id=enc.branch_id, target_role="Pharmacist",
            notify_title="New Prescription", notify_message=f"Rx sent for encounter {enc.encounter_no}",
            resource_type="Prescription", resource_id=rx.id
        )

    # 2. Lab Order
    lab_tests = payload.get("lab_tests") or []
    if lab_tests:
        lo_count = db.query(models.LabOrder).count()
        lo = models.LabOrder(
            order_no=f"LAB-{str(lo_count + 1001).zfill(5)}",
            organisation_id=enc.organisation_id,
            branch_id=enc.branch_id,
            encounter_id=enc.id,
            patient_id=enc.patient_id,
            ordered_by_doctor_id=current_user.id,
            is_direct_entry=False,
            status="ORDERED",
            clinical_notes=payload.get("lab_notes"),
        )
        db.add(lo)
        db.flush()
        for t in lab_tests:
            db.add(models.LabOrderItem(
                lab_order_id=lo.id,
                service_id=t.get("service_id"),
                test_name=t.get("test_name", "Lab Investigation"),
                sample_type=t.get("sample_type", "Blood / Serum"),
                price=float(t.get("price") or 0.0),
                gst_percent=float(t.get("gst_percent") or 0.0),
            ))
        created_summary["lab_order_id"] = lo.id
        emit_outbox_event(
            db, event_type="LabOrderCreated", payload={"lab_order_id": lo.id, "encounter_id": enc.id},
            organisation_id=enc.organisation_id, branch_id=enc.branch_id, target_role="Lab Technician",
            notify_title="New Lab Order", notify_message=f"{lo.order_no} ({len(lab_tests)} tests)",
            resource_type="LabOrder", resource_id=lo.id
        )

    # 3. Imaging Orders (X-Ray, MRI, CT Scan, Ultrasound)
    img_orders = payload.get("imaging_orders") or []
    for im in img_orders:
        io_count = db.query(models.ImagingOrder).count()
        io = models.ImagingOrder(
            order_no=f"IMG-{str(io_count + 1001).zfill(5)}",
            organisation_id=enc.organisation_id,
            branch_id=enc.branch_id,
            encounter_id=enc.id,
            patient_id=enc.patient_id,
            ordered_by_doctor_id=current_user.id,
            service_id=im.get("service_id"),
            modality=im.get("modality", "X-Ray"),
            service_name=im.get("service_name", "X-Ray Imaging"),
            room_equipment=im.get("room_equipment"),
            status="ORDERED",
            technician_notes=im.get("notes"),
            price=float(im.get("price") or 0.0),
            gst_percent=float(im.get("gst_percent") or 0.0),
        )
        db.add(io)
        db.flush()
        created_summary["imaging_order_ids"].append(io.id)
        emit_outbox_event(
            db, event_type="ImagingOrderCreated", payload={"imaging_order_id": io.id, "modality": io.modality},
            organisation_id=enc.organisation_id, branch_id=enc.branch_id, target_role="Radiologist",
            notify_title=f"New {io.modality} Order", notify_message=f"{io.order_no}: {io.service_name}",
            resource_type="ImagingOrder", resource_id=io.id
        )

    # 4. Nursing Procedure Orders
    proc_orders = payload.get("nursing_procedures") or []
    for pr in proc_orders:
        po = models.NursingProcedureOrder(
            organisation_id=enc.organisation_id,
            branch_id=enc.branch_id,
            encounter_id=enc.id,
            patient_id=enc.patient_id,
            ordered_by_doctor_id=current_user.id,
            procedure_name=pr.get("procedure_name", "Nursing Procedure"),
            is_direct_entry=False,
            status="ORDERED",
            notes=pr.get("notes"),
            price=float(pr.get("price") or 0.0),
        )
        db.add(po)
        db.flush()
        created_summary["nursing_procedure_ids"].append(po.id)

    enc.status = "REFERRED" if (rx_items or lab_tests or img_orders or proc_orders) else "IN_PROGRESS"
    log_audit(db, action="CREATE_ORDERS", entity_type="Encounter", entity_id=enc.id, entity_ref=enc.encounter_no, user=current_user, branch_id=enc.branch_id, new_values=created_summary)
    db.commit()
    ws_manager.broadcast_sync("DoctorOrdersCreated", {"encounter_id": enc.id, **created_summary})

    return schemas.ApiResponse(success=True, data=created_summary)

@router.post("/{encounter_id}/close", response_model=schemas.ApiResponse)
def close_encounter(
    encounter_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    enc = db.query(models.Encounter).filter(models.Encounter.id == encounter_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encounter not found")
    enc.status = "COMPLETED"
    enc.completed_at = datetime.utcnow()
    log_audit(db, action="COMPLETE", entity_type="Encounter", entity_id=enc.id, entity_ref=enc.encounter_no, user=current_user, branch_id=enc.branch_id)
    db.commit()
    ws_manager.broadcast_sync("EncounterCompleted", {"encounter_id": enc.id})
    return schemas.ApiResponse(success=True, data={"id": enc.id, "status": enc.status})
