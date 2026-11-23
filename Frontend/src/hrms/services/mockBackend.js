import axios from 'axios';
import initialData from '../data/initialData.json';

const STORAGE_KEY = 'heal_hrms_storage_v2';
const AUTH_KEY = 'heal_hrms_auth_user_v2';

// 4 Preset Demo HR Accounts (1 HR Manager + 3 HR Branch Specialists/Executives)
export const DEMO_HR_ACCOUNTS = [
  {
    id: 101,
    full_name: 'Dr. Rachel Adams',
    role: 'HR Manager',
    job_title: 'Network HR Director & People Manager',
    email: 'rachel.adams@healclinic.com',
    branch_id: null,
    branch_name: 'All Clinic Branches (HQ)',
    branch_code: 'HQ-GLOBAL',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    account_badge: 'HR Manager (Super Admin)',
    badge_color: 'bg-indigo-600 text-white',
    description: 'Full network oversight across all 3 clinic branches. Complete administrative rights for payroll approval, cross-branch staff transfers, and executive analytics.',
    is_manager: true
  },
  {
    id: 102,
    full_name: 'Emma Watson',
    role: 'HR Specialist',
    job_title: 'Senior HR Specialist - Aesthetic Division',
    email: 'emma.watson@healclinic.com',
    branch_id: 1,
    branch_name: 'MediAesthetic Laser & Skin Clinic',
    branch_code: 'BR-AESTH-01',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    account_badge: 'HR Specialist (Aesthetics)',
    badge_color: 'bg-purple-600 text-white',
    description: 'Specialized in cosmetic practitioner onboarding, laser safety licensing, and aesthetic procedure commission calculation.',
    is_manager: false
  },
  {
    id: 103,
    full_name: 'Marcus Vance',
    role: 'HR Generalist',
    job_title: 'HR Generalist - Urgent Care Division',
    email: 'marcus.vance@healclinic.com',
    branch_id: 2,
    branch_name: 'Downtown Urgent & Family Medicine',
    branch_code: 'BR-GEN-02',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    account_badge: 'HR Generalist (Urgent Care)',
    badge_color: 'bg-blue-600 text-white',
    description: 'Directs 12-hour urgent care shifts, physician coverage rotas, clinical nurse staffing, and OPD consultation revenue share.',
    is_manager: false
  },
  {
    id: 104,
    full_name: 'Chloe Bennett',
    role: 'HR Executive',
    job_title: 'HR Operations Executive - Pediatrics',
    email: 'chloe.bennett@healclinic.com',
    branch_id: 3,
    branch_name: 'Westside Pediatric & Family Care',
    branch_code: 'BR-GEN-03',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    account_badge: 'HR Executive (Pediatrics)',
    badge_color: 'bg-emerald-600 text-white',
    description: 'Coordinates pediatric physician rosters, BLS/PALS credential compliance, and mandatory substitute doctor coverage for family care.',
    is_manager: false
  }
];

// Helper: load state from localStorage or seed
export function getLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      let needsSave = false;
      if (!parsed.holidays) { parsed.holidays = initialData.holidays || []; needsSave = true; }
      if (!parsed.transfers) { parsed.transfers = initialData.transfers || []; needsSave = true; }
      if (!parsed.branch_managers) { parsed.branch_managers = initialData.branch_managers || []; needsSave = true; }
      if (!parsed.performance_ratings) { parsed.performance_ratings = initialData.performance_ratings || []; needsSave = true; }
      if (!parsed.regularization_requests) { parsed.regularization_requests = initialData.regularization_requests || []; needsSave = true; }
      if (!parsed.shift_swap_requests) { parsed.shift_swap_requests = initialData.shift_swap_requests || []; needsSave = true; }
      if (!parsed.sops) { parsed.sops = initialData.sops || []; needsSave = true; }
      if (!parsed.onboarding_training) { parsed.onboarding_training = initialData.onboarding_training || []; needsSave = true; }
      if (!parsed.announcements) { parsed.announcements = initialData.announcements || []; needsSave = true; }
      if (needsSave) saveLocalState(parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Failed reading localStorage, using initial seed', e);
  }
  // Initialize with initialData clone
  const fresh = JSON.parse(JSON.stringify(initialData));
  saveLocalState(fresh);
  return fresh;
}

// Helper: save state to localStorage
export function saveLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed writing to localStorage', e);
  }
}

// Reset database back to pristine initial seed
export function resetLocalState() {
  const fresh = JSON.parse(JSON.stringify(initialData));
  saveLocalState(fresh);
  return fresh;
}

// Auth state management
export function getAuthUser() {
  try {
    const sessionRaw = sessionStorage.getItem(AUTH_KEY);
    if (sessionRaw) {
      return JSON.parse(sessionRaw);
    }
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      sessionStorage.setItem(AUTH_KEY, raw);
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to get auth user', e);
  }
  return null;
}

export function setAuthUser(user) {
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_KEY);
    }
  } catch (e) {
    console.error('Failed to set auth user', e);
  }
}

