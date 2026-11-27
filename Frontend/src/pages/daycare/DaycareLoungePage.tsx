import React, { useState, useEffect } from 'react';
import {
  Bed,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  RefreshCw,
  LogOut,
  X,
  Search,
  UserCheck,
  Plus,
  Stethoscope,
  Scissors,
  Syringe,
  AlertCircle,
  Receipt,
  UserPlus,
  Phone,
  User,
  Heart,
  Scale,
  Droplet,
  ArrowRight,
  Thermometer
} from 'lucide-react';
import { daycareApi, patientsApi, nursingApi, appointmentsApi, mastersApi, subscribeToDbChanges } from '@/api';
import { STANDARD_NURSING_PROCEDURES } from '@/lib/mockData';

export default function DaycareLoungePage() {
  const [activeTab, setActiveTab] = useState<'nurse_station' | 'daycare_beds'>('nurse_station');

  // Reception Passed Queue & Appointments State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  // Nurse Clinical Intake & Vitals Modal State
  const [selectedNurseAppt, setSelectedNurseAppt] = useState<any | null>(null);
  const [vitalsPatient, setVitalsPatient] = useState<any | null>(null);
  const [showNurseVitalsModal, setShowNurseVitalsModal] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    age_years: '',
    blood_group: 'B+',
    weight_kg: '62',
    height_cm: '165',
    bp_systolic: '120',
    bp_diastolic: '80',
    pulse_rate: '74',
    temperature_f: '98.4',
    spo2_percent: '99',
    blood_sugar: '',
    triage_notes: '',
    doctor_id: '',
    doctor_name: '',
  });

  // Beds State
  const [beds, setBeds] = useState<any[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(true);
  const [selectedBed, setSelectedBed] = useState<any | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [allocateForm, setAllocateForm] = useState({
    patient_name: '',
    op_no: '',
    procedure_name: 'HydraFacial + LED Therapy',
    attending_staff: 'Anjali Pillai',
    post_care_instructions: 'Drink water and avoid heavy sun exposure.',
  });

  // Nursing Procedures State
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(true);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showPerformModal, setShowPerformModal] = useState(false);
  const [selectedReferredProc, setSelectedReferredProc] = useState<any | null>(null);

  // Perform Referred Procedure Modal State
  const [performVitals, setPerformVitals] = useState({
    bp_systolic: '120',
    bp_diastolic: '80',
    pulse_rate: '74',
    temperature_f: '98.4',
    spo2_percent: '99',
    weight_kg: '62',
  });
  const [performNurse, setPerformNurse] = useState('Anjali Pillai');
  const [performNotes, setPerformNotes] = useState('Dressing done under sterile precautions. Wound site clean, no signs of infection.');

  // Direct Walk-in Modal State
  const [walkinPatientType, setWalkinPatientType] = useState<'search' | 'new'>('search');
  const [walkinSearch, setWalkinSearch] = useState('');
  const [walkinResults, setWalkinResults] = useState<any[]>([]);
  const [walkinForm, setWalkinForm] = useState({
    patient_id: '',
    patient_name: '',
    op_no: '',
    phone: '',
    procedure_name: 'Clean & Dressing',
    custom_procedure_name: '',
    is_custom_procedure: false,
    price: 250,
    price_type: 'catalog' as 'catalog' | 'custom',
    nurse_name: 'Anjali Pillai',
    notes: 'Walk-in for wound dressing. Patient received TT injection if needed.',
    vitals: {
      bp_systolic: '120',
      bp_diastolic: '80',
      pulse_rate: '76',
      temperature_f: '98.6',
      spo2_percent: '99',
      weight_kg: '65',
    },
  });

  // Load Appointments from Reception Queue
  const loadAppointments = async () => {
    setLoadingAppts(true);
    try {
      const res = await appointmentsApi.queue();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAppointments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppts(false);
    }
  };

  // Load Beds
  const loadBeds = async () => {
    setLoadingBeds(true);
    try {
      const res = await daycareApi.listBeds();
      setBeds(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBeds(false);
    }
  };

  // Load Nursing Procedures
  const loadProcedures = async () => {
    setLoadingProcedures(true);
    try {
      const res = await nursingApi.list();
      setProcedures(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProcedures(false);
    }
  };

  useEffect(() => {
    loadBeds();
    loadProcedures();
    loadAppointments();

    mastersApi.doctors().then((res) => {
      const docs = Array.isArray(res) ? res : (res?.data || []);
      setDoctorsList(docs);
    }).catch(() => {});

    const unsub = subscribeToDbChanges(() => {
      loadAppointments();
      loadProcedures();
      loadBeds();
    });
    return () => unsub();
  }, []);

  // Bed Handlers
  const handleDischarge = async (bedId: string) => {
    if (confirm('Clear and discharge patient from this daycare bed? Status will shift to Cleaning.')) {
      await daycareApi.dischargeBed(bedId);
      loadBeds();
    }
  };

  const handleSanitized = async (bedId: string) => {
    await daycareApi.markSanitized(bedId);
    loadBeds();
  };

  const handlePatientSearch = async (val: string) => {
    setPatientSearch(val);
    if (val.trim().length >= 2) {
      try {
        const res = await patientsApi.search(val.trim());
        const list = Array.isArray(res) ? res : (res?.data || []);
        setPatientResults(list);
      } catch {
        setPatientResults([]);
      }
    } else {
      setPatientResults([]);
    }
  };

  const handleSelectPatient = (p: any) => {
    setAllocateForm((f) => ({
      ...f,
      patient_name: `${p.first_name} ${p.last_name || ''}`.trim(),
      op_no: p.op_no || '',
    }));
    setPatientSearch(`${p.op_no} — ${p.first_name}`);
    setPatientResults([]);
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    await daycareApi.allocateBed(selectedBed.id, allocateForm);
    setShowAllocateModal(false);
    setPatientSearch('');
    setPatientResults([]);
    loadBeds();
  };

  // Nursing Handlers
  const handleWalkinSearch = async (val: string) => {
    setWalkinSearch(val);
    if (val.trim().length >= 2) {
      try {
        const res = await patientsApi.search(val.trim());
        const list = Array.isArray(res) ? res : (res?.data || []);
        setWalkinResults(list);
      } catch {
        setWalkinResults([]);
      }
    } else {
      setWalkinResults([]);
    }
  };

  const handleSelectWalkinPatient = (p: any) => {
    setWalkinForm((f) => ({
      ...f,
      patient_id: p.id,
      patient_name: `${p.first_name} ${p.last_name || ''}`.trim(),
      op_no: p.op_no,
      phone: p.phone,
    }));
    setWalkinSearch(`${p.op_no} — ${p.first_name} (${p.phone})`);
    setWalkinResults([]);
  };

  const handleWalkinProcedureChange = (procName: string) => {
    if (procName === 'CUSTOM') {
      setWalkinForm((f) => ({
        ...f,
        is_custom_procedure: true,
        procedure_name: '',
        custom_procedure_name: '',
        price_type: 'custom',
        price: 200,
      }));
    } else {
      const match = STANDARD_NURSING_PROCEDURES.find((p) => p.name === procName);
      setWalkinForm((f) => ({
        ...f,
        is_custom_procedure: false,
        procedure_name: procName,
        custom_procedure_name: '',
        price_type: 'catalog',
        price: match ? match.default_price : 150,
      }));
    }
  };

  const handleSaveWalkinProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProcName = walkinForm.is_custom_procedure
      ? walkinForm.custom_procedure_name.trim() || 'Custom Nursing Procedure'
      : walkinForm.procedure_name;

    await nursingApi.create({
      patient_id: walkinForm.patient_id || 'pat-walkin',
      patient_name: walkinForm.patient_name || 'Walk-in Customer',
      op_no: walkinForm.op_no || 'OP-NURSE',
      phone: walkinForm.phone || '',
      referred_by: 'Direct Walk-in',
      doctor_name: null,
      procedure_name: finalProcName,
      procedure_category: 'Wound Care / Injection',
      nurse_name: walkinForm.nurse_name,
      price: Number(walkinForm.price) || 0,
      price_type: walkinForm.price_type,
      vitals: `${performVitals.bp_systolic}/${performVitals.bp_diastolic} mmHg, Pulse ${performVitals.pulse_rate}, SpO2 ${performVitals.spo2_percent}%`,
      notes: walkinForm.notes,
      status: 'Completed',
    });

    setShowWalkinModal(false);
    // Reset form
    setWalkinForm({
      patient_id: '',
      patient_name: '',
      op_no: '',
      phone: '',
      procedure_name: 'Clean & Dressing',
      custom_procedure_name: '',
      is_custom_procedure: false,
      price: 250,
      price_type: 'catalog',
      nurse_name: 'Anjali Pillai',
      notes: 'Walk-in for wound dressing. Patient received TT injection if needed.',
      vitals: {
        bp_systolic: '120',
        bp_diastolic: '80',
        pulse_rate: '76',
        temperature_f: '98.6',
        spo2_percent: '99',
        weight_kg: '65',
      },
    });
    setWalkinSearch('');
    await loadProcedures();
  };

  const handleOpenPerformModal = (proc: any) => {
    setSelectedReferredProc(proc);
    setPerformNurse(proc.nurse_name || 'Anjali Pillai');
    setPerformNotes(proc.notes ? `Followed instructions: ${proc.notes}` : 'Procedure completed under sterile conditions.');
    setShowPerformModal(true);
  };

  const handleConfirmPerform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferredProc) return;

    const vitalsStr = `${performVitals.bp_systolic}/${performVitals.bp_diastolic} mmHg, Pulse ${performVitals.pulse_rate}, SpO2 ${performVitals.spo2_percent}%, Wt ${performVitals.weight_kg}kg`;
    await nursingApi.updateStatus(
      selectedReferredProc.id,
      'Completed',
      `${performNotes} (Nurse: ${performNurse})`,
      vitalsStr
    );

    setShowPerformModal(false);
    setSelectedReferredProc(null);
    await loadProcedures();
  };

  const referredPending = procedures.filter((p) => p.status === 'Referred' || p.status === 'Pending');
  const completedProcedures = procedures.filter((p) => p.status === 'Completed');
  const directWalkinsCount = procedures.filter((p) => p.referred_by === 'Direct Walk-in').length;
  const totalBilled = completedProcedures.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  const waitingForNurse = appointments.filter(
    (a) => a.status === 'With-Nurse' || a.status === 'Nurse-Station'
  );
  const passedToDoctor = appointments.filter(
    (a) => a.status === 'Passed-to-Doctor' || a.status === 'Called' || a.status === 'In-Consult'
  );

  const getBmiCategory = (bmiVal: number) => {
    if (isNaN(bmiVal) || bmiVal <= 0) return { label: 'N/A', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (bmiVal < 18.5) return { label: 'Underweight', color: 'bg-sky-100 text-sky-800 border-sky-200' };
    if (bmiVal <= 24.9) return { label: 'Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (bmiVal <= 29.9) return { label: 'Overweight', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'Obese', color: 'bg-rose-100 text-rose-800 border-rose-200' };
  };

  const handleOpenVitalsModal = async (appt: any) => {
    setSelectedNurseAppt(appt);
    try {
      const pRes = await patientsApi.get(appt.patient_id);
      const pat = pRes?.data || pRes;
      setVitalsPatient(pat);

      let initialAge = '';
      if (pat?.age_years) {
        initialAge = String(pat.age_years);
      } else if (pat?.date_of_birth) {
        const birthDate = new Date(pat.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        initialAge = String(Math.max(0, age));
      }

      setIntakeForm({
        age_years: initialAge,
        blood_group: pat?.blood_group || 'B+',
        weight_kg: appt.vitals?.weight_kg ? String(appt.vitals.weight_kg) : '62',
        height_cm: appt.vitals?.height_cm ? String(appt.vitals.height_cm) : '165',
        bp_systolic: appt.vitals?.bp_systolic ? String(appt.vitals.bp_systolic) : '120',
        bp_diastolic: appt.vitals?.bp_diastolic ? String(appt.vitals.bp_diastolic) : '80',
        pulse_rate: appt.vitals?.pulse_rate ? String(appt.vitals.pulse_rate) : '74',
        temperature_f: appt.vitals?.temperature_f ? String(appt.vitals.temperature_f) : '98.4',
        spo2_percent: appt.vitals?.spo2_percent ? String(appt.vitals.spo2_percent) : '99',
        blood_sugar: appt.vitals?.blood_sugar || '',
        triage_notes: appt.vitals?.notes || '',
        doctor_id: appt.doctor_id || (doctorsList[0]?.id || 'doc-001'),
        doctor_name: appt.doctor_name || (doctorsList[0]?.full_name || 'Dr. Ananya Nair'),
      });
      setShowNurseVitalsModal(true);
    } catch (err) {
      console.error(err);
      alert('Unable to load patient profile.');
    }
  };

  const handleSaveVitalsAndPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNurseAppt) return;
    setSavingVitals(true);
    try {
      const weightNum = parseFloat(intakeForm.weight_kg) || 0;
      const heightM = (parseFloat(intakeForm.height_cm) || 0) / 100;
      const calcBmi = weightNum > 0 && heightM > 0 ? (weightNum / (heightM * heightM)).toFixed(1) : '-';

      // 1. Update patient profile in DB (age, blood group)
      await patientsApi.update(selectedNurseAppt.patient_id, {
        age_years: parseInt(intakeForm.age_years) || undefined,
        blood_group: intakeForm.blood_group,
      });

      // 2. Update appointment with vitals & assigned doctor
      const matchedDoc = doctorsList.find((d) => d.id === intakeForm.doctor_id);
      const docName = matchedDoc?.full_name || intakeForm.doctor_name || selectedNurseAppt.doctor_name || 'Dr. Ananya Nair';

      await appointmentsApi.update(selectedNurseAppt.id, {
        doctor_id: intakeForm.doctor_id || selectedNurseAppt.doctor_id,
        doctor_name: docName,
        vitals: {
          bp_systolic: intakeForm.bp_systolic,
          bp_diastolic: intakeForm.bp_diastolic,
          pulse_rate: intakeForm.pulse_rate,
          temperature_f: intakeForm.temperature_f,
          spo2_percent: intakeForm.spo2_percent,
          weight_kg: intakeForm.weight_kg,
          height_cm: intakeForm.height_cm,
          bmi: calcBmi,
          blood_group: intakeForm.blood_group,
          blood_sugar: intakeForm.blood_sugar,
          notes: intakeForm.triage_notes,
        },
        vitals_recorded_by: 'Staff Nurse Anjali Pillai',
      });

      // 3. Update status to 'Passed-to-Doctor'
      await appointmentsApi.updateStatus(selectedNurseAppt.id, 'Passed-to-Doctor');

      setShowNurseVitalsModal(false);
      setSelectedNurseAppt(null);
      alert(`Patient vitals & BMI saved! Successfully passed to ${docName}'s Cabin.`);
      await loadAppointments();
    } catch (err) {
      console.error(err);
      alert('Failed to save vitals and pass patient.');
    } finally {
      setSavingVitals(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Occupied':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Vacant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cleaning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 2xl:p-8 max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Nurse Station & Minor Procedures Desk
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              Active Clinical Station
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Doctor-referred procedures (Clean & Dressing, TT, Suture removal), Direct Walk-in Care (no receptionist needed), Nurse Vitals & Procedure Billing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadProcedures();
              loadBeds();
            }}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingProcedures || loadingBeds ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh Station
          </button>
          <button
            onClick={() => setShowWalkinModal(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            + Direct Walk-in (No Receptionist Needed)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('nurse_station')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'nurse_station'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Nurse Minor Procedures & Vitals Station</span>
          {referredPending.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
              {referredPending.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('daycare_beds')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'daycare_beds'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Daycare Bed & Recliner Map (6 Units)</span>
        </button>
      </div>

      {/* TAB 1: NURSE MINOR PROCEDURES & VITALS STATION */}
      {activeTab === 'nurse_station' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar with Live Pipeline Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Passed from Receptionist</p>
                <h3 className="text-2xl font-black text-rose-950 mt-0.5">{waitingForNurse.length}</h3>
                <p className="text-[10px] text-rose-600 mt-0.5">Waiting for Nurse Intake & Vitals</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-200/80 text-rose-900 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-rose-700" />
              </div>
            </div>

            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Passed to Doctor Cabin</p>
                <h3 className="text-2xl font-black text-sky-950 mt-0.5">{passedToDoctor.length}</h3>
                <p className="text-[10px] text-sky-600 mt-0.5">Vitals verified, in doctor queue</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-200/80 text-sky-900 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5 text-sky-700" />
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Doctor-Referred Waiting</p>
                <h3 className="text-2xl font-black text-amber-950 mt-0.5">{referredPending.length}</h3>
                <p className="text-[10px] text-amber-600 mt-0.5">Clean & Dressing, TT, Care</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold">
                <Scissors className="w-5 h-5 text-amber-700" />
              </div>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Direct Walk-ins Handled</p>
                <h3 className="text-2xl font-black text-purple-950 mt-0.5">{directWalkinsCount}</h3>
                <p className="text-[10px] text-purple-600 mt-0.5">Bypassed Reception Desk</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-200/80 text-purple-900 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5 text-purple-700" />
              </div>
            </div>
          </div>

          {/* Section 1: Patients Passed from Receptionist (Awaiting Nurse Vitals & Intake) */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-700" />
                <h2 className="font-bold text-slate-900 text-sm">
                  1. Patients Passed from Receptionist — Awaiting Nurse Intake & Vitals ({waitingForNurse.length})
                </h2>
              </div>
              <span className="text-[11px] text-rose-800 font-semibold bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200">
                Receptionist only took primary details; Nurse must take Age, Blood Group, Weight, Height & BMI
              </span>
            </div>

            {waitingForNurse.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No patients waiting from receptionist right now. All caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {waitingForNurse.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-rose-50/30 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-rose-100 text-rose-900 px-2 py-0.5 rounded font-black">
                          Token #{appt.token_no}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{appt.patient_name}</span>
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {appt.op_no}
                        </span>
                        {appt.phone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {appt.phone}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          Waiting for Nurse Vitals
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>Target Doctor: <strong className="text-slate-900">{appt.doctor_name || 'Dr. Ananya Nair'}</strong></span>
                        <span>·</span>
                        <span>Department: <strong className="text-slate-800">{appt.department_name || 'General'}</strong></span>
                        <span>·</span>
                        <span>Arrival: {new Date(appt.appointment_date || appt.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenVitalsModal(appt)}
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition shrink-0"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Take Vitals & Pass to Doctor Cabin ➔
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Patients Passed to Doctor Cabin (Completed Intake) */}
          <div className="bg-white rounded-xl border border-sky-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-700" />
                <h2 className="font-bold text-slate-900 text-sm">
                  2. Patients Passed to Doctor Cabin ({passedToDoctor.length})
                </h2>
              </div>
              <span className="text-[11px] text-sky-800 font-medium">
                Vitals, BMI & Blood Group recorded by Nurse; now queued in Doctor Consultation
              </span>
            </div>

            {passedToDoctor.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No patients currently waiting in Doctor cabin queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Token #</th>
                      <th className="py-2.5 px-3">Patient Name & OP</th>
                      <th className="py-2.5 px-3">Assigned Doctor</th>
                      <th className="py-2.5 px-3">Blood Group</th>
                      <th className="py-2.5 px-3">BMI</th>
                      <th className="py-2.5 px-3">BP & Pulse</th>
                      <th className="py-2.5 px-3">Weight / Height</th>
                      <th className="py-2.5 px-3">Doctor Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {passedToDoctor.map((appt) => {
                      const v = appt.vitals || {};
                      const bmiVal = parseFloat(v.bmi || '0');
                      const bmiBadge = getBmiCategory(bmiVal);
                      return (
                        <tr key={appt.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700">#{appt.token_no}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{appt.patient_name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{appt.op_no}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            🩺 {appt.doctor_name || 'Dr. Ananya Nair'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <Droplet className="w-3 h-3 text-rose-500" />
                              {v.blood_group || 'Recorded'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 font-mono mr-1.5">{v.bmi || '-'}</span>
                            {v.bmi && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${bmiBadge.color}`}>
                                {bmiBadge.label}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {v.bp_systolic ? `${v.bp_systolic}/${v.bp_diastolic} mmHg` : '120/80 mmHg'}
                            <span className="block text-[10px] text-slate-400">
                              Pulse: {v.pulse_rate || '74'} bpm
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {v.weight_kg ? `${v.weight_kg} kg` : '-'} · {v.height_cm ? `${v.height_cm} cm` : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                appt.status === 'In-Consult'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-sky-100 text-sky-800 border border-sky-200'
                              }`}
                            >
                              {appt.status === 'In-Consult' ? 'In Doctor Cabin' : 'Passed to Doctor'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleOpenVitalsModal(appt)}
                              className="text-sky-600 hover:text-sky-800 font-semibold text-xs inline-flex items-center gap-1"
                            >
                              Edit Vitals
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Doctor-Referred Patients Queue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-amber-700" />
                <h2 className="font-bold text-slate-900 text-sm">
                  3. Doctor-Referred Patients Waiting for Procedures ({referredPending.length})
                </h2>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Patients directed by Doctor for Clean & Dressing, TT, Injections or Minor Care
              </span>
            </div>

            {referredPending.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No doctor-referred procedures pending right now. All caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {referredPending.map((proc) => (
                  <div key={proc.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{proc.patient_name}</span>
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {proc.op_no}
                        </span>
                        {proc.phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {proc.phone}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          Referred by {proc.doctor_name || 'Doctor'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="font-semibold text-slate-900 flex items-center gap-1 text-emerald-700">
                          <Scissors className="w-3.5 h-3.5" />
                          {proc.procedure_name}
                        </span>
                        <span>·</span>
                        <span className="font-bold text-slate-800 font-mono">
                          Price: ₹{proc.price} {proc.price_type === 'custom' ? '(Custom Price)' : ''}
                        </span>
                        <span>·</span>
                        <span>Assigned Nurse: <strong className="text-slate-900">{proc.nurse_name}</strong></span>
                      </div>

                      {proc.notes && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-200 inline-block">
                          Doctor's Note: {proc.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenPerformModal(proc)}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition shrink-0"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Record Vitals & Perform Procedure
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Completed Procedures Today */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  4. Procedures Completed Today & Billed ({completedProcedures.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                All procedures automatically generate unified OP procedure bills
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Patient / OP</th>
                    <th className="py-3 px-4">Flow / Pipeline Origin</th>
                    <th className="py-3 px-4">Procedure Performed</th>
                    <th className="py-3 px-4">Nurse Attending</th>
                    <th className="py-3 px-4">Vitals Recorded</th>
                    <th className="py-3 px-4 text-right">Fee / Bill Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {completedProcedures.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No nursing procedures completed yet today.
                      </td>
                    </tr>
                  ) : (
                    completedProcedures.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-slate-500">{p.time || '10:30 AM'}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.patient_name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{p.op_no} {p.phone ? `· ${p.phone}` : ''}</div>
                        </td>
                        <td className="py-3 px-4">
                          {p.referred_by === 'Direct Walk-in' ? (
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                              🚶 Direct Walk-in (No Reception)
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                              🩺 Ref: {p.doctor_name || 'Dr. Ananya Nair'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {p.procedure_name}
                          {p.notes && <p className="text-[10px] text-slate-500 font-normal italic">{p.notes}</p>}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {p.nurse_name}
                        </td>
                        <td className="py-3 px-4">
                          {p.vitals ? (
                            <span className="font-mono text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {typeof p.vitals === 'string' ? p.vitals : `BP ${p.vitals.bp_systolic}/${p.vitals.bp_diastolic}`}
                            </span>
                          ) : (
                            <span className="text-slate-400">Vitals checked</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-bold text-slate-900 text-sm">₹{p.price}</span>
                          <span className="block text-[10px] text-emerald-700 font-bold">Auto-Billed (Paid)</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAYCARE BED & RECLINER MAP */}
      {activeTab === 'daycare_beds' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daycare Bed & Recliner Status (6 Units)</h3>
              <p className="text-xs text-slate-500">
                Recovery beds for minor procedures, HydraFacial sessions, laser treatments and IV hydration infusions
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              Vacant: {beds.filter((b) => b.status === 'Vacant').length} · Occupied: {beds.filter((b) => b.status === 'Occupied').length} · Cleaning: {beds.filter((b) => b.status === 'Cleaning').length}
            </span>
          </div>

          {/* Bed Map Visualizer Grid (Responsive across Phone, Tablet, Laptop & TV screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-5">
            {beds.map((bed) => (
              <div
                key={bed.id}
                className={`border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition ${
                  bed.status === 'Occupied'
                    ? 'bg-purple-50/40 border-purple-200'
                    : bed.status === 'Cleaning'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          bed.status === 'Occupied'
                            ? 'bg-purple-200 text-purple-900'
                            : bed.status === 'Cleaning'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <Bed className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{bed.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{bed.room}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                        bed.status
                      )}`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  {/* Status Specific Details */}
                  {bed.status === 'Occupied' ? (
                    <div className="mt-4 bg-white/80 p-3.5 rounded-xl border border-purple-100 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Current Patient</span>
                        <p className="font-bold text-slate-900 text-sm">{bed.patient_name}</p>
                        <p className="text-[11px] font-mono text-purple-700">{bed.op_no}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Procedure</span>
                        <p className="text-slate-800 font-semibold">{bed.procedure_name}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-purple-100">
                        <span>Started: {bed.start_time}</span>
                        <span className="font-mono text-emerald-700 font-bold">{bed.vitals}</span>
                      </div>
                    </div>
                  ) : bed.status === 'Cleaning' ? (
                    <div className="mt-4 bg-amber-100/40 p-3.5 rounded-xl border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Post-Procedure Sanitization In Progress</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">{bed.notes}</p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Ready for incoming procedure patient
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  {bed.status === 'Occupied' && (
                    <button
                      onClick={() => handleDischarge(bed.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Discharge & Clear Bed
                    </button>
                  )}
                  {bed.status === 'Cleaning' && (
                    <button
                      onClick={() => handleSanitized(bed.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Ready & Vacant
                    </button>
                  )}
                  {bed.status === 'Vacant' && (
                    <button
                      onClick={() => {
                        setSelectedBed(bed);
                        setShowAllocateModal(true);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg shadow-2xs"
                    >
                      + Allocate Patient
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: DIRECT WALK-IN TO NURSE (NO RECEPTIONIST NEEDED) */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Direct Customer Walk-in to Nurse</h2>
                  <p className="text-[11px] text-emerald-700 font-medium">Bypasses reception desk for TT injection, dressing or wound care</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWalkinProcedure} className="space-y-4">
              {/* Patient Lookup or Walk-in Name */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Patient Identification
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWalkinPatientType('search')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        walkinPatientType === 'search' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Search Existing Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWalkinPatientType('new');
                        setWalkinForm((f) => ({ ...f, patient_id: 'pat-walkin', op_no: 'OP-WALKIN' }));
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        walkinPatientType === 'new' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Direct Walk-in Name
                    </button>
                  </div>
                </div>

                {walkinPatientType === 'search' ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type OP Number, Patient Name or Mobile..."
                      value={walkinSearch}
                      onChange={(e) => handleWalkinSearch(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    {walkinResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                        {walkinResults.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectWalkinPatient(p)}
                            className="p-2 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-emerald-700 mr-2">{p.op_no}</span>
                              <span className="font-semibold text-slate-900">{p.first_name} {p.last_name || ''}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Customer Name (e.g. Ramesh K)"
                        value={walkinForm.patient_name}
                        onChange={(e) => setWalkinForm((f) => ({ ...f, patient_name: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Mobile Number (e.g. 9847000000)"
                        value={walkinForm.phone}
                        onChange={(e) => setWalkinForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Procedure Selection & Custom / Dropdown Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nursing Procedure / Dressing *</label>
                  <select
                    value={walkinForm.is_custom_procedure ? 'CUSTOM' : walkinForm.procedure_name}
                    onChange={(e) => handleWalkinProcedureChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    {STANDARD_NURSING_PROCEDURES.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} (Std: ₹{p.default_price})
                      </option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Procedure Name...</option>
                  </select>
                </div>

                {/* Price (Dropdown or Custom Price) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Procedure Price (₹) *</label>
                    <span className="text-[10px] font-bold text-emerald-700">
                      {walkinForm.price_type === 'custom' ? 'Custom Price' : 'Standard Catalog Price'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      value={walkinForm.price}
                      onChange={(e) =>
                        setWalkinForm((f) => ({
                          ...f,
                          price: Number(e.target.value),
                          price_type: 'custom',
                        }))
                      }
                      className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* If Custom Procedure selected */}
              {walkinForm.is_custom_procedure && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Enter Custom Procedure Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abscess Cleaning, Pressure Bandage, Ear Lobe Wash"
                    value={walkinForm.custom_procedure_name}
                    onChange={(e) => setWalkinForm((f) => ({ ...f, custom_procedure_name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Attending Nurse */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attending Nurse / Staff *</label>
                <select
                  value={walkinForm.nurse_name}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, nurse_name: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                >
                  <option value="Anjali Pillai">Anjali Pillai (Staff Nurse)</option>
                  <option value="Sneha Varma">Sneha Varma (Wound Care Nurse)</option>
                  <option value="Kavya Nair">Kavya Nair (Senior Nurse)</option>
                </select>
              </div>

              {/* Nurse Vitals Recording */}
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Nurse Vitals Recording (Pre / Post Procedure)
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500">BP Sys</label>
                    <input
                      type="number"
                      value={performVitals.bp_systolic}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, bp_systolic: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">BP Dia</label>
                    <input
                      type="number"
                      value={performVitals.bp_diastolic}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, bp_diastolic: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={performVitals.pulse_rate}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, pulse_rate: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Temp (°F)</label>
                    <input
                      type="text"
                      value={performVitals.temperature_f}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, temperature_f: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">SpO2 (%)</label>
                    <input
                      type="number"
                      value={performVitals.spo2_percent}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, spo2_percent: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Weight (kg)</label>
                    <input
                      type="number"
                      value={performVitals.weight_kg}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, weight_kg: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Procedure Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nurse Clinical Notes</label>
                <textarea
                  rows={2}
                  value={walkinForm.notes}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Total Bill: <strong className="text-slate-900 font-mono text-sm">₹{walkinForm.price}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWalkinModal(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    Record Vitals, Perform & Generate Bill (₹{walkinForm.price})
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PERFORM DOCTOR-REFERRED PROCEDURE */}
      {showPerformModal && selectedReferredProc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Perform: {selectedReferredProc.procedure_name}
                </h2>
                <p className="text-[11px] text-amber-700 font-medium">
                  Ordered by {selectedReferredProc.doctor_name || 'Dr. Ananya Nair'} for {selectedReferredProc.patient_name} ({selectedReferredProc.op_no})
                </p>
              </div>
              <button
                onClick={() => setShowPerformModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPerform} className="space-y-4">
              {/* Doctor's instructions banner */}
              {selectedReferredProc.notes && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Doctor's Clinical Instructions:</span>
                  <p className="text-amber-900 font-medium mt-0.5">{selectedReferredProc.notes}</p>
                </div>
              )}

              {/* Price & Nurse Attending */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attending Nurse *</label>
                  <select
                    value={performNurse}
                    onChange={(e) => setPerformNurse(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="Anjali Pillai">Anjali Pillai (Staff Nurse)</option>
                    <option value="Sneha Varma">Sneha Varma (Wound Care Nurse)</option>
                    <option value="Kavya Nair">Kavya Nair (Senior Nurse)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Procedure Price</label>
                  <div className="p-2 bg-slate-100 rounded-lg font-mono font-bold text-slate-900">
                    ₹{selectedReferredProc.price} {selectedReferredProc.price_type === 'custom' ? '(Custom Price Set by Doctor)' : ''}
                  </div>
                </div>
              </div>

              {/* Record Vitals */}
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Nurse Vitals Recording
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500">BP Sys</label>
                    <input
                      type="number"
                      value={performVitals.bp_systolic}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, bp_systolic: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">BP Dia</label>
                    <input
                      type="number"
                      value={performVitals.bp_diastolic}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, bp_diastolic: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Pulse</label>
                    <input
                      type="number"
                      value={performVitals.pulse_rate}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, pulse_rate: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Temp °F</label>
                    <input
                      type="text"
                      value={performVitals.temperature_f}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, temperature_f: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">SpO2 %</label>
                    <input
                      type="number"
                      value={performVitals.spo2_percent}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, spo2_percent: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Weight kg</label>
                    <input
                      type="number"
                      value={performVitals.weight_kg}
                      onChange={(e) => setPerformVitals((v) => ({ ...v, weight_kg: e.target.value }))}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Nurse Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nurse Execution Notes</label>
                <textarea
                  rows={2}
                  value={performNotes}
                  onChange={(e) => setPerformNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Procedure Bill: <strong className="text-slate-900 font-mono text-sm">₹{selectedReferredProc.price}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPerformModal(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Procedure & Generate Bill
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATE BED MODAL */}
      {showAllocateModal && selectedBed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Allocate {selectedBed.name}</h2>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-3">
              {/* Quick Patient Search (Bypass Registration) */}
              <div className="bg-violet-50/60 p-2.5 rounded-xl border border-violet-100 space-y-1.5">
                <label className="block font-bold text-violet-900 text-[11px] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-violet-600" />
                  Quick Patient Lookup (Search OP / Mobile / Name)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type OP # (e.g. KRN-00101) or Name to auto-fill..."
                    value={patientSearch}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  {patientResults.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {patientResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="p-2 hover:bg-violet-50 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-violet-700 mr-2">{p.op_no}</span>
                            <span className="font-semibold text-slate-900">{p.first_name} {p.last_name || ''}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{p.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Varghese"
                  value={allocateForm.patient_name}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, patient_name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">OP Number</label>
                <input
                  type="text"
                  placeholder="e.g. KRN-00103"
                  value={allocateForm.op_no}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, op_no: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procedure / Infusion</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glutathione IV Drip + Vitamin C"
                  value={allocateForm.procedure_name}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, procedure_name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attending Nurse / Aesthetician</label>
                <input
                  type="text"
                  value={allocateForm.attending_staff}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, attending_staff: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded-lg shadow-xs"
                >
                  Confirm Bed Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NURSE CLINICAL INTAKE & VITALS MODAL */}
      {showNurseVitalsModal && selectedNurseAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Nurse Station — Clinical Intake & Vitals Desk
                  </h2>
                  <p className="text-xs text-slate-500">
                    Patient passed from Reception. Record vital signs, age, blood group & calculate BMI before passing to Doctor Cabin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNurseVitalsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Primary Details Received from Receptionist */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Primary Registration Details (From Reception Desk):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Token #</span>
                  <span className="font-mono font-black text-rose-700">Token #{selectedNurseAppt.token_no}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Patient Name</span>
                  <span className="font-bold text-slate-900">{selectedNurseAppt.patient_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">OP Number</span>
                  <span className="font-mono font-bold text-slate-800">{selectedNurseAppt.op_no}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Phone</span>
                  <span className="font-mono text-slate-700">{selectedNurseAppt.phone || vitalsPatient?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Gender</span>
                  <span className="font-semibold text-slate-800">{vitalsPatient?.gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Date of Birth</span>
                  <span className="text-slate-700">{vitalsPatient?.date_of_birth || 'Not specified'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">Address / City</span>
                  <span className="text-slate-700 truncate block">{vitalsPatient?.city || vitalsPatient?.address || 'Calicut'}</span>
                </div>
              </div>
            </div>

            {/* Nurse Intake & Vitals Form */}
            <form onSubmit={handleSaveVitalsAndPass} className="space-y-4">
              {/* Group 1: Age, Blood Group, Weight, Height & BMI */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-rose-600" />
                  <span>1. Body Vitals & BMI Assessment</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-rose-50/40 p-3.5 rounded-xl border border-rose-200/80">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="125"
                      required
                      placeholder="e.g. 26"
                      value={intakeForm.age_years}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, age_years: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Blood Group *
                    </label>
                    <select
                      value={intakeForm.blood_group}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, blood_group: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-rose-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="A+">A + (Positive)</option>
                      <option value="A-">A - (Negative)</option>
                      <option value="B+">B + (Positive)</option>
                      <option value="B-">B - (Negative)</option>
                      <option value="O+">O + (Positive)</option>
                      <option value="O-">O - (Negative)</option>
                      <option value="AB+">AB + (Positive)</option>
                      <option value="AB-">AB - (Negative)</option>
                      <option value="Bombay">Bombay Group (Rare)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="300"
                      required
                      placeholder="e.g. 62"
                      value={intakeForm.weight_kg}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, weight_kg: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="30"
                      max="250"
                      required
                      placeholder="e.g. 165"
                      value={intakeForm.height_cm}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, height_cm: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Live Auto-Calculated BMI Banner */}
                  <div className="col-span-2 sm:col-span-4 bg-white p-2.5 rounded-lg border border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Live Auto-Calculated Body Mass Index (BMI):
                      </span>
                    </div>
                    {(() => {
                      const w = parseFloat(intakeForm.weight_kg) || 0;
                      const h = (parseFloat(intakeForm.height_cm) || 0) / 100;
                      const bmiVal = w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '-';
                      const badge = getBmiCategory(parseFloat(bmiVal));
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black font-mono text-slate-900">
                            {bmiVal} {bmiVal !== '-' && <span className="text-[10px] font-normal text-slate-500">kg/m²</span>}
                          </span>
                          {bmiVal !== '-' && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Group 2: Cardiovascular & Vital Parameters */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>2. Vital Signs (BP, Pulse, Temp & SpO2)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      BP Systolic (mmHg)
                    </label>
                    <input
                      type="number"
                      placeholder="120"
                      value={intakeForm.bp_systolic}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, bp_systolic: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      BP Diastolic (mmHg)
                    </label>
                    <input
                      type="number"
                      placeholder="80"
                      value={intakeForm.bp_diastolic}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, bp_diastolic: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pulse (bpm)
                    </label>
                    <input
                      type="number"
                      placeholder="74"
                      value={intakeForm.pulse_rate}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, pulse_rate: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Temp (°F)
                    </label>
                    <input
                      type="text"
                      placeholder="98.4"
                      value={intakeForm.temperature_f}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, temperature_f: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      placeholder="99"
                      value={intakeForm.spo2_percent}
                      onChange={(e) => setIntakeForm((f) => ({ ...f, spo2_percent: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Doctor Assignment & Preliminary Nurse Assessment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Patient to Doctor Cabin *
                  </label>
                  <select
                    value={intakeForm.doctor_id}
                    onChange={(e) => {
                      const doc = doctorsList.find((d) => d.id === e.target.value);
                      setIntakeForm((f) => ({
                        ...f,
                        doctor_id: e.target.value,
                        doctor_name: doc?.full_name || '',
                      }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.full_name} ({doc.specialisation || 'Consultant'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Random Blood Sugar (Optional mg/dL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 110 mg/dL"
                    value={intakeForm.blood_sugar}
                    onChange={(e) => setIntakeForm((f) => ({ ...f, blood_sugar: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nurse Preliminary Notes & Symptoms (For Doctor Review)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Patient conscious, complaining of itching and erythema on face and neck for 3 days. No previous drug allergies noted."
                    value={intakeForm.triage_notes}
                    onChange={(e) => setIntakeForm((f) => ({ ...f, triage_notes: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Attending Staff: <strong>Nurse Anjali Pillai</strong> (Clinical Intake Station)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNurseVitalsModal(false)}
                    className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingVitals}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingVitals ? 'Saving...' : 'Save Vitals & Pass to Doctor Cabin ➔'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
