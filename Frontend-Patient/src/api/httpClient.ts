const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';

export function getPatientToken(): string | null {
  return localStorage.getItem('heal_patient_token');
}

export function setPatientToken(token: string): void {
  localStorage.setItem('heal_patient_token', token);
}

export function removePatientToken(): void {
  localStorage.removeItem('heal_patient_token');
  localStorage.removeItem('heal_patient_info');
}

export async function patientApiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPatientToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    removePatientToken();
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    let errorDetail = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return res.json();
}