// Branch ID resolver helper supporting both integer IDs and string slugs
export function parseBranchId(val) {
  if (val === undefined || val === null || val === '') return null;
  if (val === 'krn-branch-001' || val === '1' || val === 1) return 1;
  if (val === 'clt-branch-002' || val === '2' || val === 2) return 2;
  if (val === 'wyd-branch-003' || val === '3' || val === 3) return 3;
  if (val === 'all' || val === '4' || val === 4) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

// Setup Axios mock adapter so all frontend axios requests execute purely client-side
let originalAdapter = axios.defaults.adapter;

export function setupMockBackend() {
  if (!originalAdapter) {
    originalAdapter = axios.getAdapter ? axios.getAdapter(axios.defaults.adapter) : axios.defaults.adapter;
  }

  axios.defaults.adapter = async (config) => {
    let fullUrl = config.url || '';
    if (config.baseURL && fullUrl.startsWith(config.baseURL)) {
      fullUrl = fullUrl.slice(config.baseURL.length);
    }
    try {
      if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
        const parsed = new URL(fullUrl);
        fullUrl = parsed.pathname + parsed.search;
      }
    } catch (e) {}

    const [path, queryString] = fullUrl.split('?');

    // Only intercept HRMS specific routes; pass all clinical, patient, billing, and auth login calls to real server
    const isHrmsRoute = (
      path.startsWith('/api/hrms') ||
      path.startsWith('/api/organization') ||
      path.startsWith('/api/dashboard/stats') ||
      path.startsWith('/api/departments') ||
      path.startsWith('/api/designations') ||
      path.startsWith('/api/employees') ||
      path.startsWith('/api/attendance') ||
      path.startsWith('/api/rosters') ||
      path.startsWith('/api/leaves') ||
      path.startsWith('/api/payroll') ||
      path.startsWith('/api/credentials') ||
      path.startsWith('/api/recruitment') ||
      path.startsWith('/api/reports/analytics') ||
      path.startsWith('/api/transfers') ||
      path.startsWith('/api/holidays') ||
      path.startsWith('/api/performance') ||
      path.startsWith('/api/shifts/swaps') ||
      path.startsWith('/api/sops') ||
      path.startsWith('/api/onboarding') ||
      path.startsWith('/api/announcements') ||
      path.startsWith('/api/auth/users') ||
      path.startsWith('/api/branches') ||
      (path === '/api/auth/me' && (!config.headers || !config.headers['Authorization']))
    );

    if (!isHrmsRoute && originalAdapter) {
      return originalAdapter(config);
    }

    const method = (config.method || 'get').toLowerCase();
    const queryParams = new URLSearchParams(queryString || '');
    if (config.params) {
      Object.entries(config.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) queryParams.set(k, v);
      });
    }

    // Parse body if present
    let body = {};
    if (config.data) {
      try {
        body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      } catch (e) {
        body = config.data;
      }
    }

    // Small simulated latency for realistic feeling
    await new Promise((r) => setTimeout(r, 40));

    const state = getLocalState();

    try {
      // -------------------- AUTH --------------------
      if (path === '/api/auth/me' && method === 'get') {
        const empId = queryParams.get('emp_id');
        let user = null;
        if (empId) {
          user = state.employees.find((e) => e.id === Number(empId)) ||
                 DEMO_HR_ACCOUNTS.find((u) => u.id === Number(empId));
        } else {
          user = getAuthUser() || DEMO_HR_ACCOUNTS[0];
        }
        return mockResponse(200, user, config);
      }

      if (path === '/api/auth/users' && method === 'get') {
        // Return both demo HR accounts and employees
        return mockResponse(200, state.employees, config);
      }

      // -------------------- DASHBOARD STATS --------------------
      if (path === '/api/dashboard/stats' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        const todayStr = new Date().toISOString().split('T')[0];

        let emps = state.employees.filter((e) => e.status === 'Active');
        if (branchId) emps = emps.filter((e) => e.branch_id === branchId);

        let atts = state.attendance.filter((a) => a.date === todayStr);
        if (branchId) atts = atts.filter((a) => a.branch_id === branchId);
        const presentCount = atts.filter((a) => a.status === 'Present' || a.status === 'Late').length;
        const lateCount = atts.filter((a) => a.status === 'Late').length;

        let leaves = state.leaves.filter((l) => l.status === 'Pending');
        if (branchId) leaves = leaves.filter((l) => l.branch_id === branchId);
        const pendingLeaves = leaves.length;

        // Credentials expiring soon (within 30 days)
        const today = new Date();
        let creds = state.credentials;
        if (branchId) {
          const branchEmpIds = new Set(state.employees.filter(e => e.branch_id === branchId).map(e => e.id));
          creds = creds.filter(c => branchEmpIds.has(c.employee_id));
        }
        const expiringSoonCount = creds.filter(c => {
          const exp = new Date(c.expiry_date);
          const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
          return diffDays <= 30;
        }).length;

        const branchDistribution = state.branches.map((b) => ({
          branch_id: b.id,
          name: b.name,
          code: b.code,
          type: b.branch_type,
          employee_count: state.employees.filter((e) => e.branch_id === b.id && e.status === 'Active').length
        }));

        let recentLeaves = [...state.leaves].reverse().slice(0, 5);

        let shiftsToday = state.rosters.filter((r) => r.shift_date === todayStr);
        if (branchId) shiftsToday = shiftsToday.filter((r) => r.branch_id === branchId);

        return mockResponse(200, {
          total_employees: emps.length,
          present_today: presentCount,
          late_today: lateCount,
          pending_leaves: pendingLeaves,
          expiring_credentials_soon: expiringSoonCount,
          branch_distribution: branchDistribution,
          recent_leaves: recentLeaves,
          shifts_today: shiftsToday
        }, config);
      }

      // -------------------- BRANCHES --------------------
      if (path === '/api/branches' && method === 'get') {
        const enriched = state.branches.map((b) => ({
          ...b,
          employee_count: state.employees.filter((e) => e.branch_id === b.id).length
        }));
        return mockResponse(200, enriched, config);
      }

      if (path === '/api/branches' && method === 'post') {
        const nextId = Math.max(0, ...state.branches.map((b) => b.id)) + 1;
        const newBranch = {
          id: nextId,
          name: body.name,
          code: body.code,
          branch_type: body.branch_type || 'General Medicine',
          address: body.address || '',
          city: body.city || '',
          phone: body.phone || '',
          email: body.email || '',
          operating_hours: body.operating_hours || '08:00 AM - 08:00 PM',
          is_active: true,
          employee_count: 0
        };
        state.branches.push(newBranch);
        saveLocalState(state);
        return mockResponse(201, newBranch, config);
      }

      const branchMatch = path.match(/^\/api\/branches\/([a-zA-Z0-9_-]+)$/);
      if (branchMatch && method === 'put') {
        const rawId = branchMatch[1];
        const id = parseBranchId(rawId) || Number(rawId) || rawId;
        const idx = state.branches.findIndex((b) => b.id === id || String(b.id) === String(rawId));
        if (idx >= 0) {
          state.branches[idx] = { ...state.branches[idx], ...body };
          saveLocalState(state);
          return mockResponse(200, state.branches[idx], config);
        }
        return mockResponse(404, { error: 'Branch not found' }, config);
      }

      if (branchMatch && method === 'delete') {
        const rawId = branchMatch[1];
        const id = parseBranchId(rawId) || Number(rawId) || rawId;
        const empCount = state.employees.filter((e) => e.branch_id === id || String(e.branch_id) === String(rawId)).length;
        if (empCount > 0) {
          return mockResponse(400, { error: `Cannot delete branch with ${empCount} active employees.` }, config);
        }
        state.branches = state.branches.filter((b) => b.id !== id && String(b.id) !== String(rawId));
        saveLocalState(state);
        return mockResponse(200, { message: 'Branch deleted' }, config);
      }

      // -------------------- ORGANIZATION & BRANCH EXTENSIONS --------------------
      // Holidays & Weekly Offs
      if (path === '/api/organization/holidays' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let list = state.holidays || [];
        if (branchId) {
          list = list.filter((h) => h.is_org_wide || h.branch_id === branchId);
        }
        return mockResponse(200, list, config);
      }

      if (path === '/api/organization/holidays' && method === 'post') {
        if (!state.holidays) state.holidays = [];
        const nextId = Math.max(0, ...state.holidays.map((h) => h.id)) + 1;
        const branch = body.branch_id ? state.branches.find((b) => b.id === Number(body.branch_id)) : null;
        const newHol = {
          id: nextId,
          title: body.title,
          date: body.date,
          branch_id: body.branch_id ? Number(body.branch_id) : null,
          branch_name: branch ? branch.name : 'All Branches (Org-wide)',
          holiday_type: body.holiday_type || 'National Holiday',
          is_org_wide: !body.branch_id,
          affects_payroll: body.affects_payroll !== false
        };
        state.holidays.push(newHol);
        saveLocalState(state);
        return mockResponse(201, newHol, config);
      }

      const holDelMatch = path.match(/^\/api\/organization\/holidays\/(\d+)$/);
      if (holDelMatch && method === 'delete') {
        const id = Number(holDelMatch[1]);
        state.holidays = (state.holidays || []).filter((h) => h.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Holiday deleted' }, config);
      }

      if (path === '/api/organization/weekly-offs' && method === 'put') {
        const branchId = Number(body.branch_id);
        const branch = state.branches.find((b) => b.id === branchId);
        if (branch) {
          branch.weekly_offs = body.weekly_offs || ['Sunday'];
          saveLocalState(state);
          return mockResponse(200, branch, config);
        }
        return mockResponse(404, { error: 'Branch not found' }, config);
      }

      // Employee Branch Transfers
      if (path === '/api/organization/transfers' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let list = state.transfers || [];
        if (branchId) {
          list = list.filter((t) => t.from_branch_id === branchId || t.to_branch_id === branchId);
        }
        return mockResponse(200, list, config);
      }

      if (path === '/api/organization/transfers' && method === 'post') {
        if (!state.transfers) state.transfers = [];
        const nextId = Math.max(0, ...state.transfers.map((t) => t.id)) + 1;
        const emp = state.employees.find((e) => e.id === Number(body.employee_id));
        const fromBranch = state.branches.find((b) => b.id === (emp ? emp.branch_id : Number(body.from_branch_id)));
        const toBranch = state.branches.find((b) => b.id === Number(body.to_branch_id));
        const dept = state.departments.find((d) => d.id === Number(body.department_id));
        const mgr = body.new_reporting_manager_id ? state.employees.find((e) => e.id === Number(body.new_reporting_manager_id)) : null;

        const newTrans = {
          id: nextId,
          employee_id: emp ? emp.id : Number(body.employee_id),
          employee_name: emp ? emp.full_name : 'Staff Member',
          employee_code: emp ? emp.employee_code : 'EMP-000',
          from_branch_id: fromBranch ? fromBranch.id : 1,
          from_branch_name: fromBranch ? fromBranch.name : 'Origin Branch',
          to_branch_id: toBranch ? toBranch.id : 2,
          to_branch_name: toBranch ? toBranch.name : 'Destination Branch',
          department_id: dept ? dept.id : (emp ? emp.department_id : 1),
          department_name: dept ? dept.name : 'General',
          new_reporting_manager_id: mgr ? mgr.id : null,
          new_reporting_manager_name: mgr ? mgr.full_name : 'Department Head',
          transfer_date: body.transfer_date || new Date().toISOString().split('T')[0],
          effective_date: body.effective_date || body.transfer_date || new Date().toISOString().split('T')[0],
          reason: body.reason || 'Operational workforce reallocation',
          status: 'Pending Approval',
          approved_by: null,
          approved_at: null,
          notes: body.notes || ''
        };
        state.transfers.unshift(newTrans);
        saveLocalState(state);
        return mockResponse(201, newTrans, config);
      }

      const transApproveMatch = path.match(/^\/api\/organization\/transfers\/(\d+)\/approve$/);
      if (transApproveMatch && method === 'post') {
        const id = Number(transApproveMatch[1]);
        const transfer = (state.transfers || []).find((t) => t.id === id);
        if (transfer) {
          transfer.status = 'Approved';
          transfer.approved_by = body.approved_by || 'Dr. Rachel Adams (HR Manager)';
          transfer.approved_at = new Date().toISOString();

          // Automatically update employee active branch, dept and manager
          const empIdx = state.employees.findIndex((e) => e.id === transfer.employee_id);
          if (empIdx >= 0) {
            const toBranch = state.branches.find((b) => b.id === transfer.to_branch_id);
            const toDept = state.departments.find((d) => d.id === transfer.department_id);
            state.employees[empIdx].branch_id = transfer.to_branch_id;
            state.employees[empIdx].branch_name = toBranch ? toBranch.name : state.employees[empIdx].branch_name;
            state.employees[empIdx].branch_code = toBranch ? toBranch.code : state.employees[empIdx].branch_code;
            if (toDept) {
              state.employees[empIdx].department_id = toDept.id;
              state.employees[empIdx].department_name = toDept.name;
            }
          }
          saveLocalState(state);
          return mockResponse(200, { message: 'Transfer approved and active employee branch updated', transfer }, config);
        }
        return mockResponse(404, { error: 'Transfer not found' }, config);
      }

      const transRejectMatch = path.match(/^\/api\/organization\/transfers\/(\d+)\/reject$/);
      if (transRejectMatch && method === 'post') {
        const id = Number(transRejectMatch[1]);
        const transfer = (state.transfers || []).find((t) => t.id === id);
        if (transfer) {
          transfer.status = 'Rejected';
          transfer.notes = body.rejection_reason ? `${transfer.notes || ''} | Rejection: ${body.rejection_reason}` : transfer.notes;
          saveLocalState(state);
          return mockResponse(200, { message: 'Transfer rejected', transfer }, config);
        }
        return mockResponse(404, { error: 'Transfer not found' }, config);
      }

      // Branch Manager Governance & Assignment
      if (path === '/api/organization/managers' && method === 'get') {
        return mockResponse(200, state.branch_managers || [], config);
      }

      if (path === '/api/organization/managers/assign' && method === 'post') {
        if (!state.branch_managers) state.branch_managers = [];
        const branchId = Number(body.branch_id);
        const managerId = Number(body.manager_employee_id);
        const branch = state.branches.find((b) => b.id === branchId);
        const emp = state.employees.find((e) => e.id === managerId);
        const todayStr = new Date().toISOString().split('T')[0];

        // Archive previous active manager
        state.branch_managers.forEach((m) => {
          if (m.branch_id === branchId && m.is_active) {
            m.is_active = false;
            m.end_date = todayStr;
          }
        });

        const nextId = Math.max(0, ...state.branch_managers.map((m) => m.id)) + 1;
        const newAssignment = {
          id: nextId,
          branch_id: branchId,
          branch_name: branch ? branch.name : 'Branch',
          branch_code: branch ? branch.code : 'BR-01',
          manager_employee_id: managerId,
          manager_name: emp ? emp.full_name : 'Staff Member',
          manager_role: emp ? (emp.job_title || emp.role) : 'Branch Manager',
          start_date: body.start_date || todayStr,
          end_date: null,
          is_active: true,
          assigned_by: body.assigned_by || 'Dr. Rachel Adams (HR Manager)',
          responsibilities: body.responsibilities || 'Branch staff governance, roster approvals, local compliance, and operational reports.'
        };

        state.branch_managers.unshift(newAssignment);
        if (branch) {
          branch.manager_id = managerId;
          branch.manager_name = emp ? emp.full_name : '';
        }
        saveLocalState(state);
        return mockResponse(201, newAssignment, config);
      }

      // Branch Management Reports
      if (path === '/api/organization/reports' && method === 'get') {
        const branchStats = state.branches.map((b) => {
          const staff = state.employees.filter((e) => e.branch_id === b.id && e.status === 'Active');
          const holidays = (state.holidays || []).filter((h) => h.is_org_wide || h.branch_id === b.id);
          const transfersIn = (state.transfers || []).filter((t) => t.to_branch_id === b.id && t.status === 'Approved').length;
          const transfersOut = (state.transfers || []).filter((t) => t.from_branch_id === b.id && t.status === 'Approved').length;
          const activeMgr = (state.branch_managers || []).find((m) => m.branch_id === b.id && m.is_active);
          const branchAtt = state.attendance.filter((a) => a.branch_id === b.id);
          const presentCount = branchAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
          const attRate = branchAtt.length > 0 ? Math.round((presentCount / branchAtt.length) * 100) : 96;
          const pendingLeaves = state.leaves.filter((l) => l.branch_id === b.id && l.status === 'Pending').length;

          return {
            branch_id: b.id,
            branch_name: b.name,
            branch_code: b.code,
            branch_type: b.branch_type,
            operating_hours: b.operating_hours,
            manager_name: activeMgr ? activeMgr.manager_name : (b.manager_name || 'Unassigned'),
            manager_role: activeMgr ? activeMgr.manager_role : 'Branch Lead',
            active_headcount: staff.length,
            weekly_offs: b.weekly_offs || ['Sunday'],
            total_holidays: holidays.length,
            working_days_estimated: 30 - ((b.weekly_offs || ['Sunday']).length * 4) - holidays.length,
            transfers_inflow: transfersIn,
            transfers_outflow: transfersOut,
            attendance_compliance_rate: attRate,
            pending_leave_requests: pendingLeaves
          };
        });
        return mockResponse(200, { branch_metrics: branchStats }, config);
      }

      // -------------------- DEPARTMENTS --------------------
      if (path === '/api/departments' && method === 'get') {
        const enriched = state.departments.map((d) => {
          const branch = state.branches.find((b) => b.id === d.branch_id);
          return {
            ...d,
            branch_name: branch ? branch.name : 'All Branches',
            employee_count: state.employees.filter((e) => e.department_id === d.id).length
          };
        });
        return mockResponse(200, enriched, config);
      }

      if (path === '/api/departments' && method === 'post') {
        const nextId = Math.max(0, ...state.departments.map((d) => d.id)) + 1;
        const branch = state.branches.find((b) => b.id === Number(body.branch_id));
        const newDept = {
          id: nextId,
          name: body.name,
          code: body.code,
          branch_id: body.branch_id ? Number(body.branch_id) : null,
          branch_name: branch ? branch.name : 'All Branches',
          description: body.description || '',
          employee_count: 0
        };
        state.departments.push(newDept);
        saveLocalState(state);
        return mockResponse(201, newDept, config);
      }

      const deptMatch = path.match(/^\/api\/departments\/(\d+)$/);
      if (deptMatch && method === 'delete') {
        const id = Number(deptMatch[1]);
        state.departments = state.departments.filter((d) => d.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Department deleted' }, config);
      }

      // -------------------- DESIGNATIONS --------------------
      if (path === '/api/designations' && method === 'get') {
        const enriched = state.designations.map((d) => {
          const dept = state.departments.find((dep) => dep.id === d.department_id);
          return {
            ...d,
            department_name: dept ? dept.name : 'General'
          };
        });
        return mockResponse(200, enriched, config);
      }

      if (path === '/api/designations' && method === 'post') {
        const nextId = Math.max(0, ...state.designations.map((d) => d.id)) + 1;
        const dept = state.departments.find((dep) => dep.id === Number(body.department_id));
        const newDesig = {
          id: nextId,
          title: body.title,
          department_id: body.department_id ? Number(body.department_id) : null,
          department_name: dept ? dept.name : 'General',
          category: body.category || 'Clinical',
          min_salary: Number(body.min_salary) || 4000,
          max_salary: Number(body.max_salary) || 9000
        };
        state.designations.push(newDesig);
        saveLocalState(state);
        return mockResponse(201, newDesig, config);
      }

      const desigMatch = path.match(/^\/api\/designations\/(\d+)$/);
      if (desigMatch && method === 'delete') {
        const id = Number(desigMatch[1]);
        state.designations = state.designations.filter((d) => d.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Designation deleted' }, config);
      }

      // -------------------- EMPLOYEES --------------------
      if (path === '/api/employees' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let emps = state.employees;
        if (branchId) {
          emps = emps.filter((e) => e.branch_id === branchId);
        }
        return mockResponse(200, emps, config);
      }

      if (path === '/api/employees' && method === 'post') {
        const nextId = Math.max(0, ...state.employees.map((e) => e.id)) + 1;
        const branch = state.branches.find((b) => b.id === Number(body.branch_id));
        const dept = state.departments.find((d) => d.id === Number(body.department_id));
        const desig = state.designations.find((d) => d.id === Number(body.designation_id));
        const codeNum = String(nextId).padStart(3, '0');

        const newEmp = {
          id: nextId,
          employee_code: body.employee_code || `EMP-${codeNum}`,
          first_name: body.first_name,
          last_name: body.last_name,
          full_name: `${body.first_name} ${body.last_name}`,
          email: body.email,
          phone: body.phone || '+1 (555) 000-0000',
          branch_id: Number(body.branch_id),
          branch_name: branch ? branch.name : 'Unknown Branch',
          branch_code: branch ? branch.code : 'BR-UNK',
          department_id: Number(body.department_id),
          department_name: dept ? dept.name : 'General',
          designation_id: Number(body.designation_id),
          designation_title: desig ? desig.title : 'Staff',
          role: body.role || 'Staff',
          job_title: body.job_title || (desig ? desig.title : 'Staff'),
          hire_date: body.hire_date || new Date().toISOString().split('T')[0],
          status: 'Active',
          compensation_model: body.compensation_model || 'Base Only',
          base_salary: Number(body.base_salary) || 5000,
          aesthetic_commission_rate: Number(body.aesthetic_commission_rate) || 0,
          opd_consultation_rate: Number(body.opd_consultation_rate) || 0,
          avatar_url: body.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          credentials_count: 0,
          is_doctor: body.role === 'Doctor' || (desig && desig.title.toLowerCase().includes('physician') || desig && desig.title.toLowerCase().includes('dermatologist'))
        };
        state.employees.push(newEmp);
        saveLocalState(state);
        return mockResponse(201, newEmp, config);
      }

      const empDetailMatch = path.match(/^\/api\/employees\/(\d+)$/);
      if (empDetailMatch && method === 'get') {
        const id = Number(empDetailMatch[1]);
        const emp = state.employees.find((e) => e.id === id);
        if (emp) return mockResponse(200, emp, config);
        return mockResponse(404, { error: 'Employee not found' }, config);
      }

      if (empDetailMatch && method === 'put') {
        const id = Number(empDetailMatch[1]);
        const idx = state.employees.findIndex((e) => e.id === id);
        if (idx >= 0) {
          const branch = body.branch_id ? state.branches.find((b) => b.id === Number(body.branch_id)) : null;
          const dept = body.department_id ? state.departments.find((d) => d.id === Number(body.department_id)) : null;
          const desig = body.designation_id ? state.designations.find((d) => d.id === Number(body.designation_id)) : null;

          state.employees[idx] = {
            ...state.employees[idx],
            ...body,
            full_name: `${body.first_name || state.employees[idx].first_name} ${body.last_name || state.employees[idx].last_name}`,
            branch_name: branch ? branch.name : state.employees[idx].branch_name,
            branch_code: branch ? branch.code : state.employees[idx].branch_code,
            department_name: dept ? dept.name : state.employees[idx].department_name,
            designation_title: desig ? desig.title : state.employees[idx].designation_title
          };
          saveLocalState(state);
          return mockResponse(200, state.employees[idx], config);
        }
        return mockResponse(404, { error: 'Employee not found' }, config);
      }

      if (empDetailMatch && method === 'delete') {
        const id = Number(empDetailMatch[1]);
        state.employees = state.employees.filter((e) => e.id !== id);
        // Also cleanup dependent records
        state.credentials = state.credentials.filter((c) => c.employee_id !== id);
        state.attendance = state.attendance.filter((a) => a.employee_id !== id);
        state.rosters = state.rosters.filter((r) => r.employee_id !== id);
        state.leaves = state.leaves.filter((l) => l.employee_id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Employee deleted' }, config);
      }

      // -------------------- ATTENDANCE --------------------
      if (path === '/api/attendance' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        const dateFilter = queryParams.get('date');
        let atts = [...state.attendance];
        if (branchId) atts = atts.filter((a) => a.branch_id === branchId);
        if (dateFilter) atts = atts.filter((a) => a.date === dateFilter);
        return mockResponse(200, atts, config);
      }

      if (path === '/api/attendance/punch' && method === 'post') {
        const empId = Number(body.employee_id);
        const emp = state.employees.find((e) => e.id === empId);
        if (!emp) return mockResponse(404, { error: 'Employee not found' }, config);

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

        let att = state.attendance.find((a) => a.employee_id === empId && a.date === todayStr);

        if (!att) {
          // Punch In
          const nextId = Math.max(0, ...state.attendance.map((a) => a.id)) + 1;
          const isLate = timeStr > '08:15';
          att = {
            id: nextId,
            employee_id: empId,
            employee_name: emp.full_name,
            employee_code: emp.employee_code,
            branch_id: emp.branch_id,
            branch_name: emp.branch_name,
            date: todayStr,
            check_in: timeStr,
            check_out: null,
            status: isLate ? 'Late' : 'Present',
            total_hours: 0,
            overtime_hours: 0,
            notes: isLate ? 'Punched in after scheduled start' : 'On-time web punch'
          };
          state.attendance.unshift(att);
          saveLocalState(state);
          return mockResponse(200, { message: `Punched in successfully at ${timeStr}`, attendance: att }, config);
        } else if (!att.check_out) {
          // Punch Out
          att.check_out = timeStr;
          // Calculate hours
          const [inH, inM] = att.check_in.split(':').map(Number);
          const [outH, outM] = timeStr.split(':').map(Number);
          const diffMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
          const totalHours = Math.round((diffMinutes / 60) * 10) / 10;
          att.total_hours = totalHours;
          att.overtime_hours = totalHours > 8 ? Math.round((totalHours - 8) * 10) / 10 : 0;
          att.notes = `${att.notes || ''} | Punched out at ${timeStr}`.trim();
          saveLocalState(state);
          return mockResponse(200, { message: `Punched out successfully at ${timeStr}. Total: ${totalHours} hrs`, attendance: att }, config);
        } else {
          return mockResponse(400, { error: 'Already completed attendance punch for today.' }, config);
        }
      }

      if (path === '/api/attendance/manual' && method === 'post') {
        const empId = Number(body.employee_id);
        const emp = state.employees.find((e) => e.id === empId);
        if (!emp) return mockResponse(404, { error: 'Employee not found' }, config);

        const nextId = Math.max(0, ...state.attendance.map((a) => a.id)) + 1;
        const inTime = body.check_in || '08:00';
        const outTime = body.check_out || '17:00';
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);
        const diffMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
        const totalHours = Math.round((diffMinutes / 60) * 10) / 10;

        const record = {
          id: nextId,
          employee_id: empId,
          employee_name: emp.full_name,
          employee_code: emp.employee_code,
          branch_id: emp.branch_id,
          branch_name: emp.branch_name,
          date: body.date,
          check_in: inTime,
          check_out: outTime,
          status: body.status || 'Present',
          total_hours: totalHours,
          overtime_hours: totalHours > 8 ? Math.round((totalHours - 8) * 10) / 10 : 0,
          notes: body.notes || 'Manual HR adjustment'
        };
        state.attendance.unshift(record);
        saveLocalState(state);
        return mockResponse(201, record, config);
      }

      const attMatch = path.match(/^\/api\/attendance\/(\d+)$/);
      if (attMatch && method === 'delete') {
        const id = Number(attMatch[1]);
        state.attendance = state.attendance.filter((a) => a.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Attendance deleted' }, config);
      }

      // -------------------- ROSTERS & SHIFTS --------------------
      if (path === '/api/rosters' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let list = [...state.rosters];
        if (branchId) list = list.filter((r) => r.branch_id === branchId);
        return mockResponse(200, list, config);
      }

      if (path === '/api/rosters' && method === 'post') {
        const empId = Number(body.employee_id);
        const emp = state.employees.find((e) => e.id === empId);
        const branch = state.branches.find((b) => b.id === Number(body.branch_id || emp?.branch_id));

        const nextId = Math.max(0, ...state.rosters.map((r) => r.id)) + 1;
        const newRoster = {
          id: nextId,
          employee_id: empId,
          employee_name: emp ? emp.full_name : 'Staff Member',
          branch_id: branch ? branch.id : (emp ? emp.branch_id : 1),
          branch_name: branch ? branch.name : (emp ? emp.branch_name : 'Clinic'),
          shift_date: body.shift_date,
          start_time: body.start_time || '08:00',
          end_time: body.end_time || '16:00',
          shift_type: body.shift_type || 'Morning',
          role_for_shift: body.role_for_shift || (emp ? emp.job_title : 'Practitioner'),
          notes: body.notes || '',
          is_on_call: Boolean(body.is_on_call)
        };
        state.rosters.push(newRoster);
        saveLocalState(state);
        return mockResponse(201, newRoster, config);
      }

      const rosterMatch = path.match(/^\/api\/rosters\/(\d+)$/);
      if (rosterMatch && method === 'put') {
        const id = Number(rosterMatch[1]);
        const idx = state.rosters.findIndex((r) => r.id === id);
        if (idx >= 0) {
          state.rosters[idx] = { ...state.rosters[idx], ...body };
          saveLocalState(state);
          return mockResponse(200, state.rosters[idx], config);
        }
        return mockResponse(404, { error: 'Roster not found' }, config);
      }

      if (rosterMatch && method === 'delete') {
        const id = Number(rosterMatch[1]);
        state.rosters = state.rosters.filter((r) => r.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Roster deleted' }, config);
      }

      // -------------------- LEAVES --------------------
      if (path === '/api/leaves' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let list = [...state.leaves];
        if (branchId) list = list.filter((l) => l.branch_id === branchId);
        return mockResponse(200, list, config);
      }

      if (path === '/api/leaves' && method === 'post') {
        const empId = Number(body.employee_id);
        const emp = state.employees.find((e) => e.id === empId);
        const subDoc = body.substitute_doctor_id ? state.employees.find((e) => e.id === Number(body.substitute_doctor_id)) : null;

        const nextId = Math.max(0, ...state.leaves.map((l) => l.id)) + 1;
        const newLeave = {
          id: nextId,
          employee_id: empId,
          employee_name: emp ? emp.full_name : 'Employee',
          branch_id: emp ? emp.branch_id : 1,
          branch_name: emp ? emp.branch_name : 'Clinic',
          leave_type: body.leave_type || 'Annual',
          start_date: body.start_date,
          end_date: body.end_date,
          days_count: Number(body.days_count) || 1,
          reason: body.reason || '',
          status: 'Pending',
          substitute_doctor_id: subDoc ? subDoc.id : null,
          substitute_doctor_name: subDoc ? subDoc.full_name : null,
          review_notes: null,
          reviewed_at: null
        };
        state.leaves.unshift(newLeave);
        saveLocalState(state);
        return mockResponse(201, newLeave, config);
      }

      const leaveReviewMatch = path.match(/^\/api\/leaves\/(\d+)\/review$/);
      if (leaveReviewMatch && method === 'post') {
        const id = Number(leaveReviewMatch[1]);
        const leave = state.leaves.find((l) => l.id === id);
        if (leave) {
          leave.status = body.status;
          leave.review_notes = body.review_notes || `Marked ${body.status} by HR`;
          leave.reviewed_at = new Date().toISOString();
          saveLocalState(state);
          return mockResponse(200, leave, config);
        }
        return mockResponse(404, { error: 'Leave not found' }, config);
      }

      const leaveMatch = path.match(/^\/api\/leaves\/(\d+)$/);
      if (leaveMatch && method === 'put') {
        const id = Number(leaveMatch[1]);
        const idx = state.leaves.findIndex((l) => l.id === id);
        if (idx >= 0) {
          state.leaves[idx] = { ...state.leaves[idx], ...body };
          saveLocalState(state);
          return mockResponse(200, state.leaves[idx], config);
        }
        return mockResponse(404, { error: 'Leave not found' }, config);
      }

      if (leaveMatch && method === 'delete') {
        const id = Number(leaveMatch[1]);
        state.leaves = state.leaves.filter((l) => l.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Leave deleted' }, config);
      }

      // -------------------- CREDENTIALS --------------------
      if (path === '/api/credentials' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let list = [...state.credentials];
        if (branchId) {
          const empIds = new Set(state.employees.filter((e) => e.branch_id === branchId).map((e) => e.id));
          list = list.filter((c) => empIds.has(c.employee_id));
        }
        // Recalculate days_until_expiry dynamically
        const today = new Date();
        list = list.map((c) => {
          const exp = new Date(c.expiry_date);
          const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
          return {
            ...c,
            days_until_expiry: diffDays,
            is_expiring_soon: diffDays <= 30 && diffDays >= 0,
            is_expired: diffDays < 0
          };
        });
        return mockResponse(200, list, config);
      }

      if (path === '/api/credentials' && method === 'post') {
        const empId = Number(body.employee_id);
        const emp = state.employees.find((e) => e.id === empId);

        const nextId = Math.max(0, ...state.credentials.map((c) => c.id)) + 1;
        const exp = new Date(body.expiry_date);
        const today = new Date();
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

        const newCred = {
          id: nextId,
          employee_id: empId,
          employee_name: emp ? emp.full_name : 'Practitioner',
          branch_name: emp ? emp.branch_name : 'Clinic',
          credential_type: body.credential_type,
          license_number: body.license_number,
          issuing_authority: body.issuing_authority || 'State Medical Board',
          issue_date: body.issue_date || today.toISOString().split('T')[0],
          expiry_date: body.expiry_date,
          verification_status: body.verification_status || 'Verified',
          days_until_expiry: diffDays,
          is_expiring_soon: diffDays <= 30 && diffDays >= 0,
          is_expired: diffDays < 0
        };
        state.credentials.unshift(newCred);
        saveLocalState(state);
        return mockResponse(201, newCred, config);
      }

      const credMatch = path.match(/^\/api\/credentials\/(\d+)$/);
      if (credMatch && method === 'put') {
        const id = Number(credMatch[1]);
        const idx = state.credentials.findIndex((c) => c.id === id);
        if (idx >= 0) {
          const updated = { ...state.credentials[idx], ...body };
          if (body.expiry_date) {
            const exp = new Date(body.expiry_date);
            const today = new Date();
            const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
            updated.days_until_expiry = diffDays;
            updated.is_expiring_soon = diffDays <= 30 && diffDays >= 0;
            updated.is_expired = diffDays < 0;
          }
          state.credentials[idx] = updated;
          saveLocalState(state);
          return mockResponse(200, state.credentials[idx], config);
        }
        return mockResponse(404, { error: 'Credential not found' }, config);
      }

      if (credMatch && method === 'delete') {
        const id = Number(credMatch[1]);
        state.credentials = state.credentials.filter((c) => c.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Credential deleted' }, config);
      }

      // -------------------- PAYROLL --------------------
      if (path === '/api/payroll/runs' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let runs = [...state.payroll_runs];
        if (branchId) runs = runs.filter((p) => p.branch_id === branchId || !p.branch_id);
        return mockResponse(200, runs, config);
      }

      const runMatch = path.match(/^\/api\/payroll\/runs\/(\d+)$/);
      if (runMatch && method === 'get') {
        const id = Number(runMatch[1]);
        const run = state.payroll_runs.find((r) => r.id === id);
        if (run) return mockResponse(200, run, config);
        return mockResponse(404, { error: 'Payroll run not found' }, config);
      }

      if (path === '/api/payroll/generate' && method === 'post') {
        const branchId = body.branch_id ? Number(body.branch_id) : null;
        const branch = branchId ? state.branches.find((b) => b.id === branchId) : null;
        const month = body.month || 'Current Period';
        const year = 2026;

        let eligible = state.employees.filter((e) => e.status === 'Active');
        if (branchId) eligible = eligible.filter((e) => e.branch_id === branchId);

        let totalGross = 0;
        let totalNet = 0;
        let totalComm = 0;
        let totalDeduct = 0;

        const items = eligible.map((e, idx) => {
          let comm = 0;
          if (e.compensation_model === 'Base + Commission' && e.aesthetic_commission_rate > 0) {
            comm = Math.round(e.base_salary * (e.aesthetic_commission_rate / 100));
          } else if (e.compensation_model === 'Base + OPD Share' && e.opd_consultation_rate > 0) {
            comm = Math.round(e.opd_consultation_rate * 35); // 35 OPD consultations
          }
          const gross = e.base_salary + comm;
          const tax = Math.round(gross * 0.18);
          const ssn = Math.round(gross * 0.06);
          const med = Math.round(gross * 0.02);
          const deduct = tax + ssn + med;
          const net = gross - deduct;

          totalGross += gross;
          totalNet += net;
          totalComm += comm;
          totalDeduct += deduct;

          return {
            id: 5000 + idx,
            employee_id: e.id,
            employee_name: e.full_name,
            employee_code: e.employee_code,
            branch_name: e.branch_name,
            job_title: e.job_title,
            compensation_model: e.compensation_model,
            base_salary: e.base_salary,
            commission_earned: comm,
            bonus: 0,
            gross_pay: gross,
            tax_deductions: tax,
            social_security: ssn,
            medical_insurance: med,
            other_deductions: 0,
            total_deductions: deduct,
            net_pay: net
          };
        });

        const nextId = Math.max(0, ...state.payroll_runs.map((r) => r.id)) + 1;
        const newRun = {
          id: nextId,
          month: month,
          year: year,
          branch_id: branchId,
          branch_name: branch ? branch.name : 'All Clinic Branches',
          status: 'Processed',
          total_gross: totalGross,
          total_net: totalNet,
          total_commission: totalComm,
          total_deductions: totalDeduct,
          employee_count: items.length,
          processed_at: new Date().toISOString(),
          items: items
        };

        state.payroll_runs.unshift(newRun);
        saveLocalState(state);
        return mockResponse(201, newRun, config);
      }

      // -------------------- RECRUITMENT --------------------
      if (path === '/api/recruitment/jobs' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let jobs = state.job_requisitions.map((j) => {
          const appCount = state.job_applicants.filter((a) => a.job_id === j.id).length;
          return { ...j, applicants_count: appCount };
        });
        if (branchId) jobs = jobs.filter((j) => j.branch_id === branchId);
        return mockResponse(200, jobs, config);
      }

      if (path === '/api/recruitment/jobs' && method === 'post') {
        const branch = state.branches.find((b) => b.id === Number(body.branch_id));
        const dept = state.departments.find((d) => d.id === Number(body.department_id));
        const nextId = Math.max(0, ...state.job_requisitions.map((j) => j.id)) + 1;

        const newJob = {
          id: nextId,
          title: body.title,
          branch_id: Number(body.branch_id),
          branch_name: branch ? branch.name : 'Clinic',
          department_id: Number(body.department_id),
          department_name: dept ? dept.name : 'General',
          job_type: body.job_type || 'Full-time',
          open_positions: Number(body.open_positions) || 1,
          status: 'Open',
          posted_date: new Date().toISOString().split('T')[0],
          applicants_count: 0
        };
        state.job_requisitions.unshift(newJob);
        saveLocalState(state);
        return mockResponse(201, newJob, config);
      }

      const jobMatch = path.match(/^\/api\/recruitment\/jobs\/(\d+)$/);
      if (jobMatch && method === 'put') {
        const id = Number(jobMatch[1]);
        const idx = state.job_requisitions.findIndex((j) => j.id === id);
        if (idx >= 0) {
          state.job_requisitions[idx] = { ...state.job_requisitions[idx], ...body };
          saveLocalState(state);
          return mockResponse(200, state.job_requisitions[idx], config);
        }
        return mockResponse(404, { error: 'Job not found' }, config);
      }

      if (jobMatch && method === 'delete') {
        const id = Number(jobMatch[1]);
        state.job_requisitions = state.job_requisitions.filter((j) => j.id !== id);
        state.job_applicants = state.job_applicants.filter((a) => a.job_id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Job deleted' }, config);
      }

      if (path === '/api/recruitment/applicants' && method === 'get') {
        const jobId = queryParams.get('job_id') ? Number(queryParams.get('job_id')) : null;
        let apps = [...state.job_applicants];
        if (jobId) apps = apps.filter((a) => a.job_id === jobId);
        return mockResponse(200, apps, config);
      }

      if (path === '/api/recruitment/applicants' && method === 'post') {
        const jobId = Number(body.job_id);
        const job = state.job_requisitions.find((j) => j.id === jobId);
        const nextId = Math.max(0, ...state.job_applicants.map((a) => a.id)) + 1;

        const newApp = {
          id: nextId,
          job_id: jobId,
          job_title: job ? job.title : 'Healthcare Role',
          full_name: body.full_name,
          email: body.email,
          phone: body.phone || '+1 (555) 000-0000',
          applied_date: new Date().toISOString().split('T')[0],
          stage: body.stage || 'Applied',
          resume_url: body.resume_url || '',
          notes: body.notes || 'Applied via career portal',
          branch_name: job ? job.branch_name : 'Clinic'
        };
        state.job_applicants.unshift(newApp);
        saveLocalState(state);
        return mockResponse(201, newApp, config);
      }

      const applicantStageMatch = path.match(/^\/api\/recruitment\/applicants\/(\d+)\/stage$/);
      if (applicantStageMatch && (method === 'put' || method === 'post')) {
        const id = Number(applicantStageMatch[1]);
        const app = state.job_applicants.find((a) => a.id === id);
        if (app) {
          app.stage = body.stage;
          saveLocalState(state);
          return mockResponse(200, app, config);
        }
        return mockResponse(404, { error: 'Applicant not found' }, config);
      }

      const applicantMatch = path.match(/^\/api\/recruitment\/applicants\/(\d+)$/);
      if (applicantMatch && method === 'delete') {
        const id = Number(applicantMatch[1]);
        state.job_applicants = state.job_applicants.filter((a) => a.id !== id);
        saveLocalState(state);
        return mockResponse(200, { message: 'Applicant deleted' }, config);
      }

      // -------------------- REPORTS & ANALYTICS --------------------
      if (path === '/api/reports/analytics' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));

        let branchList = state.branches;
        if (branchId) branchList = branchList.filter((b) => b.id === branchId);

        const branchMetrics = branchList.map((b) => {
          const emps = state.employees.filter((e) => e.branch_id === b.id && e.status === 'Active');
          const totalBase = emps.reduce((sum, e) => sum + (e.base_salary || 0), 0);
          const aestheticComm = emps.reduce((sum, e) => sum + (e.aesthetic_commission_rate ? Math.round(e.base_salary * (e.aesthetic_commission_rate / 100)) : 0), 0);
          const opdShare = emps.reduce((sum, e) => sum + (e.opd_consultation_rate ? Math.round(e.opd_consultation_rate * 35) : 0), 0);

          return {
            branch_id: b.id,
            branch_name: b.name,
            branch_code: b.code,
            branch_type: b.branch_type,
            active_staff: emps.length,
            monthly_base_cost: totalBase,
            monthly_incentive_cost: aestheticComm + opdShare,
            total_monthly_payroll: totalBase + aestheticComm + opdShare,
            avg_salary: emps.length > 0 ? Math.round(totalBase / emps.length) : 0
          };
        });

        // Attendance stats
        const totalPunches = state.attendance.length;
        const presentPunches = state.attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
        const latePunches = state.attendance.filter((a) => a.status === 'Late').length;
        const attendanceRate = totalPunches > 0 ? Math.round((presentPunches / totalPunches) * 100) : 96;

        // Leave stats
        const leavesByType = {};
        state.leaves.forEach((l) => {
          leavesByType[l.leave_type] = (leavesByType[l.leave_type] || 0) + (l.days_count || 1);
        });

        return mockResponse(200, {
          branch_metrics: branchMetrics,
          overall: {
            total_active_staff: state.employees.filter((e) => e.status === 'Active').length,
            network_monthly_payroll: branchMetrics.reduce((sum, b) => sum + b.total_monthly_payroll, 0),
            attendance_rate: attendanceRate,
            late_punch_count: latePunches,
            pending_leave_requests: state.leaves.filter((l) => l.status === 'Pending').length,
            expiring_credentials_30d: state.credentials.filter((c) => {
              const exp = new Date(c.expiry_date);
              const diffDays = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
              return diffDays <= 30;
            }).length
          },
          leaves_distribution: leavesByType
        }, config);
      }


      // -------------------- EMPLOYEE PERFORMANCE SCORECARDS --------------------
      const empPerfMatch = path.match(/^\/api\/employees\/(\d+)\/performance$/);
      if (empPerfMatch && method === 'get') {
        const empId = Number(empPerfMatch[1]);
        const ratings = (state.performance_ratings || []).filter((r) => r.employee_id === empId);
        return mockResponse(200, ratings, config);
      }

      if (path === '/api/performance/ratings' && method === 'post') {
        if (!state.performance_ratings) state.performance_ratings = [];
        const nextId = Math.max(0, ...state.performance_ratings.map((r) => r.id)) + 1;
        const emp = state.employees.find((e) => e.id === Number(body.employee_id));
        const punct = Number(body.punctuality_score) || 8;
        const perf = Number(body.performance_score) || 8;
        const coord = Number(body.team_coordination_score) || 8;
        const skill = Number(body.skill_upgradation_score) || 8;
        const total = punct + perf + coord + skill;

        const newRating = {
          id: nextId,
          employee_id: Number(body.employee_id),
          employee_name: emp ? emp.full_name : 'Staff Member',
          month: body.month || 'Current Month',
          punctuality_score: punct,
          performance_score: perf,
          team_coordination_score: coord,
          skill_upgradation_score: skill,
          total_score: total,
          max_score: 40,
          rated_by: body.rated_by || 'Dr. Rachel Adams (HR Manager)',
          feedback: body.feedback || 'Consistent duty performance and good team collaboration.',
          improvement_plan: body.improvement_plan || 'Continue regular shift punctuality and learning goals.'
        };
        state.performance_ratings.unshift(newRating);
        saveLocalState(state);
        return mockResponse(201, newRating, config);
      }

      // -------------------- ATTENDANCE REGULARIZATION & EXCEPTIONS --------------------
      if (path === '/api/attendance/regularize' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let list = state.regularization_requests || [];
        if (branchId) list = list.filter((r) => r.branch_id === branchId);
        return mockResponse(200, list, config);
      }

      if (path === '/api/attendance/regularize' && method === 'post') {
        if (!state.regularization_requests) state.regularization_requests = [];
        const nextId = Math.max(0, ...state.regularization_requests.map((r) => r.id)) + 1;
        const emp = state.employees.find((e) => e.id === Number(body.employee_id));
        const branch = state.branches.find((b) => b.id === (emp ? emp.branch_id : 1));

        const newReq = {
          id: nextId,
          employee_id: Number(body.employee_id),
          employee_name: emp ? emp.full_name : 'Staff Member',
          branch_id: branch ? branch.id : 1,
          branch_name: branch ? branch.name : 'Clinic',
          request_type: body.request_type || 'Late Arrival Regularization',
          date: body.date || new Date().toISOString().split('T')[0],
          punch_time: body.punch_time || '08:30',
          scheduled_time: body.scheduled_time || '08:00',
          reason: body.reason || 'Medical / Transit delay',
          status: 'Pending Approval',
          reviewed_by: null,
          review_notes: null,
          reviewed_at: null
        };
        state.regularization_requests.unshift(newReq);
        saveLocalState(state);
        return mockResponse(201, newReq, config);
      }

      const regApproveMatch = path.match(/^\/api\/attendance\/regularize\/(\d+)\/approve$/);
      if (regApproveMatch && method === 'post') {
        const id = Number(regApproveMatch[1]);
        const req = (state.regularization_requests || []).find((r) => r.id === id);
        if (req) {
          req.status = 'Approved';
          req.reviewed_by = body.reviewed_by || 'Dr. Rachel Adams (HR Manager)';
          req.review_notes = body.review_notes || 'Approved based on submitted justification';
          req.reviewed_at = new Date().toISOString();

          // Regularize corresponding attendance punch
          const att = state.attendance.find((a) => a.employee_id === req.employee_id && a.date === req.date);
          if (att) {
            att.status = 'Present';
            att.notes = `${att.notes || ''} | Late regularized: ${req.reason}`.trim();
          }
          saveLocalState(state);
          return mockResponse(200, { message: 'Regularization approved', request: req }, config);
        }
        return mockResponse(404, { error: 'Request not found' }, config);
      }

      // -------------------- SHIFT SWAPS & ROSTER LOCKING --------------------
      if (path === '/api/shifts/swaps' && method === 'get') {
        const branchId = parseBranchId(queryParams.get('branch_id'));
        let list = state.shift_swap_requests || [];
        if (branchId) list = list.filter((s) => s.branch_id === branchId);
        return mockResponse(200, list, config);
      }

      if (path === '/api/shifts/swaps' && method === 'post') {
        if (!state.shift_swap_requests) state.shift_swap_requests = [];
        const nextId = Math.max(0, ...state.shift_swap_requests.map((s) => s.id)) + 1;
        const emp = state.employees.find((e) => e.id === Number(body.employee_id));
        const targetEmp = state.employees.find((e) => e.id === Number(body.requested_swap_with_id));
        const branch = state.branches.find((b) => b.id === (emp ? emp.branch_id : 1));

        const newSwap = {
          id: nextId,
          employee_id: Number(body.employee_id),
          employee_name: emp ? emp.full_name : 'Staff Member',
          requested_swap_with_id: targetEmp ? targetEmp.id : null,
          requested_swap_with_name: targetEmp ? targetEmp.full_name : 'Colleague',
          shift_date: body.shift_date,
          current_shift: body.current_shift || 'Assigned Shift',
          target_shift: body.target_shift || 'Preferred Shift',
          branch_id: branch ? branch.id : 1,
          branch_name: branch ? branch.name : 'Clinic',
          reason: body.reason || 'Personal / Operational adjustment',
          status: 'Pending Approval',
          approved_by: null,
          approved_at: null
        };
        state.shift_swap_requests.unshift(newSwap);
        saveLocalState(state);
        return mockResponse(201, newSwap, config);
      }

      const swapApproveMatch = path.match(/^\/api\/shifts\/swaps\/(\d+)\/approve$/);
      if (swapApproveMatch && method === 'post') {
        const id = Number(swapApproveMatch[1]);
        const swap = (state.shift_swap_requests || []).find((s) => s.id === id);
        if (swap) {
          swap.status = 'Approved';
          swap.approved_by = body.approved_by || 'Dr. Rachel Adams (HR Manager)';
          swap.approved_at = new Date().toISOString();
          saveLocalState(state);
          return mockResponse(200, { message: 'Shift swap approved', swap }, config);
        }
        return mockResponse(404, { error: 'Swap request not found' }, config);
      }

      // -------------------- SOPS & ANNOUNCEMENTS & TRAINING --------------------
      if (path === '/api/sops' && method === 'get') {
        return mockResponse(200, state.sops || [], config);
      }

      if (path === '/api/onboarding/training' && method === 'get') {
        return mockResponse(200, state.onboarding_training || [], config);
      }

      if (path === '/api/announcements' && method === 'get') {
        return mockResponse(200, state.announcements || [], config);
      }

      if (path === '/api/announcements' && method === 'post') {
        if (!state.announcements) state.announcements = [];
        const nextId = Math.max(0, ...state.announcements.map((a) => a.id)) + 1;
        const newPost = {
          id: nextId,
          title: body.title,
          author_name: body.author_name || 'Dr. Rachel Adams (HR Manager)',
          author_avatar: body.author_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          posted_date: new Date().toISOString().split('T')[0],
          branch_name: body.branch_name || 'All Branches (Enterprise)',
          priority: body.priority || 'Medium',
          message: body.message
        };
        state.announcements.unshift(newPost);
        saveLocalState(state);
        return mockResponse(201, newPost, config);
      }
      // Default fallback 404
      console.warn(`[MockBackend] Unhandled mock path: ${method.toUpperCase()} ${path}`);
      return mockResponse(404, { error: `Not found: ${method.toUpperCase()} ${path}` }, config);
    } catch (err) {
      console.error(`[MockBackend Error] on ${method} ${path}:`, err);
      return mockResponse(500, { error: err.message }, config);
    }
  };
}

function mockResponse(status, data, config) {
  return Promise.resolve({
    data,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
    request: {}
  });
}

// Automatically initialize adapter immediately upon module load
setupMockBackend();


