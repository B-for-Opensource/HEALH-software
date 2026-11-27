const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

export function getPatientToken(): string | null {
  return localStorage.getItem('heal_patient_token');
}

export function setPatientToken(token: string | null) {
  if (token) localStorage.setItem('heal_patient_token', token);
  else localStorage.removeItem('heal_patient_token');
}

export interface PatientProfile {
  id: string;
  op_no: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  age_years?: number;
  gender?: string;
  blood_group?: string;
  address?: string;
  city?: string;
  known_allergies?: string;
}

export interface PatientTimelineData {
  encounters: Array<{
    id: string;
    encounter_no: string;
    encounter_type: string;
    status: string;
    started_at?: string;
  }>;
  consultations: Array<{
    id: string;
    consult_date?: string;
    diagnosis?: string;
    treatment_plan?: string;
  }>;
  prescriptions: Array<{
    id: string;
    rx_date?: string;
    status: string;
    general_advice?: string;
    items: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration_days: number;
      quantity: number;
    }>;
  }>;
  lab_reports: Array<{
    id: string;
    order_no: string;
    released_at?: string;
    results: Array<{
      parameter_name: string;
      observed_value: string;
      unit?: string;
      reference_range?: string;
      is_abnormal: boolean;
      report_file_url?: string;
    }>;
  }>;
  imaging_reports: Array<{
    id: string;
    order_no: string;
    modality: string;
    service_name: string;
    radiologist_findings?: string;
    report_file_url?: string;
    verified_at?: string;
  }>;
  procedures: Array<{
    id: string;
    procedure_name: string;
    completed_at?: string;
  }>;
  bills: Array<{
    id: string;
    bill_no: string;
    department_scope?: string;
    net_amount: number;
    amount_paid: number;
    balance_due: number;
    payment_status: string;
    bill_date?: string;
  }>;
}

async function portalRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPatientToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      setPatientToken(null);
    }
    throw new Error(json?.detail || json?.message || `HTTP ${res.status}`);
  }
  return json?.data !== undefined ? json.data : json;
}

export const patientPortalApi = {
  requestOtp: async (phone: string) => {
    const res = await fetch(`${API_BASE}/api/patient-portal/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.detail || json?.message || `HTTP ${res.status}`);
    return json;
  },
  verifyOtp: async (phone: string, otp: string) => {
    const res = await fetch(`${API_BASE}/api/patient-portal/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.detail || json?.message || `HTTP ${res.status}`);
    if (json?.data?.token) {
      setPatientToken(json.data.token);
    }
    return json;
  },
  getProfile: (): Promise<PatientProfile> => portalRequest<PatientProfile>('/api/patient-portal/me'),
  getTimeline: (): Promise<PatientTimelineData> => portalRequest<PatientTimelineData>('/api/patient-portal/timeline'),
};
