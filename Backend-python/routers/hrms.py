from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/hrms", tags=["HRMS - Human Resource Management"])

# -------------------- DASHBOARD --------------------
@router.get("/dashboard/stats")
def get_hrms_dashboard_stats(
    branch_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    today = date.today()
    
    # Employees count
    emp_query = db.query(models.Staff).filter(models.Staff.is_active == True)
    if branch_id:
        emp_query = emp_query.filter(models.Staff.branch_id == branch_id)
    total_employees = emp_query.count()

    # Branches
    branches = db.query(models.Branch).all()

    # Today's attendance
    att_query = db.query(models.Attendance).filter(models.Attendance.date == today)
    if branch_id:
        att_query = att_query.filter(models.Attendance.branch_id == branch_id)
    today_attendances = att_query.all()
    present_count = sum(1 for a in today_attendances if a.status in ['Present', 'Late'])
    late_count = sum(1 for a in today_attendances if a.status == 'Late')

    # Pending leaves
    leave_query = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == 'Pending')
    if branch_id:
        leave_query = leave_query.filter(models.LeaveRequest.branch_id == branch_id)
    pending_leaves = leave_query.count()

    # Credential warnings (expiring within 30 days or expired)
    creds = db.query(models.MedicalCredential).all()
    expiring_soon_count = 0
    for c in creds:
        if c.expiry_date:
            days = (c.expiry_date - today).days
            if days <= 30:
                expiring_soon_count += 1

    # Branch distribution stats
    branch_distribution = []
    for b in branches:
        count = db.query(models.Staff).filter(models.Staff.branch_id == b.id, models.Staff.is_active == True).count()
        branch_distribution.append({
            'branch_id': b.id,
            'name': b.name,
            'code': b.branch_code,
            'employee_count': count
        })

    # Recent leaves
    recent_leaves = db.query(models.LeaveRequest).order_by(desc(models.LeaveRequest.id)).limit(5).all()
    recent_leaves_data = []
    for l in recent_leaves:
        emp = db.query(models.Staff).filter(models.Staff.id == l.employee_id).first()
        recent_leaves_data.append({
            'id': l.id,
            'employee_id': l.employee_id,
            'employee_name': emp.full_name if emp else 'Unknown Staff',
            'leave_type': l.leave_type,
            'start_date': l.start_date.isoformat() if l.start_date else None,
            'end_date': l.end_date.isoformat() if l.end_date else None,
            'total_days': l.total_days,
            'status': l.status
        })

    # Today's shifts
    shifts_today = db.query(models.ShiftRoster).filter(models.ShiftRoster.shift_date == today)
    if branch_id:
        shifts_today = shifts_today.filter(models.ShiftRoster.branch_id == branch_id)
    today_rosters = shifts_today.limit(6).all()
    today_rosters_data = []
    for s in today_rosters:
        emp = db.query(models.Staff).filter(models.Staff.id == s.employee_id).first()
        today_rosters_data.append({
            'id': s.id,
            'employee_name': emp.full_name if emp else 'Staff',
            'shift_name': s.shift_name,
            'start_time': s.start_time,
            'end_time': s.end_time,
            'is_on_call': s.is_on_call
        })

    return schemas.ApiResponse(
        success=True,
        data={
            'total_employees': total_employees,
            'present_today': present_count,
            'late_today': late_count,
            'attendance_rate': round((present_count / total_employees * 100), 1) if total_employees else 0,
            'pending_leaves': pending_leaves,
            'expiring_credentials': expiring_soon_count,
            'branches_count': len(branches),
            'branch_distribution': branch_distribution,
            'recent_leaves': recent_leaves_data,
            'today_rosters': today_rosters_data
        }
    )

# -------------------- BRANCHES & DEPARTMENTS --------------------
@router.get("/branches")
def list_hrms_branches(db: Session = Depends(get_db)):
    branches = db.query(models.Branch).all()
    results = []
    for b in branches:
        emp_count = db.query(models.Staff).filter(models.Staff.branch_id == b.id, models.Staff.is_active == True).count()
        results.append({
            'id': b.id,
            'name': b.name,
            'code': b.branch_code,
            'address': b.address,
            'city': b.city,
            'phone': b.phone,
            'email': b.email,
            'is_active': b.is_active,
            'employee_count': emp_count
        })
    return schemas.ApiResponse(success=True, data=results)

@router.get("/departments")
def list_hrms_departments(db: Session = Depends(get_db)):
    depts = db.query(models.Department).all()
    results = []
    for d in depts:
        count = db.query(models.Staff).filter(models.Staff.department_id == d.id).count()
        results.append({
            'id': d.id,
            'name': d.name,
            'code': d.code,
            'description': d.description,
            'employee_count': count
        })
    return schemas.ApiResponse(success=True, data=results)

@router.get("/designations")
def list_hrms_designations(db: Session = Depends(get_db)):
    desigs = db.query(models.Designation).all()
    results = [{'id': d.id, 'title': d.title, 'category': d.category} for d in desigs]
    return schemas.ApiResponse(success=True, data=results)

