from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/patients", tags=["Patients"])

def generate_op_number(db: Session, branch_id: str) -> str:
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    prefix = branch.branch_code.upper() if branch and branch.branch_code else "HEAL"
    count = db.query(models.Patient).filter(models.Patient.branch_id == branch_id).count()
    return f"{prefix}-{str(count + 1).zfill(5)}"

@router.get("/search", response_model=schemas.ApiResponse)
def search_patients(
    q: str = Query("", min_length=1),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    query = f"%{q.strip()}%"
    patients = db.query(models.Patient).filter(
        models.Patient.is_active == True,
        or_(
            models.Patient.first_name.ilike(query),
            models.Patient.last_name.ilike(query),
            models.Patient.phone.like(query),
            models.Patient.op_no.ilike(query)
        )
    ).order_by(desc(models.Patient.created_at)).limit(25).all()

    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": p.id,
            "op_no": p.op_no,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "phone": p.phone,
            "alt_phone": p.alt_phone,
            "email": p.email,
            "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
            "gender": p.gender,
            "age_years": p.age_years,
            "blood_group": p.blood_group,
            "relative_name": p.relative_name,
            "relation_type": p.relation_type,
            "address": p.address,
            "city": p.city,
            "district": p.district,
            "pincode": p.pincode,
            "consultation_type": p.consultation_type,
            "known_allergies": p.known_allergies,
            "balance_advance": p.balance_advance
        } for p in patients]
    )

@router.get("", response_model=schemas.ApiResponse)
def list_patients(
    request: Request,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    base_query = db.query(models.Patient).filter(models.Patient.is_active == True)

    if current_user.role not in ["Super Admin"]:
        base_query = base_query.filter(models.Patient.branch_id == branch_id)

    if search:
        s = f"%{search.strip()}%"
        base_query = base_query.filter(
            or_(
                models.Patient.first_name.ilike(s),
                models.Patient.last_name.ilike(s),
                models.Patient.phone.like(s),
                models.Patient.op_no.ilike(s),
                models.Patient.city.ilike(s)
            )
        )

    total = base_query.count()
    offset = (page - 1) * limit
    patients = base_query.order_by(desc(models.Patient.created_at)).offset(offset).limit(limit).all()

    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": p.id,
            "op_no": p.op_no,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "phone": p.phone,
            "alt_phone": p.alt_phone,
            "email": p.email,
            "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
            "age_years": p.age_years,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "relative_name": p.relative_name,
            "relation_type": p.relation_type,
            "address": p.address,
            "city": p.city,
            "district": p.district,
            "pincode": p.pincode,
            "consultation_type": p.consultation_type,
            "known_allergies": p.known_allergies,
            "balance_advance": p.balance_advance,
            "created_at": p.created_at.isoformat() if p.created_at else None
        } for p in patients],
        meta={"total": total, "page": page, "limit": limit}
    )

@router.get("/{patient_id}", response_model=schemas.ApiResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return schemas.ApiResponse(
        success=True,
        data={
            "id": p.id,
            "op_no": p.op_no,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "phone": p.phone,
            "alt_phone": p.alt_phone,
            "email": p.email,
            "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
            "age_years": p.age_years,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "relative_name": p.relative_name,
            "relation_type": p.relation_type,
            "address": p.address,
            "city": p.city,
            "district": p.district,
            "pincode": p.pincode,
            "consultation_type": p.consultation_type,
            "known_allergies": p.known_allergies,
            "balance_advance": p.balance_advance,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
    )

@router.get("/{patient_id}/history", response_model=schemas.ApiResponse)
def get_patient_history(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    consults = db.query(models.Consultation).filter(models.Consultation.patient_id == patient_id).order_by(desc(models.Consultation.consult_date)).all()
    history = []
    for c in consults:
        doc = db.query(models.Staff).filter(models.Staff.id == c.doctor_id).first()
        history.append({
            "id": c.id,
            "date": c.consult_date.isoformat() if c.consult_date else None,
            "doctor_name": doc.full_name if doc else "Consultant",
            "diagnosis": c.diagnosis,
            "chief_complaints": c.chief_complaints,
            "treatment_plan": c.treatment_plan
        })
    return schemas.ApiResponse(success=True, data=history)

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_patient(
    req: schemas.PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    branch_id = resolve_branch_id(request, current_user)
    op_number = generate_op_number(db, branch_id)

    dob = None
    if req.date_of_birth:
        try:
            dob = datetime.strptime(req.date_of_birth, "%Y-%m-%d").date()
        except Exception:
            pass

    patient = models.Patient(
        branch_id=branch_id,
        op_no=op_number,
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        alt_phone=req.alt_phone,
        email=req.email,
        date_of_birth=dob,
        age_years=req.age_years,
        gender=req.gender or "Female",
        blood_group=req.blood_group,
        relative_name=req.relative_name,
        relation_type=req.relation_type or "S/o",
        address=req.address,
        city=req.city,
        district=req.district,
        pincode=req.pincode,
        consultation_type=req.consultation_type or "Aesthetic",
        known_allergies=req.known_allergies,
        created_by=current_user.id
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return schemas.ApiResponse(
        success=True,
        data={
            "id": patient.id,
            "op_no": patient.op_no,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone": patient.phone,
            "gender": patient.gender,
            "consultation_type": patient.consultation_type
        },
        message="Patient registered successfully"
    )

@router.put("/{patient_id}", response_model=schemas.ApiResponse)
def update_patient(
    patient_id: str,
    req: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    p = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    if req.first_name is not None: p.first_name = req.first_name
    if req.last_name is not None: p.last_name = req.last_name
    if req.phone is not None: p.phone = req.phone
    if req.alt_phone is not None: p.alt_phone = req.alt_phone
    if req.email is not None: p.email = req.email
    if req.date_of_birth is not None:
        try:
            p.date_of_birth = datetime.strptime(req.date_of_birth, "%Y-%m-%d").date() if req.date_of_birth else None
        except Exception:
            pass
    if req.age_years is not None: p.age_years = req.age_years
    if req.gender is not None: p.gender = req.gender
    if req.blood_group is not None: p.blood_group = req.blood_group
    if req.relative_name is not None: p.relative_name = req.relative_name
    if req.relation_type is not None: p.relation_type = req.relation_type
    if req.address is not None: p.address = req.address
    if req.city is not None: p.city = req.city
    if req.district is not None: p.district = req.district
    if req.pincode is not None: p.pincode = req.pincode
    if req.consultation_type is not None: p.consultation_type = req.consultation_type
    if req.known_allergies is not None: p.known_allergies = req.known_allergies
    if req.is_active is not None: p.is_active = req.is_active

    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return schemas.ApiResponse(
        success=True, 
        message="Patient profile updated successfully in master records",
        data={
            "id": p.id,
            "op_no": p.op_no,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "phone": p.phone
        }
    )
