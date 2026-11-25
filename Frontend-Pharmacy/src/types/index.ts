export interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  branch_id: string;
  branch_name?: string;
}

export interface Patient {
  id: string;
  op_no: string;
  first_name: string;
  last_name?: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  date_of_birth?: string;
  age_years?: number;
  gender: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  relative_name?: string;
  relation_type?: string;
  address?: string;
  city?: string;
  district?: string;
  pincode?: string;
  known_allergies?: string;
  consultation_type?: string;
  balance_advance: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  token_no: number;
  patient_id: string;
  patient_name?: string;
  op_no?: string;
  phone?: string;
  doctor_id: string;
  doctor_name?: string;
  department_name?: string;
  appointment_date: string;
  visit_type: string;
  consultation_type?: string;
  purpose?: string;
  status:
    | 'Waiting'
    | 'With-Nurse'
    | 'Nurse-Station'
    | 'Passed-to-Doctor'
    | 'Called'
    | 'In-Consult'
    | 'Sent-to-Pharmacy'
    | 'Sent-to-Nursing'
    | 'Sent-to-Lab'
    | 'Procedure'
    | 'Billing-Pending'
    | 'Sent-Back-to-Reception'
    | 'Completed'
    | 'Cancelled'
    | 'No-Show'
    | string;
  token_printed: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  full_name: string;
  role: string;
  department_id?: string;
  department_name?: string;
  doctor_reg_no?: string;
  specialisation?: string;
  username?: string;
  branch_id?: string;
  branch_name?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  branch_id?: string;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  dosage_form?: string;
  strength?: string;
  unit?: string;
  default_dosage?: string;
  default_frequency?: string;
  default_timing?: string;
  route?: string;
}

export interface Bill {
  id: string;
  bill_no: string;
  patient_id: string;
  patient_name?: string;
  op_no?: string;
  doctor_id?: string;
  doctor_name?: string;
  subtotal: number;
  discount_amount: number;
  discount_remarks?: string;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  net_amount: number;
  advance_applied: number;
  amount_paid: number;
  balance_due: number;
  payment_status: 'Unpaid' | 'Partial' | 'Paid' | 'Refunded';
  status: 'Active' | 'Cancelled' | 'Voided';
  bill_date: string;
  created_at: string;
  items?: BillItem[];
}

export interface BillItem {
  id?: string;
  item_type: 'Consultation' | 'Procedure' | 'Medicine' | 'Package' | 'Retail';
  item_name: string;
  item_code?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  taxable_amount?: number;
  cgst_percent: number;
  sgst_percent: number;
  cgst_amount?: number;
  sgst_amount?: number;
  line_total: number;
}

export interface Package {
  id: string;
  code: string;
  name: string;
  category?: string;
  total_sessions: number;
  validity_months: number;
  package_price: number;
  cgst_percent: number;
  sgst_percent: number;
  description?: string;
  is_active: boolean;
}

export interface PatientPackage {
  id: string;
  patient_id: string;
  patient_name?: string;
  op_no?: string;
  package_id: string;
  package_name?: string;
  total_sessions: number;
  sessions_used: number;
  purchase_date: string;
  expiry_date?: string;
  amount_paid: number;
  status: 'Active' | 'Completed' | 'Expired' | 'Cancelled';
  notes?: string;
}

export interface PackageSession {
  id: string;
  patient_package_id: string;
  patient_id: string;
  session_no: number;
  session_date: string;
  performed_by?: string;
  performer_name?: string;
  doctor_id?: string;
  doctor_name?: string;
  room_no?: string;
  device_used?: string;
  energy_level?: string;
  areas_treated?: string;
  patient_feedback?: string;
  adverse_reaction?: string;
  next_session_date?: string;
  status: string;
  notes?: string;
}
