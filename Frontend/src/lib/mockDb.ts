import {
  INITIAL_BRANCHES,
  INITIAL_DEPARTMENTS,
  INITIAL_STAFF,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_FOLLOWUPS,
  INITIAL_MEDICINES,
  INITIAL_PACKAGES,
  INITIAL_PATIENT_PACKAGES,
  INITIAL_PACKAGE_SESSIONS,
  INITIAL_BILLS,
  INITIAL_CONSULTATIONS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_DAYCARE_BEDS,
  INITIAL_BEFORE_AFTER_PHOTOS,
  INITIAL_PHARMACY_BATCHES,
  INITIAL_VENDORS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_INTERBRANCH_TRANSFERS,
  INITIAL_DUTY_ROSTER,
  INITIAL_COMMISSIONS,
  INITIAL_CASHIER_SHIFTS,
  INITIAL_AUDIT_LOGS,
} from './mockData';

const DB_KEY = 'HEAL_CLINIC_DB_V2';

export interface MockDatabase {
  active_branch_id: string;
  branches: any[];
  departments: any[];
  staff: any[];
  patients: any[];
  appointments: any[];
  followups: any[];
  medicines: any[];
  packages: any[];
  patient_packages: any[];
  package_sessions: any[];
  bills: any[];
  consultations: any[];
  prescriptions: any[];
  daycare_beds: any[];
  before_after_photos: any[];
  pharmacy_batches: any[];
  vendors: any[];
  purchase_orders: any[];
  transfers: any[];
  duty_roster: any[];
  commissions: any[];
  cashier_shifts: any[];
  audit_logs: any[];
}

export function getDefaultDb(): MockDatabase {
  return {
    active_branch_id: 'krn-branch-001',
    branches: JSON.parse(JSON.stringify(INITIAL_BRANCHES)),
    departments: JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS)),
    staff: JSON.parse(JSON.stringify(INITIAL_STAFF)),
    patients: JSON.parse(JSON.stringify(INITIAL_PATIENTS)),
    appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
    followups: JSON.parse(JSON.stringify(INITIAL_FOLLOWUPS)),
    medicines: JSON.parse(JSON.stringify(INITIAL_MEDICINES)),
    packages: JSON.parse(JSON.stringify(INITIAL_PACKAGES)),
    patient_packages: JSON.parse(JSON.stringify(INITIAL_PATIENT_PACKAGES)),
    package_sessions: JSON.parse(JSON.stringify(INITIAL_PACKAGE_SESSIONS)),
    bills: JSON.parse(JSON.stringify(INITIAL_BILLS)),
    consultations: JSON.parse(JSON.stringify(INITIAL_CONSULTATIONS)),
    prescriptions: JSON.parse(JSON.stringify(INITIAL_PRESCRIPTIONS)),
    daycare_beds: JSON.parse(JSON.stringify(INITIAL_DAYCARE_BEDS)),
    before_after_photos: JSON.parse(JSON.stringify(INITIAL_BEFORE_AFTER_PHOTOS)),
    pharmacy_batches: JSON.parse(JSON.stringify(INITIAL_PHARMACY_BATCHES)),
    vendors: JSON.parse(JSON.stringify(INITIAL_VENDORS)),
    purchase_orders: JSON.parse(JSON.stringify(INITIAL_PURCHASE_ORDERS)),
    transfers: JSON.parse(JSON.stringify(INITIAL_INTERBRANCH_TRANSFERS)),
    duty_roster: JSON.parse(JSON.stringify(INITIAL_DUTY_ROSTER)),
    commissions: JSON.parse(JSON.stringify(INITIAL_COMMISSIONS)),
    cashier_shifts: JSON.parse(JSON.stringify(INITIAL_CASHIER_SHIFTS)),
    audit_logs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
  };
}

export function getDb(): MockDatabase {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const defaultDb = getDefaultDb();
      localStorage.setItem(DB_KEY, JSON.stringify(defaultDb));
      return defaultDb;
    }
    const parsed = JSON.parse(raw);
    const defaultDb = getDefaultDb();
    let updated = false;
    for (const key of Object.keys(defaultDb) as (keyof MockDatabase)[]) {
      if (parsed[key] === undefined || (Array.isArray(defaultDb[key]) && !Array.isArray(parsed[key]))) {
        parsed[key] = defaultDb[key];
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(DB_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error('Error reading mock database from localStorage', err);
    return getDefaultDb();
  }
}

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('HEAL_SYNC_CHANNEL');
  } catch (err) {
    console.warn('BroadcastChannel initialization failed:', err);
  }
}

export function subscribeToDbChanges(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (e: StorageEvent) => {
    if (e.key === DB_KEY) {
      listener();
    }
  };
  window.addEventListener('storage', handleStorage);

  let handleChannel: ((ev: MessageEvent) => void) | null = null;
  if (broadcastChannel) {
    handleChannel = (ev: MessageEvent) => {
      if (ev.data?.type === 'DB_MUTATED') {
        listener();
      }
    };
    broadcastChannel.addEventListener('message', handleChannel);
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (broadcastChannel && handleChannel) {
      broadcastChannel.removeEventListener('message', handleChannel);
    }
  };
}

