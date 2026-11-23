import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Building2, 
  Stethoscope, 
  Sparkles, 
  AlertCircle, 
  X,
  Edit,
  Trash2,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowLeftRight,
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function ShiftsView({ 
  rosters, 
  branches, 
  employees, 
  onAddRoster,
  onUpdateRoster,
  onDeleteRoster 
}) {
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'cards' or 'swaps'
  const [filterBranch, setFilterBranch] = useState('');
  const [isRosterLocked, setIsRosterLocked] = useState(true);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingRoster, setEditingRoster] = useState(null);
  const [deletingRoster, setDeletingRoster] = useState(null);

  // Shift swaps state
  const [shiftSwaps, setShiftSwaps] = useState([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [newSwap, setNewSwap] = useState({
    employee_id: employees[0]?.id || 1,
    requested_swap_with_id: employees[1]?.id || 2,
    shift_date: new Date().toISOString().split('T')[0],
    current_shift: 'Morning Shift (08:00 - 16:00)',
    target_shift: 'Evening Shift (14:00 - 22:00)',
    reason: ''
  });

  const [newRoster, setNewRoster] = useState({
    employee_id: (employees || [])[0]?.id || 1,
    branch_id: (branches || [])[0]?.id || 1,
    shift_date: new Date().toISOString().split('T')[0],
    shift_name: 'General OPD Morning Shift',
    start_time: '08:00',
    end_time: '16:00',
    is_on_call: false,
    notes: 'Standard clinical patient consultations'
  });

  const loadShiftSwaps = async () => {
    try {
      const res = await axios.get('/api/shifts/swaps');
      setShiftSwaps(res.data || []);
    } catch (err) {
      console.error('Error loading shift swaps', err);
    }
  };

  useEffect(() => {
    loadShiftSwaps();
  }, []);

  const handleApproveSwap = async (id) => {
    try {
      await axios.post(`/api/shifts/swaps/${id}/approve`, {
        approved_by: 'Dr. Rachel Adams (HR Manager)'
      });
      alert('Shift swap approved! Roster schedule updated.');
      loadShiftSwaps();
    } catch (err) {
      alert('Error approving swap: ' + err.message);
    }
  };

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/shifts/swaps', {
        ...newSwap,
        employee_id: parseInt(newSwap.employee_id),
        requested_swap_with_id: parseInt(newSwap.requested_swap_with_id)
      });
      alert('Shift swap request submitted for HR/HOD sign-off!');
      setShowSwapModal(false);
      setNewSwap({
        employee_id: employees[0]?.id || 1,
        requested_swap_with_id: employees[1]?.id || 2,
        shift_date: new Date().toISOString().split('T')[0],
        current_shift: 'Morning Shift (08:00 - 16:00)',
        target_shift: 'Evening Shift (14:00 - 22:00)',
        reason: ''
      });
      loadShiftSwaps();
    } catch (err) {
      alert('Error submitting swap request: ' + err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddRoster(newRoster);
    setShowModal(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingRoster) return;
    onUpdateRoster(editingRoster.id, editingRoster);
    setEditingRoster(null);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredRosters = rosters.filter((r) => {
    return !filterBranch || r.branch_id === parseInt(filterBranch);
  });

  const pendingSwapsCount = shiftSwaps.filter((s) => s.status === 'Pending Approval').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span>Duty Roster & Shifts Management</span>
            </h1>
            {isRosterLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" />
                Published & Locked by HR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Unlock className="w-3 h-3 text-amber-600" />
                Draft Schedule
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly duty planning (Mon–Sun), shift-change approval workflows, and locked audit logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRosterLocked(!isRosterLocked)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isRosterLocked 
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' 
                : 'bg-emerald-600 text-white border-emerald-600'
            }`}
          >
            {isRosterLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isRosterLocked ? 'Unlock Roster' : 'Publish & Lock Roster'}</span>
          </button>
          <button
            onClick={() => setShowSwapModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 text-purple-600" />
            <span>Request Shift Swap</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Roster Slot</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'weekly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Weekly Duty Calendar (Mon–Sun)
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Shift Cards View ({rosters.length})
          </button>
          <button
            onClick={() => setViewMode('swaps')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'swaps'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Shift Swaps & Changes</span>
            {pendingSwapsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                {pendingSwapsCount}
              </span>
            )}
          </button>
        </div>

        {/* Branch Filter */}
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
        >
          <option value="">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: WEEKLY DUTY ROSTER MATRIX (MON - SUN)                             */}
      {/* ========================================================================= */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current Week Duty Roster (Nov 09 – Nov 15)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              {isRosterLocked ? '🔒 Schedule is locked. Changes require HR/HOD sign-off.' : '✏️ Unlocked mode: Draft changes active.'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-3 px-4 border-r border-slate-200 min-w-[180px]">Practitioner / Staff</th>
                  {daysOfWeek.map((day, idx) => (
                    <th key={day} className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[120px]">
                      <div className="font-bold text-slate-800">{day}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Nov {9 + idx}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.slice(0, 10).map((emp, empIdx) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-200 bg-slate-50/30">
                      <div className="font-bold text-slate-900">{emp.full_name}</div>
                      <div className="text-[10px] text-blue-600">{emp.job_title}</div>
                      <div className="text-[10px] text-slate-400">{emp.branch_name}</div>
                    </td>
                    {daysOfWeek.map((day, dayIdx) => {
                      const isOff = (empIdx + dayIdx) % 7 === 6; // Sunday off or rotating
                      const isOnCall = (empIdx + dayIdx) % 5 === 0;
                      const shiftTime = isOff ? 'WEEKLY OFF' : isOnCall ? 'ON-CALL (24H)' : dayIdx % 2 === 0 ? '08:00 - 16:00' : '12:00 - 20:00';
                      return (
                        <td key={day} className="py-2.5 px-2 border-r border-slate-200 text-center">
                          {isOff ? (
                            <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                              OFF
                            </span>
                          ) : isOnCall ? (
                            <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              ⚡ On-Call
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {shiftTime}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SHIFT CARDS VIEW                                                  */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRosters.map((roster) => (
            <div 
              key={roster.id}
              className={`bg-white rounded-xl border p-4 shadow-xs relative transition-all ${
                roster.is_on_call ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {roster.shift_date}
                </span>
                {roster.is_on_call && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    On-Call Emergency
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{roster.employee_name}</h3>
              <p className="text-xs text-blue-600 font-medium">{roster.role_for_shift || 'Clinical Staff'}</p>
              <p className="text-[11px] text-slate-500 mt-1">{roster.branch_name}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{roster.start_time} - {roster.end_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingRoster({ ...roster })}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    title="Edit Shift"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingRoster(roster)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Shift"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SHIFT SWAP & CHANGE REQUESTS QUEUE                                */}
      {/* ========================================================================= */}
      {viewMode === 'swaps' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Shift Change & Colleague Swap Requests ({shiftSwaps.length})
            </h3>
            <button
              onClick={() => setShowSwapModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              Initiate Shift Swap
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Requesting Staff</th>
                  <th className="py-2.5 px-4">Requested Swap Colleague</th>
                  <th className="py-2.5 px-4">Shift Date & Timings</th>
                  <th className="py-2.5 px-4">Justification Reason</th>
                  <th className="py-2.5 px-4">Approval Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shiftSwaps.map((s) => {
                  const isPending = s.status === 'Pending Approval';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.employee_name}</div>
                        <div className="text-[10px] text-slate-400">{s.branch_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{s.requested_swap_with_name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>{s.shift_date}</div>
                        <div className="text-[10px] text-blue-600">{s.current_shift} $\rightarrow$ {s.target_shift}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {s.reason}
                      </td>
                      <td className="py-3 px-4">
                        {s.status === 'Approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved by HR
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
                            onClick={() => handleApproveSwap(s.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1 ml-auto"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve Swap</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">{s.approved_by || 'Completed'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. Assign Roster Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Assign Shift Roster Slot</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Practitioner / Staff</label>
                <select
                  value={newRoster.employee_id}
                  onChange={(e) => setNewRoster({ ...newRoster, employee_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.branch_name})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duty Date</label>
                  <input
                    type="date"
                    required
                    value={newRoster.shift_date}
                    onChange={(e) => setNewRoster({ ...newRoster, shift_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinic Branch</label>
                  <select
                    value={newRoster.branch_id}
                    onChange={(e) => setNewRoster({ ...newRoster, branch_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newRoster.start_time}
                    onChange={(e) => setNewRoster({ ...newRoster, start_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newRoster.end_time}
                    onChange={(e) => setNewRoster({ ...newRoster, end_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="onCallCheck"
                  checked={newRoster.is_on_call}
                  onChange={(e) => setNewRoster({ ...newRoster, is_on_call: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="onCallCheck" className="text-slate-700 font-medium">
                  Designate as Emergency On-Call Duty (24h alert)
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Shift Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Request Shift Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Request Shift Swap / Change</h3>
              <button onClick={() => setShowSwapModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSwapSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requesting Staff</label>
                <select
                  value={newSwap.employee_id}
                  onChange={(e) => setNewSwap({ ...newSwap, employee_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.branch_name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Colleague to Swap With</label>
                <select
                  value={newSwap.requested_swap_with_id}
                  onChange={(e) => setNewSwap({ ...newSwap, requested_swap_with_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.job_title})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duty Date</label>
                <input
                  type="date"
                  required
                  value={newSwap.shift_date}
                  onChange={(e) => setNewSwap({ ...newSwap, shift_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Duty Swap (Mandatory)</label>
                <textarea
                  rows={2}
                  required
                  value={newSwap.reason}
                  onChange={(e) => setNewSwap({ ...newSwap, reason: e.target.value })}
                  placeholder="e.g. Personal emergency, covering VIP procedure appointment..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Submit Swap Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingRoster && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Shift Assignment"
          message={`Are you sure you want to remove this shift for ${deletingRoster.employee_name} on ${deletingRoster.shift_date}?`}
          onConfirm={() => {
            onDeleteRoster(deletingRoster.id);
            setDeletingRoster(null);
          }}
          onCancel={() => setDeletingRoster(null)}
        />
      )}
    </div>
  );
}
