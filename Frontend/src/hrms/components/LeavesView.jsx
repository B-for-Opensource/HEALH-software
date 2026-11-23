import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Stethoscope
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function LeavesView({
  leaves,
  branches,
  employees,
  onApplyLeave,
  onUpdateLeave,
  onReviewLeave,
  onDeleteLeave
}) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [deletingLeave, setDeletingLeave] = useState(null);
  const [reviewModalLeave, setReviewModalLeave] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const [newLeave, setNewLeave] = useState({
    employee_id: employees[0]?.id || 1,
    branch_id: branches[0]?.id || 1,
    leave_type: 'Casual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    substitute_doctor_id: '',
    coverage_status: 'Pending Acceptance'
  });

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter === 'All') return true;
    return l.status === statusFilter;
  });

  const handleApplySubmit = (e) => {
    e.preventDefault();
    onApplyLeave({
      ...newLeave,
      substitute_doctor_id: newLeave.substitute_doctor_id ? parseInt(newLeave.substitute_doctor_id) : null
    });
    setShowApplyModal(false);
    setNewLeave({
      employee_id: employees[0]?.id || 1,
      branch_id: branches[0]?.id || 1,
      leave_type: 'Casual',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      reason: '',
      substitute_doctor_id: ''
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingLeave) return;
    onUpdateLeave(editingLeave.id, editingLeave);
    setEditingLeave(null);
  };

  const handleReviewAction = (actionStatus) => {
    if (!reviewModalLeave) return;
    onReviewLeave(reviewModalLeave.id, actionStatus, reviewComment);
    setReviewModalLeave(null);
    setReviewComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <span>Leave Tracker & Doctor Coverage</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage time-off requests with mandatory clinical substitute doctor approvals
          </p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl w-fit text-xs font-semibold">
        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === status
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            {status}
            {status === 'Pending' && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {leaves.filter(l => l.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Doctor Coverage / Replacement</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Approval Actions & CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{leave.employee_name}</div>
                      <div className="text-[10px] text-slate-400">{leave.branch_name}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{leave.leave_type}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-medium">
                        {leave.start_date} <span className="text-slate-400">to</span> {leave.end_date}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">{leave.total_days} Day(s)</div>
                    </td>

                    <td className="py-3 px-4">
                      {leave.substitute_doctor_name ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span className="font-medium text-[11px]">{leave.substitute_doctor_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {leave.coverage_confirmed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Coverage Confirmed
                              </span>
                            ) : (
                              <button
                                onClick={() => onUpdateLeave(leave.id, { ...leave, coverage_confirmed: true })}
                                className="inline-flex items-center gap-1 text-[10px] text-amber-700 hover:text-emerald-700 font-semibold bg-amber-50 hover:bg-emerald-50 px-1.5 py-0.5 rounded border border-amber-200 hover:border-emerald-300 transition-colors"
                                title="Click to confirm duty coverage handover"
                              >
                                <Clock className="w-3 h-3" /> Confirm Handover
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Not Required / Non-clinical</span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate">
                      {leave.reason}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${leave.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : leave.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                        {leave.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {leave.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => { setReviewModalLeave(leave); setReviewComment('Approved. Coverage confirmed.'); }}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setReviewModalLeave(leave); setReviewComment('Rejected due to clinic staff shortage.'); }}
                              className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}

                        <button
                          onClick={() => setEditingLeave({ ...leave })}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Edit Leave Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingLeave(leave)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Cancel/Delete Leave"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No leave records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Submit Leave Application</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Applying Employee *</label>
                <select
                  value={newLeave.employee_id}
                  onChange={(e) => {
                    const empId = parseInt(e.target.value);
                    const emp = employees.find(x => x.id === empId);
                    setNewLeave({
                      ...newLeave,
                      employee_id: empId,
                      branch_id: emp ? emp.branch_id : newLeave.branch_id
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.role} - {e.branch_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Type *</label>
                <select
                  value={newLeave.leave_type}
                  onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="Casual">Casual Leave (CL)</option>
                  <option value="Sick">Sick / Medical Leave (SL)</option>
                  <option value="Annual">Annual Paid Leave (EL)</option>
                  <option value="Early-Out Permission">Early-Out Permission (Up to 2 Hours)</option>
                  <option value="Late-Arrival Permission">Late-Arrival Permission (Up to 2 Hours)</option>
                  <option value="Compensatory Off">Compensatory Off (Comp-Off)</option>
                  <option value="Maternity/Paternity">Maternity / Paternity Leave</option>
                  <option value="CME Conference">CME Medical Conference / Training</option>
                  <option value="Emergency">Emergency Clinical Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newLeave.start_date}
                    onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={newLeave.end_date}
                    onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Substitute Doctor Coverage */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <label className="block font-bold text-blue-900 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  <span>Substitute Clinical Coverage (Doctor / Nurse)</span>
                </label>
                <p className="text-[10px] text-blue-700 mb-1.5">
                  Essential for OPD clinics and aesthetic laser treatment handover
                </p>
                <select
                  value={newLeave.substitute_doctor_id}
                  onChange={(e) => setNewLeave({ ...newLeave, substitute_doctor_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="">None / Not Required (Admin / Support staff)</option>
                  {employees
                    .filter(e => e.id !== newLeave.employee_id)
                    .map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.designation_title || e.role})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows="2"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Provide clinical or personal justification..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Modal */}
      {editingLeave && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Edit Leave Request</h2>
              <button onClick={() => setEditingLeave(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={editingLeave.leave_type}
                  onChange={(e) => setEditingLeave({ ...editingLeave, leave_type: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="Casual">Casual Leave (CL)</option>
                  <option value="Sick">Sick / Medical Leave (SL)</option>
                  <option value="Annual">Annual Paid Leave (EL)</option>
                  <option value="Early-Out Permission">Early-Out Permission (Up to 2 Hours)</option>
                  <option value="Late-Arrival Permission">Late-Arrival Permission (Up to 2 Hours)</option>
                  <option value="Compensatory Off">Compensatory Off (Comp-Off)</option>
                  <option value="Maternity/Paternity">Maternity / Paternity Leave</option>
                  <option value="CME Conference">CME Medical Conference</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingLeave.start_date}
                    onChange={(e) => setEditingLeave({ ...editingLeave, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editingLeave.end_date}
                    onChange={(e) => setEditingLeave({ ...editingLeave, end_date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <textarea
                  rows="2"
                  value={editingLeave.reason}
                  onChange={(e) => setEditingLeave({ ...editingLeave, reason: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLeave(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Update Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalLeave && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Review Leave Request</h3>
            <p className="text-xs text-slate-500 mt-1">
              For <strong>{reviewModalLeave.employee_name}</strong> ({reviewModalLeave.leave_type} - {reviewModalLeave.total_days} days)
            </p>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Review Comment / Note</label>
              <textarea
                rows="2"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setReviewModalLeave(null)}
                className="px-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewAction('Rejected')}
                className="px-3 py-1 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => handleReviewAction('Approved')}
                className="px-3.5 py-1 text-xs bg-emerald-600 text-white rounded-lg font-semibold shadow-xs"
              >
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Leave Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingLeave)}
        title="Cancel & Delete Leave Request"
        itemType="Leave Request"
        itemName={`${deletingLeave?.employee_name} (${deletingLeave?.leave_type} Leave)`}
        onConfirm={() => {
          onDeleteLeave(deletingLeave.id);
          setDeletingLeave(null);
        }}
        onCancel={() => setDeletingLeave(null)}
      />
    </div>
  );
}