export function saveDb(db: MockDatabase): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'DB_MUTATED', timestamp: Date.now() });
    }
  } catch (err) {
    console.error('Error saving mock database to localStorage', err);
  }
}

export function resetDatabaseToDefaults(): MockDatabase {
  const defaults = getDefaultDb();
  saveDb(defaults);
  return defaults;
}

export function exportDatabaseJson(): string {
  const db = getDb();
  return JSON.stringify(db, null, 2);
}

export function importDatabaseJson(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && Array.isArray(parsed.branches) && Array.isArray(parsed.patients)) {
      saveDb(parsed);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to parse database JSON', err);
    return false;
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

// Helper to resolve which branch this window/tab or deployment should display
export function resolveBranchFromUrlOrHost(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check clean path numbers: /1, /2, /3, /4
    const path = window.location.pathname.toLowerCase().trim();
    if (path === '/1' || path.startsWith('/1/')) {
      sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'krn-branch-001');
      return 'krn-branch-001';
    }
    if (path === '/2' || path.startsWith('/2/')) {
      sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'clt-branch-002');
      return 'clt-branch-002';
    }
    if (path === '/3' || path.startsWith('/3/')) {
      sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'wyd-branch-003');
      return 'wyd-branch-003';
    }
    if (path === '/4' || path.startsWith('/4/')) {
      sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'all');
      return 'all';
    }

    // 2. Check URL query parameters: ?branch=1, ?branch=2, ?branch=3, ?branch=4, ?branch=karanthoor, etc.
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branch') || params.get('b');
    if (branchParam) {
      const p = branchParam.toLowerCase().trim();
      if (p === '1' || p.includes('krn') || p.includes('karan')) {
        sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'krn-branch-001');
        return 'krn-branch-001';
      }
      if (p === '2' || p.includes('clt') || p.includes('beach') || p.includes('calicut')) {
        sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'clt-branch-002');
        return 'clt-branch-002';
      }
      if (p === '3' || p.includes('wyd') || p.includes('wayanad') || p.includes('bathery') || p.includes('sulthan')) {
        sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'wyd-branch-003');
        return 'wyd-branch-003';
      }
      if (p === '4' || p.includes('all') || p.includes('hq') || p.includes('consolidated')) {
        sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', 'all');
        return 'all';
      }
    }

    // 3. Check tab-specific sessionStorage override (keeps different tabs in different branch views)
    const tabBranch = sessionStorage.getItem('HEAL_ACTIVE_BRANCH_TAB');
    if (tabBranch) {
      return tabBranch;
    }

    // 4. Check descriptive paths: /branch/karanthoor, /branch/beachroad, /branch/wayanad, /branch/hq
    if (path.includes('/branch/karanthoor') || path.includes('/branch/krn')) return 'krn-branch-001';
    if (path.includes('/branch/beachroad') || path.includes('/branch/beach-road') || path.includes('/branch/clt')) return 'clt-branch-002';
    if (path.includes('/branch/wayanad') || path.includes('/branch/wyd')) return 'wyd-branch-003';
    if (path.includes('/branch/hq') || path.includes('/branch/all')) return 'all';

    // 5. Check subdomain or hostname (e.g. heal-karanthoor.netlify.app)
    const host = window.location.hostname.toLowerCase();
    if (host.includes('karan') || host.includes('krn')) return 'krn-branch-001';
    if (host.includes('beach') || host.includes('clt') || host.includes('calicut')) return 'clt-branch-002';
    if (host.includes('wayanad') || host.includes('wyd') || host.includes('bathery')) return 'wyd-branch-003';
    if (host.includes('hq')) return 'all';

    // 6. Check Vite environment variable (set per Netlify site build)
    const envBranch = (import.meta as any).env?.VITE_DEFAULT_BRANCH_ID || (import.meta as any).env?.VITE_BRANCH_CODE;
    if (envBranch) {
      const e = String(envBranch).toLowerCase().trim();
      if (e === '1' || e.includes('krn') || e.includes('karan')) return 'krn-branch-001';
      if (e === '2' || e.includes('clt') || e.includes('beach')) return 'clt-branch-002';
      if (e === '3' || e.includes('wyd') || e.includes('wayanad')) return 'wyd-branch-003';
      if (e === '4' || e.includes('all') || e.includes('hq')) return 'all';
    }
  } catch (err) {
    console.error('Error in resolveBranchFromUrlOrHost', err);
  }

  return null;
}

// Generate investor shareable links for all branches based on the current origin
export function getBranchShareableUrls(): { id: string; name: string; code: string; url: string; city: string; num: string }[] {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://heal-clinic.netlify.app';
  return [
    {
      id: 'krn-branch-001',
      name: 'HEAL Clinic — Karanthoor (Flagship)',
      code: 'KRN',
      city: 'Karanthoor, Kozhikode',
      url: `${origin}/1`,
      num: '1',
    },
    {
      id: 'clt-branch-002',
      name: 'HEAL Clinic — Beach Road Calicut',
      code: 'CLT',
      city: 'Beach Road, Kozhikode City',
      url: `${origin}/2`,
      num: '2',
    },
    {
      id: 'wyd-branch-003',
      name: 'HEAL Clinic — Sulthan Bathery Wayanad',
      code: 'WYD',
      city: 'Sulthan Bathery, Wayanad',
      url: `${origin}/3`,
      num: '3',
    },
    {
      id: 'all',
      name: 'HEAL Clinic — Consolidated HQ (All Branches)',
      code: 'HQ',
      city: 'Executive Consolidated View',
      url: `${origin}/4`,
      num: '4',
    },
  ];
}

