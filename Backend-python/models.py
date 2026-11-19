import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime, Time, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base

def gen_id():
    return uuid.uuid4().hex

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(32), primary_key=True, default=gen_id)
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
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    name = Column(String(100), nullable=False)
    code = Column(String(10), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Staff(Base):
    __tablename__ = "staff"

    id = Column(String(32), primary_key=True, default=gen_id)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(30), nullable=False)  # Super Admin, Doctor, Receptionist, Cashier, Therapist, Nurse
    doctor_reg_no = Column(String(50), nullable=True)
    specialisation = Column(String(100), nullable=True)
    phone = Column(String(15), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(32), primary_key=True, default=gen_id)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=True)
    op_no = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(15), nullable=False)
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
    is_active = Column(Boolean, default=True)
    created_by = Column(String(32), ForeignKey("staff.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(32), primary_key=True, default=gen_id)
    token_no = Column(Integer, nullable=False)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=False)
    branch_id = Column(String(32), ForeignKey("branches.id"), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=True)
    appointment_date = Column(DateTime, default=datetime.utcnow)
    visit_type = Column(String(20), default="Walk-in")
    consultation_type = Column(String(30), nullable=True)
    purpose = Column(Text, nullable=True)
    status = Column(String(20), default="Waiting")  # Waiting, Called, In-Consult, Procedure, Billing-Pending, Completed, Cancelled
    token_printed = Column(Boolean, default=False)
    receptionist_id = Column(String(32), ForeignKey("staff.id"), nullable=True)
    cancelled_by = Column(String(32), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String(32), primary_key=True, default=gen_id)
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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(32), primary_key=True, default=gen_id)
    consultation_id = Column(String(32), ForeignKey("consultations.id"), nullable=True)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(32), ForeignKey("staff.id"), nullable=False)
    rx_date = Column(Date, default=date.today)
    general_advice = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(String(32), primary_key=True, default=gen_id)
    prescription_id = Column(String(32), ForeignKey("prescriptions.id"), nullable=False)
    medicine_id = Column(String(32), ForeignKey("medicines.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    dosage = Column(String(30), nullable=True)
    frequency = Column(String(20), nullable=True)
    timing = Column(String(30), nullable=True)
    duration_days = Column(Integer, default=5)
    quantity = Column(Integer, default=10)
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
    user_id = Column(String(32), nullable=True)
    user_name = Column(String(150), nullable=True)
    branch_id = Column(String(32), nullable=True)
    terminal_id = Column(String(100), nullable=True)
    action = Column(String(30), nullable=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(32), nullable=True)
    entity_ref = Column(String(50), nullable=True)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    remarks = Column(Text, nullable=True)
