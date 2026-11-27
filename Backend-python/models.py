import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime, Time, Text, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from database import Base

def gen_id():
    return uuid.uuid4().hex

class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(String(32), primary_key=True, default=gen_id)
    name = Column(String(150), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    subscription_plan = Column(String(40), default="Enterprise")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    name = Column(String(100), nullable=False)
    branch_code = Column(String(10), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(50), default="Calicut")
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    name = Column(String(100), nullable=False)
    code = Column(String(10), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Staff(Base):
    __tablename__ = "staff"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(30), nullable=False)  # Super Admin, Branch Manager, Doctor, Receptionist, Cashier, Therapist, Nurse, Lab Technician, Radiologist, Pharmacist
    doctor_reg_no = Column(String(50), nullable=True)
    specialisation = Column(String(100), nullable=True)
    phone = Column(String(15), nullable=True)
    email = Column(String(100), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    op_no = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(15), nullable=True)
    alt_phone = Column(String(15), nullable=True)
    email = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    age_years = Column(Integer, nullable=True)
    gender = Column(String(10), default="Female")  # Male, Female, Other
    blood_group = Column(String(5), nullable=True)
    relative_name = Column(String(100), nullable=True)
    relation_type = Column(String(10), default="S/o")
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    pincode = Column(String(6), nullable=True)
    consultation_type = Column(String(30), default="Aesthetic")
    known_allergies = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    balance_advance = Column(Float, default=0.0)
    created_source = Column(String(30), default="RECEPTION")  # RECEPTION, NURSING, PHARMACY, LAB
    merged_into_patient_id = Column(String(32), nullable=True)
    merge_reason = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(String(32), ForeignKey("staff.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PatientMergeLog(Base):
    __tablename__ = "patient_merge_logs"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    surviving_patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    merged_patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    reason = Column(Text, nullable=False)
    merged_by = Column(String(32), ForeignKey("staff.id"), nullable=False)
    snapshot_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String(32), primary_key=True, default=gen_id)
    encounter_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(String(32), nullable=True)
    encounter_type = Column(String(30), default="CONSULTATION")  # CONSULTATION, DIRECT_PHARMACY, DIRECT_LAB, DIRECT_NURSING, IMAGING
    entry_source = Column(String(30), default="RECEPTION")  # RECEPTION, NURSING, PHARMACY, LAB, IMAGING
    status = Column(String(30), default="WAITING")  # CREATED, WAITING, IN_PROGRESS, ON_HOLD, REFERRED, RETURNED, COMPLETED, CANCELLED
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    nurse_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(String(32), ForeignKey("staff.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=True)
    token_no = Column(Integer, nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=True)
    appointment_date = Column(DateTime, default=datetime.utcnow)
    visit_type = Column(String(20), default="Walk-in")
    consultation_type = Column(String(30), nullable=True)
    purpose = Column(Text, nullable=True)
    status = Column(String(30), default="Waiting")  # Waiting, With-Nurse, Ready-For-Doctor, Called, In-Consult, Procedure, Billing-Pending, Completed, Cancelled
    token_printed = Column(Boolean, default=False)
    receptionist_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    cancelled_by = Column(String(32), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=True)
    appointment_id = Column(String(32), ForeignKey("appointments.id"), nullable=True)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=False)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    consult_date = Column(DateTime, default=datetime.utcnow)
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    pulse_rate = Column(Integer, nullable=True)
    temperature_f = Column(Float, nullable=True)
    spo2_percent = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    known_conditions = Column(Text, nullable=True)
    chief_complaints = Column(Text, nullable=True)
    complaint_duration = Column(String(50), nullable=True)
    skin_type = Column(String(20), nullable=True)
    examination_notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    doctor_private_notes = Column(Text, nullable=True)
    review_after_days = Column(Integer, nullable=True)
    review_date = Column(Date, nullable=True)
    review_instructions = Column(Text, nullable=True)
    is_draft = Column(Boolean, default=True)
    finalized_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    brand_name = Column(String(200), nullable=True)
    dosage_form = Column(String(50), default="Tablet")
    strength = Column(String(50), nullable=True)
    unit = Column(String(20), default="Tab")
    default_dosage = Column(String(20), default="1 Tab")
    default_frequency = Column(String(20), default="1-0-1")
    default_timing = Column(String(30), default="After Food")
    route = Column(String(20), default="Oral")
    hsn_code = Column(String(20), nullable=True)
    gst_percent = Column(Float, default=12.0)
    is_schedule_h1 = Column(Boolean, default=False)
    mrp = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=True)
    consultation_id = Column(String(32), ForeignKey("consultations.id"), nullable=True)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=False)
    rx_date = Column(Date, default=date.today)
    status = Column(String(20), default="NEW")  # NEW, PROCESSING, PARTIAL, DISPENSED, CANCELLED
    general_advice = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(String(32), primary_key=True, default=gen_id)
    prescription_id = Column(String(32), ForeignKey("prescriptions.id"), nullable=False)
    medicine_id = Column(String(32), ForeignKey("medicines.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    dosage_form = Column(String(50), default="Tablet")
    dosage = Column(String(30), nullable=True)
    frequency = Column(String(20), nullable=True)
    timing = Column(String(30), nullable=True)
    duration_days = Column(Integer, default=5)
    quantity = Column(Integer, default=10)
    dispensed_qty = Column(Integer, default=0)
    unit = Column(String(20), default="Tab")
    route = Column(String(20), default="Oral")
    special_instructions = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

class TreatmentPackage(Base):
    __tablename__ = "treatment_packages"

    id = Column(String(32), primary_key=True, default=gen_id)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), default="Aesthetic")
    total_sessions = Column(Integer, nullable=False)
    validity_months = Column(Integer, default=12)
    package_price = Column(Float, nullable=False)
    cgst_percent = Column(Float, default=9.0)
    sgst_percent = Column(Float, default=9.0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PatientPackage(Base):
    __tablename__ = "patient_packages"

    id = Column(String(32), primary_key=True, default=gen_id)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    package_id = Column(String(32), ForeignKey("treatment_packages.id"), nullable=False)
    sold_by = Column(String(32), ForeignKey("staff.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    purchase_date = Column(Date, default=date.today)
    expiry_date = Column(Date, nullable=True)
    total_sessions = Column(Integer, nullable=False)
    sessions_used = Column(Integer, default=0)
    amount_paid = Column(Float, nullable=True)
    bill_id = Column(String(32), nullable=True)
    status = Column(String(20), default="Active")  # Active, Completed, Expired, Cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PackageSession(Base):
    __tablename__ = "package_sessions"

    id = Column(String(32), primary_key=True, default=gen_id)
    patient_package_id = Column(String(32), ForeignKey("patient_packages.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    session_no = Column(Integer, nullable=False)
    session_date = Column(Date, default=date.today)
    performed_by = Column(String(32), ForeignKey("staff.id"), nullable=True)
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    room_no = Column(String(20), nullable=True)
    device_used = Column(String(100), nullable=True)
    energy_level = Column(String(50), nullable=True)
    areas_treated = Column(Text, nullable=True)
    patient_feedback = Column(Text, nullable=True)
    adverse_reaction = Column(Text, default="None")
    next_session_date = Column(Date, nullable=True)
    status = Column(String(20), default="Completed")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PatientPhoto(Base):
    __tablename__ = "patient_photos"

    id = Column(String(32), primary_key=True, default=gen_id)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    package_session_id = Column(String(32), nullable=True)
    photo_type = Column(String(20), default="Before")  # Before, Mid, After, Progress
    photo_url = Column(Text, nullable=False)
    consent_obtained = Column(Boolean, default=True)
    taken_by = Column(String(32), ForeignKey("staff.id"), nullable=True)
    taken_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

class Bill(Base):
    __tablename__ = "bills"

    id = Column(String(32), primary_key=True, default=gen_id)
    bill_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=True)
    department_scope = Column(String(20), default="CLINIC")  # CLINIC, PHARMACY
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    consultation_id = Column(String(32), ForeignKey("consultations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    cashier_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    discount_remarks = Column(Text, nullable=True)
    taxable_amount = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    advance_applied = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    payment_status = Column(String(20), default="Unpaid")  # Unpaid, Partial, Paid, Refunded
    bill_date = Column(Date, default=date.today)
    status = Column(String(20), default="Active")  # Active, Cancelled, Voided
    cancel_reason = Column(Text, nullable=True)
    cancelled_by = Column(String(32), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(String(32), primary_key=True, default=gen_id)
    bill_id = Column(String(32), ForeignKey("bills.id"), nullable=False)
    item_type = Column(String(30), default="Consultation")  # Consultation, Procedure, Medicine, Package, Retail
    item_name = Column(String(200), nullable=False)
    item_code = Column(String(50), nullable=True)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    taxable_amount = Column(Float, default=0.0)
    cgst_percent = Column(Float, default=0.0)
    sgst_percent = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    line_total = Column(Float, nullable=False)
    sort_order = Column(Integer, default=0)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(32), primary_key=True, default=gen_id)
    bill_id = Column(String(32), ForeignKey("bills.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    cashier_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    payment_date = Column(Date, default=date.today)
    payment_time = Column(Time, default=datetime.utcnow().time)
    payment_mode = Column(String(20), default="Cash")  # Cash, Card, UPI, Advance
    card_last4 = Column(String(4), nullable=True)
    upi_ref = Column(String(50), nullable=True)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(32), primary_key=True, default=gen_id)
    event_time = Column(DateTime, default=datetime.utcnow)
    organisation_id = Column(String(32), nullable=True)
    user_id = Column(String(32), nullable=True)
    user_name = Column(String(150), nullable=True)
    actor_role = Column(String(50), nullable=True)
    branch_id = Column(String(32), nullable=True)
    source_app = Column(String(30), nullable=True)
    correlation_id = Column(String(64), nullable=True)
    terminal_id = Column(String(100), nullable=True)
    action = Column(String(30), nullable=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(32), nullable=True)
    entity_ref = Column(String(50), nullable=True)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    remarks = Column(Text, nullable=True)

# -------------------- HRMS MODELS --------------------
class Designation(Base):
    __tablename__ = "designations"

    id = Column(String(32), primary_key=True, default=gen_id)
    title = Column(String(100), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=True)
    category = Column(String(50), default="Clinical")  # Clinical, Administrative, Support
    created_at = Column(DateTime, default=datetime.utcnow)

class MedicalCredential(Base):
    __tablename__ = "medical_credentials"

    id = Column(String(32), primary_key=True, default=gen_id)
    employee_id = Column(String(32), nullable=False)
    license_type = Column(String(100), nullable=False)  # Medical Council, MOH / DHA, Cosmetology Board, BLS/ACLS
    license_number = Column(String(100), nullable=False)
    issuing_authority = Column(String(150), nullable=False)
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(String(30), default="Valid")  # Valid, Expiring Soon, Expired
    document_name = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String(32), primary_key=True, default=gen_id)
    employee_id = Column(String(32), nullable=False)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    punch_in = Column(DateTime, nullable=True)
    punch_out = Column(DateTime, nullable=True)
    work_hours = Column(Float, default=0.0)
    status = Column(String(30), default="Present")  # Present, Late, Half Day, Absent, On Leave
    method = Column(String(30), default="Web Punch")  # Web Punch, Biometric, Geo Tagged
    ip_or_location = Column(String(100), default="Clinic Terminal")
    created_at = Column(DateTime, default=datetime.utcnow)

class ShiftRoster(Base):
    __tablename__ = "shift_rosters"

    id = Column(String(32), primary_key=True, default=gen_id)
    employee_id = Column(String(32), nullable=False)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    shift_date = Column(Date, nullable=False)
    shift_name = Column(String(80), nullable=False)
    start_time = Column(String(20), default="08:00 AM")
    end_time = Column(String(20), default="04:00 PM")
    is_on_call = Column(Boolean, default=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String(32), primary_key=True, default=gen_id)
    employee_id = Column(String(32), nullable=False)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    leave_type = Column(String(50), nullable=False)  # Casual, Sick, Annual, Emergency, CME Conference
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    substitute_doctor_id = Column(String(32), nullable=True)
    status = Column(String(30), default="Pending")  # Pending, Approved, Rejected
    applied_at = Column(DateTime, default=datetime.utcnow)
    approved_by = Column(String(100), nullable=True)
    reviewer_comment = Column(String(255), nullable=True)

class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id = Column(String(32), primary_key=True, default=gen_id)
    period_label = Column(String(50), nullable=False)  # e.g. "November 2026"
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_gross = Column(Float, default=0.0)
    total_net = Column(Float, default=0.0)
    status = Column(String(30), default="Processed")  # Draft, Processed, Approved, Paid
    processed_date = Column(DateTime, default=datetime.utcnow)

class PayrollItem(Base):
    __tablename__ = "payroll_items"

    id = Column(String(32), primary_key=True, default=gen_id)
    payroll_run_id = Column(String(32), ForeignKey("payroll_runs.id"), nullable=False)
    employee_id = Column(String(32), nullable=False)
    base_salary = Column(Float, default=0.0)
    aesthetic_commission = Column(Float, default=0.0)
    consultation_fees = Column(Float, default=0.0)
    overtime_allowance = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_payout = Column(Float, default=0.0)
    status = Column(String(30), default="Paid")

class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id = Column(String(32), primary_key=True, default=gen_id)
    title = Column(String(120), nullable=False)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=False)
    vacancies = Column(Integer, default=1)
    status = Column(String(30), default="Open")  # Open, On Hold, Closed
    salary_range = Column(String(80), default="$4,000 - $6,500")
    requirements = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class JobApplicant(Base):
    __tablename__ = "job_applicants"

    id = Column(String(32), primary_key=True, default=gen_id)
    requisition_id = Column(String(32), ForeignKey("job_requisitions.id"), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    stage = Column(String(40), default="Screening")  # Screening, Clinical Interview, Practical Trial, Offer, Hired, Rejected
    experience_years = Column(Float, default=2.0)
    applied_date = Column(Date, default=date.today)
    notes = Column(Text, nullable=True)

class HolidayCalendar(Base):
    __tablename__ = "holiday_calendars"

    id = Column(String(32), primary_key=True, default=gen_id)
    title = Column(String(120), nullable=False)
    date = Column(Date, nullable=False)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    holiday_type = Column(String(50), default="National Holiday")
    is_org_wide = Column(Boolean, default=True)
    affects_payroll = Column(Boolean, default=True)

class EmployeeTransfer(Base):
    __tablename__ = "employee_transfers"

    id = Column(String(32), primary_key=True, default=gen_id)
    employee_id = Column(String(32), nullable=False)
    from_branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    to_branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=True)
    new_reporting_manager_id = Column(String(32), nullable=True)
    transfer_date = Column(Date, default=date.today)
    effective_date = Column(Date, default=date.today)
    reason = Column(Text, nullable=False)
    status = Column(String(30), default="Pending Approval")
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

class BranchManagerAssignment(Base):
    __tablename__ = "branch_manager_assignments"

    id = Column(String(32), primary_key=True, default=gen_id)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    manager_employee_id = Column(String(32), nullable=False)
    start_date = Column(Date, default=date.today)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    assigned_by = Column(String(100), default="Super Admin")
    responsibilities = Column(Text, nullable=True)


# -------------------- NURSING, LAB, IMAGING, PHARMACY, BILLING, OUTBOX & AUTH MODELS --------------------

class NursingAssessment(Base):
    __tablename__ = "nursing_assessments"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    nurse_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    age_years = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    blood_group = Column(String(10), nullable=True)
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    pulse_rate = Column(Integer, nullable=True)
    temperature_f = Column(Float, nullable=True)
    spo2_percent = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    next_action = Column(String(40), default="PASS_TO_DOCTOR")
    created_at = Column(DateTime, default=datetime.utcnow)

class NursingProcedureOrder(Base):
    __tablename__ = "nursing_procedure_orders"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    ordered_by_doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    nurse_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    procedure_name = Column(String(200), nullable=False)
    is_direct_entry = Column(Boolean, default=False)
    status = Column(String(30), default="ORDERED")  # ORDERED, IN_PROGRESS, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    next_action = Column(String(30), default="RETURN_TO_DOCTOR")  # RETURN_TO_DOCTOR, BILLING, COMPLETED
    price = Column(Float, default=0.0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LabServiceMaster(Base):
    __tablename__ = "lab_service_masters"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    test_code = Column(String(30), nullable=False)
    test_name = Column(String(150), nullable=False)
    category = Column(String(60), default="Biochemistry")
    sample_type = Column(String(60), default="Blood / Serum")
    parameters_json = Column(Text, nullable=True)  # JSON list of {name, unit, ref_range}
    default_price = Column(Float, default=0.0)
    gst_percent = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ImagingServiceMaster(Base):
    __tablename__ = "imaging_service_masters"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    service_code = Column(String(30), nullable=False)
    service_name = Column(String(150), nullable=False)
    modality = Column(String(30), nullable=False)  # X-Ray, MRI, CT Scan, Ultrasound
    default_room = Column(String(80), nullable=True)
    default_price = Column(Float, default=0.0)
    gst_percent = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class BranchServicePriceOverride(Base):
    __tablename__ = "branch_service_price_overrides"
    __table_args__ = (UniqueConstraint("branch_id", "service_type", "service_id", name="uq_branch_service_override"),)

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    service_type = Column(String(30), nullable=False)  # LAB, IMAGING, CONSULTATION, PROCEDURE
    service_id = Column(String(32), nullable=False)
    override_price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)

class LabOrder(Base):
    __tablename__ = "lab_orders"

    id = Column(String(32), primary_key=True, default=gen_id)
    order_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    ordered_by_doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    is_direct_entry = Column(Boolean, default=False)
    status = Column(String(30), default="ORDERED")  # ORDERED, SAMPLE_PENDING, SAMPLE_COLLECTED, PROCESSING, RESULT_DRAFT, VERIFIED, RELEASED, CANCELLED
    priority = Column(String(20), default="Routine")
    clinical_notes = Column(Text, nullable=True)
    sample_collected_at = Column(DateTime, nullable=True)
    sample_collected_by = Column(String(32), nullable=True)
    verified_by = Column(String(32), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    released_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LabOrderItem(Base):
    __tablename__ = "lab_order_items"

    id = Column(String(32), primary_key=True, default=gen_id)
    lab_order_id = Column(String(32), ForeignKey("lab_orders.id"), nullable=False)
    service_id = Column(String(32), ForeignKey("lab_service_masters.id"), nullable=True)
    test_name = Column(String(150), nullable=False)
    sample_type = Column(String(60), default="Blood / Serum")
    status = Column(String(30), default="ORDERED")
    price = Column(Float, default=0.0)
    gst_percent = Column(Float, default=0.0)

class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(String(32), primary_key=True, default=gen_id)
    lab_order_id = Column(String(32), ForeignKey("lab_orders.id"), nullable=False)
    lab_order_item_id = Column(String(32), ForeignKey("lab_order_items.id"), nullable=True)
    parameter_name = Column(String(120), nullable=False)
    observed_value = Column(String(120), nullable=False)
    unit = Column(String(40), nullable=True)
    reference_range = Column(String(100), nullable=True)
    is_abnormal = Column(Boolean, default=False)
    report_file_url = Column(Text, nullable=True)
    entered_by = Column(String(32), nullable=True)
    verified_by = Column(String(32), nullable=True)
    status = Column(String(20), default="RESULT_DRAFT")  # RESULT_DRAFT, VERIFIED, RELEASED
    created_at = Column(DateTime, default=datetime.utcnow)

class ImagingOrder(Base):
    __tablename__ = "imaging_orders"

    id = Column(String(32), primary_key=True, default=gen_id)
    order_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    ordered_by_doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    service_id = Column(String(32), ForeignKey("imaging_service_masters.id"), nullable=True)
    modality = Column(String(30), nullable=False)  # X-Ray, MRI, CT Scan, Ultrasound
    service_name = Column(String(150), nullable=False)
    room_equipment = Column(String(100), nullable=True)
    status = Column(String(30), default="ORDERED")  # ORDERED, SCHEDULED, IN_PROGRESS, REPORT_READY, VERIFIED, CANCELLED
    technician_notes = Column(Text, nullable=True)
    radiologist_findings = Column(Text, nullable=True)
    image_file_url = Column(Text, nullable=True)
    report_file_url = Column(Text, nullable=True)
    price = Column(Float, default=0.0)
    gst_percent = Column(Float, default=0.0)
    verified_by = Column(String(32), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    name = Column(String(150), nullable=False)
    gstin = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PharmacyBatch(Base):
    __tablename__ = "pharmacy_batches"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    medicine_id = Column(String(32), ForeignKey("medicines.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    salt_name = Column(String(200), nullable=True)
    batch_no = Column(String(60), nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity_available = Column(Integer, default=0)
    purchase_rate = Column(Float, default=0.0)
    mrp = Column(Float, default=0.0)
    gst_percent = Column(Float, default=12.0)
    is_schedule_h1 = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String(32), primary_key=True, default=gen_id)
    po_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    supplier_id = Column(String(32), ForeignKey("suppliers.id"), nullable=True)
    supplier_name = Column(String(150), nullable=False)
    order_date = Column(Date, default=date.today)
    status = Column(String(30), default="ORDERED")  # DRAFT, ORDERED, RECEIVED, CANCELLED
    total_amount = Column(Float, default=0.0)
    created_by = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(String(32), primary_key=True, default=gen_id)
    purchase_order_id = Column(String(32), ForeignKey("purchase_orders.id"), nullable=False)
    medicine_id = Column(String(32), ForeignKey("medicines.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    ordered_qty = Column(Integer, default=0)
    bonus_qty = Column(Integer, default=0)
    unit_rate = Column(Float, default=0.0)
    received_qty = Column(Integer, default=0)

class GRN(Base):
    __tablename__ = "grns"

    id = Column(String(32), primary_key=True, default=gen_id)
    grn_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    purchase_order_id = Column(String(32), ForeignKey("purchase_orders.id"), nullable=True)
    supplier_invoice_no = Column(String(60), nullable=True)
    received_date = Column(Date, default=date.today)
    received_by = Column(String(32), nullable=True)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ExpiryReturn(Base):
    __tablename__ = "expiry_returns"

    id = Column(String(32), primary_key=True, default=gen_id)
    debit_note_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    batch_id = Column(String(32), ForeignKey("pharmacy_batches.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    batch_no = Column(String(60), nullable=False)
    quantity = Column(Integer, default=0)
    credit_amount = Column(Float, default=0.0)
    supplier_name = Column(String(150), nullable=True)
    status = Column(String(30), default="PENDING_CREDIT")  # PENDING_CREDIT, CREDITED
    created_at = Column(DateTime, default=datetime.utcnow)

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    batch_id = Column(String(32), ForeignKey("pharmacy_batches.id"), nullable=False)
    medicine_name = Column(String(200), nullable=False)
    batch_no = Column(String(60), nullable=False)
    quantity_delta = Column(Integer, nullable=False)  # negative for outward, positive for inward
    transaction_type = Column(String(30), nullable=False)  # DISPENSE_RX, DIRECT_SALE, GRN_INWARD, EXPIRY_RETURN, ADJUSTMENT
    reference_id = Column(String(32), nullable=True)
    patient_id = Column(String(32), nullable=True)
    override_reason = Column(Text, nullable=True)
    actor_user_id = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PharmacyDispensation(Base):
    __tablename__ = "pharmacy_dispensations"

    id = Column(String(32), primary_key=True, default=gen_id)
    dispense_no = Column(String(30), unique=True, nullable=False)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=True)
    prescription_id = Column(String(32), ForeignKey("prescriptions.id"), nullable=True)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    bill_id = Column(String(32), ForeignKey("bills.id"), nullable=True)
    is_direct_sale = Column(Boolean, default=False)
    pharmacist_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    status = Column(String(20), default="DISPENSED")  # PARTIAL, DISPENSED
    total_amount = Column(Float, default=0.0)
    dispensed_at = Column(DateTime, default=datetime.utcnow)

class PharmacyDispensationItem(Base):
    __tablename__ = "pharmacy_dispensation_items"

    id = Column(String(32), primary_key=True, default=gen_id)
    dispensation_id = Column(String(32), ForeignKey("pharmacy_dispensations.id"), nullable=False)
    prescription_item_id = Column(String(32), nullable=True)
    batch_id = Column(String(32), ForeignKey("pharmacy_batches.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    batch_no = Column(String(60), nullable=True)
    dispensed_qty = Column(Integer, nullable=False)
    unit_price = Column(Float, default=0.0)
    gst_percent = Column(Float, default=12.0)
    line_total = Column(Float, default=0.0)

class PendingCharge(Base):
    __tablename__ = "pending_charges"
    __table_args__ = (UniqueConstraint("source_type", "source_id", name="uq_pending_charge_source"),)

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    encounter_id = Column(String(32), ForeignKey("encounters.id"), nullable=True)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    source_type = Column(String(30), nullable=False)  # LAB_ORDER, IMAGING_ORDER, NURSING_PROCEDURE, CONSULTATION
    source_id = Column(String(32), nullable=False)
    item_name = Column(String(200), nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    gst_percent = Column(Float, default=0.0)
    status = Column(String(20), default="UNBILLED")  # UNBILLED, BILLED, CANCELLED
    bill_id = Column(String(32), ForeignKey("bills.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RefundRequest(Base):
    __tablename__ = "refund_requests"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), ForeignKey("organisations.id"), nullable=True)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    bill_id = Column(String(32), ForeignKey("bills.id"), nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    requested_by = Column(String(32), ForeignKey("staff.id"), nullable=False)
    approved_by = Column(String(32), ForeignKey("staff.id"), nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(32), primary_key=True, default=gen_id)
    staff_id = Column(String(32), ForeignKey("staff.id"), nullable=False)
    token_hash = Column(String(128), unique=True, nullable=False)
    is_revoked = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PatientOTP(Base):
    __tablename__ = "patient_otps"

    id = Column(String(32), primary_key=True, default=gen_id)
    phone = Column(String(15), nullable=False)
    otp_code = Column(String(10), nullable=False)
    patient_id = Column(String(32), nullable=True)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), nullable=True)
    branch_id = Column(String(32), nullable=True)
    event_type = Column(String(60), nullable=False)
    correlation_id = Column(String(64), nullable=True)
    payload_json = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING")  # PENDING, PROCESSED, DEAD_LETTER
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(32), primary_key=True, default=gen_id)
    organisation_id = Column(String(32), nullable=True)
    branch_id = Column(String(32), nullable=True)
    target_role = Column(String(40), nullable=True)
    target_user_id = Column(String(32), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    resource_type = Column(String(40), nullable=True)
    resource_id = Column(String(32), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