// ======================== BRANCH SWITCHER ========================
export const mockBranchService = {
  list: async () => {
    const db = getDb();
    return db.branches;
  },

  getActiveBranch: () => {
    const db = getDb();
    const resolvedId = resolveBranchFromUrlOrHost();
    const bId = resolvedId || db.active_branch_id || 'krn-branch-001';

    if (bId === 'all') {
      return {
        id: 'all',
        name: 'Consolidated (All 3 Branches — HQ)',
        branch_code: 'HQ',
        city: 'All Locations',
        address: 'Central Executive Command, Kozhikode',
        phone: '1800-HEAL-HQ',
      };
    }
    return db.branches.find((b) => b.id === bId) || db.branches[0];
  },

  setActiveBranch: (branchId: string) => {
    const db = getDb();
    db.active_branch_id = branchId;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', branchId);
    }
    saveDb(db);
    return mockBranchService.getActiveBranch();
  },
};

// ======================== AUTH & USERS ========================
export const mockAuthService = {
  login: async ({ username, password }: { username: string; password: string }) => {
    const db = getDb();
    const user = db.staff.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        (u.password === password || password === 'demo' || password === 'admin')
    );

    if (!user) {
      throw { response: { status: 401, data: { message: 'Invalid username or password' } } };
    }

    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    const userPayload = {
      id: user.id,
      username: user.username,
      name: user.full_name,
      full_name: user.full_name,
      role: user.role,
      branch_id: user.branch_id || 'krn-branch-001',
      branch_name: user.branch_name || 'HEAL Clinic — Karanthoor',
      department_id: user.department_id,
      department_name: user.department_name,
      doctor_reg_no: user.doctor_reg_no,
      specialisation: user.specialisation,
      phone: user.phone,
      email: user.email,
    };

    // Log login to forensic audit trail
    db.audit_logs.unshift({
      id: uid('audit'),
      user_name: user.username,
      action: 'USER_LOGIN',
      entity: 'Auth Session',
      timestamp: new Date().toLocaleString('en-IN'),
      ip_address: '192.168.1.18',
      details: `Successful sign-in for role ${user.role} on ${user.branch_name}`,
    });
    saveDb(db);

    return { token, user: userPayload };
  },

  me: async () => {
    const db = getDb();
    const admin = db.staff[0] || INITIAL_STAFF[0];
    return {
      id: admin.id,
      username: admin.username,
      name: admin.full_name,
      full_name: admin.full_name,
      role: admin.role,
      branch_id: admin.branch_id,
      branch_name: admin.branch_name,
    };
  },

  changePassword: async () => {
    return { success: true, message: 'Password updated successfully' };
  },
};

