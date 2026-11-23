import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import NavbarRaw from '../../hrms/components/Navbar';
import DashboardViewRaw from '../../hrms/components/DashboardView';
import EmployeesViewRaw from '../../hrms/components/EmployeesView';
import OrganizationViewRaw from '../../hrms/components/OrganizationView';
import AttendanceViewRaw from '../../hrms/components/AttendanceView';
import ShiftsViewRaw from '../../hrms/components/ShiftsView';
import LeavesViewRaw from '../../hrms/components/LeavesView';
import PayrollViewRaw from '../../hrms/components/PayrollView';
import CredentialsViewRaw from '../../hrms/components/CredentialsView';
import RecruitmentViewRaw from '../../hrms/components/RecruitmentView';
import ReportsViewRaw from '../../hrms/components/ReportsView';
import SelfServiceViewRaw from '../../hrms/components/SelfServiceView';
import LoginPageRaw from '../../hrms/components/LoginPage';

import { 
  setupMockBackend, 
  getAuthUser, 
  setAuthUser,
  resetLocalState,
  DEMO_HR_ACCOUNTS 
} from '../../hrms/services/mockBackend';

const Navbar = NavbarRaw as React.FC<any>;
const DashboardView = DashboardViewRaw as React.FC<any>;
const OrganizationView = OrganizationViewRaw as React.FC<any>;
const EmployeesView = EmployeesViewRaw as React.FC<any>;
const AttendanceView = AttendanceViewRaw as React.FC<any>;
const ShiftsView = ShiftsViewRaw as React.FC<any>;
const LeavesView = LeavesViewRaw as React.FC<any>;
const PayrollView = PayrollViewRaw as React.FC<any>;
const CredentialsView = CredentialsViewRaw as React.FC<any>;
const RecruitmentView = RecruitmentViewRaw as React.FC<any>;
const ReportsView = ReportsViewRaw as React.FC<any>;
const SelfServiceView = SelfServiceViewRaw as React.FC<any>;
const LoginPage = LoginPageRaw as React.FC<any>;

// Ensure mock adapter handles HRMS routes client-side seamlessly
setupMockBackend();

