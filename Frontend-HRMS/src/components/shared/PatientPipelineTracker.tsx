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
  Send,
  Eye,
  EyeOff,
  UserCheck,
  FileSpreadsheet,
  AlertCircle
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
  const userRole = (user?.role || 'Super Admin').trim();

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
  const [liveAppointments, setLiveAppointments] = useState<any[]>([]);
  const [livePatients, setLivePatients] = useState<any[]>([]);
  const [livePrescriptions, setLivePrescriptions] = useState<any[]>([]);
  const [liveConsultations, setLiveConsultations] = useState<any[]>([]);
  const [selectedFilterStage, setSelectedFilterStage] = useState<string>('all');
  const [showPatientTray, setShowPatientTray] = useState<boolean>(true);
  const [isBackendSynced, setIsBackendSynced] = useState<boolean>(false);

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
      let appts: any[] = [];
      let pats: any[] = [];
      let rxs: any[] = [];
      let consults: any[] = [];

      // 1. Fetch live multi-frontend synchronized pipeline from backend (FastAPI Port 8000)
      try {
        const syncRes = await fetch('http://localhost:8000/api/pipeline/sync', { cache: 'no-store' });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.appointments && Array.isArray(syncData.appointments) && syncData.appointments.length > 0) {
            appts = syncData.appointments;
            pats = syncData.patients || [];
            rxs = syncData.prescriptions || [];
            consults = syncData.consultations || [];
            setIsBackendSynced(true);
          }
        }
      } catch (err) {
        setIsBackendSynced(false);
      }

      // 2. Fallback to local mock database if backend sync was empty or offline
      if (!appts || appts.length === 0) {
        const db = getDb();
        if (db && db.appointments) {
          appts = db.appointments;
          pats = db.patients || [];
          rxs = db.prescriptions || [];
          consults = db.consultations || [];
        }
      }

      setLiveAppointments(appts);
      setLivePatients(pats);
      setLivePrescriptions(rxs);
      setLiveConsultations(consults);
      calculateStats(appts);
    } catch (err) {
      console.error('Failed to load appointments for pipeline tracker', err);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToDbChanges(() => {
      refreshData();
    });
    // Live polling every 2.5 seconds to instantly reflect actions on port 3000
    const interval = setInterval(refreshData, 2500);
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

  const handleStageClick = (stageKey: string) => {
    if (onSelectStage) {
      onSelectStage(stageKey);
    }
    // Filter the live patient detail tray
    setSelectedFilterStage(stageKey);
    setShowPatientTray(true);
  };

  // Filter patients according to the selected pipeline stage
  const filteredAppointments = liveAppointments.filter((a) => {
    if (selectedFilterStage === 'all') return (a.status || '').trim() !== 'Completed';
    const s = (a.status || '').trim();
    if (selectedFilterStage === 'Waiting') return s === 'Waiting';
    if (selectedFilterStage === 'With-Nurse') return s === 'With-Nurse' || s === 'Nurse-Station';
    if (selectedFilterStage === 'Passed-to-Doctor') return s === 'Passed-to-Doctor' || s === 'Called' || s === 'In-Consult';
    if (selectedFilterStage === 'Sent-to-Pharmacy') return s === 'Sent-to-Pharmacy';
    if (selectedFilterStage === 'Sent-to-Nursing') return s === 'Sent-to-Nursing' || s === 'Procedure';
    if (selectedFilterStage === 'Sent-to-Lab') return s === 'Sent-to-Lab';
    if (selectedFilterStage === 'Billing-Pending') return s === 'Billing-Pending' || s === 'Sent-Back-to-Reception';
    if (selectedFilterStage === 'Completed') return s === 'Completed';
    return true;
  });

  // Helper to lookup patient profile
  const getPatientInfo = (appt: any) => {
    const pat = livePatients.find((p) => p.id === appt.patient_id) || {};
    return {
      name: appt.patient_name || (pat.first_name ? `${pat.first_name} ${pat.last_name || ''}`.trim() : 'Patient'),
      phone: appt.phone || pat.phone || '—',
      gender: appt.gender || pat.gender || '—',
      age: appt.age || pat.age || (pat.dob ? '—' : '—'),
      op_no: appt.op_no || pat.op_no || `OP-${appt.token_no || '101'}`,
    };
  };

  // Helper to lookup prescriptions for this appointment
  const getPrescriptionInfo = (appt: any) => {
    // 1. Direct rxList embedded in appointment
    if (appt.rxList && Array.isArray(appt.rxList) && appt.rxList.length > 0) {
      return {
        items: appt.rxList,
        nextStep: appt.nextStep || appt.next_step,
        notes: appt.nextStepNotes,
      };
    }
    // 2. Search in livePrescriptions
    const rx = livePrescriptions.find((r) => r.appointment_id === appt.id || r.patient_id === appt.patient_id);
    if (rx && rx.items && Array.isArray(rx.items) && rx.items.length > 0) {
      return {
        items: rx.items,
        nextStep: rx.next_step || appt.nextStep,
        notes: rx.instructions,
      };
    }
    // 3. Search in liveConsultations
    const consult = liveConsultations.find((c) => c.appointment_id === appt.id);
    if (consult && consult.diagnosis) {
      return {
        items: [],
        diagnosis: consult.diagnosis,
        nextStep: consult.next_step,
        notes: consult.doctor_notes,
      };
    }
    return null;
  };

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
              {isBackendSynced && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Synced with Core (Port 3000)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#7A6B61] truncate hidden md:block">
              Full lifecycle tracking: Reception Arrival → Nurse Vitals → Doctor Workbench → Post-Doctor Routing (Rx / Procedures / Lab) → Sent Back to Reception
            </p>
          </div>
        </div>

        {/* Right side controls: Role Context, Total Counters & Collapse Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            title={`Last updated at ${lastUpdated}. Click to force sync.`}
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
              onClick={() => handleStageClick('Waiting')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'Waiting'
                  ? 'ring-2 ring-amber-500 bg-amber-50/90 border-amber-400 shadow-sm'
                  : 'bg-white hover:bg-[#FFFDF9] border-[#E8DEC8] hover:border-amber-400 hover:shadow-sm'
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
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">New registrations</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-amber-700 font-bold">
                <span>View Patients ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 2: Nurse Station / Vitals */}
            <div
              onClick={() => handleStageClick('With-Nurse')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'With-Nurse'
                  ? 'ring-2 ring-teal-500 bg-teal-50/90 border-teal-400 shadow-sm'
                  : 'bg-white hover:bg-[#F9FCFB] border-[#E8DEC8] hover:border-teal-400 hover:shadow-sm'
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
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Height, Weight, BP</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-teal-700 font-bold">
                <span>View Patients ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 3: Passed to Doctor / With Doctor */}
            <div
              onClick={() => handleStageClick('Passed-to-Doctor')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'Passed-to-Doctor'
                  ? 'ring-2 ring-indigo-500 bg-indigo-50/90 border-indigo-400 shadow-sm'
                  : 'bg-white hover:bg-[#F9F9FD] border-[#E8DEC8] hover:border-indigo-400 hover:shadow-sm'
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
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Rx & Next Steps</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-indigo-700 font-bold">
                <span>View Rx ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 4A: Post-Doctor -> Sent to Pharmacy */}
            <div
              onClick={() => handleStageClick('Sent-to-Pharmacy')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'Sent-to-Pharmacy'
                  ? 'ring-2 ring-emerald-500 bg-emerald-50/90 border-emerald-400 shadow-sm'
                  : 'bg-white hover:bg-[#F9FCFA] border-[#E8DEC8] hover:border-emerald-400 hover:shadow-sm'
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
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">FEFO batches</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-emerald-700 font-bold">
                <span>View Orders ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 4B: Post-Doctor -> Sent to Nursing Procedures */}
            <div
              onClick={() => handleStageClick('Sent-to-Nursing')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'Sent-to-Nursing'
                  ? 'ring-2 ring-fuchsia-500 bg-fuchsia-50/90 border-fuchsia-400 shadow-sm'
                  : 'bg-white hover:bg-[#FDF9FC] border-[#E8DEC8] hover:border-fuchsia-400 hover:shadow-sm'
              }`}
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
                <span>View Orders ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 4C: Post-Doctor -> Sent to Lab */}
            <div
              onClick={() => handleStageClick('Sent-to-Lab')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'Sent-to-Lab'
                  ? 'ring-2 ring-cyan-500 bg-cyan-50/90 border-cyan-400 shadow-sm'
                  : 'bg-white hover:bg-[#F9FCFD] border-[#E8DEC8] hover:border-cyan-400 hover:shadow-sm'
              }`}
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
                  <span className="text-[11px] text-[#7A6B61] font-medium">tests</span>
                </div>
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Diagnostics</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">Pathology & Tests</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-cyan-700 font-bold">
                <span>View Tests ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 5: Sent Back to Receptionist (Billing & 3-Day Review) */}
            <div
              onClick={() => handleStageClick('Billing-Pending')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'Billing-Pending'
                  ? 'ring-2 ring-orange-500 bg-orange-50/90 border-orange-400 shadow-sm'
                  : 'bg-white hover:bg-[#FDF9F7] border-[#E8DEC8] hover:border-orange-400 hover:shadow-sm'
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
                <p className="text-xs font-bold text-[#3B312A] mt-1 line-clamp-1">Billing & POS</p>
                <p className="text-[10px] text-[#8E7E73] line-clamp-1">3-day review date</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-[10px] text-orange-700 font-bold">
                <span>View Bills ➔</span>
                <ChevronRight size={12} className="opacity-60 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* STAGE 6: Discharged & Completed */}
            <div
              onClick={() => handleStageClick('Completed')}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                selectedFilterStage === 'Completed'
                  ? 'ring-2 ring-emerald-500 bg-emerald-50/90 border-emerald-400 shadow-sm'
                  : 'bg-white hover:bg-[#F8FCF9] border-[#E8DEC8] hover:border-emerald-500 hover:shadow-sm'
              }`}
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

          {/* 3. Live Interactive Patient Details & Prescriptions Tray */}
          <div className="mt-4 pt-3 border-t border-[#EDE6DD]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Live Active Patient Tray</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({filteredAppointments.length} patient{filteredAppointments.length === 1 ? '' : 's'} in selected view)
                  </span>
                </h3>
              </div>

              {/* Stage Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedFilterStage('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    selectedFilterStage === 'all'
                      ? 'bg-[#965F36] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All Active ({stats.totalActive})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilterStage('Waiting')}
                  className={`px-2 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    selectedFilterStage === 'Waiting'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                  }`}
                >
                  Reception ({stats.reception})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilterStage('With-Nurse')}
                  className={`px-2 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    selectedFilterStage === 'With-Nurse'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-800'
                  }`}
                >
                  Nurse ({stats.nurseVitals})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilterStage('Passed-to-Doctor')}
                  className={`px-2 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    selectedFilterStage === 'Passed-to-Doctor'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
                  }`}
                >
                  Doctor Cabin & Rx ({stats.passedToDoctor})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilterStage('Sent-to-Pharmacy')}
                  className={`px-2 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    selectedFilterStage === 'Sent-to-Pharmacy'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Pharmacy ({stats.sentToPharmacy})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilterStage('Billing-Pending')}
                  className={`px-2 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    selectedFilterStage === 'Billing-Pending'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-orange-50 hover:bg-orange-100 text-orange-800'
                  }`}
                >
                  Billing ({stats.sentBackToReception})
                </button>
                <button
                  type="button"
                  onClick={() => setShowPatientTray(!showPatientTray)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 ml-1"
                  title={showPatientTray ? 'Collapse patient tray' : 'Expand patient tray'}
                >
                  {showPatientTray ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Patient Cards / Rows List */}
            {showPatientTray && (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredAppointments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No patients currently in this stage. When new patients register at Reception or are consulted by the Doctor on Port 3000, they will appear here live.
                  </div>
                ) : (
                  filteredAppointments.map((appt) => {
                    const pInfo = getPatientInfo(appt);
                    const rxInfo = getPrescriptionInfo(appt);
                    const v = appt.vitals || {};
                    const status = (appt.status || '').trim();

                    return (
                      <div
                        key={appt.id || appt.token_no}
                        className="p-3 rounded-xl border border-[#EDE6DD] bg-white hover:border-[#D6C4B0] hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        {/* Patient Basic Identity */}
                        <div className="flex items-start gap-3 min-w-[220px]">
                          <div className="w-9 h-9 rounded-xl bg-[#FAF2EB] border border-[#F3D5BD] text-[#965F36] flex flex-col items-center justify-center font-mono font-bold text-xs shrink-0">
                            <span className="text-[9px] uppercase tracking-tighter text-[#A47148]">TKN</span>
                            <span>#{appt.token_no || '1'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#1E1B18]">{pInfo.name}</h4>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {pInfo.op_no}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{pInfo.phone}</span>
                              {pInfo.gender !== '—' && (
                                <>
                                  <span>•</span>
                                  <span>{pInfo.gender}</span>
                                </>
                              )}
                              {pInfo.age !== '—' && (
                                <>
                                  <span>•</span>
                                  <span>{pInfo.age} yrs</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Stage & Assigned Doctor / Nurse Vitals */}
                        <div className="flex-1 flex flex-wrap items-center gap-2 text-xs">
                          {/* Current Status Pill */}
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              status === 'Waiting'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : status === 'With-Nurse' || status === 'Nurse-Station'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : status === 'Passed-to-Doctor' || status === 'Called' || status === 'In-Consult'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : status === 'Sent-to-Pharmacy'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : status === 'Billing-Pending'
                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {status === 'Waiting' && 'Waiting at Reception'}
                            {(status === 'With-Nurse' || status === 'Nurse-Station') && 'Intake with Nurse'}
                            {(status === 'Passed-to-Doctor' || status === 'Called' || status === 'In-Consult') && 'With Doctor Cabin'}
                            {status === 'Sent-to-Pharmacy' && 'Rx Dispensing'}
                            {status === 'Billing-Pending' && 'Billing & Follow-Up'}
                            {status === 'Completed' && 'Discharged'}
                            {!['Waiting', 'With-Nurse', 'Nurse-Station', 'Passed-to-Doctor', 'Called', 'In-Consult', 'Sent-to-Pharmacy', 'Billing-Pending', 'Completed'].includes(status) && status}
                          </span>

                          {/* Doctor Assignment */}
                          <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                            Dr: <strong className="text-slate-800">{appt.doctor_name || 'Dr. Sarah Jenkins'}</strong>
                          </span>

                          {/* Vitals Summary if recorded by nurse */}
                          {v.bp_systolic ? (
                            <span className="text-[10px] font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                              BP: {v.bp_systolic}/{v.bp_diastolic} | Pulse: {v.pulse_rate || 72} | BMI: {v.bmi || '22.4'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No vitals yet</span>
                          )}
                        </div>

                        {/* Right: Prescriptions & Attached Medicines (Rx) */}
                        <div className="min-w-[280px] max-w-[380px] bg-slate-50/80 p-2 rounded-lg border border-slate-200/70 text-xs">
                          {rxInfo && rxInfo.items && rxInfo.items.length > 0 ? (
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-700 uppercase mb-1">
                                <span className="flex items-center gap-1">
                                  <Pill size={11} />
                                  <span>Doctor Rx ({rxInfo.items.length} meds)</span>
                                </span>
                                {rxInfo.nextStep && (
                                  <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono text-[9px]">
                                    Next: {rxInfo.nextStep}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                {rxInfo.items.map((med: any, mIdx: number) => (
                                  <div key={mIdx} className="text-[11px] text-slate-700 flex items-center justify-between gap-2">
                                    <span className="font-semibold truncate">
                                      {med.medicine_name || med.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                      {med.frequency || '1x daily'} × {med.duration_days || med.days || '5'}d = <strong className="text-emerald-700">{med.quantity || (med.total_count) || '10'}</strong>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : status === 'Passed-to-Doctor' || status === 'Called' || status === 'In-Consult' ? (
                            <div className="text-[11px] text-amber-700 flex items-center gap-1.5 py-0.5">
                              <Stethoscope size={12} className="shrink-0" />
                              <span>Doctor is currently evaluating consultation & medicines...</span>
                            </div>
                          ) : status === 'Waiting' ? (
                            <div className="text-[11px] text-slate-400 italic py-0.5">
                              Waiting at reception to pass to Nurse Station
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic py-0.5">
                              No prescription assigned
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Quick info note */}
          <div className="mt-3 pt-2 border-t border-[#EDE6DD] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#7A6B61]">
            <div>
              <span className="font-bold text-[#1E1B18]">Live Pipeline Sync:</span> Changes made in Core Clinic (Port 3000 Reception/Nurse/Doctor) synchronize in real-time.
            </div>
            {activeStage && activeStage !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedFilterStage('all')}
                className="text-xs font-bold text-[#965F36] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Reset View (Show All Active)</span>
                <RefreshCw size={11} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
