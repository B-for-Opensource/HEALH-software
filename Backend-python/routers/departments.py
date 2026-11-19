from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user, require_role, resolve_branch_id

router = APIRouter(prefix="/api/departments", tags=["Departments Master"])

@router.get("", response_model=schemas.ApiResponse)
def list_departments(
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    depts = db.query(models.Department).filter(models.Department.is_active == True).order_by(models.Department.name.asc()).all()
    return schemas.ApiResponse(
        success=True,
        data=[{
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "description": d.description,
            "is_active": d.is_active
        } for d in depts]
    )

@router.post("", response_model=schemas.ApiResponse, status_code=201)
def create_department(
    req: schemas.DepartmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(require_role(["Super Admin", "Branch Manager"]))
):
    branch_id = req.branch_id or resolve_branch_id(request, current_user)
    dept = models.Department(
        branch_id=branch_id,
        name=req.name,
        code=req.code.upper(),
        description=req.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return schemas.ApiResponse(success=True, data={"id": dept.id}, message="Department created successfully")
