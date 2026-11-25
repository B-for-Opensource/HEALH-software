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
  AlertCircle,
  Activity,
  Tv,
  Maximize2,
  Minimize2,
  Volume2,
  ArrowLeft
} from 'lucide-react';
import { appointmentsApi, mastersApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { Appointment } from '@/types';
import { cn, formatDateTime, getStatusBadgeClass } from '@/lib/utils';

export default function PatientQueuePage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [tvMode, setTvMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    if (!tvMode) return;
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, [tvMode]);

  const user = useAuthStore((s) => s.user);
  const isDoctor = user?.role === 'Doctor';
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [doctorFilter, setDoctorFilter] = useState<string>(() => isDoctor ? (user?.id || user?.full_name || '') : 'all');

  useEffect(() => {
    mastersApi.doctors().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDoctorsList(list);
    });
  }, []);

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
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;

    if (doctorFilter === 'all') return true;

    const docId = user?.id;
    const docFullName = (user?.full_name || '').toLowerCase();
    const docName = (user?.name || user?.username || '').toLowerCase();
    const aDocId = a.doctor_id;
    const aDocName = (a.doctor_name || '').toLowerCase();

    // If filtering by current doctor
    if (isDoctor && (doctorFilter === docId || doctorFilter === user?.full_name || doctorFilter === user?.name)) {
      if (docId && aDocId && docId === aDocId) return true;
      if (docFullName && aDocName && (aDocName.includes(docFullName) || docFullName.includes(aDocName))) return true;
      if (docName && aDocName && (aDocName.includes(docName) || docName.includes(aDocName))) return true;
      return false;
    }

    if (a.doctor_id === doctorFilter) return true;
    const selectedDoc = doctorsList.find((d) => d.id === doctorFilter);
    if (selectedDoc && aDocName.includes((selectedDoc.full_name || '').toLowerCase())) return true;
    return aDocName.includes(doctorFilter.toLowerCase());
  });

  const stats = {
    waiting: appointments.filter((a) => a.status === 'Waiting').length,
    inConsult: appointments.filter((a) => a.status === 'In-Consult' || a.status === 'Called').length,
    billingPending: appointments.filter((a) => a.status === 'Billing-Pending').length,
    completed: appointments.filter((a) => a.status === 'Completed').length,
  };

  // FULLSCREEN TV WAITING LOUNGE DISPLAY MODE (For Waiting Hall TVs & Wall Screens)
  if (tvMode) {
    const calledTokens = appointments.filter((a) => a.status === 'Called' || a.status === 'In-Consult');
    const waitingTokens = appointments.filter((a) => a.status === 'Waiting');

    return (
      <div className="fixed inset-0 z-50 bg-[#120F0D] text-white flex flex-col p-6 sm:p-8 md:p-10 overflow-y-auto font-brand-sans">
        {/* TV Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#3A2E26] gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#965F36] text-white font-serif font-black flex items-center justify-center text-2xl shadow-lg">
              H
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white font-brand-serif">
                HEAL CLINIC & AESTHETIC CARE
              </h1>
              <p className="text-xs sm:text-sm text-[#C4B3A3] mt-0.5 font-medium">
                Live Outpatient Waiting Hall & Token Consultation Calling Board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-xl sm:text-3xl font-mono font-bold text-[#FAAE5A] block leading-none">{currentTime}</span>
              <span className="text-xs text-[#8E7E73]">Live Auto-Sync (10s)</span>
            </div>
            <button
              onClick={() => setTvMode(false)}
              className="bg-[#2C231E] hover:bg-[#3D312A] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-[#4D3F35] transition shadow-md"
            >
              <Minimize2 className="w-4 h-4" />
              Exit TV Display
            </button>
          </div>
        </div>

        {/* TV Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          {/* NOW CONSULTING / CALLED (Primary Attention Zone - 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[#FAAE5A] flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                Now Consulting / Inside Doctor's Cabin
              </span>
              <span className="text-xs text-[#8E7E73] font-mono">
                {calledTokens.length} Active Consultations
              </span>
            </div>

            {calledTokens.length === 0 ? (
              <div className="flex-1 bg-[#1E1815] rounded-3xl border-2 border-dashed border-[#3A2E26] p-8 sm:p-12 flex flex-col items-center justify-center text-center text-[#8E7E73]">
                <Clock className="w-16 h-16 text-[#5C4A3E] mb-3 animate-pulse" />
                <h3 className="text-xl sm:text-2xl font-bold text-[#C4B3A3]">Next Token Will Be Called Shortly</h3>
                <p className="text-sm text-[#8E7E73] mt-1">Please relax in the waiting lounge with your token slip</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calledTokens.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#241C18] border-2 border-[#965F36] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95"
                  >
                    <div>
                      <span className="bg-[#965F36] text-white text-[11px] sm:text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                        {t.status === 'Called' ? '🔔 Patient Called to Cabin' : '🩺 Now In-Consultation'}
                      </span>
                      <h2 className="text-3xl sm:text-5xl font-black text-white mt-3">
                        {t.patient_name}
                      </h2>
                      <p className="text-base sm:text-xl text-[#FAAE5A] font-semibold mt-1">
                        Doctor: {t.doctor_name || 'Dr. Ananya Nair'}
                      </p>
                      <p className="text-xs text-[#8E7E73] mt-0.5">OP: {t.op_no} · Cabin: Room 101 (Dermatology)</p>
                    </div>

                    <div className="bg-[#17120F] border border-[#4D3F35] rounded-2xl p-4 sm:p-6 text-center sm:text-right shrink-0 min-w-[150px]">
                      <span className="text-xs text-[#8E7E73] font-bold uppercase tracking-wider block">Token Number</span>
                      <span className="text-5xl sm:text-7xl font-black font-mono text-[#FAAE5A] block leading-none mt-1">
                        #{t.token_no}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UP NEXT IN WAITING LOUNGE (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[#C4B3A3]">
                Waiting Lounge Queue (Up Next)
              </span>
              <span className="text-xs text-[#8E7E73] font-mono">
                {waitingTokens.length} Waiting
              </span>
            </div>

            <div className="flex-1 bg-[#1A1411] rounded-3xl border border-[#3A2E26] p-4 divide-y divide-[#2C231E] overflow-y-auto max-h-[65vh]">
              {waitingTokens.length === 0 ? (
                <div className="py-12 text-center text-[#8E7E73] text-sm">
                  Waiting lounge queue is currently empty.
                </div>
              ) : (
                waitingTokens.map((t, idx) => (
                  <div key={t.id} className="py-3 px-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-[#2C231E] text-[#FAAE5A] font-mono font-black text-lg flex items-center justify-center shrink-0">
                        #{t.token_no}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-white leading-tight">{t.patient_name}</h4>
                        <p className="text-xs text-[#8E7E73]">{t.doctor_name || 'Assigned Doctor'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#A39487] bg-[#2C231E] px-2.5 py-1 rounded-lg">
                      Slot {idx + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Queue & Token Board</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live outpatient queue — auto-refreshes every 10 seconds
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* TV Waiting Hall Mode Button */}
          <button
            onClick={() => setTvMode(true)}
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition"
            title="Launch Fullscreen Waiting Hall TV Display Mode"
          >
            <Tv className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">TV Waiting Hall Mode</span>
            <span className="sm:hidden">TV Mode</span>
          </button>
          <button
            onClick={() => navigate('/reception/register')}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Patient</span>
          </button>
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-violet-600')} />
            <span className="hidden sm:inline">Refresh</span>
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

      {/* Filter Tabs & Doctor Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto text-sm">
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

        {/* Doctor Scoping Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Doctor:</span>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="all">All Doctors (Clinic-wide)</option>
            {doctorsList.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.full_name} {isDoctor && doc.id === user?.id ? '(Me)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Scoping Indicator Banner */}
      {isDoctor && (
        <div className="bg-[#FAF7F2] border border-[#E0D3C5] px-3.5 py-2 rounded-xl text-xs flex items-center justify-between text-[#685B52]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {doctorFilter === 'all' ? (
                <>Viewing <strong className="text-[#1E1B18]">all clinic tokens</strong>. Select your name in the doctor dropdown above to isolate your personal queue.</>
              ) : (
                <>Isolated view: Showing tokens assigned to <strong className="text-[#1E1B18]">{user?.full_name || 'Dr. You'}</strong>.</>
              )}
            </span>
          </div>
          {doctorFilter !== (user?.id || user?.full_name) && (
            <button
              onClick={() => setDoctorFilter(user?.id || user?.full_name || '')}
              className="text-[#965F36] hover:underline font-bold text-[11px]"
            >
              Switch to My Tokens Only
            </button>
          )}
        </div>
      )}

      {/* MOBILE SCREEN TOKENS CARD LIST (visible only on mobile screens < sm) */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-xs border border-slate-200">
            {loading ? 'Loading queue...' : 'No tokens in this status for today'}
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-xl text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
                    #{item.token_no}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.patient_name || 'Patient'}</h3>
                    <p className="text-xs font-mono text-slate-500">{item.op_no || 'OP-NEW'} {item.phone ? `· ${item.phone}` : ''}</p>
                  </div>
                </div>
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border', getStatusBadgeClass(item.status))}>
                  {item.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg flex items-center justify-between">
                <span>🩺 {item.doctor_name || 'Dr. Ananya Nair'}</span>
                <span className="text-[11px] text-slate-400">{formatDateTime(item.appointment_date || item.created_at)}</span>
              </div>

              {/* Mobile Actions Toolbar */}
              <div className="pt-1 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                {item.status === 'Waiting' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(item.id, 'In-Consult')}
                      disabled={updatingId === item.id}
                      className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Send to Doctor
                    </button>
                    <button
                      onClick={() => navigate('/daycare/lounges')}
                      className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Nurse Desk
                    </button>
                  </>
                )}
                {item.status === 'In-Consult' && (
                  <>
                    <button
                      onClick={() => navigate(`/clinical/workbench/${item.id}`)}
                      className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Open Workbench
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'Billing-Pending')}
                      className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      To Bill
                    </button>
                  </>
                )}
                {item.status === 'Billing-Pending' && (
                  <button
                    onClick={() => navigate(`/billing/pos?appointment_id=${item.id}&patient_id=${item.patient_id}`)}
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Bill Patient Now
                  </button>
                )}
                {item.status === 'Completed' && (
                  <button
                    onClick={() => navigate(`/clinical/workbench/${item.id}`)}
                    className="w-full py-2 bg-slate-100 text-slate-700 hover:text-violet-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-violet-600" />
                    View Notes & Rx
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* TABLET, LAPTOP & TV SCREEN TABLE VIEW (hidden on mobile, visible on sm and up) */}
      <div className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'In-Consult')}
                              disabled={updatingId === item.id}
                              className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                              title="Send patient into Doctor Workbench"
                            >
                              <Stethoscope className="w-3 h-3" />
                              Send to Doctor
                            </button>
                            <button
                              onClick={() => navigate('/daycare/lounges')}
                              className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-xs font-medium transition"
                              title="Route to Nurse for Vitals / Dressing"
                            >
                              <Activity className="w-3 h-3" />
                              Nurse
                            </button>
                          </>
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