export default function HRMSPage() {
  const { tab = 'dashboard' } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(() => getAuthUser() || DEMO_HR_ACCOUNTS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => true);
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const tabBranch = sessionStorage.getItem('HEAL_ACTIVE_BRANCH_TAB');
      if (tabBranch === 'krn-branch-001' || tabBranch === '1') return 1;
      if (tabBranch === 'clt-branch-002' || tabBranch === '2') return 2;
      if (tabBranch === 'wyd-branch-003' || tabBranch === '3') return 3;
      if (tabBranch === 'all' || tabBranch === '4') return null;
    }
    return null;
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [rosters, setRosters] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);

  const [punchLoading, setPunchLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const setActiveTab = (newTab: string) => {
    navigate(`/hrms/${newTab}`);
  };

  // Initial Data Load
  useEffect(() => {
    loadBootstrapData();
  }, []);

  // When branch filter or tab changes
  useEffect(() => {
    loadDashboardStats();
    loadAttendance();
    loadRosters();
    loadLeaves();
  }, [selectedBranch]);

  const loadBootstrapData = async () => {
    try {
      const [userRes, usersRes, branchesRes, deptsRes, desigsRes, empRes] = await Promise.all([
        axios.get('/api/auth/me'),
        axios.get('/api/auth/users'),
        axios.get('/api/branches', { headers: { 'X-HRMS-Context': 'true' } }),
        axios.get('/api/departments'),
        axios.get('/api/designations'),
        axios.get('/api/employees')
      ]);

      if (!currentUser && userRes.data) {
        setCurrentUser(userRes.data);
      }
      setUsersList(usersRes.data || []);
      setBranches(branchesRes.data || []);
      setDepartments(deptsRes.data || []);
      setDesignations(desigsRes.data || []);
      setEmployees(empRes.data || []);

      loadDashboardStats();
      loadAttendance();
      loadRosters();
      loadLeaves();
      loadCredentials();
    } catch (err) {
      console.error("Error loading HRMS bootstrap data:", err);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const url = selectedBranch 
        ? `/api/dashboard/stats?branch_id=${selectedBranch}` 
        : '/api/dashboard/stats';
      const res = await axios.get(url);
      setDashboardStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await axios.get('/api/branches', { headers: { 'X-HRMS-Context': 'true' } });
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async () => {
    try {
      const url = selectedBranch 
        ? `/api/attendance?branch_id=${selectedBranch}` 
        : '/api/attendance';
      const res = await axios.get(url);
      setAttendanceLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRosters = async () => {
    try {
      const url = selectedBranch 
        ? `/api/rosters?branch_id=${selectedBranch}` 
        : '/api/rosters';
      const res = await axios.get(url);
      setRosters(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLeaves = async () => {
    try {
      const url = selectedBranch 
        ? `/api/leaves?branch_id=${selectedBranch}` 
        : '/api/leaves';
      const res = await axios.get(url);
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCredentials = async () => {
    try {
      const res = await axios.get('/api/credentials');
      setCredentials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = () => {
    resetLocalState();
    loadBootstrapData();
    showToast('HR database reset to initial demo dataset!');
  };

  const handleBranchChange = (bId: any) => {
    setSelectedBranch(bId);
    if (typeof window !== 'undefined') {
      let tabStr = 'all';
      if (bId === 1 || bId === '1' || bId === 'krn-branch-001') tabStr = 'krn-branch-001';
      else if (bId === 2 || bId === '2' || bId === 'clt-branch-002') tabStr = 'clt-branch-002';
      else if (bId === 3 || bId === '3' || bId === 'wyd-branch-003') tabStr = 'wyd-branch-003';
      sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', tabStr);
    }
  };

  const handleSelectAccount = (account: any) => {
    setCurrentUser(account);
    setAuthUser(account);
    if (account.branch_id) {
      handleBranchChange(account.branch_id);
    }
    showToast(`Switched active HR persona to ${account.full_name} (${account.role})`);
  };

  const handleLogin = (account: any) => {
    setCurrentUser(account);
    setAuthUser(account);
    setIsAuthenticated(true);
    if (account.branch_id) {
      handleBranchChange(account.branch_id);
    } else {
      handleBranchChange(null);
    }
    showToast(`Signed in successfully as ${account.full_name} (${account.role})`);
  };

  const handleLogout = () => {
    setAuthUser(null);
    setIsAuthenticated(false);
    showToast('Signed out of HR session');
  };

  // Punch Action
  const handlePunch = async () => {
    if (!currentUser) return;
    try {
      setPunchLoading(true);
      const res = await axios.post('/api/attendance/punch', {
        employee_id: currentUser.id
      });
      showToast(res.data.message || 'Punch recorded successfully!');
      loadAttendance();
      loadDashboardStats();
    } catch (err) {
      showToast('Error recording punch', 'error');
    } finally {
      setPunchLoading(false);
    }
  };

  // Employee Handlers
  const handleAddEmployee = async (newEmp: any) => {
    try {
      const res = await axios.post('/api/employees', newEmp);
      showToast(`Employee ${res.data.full_name} added successfully!`);
      loadEmployees();
      loadDashboardStats();
    } catch (err) {
      showToast('Error adding employee', 'error');
    }
  };

  const handleUpdateEmployee = async (id: any, updatedData: any) => {
    try {
      const res = await axios.put(`/api/employees/${id}`, updatedData);
      showToast(`Employee ${res.data.full_name} updated!`);
      loadEmployees();
      loadDashboardStats();
    } catch (err) {
      showToast('Error updating employee', 'error');
    }
  };

  const handleDeleteEmployee = async (id: any) => {
    try {
      await axios.delete(`/api/employees/${id}`);
      showToast('Employee deleted successfully');
      loadEmployees();
      loadDashboardStats();
    } catch (err) {
      showToast('Error deleting employee', 'error');
    }
  };

  // Branch & Dept Handlers
  const handleAddBranch = async (data: any) => {
    try {
      const res = await axios.post('/api/branches', data, { headers: { 'X-HRMS-Context': 'true' } });
      showToast(`Branch ${res.data.name} created!`);
      loadBranches();
      loadDashboardStats();
    } catch (err) {
      showToast('Error adding branch', 'error');
    }
  };

  const handleUpdateBranch = async (id: any, data: any) => {
    try {
      const res = await axios.put(`/api/branches/${id}`, data, { headers: { 'X-HRMS-Context': 'true' } });
      showToast(`Branch ${res.data.name} updated!`);
      loadBranches();
      loadDashboardStats();
    } catch (err) {
      showToast('Error updating branch', 'error');
    }
  };

  const handleDeleteBranch = async (id: any) => {
    try {
      const res = await axios.delete(`/api/branches/${id}`, { headers: { 'X-HRMS-Context': 'true' } });
      showToast(res.data.message || 'Branch deleted');
      loadBranches();
      loadDashboardStats();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error deleting branch', 'error');
    }
  };

  const handleAddDepartment = async (data: any) => {
    try {
      const res = await axios.post('/api/departments', data);
      showToast(`Department ${res.data.name} created!`);
      loadDepartments();
    } catch (err) {
      showToast('Error adding department', 'error');
    }
  };

  const handleDeleteDepartment = async (id: any) => {
    try {
      await axios.delete(`/api/departments/${id}`);
      showToast('Department removed');
      loadDepartments();
    } catch (err) {
      showToast('Error deleting department', 'error');
    }
  };

  // Attendance Handlers
  const handleAddManualAttendance = async (data: any) => {
    try {
      await axios.post('/api/attendance/manual', data);
      showToast('Attendance recorded manually');
      loadAttendance();
      loadDashboardStats();
    } catch (err) {
      showToast('Error adding attendance', 'error');
    }
  };

  const handleDeleteAttendance = async (id: any) => {
    try {
      await axios.delete(`/api/attendance/${id}`);
      showToast('Attendance record deleted');
      loadAttendance();
      loadDashboardStats();
    } catch (err) {
      showToast('Error deleting attendance', 'error');
    }
  };

  // Roster Handlers
  const handleAddRoster = async (data: any) => {
    try {
      await axios.post('/api/rosters', data);
      showToast('Shift assigned successfully');
      loadRosters();
      loadDashboardStats();
    } catch (err) {
      showToast('Error scheduling shift', 'error');
    }
  };

  const handleUpdateRoster = async (id: any, data: any) => {
    try {
      await axios.put(`/api/rosters/${id}`, data);
      showToast('Shift updated successfully');
      loadRosters();
      loadDashboardStats();
    } catch (err) {
      showToast('Error updating shift', 'error');
    }
  };

  const handleDeleteRoster = async (id: any) => {
    try {
      await axios.delete(`/api/rosters/${id}`);
      showToast('Shift deleted');
      loadRosters();
      loadDashboardStats();
    } catch (err) {
      showToast('Error deleting shift', 'error');
    }
  };

  // Leave Handlers
  const handleApplyLeave = async (data: any) => {
    try {
      await axios.post('/api/leaves', data);
      showToast('Leave request submitted!');
      loadLeaves();
      loadDashboardStats();
    } catch (err) {
      showToast('Error applying leave', 'error');
    }
  };

  const handleUpdateLeave = async (id: any, data: any) => {
    try {
      await axios.put(`/api/leaves/${id}`, data);
      showToast('Leave request updated');
      loadLeaves();
      loadDashboardStats();
    } catch (err) {
      showToast('Error updating leave', 'error');
    }
  };

  const handleReviewLeave = async (id: any, status: any, notes = '') => {
    try {
      await axios.post(`/api/leaves/${id}/review`, { status, review_notes: notes });
      showToast(`Leave request ${status.toLowerCase()}!`);
      loadLeaves();
      loadDashboardStats();
    } catch (err) {
      showToast('Error reviewing leave', 'error');
    }
  };

  const handleDeleteLeave = async (id: any) => {
    try {
      await axios.delete(`/api/leaves/${id}`);
      showToast('Leave request deleted');
      loadLeaves();
      loadDashboardStats();
    } catch (err) {
      showToast('Error deleting leave', 'error');
    }
  };

  const expiringCredsCount = credentials.filter((c: any) => c.is_expiring_soon || c.is_expired).length;

  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={handleLogin}
        onResetData={handleResetData}
      />
    );
  }

  return (
    <div className="flex flex-col min-w-0 bg-slate-50 min-h-screen">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div 
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Top HRMS Sub-Navbar */}
      <Navbar 
        branches={branches}
        selectedBranch={selectedBranch}
        setSelectedBranch={handleBranchChange}
        currentUser={currentUser}
        usersList={usersList}
        setCurrentUser={handleSelectAccount}
        onPunch={handlePunch}
        punchLoading={punchLoading}
        expiringCredsCount={expiringCredsCount}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onResetData={handleResetData}
      />

      {/* Main HRMS Tab Content Area */}
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {tab === 'dashboard' && (
            <DashboardView 
              stats={dashboardStats}
              branches={branches}
              selectedBranch={selectedBranch}
              onReviewLeave={handleReviewLeave}
              setActiveTab={setActiveTab}
            />
          )}

          {tab === 'organization' && (
            <OrganizationView 
              branches={branches}
              departments={departments}
              designations={designations}
              employees={employees}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
              onDeleteBranch={handleDeleteBranch}
              onAddDepartment={handleAddDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onRefreshData={loadBootstrapData}
              showToast={showToast}
            />
          )}

          {tab === 'employees' && (
            <EmployeesView 
              employees={employees}
              branches={branches}
              departments={departments}
              designations={designations}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {tab === 'attendance' && (
            <AttendanceView 
              attendanceLogs={attendanceLogs}
              branches={branches}
              employees={employees}
              currentUser={currentUser}
              onPunch={handlePunch}
              punchLoading={punchLoading}
              onAddManualAttendance={handleAddManualAttendance}
              onDeleteAttendance={handleDeleteAttendance}
            />
          )}

          {tab === 'shifts' && (
            <ShiftsView 
              rosters={rosters}
              branches={branches}
              employees={employees}
              onAddRoster={handleAddRoster}
              onUpdateRoster={handleUpdateRoster}
              onDeleteRoster={handleDeleteRoster}
            />
          )}

          {tab === 'leaves' && (
            <LeavesView 
              leaves={leaves}
              branches={branches}
              employees={employees}
              onApplyLeave={handleApplyLeave}
              onUpdateLeave={handleUpdateLeave}
              onReviewLeave={handleReviewLeave}
              onDeleteLeave={handleDeleteLeave}
            />
          )}

          {tab === 'payroll' && (
            <PayrollView 
              branches={branches}
            />
          )}

          {tab === 'credentials' && (
            <CredentialsView 
              branches={branches}
              employees={employees}
              onAddCredential={() => loadCredentials()}
              onUpdateCredential={() => loadCredentials()}
              onDeleteCredential={() => loadCredentials()}
            />
          )}

          {tab === 'recruitment' && (
            <RecruitmentView 
              branches={branches}
              departments={departments}
            />
          )}

          {tab === 'reports' && (
            <ReportsView 
              branches={branches}
              employees={employees}
            />
          )}

          {tab === 'selfservice' && (
            <SelfServiceView 
              currentUser={currentUser}
              attendanceLogs={attendanceLogs}
              leaves={leaves}
              onPunch={handlePunch}
              punchLoading={punchLoading}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      </div>
    </div>
  );
}
