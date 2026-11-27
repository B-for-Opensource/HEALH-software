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

// ----- PATIENTS -----
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

// ----- PHARMACY & DISPENSARY (Live FastAPI) -----
export const pharmacyApi = {
  prescriptions: (status?: string): Promise<any> =>
    IS_DEMO_MODE ? Promise.resolve([]) : apiRequest(`/api/pharmacy/prescriptions${status ? `?status=${status}` : ''}`),
  batches: (): Promise<any> =>
    IS_DEMO_MODE ? mockPharmacyService.listBatches() : apiRequest('/api/pharmacy/batches'),
  addBatch: (data: any): Promise<any> =>
    IS_DEMO_MODE ? mockPharmacyService.addBatch(data) : apiRequest('/api/pharmacy/batches', { method: 'POST', body: JSON.stringify(data) }),
  dispense: (data: any): Promise<any> =>
    IS_DEMO_MODE ? mockPharmacyService.dispenseRx(data?.items?.[0]?.batch_id, data?.items?.[0]?.dispense_qty) : apiRequest('/api/pharmacy/dispense', { method: 'POST', body: JSON.stringify(data) }),
  stockMovements: (): Promise<any> => apiRequest('/api/pharmacy/stock-movements'),
  purchaseOrders: (): Promise<any> => apiRequest('/api/pharmacy/purchase-orders'),
  createPO: (data: any): Promise<any> => apiRequest('/api/pharmacy/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  expiryReturns: (): Promise<any> => apiRequest('/api/pharmacy/expiry-returns'),
  // compatibility helpers
  listBatches: (): Promise<any> =>
    IS_DEMO_MODE ? mockPharmacyService.listBatches() : apiRequest('/api/pharmacy/batches'),
  dispenseRx: (batchId: string, qty: number): Promise<any> =>
    IS_DEMO_MODE ? mockPharmacyService.dispenseRx(batchId, qty) : apiRequest('/api/pharmacy/dispense', { method: 'POST', body: JSON.stringify({ items: [{ batch_id: batchId, dispense_qty: qty }] }) }),
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

// ----- LAB & DIAGNOSTICS -----
export const labApi = {
  list:         (params?: any): Promise<any> => mockLabService.list(params),
  create:       (data: any): Promise<any>   => mockLabService.create(data),
  updateStatus: (id: string, status: string, resultData?: any): Promise<any> => mockLabService.updateStatus(id, status, resultData),
};

// ----- NURSING PROCEDURES & CLINIC DESK -----
export const nursingApi = {
  list:         (params?: any): Promise<any> => mockNursingService.list(params),
  create:       (data: any): Promise<any>   => mockNursingService.create(data),
  updateStatus: (id: string, status: string, notes?: string, vitals?: any): Promise<any> => mockNursingService.updateStatus(id, status, notes, vitals),
  catalogue:    (): Promise<any>            => mockNursingService.catalogue(),
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

// ----- AUTH -----
export const authApi = {
  login:          (data: { username: string; password: string }): Promise<any> => mockAuthService.login(data),
  me:             (): Promise<any>         => mockAuthService.me(),
  changePassword: (data: unknown): Promise<any> => mockAuthService.changePassword(),
};
