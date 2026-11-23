import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Sparkles, 
  Layers,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  X,
  Calendar,
  ArrowLeftRight,
  ShieldCheck,
  BarChart3,
  Download,
  AlertCircle,
  Briefcase,
  HelpCircle,
  Check,
  RotateCcw
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import { INDUSTRIES, DEFAULT_INDUSTRY } from '../utils/industryTerminology';

export default function OrganizationView({ 
  branches, 
  departments, 
  designations,
  employees = [],
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onAddDepartment,
  onDeleteDepartment,
  onRefreshData,
  showToast = () => {}
}) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState('branches'); // 'branches', 'holidays', 'transfers', 'managers', 'reports'
  const [currentIndustry, setCurrentIndustry] = useState(DEFAULT_INDUSTRY);

  // Modals for Branches & Departments
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);

  // State for Holidays
  const [holidays, setHolidays] = useState([]);
  const [selectedHolidayBranch, setSelectedHolidayBranch] = useState('ALL');
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState(null);
  const [newHoliday, setNewHoliday] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    branch_id: '',
    holiday_type: 'National Holiday',
    affects_payroll: true
  });

  // State for Transfers
  const [transfers, setTransfers] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferBranch, setSelectedTransferBranch] = useState('ALL');
  const [newTransfer, setNewTransfer] = useState({
    employee_id: '',
    to_branch_id: '',
    department_id: '',
    new_reporting_manager_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    effective_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  });

  // State for Branch Managers
  const [branchManagers, setBranchManagers] = useState([]);
  const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);
  const [selectedBranchForManager, setSelectedBranchForManager] = useState(null);
  const [newManagerAssignment, setNewManagerAssignment] = useState({
    branch_id: '',
    manager_employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    responsibilities: ''
  });

  // State for Reports
  const [branchReports, setBranchReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // New Branch Form State
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    branch_type: 'General Medicine',
    address: '',
    city: '',
    phone: '',
    email: '',
    operating_hours: '08:00 AM - 08:00 PM',
    weekly_offs: ['Sunday']
  });

  // New Dept Form State
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    branch_id: '',
    description: ''
  });

  const term = INDUSTRIES[currentIndustry] || INDUSTRIES.healthcare;

  // Initial load of sub-module datasets
  useEffect(() => {
    loadHolidays();
    loadTransfers();
    loadManagers();
    loadReports();
  }, []);

  const loadHolidays = async () => {
    try {
      const res = await axios.get('/api/organization/holidays');
      setHolidays(res.data || []);
    } catch (err) {
      console.error('Error loading holidays', err);
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await axios.get('/api/organization/transfers');
      setTransfers(res.data || []);
    } catch (err) {
      console.error('Error loading transfers', err);
    }
  };

  const loadManagers = async () => {
    try {
      const res = await axios.get('/api/organization/managers');
      setBranchManagers(res.data || []);
    } catch (err) {
      console.error('Error loading branch managers', err);
    }
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const res = await axios.get('/api/organization/reports');
      setBranchReports(res.data?.branch_metrics || []);
    } catch (err) {
      console.error('Error loading reports', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // ---------------- Branch CRUD Handlers ----------------
  const handleBranchSubmit = (e) => {
    e.preventDefault();
    onAddBranch(newBranch);
    setShowAddBranchModal(false);
    setNewBranch({
      name: '',
      code: '',
      branch_type: 'General Medicine',
      address: '',
      city: '',
      phone: '',
      email: '',
      operating_hours: '08:00 AM - 08:00 PM',
      weekly_offs: ['Sunday']
    });
  };

  const handleBranchEditSubmit = (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    onUpdateBranch(editingBranch.id, editingBranch);
    setEditingBranch(null);
  };

  const handleDeptSubmit = (e) => {
    e.preventDefault();
    onAddDepartment({
      ...newDept,
      branch_id: newDept.branch_id ? parseInt(newDept.branch_id) : null
    });
    setShowAddDeptModal(false);
    setNewDept({ name: '', code: '', branch_id: '', description: '' });
  };

  // ---------------- Holiday Handlers ----------------
  const handleAddHolidaySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/organization/holidays', {
        ...newHoliday,
        branch_id: newHoliday.branch_id ? parseInt(newHoliday.branch_id) : null
      });
      showToast('Holiday added successfully!');
      setShowAddHolidayModal(false);
      setNewHoliday({
        title: '',
        date: new Date().toISOString().split('T')[0],
        branch_id: '',
        holiday_type: 'National Holiday',
        affects_payroll: true
      });
      loadHolidays();
      loadReports();
    } catch (err) {
      showToast('Error creating holiday', 'error');
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await axios.delete(`/api/organization/holidays/${id}`);
      showToast('Holiday deleted successfully');
      setDeletingHoliday(null);
      loadHolidays();
      loadReports();
    } catch (err) {
      showToast('Error deleting holiday', 'error');
    }
  };

  const handleToggleWeeklyOff = async (branchId, day) => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;
    const currentOffs = branch.weekly_offs || ['Sunday'];
    const exists = currentOffs.includes(day);
    const updated = exists ? currentOffs.filter((d) => d !== day) : [...currentOffs, day];
    if (updated.length === 0) {
      alert('Every branch must have at least one weekly off day.');
      return;
    }
    try {
      await axios.put('/api/organization/weekly-offs', {
        branch_id: branchId,
        weekly_offs: updated
      });
      showToast(`Updated weekly offs for ${branch.name}`);
      if (onRefreshData) onRefreshData();
      loadReports();
    } catch (err) {
      showToast('Error updating weekly offs', 'error');
    }
  };

  // ---------------- Transfer Handlers ----------------
  const handleInitiateTransferSubmit = async (e) => {
    e.preventDefault();
    if (!newTransfer.employee_id || !newTransfer.to_branch_id) {
      alert('Please select both the employee and destination branch.');
      return;
    }
    try {
      await axios.post('/api/organization/transfers', {
        ...newTransfer,
        employee_id: parseInt(newTransfer.employee_id),
        to_branch_id: parseInt(newTransfer.to_branch_id),
        department_id: newTransfer.department_id ? parseInt(newTransfer.department_id) : null,
        new_reporting_manager_id: newTransfer.new_reporting_manager_id ? parseInt(newTransfer.new_reporting_manager_id) : null
      });
      showToast('Employee transfer request initiated for approval!');
      setShowTransferModal(false);
      setNewTransfer({
        employee_id: '',
        to_branch_id: '',
        department_id: '',
        new_reporting_manager_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: ''
      });
      loadTransfers();
      loadReports();
    } catch (err) {
      showToast('Error initiating transfer', 'error');
    }
  };

  const handleApproveTransfer = async (transferId) => {
    try {
      await axios.post(`/api/organization/transfers/${transferId}/approve`, {
        approved_by: 'Dr. Rachel Adams (HR Manager)'
      });
      showToast('Transfer approved! Active employee branch updated automatically.');
      loadTransfers();
      loadReports();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      showToast('Error approving transfer', 'error');
    }
  };

  const handleRejectTransfer = async (transferId) => {
    const reason = window.prompt('Enter reason for rejecting this transfer request:', 'Operational staffing requirements');
    if (reason === null) return;
    try {
      await axios.post(`/api/organization/transfers/${transferId}/reject`, {
        rejection_reason: reason
      });
      showToast('Transfer request rejected');
      loadTransfers();
      loadReports();
    } catch (err) {
      showToast('Error rejecting transfer', 'error');
    }
  };

  // ---------------- Manager Assignment Handlers ----------------
  const handleAssignManagerSubmit = async (e) => {
    e.preventDefault();
    if (!newManagerAssignment.branch_id || !newManagerAssignment.manager_employee_id) {
      alert('Please select both branch and manager.');
      return;
    }
    try {
      await axios.post('/api/organization/managers/assign', {
        branch_id: parseInt(newManagerAssignment.branch_id),
        manager_employee_id: parseInt(newManagerAssignment.manager_employee_id),
        start_date: newManagerAssignment.start_date,
        responsibilities: newManagerAssignment.responsibilities
      });
      showToast('Branch Manager assigned successfully! Previous record archived.');
      setShowAssignManagerModal(false);
      setNewManagerAssignment({
        branch_id: '',
        manager_employee_id: '',
        start_date: new Date().toISOString().split('T')[0],
        responsibilities: ''
      });
      loadManagers();
      loadReports();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      showToast('Error assigning branch manager', 'error');
    }
  };

  // Export Reports CSV
  const handleExportReportsCSV = () => {
    if (branchReports.length === 0) return;
    const headers = [
      'Branch Name',
      'Branch Code',
      'Branch Type',
      'Assigned Manager',
      'Active Staff Count',
      'Weekly Offs',
      'Total Holidays',
      'Est. Working Days',
      'Transfers Inflow',
      'Transfers Outflow',
      'Attendance Compliance (%)'
    ];
    const rows = branchReports.map((r) => [
      `"${r.branch_name}"`,
      r.branch_code,
      r.branch_type,
      `"${r.manager_name}"`,
      r.active_headcount,
      `"${r.weekly_offs.join(', ')}"`,
      r.total_holidays,
      r.working_days_estimated,
      r.transfers_inflow,
      r.transfers_outflow,
      `${r.attendance_compliance_rate}%`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Branch_Management_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingTransfersCount = transfers.filter((t) => t.status === 'Pending Approval').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Industry Terminology Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Organization & Multi-{term.branchLabel} Suite</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              SaaS Multi-Tenant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage {term.branchesLabel.toLowerCase()}, operational holiday calendars, employee branch transfers, manager assignments, and governance reports
          </p>
        </div>

        {/* Industry Terminology Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-500 font-medium">Industry Context:</span>
            <select
              value={currentIndustry}
              onChange={(e) => setCurrentIndustry(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {Object.values(INDUSTRIES).map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modern Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'branches'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{term.branchesLabel} & Units</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {branches.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('holidays')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'holidays'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Holidays & Weekly Offs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {holidays.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'transfers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Staff Branch Transfers</span>
          {pendingTransfersCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {pendingTransfersCount} Pending
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
              {transfers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('managers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'managers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{term.managerLabel} Governance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'reports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Management Reports</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BRANCHES & DEPARTMENTS                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'branches' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Active {term.branchesLabel} ({branches.length})
              </h2>
              <p className="text-xs text-slate-500">Physical and operational facilities across the organization</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddDeptModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Department</span>
              </button>
              <button
                onClick={() => setShowAddBranchModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {term.branchLabel}</span>
              </button>
            </div>
          </div>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b) => {
              const activeManager = branchManagers.find((m) => m.branch_id === b.id && m.is_active);
              return (
                <div 
                  key={b.id} 
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Header: Code & Type */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {b.code}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        b.branch_type === 'Aesthetic' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {b.branch_type}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                      {b.name}
                    </h3>
                    
                    {/* Assigned Manager Pill */}
                    <div className="flex items-center gap-1.5 mt-2 mb-3 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-slate-700">Manager:</span>
                      <strong className="text-slate-900 font-semibold truncate">
                        {activeManager ? activeManager.manager_name : (b.manager_name || 'Unassigned')}
                      </strong>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{b.address || 'Address not registered'}, {b.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{b.operating_hours}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Weekly Offs: <strong className="text-slate-700 font-semibold">{(b.weekly_offs || ['Sunday']).join(', ')}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Employee Count & Edit Actions */}
                  <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>{b.employee_count || 0} {term.employeesLabel.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingBranch({ ...b })}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors"
                        title="Edit Branch"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingBranch(b)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department Breakdown Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Departments & Clinical Units ({departments.length})</span>
                </h3>
                <p className="text-xs text-slate-500">Cross-branch functional divisions and specialized teams</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.map((d) => (
                <div 
                  key={d.id} 
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {d.code}
                      </span>
                      <h4 className="font-bold text-slate-800 truncate">{d.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{d.branch_name || 'All Branches'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {d.employee_count || 0} staff
                    </span>
                    <button
                      onClick={() => setDeletingDept(d)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HOLIDAY & WEEKLY-OFF CALENDAR                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'holidays' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Holiday Calendars & Weekly Off Rules
              </h2>
              <p className="text-xs text-slate-500">
                Configure common organization-wide holidays and separate branch-specific holidays
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedHolidayBranch}
                onChange={(e) => setSelectedHolidayBranch(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="ALL">All Branches & Org-Wide</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddHolidayModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Holiday</span>
              </button>
            </div>
          </div>

          {/* Weekly-Offs Configuration Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Branch Weekly Off Configuration
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {branches.map((b) => {
                const offs = b.weekly_offs || ['Sunday'];
                return (
                  <div key={b.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-slate-800 font-bold">{b.name}</strong>
                      <span className="font-mono text-[10px] text-slate-400">{b.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2.5">Weekly off days observed by this facility:</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const isSelected = offs.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleWeeklyOff(b.id, day)}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Holidays Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Configured Holidays ({holidays.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Automatically integrated with attendance punches, shift schedules and payroll calculation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Holiday Title</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Applicability / Scope</th>
                    <th className="py-2.5 px-4">Holiday Category</th>
                    <th className="py-2.5 px-4">Paid / Payroll Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {holidays
                    .filter((h) => selectedHolidayBranch === 'ALL' || h.is_org_wide || h.branch_id === parseInt(selectedHolidayBranch))
                    .map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {h.title}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">
                          {h.date}
                        </td>
                        <td className="py-3 px-4">
                          {h.is_org_wide ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <Sparkles className="w-3 h-3" />
                              All Branches (Org-wide)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <Building2 className="w-3 h-3" />
                              {h.branch_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {h.holiday_type}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid Holiday
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDeletingHoliday(h)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Holiday"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMPLOYEE BRANCH TRANSFERS                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-6">
          {/* Top Banner & Stats */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-1">
                <ArrowLeftRight className="w-4 h-4 text-sky-400" />
                <span>Internal Workforce Mobility & Branch Reallocation</span>
              </div>
              <h2 className="text-base font-bold text-white">Employee Branch Transfer Governance</h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                Staff transfer between branches requires authorized HR sign-off. On the effective date, rosters, attendance, and reporting lines update automatically while preserving complete historical records.
              </p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Initiate Employee Transfer</span>
            </button>
          </div>

          {/* Transfers Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Transfer Applications & Audit History ({transfers.length})
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Filter Branch:</span>
                <select
                  value={selectedTransferBranch}
                  onChange={(e) => setSelectedTransferBranch(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700"
                >
                  <option value="ALL">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Current Branch $\rightarrow$ New Branch</th>
                    <th className="py-2.5 px-4">New Department & Manager</th>
                    <th className="py-2.5 px-4">Effective Date</th>
                    <th className="py-2.5 px-4">Reason & Notes</th>
                    <th className="py-2.5 px-4">Approval Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transfers
                    .filter((t) => selectedTransferBranch === 'ALL' || t.from_branch_id === parseInt(selectedTransferBranch) || t.to_branch_id === parseInt(selectedTransferBranch))
                    .map((t) => {
                      const isPending = t.status === 'Pending Approval';
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{t.employee_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{t.employee_code}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-600 font-medium">{t.from_branch_name}</span>
                              <span className="text-slate-400 font-bold">$\rightarrow$</span>
                              <strong className="text-blue-700 font-bold">{t.to_branch_name}</strong>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{t.department_name}</div>
                            <div className="text-[10px] text-slate-500">Reports to: {t.new_reporting_manager_name || 'Department Lead'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-600">
                            {t.effective_date}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="font-medium text-slate-800 truncate" title={t.reason}>{t.reason}</p>
                            {t.notes && <p className="text-[10px] text-slate-400 truncate">{t.notes}</p>}
                          </td>
                          <td className="py-3 px-4">
                            {t.status === 'Approved' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved & Effective
                              </span>
                            ) : t.status === 'Pending Approval' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                <Clock className="w-3 h-3" />
                                Awaiting HR Sign-off
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <X className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveTransfer(t.id)}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1"
                                  title="Authorize and apply transfer immediately"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectTransfer(t.id)}
                                  className="px-2.5 py-1 rounded border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[10px]"
                                  title="Reject transfer request"
                                >
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {t.approved_by || 'Completed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BRANCH MANAGERS GOVERNANCE                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'managers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {term.branchLabel} Manager Assignments & Governance
              </h2>
              <p className="text-xs text-slate-500">
                Authorized administrators can assign or replace branch managers, granting local oversight over rosters, attendance, and leaves
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedBranchForManager(branches[0]?.id || '');
                setShowAssignManagerModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign / Replace Manager</span>
            </button>
          </div>

          {/* Active Managers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {branches.map((b) => {
              const activeAssignment = branchManagers.find((m) => m.branch_id === b.id && m.is_active);
              const managerEmp = activeAssignment ? employees.find((e) => e.id === activeAssignment.manager_employee_id) : null;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {b.code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Manager Active
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{b.name}</h3>
                    <p className="text-xs text-slate-400 mb-4">{b.city} • {b.operating_hours}</p>

                    {/* Active Manager Card */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-center gap-3 mb-3">
                      <img 
                        src={managerEmp?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} 
                        alt="" 
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/30" 
                      />
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {activeAssignment ? activeAssignment.manager_name : 'No Manager Assigned'}
                        </h4>
                        <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
                          {activeAssignment ? activeAssignment.manager_role : 'Pending Assignment'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Since: {activeAssignment ? activeAssignment.start_date : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-2 rounded border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-700">Governance Permissions:</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {activeAssignment?.responsibilities || 'Branch-scoped rota creation, punch exception approvals, leave approvals, and employee compliance monitoring.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewManagerAssignment({
                        branch_id: String(b.id),
                        manager_employee_id: '',
                        start_date: new Date().toISOString().split('T')[0],
                        responsibilities: `Full operational supervision of ${b.name}, daily duty roster sign-offs, and leave coverage authorization.`
                      });
                      setShowAssignManagerModal(true);
                    }}
                    className="w-full mt-4 py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-blue-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Replace / Change Manager</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Historical Manager Assignments Audit Log */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Manager Assignment & Replacement Audit History ({branchManagers.length})
              </h3>
              <span className="text-[11px] text-slate-400">Maintains complete chronological tenure records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">{term.branchLabel}</th>
                    <th className="py-2.5 px-4">Manager Name & Role</th>
                    <th className="py-2.5 px-4">Tenure Period</th>
                    <th className="py-2.5 px-4">Tenure Status</th>
                    <th className="py-2.5 px-4">Assigned By</th>
                    <th className="py-2.5 px-4">Delegated Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {branchManagers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {m.branch_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{m.manager_name}</div>
                        <div className="text-[10px] text-blue-600">{m.manager_role}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {m.start_date} $\rightarrow$ {m.end_date || 'Present (Active)'}
                      </td>
                      <td className="py-3 px-4">
                        {m.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Current Active Lead
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Archived / Replaced
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {m.assigned_by}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={m.responsibilities}>
                        {m.responsibilities}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BRANCH-WISE MANAGEMENT REPORTS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Cross-{term.branchLabel} Comparative Executive Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Operational metrics, working days, staff allocation, transfer trends, and compliance rates
              </p>
            </div>
            <button
              onClick={handleExportReportsCSV}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Report</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">{term.branchLabel}</th>
                    <th className="py-2.5 px-4">Branch Lead</th>
                    <th className="py-2.5 px-4 text-center">Active Staff</th>
                    <th className="py-2.5 px-4">Weekly Offs</th>
                    <th className="py-2.5 px-4 text-center">Holidays</th>
                    <th className="py-2.5 px-4 text-center">Working Days</th>
                    <th className="py-2.5 px-4 text-center">Staff Inflow</th>
                    <th className="py-2.5 px-4 text-center">Staff Outflow</th>
                    <th className="py-2.5 px-4 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {branchReports.map((r) => (
                    <tr key={r.branch_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.branch_name}</div>
                        <div className="text-[10px] text-blue-600 font-mono">{r.branch_code} • {r.branch_type}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.manager_name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {r.active_headcount}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {r.weekly_offs.join(', ')}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-purple-700">
                        {r.total_holidays}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {r.working_days_estimated} days
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          +{r.transfers_inflow}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          -{r.transfers_outflow}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {r.attendance_compliance_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New {term.branchLabel}</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBranchSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{term.branchLabel} Name</label>
                <input
                  type="text"
                  required
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="e.g. Northside Wellness Center"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                    placeholder="e.g. BR-NORTH-04"
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Specialty / Type</label>
                  <select
                    value={newBranch.branch_type}
                    onChange={(e) => setNewBranch({ ...newBranch, branch_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Aesthetic">Aesthetic & Skin Laser</option>
                    <option value="Pediatrics">Pediatrics & Family Care</option>
                    <option value="Retail">Retail Store / Counter</option>
                    <option value="Factory">Manufacturing Line</option>
                    <option value="Corporate">Corporate Office</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    placeholder="e.g. New York, NY"
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={newBranch.operating_hours}
                    onChange={(e) => setNewBranch({ ...newBranch, operating_hours: e.target.value })}
                    placeholder="08:00 AM - 08:00 PM"
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  placeholder="Street address"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Create {term.branchLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Department</h3>
              <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeptSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="e.g. Physiotherapy & Rehabilitation"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Code</label>
                <input
                  type="text"
                  required
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  placeholder="e.g. PHY-01"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 uppercase focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{term.branchLabel} Association</label>
                <select
                  value={newDept.branch_id}
                  onChange={(e) => setNewDept({ ...newDept, branch_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  <option value="">All Branches (Cross-Facility)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Holiday Modal */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Holiday</h3>
              <button onClick={() => setShowAddHolidayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddHolidaySubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Holiday Title</label>
                <input
                  type="text"
                  required
                  value={newHoliday.title}
                  onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })}
                  placeholder="e.g. Skin Health & Wellness Day"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newHoliday.holiday_type}
                    onChange={(e) => setNewHoliday({ ...newHoliday, holiday_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    <option value="National Holiday">National Holiday</option>
                    <option value="Statutory Holiday">Statutory Holiday</option>
                    <option value="Branch Special Holiday">Branch Special Holiday</option>
                    <option value="Operational Holiday">Operational / Maintenance Day</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Applicable {term.branchLabel}</label>
                <select
                  value={newHoliday.branch_id}
                  onChange={(e) => setNewHoliday({ ...newHoliday, branch_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  <option value="">All Branches (Organization-Wide)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="affectsPayroll"
                  checked={newHoliday.affects_payroll}
                  onChange={(e) => setNewHoliday({ ...newHoliday, affects_payroll: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="affectsPayroll" className="text-slate-700 font-medium">
                  Count as paid working day in monthly payroll calculation
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddHolidayModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Initiate Employee Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Initiate Employee Branch Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInitiateTransferSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Employee to Transfer</label>
                <select
                  required
                  value={newTransfer.employee_id}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const emp = employees.find((x) => x.id === parseInt(empId));
                    setNewTransfer({
                      ...newTransfer,
                      employee_id: empId,
                      department_id: emp ? String(emp.department_id) : ''
                    });
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code} - {emp.branch_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination {term.branchLabel}</label>
                  <select
                    required
                    value={newTransfer.to_branch_id}
                    onChange={(e) => setNewTransfer({ ...newTransfer, to_branch_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Select Destination --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Department</label>
                  <select
                    value={newTransfer.department_id}
                    onChange={(e) => setNewTransfer({ ...newTransfer, department_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.branch_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Effective Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={newTransfer.effective_date}
                    onChange={(e) => setNewTransfer({ ...newTransfer, effective_date: e.target.value, transfer_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Reporting Manager</label>
                  <select
                    value={newTransfer.new_reporting_manager_id}
                    onChange={(e) => setNewTransfer({ ...newTransfer, new_reporting_manager_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Select Reporting Lead --</option>
                    {employees.filter((e) => e.role.includes('Admin') || e.role.includes('Director') || e.role.includes('Doctor')).map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>{mgr.full_name} ({mgr.job_title})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Transfer (Mandatory)</label>
                <textarea
                  required
                  rows={2}
                  value={newTransfer.reason}
                  onChange={(e) => setNewTransfer({ ...newTransfer, reason: e.target.value })}
                  placeholder="e.g. Lead physician allocation for emergency night coverage..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                <strong>Governance Rule:</strong> The transfer will remain in <em>Pending Approval</em> status. Once authorized by HR, the employee's branch, rosters, and attendance will update automatically from the effective date, while all historical payroll slips remain permanently archived.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Assign / Replace Branch Manager Modal */}
      {showAssignManagerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Assign / Replace {term.branchLabel} Manager</h3>
              <button onClick={() => setShowAssignManagerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignManagerSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target {term.branchLabel}</label>
                <select
                  required
                  value={newManagerAssignment.branch_id}
                  onChange={(e) => setNewManagerAssignment({ ...newManagerAssignment, branch_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appoint Senior Staff Member</label>
                <select
                  required
                  value={newManagerAssignment.manager_employee_id}
                  onChange={(e) => setNewManagerAssignment({ ...newManagerAssignment, manager_employee_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  <option value="">-- Choose Eligible Lead --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.job_title} - {emp.branch_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Effective Start Date</label>
                <input
                  type="date"
                  required
                  value={newManagerAssignment.start_date}
                  onChange={(e) => setNewManagerAssignment({ ...newManagerAssignment, start_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delegated Responsibilities</label>
                <textarea
                  rows={2}
                  value={newManagerAssignment.responsibilities}
                  onChange={(e) => setNewManagerAssignment({ ...newManagerAssignment, responsibilities: e.target.value })}
                  placeholder="Local duty roster approvals, attendance punch monitoring, clinical compliance..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Replacement Notice:</strong> Appointing this staff member will automatically conclude the tenure of the previous active manager and preserve their tenure dates in the audit log.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignManagerModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {deletingBranch && (
        <DeleteConfirmModal
          isOpen={true}
          title={`Delete ${term.branchLabel}`}
          message={`Are you sure you want to delete "${deletingBranch.name}"? This action cannot be undone.`}
          onConfirm={() => {
            onDeleteBranch(deletingBranch.id);
            setDeletingBranch(null);
          }}
          onCancel={() => setDeletingBranch(null)}
        />
      )}

      {deletingDept && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Department"
          message={`Are you sure you want to delete "${deletingDept.name}"?`}
          onConfirm={() => {
            onDeleteDepartment(deletingDept.id);
            setDeletingDept(null);
          }}
          onCancel={() => setDeletingDept(null)}
        />
      )}

      {deletingHoliday && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Holiday"
          message={`Are you sure you want to remove "${deletingHoliday.title}" from the holiday calendar?`}
          onConfirm={() => handleDeleteHoliday(deletingHoliday.id)}
          onCancel={() => setDeletingHoliday(null)}
        />
      )}
    </div>
  );
}