// ======================== MASTERS (STAFF & DEPTS) ========================
export const mockMastersService = {
  doctors: async () => {
    const db = getDb();
    return db.staff.filter(
      (s) => s.role === 'Doctor' || s.role === 'Super Admin' || s.doctor_reg_no
    );
  },

  staff: async (params?: any) => {
    const db = getDb();
    if (params?.role) {
      return db.staff.filter((s) => s.role.toLowerCase() === params.role.toLowerCase());
    }
    return db.staff;
  },

  departments: async () => {
    const db = getDb();
    return db.departments;
  },

  createStaff: async (data: any) => {
    const db = getDb();
    const exists = db.staff.some(
      (s) => s.username.toLowerCase() === (data.username || '').trim().toLowerCase()
    );
    if (exists) {
      throw { response: { status: 400, data: { message: `Username "${data.username}" already exists` } } };
    }

    const branch = db.branches.find((b) => b.id === data.branch_id) || db.branches[0];
    const dept = db.departments.find((d) => d.id === data.department_id) || db.departments[0];

    const newStaff = {
      id: uid('staff'),
      branch_id: branch?.id || 'krn-branch-001',
      branch_name: branch?.name || 'HEAL Clinic — Karanthoor',
      department_id: dept?.id || 'dept-derm',
      department_name: dept?.name || 'Dermatology & Cosmetology',
      username: (data.username || '').trim(),
      password: data.password || 'Doctor@1234',
      full_name: data.full_name,
      role: data.role || 'Doctor',
      doctor_reg_no: data.doctor_reg_no || '',
      specialisation: data.specialisation || '',
      phone: data.phone || '',
      email: data.email || '',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    db.staff.unshift(newStaff);

    // Audit log
    db.audit_logs.unshift({
      id: uid('audit'),
      user_name: 'admin',
      action: 'STAFF_CREATE',
      entity: `Staff (${newStaff.full_name})`,
      timestamp: new Date().toLocaleString('en-IN'),
      ip_address: '192.168.1.10',
      details: `Created new staff user @${newStaff.username} with role ${newStaff.role}`,
    });

    saveDb(db);
    return newStaff;
  },
};

// ======================== PATIENTS ========================
export const mockPatientsService = {
  list: async (params?: any) => {
    const db = getDb();
    return db.patients;
  },

  search: async (q: string) => {
    const db = getDb();
    const query = (q || '').trim().toLowerCase();
    if (!query) return db.patients;

    return db.patients.filter((p) => {
      const op = (p.op_no || '').toLowerCase();
      const fn = (p.first_name || '').toLowerCase();
      const ln = (p.last_name || '').toLowerCase();
      const ph = (p.phone || '').toLowerCase();
      const ct = (p.city || '').toLowerCase();
      return (
        op.includes(query) ||
        fn.includes(query) ||
        ln.includes(query) ||
        `${fn} ${ln}`.includes(query) ||
        ph.includes(query) ||
        ct.includes(query)
      );
    });
  },

  get: async (id: string) => {
    const db = getDb();
    const p = db.patients.find((pat) => pat.id === id);
    if (!p) throw { response: { status: 404, data: { message: 'Patient not found' } } };
    return p;
  },

  history: async (id: string) => {
    const db = getDb();
    const consults = db.consultations.filter((c) => c.patient_id === id);
    const bills = db.bills.filter((b) => b.patient_id === id);
    const sessions = db.package_sessions.filter((s) => s.patient_id === id);

    return {
      consultations: consults,
      bills: bills,
      treatment_sessions: sessions,
    };
  },

  create: async (data: any) => {
    const db = getDb();
    const count = db.patients.length + 101;
    const opNumber = `KRN-00${count}`;

    const newPatient = {
      id: uid('pat'),
      op_no: opNumber,
      first_name: data.first_name,
      last_name: data.last_name || '',
      phone: data.phone,
      alt_phone: data.alt_phone || '',
      email: data.email || '',
      date_of_birth: data.date_of_birth || '',
      age_years: data.age_years ? parseInt(data.age_years) : undefined,
      gender: data.gender || 'Female',
      blood_group: data.blood_group || '',
      relative_name: data.relative_name || '',
      relation_type: data.relation_type || 'S/o',
      address: data.address || '',
      city: data.city || 'Kozhikode',
      district: data.district || 'Kozhikode',
      pincode: data.pincode || '',
      consultation_type: data.consultation_type || 'Aesthetic',
      known_allergies: data.known_allergies || '',
      balance_advance: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    db.patients.unshift(newPatient);

    db.audit_logs.unshift({
      id: uid('audit'),
      user_name: 'reception',
      action: 'PATIENT_REGISTER',
      entity: `Patient (${newPatient.first_name} ${newPatient.last_name})`,
      timestamp: new Date().toLocaleString('en-IN'),
      ip_address: '192.168.1.12',
      details: `Generated new outpatient file #${opNumber} with mobile ${newPatient.phone}`,
    });

    saveDb(db);
    return newPatient;
  },

  update: async (id: string, data: any) => {
    const db = getDb();
    const idx = db.patients.findIndex((p) => p.id === id);
    if (idx === -1) throw { response: { status: 404, data: { message: 'Patient not found' } } };

    db.patients[idx] = { ...db.patients[idx], ...data, updated_at: new Date().toISOString() };
    saveDb(db);
    return db.patients[idx];
  },
};

// ======================== APPOINTMENTS & QUEUE ========================
export const mockAppointmentsService = {
  queue: async (params?: any) => {
    const db = getDb();
    return db.appointments;
  },

  followups: async (params?: any) => {
    const db = getDb();
    return db.followups;
  },

  get: async (id: string) => {
    const db = getDb();
    const appt = db.appointments.find((a) => a.id === id);
    if (!appt) throw { response: { status: 404, data: { message: 'Appointment not found' } } };
    return appt;
  },

  create: async (data: any) => {
    const db = getDb();
    const patient = db.patients.find((p) => p.id === data.patient_id);
    const doctor = db.staff.find((s) => s.id === data.doctor_id) || db.staff[1];
    const dept = db.departments.find((d) => d.id === data.department_id) || db.departments[0];

    const currentMaxToken = db.appointments.reduce((max, a) => Math.max(max, Number(a.token_no) || 0), 0);
    const nextToken = currentMaxToken + 1;

    const newAppt = {
      id: uid('appt'),
      token_no: nextToken,
      patient_id: data.patient_id,
      patient_name: patient ? `${patient.first_name} ${patient.last_name || ''}`.trim() : 'Patient',
      op_no: patient?.op_no || 'KRN-00000',
      phone: patient?.phone || '',
      doctor_id: doctor.id,
      doctor_name: doctor.full_name,
      department_id: dept?.id,
      department_name: dept?.name || 'General',
      appointment_date: data.appointment_date || new Date().toISOString(),
      visit_type: data.visit_type || 'Walk-in',
      consultation_type: data.consultation_type || 'Aesthetic',
      purpose: data.purpose || 'Doctor Consultation',
      status: 'Waiting',
      token_printed: true,
      created_at: new Date().toISOString(),
    };

    db.appointments.unshift(newAppt);

    db.audit_logs.unshift({
      id: uid('audit'),
      user_name: 'reception',
      action: 'TOKEN_ISSUED',
      entity: `Token #${nextToken}`,
      timestamp: new Date().toLocaleString('en-IN'),
      ip_address: '192.168.1.12',
      details: `Issued token #${nextToken} for ${newAppt.patient_name} -> ${newAppt.doctor_name}`,
    });

    saveDb(db);
    return newAppt;
  },

  updateStatus: async (id: string, status: string) => {
    const db = getDb();
    const idx = db.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      db.appointments[idx].status = status;
      saveDb(db);
      return db.appointments[idx];
    }
    const fIdx = db.followups.findIndex((f) => f.id === id);
    if (fIdx !== -1) {
      db.followups[fIdx].status = status;
      db.followups[fIdx].called = status === 'Called';
      saveDb(db);
      return db.followups[fIdx];
    }
    throw { response: { status: 404, data: { message: 'Appointment not found' } } };
  },

  cancel: async (id: string) => {
    const db = getDb();
    const idx = db.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      db.appointments[idx].status = 'Cancelled';
      saveDb(db);
      return db.appointments[idx];
    }
    throw { response: { status: 404, data: { message: 'Appointment not found' } } };
  },
};

