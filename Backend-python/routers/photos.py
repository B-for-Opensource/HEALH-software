import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from config import settings
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/photos", tags=["Patient Clinical Photos"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.get("", response_model=schemas.ApiResponse)
def list_photos(
    patient_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    photos = db.query(models.PatientPhoto).filter(
        models.PatientPhoto.patient_id == patient_id
    ).order_by(desc(models.PatientPhoto.taken_at)).all()

    results = []
    for ph in photos:
        taker = db.query(models.Staff).filter(models.Staff.id == ph.taken_by).first()
        results.append({
            "id": ph.id,
            "patient_id": ph.patient_id,
            "package_session_id": ph.package_session_id,
            "photo_type": ph.photo_type,
            "photo_url": ph.photo_url,
            "consent_obtained": ph.consent_obtained,
            "taken_at": ph.taken_at.isoformat() if ph.taken_at else None,
            "taken_by_name": taker.full_name if taker else "Staff",
            "notes": ph.notes
        })

    return schemas.ApiResponse(success=True, data=results)

@router.post("", response_model=schemas.ApiResponse, status_code=201)
async def upload_photo(
    patient_id: str = Form(...),
    photo_type: str = Form("Before"),
    package_session_id: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    ext = os.path.splitext(photo.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Allowed formats: JPG, PNG, WebP"
        )

    file_id = uuid.uuid4().hex
    filename = f"{patient_id}_{file_id}{ext}"
    dest_path = settings.UPLOAD_DIR / filename

    content = await photo.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    with open(dest_path, "wb") as f:
        f.write(content)

    photo_url = f"/uploads/photos/{filename}"

    p = models.PatientPhoto(
        patient_id=patient_id,
        package_session_id=package_session_id,
        photo_type=photo_type,
        photo_url=photo_url,
        consent_obtained=True,
        taken_by=current_user.id,
        notes=notes
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    return schemas.ApiResponse(
        success=True,
        data={"id": p.id, "photo_url": photo_url},
        message="Photo uploaded successfully"
    )
