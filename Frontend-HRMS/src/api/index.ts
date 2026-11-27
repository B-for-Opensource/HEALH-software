import { apiRequest } from './httpClient';
import {
  mockAuthService,
  mockPatientsService,
  mockAppointmentsService,
  mockConsultationsService,
  mockPrescriptionsService,
  mockMedicinesService,
  mockBillingService,
  mockPackagesService,
  mockReportsService,
  mockMastersService,
  mockDaycareService,
  mockPhotoService,
  mockPharmacyService,
  mockInventoryService,
  mockHrmsService,
  mockLabService,
  mockNursingService,
  mockShiftService,
  mockAuditService,
  mockBranchService,
  resetDatabaseToDefaults,
  getDb,
  subscribeToDbChanges,
  getBranchShareableUrls,
  exportDatabaseJson,
  importDatabaseJson,
} from '@/lib/mockDb';

const IS_DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

export {
  resetDatabaseToDefaults,
  getDb,
  mockBranchService,
  subscribeToDbChanges,
  getBranchShareableUrls,
  exportDatabaseJson,
  importDatabaseJson,
};

// ----- PATIENTS (Live FastAPI + PostgreSQL) -----
export const patientsApi = {
  list:    (params?: Record<string, any>): Promise<any> =>
    IS_DEMO_MODE ? mockPatientsService.list(params) : apiRequest(`/api/patients${params?.search ? `?search=${encodeURIComponent(params.search)}` : ''}`),
  search:  (q: string): Promise<any> =>
    IS_DEMO_MODE ? mockPatientsService.search(q) : apiRequest(`/api/patients/search?q=${encodeURIComponent(q)}`),
  get:     (id: string): Promise<any> =>
    IS_DEMO_MODE ? mockPatientsService.get(id) : apiRequest(`/api/patients/${id}`),
  history: (id: string): Promise<any> =>
    IS_DEMO_MODE ? mockPatientsService.history(id) : apiRequest(`/api/patients/${id}/history`),
  create:  (data: unknown): Promise<any> =>
    IS_DEMO_MODE ? mockPatientsService.create(data) : apiRequest('/api/patients', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: unknown): Promise<any> =>
    IS_DEMO_MODE ? mockPatientsService.update(id, data) : apiRequest(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  merge:   (data: { surviving_patient_id: string; merged_patient_id: string; reason: string }): Promise<any> =>
    apiRequest('/api/patients/merge', { method: 'POST', body: JSON.stringify(data) }),
};

// ----- ENCOUNTERS & PIPELINE (Live FastAPI) -----
export const encountersApi = {
  list: (params?: Record<string, string>): Promise<any> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/api/encounters${qs}`);
  },
  pipelineSummary: (): Promise<any> => apiRequest('/api/encounters/pipeline/summary'),
  create: (data: unknown): Promise<any> => apiRequest('/api/encounters', { method: 'POST', body: JSON.stringify(data) }),
  saveNursingAssessment: (encounterId: string, data: unknown): Promise<any> =>
    apiRequest(`/api/encounters/${encounterId}/nursing-assessment`, { method: 'POST', body: JSON.stringify(data) }),
  createDoctorOrders: (encounterId: string, data: unknown): Promise<any> =>
    apiRequest(`/api/encounters/${encounterId}/doctor-orders`, { method: 'POST', body: JSON.stringify(data) }),
  close: (encounterId: string): Promise<any> =>
    apiRequest(`/api/encounters/${encounterId}/close`, { method: 'POST' }),
};

// ----- IMAGING & RADIOLOGY (X-Ray / MRI / CT / USG) -----
export const imagingApi = {
  listServices: (): Promise<any> => apiRequest('/api/imaging/services'),
  createService: (data: unknown): Promise<any> => apiRequest('/api/imaging/services', { method: 'POST', body: JSON.stringify(data) }),
  listOrders: (params?: Record<string, string>): Promise<any> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/api/imaging/orders${qs}`);
  },
  createOrder: (data: unknown): Promise<any> => apiRequest('/api/imaging/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (orderId: string, data: unknown): Promise<any> =>
    apiRequest(`/api/imaging/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ----- FINANCE, PENDING CHARGES, REFUNDS & NOTIFICATIONS -----
export const financeApi = {
  pendingCharges: (patientId?: string): Promise<any> =>
    apiRequest(`/api/finance/pending-charges${patientId ? `?patient_id=${patientId}` : ''}`),
  requestRefund: (data: { bill_id: string; amount: number; reason: string }): Promise<any> =>
    apiRequest('/api/finance/refund-requests', { method: 'POST', body: JSON.stringify(data) }),
  approveRefund: (reqId: string, decision: 'APPROVED' | 'REJECTED'): Promise<any> =>
    apiRequest(`/api/finance/refund-requests/${reqId}/approve`, { method: 'POST', body: JSON.stringify({ decision }) }),
  notifications: (): Promise<any> => apiRequest('/api/finance/notifications'),
};

// ----- APPOINTMENTS -----
export const appointmentsApi = {
  queue:        (params?: Record<string, any>): Promise<any> => mockAppointmentsService.queue(params),
  followups:    (params?: Record<string, any>): Promise<any> => mockAppointmentsService.followups(params),
  get:          (id: string): Promise<any>                   => mockAppointmentsService.get(id),
  create:       (data: unknown): Promise<any>                => mockAppointmentsService.create(data),
  updateStatus: (id: string, status: string): Promise<any>   => mockAppointmentsService.updateStatus(id, status),
  cancel:       (id: string): Promise<any>                   => mockAppointmentsService.cancel(id),
};

// ----- CONSULTATIONS -----
export const consultationsApi = {
  get:              (id: string): Promise<any>        => mockConsultationsService.get(id),
  getByAppointment: (apptId: string): Promise<any>    => mockConsultationsService.getByAppointment(apptId),
  create:           (data: unknown): Promise<any>     => mockConsultationsService.create(data),
  update:           (id: string, data: unknown): Promise<any> => mockConsultationsService.update(id, data),
  finalize:         (id: string): Promise<any>        => mockConsultationsService.finalize(id),
};

// ----- PRESCRIPTIONS -----
export const prescriptionsApi = {
  get:        (id: string): Promise<any>       => mockPrescriptionsService.get(id),
  create:     (data: unknown): Promise<any>    => mockPrescriptionsService.create(data),
  pdfUrl:     (id: string): string             => mockPrescriptionsService.pdfUrl(id),
};

// ----- MEDICINES -----
export const medicinesApi = {
  search: (q: string): Promise<any>     => mockMedicinesService.search(q),
  list:   (params?: any): Promise<any>  => mockMedicinesService.list(),
  create: (data: unknown): Promise<any> => mockMedicinesService.create(data),
};

// ----- BILLING -----
export const billingApi = {
  list:   (params?: Record<string, any>): Promise<any> => mockBillingService.list(params),
  get:    (id: string): Promise<any>                   => mockBillingService.get(id),
  create: (data: unknown): Promise<any>                => mockBillingService.create(data),
  pay:    (id: string, data: unknown): Promise<any>    => mockBillingService.pay(id, data),
  cancel: (id: string, reason: string): Promise<any>   => mockBillingService.cancel(id, reason),
};

// ----- PACKAGES -----
export const packagesApi = {
  list:        (params?: any): Promise<any> => mockPackagesService.list(),
  get:         (id: string): Promise<any>   => mockPackagesService.get(id),
  create:      (data: unknown): Promise<any>=> mockPackagesService.create(data),
  patientList: (patientId: string): Promise<any> => mockPackagesService.patientList(patientId),
  sell:        (data: unknown): Promise<any>     => mockPackagesService.sell(data),
  logSession:  (data: unknown): Promise<any>     => mockPackagesService.logSession(data),
};

// ----- DAYCARE & PROCEDURE LOUNGES -----
export const daycareApi = {
  listBeds:      (): Promise<any>                       => mockDaycareService.listBeds(),
  allocateBed:   (bedId: string, data: any): Promise<any> => mockDaycareService.allocateBed(bedId, data),
  dischargeBed:  (bedId: string): Promise<any>          => mockDaycareService.dischargeBed(bedId),
  markSanitized: (bedId: string): Promise<any>          => mockDaycareService.markSanitized(bedId),
};

// ----- PHOTO VAULT -----
export const photoApi = {
  list: (): Promise<any>        => mockPhotoService.list(),
  add:  (data: any): Promise<any> => mockPhotoService.add(data),
};

// ----- PHARMACY & DISPENSARY -----
export const pharmacyApi = {
  listBatches: (): Promise<any>               => mockPharmacyService.listBatches(),
  addBatch:    (data: any): Promise<any>       => mockPharmacyService.addBatch(data),
  dispenseRx:  (batchId: string, qty: number): Promise<any> => mockPharmacyService.dispenseRx(batchId, qty),
};

// ----- PROCUREMENT & INVENTORY -----
export const inventoryApi = {
  listVendors:    (): Promise<any>        => mockInventoryService.listVendors(),
  createVendor:   (data: any): Promise<any> => mockInventoryService.createVendor(data),
  listPOs:        (): Promise<any>        => mockInventoryService.listPOs(),
  createPO:       (data: any): Promise<any> => mockInventoryService.createPO(data),
  listTransfers:  (): Promise<any>        => mockInventoryService.listTransfers(),
  createTransfer: (data: any): Promise<any> => mockInventoryService.createTransfer(data),
};

// ----- HRMS, ROSTER & COMMISSIONS -----
export const hrmsApi = {
  listRoster:        (): Promise<any>       => mockHrmsService.listRoster(),
  listCommissions:   (): Promise<any>       => mockHrmsService.listCommissions(),
  approveCommission: (id: string): Promise<any> => mockHrmsService.approveCommission(id),
};

// ----- LAB & DIAGNOSTICS (Live FastAPI) -----
export const labApi = {
  services:     (): Promise<any> => IS_DEMO_MODE ? Promise.resolve([]) : apiRequest('/api/lab/services'),
  createService:(data: any): Promise<any> => apiRequest('/api/lab/services', { method: 'POST', body: JSON.stringify(data) }),
  list:         (params?: any): Promise<any> =>
    IS_DEMO_MODE ? mockLabService.list(params) : apiRequest(`/api/lab/orders${params?.status ? `?status=${params.status}` : ''}`),
  create:       (data: any): Promise<any> =>
    IS_DEMO_MODE ? mockLabService.create(data) : apiRequest('/api/lab/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, resultData?: any): Promise<any> =>
    IS_DEMO_MODE ? mockLabService.updateStatus(id, status, resultData) : apiRequest(`/api/lab/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(resultData || {}) }) }),
  saveResults:  (id: string, data: any): Promise<any> =>
    apiRequest(`/api/lab/orders/${id}/results`, { method: 'POST', body: JSON.stringify(data) }),
};