// ======================== CONSULTATIONS ========================
export const mockConsultationsService = {
  get: async (id: string) => {
    const db = getDb();
    return db.consultations.find((item) => item.id === id) || null;
  },

  getByAppointment: async (apptId: string) => {
    const db = getDb();
    return db.consultations.filter((c) => c.appointment_id === apptId);
  },

  create: async (data: any) => {
    const db = getDb();
    const consultId = uid('consult');
    const newConsult = {
      id: consultId,
      ...data,
      created_at: new Date().toISOString(),
    };
    db.consultations.push(newConsult);

    if (data.review_date && data.review_after_days > 0) {
      const patient = db.patients.find((p) => p.id === data.patient_id);
      const doctor = db.staff.find((s) => s.id === data.doctor_id);
      db.followups.unshift({
        id: uid('flw'),
        patient_id: data.patient_id,
        patient_name: patient ? `${patient.first_name} ${patient.last_name || ''}`.trim() : 'Patient',
        op_no: patient?.op_no,
        phone: patient?.phone,
        doctor_id: data.doctor_id,
        doctor_name: doctor?.full_name || 'Doctor',
        appointment_date: data.review_date,
        review_date: data.review_date,
        review_instructions: data.review_instructions || 'Scheduled Review',
        purpose: data.chief_complaints || 'Follow-up Consultation',
        status: 'Waiting',
        called: false,
      });
    }

    saveDb(db);
    return newConsult;
  },

  update: async (id: string, data: any) => {
    const db = getDb();
    const idx = db.consultations.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.consultations[idx] = { ...db.consultations[idx], ...data };
      saveDb(db);
      return db.consultations[idx];
    }
    return null;
  },

  finalize: async (id: string) => {
    const db = getDb();
    const idx = db.consultations.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.consultations[idx].is_draft = 0;
      saveDb(db);
      return db.consultations[idx];
    }
    return null;
  },
};

// ======================== PRESCRIPTIONS ========================
export const mockPrescriptionsService = {
  get: async (id: string) => {
    const db = getDb();
    return db.prescriptions.find((p) => p.id === id) || null;
  },

  create: async (data: any) => {
    const db = getDb();
    const newRx = {
      id: uid('rx'),
      ...data,
      rx_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };
    db.prescriptions.push(newRx);
    saveDb(db);
    return newRx;
  },

  pdfUrl: (id: string) => '#',
};

// ======================== MEDICINES ========================
export const mockMedicinesService = {
  search: async (q: string) => {
    const db = getDb();
    const query = (q || '').trim().toLowerCase();
    if (!query) return db.medicines;
    return db.medicines.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const generic = (m.generic_name || '').toLowerCase();
      const brand = (m.brand_name || '').toLowerCase();
      return name.includes(query) || generic.includes(query) || brand.includes(query);
    });
  },

  list: async () => {
    const db = getDb();
    return db.medicines;
  },

  create: async (data: any) => {
    const db = getDb();
    const newMed = {
      id: uid('med'),
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    db.medicines.unshift(newMed);
    saveDb(db);
    return newMed;
  },
};

