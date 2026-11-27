from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import (
    verify_password, hash_password, create_access_token, get_current_user,
    create_refresh_token, hash_token, log_audit
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.ApiResponse)
def login(req: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.Staff).filter(models.Staff.username == req.username, models.Staff.is_active == True).first()
    if not user or not verify_password(req.password, user.password_hash):
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        log_audit(
            db, action="LOGIN_FAILED", entity_type="Staff", entity_ref=req.username,
            user=user, remarks="Invalid credentials", ip_address=request.client.host if request.client else None
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    user.failed_login_attempts = 0
    branch = db.query(models.Branch).filter(models.Branch.id == user.branch_id).first()
    branch_name = branch.name if branch else "HEAL Clinic"
    org_id = getattr(user, "organisation_id", None) or "org-heal-001"

    token_data = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "organisation_id": org_id,
        "branch_id": user.branch_id,
        "branch_name": branch_name
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(db, user.id)
    log_audit(
        db, action="LOGIN_SUCCESS", entity_type="Staff", entity_id=user.id, entity_ref=user.username,
        user=user, organisation_id=org_id, branch_id=user.branch_id,
        ip_address=request.client.host if request.client else None
    )
    db.commit()

    return schemas.ApiResponse(
        success=True,
        data={
            "token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role,
                "organisation_id": org_id,
                "branch_id": user.branch_id,
                "branch_name": branch_name
            }
        }
    )

@router.post("/refresh", response_model=schemas.ApiResponse)
def refresh_access_token(payload: dict = Body(...), db: Session = Depends(get_db)):
    raw_rt = payload.get("refresh_token", "")
    if not raw_rt:
        raise HTTPException(status_code=400, detail="refresh_token required")
    rt_row = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == hash_token(raw_rt),
        models.RefreshToken.is_revoked == False
    ).first()
    if not rt_row or rt_row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token invalid or expired")

    user = db.query(models.Staff).filter(models.Staff.id == rt_row.staff_id, models.Staff.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User inactive")

    rt_row.is_revoked = True
    branch = db.query(models.Branch).filter(models.Branch.id == user.branch_id).first()
    org_id = getattr(user, "organisation_id", None) or "org-heal-001"
    new_access = create_access_token({
        "id": user.id, "username": user.username, "full_name": user.full_name,
        "role": user.role, "organisation_id": org_id, "branch_id": user.branch_id,
        "branch_name": branch.name if branch else "HEAL Clinic"
    })
    new_refresh = create_refresh_token(db, user.id)
    db.commit()
    return schemas.ApiResponse(success=True, data={"token": new_access, "refresh_token": new_refresh})

@router.post("/logout", response_model=schemas.ApiResponse)
def logout(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    raw_rt = payload.get("refresh_token")
    if raw_rt:
        rt_row = db.query(models.RefreshToken).filter(models.RefreshToken.token_hash == hash_token(raw_rt)).first()
        if rt_row:
            rt_row.is_revoked = True
            db.commit()
    return schemas.ApiResponse(success=True, message="Logged out")

@router.get("/me", response_model=schemas.ApiResponse)
def get_me(current_user: models.Staff = Depends(get_current_user), db: Session = Depends(get_db)):
    branch = db.query(models.Branch).filter(models.Branch.id == current_user.branch_id).first()
    branch_name = branch.name if branch else "HEAL Clinic"
    return schemas.ApiResponse(
        success=True,
        data={
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "branch_id": current_user.branch_id,
            "branch_name": branch_name,
            "doctor_reg_no": current_user.doctor_reg_no,
            "phone": current_user.phone,
            "email": current_user.email
        }
    )

@router.post("/change-password", response_model=schemas.ApiResponse)
def change_password(
    req: schemas.ChangePasswordRequest,
    current_user: models.Staff = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return schemas.ApiResponse(success=True, message="Password updated successfully")