// ----- NURSING PROCEDURES & CLINIC DESK (Live FastAPI) -----
export const nursingApi = {
  list:         (params?: any): Promise<any> =>
    IS_DEMO_MODE ? mockNursingService.list(params) : apiRequest(`/api/nursing/procedures${params?.status ? `?status=${params.status}` : ''}`),
  create:       (data: any): Promise<any> =>
    IS_DEMO_MODE ? mockNursingService.create(data) : apiRequest('/api/nursing/procedures', { method: 'POST', body: JSON.stringify(data) }),
  complete:     (id: string, data?: any): Promise<any> =>
    apiRequest(`/api/nursing/procedures/${id}/complete`, { method: 'PATCH', body: JSON.stringify(data || {}) }),
  updateStatus: (id: string, status: string, notes?: string, vitals?: any): Promise<any> =>
    IS_DEMO_MODE ? mockNursingService.updateStatus(id, status, notes, vitals) : apiRequest(`/api/nursing/procedures/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ status, notes, vitals }) }),
  catalogue:    (): Promise<any> => mockNursingService.catalogue(),
};

// ----- CASHIER SHIFTS & DRAWER RECONCILIATION -----
export const shiftApi = {
  listShifts: (): Promise<any>            => mockShiftService.listShifts(),
  closeShift: (id: string, data: any): Promise<any> => mockShiftService.closeShift(id, data),
};

// ----- AUDIT TRAIL -----
export const auditApi = {
  list: (): Promise<any> => mockAuditService.list(),
};

// ----- REPORTS & DASHBOARD -----
export const reportsApi = {
  collection: (params?: Record<string, any>): Promise<any> => mockReportsService.collection(params),
  billing:    (params?: Record<string, any>): Promise<any> => mockReportsService.billing(),
  doctor:     (params?: Record<string, any>): Promise<any> => mockReportsService.doctor(),
  trend:      (): Promise<any>                             => mockReportsService.trend(),
  dashboard:  (): Promise<any>                             => mockReportsService.dashboard(),
};

// ----- MASTERS / DOCTORS & DEPARTMENTS & USERS -----
export const mastersApi = {
  doctors:     (): Promise<any> => mockMastersService.doctors(),
  staff:       (params?: any): Promise<any> => mockMastersService.staff(params),
  departments: (): Promise<any> => mockMastersService.departments(),
  createStaff: (data: unknown): Promise<any> => mockMastersService.createStaff(data),
};

// ----- AUTH (Live FastAPI JWT + Refresh Token) -----
export const authApi = {
  login: async (data: { username: string; password: string }): Promise<any> => {
    if (IS_DEMO_MODE) return mockAuthService.login(data);
    const res = await apiRequest<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.token) localStorage.setItem('heal_token', res.token);
    if (res?.refresh_token) localStorage.setItem('heal_refresh_token', res.refresh_token);
    return res;
  },
  me: (): Promise<any> => IS_DEMO_MODE ? mockAuthService.me() : apiRequest('/api/auth/me'),
  changePassword: (data: unknown): Promise<any> =>
    IS_DEMO_MODE ? mockAuthService.changePassword() : apiRequest('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  logout: (): Promise<any> => {
    const refresh_token = localStorage.getItem('heal_refresh_token');
    localStorage.removeItem('heal_token');
    localStorage.removeItem('heal_refresh_token');
    return apiRequest('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) });
  },
};