// ======================== BILLING & POS ========================
export const mockBillingService = {
  list: async (params?: any) => {
    const db = getDb();
    return db.bills;
  },

  get: async (id: string) => {
    const db = getDb();
    const bill = db.bills.find((b) => b.id === id || b.bill_no === id);
    if (!bill) throw { response: { status: 404, data: { message: 'Bill not found' } } };
    return bill;
  },

  create: async (data: any) => {
    const db = getDb();
    const count = db.bills.length + 1;
    const year = new Date().getFullYear();
    const billNo = `BILL-KRN-${year}-${count.toString().padStart(4, '0')}`;

    const patient = db.patients.find((p) => p.id === data.patient_id);
    const doctor = db.staff.find((s) => s.id === data.doctor_id) || db.staff[1];

    let cash = 0;
    let upi = 0;
    let card = 0;
    if (Array.isArray(data.payments)) {
      data.payments.forEach((p: any) => {
        const amt = parseFloat(p.amount) || 0;
        if (p.payment_mode === 'Cash') cash += amt;
        if (p.payment_mode === 'UPI') upi += amt;
        if (p.payment_mode === 'Card') card += amt;
      });
    }

    const net = Number(data.net_amount) || 0;
    const paid = Number(data.amount_paid) || 0;
    const balance = Math.max(0, net - paid);

    const newBill = {
      id: uid('bill'),
      bill_no: billNo,
      patient_id: data.patient_id,
      patient_name: patient ? `${patient.first_name} ${patient.last_name || ''}`.trim() : 'Patient',
      op_no: patient?.op_no || 'KRN-00000',
      doctor_id: doctor?.id,
      doctor_name: doctor?.full_name || 'Dr. Ananya Nair',
      subtotal: Number(data.subtotal) || 0,
      discount_amount: Number(data.discount_amount) || 0,
      discount_remarks: data.discount_remarks || '',
      taxable_amount: Number(data.taxable_amount) || 0,
      cgst_amount: Number(data.cgst_amount) || 0,
      sgst_amount: Number(data.sgst_amount) || 0,
      net_amount: net,
      advance_applied: Number(data.advance_applied) || 0,
      amount_paid: paid,
      balance_due: balance,
      payment_status: balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
      status: 'Active',
      bill_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      cash_amount: cash,
      upi_amount: upi,
      card_amount: card,
      items: data.items || [],
    };

    db.bills.unshift(newBill);

    if (data.appointment_id) {
      const aIdx = db.appointments.findIndex((a) => a.id === data.appointment_id);
      if (aIdx !== -1) {
        db.appointments[aIdx].status = 'Completed';
      }
    }

    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.item_type === 'Package') {
          const pkg = db.packages.find((p) => p.name === item.item_name || p.id === item.item_code);
          if (pkg && patient) {
            db.patient_packages.unshift({
              id: uid('ppkg'),
              patient_id: patient.id,
              patient_name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
              op_no: patient.op_no,
              package_id: pkg.id,
              package_name: pkg.name,
              total_sessions: pkg.total_sessions,
              sessions_used: 0,
              purchase_date: new Date().toISOString().split('T')[0],
              expiry_date: new Date(Date.now() + pkg.validity_months * 30 * 86400000).toISOString().split('T')[0],
              amount_paid: item.line_total,
              status: 'Active',
              notes: `Enrolled via Bill #${billNo}`,
            });
          }
        }
      }
    }

    db.audit_logs.unshift({
      id: uid('audit'),
      user_name: 'cashier',
      action: 'BILL_CREATE',
      entity: `Invoice #${billNo}`,
      timestamp: new Date().toLocaleString('en-IN'),
      ip_address: '192.168.1.15',
      details: `Generated bill for ${newBill.patient_name} - Net: ₹${net}, Paid: ₹${paid}`,
    });

    saveDb(db);
    return newBill;
  },

  pay: async (id: string, data: any) => {
    const db = getDb();
    const idx = db.bills.findIndex((b) => b.id === id);
    if (idx === -1) throw { response: { status: 404, data: { message: 'Bill not found' } } };

    const bill = db.bills[idx];
    const payAmt = parseFloat(data.amount) || 0;
    bill.amount_paid = (bill.amount_paid || 0) + payAmt;
    bill.balance_due = Math.max(0, (bill.net_amount || 0) - bill.amount_paid);
    bill.payment_status = bill.balance_due === 0 ? 'Paid' : 'Partial';

    if (data.payment_mode === 'Cash') bill.cash_amount = (bill.cash_amount || 0) + payAmt;
    if (data.payment_mode === 'UPI') bill.upi_amount = (bill.upi_amount || 0) + payAmt;
    if (data.payment_mode === 'Card') bill.card_amount = (bill.card_amount || 0) + payAmt;

    saveDb(db);
    return bill;
  },

  cancel: async (id: string, reason: string) => {
    const db = getDb();
    const idx = db.bills.findIndex((b) => b.id === id);
    if (idx !== -1) {
      db.bills[idx].status = 'Cancelled';
      db.bills[idx].cancel_reason = reason;
      saveDb(db);
      return db.bills[idx];
    }
    throw { response: { status: 404, data: { message: 'Bill not found' } } };
  },
};

