from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id, require_role

router = APIRouter(tags=["Aesthetic Treatment Packages"])

# Master Treatment Packages
@router.get("/api/packages", response_model=schemas.ApiResponse)
def list_packages(
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    packages = db.query(models.TreatmentPackage).filter(models.TreatmentPackage.is_active == True).order_by(models.TreatmentPackage.category.asc(), models.TreatmentPackage.name.asc()).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "category": p.category,
            "total_sessions": p.total_sessions,
            "validity_months": p.validity_months,
            "package_price": p.package_price,
            "cgst_percent": p.cgst_percent,
            "sgst_percent": p.sgst_percent,
            "description": p.description,
            "is_active": p.is_active
        } for p in packages]
    )

@router.get("/api/packages/{package_id}", response_model=schemas.ApiResponse)
def get_package(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    p = db.query(models.TreatmentPackage).filter(models.TreatmentPackage.id == package_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Treatment package not found")
    return schemas.ApiResponse(success=True, data=p.__dict__)

@router.post("/api/packages", response_model=schemas.ApiResponse, status_code=201)
def create_package(
    req: schemas.PackageCreate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(require_role(["Super Admin", "Branch Manager"]))
):
    code = req.code or f"PKG-{req.name[:3].upper()}-{req.total_sessions}S"
    p = models.TreatmentPackage(
        code=code,
        name=req.name,
        category=req.category or "Aesthetic",
        total_sessions=req.total_sessions,
        validity_months=req.validity_months or 12,
        package_price=req.package_price,
        cgst_percent=req.cgst_percent or 9.0,
        sgst_percent=req.sgst_percent or 9.0,
        description=req.description
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return schemas.ApiResponse(success=True, data={"id": p.id}, message="Treatment package created")

# Patient Packages Ledger
@router.get("/api/patient-packages", response_model=schemas.ApiResponse)
def list_patient_packages(
    patient_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    pps = db.query(models.PatientPackage).filter(models.PatientPackage.patient_id == patient_id).order_by(desc(models.PatientPackage.created_at)).all()
    results = []
    for pp in pps:
        tpl = db.query(models.TreatmentPackage).filter(models.TreatmentPackage.id == pp.package_id).first()
        results.append({
            "id": pp.id,
            "patient_id": pp.patient_id,
            "package_id": pp.package_id,
            "package_name": tpl.name if tpl else "Treatment Package",
            "category": tpl.category if tpl else "Aesthetic",
            "total_sessions": pp.total_sessions,
            "sessions_used": pp.sessions_used,
            "sessions_remaining": max(0, pp.total_sessions - pp.sessions_used),
            "amount_paid": pp.amount_paid or 0.0,
            "purchase_date": pp.purchase_date.isoformat() if pp.purchase_date else None,
            "expiry_date": pp.expiry_date.isoformat() if pp.expiry_date else None,
            "status": pp.status,
            "notes": pp.notes
        })
    return schemas.ApiResponse(success=True, data=results)

@router.post("/api/patient-packages", response_model=schemas.ApiResponse, status_code=201)
def enroll_patient_package(
    req: schemas.PatientPackageEnroll,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    tpl = db.query(models.TreatmentPackage).filter(models.TreatmentPackage.id == req.package_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Treatment package not found")

    branch_id = resolve_branch_id(request, current_user)
    validity = tpl.validity_months or 12
    # calculate expiry
    exp_year = date.today().year + (date.today().month + validity - 1) // 12
    exp_month = (date.today().month + validity - 1) % 12 + 1
    exp_day = min(date.today().day, 28)
    expiry = date(exp_year, exp_month, exp_day)

    pp = models.PatientPackage(
        patient_id=req.patient_id,
        package_id=req.package_id,
        sold_by=current_user.id,
        branch_id=branch_id,
        purchase_date=date.today(),
        expiry_date=expiry,
        total_sessions=tpl.total_sessions,
        sessions_used=0,
        amount_paid=req.amount_paid or tpl.package_price,
        bill_id=req.bill_id,
        status="Active",
        notes=req.notes
    )
    db.add(pp)
    db.commit()
    db.refresh(pp)

    return schemas.ApiResponse(success=True, data={"id": pp.id}, message="Package enrolled successfully")

@router.put("/api/patient-packages/{id}", response_model=schemas.ApiResponse)
def update_patient_package(
    id: str,
    status: str = Query(...),
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    pp = db.query(models.PatientPackage).filter(models.PatientPackage.id == id).first()
    if not pp:
        raise HTTPException(status_code=404, detail="Patient package not found")
    pp.status = status
    if notes:
        pp.notes = notes
    db.commit()
    return schemas.ApiResponse(success=True, message="Package updated")
