from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
import models
import schemas
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/medicines", tags=["Medicines Master"])

@router.get("/search", response_model=schemas.ApiResponse)
def search_medicines(
    q: str = Query("", min_length=1),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    query = f"%{q.strip()}%"
    meds = db.query(models.Medicine).filter(
        models.Medicine.is_active == True,
        or_(
            models.Medicine.name.ilike(query),
            models.Medicine.generic_name.ilike(query),
            models.Medicine.brand_name.ilike(query)
        )
    ).order_by(models.Medicine.name.asc()).limit(30).all()

    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": m.id,
            "name": m.name,
            "generic_name": m.generic_name,
            "brand_name": m.brand_name,
            "dosage_form": m.dosage_form,
            "strength": m.strength,
            "unit": m.unit,
            "default_dosage": m.default_dosage,
            "default_frequency": m.default_frequency,
            "default_timing": m.default_timing,
            "route": m.route
        } for m in meds]
    )

@router.get("", response_model=schemas.ApiResponse)
def list_medicines(
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    meds = db.query(models.Medicine).filter(models.Medicine.is_active == True).order_by(models.Medicine.name.asc()).limit(200).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": m.id,
            "name": m.name,
            "generic_name": m.generic_name,
            "brand_name": m.brand_name,
            "dosage_form": m.dosage_form,
            "strength": m.strength,
            "unit": m.unit,
            "default_dosage": m.default_dosage,
            "default_frequency": m.default_frequency,
            "default_timing": m.default_timing,
            "route": m.route
        } for m in meds]
    )

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_medicine(
    req: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(require_role(["Super Admin", "Branch Manager", "Doctor"]))
):
    m = models.Medicine(
        name=req.name,
        generic_name=req.generic_name,
        brand_name=req.brand_name,
        dosage_form=req.dosage_form or "Tablet",
        strength=req.strength,
        unit=req.unit or "Tab",
        default_dosage=req.default_dosage or "1 Tab",
        default_frequency=req.default_frequency or "1-0-1",
        default_timing=req.default_timing or "After Food",
        route=req.route or "Oral"
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return schemas.ApiResponse(success=True, data={"id": m.id}, message="Medicine added successfully")