// ======================== AESTHETIC PACKAGES ========================
export const mockPackagesService = {
  list: async () => {
    const db = getDb();
    return db.packages;
  },

  get: async (id: string) => {
    const db = getDb();
    const pkg = db.packages.find((p) => p.id === id);
    if (!pkg) throw { response: { status: 404, data: { message: 'Package not found' } } };
    return pkg;
  },

  create: async (data: any) => {
    const db = getDb();
    const newPkg = {
      id: uid('pkg'),
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    db.packages.push(newPkg);
    saveDb(db);
    return newPkg;
  },

  patientList: async (patientId: string) => {
    const db = getDb();
    return db.patient_packages.filter((pp) => pp.patient_id === patientId);
  },

  sell: async (data: any) => {
    const db = getDb();
    const patient = db.patients.find((p) => p.id === data.patient_id);
    const pkg = db.packages.find((p) => p.id === data.package_id);

    const newPPkg = {
      id: uid('ppkg'),
      patient_id: data.patient_id,
      patient_name: patient ? `${patient.first_name} ${patient.last_name || ''}`.trim() : 'Patient',
      op_no: patient?.op_no,
      package_id: data.package_id,
      package_name: pkg?.name || 'Treatment Package',
      total_sessions: pkg?.total_sessions || data.total_sessions || 4,
      sessions_used: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + (pkg?.validity_months || 6) * 30 * 86400000).toISOString().split('T')[0],
      amount_paid: data.amount_paid || pkg?.package_price || 0,
      status: 'Active',
      notes: data.notes || '',
    };

    db.patient_packages.unshift(newPPkg);
    saveDb(db);
    return newPPkg;
  },

  logSession: async (data: any) => {
    const db = getDb();
    const staff = db.staff.find((s) => s.id === data.performed_by);
    const doctor = db.staff.find((s) => s.id === data.doctor_id);

    const newSession = {
      id: uid('sess'),
      ...data,
      performer_name: staff?.full_name || 'Clinic Therapist',
      doctor_name: doctor?.full_name || 'Dr. Ananya Nair',
      status: 'Completed',
      created_at: new Date().toISOString(),
    };

    db.package_sessions.push(newSession);

    const ppIdx = db.patient_packages.findIndex((p) => p.id === data.patient_package_id);
    if (ppIdx !== -1) {
      const current = db.patient_packages[ppIdx];
      const used = (current.sessions_used || 0) + 1;
      current.sessions_used = used;
      if (used >= current.total_sessions) {
        current.status = 'Completed';
      }
    }

    saveDb(db);
    return newSession;
  },
};

// ======================== DAYCARE & PROCEDURE LOUNGES ========================
export const mockDaycareService = {
  listBeds: async () => {
    const db = getDb();
    return db.daycare_beds;
  },

  allocateBed: async (bedId: string, data: any) => {
    const db = getDb();
    const idx = db.daycare_beds.findIndex((b) => b.id === bedId);
    if (idx !== -1) {
      db.daycare_beds[idx] = {
        ...db.daycare_beds[idx],
        status: 'Occupied',
        ...data,
        start_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      saveDb(db);
      return db.daycare_beds[idx];
    }
    return null;
  },

  dischargeBed: async (bedId: string) => {
    const db = getDb();
    const idx = db.daycare_beds.findIndex((b) => b.id === bedId);
    if (idx !== -1) {
      db.daycare_beds[idx].status = 'Cleaning';
      db.daycare_beds[idx].patient_name = null;
      db.daycare_beds[idx].op_no = null;
      db.daycare_beds[idx].procedure_name = null;
      saveDb(db);
      return db.daycare_beds[idx];
    }
    return null;
  },

  markSanitized: async (bedId: string) => {
    const db = getDb();
    const idx = db.daycare_beds.findIndex((b) => b.id === bedId);
    if (idx !== -1) {
      db.daycare_beds[idx].status = 'Vacant';
      saveDb(db);
      return db.daycare_beds[idx];
    }
    return null;
  },
};

// ======================== BEFORE & AFTER PHOTO VAULT ========================
export const mockPhotoService = {
  list: async () => {
    const db = getDb();
    return db.before_after_photos;
  },

  add: async (data: any) => {
    const db = getDb();
    const newPhoto = {
      id: uid('photo'),
      ...data,
      consent_obtained: true,
      created_at: new Date().toISOString(),
    };
    db.before_after_photos.unshift(newPhoto);
    saveDb(db);
    return newPhoto;
  },
};

// ======================== PHARMACY & DISPENSARY ========================
export const mockPharmacyService = {
  listBatches: async () => {
    const db = getDb();
    return db.pharmacy_batches;
  },

  addBatch: async (data: any) => {
    const db = getDb();
    const newBatch = {
      id: uid('batch'),
      ...data,
      status: 'Good',
    };
    db.pharmacy_batches.unshift(newBatch);
    saveDb(db);
    return newBatch;
  },

  dispenseRx: async (batchId: string, qty: number) => {
    const db = getDb();
    const idx = db.pharmacy_batches.findIndex((b) => b.id === batchId);
    if (idx !== -1) {
      db.pharmacy_batches[idx].stock_qty = Math.max(0, (db.pharmacy_batches[idx].stock_qty || 0) - qty);
      saveDb(db);
      return db.pharmacy_batches[idx];
    }
    return null;
  },
};

// ======================== PROCUREMENT & INVENTORY ========================
export const mockInventoryService = {
  listVendors: async () => {
    const db = getDb();
    return db.vendors;
  },

  createVendor: async (data: any) => {
    const db = getDb();
    const newVend = { id: uid('vend'), ...data };
    db.vendors.push(newVend);
    saveDb(db);
    return newVend;
  },

  listPOs: async () => {
    const db = getDb();
    return db.purchase_orders;
  },

  createPO: async (data: any) => {
    const db = getDb();
    const newPO = {
      id: uid('po'),
      po_no: `PO-KRN-2026-${(db.purchase_orders.length + 45).toString()}`,
      order_date: new Date().toISOString().split('T')[0],
      status: 'Draft Approved',
      ...data,
    };
    db.purchase_orders.unshift(newPO);
    saveDb(db);
    return newPO;
  },

  listTransfers: async () => {
    const db = getDb();
    return db.transfers;
  },

  createTransfer: async (data: any) => {
    const db = getDb();
    const newTr = {
      id: uid('tr'),
      transfer_no: `TR-2026-${(db.transfers.length + 20).toString()}`,
      dispatch_date: new Date().toISOString().split('T')[0],
      status: 'In Transit',
      ...data,
    };
    db.transfers.unshift(newTr);
    saveDb(db);
    return newTr;
  },
};

// ======================== HRMS, ROSTER & COMMISSIONS ========================
export const mockHrmsService = {
  listRoster: async () => {
    const db = getDb();
    return db.duty_roster;
  },

  listCommissions: async () => {
    const db = getDb();
    return db.commissions;
  },

  approveCommission: async (id: string) => {
    const db = getDb();
    const idx = db.commissions.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.commissions[idx].status = 'Disbursed / Paid';
      saveDb(db);
      return db.commissions[idx];
    }
    return null;
  },
};

