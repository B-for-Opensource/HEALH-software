import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Activity,
  Stethoscope,
  Pill,
  Bandage,
  FlaskConical,
  Receipt,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  Flame,
  Send
} from 'lucide-react';
import { appointmentsApi, subscribeToDbChanges, getDb } from '@/api';
import { useAuthStore } from '@/store/authStore';

export interface PipelineStats {
  reception: number;
  nurseVitals: number;
  passedToDoctor: number;
  sentToPharmacy: number;
  sentToNursing: number;
  sentToLab: number;
  sentBackToReception: number;
  completed: number;
  totalActive: number;
  totalToday: number;
}

interface PatientPipelineTrackerProps {
  onSelectStage?: (stageKey: string) => void;
  activeStage?: string;
  className?: string;
}

export default function PatientPipelineTracker({
  onSelectStage,
  activeStage,
  className = '',
}: PatientPipelineTrackerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const userRole = (user?.role || 'Receptionist').trim();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('HEAL_PIPELINE_TRACKER_COLLAPSED');
      return saved === 'true';
    }
    return false;
  });

  const [stats, setStats] = useState<PipelineStats>({
    reception: 0,
    nurseVitals: 0,
    passedToDoctor: 0,
    sentToPharmacy: 0,
    sentToNursing: 0,
    sentToLab: 0,
    sentBackToReception: 0,
    completed: 0,
    totalActive: 0,
    totalToday: 0,
  });

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString());

  const calculateStats = useCallback((appointments: any[]) => {
    let reception = 0;
    let nurseVitals = 0;
    let passedToDoctor = 0;
    let sentToPharmacy = 0;
    let sentToNursing = 0;
    let sentToLab = 0;
    let sentBackToReception = 0;
    let completed = 0;

    for (const a of appointments) {
      const s = (a.status || '').trim();
      if (s === 'Waiting') {
        reception++;
      } else if (s === 'With-Nurse' || s === 'Nurse-Station') {
        nurseVitals++;
      } else if (s === 'Passed-to-Doctor' || s === 'Called' || s === 'In-Consult') {
        passedToDoctor++;
      } else if (s === 'Sent-to-Pharmacy') {
        sentToPharmacy++;
      } else if (s === 'Sent-to-Nursing' || s === 'Procedure') {
        sentToNursing++;
      } else if (s === 'Sent-to-Lab') {
        sentToLab++;
      } else if (s === 'Billing-Pending' || s === 'Sent-Back-to-Reception') {
        sentBackToReception++;
      } else if (s === 'Completed') {
        completed++;
      }
    }

    const totalActive = reception + nurseVitals + passedToDoctor + sentToPharmacy + sentToNursing + sentToLab + sentBackToReception;
    const totalToday = totalActive + completed;

    setStats({
      reception,
      nurseVitals,
      passedToDoctor,
      sentToPharmacy,
      sentToNursing,
      sentToLab,
      sentBackToReception,
      completed,
      totalActive,
      totalToday,
    });
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await appointmentsApi.queue();
      const list = Array.isArray(res) ? res : (res?.data || []);
      calculateStats(list);
    } catch (err) {
      // Fallback to local storage DB
      try {
        const db = getDb();
        if (db && db.appointments) {
          calculateStats(db.appointments);
        }
      } catch (e) {
        console.error('Failed to load appointments for pipeline tracker', e);
      }
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToDbChanges(() => {
      refreshData();
    });
    const interval = setInterval(refreshData, 10000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshData]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('HEAL_PIPELINE_TRACKER_COLLAPSED', String(next));
      }
      return next;
    });
  };

  const handleStageClick = (stageKey: string, targetRoute?: string) => {
    if (onSelectStage) {
      onSelectStage(stageKey);
      return;
    }

    if (location.pathname === '/reception/queue') {
      // Dispatch custom event or URL param so PatientQueuePage can filter
      const event = new CustomEvent('heal:filter-pipeline-stage', { detail: { stage: stageKey } });
      window.dispatchEvent(event);
      return;
    }

    if (targetRoute) {
      navigate(targetRoute);
    } else {
      navigate(`/reception/queue?stage=${stageKey}`);
    }
  };

  // Determine stage priority based on active role
  const isDoctor = userRole === 'Doctor';
  const isNurse = userRole === 'Nurse' || userRole === 'Therapist';
  const isReception = userRole === 'Receptionist' || userRole === 'Reception';
  const isCashier = userRole === 'Cashier';
  const isPharmacist = userRole === 'Pharmacist';

  return (
    <div
      className={`bg-white border border-[#E8DEC8] rounded-2xl shadow-xs overflow-hidden transition-all duration-200 mb-4 sm:mb-6 ${className}`}
    >
      {/* 1. Header Bar: Real-time Pipeline Status & Role Spotlight */}
      <div className="bg-[#FAF8F5] border-b border-[#EDE6DD] px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#965F36] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            <Activity size={14} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-[#1E1B18] tracking-tight truncate font-brand-serif">
                Current Patient Journey Pipeline
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7F0] text-[#1E7E34] border border-[#C3E6CB]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#28A745] animate-ping" />
                Live Active Flow
              </span>
            </div>
            <p className="text-[11px] text-[#7A6B61] truncate hidden md:block">
              Full lifecycle tracking: Reception Arrival → Nurse Vitals → Doctor Workbench → Post-Doctor Routing (Rx / Procedures / Lab) → Sent Back to Reception
            </p>
          </div>
        </div>

        {/* Right side controls: Role Context, Total Counters & Collapse Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Role Badge */}
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium text-[#7A6B61] bg-[#EDE6DD]/50 px-2.5 py-1 rounded-lg">
            Role: <strong className="text-[#1E1B18]">{userRole}</strong>
          </span>

          {/* Quick Active Patients Count */}
          <div className="flex items-center gap-1.5 bg-[#FAF2EB] border border-[#F3D5BD] text-[#965F36] px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs">
            <Flame size={13} className="text-[#D96B27]" />
            <span>Active in Clinic:</span>
            <span className="px-1.5 py-0.2 bg-[#965F36] text-white rounded-md text-[11px] font-mono">
              {stats.totalActive}
            </span>
          </div>

          <button
            type="button"
            onClick={refreshData}
            title={`Last updated at ${lastUpdated}. Click to refresh.`}
            className="p-1.5 text-[#7A6B61] hover:text-[#1E1B18] hover:bg-[#EDE6DD] rounded-lg transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#965F36]' : ''} />
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#5C5047] hover:text-[#1E1B18] hover:bg-[#EDE6DD] border border-[#E5D7C7] transition"
          >
            {collapsed ? (
              <>
                <ChevronDown size={13} />
                <span className="hidden sm:inline">Show Pipeline</span>
              </>
            ) : (
              <>
                <ChevronUp size={13} />
                <span className="hidden sm:inline">Hide Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Pipeline Flow Stepper Body */}
      {!collapsed && (
        <div className="p-3 sm:p-4 bg-gradient-to-b from-white to-[#FDFCFA]">
          {/* Multi-Screen Horizontal Grid / Responsive Pipeline Flow */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3 items-stretch">
            
            {/* STAGE 1: Reception Arrival */}
            <div
              onClick={() => handleStageClick('Waiting', '/reception/queue')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isReception ? 'ring-2 ring-amber-400 bg-amber-50/70 border-amber-300' : 'bg-white hover:bg-[#FFFDF9] border-[#E8DEC8] hover:border-amber-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                  1. Reception
                </span>
                <Users className="w-4 h-4 text-amber-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.reception}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">waiting</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Arrival & Triage</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">New registrations to pass</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-amber-700 font-bold">
                <span>Pass to Nurse ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 2: Nurse Station / Vitals */}
            <div
              onClick={() => handleStageClick('With-Nurse', '/daycare/lounges')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isNurse ? 'ring-2 ring-teal-500 bg-teal-50/70 border-teal-300' : 'bg-white hover:bg-[#F9FCFB] border-[#E8DEC8] hover:border-teal-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded">
                  2. Nurse Station
                </span>
                <Activity className="w-4 h-4 text-teal-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.nurseVitals}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">at station</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Vitals & BMI Triage</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Height, Weight, BP & TT</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-teal-700 font-bold">
                <span>Pass to Doctor ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 3: Passed to Doctor / With Doctor */}
            <div
              onClick={() => handleStageClick('Passed-to-Doctor', '/clinical/workbench')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isDoctor ? 'ring-2 ring-indigo-500 bg-indigo-50/80 border-indigo-300' : 'bg-white hover:bg-[#F9F9FD] border-[#E8DEC8] hover:border-indigo-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                  3. Doctor Cabin
                </span>
                <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.passedToDoctor}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">with doctor</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Consultation Hub</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Decides Rx / Nurse / Lab</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-indigo-700 font-bold">
                <span>Route Patient ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 4A: Post-Doctor -> Sent to Pharmacy */}
            <div
              onClick={() => handleStageClick('Sent-to-Pharmacy', '/pharmacy/dispensary')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isPharmacist ? 'ring-2 ring-emerald-500 bg-emerald-50/80 border-emerald-300' : 'bg-white hover:bg-[#F9FCFA] border-[#E8DEC8] hover:border-emerald-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  4a. Pharmacy
                </span>
                <Pill className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.sentToPharmacy}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">Rx pending</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Rx Dispensing</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">FEFO batches & billing</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-emerald-700 font-bold">
                <span>To Reception ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 4B: Post-Doctor -> Sent to Nursing Procedures */}
            <div
              onClick={() => handleStageClick('Sent-to-Nursing', '/daycare/lounges')}
              className="group relative flex flex-col justify-between p-3 rounded-xl border bg-white hover:bg-[#FDF9FC] border-[#E8DEC8] hover:border-fuchsia-400 hover:shadow-sm transition-all cursor-pointer select-none"
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-700 bg-fuchsia-100/80 px-1.5 py-0.5 rounded">
                  4b. Nursing
                </span>
                <Bandage className="w-4 h-4 text-fuchsia-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.sentToNursing}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">procedures</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Dressing & Daycare</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Clean & Dressing / TT</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-fuchsia-700 font-bold">
                <span>To Reception ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 4C: Post-Doctor -> Sent to Lab */}
            <div
              onClick={() => handleStageClick('Sent-to-Lab', '/clinical/lab')}
              className="group relative flex flex-col justify-between p-3 rounded-xl border bg-white hover:bg-[#F9FCFD] border-[#E8DEC8] hover:border-cyan-400 hover:shadow-sm transition-all cursor-pointer select-none"
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-100/80 px-1.5 py-0.5 rounded">
                  4c. Lab Orders
                </span>
                <FlaskConical className="w-4 h-4 text-cyan-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.sentToLab}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">tests ordered</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Lab Diagnostics</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Blood, Urine & Vitals</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-cyan-700 font-bold">
                <span>To Reception ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 5: Sent Back to Receptionist (Billing & 3-Day Review) */}
            <div
              onClick={() => handleStageClick('Billing-Pending', '/billing/pos')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isReception || isCashier ? 'ring-2 ring-orange-500 bg-orange-50/80 border-orange-300' : 'bg-white hover:bg-[#FDF9F7] border-[#E8DEC8] hover:border-orange-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100/80 px-1.5 py-0.5 rounded">
                  5. Back to Reception
                </span>
                <Receipt className="w-4 h-4 text-orange-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.sentBackToReception}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">to settle</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Billing & Follow-Up</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">POS & 3-day review date</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-orange-700 font-bold">
                <span>Discharge ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 6: Discharged & Completed */}
            <div
              onClick={() => handleStageClick('Completed', '/reception/queue')}
              className="group relative flex flex-col justify-between p-3 rounded-xl border bg-white hover:bg-[#F8FCF9] border-[#E8DEC8] hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer select-none"
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                  6. Discharged
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition" />
              </div>
              <div className="my-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B18] font-mono leading-none">
                    {stats.completed}
                  </span>
                  <span className="text-[11px] text-[#7A6B61] font-medium">completed</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Discharge Complete</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Cleared & departed</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-emerald-700 font-bold">
                <span>Total: {stats.totalToday}</span>
                <CheckCircle2 size={12} className="text-emerald-600" />
              </div>
            </div>

          </div>

          {/* Role Attention Callout banner inside tracker */}
          <div className="mt-3 pt-2.5 border-t border-[#EDE6DD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#5C5047]">
              <span className="font-bold text-[#1E1B18]">Pipeline Direction:</span>
              <span className="hidden lg:inline text-[#7A6B61]">
                Patient Arrival (Reception) ➔ Nurse Station (Vitals/TT) ➔ Doctor (EMR Hub) ➔ Pharmacy / Nursing Daycare / Lab ➔ Back to Reception (Bill & 3-Day Review)
              </span>
              <span className="lg:hidden text-[#7A6B61]">
                Arrival ➔ Nurse ➔ Doctor ➔ Rx/Nursing/Lab ➔ Back to Reception
              </span>
            </div>

            {/* Quick 1-click Filter to Reset view */}
            {activeStage && activeStage !== 'all' && (
              <button
                type="button"
                onClick={() => handleStageClick('all')}
                className="text-xs font-bold text-[#965F36] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Clear Stage Filter ({activeStage})</span>
                <RefreshCw size={11} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
