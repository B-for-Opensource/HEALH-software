import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  MapPin, 
  Laptop,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  Check,
  Navigation,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function AttendanceView({ 
  attendanceLogs, 
  branches, 
  employees,
  currentUser, 
  onPunch, 
  punchLoading,
  onAddManualAttendance,
  onDeleteAttendance
}) {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'regularization'
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Multi-branch active punch selection
  const [punchBranchId, setPunchBranchId] = useState(branches[0]?.id || 1);

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [deletingLog, setDeletingLog] = useState(null);

  // Regularization requests state
  const [regularizations, setRegularizations] = useState([]);
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [newRegularize, setNewRegularize] = useState({
    employee_id: currentUser?.id || employees[0]?.id || 1,
    request_type: 'Late Arrival Regularization',
    date: new Date().toISOString().split('T')[0],
    punch_time: '08:35',
    scheduled_time: '08:00',
    reason: ''
  });

  const [manualEntry, setManualEntry] = useState({
    employee_id: employees[0]?.id || 1,
    branch_id: branches[0]?.id || 1,
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '17:30',
    status: 'Present',
    notes: 'Admin manual timecard entry'
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadRegularizations();
  }, []);

  const loadRegularizations = async () => {
    try {
      const res = await axios.get('/api/attendance/regularize');
      setRegularizations(res.data || []);
    } catch (err) {
      console.error('Error loading regularizations', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredLogs = attendanceLogs.filter((log) => {
    const matchBranch = !filterBranch || log.branch_id === parseInt(filterBranch);
    const matchDate = !filterDate || log.date === filterDate;
    const matchSearch = !searchTerm || 
      log.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchBranch && matchDate && matchSearch;
  });

  const presentCount = attendanceLogs.filter(a => a.date === todayStr && ['Present', 'Late'].includes(a.status)).length;
  const lateCount = attendanceLogs.filter(a => a.date === todayStr && a.status === 'Late').length;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    onAddManualAttendance(manualEntry);
    setShowManualModal(false);
  };

  const handleRegularizeSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/attendance/regularize', {
        ...newRegularize,
        employee_id: parseInt(newRegularize.employee_id)
      });
      alert('Regularization request submitted to HR for sign-off!');
      setShowRegularizeModal(false);
      setNewRegularize({
        employee_id: currentUser?.id || employees[0]?.id || 1,
        request_type: 'Late Arrival Regularization',
        date: new Date().toISOString().split('T')[0],
        punch_time: '08:35',
        scheduled_time: '08:00',
        reason: ''
      });
      loadRegularizations();
    } catch (err) {
      alert('Error submitting regularization request: ' + err.message);
    }
  };

  const handleApproveRegularization = async (id) => {
    try {
      await axios.post(`/api/attendance/regularize/${id}/approve`, {
        reviewed_by: 'Dr. Rachel Adams (HR Manager)'
      });
      alert('Regularization approved! Attendance status regularized.');
      loadRegularizations();
    } catch (err) {
      alert('Error approving request: ' + err.message);
    }
  };

  const pendingRegsCount = regularizations.filter((r) => r.status === 'Pending Approval').length;
  const selectedPunchBranchObj = branches.find(b => b.id === parseInt(punchBranchId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Attendance, Multi-Branch Punch & Regularization</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geofenced terminal web punch, multi-branch duty roaming, late-arrival regularizations, and early-out permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRegularizeModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
          >
            <FileCheck2 className="w-4 h-4 text-amber-600" />
            <span>Request Regularization</span>
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Attendance Entry</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Web Punch & Daily Attendance</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {attendanceLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('regularization')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'regularization'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Late Arrival & Early-Out Regularization</span>
          {pendingRegsCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
              {pendingRegsCount} Pending
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
              {regularizations.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE MULTI-BRANCH WEB PUNCH & LOGS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Live Web Punch Card with Multi-Branch Selection */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Multi-Branch Geofenced Web Punch Terminal</span>
              </div>
              <h2 className="text-3xl font-extrabold font-mono mt-1 text-white tracking-tight">
                {currentTime.toLocaleTimeString()}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              {/* Multi-Branch Roaming Selector */}
              <div className="flex items-center gap-2 mt-4 text-xs bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 max-w-md">
                <Building2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="text-slate-300">Clocking in at:</span>
                <select
                  value={punchBranchId}
                  onChange={(e) => setPunchBranchId(e.target.value)}
                  className="bg-slate-900 text-white font-bold px-2 py-1 rounded border border-slate-600 focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
                <span className="text-[10px] text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Geofence Verified
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-center sm:text-right">
                <div className="text-xs text-slate-400">Punched as:</div>
                <div className="text-sm font-bold text-white">{currentUser?.full_name || 'Staff Member'}</div>
                <div className="text-[11px] text-blue-300">{currentUser?.job_title || currentUser?.role}</div>
              </div>
              <button
                onClick={onPunch}
                disabled={punchLoading}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm flex items-center gap-2.5 disabled:opacity-50"
              >
                <Clock className="w-5 h-5" />
                <span>{punchLoading ? 'Recording Geofence...' : 'Punch In / Punch Out'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-xs font-medium">Today's Present Staff</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{presentCount}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified on duty</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-xs font-medium">Late Arrivals Today</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Requires HR excuse verification</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-xs font-medium">Pending Regularizations</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{pendingRegsCount}</div>
              <div className="text-[11px] text-indigo-600 font-medium mt-1">Late / Early-Out requests</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-400 text-xs font-medium">Average Duty Hours</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">8.2 hrs</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Target: 8.0 hrs / shift</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by employee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white"
              />
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Punched Facility</th>
                    <th className="py-3 px-4">Punch In $\rightarrow$ Punch Out</th>
                    <th className="py-3 px-4">Work Duration</th>
                    <th className="py-3 px-4">Status & Geofence</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.slice(0, 25).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.employee_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.employee_code}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {log.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{log.branch_name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-700">{log.check_in || '08:00'}</span>
                          <span className="text-slate-400">$\rightarrow$</span>
                          <span className="font-bold text-slate-700">{log.check_out || 'Active'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.total_hours ? `${log.total_hours} hrs` : 'In Progress'}
                        {log.overtime_hours > 0 && (
                          <span className="text-[10px] text-purple-600 block">+{log.overtime_hours} hrs OT</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'Present' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            On Time • Geofence Verified
                          </span>
                        ) : log.status === 'Late' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            Late Arrival
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeletingLog(log)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Record"
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
      {/* TAB 2: ATTENDANCE REGULARIZATION & PERMISSIONS                             */}
      {/* ========================================================================= */}
      {activeTab === 'regularization' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Exception Governance Policy:</strong> When staff arrive late or request to leave early, they must submit a valid business or medical justification. Once approved by HR, full day attendance credit is awarded automatically.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Submitted Regularization & Permission Requests ({regularizations.length})
              </h3>
              <button
                onClick={() => setShowRegularizeModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Exception Request</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Staff Member</th>
                    <th className="py-2.5 px-4">Request Type</th>
                    <th className="py-2.5 px-4">Date & Duty Timing</th>
                    <th className="py-2.5 px-4">Submitted Reason</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">HR Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {regularizations.map((r) => {
                    const isPending = r.status === 'Pending Approval';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{r.employee_name}</div>
                          <div className="text-[10px] text-slate-400">{r.branch_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.request_type.includes('Late') ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {r.request_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div>{r.date}</div>
                          <div className="text-[10px] text-slate-400">Punch: {r.punch_time} vs Sched: {r.scheduled_time}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-medium text-slate-800">{r.reason}</p>
                          {r.review_notes && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">HR: {r.review_notes}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {r.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved & Regularized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Awaiting HR Sign-off
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <button
                              onClick={() => handleApproveRegularization(r.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1 ml-auto"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">{r.reviewed_by || 'Completed'}</span>
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
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. Request Regularization Modal */}
      {showRegularizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Attendance Regularization Request</h3>
              <button onClick={() => setShowRegularizeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegularizeSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Member</label>
                <select
                  value={newRegularize.employee_id}
                  onChange={(e) => setNewRegularize({ ...newRegularize, employee_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.branch_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Request Type</label>
                <select
                  value={newRegularize.request_type}
                  onChange={(e) => setNewRegularize({ ...newRegularize, request_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  <option value="Late Arrival Regularization">Late Arrival Regularization</option>
                  <option value="Early-Out Permission">Early-Out Permission</option>
                  <option value="Missed Punch Regularization">Missed Biometric Punch</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newRegularize.date}
                    onChange={(e) => setNewRegularize({ ...newRegularize, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Actual Punch Time</label>
                  <input
                    type="time"
                    required
                    value={newRegularize.punch_time}
                    onChange={(e) => setNewRegularize({ ...newRegularize, punch_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justification / Reason (Mandatory)</label>
                <textarea
                  rows={2}
                  required
                  value={newRegularize.reason}
                  onChange={(e) => setNewRegularize({ ...newRegularize, reason: e.target.value })}
                  placeholder="e.g. Severe transit highway congestion, assisted critical patient prior to check-in..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegularizeModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Submit for HR Sign-off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Manual Attendance Adjustment Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Manual Attendance Entry</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Member</label>
                <select
                  value={manualEntry.employee_id}
                  onChange={(e) => setManualEntry({ ...manualEntry, employee_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.branch_name})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={manualEntry.date}
                    onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={manualEntry.branch_id}
                    onChange={(e) => setManualEntry({ ...manualEntry, branch_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Punch In Time</label>
                  <input
                    type="time"
                    required
                    value={manualEntry.check_in}
                    onChange={(e) => setManualEntry({ ...manualEntry, check_in: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Punch Out Time</label>
                  <input
                    type="time"
                    value={manualEntry.check_out}
                    onChange={(e) => setManualEntry({ ...manualEntry, check_out: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Audit Reason</label>
                <input
                  type="text"
                  value={manualEntry.notes}
                  onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Log Confirmation */}
      {deletingLog && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Attendance Record"
          message={`Are you sure you want to delete this punch record for ${deletingLog.employee_name} on ${deletingLog.date}?`}
          onConfirm={() => {
            onDeleteAttendance(deletingLog.id);
            setDeletingLog(null);
          }}
          onCancel={() => setDeletingLog(null)}
        />
      )}
    </div>
  );
}
