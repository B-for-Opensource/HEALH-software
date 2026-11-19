from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user, require_role, hash_password, resolve_branch_id

router = APIRouter(prefix="/api/staff", tags=["Staff & Doctors Master"])

@router.get("", response_model=schemas.ApiResponse)
def list_staff(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    query = db.query(models.Staff).filter(models.Staff.is_active == True)
    if role:
        query = query.filter(models.Staff.role == role)

    staff_list = query.order_by(models.Staff.full_name.asc()).all()
    results = []
    for s in staff_list:
        dept = db.query(models.Department).filter(models.Department.id == s.department_id).first()
        branch = db.query(models.Branch).filter(models.Branch.id == s.branch_id).first()
        results.append({
            "id": s.id,
            "full_name": s.full_name,
            "username": s.username,
            "role": s.role,
            "department_id": s.department_id,
            "department_name": dept.name if dept else None,
            "branch_id": s.branch_id,
            "branch_name": branch.name if branch else None,
            "doctor_reg_no": s.doctor_reg_no,
            "specialisation": s.specialisation,
            "phone": s.phone,
            "email": s.email,
            "is_active": s.is_active
        })

    return schemas.ApiResponse(success=True, data=results)

@router.get("/{staff_id}", response_model=schemas.ApiResponse)
def get_staff_member(
    staff_id: str,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    s = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Staff member not found")

    dept = db.query(models.Department).filter(models.Department.id == s.department_id).first()
    branch = db.query(models.Branch).filter(models.Branch.id == s.branch_id).first()

    return schemas.ApiResponse(
        success=True,
        data={
            "id": s.id,
            "full_name": s.full_name,
            "username": s.username,
            "role": s.role,
            "department_name": dept.name if dept else None,
            "branch_name": branch.name if branch else None,
            "doctor_reg_no": s.doctor_reg_no,
            "specialisation": s.specialisation,
            "phone": s.phone,
            "email": s.email,
            "is_active": s.is_active
        }
    )

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_staff(
    req: schemas.StaffCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(require_role(["Super Admin", "Branch Manager"]))
):
    existing = db.query(models.Staff).filter(models.Staff.username == req.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    branch_id = req.branch_id or resolve_branch_id(request, current_user)

    staff = models.Staff(
        branch_id=branch_id,
        department_id=req.department_id,
        username=req.username,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        doctor_reg_no=req.doctor_reg_no,
        specialisation=req.specialisation,
        phone=req.phone,
        email=req.email
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    return schemas.ApiResponse(success=True, data={"id": staff.id}, message="Staff member created successfully")

@router.put("/{staff_id}", response_model=schemas.ApiResponse)
def update_staff(
    staff_id: str,
    req: schemas.StaffCreate,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(require_role(["Super Admin", "Branch Manager"]))
):
    s = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if req.full_name: s.full_name = req.full_name
    if req.role: s.role = req.role
    if req.department_id: s.department_id = req.department_id
    if req.doctor_reg_no is not None: s.doctor_reg_no = req.doctor_reg_no
    if req.specialisation is not None: s.specialisation = req.specialisation
    if req.phone is not None: s.phone = req.phone
    if req.email is not None: s.email = req.email
    if req.password: s.password_hash = hash_password(req.password)

    db.commit()
    return schemas.ApiResponse(success=True, message="Staff member updated")
