from typing import Optional, List, Any
from pydantic import BaseModel, Field

# Standard ApiResponse wrapper
class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None
    meta: Optional[Any] = None

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Patient Schemas
class PatientCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    phone: str
    alt_phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    age_years: Optional[int] = None
    gender: Optional[str] = "Female"
    blood_group: Optional[str] = None
    relative_name: Optional[str] = None
    relation_type: Optional[str] = "S/o"
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    consultation_type: Optional[str] = "Aesthetic"
    known_allergies: Optional[str] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    age_years: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    relative_name: Optional[str] = None
    relation_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    consultation_type: Optional[str] = None
    known_allergies: Optional[str] = None
    is_active: Optional[bool] = None

# Appointment Schemas
class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    department_id: Optional[str] = None
    appointment_date: Optional[str] = None
    visit_type: Optional[str] = "Walk-in"
    consultation_type: Optional[str] = None
    purpose: Optional[str] = None
    entry_department: Optional[str] = "Reception"
    room_no: Optional[str] = None
    priority: Optional[str] = "Normal"

class AppointmentStatusUpdate(BaseModel):
    status: str

# Consultation Schemas
class ConsultationCreate(BaseModel):
    appointment_id: Optional[str] = None
    patient_id: str
    doctor_id: str
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    pulse_rate: Optional[int] = None
    temperature_f: Optional[float] = None
    spo2_percent: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    known_conditions: Optional[str] = None
    chief_complaints: Optional[str] = None
    complaint_duration: Optional[str] = None
    skin_type: Optional[str] = None
    examination_notes: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    doctor_private_notes: Optional[str] = None
    review_after_days: Optional[int] = None
    review_date: Optional[str] = None
    review_instructions: Optional[str] = None
    is_draft: Optional[int] = 1

# Prescription Schemas
class RxItemSchema(BaseModel):
    medicine_id: Optional[str] = None
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing: Optional[str] = None
    duration_days: Optional[int] = 5
    quantity: Optional[int] = 10
    route: Optional[str] = "Oral"
    special_instructions: Optional[str] = None

class PrescriptionCreate(BaseModel):
    consultation_id: Optional[str] = None
    patient_id: str
    doctor_id: str
    general_advice: Optional[str] = None
    items: Optional[List[RxItemSchema]] = []

# Medicine Schemas
class MedicineCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    dosage_form: Optional[str] = "Tablet"
    strength: Optional[str] = None
    unit: Optional[str] = "Tab"
    default_dosage: Optional[str] = "1 Tab"
    default_frequency: Optional[str] = "1-0-1"
    default_timing: Optional[str] = "After Food"
    route: Optional[str] = "Oral"

# Billing Schemas
class BillItemCreate(BaseModel):
    item_type: Optional[str] = "Consultation"
    item_name: str
    item_code: Optional[str] = None
    quantity: Optional[float] = 1.0
    unit_price: float
    discount_amount: Optional[float] = 0.0
    cgst_percent: Optional[float] = 0.0
    sgst_percent: Optional[float] = 0.0
    line_total: Optional[float] = None

class PaymentSplit(BaseModel):
    payment_mode: str
    amount: float
    card_last4: Optional[str] = None
    upi_ref: Optional[str] = None

class BillCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    doctor_id: Optional[str] = None
    discount_remarks: Optional[str] = None
    items: List[BillItemCreate]
    payments: Optional[List[PaymentSplit]] = []

class RecordPaymentRequest(BaseModel):
    bill_id: str
    amount: float
    payment_mode: str
    card_last4: Optional[str] = None
    upi_ref: Optional[str] = None

# Package Schemas
class PackageCreate(BaseModel):
    code: Optional[str] = None
    name: str
    category: Optional[str] = "Aesthetic"
    total_sessions: int
    validity_months: Optional[int] = 12
    package_price: float
    cgst_percent: Optional[float] = 9.0
    sgst_percent: Optional[float] = 9.0
    description: Optional[str] = None

class PatientPackageEnroll(BaseModel):
    patient_id: str
    package_id: str
    amount_paid: Optional[float] = None
    bill_id: Optional[str] = None
    notes: Optional[str] = None

class SessionLogCreate(BaseModel):
    patient_package_id: str
    patient_id: str
    performed_by: Optional[str] = None
    doctor_id: Optional[str] = None
    room_no: Optional[str] = None
    device_used: Optional[str] = None
    energy_level: Optional[str] = None
    areas_treated: Optional[str] = None
    patient_feedback: Optional[str] = None
    adverse_reaction: Optional[str] = "None"
    next_session_date: Optional[str] = None
    notes: Optional[str] = None

# Staff Schemas
class StaffCreate(BaseModel):
    branch_id: Optional[str] = None
    department_id: Optional[str] = None
    username: str
    password: str
    full_name: str
    role: str
    doctor_reg_no: Optional[str] = None
    specialisation: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

# Department Schemas
class DepartmentCreate(BaseModel):
    branch_id: Optional[str] = None
    name: str
    code: str
    description: Optional[str] = None
