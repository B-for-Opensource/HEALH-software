from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.ApiResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Staff).filter(models.Staff.username == req.username, models.Staff.is_active == True).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    branch = db.query(models.Branch).filter(models.Branch.id == user.branch_id).first()
    branch_name = branch.name if branch else "HEAL Clinic"

    token_data = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "branch_id": user.branch_id,
        "branch_name": branch_name
    }
    access_token = create_access_token(token_data)

    return schemas.ApiResponse(
        success=True,
        data={
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role,
                "branch_id": user.branch_id,
                "branch_name": branch_name
            }
        }
    )

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
