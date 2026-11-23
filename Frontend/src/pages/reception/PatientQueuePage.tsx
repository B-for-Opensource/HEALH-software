import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  PhoneCall, 
  Stethoscope, 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  Clock, 
  Filter,
  AlertCircle
} from 'lucide-react';
import { appointmentsApi } from '@/api';
import type { Appointment } from '@/types';
import { cn, formatDateTime, getStatusBadgeClass } from '@/lib/utils';

export default function PatientQueuePage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const res = await appointmentsApi.queue();
      // res may be { data: [...] } or direct array
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAppointments(list);
    } catch (err: any) {
      console.error('Queue load error', err);
      setError(err?.response?.data?.message || 'Failed to load live queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(fetchQueue, 10000);
    return () => clearInterval(timer);
  }, [fetchQueue]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await appointmentsApi.updateStatus(id, newStatus);
      await fetchQueue();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = appointments.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const stats = {
    waiting: appointments.filter((a) => a.status === 'Waiting').length,
    inConsult: appointments.filter((a) => a.status === 'In-Consult' || a.status === 'Called').length,
    billingPending: appointments.filter((a) => a.status === 'Billing-Pending').length,
    completed: appointments.filter((a) => a.status === 'Completed').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Queue & Token Board</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live outpatient queue — auto-refreshes every 10 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reception/register')}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            New Registration
          </button>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-violet-600')} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Waiting</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.waiting}</p>
          <p className="text-xs text-slate-400 mt-1">Patients in waiting hall</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">In Consult / Called</span>
            <Stethoscope className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.inConsult}</p>
          <p className="text-xs text-slate-400 mt-1">Inside doctor's cabin</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Billing Pending</span>
            <Receipt className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.billingPending}</p>
          <p className="text-xs text-slate-400 mt-1">Sent to cashier</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.completed}</p>
          <p className="text-xs text-slate-400 mt-1">Visits finished</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-sm">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {['all', 'Waiting', 'In-Consult', 'Billing-Pending', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition text-xs capitalize',
              statusFilter === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {tab === 'all' ? 'All Tokens' : tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Token #</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">OP Number</th>
                <th className="py-3.5 px-4">Doctor / Department</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Loading queue...' : 'No tokens in this status for today'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-700 text-base">
                      #{item.token_no}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.patient_name || 'Patient'}</div>
                      <div className="text-xs text-slate-400">{item.phone || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {item.op_no || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{item.doctor_name || 'Assigned Doctor'}</div>
                      <div className="text-xs text-slate-400">{item.department_name || 'General'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {item.visit_type || 'Walk-in'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(item.appointment_date || item.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                          getStatusBadgeClass(item.status)
                        )}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === 'Waiting' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'In-Consult')}
                            disabled={updatingId === item.id}
                            className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            <PhoneCall className="w-3 h-3" />
                            Call
                          </button>
                        )}
                        {item.status === 'In-Consult' && (
                          <>
                            <button
                              onClick={() => navigate(`/clinical/workbench/${item.id}`)}
                              className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                            >
                              <Stethoscope className="w-3 h-3" />
                              Workbench
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'Billing-Pending')}
                              disabled={updatingId === item.id}
                              className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded text-xs font-medium transition"
                            >
                              <Receipt className="w-3 h-3" />
                              To Billing
                            </button>
                          </>
                        )}
                        {item.status === 'Billing-Pending' && (
                          <>
                            <button
                              onClick={() => navigate(`/clinical/workbench/${item.id}`)}
                              className="inline-flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-1 rounded text-xs font-medium transition"
                              title="View Doctor Clinical Notes & Rx"
                            >
                              <Stethoscope className="w-3 h-3" />
                              Rx
                            </button>
                            <button
                              onClick={() => navigate(`/billing/pos?appointment_id=${item.id}&patient_id=${item.patient_id}`)}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                            >
                              <Receipt className="w-3 h-3" />
                              Bill Patient
                            </button>
                          </>
                        )}
                        {item.status === 'Completed' && (
                          <button
                            onClick={() => navigate(`/clinical/workbench/${item.id}`)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700 px-2.5 py-1 rounded text-xs font-medium transition"
                            title="View Doctor Consultation Notes & Prescribed Medicines"
                          >
                            <Stethoscope className="w-3 h-3 text-violet-600" />
                            <span>View Notes & Rx</span>
                          </button>
                        )}
                        {!['Completed', 'Cancelled'].includes(item.status) && (
                          <button
                            onClick={() => {
                              if (confirm('Cancel this token appointment?')) {
                                handleStatusChange(item.id, 'Cancelled');
                              }
                            }}
                            className="inline-flex items-center text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                            title="Cancel Token"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
