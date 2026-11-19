from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user, resolve_branch_id

router = APIRouter(prefix="/api/sessions", tags=["Daycare Package Sessions"])

@router.get("", response_model=schemas.ApiResponse)
def list_sessions(
    patient_package_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    sessions = db.query(models.PackageSession).filter(
        models.PackageSession.patient_package_id == patient_package_id
    ).order_by(models.PackageSession.session_no.asc()).all()

    results = []
    for s in sessions:
        perf = db.query(models.Staff).filter(models.Staff.id == s.performed_by).first()
        doc = db.query(models.Staff).filter(models.Staff.id == s.doctor_id).first()
        results.append({
            "id": s.id,
            "session_no": s.session_no,
            "session_date": s.session_date.isoformat() if s.session_date else None,
            "performer_name": perf.full_name if perf else "Therapist",
            "doctor_name": doc.full_name if doc else None,
            "room_no": s.room_no,
            "device_used": s.device_used,
            "energy_level": s.energy_level,
            "areas_treated": s.areas_treated,
            "patient_feedback": s.patient_feedback,
            "adverse_reaction": s.adverse_reaction,
            "next_session_date": s.next_session_date.isoformat() if s.next_session_date else None,
            "notes": s.notes,
            "status": s.status
        })

    return schemas.ApiResponse(success=True, data=results)

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def log_session(
    req: schemas.SessionLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    pp = db.query(models.PatientPackage).filter(models.PatientPackage.id == req.patient_package_id).first()
    if not pp:
        raise HTTPException(status_code=404, detail="Patient package not found")

    if pp.sessions_used >= pp.total_sessions:
        raise HTTPException(status_code=400, detail="All sessions in this package are already completed")

    branch_id = resolve_branch_id(request, current_user)
    next_sno = pp.sessions_used + 1

    next_date = None
    if req.next_session_date:
        try:
            next_date = datetime.strptime(req.next_session_date, "%Y-%m-%d").date()
        except Exception:
            pass

    session = models.PackageSession(
        patient_package_id=pp.id,
        patient_id=req.patient_id,
        session_no=next_sno,
        session_date=date.today(),
        performed_by=req.performed_by or current_user.id,
        doctor_id=req.doctor_id,
        branch_id=branch_id,
        room_no=req.room_no,
        device_used=req.device_used,
        energy_level=req.energy_level,
        areas_treated=req.areas_treated,
        patient_feedback=req.patient_feedback,
        adverse_reaction=req.adverse_reaction or "None",
        next_session_date=next_date,
        status="Completed",
        notes=req.notes
    )
    db.add(session)

    # Increment sessions used
    pp.sessions_used = next_sno
    if pp.sessions_used >= pp.total_sessions:
        pp.status = "Completed"

    db.commit()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": session.id,
            "session_no": next_sno,
            "sessions_used": pp.sessions_used,
            "total_sessions": pp.total_sessions,
            "status": pp.status
        },
        message=f"Session #{next_sno} logged successfully"
    )
