const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

export function getPatientToken(): string | null {
  return localStorage.getItem('heal_patient_token');
}

export function setPatientToken(token: string | null) {
  if (token) localStorage.setItem('heal_patient_token', token);
  else localStorage.removeItem('heal_patient_token');
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
  requestOtp: (phone: string) =>
    portalRequest<{ phone: string; expires_in_seconds: number; dev_otp?: string }>('/api/patient-portal/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    portalRequest<{ token: string; patient: any }>('/api/patient-portal/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),
  getProfile: () => portalRequest<any>('/api/patient-portal/me'),
  getTimeline: () => portalRequest<any>('/api/patient-portal/timeline'),
};