# -------------------- EMPLOYEES --------------------
@router.get("/employees")
def list_hrms_employees(
    branch_id: Optional[str] = None,
    department_id: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Staff)
    if branch_id:
        query = query.filter(models.Staff.branch_id == branch_id)
    if department_id:
        query = query.filter(models.Staff.department_id == department_id)
    if role:
        query = query.filter(models.Staff.role == role)

    staff_list = query.order_by(models.Staff.full_name.asc()).all()
    results = []
    for s in staff_list:
        dept = db.query(models.Department).filter(models.Department.id == s.department_id).first()
        branch = db.query(models.Branch).filter(models.Branch.id == s.branch_id).first()
        creds_count = db.query(models.MedicalCredential).filter(models.MedicalCredential.employee_id == s.id).count()
        results.append({
            'id': s.id,
            'emp_code': s.username.upper(),
            'full_name': s.full_name,
            'email': s.email,
            'phone': s.phone,
            'role': s.role,
            'branch_id': s.branch_id,
            'branch_name': branch.name if branch else 'HQ',
            'department_id': s.department_id,
            'department_name': dept.name if dept else 'Clinical',
            'doctor_reg_no': s.doctor_reg_no,
            'specialisation': s.specialisation,
            'status': 'Active' if s.is_active else 'Inactive',
            'credentials_count': creds_count
        })
    return schemas.ApiResponse(success=True, data=results)

