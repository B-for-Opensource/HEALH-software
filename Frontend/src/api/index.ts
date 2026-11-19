import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const rawBase = import.meta.env.VITE_API_URL || 'https://healh-software.onrender.com/api';
const API_BASE = rawBase.replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const branchId = useAuthStore.getState().user?.branch_id;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (branchId) config.headers['X-Branch-Id'] = branchId;
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ----- PATIENTS -----
export const patientsApi = {
  list:    (params?: Record<string, any>) => api.get('/patients', { params }).then(r => r.data),
  search:  (q: string)                    => api.get('/patients/search', { params: { q } }).then(r => r.data),
  get:     (id: string)                   => api.get(`/patients/${id}`).then(r => r.data),
  history: (id: string)                   => api.get(`/patients/${id}/history`).then(r => r.data),
  create:  (data: unknown)                => api.post('/patients', data).then(r => r.data),
  update:  (id: string, data: unknown)    => api.put(`/patients/${id}`, data).then(r => r.data),
};

// ----- APPOINTMENTS -----
export const appointmentsApi = {
  queue:        (params?: Record<string, any>) => api.get('/appointments', { params }).then(r => r.data),
  followups:    (params?: Record<string, any>) => api.get('/appointments/followups', { params }).then(r => r.data),
  get:          (id: string)                   => api.get(`/appointments/${id}`).then(r => r.data),
  create:       (data: unknown)                => api.post('/appointments', data).then(r => r.data),
  updateStatus: (id: string, status: string)   => api.put(`/appointments/${id}/status`, { status }).then(r => r.data),
  cancel:       (id: string)                   => api.delete(`/appointments/${id}`).then(r => r.data),
};

// ----- CONSULTATIONS -----
export const consultationsApi = {
  get:      (id: string)        => api.get(`/consultations/${id}`).then(r => r.data),
  getByAppointment: (apptId: string) => api.get(`/consultations?appointment_id=${apptId}`).then(r => r.data),
  create:   (data: unknown)     => api.post('/consultations', data).then(r => r.data),
  update:   (id: string, data: unknown) => api.put(`/consultations/${id}`, data).then(r => r.data),
  finalize: (id: string)        => api.post(`/consultations/${id}/finalize`).then(r => r.data),
};

// ----- PRESCRIPTIONS -----
export const prescriptionsApi = {
  get:        (id: string)       => api.get(`/prescriptions/${id}`).then(r => r.data),
  create:     (data: unknown)    => api.post('/prescriptions', data).then(r => r.data),
  pdfUrl:     (id: string)       => `${API_BASE}/prescriptions/${id}/pdf`,
};

// ----- MEDICINES -----
export const medicinesApi = {
  search: (q: string)     => api.get('/medicines/search', { params: { q } }).then(r => r.data),
  list:   (params?: any)  => api.get('/medicines', { params }).then(r => r.data),
  create: (data: unknown) => api.post('/medicines', data).then(r => r.data),
};

// ----- BILLING -----
export const billingApi = {
  list:   (params?: Record<string, any>) => api.get('/bills', { params }).then(r => r.data),
  get:    (id: string)                   => api.get(`/bills/${id}`).then(r => r.data),
  create: (data: unknown)                => api.post('/bills', data).then(r => r.data),
  pay:    (id: string, data: unknown)    => api.post(`/bills/${id}/pay`, data).then(r => r.data),
  cancel: (id: string, reason: string)   => api.put(`/bills/${id}/cancel`, { reason }).then(r => r.data),
};

// ----- PACKAGES -----
export const packagesApi = {
  list:        (params?: any) => api.get('/packages', { params }).then(r => r.data),
  get:         (id: string)   => api.get(`/packages/${id}`).then(r => r.data),
  create:      (data: unknown)=> api.post('/packages', data).then(r => r.data),
  patientList: (patientId: string) => api.get('/patient-packages', { params: { patient_id: patientId } }).then(r => r.data),
  sell:        (data: unknown)     => api.post('/patient-packages', data).then(r => r.data),
  logSession:  (data: unknown)     => api.post('/sessions', data).then(r => r.data),
};

// ----- REPORTS & DASHBOARD -----
export const reportsApi = {
  collection: (params?: Record<string, any>) => api.get('/reports/collection', { params }).then(r => r.data),
  billing:    (params?: Record<string, any>) => api.get('/reports/billing',    { params }).then(r => r.data),
  doctor:     (params?: Record<string, any>) => api.get('/reports/doctor',     { params }).then(r => r.data),
  trend:      (params?: Record<string, any>) => api.get('/reports/trend',      { params }).then(r => r.data),
  dashboard:  ()                             => api.get('/dashboard').then(r => r.data),
};

// ----- MASTERS / DOCTORS & DEPARTMENTS -----
export const mastersApi = {
  doctors:     () => api.get('/staff', { params: { role: 'Doctor' } }).then(r => r.data),
  staff:       (params?: any) => api.get('/staff', { params }).then(r => r.data),
  departments: () => api.get('/departments').then(r => r.data),
};

// ----- AUTH -----
export const authApi = {
  login:          (data: { username: string; password: string }) => api.post('/auth/login', data).then(r => r.data),
  me:             ()         => api.get('/auth/me').then(r => r.data),
  changePassword: (data: unknown) => api.post('/auth/change-password', data).then(r => r.data),
};