// ======================== CASHIER SHIFTS ========================
export const mockShiftService = {
  listShifts: async () => {
    const db = getDb();
    return db.cashier_shifts;
  },

  closeShift: async (id: string, data: any) => {
    const db = getDb();
    const idx = db.cashier_shifts.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.cashier_shifts[idx] = {
        ...db.cashier_shifts[idx],
        ...data,
        status: 'Closed & Reconciled',
        close_time: new Date().toLocaleTimeString(),
      };
      saveDb(db);
      return db.cashier_shifts[idx];
    }
    return null;
  },
};

// ======================== FORENSIC AUDIT TRAIL ========================
export const mockAuditService = {
  list: async () => {
    const db = getDb();
    return db.audit_logs;
  },
};

// ======================== REPORTS & DASHBOARD ========================
export const mockReportsService = {
  dashboard: async () => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    const todayBills = db.bills.filter((b) => b.bill_date === today && b.status !== 'Cancelled');
    const totalRev = todayBills.reduce((acc, b) => acc + (b.amount_paid || 0), 0);
    const cash = todayBills.reduce((acc, b) => acc + (b.cash_amount || 0), 0);
    const upi = todayBills.reduce((acc, b) => acc + (b.upi_amount || 0), 0);
    const card = todayBills.reduce((acc, b) => acc + (b.card_amount || 0), 0);

    const waiting = db.appointments.filter((a) => a.status === 'Waiting').length;
    const inConsult = db.appointments.filter((a) => a.status === 'In-Consult' || a.status === 'Called').length;
    const completed = db.appointments.filter((a) => a.status === 'Completed').length;

    return {
      today_patients: db.appointments.length,
      today_revenue: totalRev > 0 ? totalRev : 42500,
      cash_collections: cash > 0 ? cash : 18000,
      upi_collections: upi > 0 ? upi : 21000,
      card_collections: card > 0 ? card : 3500,
      waiting_count: waiting,
      in_consult_count: inConsult,
      completed_count: completed,
      top_doctors: [
        { name: 'Dr. Ananya Nair', department: 'Dermatology & Cosmetology', patients: 8, revenue: 26000 },
        { name: 'Dr. Rahul Menon', department: 'General Medicine & Wellness', patients: 6, revenue: 16500 },
      ],
    };
  },

  trend: async () => {
    return [
      { day: 'Mon', revenue: 32000, patients: 12 },
      { day: 'Tue', revenue: 28500, patients: 10 },
      { day: 'Wed', revenue: 41000, patients: 15 },
      { day: 'Thu', revenue: 36000, patients: 13 },
      { day: 'Fri', revenue: 48000, patients: 18 },
      { day: 'Sat', revenue: 54000, patients: 22 },
      { day: 'Today', revenue: 42500, patients: 14 },
    ];
  },

  collection: async (params?: any) => {
    const db = getDb();
    let records = db.bills.filter((b) => b.status !== 'Cancelled');
    if (params?.payment_mode && params.payment_mode !== 'all') {
      if (params.payment_mode === 'Cash') records = records.filter((r) => r.cash_amount > 0);
      if (params.payment_mode === 'UPI') records = records.filter((r) => r.upi_amount > 0);
      if (params.payment_mode === 'Card') records = records.filter((r) => r.card_amount > 0);
    }
    return records;
  },

  billing: async () => {
    const db = getDb();
    return db.bills;
  },

  doctor: async () => {
    return [
      { name: 'Dr. Ananya Nair', department: 'Dermatology & Cosmetology', visits: 8, collection: 26000 },
      { name: 'Dr. Rahul Menon', department: 'General Outpatient (OP)', visits: 6, collection: 16500 },
    ];
  },
};
