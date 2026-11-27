import hashlib
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from config import settings
from database import get_db
import models

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> models.Staff:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required."
        )
    payload = decode_token(auth.credentials)
    user_id = payload.get("id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid: subject missing."
        )
    user = db.query(models.Staff).filter(models.Staff.id == user_id, models.Staff.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated."
        )
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: models.Staff = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{current_user.role}'."
            )
        return current_user
    return role_checker

def resolve_org_id(current_user: models.Staff) -> str:
    return getattr(current_user, "organisation_id", None) or "org-heal-001"

def resolve_branch_id(request: Request, current_user: models.Staff) -> str:
    header_branch = request.headers.get("X-Branch-Id")
    if header_branch and header_branch != "all" and current_user.role in ["Super Admin", "Branch Manager"]:
        return header_branch
    return current_user.branch_id or "krn-branch-001"

def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def create_refresh_token(db: Session, staff_id: str, expires_days: int = 14) -> str:
    raw = uuid.uuid4().hex + uuid.uuid4().hex
    rt = models.RefreshToken(
        staff_id=staff_id,
        token_hash=hash_token(raw),
        expires_at=datetime.utcnow() + timedelta(days=expires_days),
    )
    db.add(rt)
    db.commit()
    return raw

def get_current_patient(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> models.Patient:
    if not auth or not auth.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Patient authentication required.")
    payload = decode_token(auth.credentials)
    if payload.get("subject_type") != "PATIENT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid patient token.")
    patient_id = payload.get("id") or payload.get("sub")
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id, models.Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Patient record not found.")
    return patient

def log_audit(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    entity_ref: Optional[str] = None,
    user: Optional[models.Staff] = None,
    organisation_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    source_app: str = "BACKEND",
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
    correlation_id: Optional[str] = None,
):
    entry = models.AuditLog(
        organisation_id=organisation_id or (getattr(user, "organisation_id", None) if user else "org-heal-001"),
        user_id=user.id if user else None,
        user_name=user.full_name if user else "System",
        actor_role=user.role if user else "System",
        branch_id=branch_id or (user.branch_id if user else None),
        source_app=source_app,
        correlation_id=correlation_id or uuid.uuid4().hex[:16],
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_ref=entity_ref,
        old_values=json.dumps(old_values, default=str) if old_values else None,
        new_values=json.dumps(new_values, default=str) if new_values else None,
        ip_address=ip_address,
        remarks=remarks,
    )
    db.add(entry)

def emit_outbox_event(
    db: Session,
    *,
    event_type: str,
    payload: dict,
    organisation_id: Optional[str] = "org-heal-001",
    branch_id: Optional[str] = None,
    target_role: Optional[str] = None,
    notify_title: Optional[str] = None,
    notify_message: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
):
    evt = models.OutboxEvent(
        organisation_id=organisation_id,
        branch_id=branch_id,
        event_type=event_type,
        correlation_id=uuid.uuid4().hex[:16],
        payload_json=json.dumps(payload, default=str),
        status="PROCESSED",
        processed_at=datetime.utcnow(),
    )
    db.add(evt)
    if notify_title and notify_message:
        notif = models.Notification(
            organisation_id=organisation_id,
            branch_id=branch_id,
            target_role=target_role,
            title=notify_title,
            message=notify_message,
            resource_type=resource_type,
            resource_id=resource_id,
        )
        db.add(notif)