# -------------------- ATTENDANCE & PUNCH --------------------
@router.get("/attendance")
def list_hrms_attendance(
    branch_id: Optional[str] = None,
    att_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_date = date.fromisoformat(att_date) if att_date else date.today()
    query = db.query(models.Attendance).filter(models.Attendance.date == target_date)
    if branch_id:
        query = query.filter(models.Attendance.branch_id == branch_id)

    records = query.all()
    results = []
    for r in records:
        emp = db.query(models.Staff).filter(models.Staff.id == r.employee_id).first()
        results.append({
            'id': r.id,
            'employee_id': r.employee_id,
            'employee_name': emp.full_name if emp else 'Staff',
            'emp_code': emp.username.upper() if emp else '',
            'branch_id': r.branch_id,
            'date': r.date.isoformat(),
            'punch_in': r.punch_in.strftime('%I:%M %p') if r.punch_in else None,
            'punch_out': r.punch_out.strftime('%I:%M %p') if r.punch_out else None,
            'work_hours': r.work_hours,
            'status': r.status,
            'method': r.method,
            'ip_or_location': r.ip_or_location
        })
    return schemas.ApiResponse(success=True, data=results)

@router.post("/attendance/punch")
def punch_attendance(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    emp_id = payload.get('employee_id', current_user.id)
    emp = db.query(models.Staff).filter(models.Staff.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = date.today()
    now = datetime.utcnow()
    att = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date == today
    ).first()

    if not att:
        # Punch In
        att = models.Attendance(
            employee_id=emp.id,
            branch_id=emp.branch_id or "krn-branch-001",
            date=today,
            punch_in=now,
            status="Present",
            method="Web Punch",
            ip_or_location="HEAL Terminal"
        )
        db.add(att)
        db.commit()
        return schemas.ApiResponse(success=True, message=f"Punch In recorded at {now.strftime('%I:%M %p')}")
    else:
        # Punch Out
        att.punch_out = now
        delta = (now - att.punch_in).total_seconds() / 3600.0 if att.punch_in else 8.0
        att.work_hours = round(max(0.5, delta), 2)
        db.commit()
        return schemas.ApiResponse(success=True, message=f"Punch Out recorded at {now.strftime('%I:%M %p')} ({att.work_hours} hrs)")

# -------------------- SHIFTS & ROTA --------------------
@router.get("/rosters")
def list_hrms_rosters(
    branch_id: Optional[str] = None,
    shift_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.ShiftRoster)
    if branch_id:
        query = query.filter(models.ShiftRoster.branch_id == branch_id)
    if shift_date:
        query = query.filter(models.ShiftRoster.shift_date == date.fromisoformat(shift_date))

    rosters = query.order_by(models.ShiftRoster.shift_date.desc()).limit(100).all()
    results = []
    for r in rosters:
        emp = db.query(models.Staff).filter(models.Staff.id == r.employee_id).first()
        results.append({
            'id': r.id,
            'employee_id': r.employee_id,
            'employee_name': emp.full_name if emp else 'Staff',
            'role': emp.role if emp else 'Staff',
            'branch_id': r.branch_id,
            'shift_date': r.shift_date.isoformat(),
            'shift_name': r.shift_name,
            'start_time': r.start_time,
            'end_time': r.end_time,
            'is_on_call': r.is_on_call,
            'notes': r.notes
        })
    return schemas.ApiResponse(success=True, data=results)

# -------------------- LEAVES --------------------
@router.get("/leaves")
def list_hrms_leaves(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.LeaveRequest)
    if branch_id:
        query = query.filter(models.LeaveRequest.branch_id == branch_id)
    if status:
        query = query.filter(models.LeaveRequest.status == status)

    leaves = query.order_by(models.LeaveRequest.applied_at.desc()).all()
    results = []
    for l in leaves:
        emp = db.query(models.Staff).filter(models.Staff.id == l.employee_id).first()
        sub = db.query(models.Staff).filter(models.Staff.id == l.substitute_doctor_id).first() if l.substitute_doctor_id else None
        results.append({
            'id': l.id,
            'employee_id': l.employee_id,
            'employee_name': emp.full_name if emp else 'Staff',
            'leave_type': l.leave_type,
            'start_date': l.start_date.isoformat(),
            'end_date': l.end_date.isoformat(),
            'total_days': l.total_days,
            'reason': l.reason,
            'substitute_doctor_id': l.substitute_doctor_id,
            'substitute_doctor_name': sub.full_name if sub else None,
            'status': l.status,
            'applied_at': l.applied_at.strftime('%Y-%m-%d %H:%M') if l.applied_at else None,
            'approved_by': l.approved_by,
            'reviewer_comment': l.reviewer_comment
        })
    return schemas.ApiResponse(success=True, data=results)

@router.post("/leaves/{leave_id}/review")
def review_hrms_leave(
    leave_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: models.Staff = Depends(get_current_user)
):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    new_status = payload.get('status', 'Approved')
    leave.status = new_status
    leave.approved_by = current_user.full_name
    leave.reviewer_comment = payload.get('review_notes', '')
    db.commit()
    return schemas.ApiResponse(success=True, message=f"Leave request {new_status.lower()}")

# -------------------- PAYROLL --------------------
@router.get("/payroll/runs")
def list_payroll_runs(db: Session = Depends(get_db)):
    runs = db.query(models.PayrollRun).order_by(models.PayrollRun.processed_date.desc()).all()
    results = []
    for r in runs:
        items_count = db.query(models.PayrollItem).filter(models.PayrollItem.payroll_run_id == r.id).count()
        results.append({
            'id': r.id,
            'period_label': r.period_label,
            'branch_id': r.branch_id,
            'start_date': r.start_date.isoformat(),
            'end_date': r.end_date.isoformat(),
            'total_gross': r.total_gross,
            'total_net': r.total_net,
            'status': r.status,
            'items_count': items_count,
            'processed_date': r.processed_date.strftime('%Y-%m-%d')
        })
    return schemas.ApiResponse(success=True, data=results)

# -------------------- MEDICAL CREDENTIALS --------------------
@router.get("/credentials")
def list_medical_credentials(db: Session = Depends(get_db)):
    creds = db.query(models.MedicalCredential).all()
    today = date.today()
    results = []
    for c in creds:
        emp = db.query(models.Staff).filter(models.Staff.id == c.employee_id).first()
        days_to_expiry = (c.expiry_date - today).days if c.expiry_date else 999
        computed_status = 'Expired' if days_to_expiry < 0 else ('Expiring Soon' if days_to_expiry <= 30 else 'Valid')
        results.append({
            'id': c.id,
            'employee_id': c.employee_id,
            'employee_name': emp.full_name if emp else 'Unknown Doctor',
            'license_type': c.license_type,
            'license_number': c.license_number,
            'issuing_authority': c.issuing_authority,
            'issue_date': c.issue_date.isoformat() if c.issue_date else None,
            'expiry_date': c.expiry_date.isoformat() if c.expiry_date else None,
            'days_to_expiry': days_to_expiry,
            'status': computed_status,
            'document_name': c.document_name
        })
    return schemas.ApiResponse(success=True, data=results)

# -------------------- RECRUITMENT --------------------
@router.get("/recruitment/jobs")
def list_recruitment_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.JobRequisition).all()
    results = []
    for j in jobs:
        dept = db.query(models.Department).filter(models.Department.id == j.department_id).first()
        app_count = db.query(models.JobApplicant).filter(models.JobApplicant.requisition_id == j.id).count()
        results.append({
            'id': j.id,
            'title': j.title,
            'department_name': dept.name if dept else 'Clinical',
            'vacancies': j.vacancies,
            'status': j.status,
            'salary_range': j.salary_range,
            'applicant_count': app_count
        })
    return schemas.ApiResponse(success=True, data=results)

@router.get("/recruitment/applicants")
def list_recruitment_applicants(db: Session = Depends(get_db)):
    applicants = db.query(models.JobApplicant).all()
    results = []
    for a in applicants:
        job = db.query(models.JobRequisition).filter(models.JobRequisition.id == a.requisition_id).first()
        results.append({
            'id': a.id,
            'requisition_id': a.requisition_id,
            'job_title': job.title if job else 'Position',
            'full_name': a.full_name,
            'email': a.email,
            'phone': a.phone,
            'stage': a.stage,
            'experience_years': a.experience_years,
            'applied_date': a.applied_date.isoformat() if a.applied_date else None
        })
    return schemas.ApiResponse(success=True, data=results)
