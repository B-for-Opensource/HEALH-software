import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Pill,
  User,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  appointmentsApi, 
  patientsApi, 
  consultationsApi, 
  prescriptionsApi, 
  medicinesApi 
} from '@/api';
import type { Appointment, Patient, Medicine } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface RxItem {
  medicine_id?: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration_days: number;
  quantity: number;
  special_instructions: string;
}

export default function DoctorWorkbenchPage() {
  const { apptId } = useParams();
  const navigate = useNavigate();

  // Active queue
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  // Clinical Consultation State
  const [vitals, setVitals] = useState({
    bp_systolic: '',
    bp_diastolic: '',
    pulse_rate: '',
    temperature_f: '',
    spo2_percent: '',
    weight_kg: '',
    height_cm: '',
  });

  const [clinical, setClinical] = useState({
    known_conditions: '',
    chief_complaints: '',
    complaint_duration: '',
    skin_type: 'Normal',
    examination_notes: '',
    diagnosis: '',
    treatment_plan: '',
    doctor_private_notes: '',
    review_after_days: '7',
    review_instructions: '',
  });

  // Prescription Items
  const [rxList, setRxList] = useState<RxItem[]>([]);
  const [medQuery, setMedQuery] = useState('');
  const [medSuggestions, setMedSuggestions] = useState<Medicine[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSavedConsultId, setLastSavedConsultId] = useState<string | null>(null);

  // Load Queue
  useEffect(() => {
    appointmentsApi.queue().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      // Filter waiting or in-consult
      const filtered = list.filter((a: any) => ['In-Consult', 'Waiting', 'Called'].includes(a.status));
      setQueue(filtered);
      if (apptId) {
        const found = list.find((a: any) => a.id === apptId);
        if (found) loadAppointment(found);
      } else if (filtered.length > 0 && !selectedAppt) {
        loadAppointment(filtered[0]);
      }
    });
  }, [apptId]);

  const loadAppointment = async (appt: Appointment) => {
    setSelectedAppt(appt);
    try {
      const pRes = await patientsApi.get(appt.patient_id);
      const pat = pRes?.data || pRes;
      setPatient(pat);

      // Load patient history
      const hRes = await patientsApi.history(appt.patient_id);
      setPatientHistory(Array.isArray(hRes) ? hRes : (hRes?.data || []));

      // Prefill chief complaint from appointment if any
      if (appt.purpose) {
        setClinical((prev) => ({ ...prev, chief_complaints: appt.purpose || '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Medicine search
  const handleMedSearch = async (val: string) => {
    setMedQuery(val);
    if (val.trim().length >= 2) {
      try {
        const res = await medicinesApi.search(val);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setMedSuggestions(list);
      } catch {
        setMedSuggestions([]);
      }
    } else {
      setMedSuggestions([]);
    }
  };

  const addMedicine = (m: Medicine) => {
    setRxList((prev) => [
      ...prev,
      {
        medicine_id: m.id,
        medicine_name: `${m.name} ${m.strength ? `(${m.strength})` : ''}`.trim(),
        dosage: m.default_dosage || '1 Tab',
        frequency: m.default_frequency || '1-0-1',
        timing: m.default_timing || 'After Food',
        duration_days: 5,
        quantity: 10,
        special_instructions: '',
      },
    ]);
    setMedQuery('');
    setMedSuggestions([]);
  };

  const addCustomMedicine = () => {
    if (!medQuery.trim()) return;
    setRxList((prev) => [
      ...prev,
      {
        medicine_name: medQuery.trim(),
        dosage: '1 Tab',
        frequency: '1-0-1',
        timing: 'After Food',
        duration_days: 5,
        quantity: 10,
        special_instructions: '',
      },
    ]);
    setMedQuery('');
    setMedSuggestions([]);
  };

  const removeMedicine = (index: number) => {
    setRxList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRxItem = (index: number, field: keyof RxItem, val: any) => {
    setRxList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Calculate review date
  const reviewDays = parseInt(clinical.review_after_days) || 0;
  const reviewDate = new Date();
  reviewDate.setDate(reviewDate.getDate() + reviewDays);
  const reviewDateStr = reviewDays > 0 ? reviewDate.toISOString().split('T')[0] : '';

  // Calculate BMI
  const weight = parseFloat(vitals.weight_kg);
  const heightM = parseFloat(vitals.height_cm) / 100;
  const bmi = weight > 0 && heightM > 0 ? (weight / (heightM * heightM)).toFixed(1) : '-';

  const handleSaveConsultation = async (finalize = false) => {
    if (!selectedAppt || !patient) return;
    setSaving(true);
    try {
      const payload = {
        appointment_id: selectedAppt.id,
        patient_id: patient.id,
        doctor_id: selectedAppt.doctor_id,
        bp_systolic: vitals.bp_systolic ? parseInt(vitals.bp_systolic) : null,
        bp_diastolic: vitals.bp_diastolic ? parseInt(vitals.bp_diastolic) : null,
        pulse_rate: vitals.pulse_rate ? parseInt(vitals.pulse_rate) : null,
        temperature_f: vitals.temperature_f ? parseFloat(vitals.temperature_f) : null,
        spo2_percent: vitals.spo2_percent ? parseInt(vitals.spo2_percent) : null,
        weight_kg: weight > 0 ? weight : null,
        height_cm: vitals.height_cm ? parseFloat(vitals.height_cm) : null,
        bmi: bmi !== '-' ? parseFloat(bmi) : null,
        known_conditions: clinical.known_conditions,
        chief_complaints: clinical.chief_complaints,
        complaint_duration: clinical.complaint_duration,
        skin_type: clinical.skin_type,
        examination_notes: clinical.examination_notes,
        diagnosis: clinical.diagnosis,
        treatment_plan: clinical.treatment_plan,
        doctor_private_notes: clinical.doctor_private_notes,
        review_after_days: reviewDays > 0 ? reviewDays : null,
        review_date: reviewDateStr || null,
        review_instructions: clinical.review_instructions,
        is_draft: finalize ? 0 : 1,
      };

      const consultRes = await consultationsApi.create(payload);
      const consult = consultRes?.data || consultRes;
      const consultId = consult?.id || 'consult-1';
      setLastSavedConsultId(consultId);

      // Save prescription if items exist
      if (rxList.length > 0) {
        await prescriptionsApi.create({
          consultation_id: consultId,
          patient_id: patient.id,
          doctor_id: selectedAppt.doctor_id,
          general_advice: clinical.review_instructions,
          items: rxList,
        });
      }

      if (finalize) {
        await appointmentsApi.updateStatus(selectedAppt.id, 'Billing-Pending');
        alert('Consultation finalized! Patient has been moved to Billing Pending.');
        navigate('/reception/queue');
      } else {
        alert('Consultation draft saved successfully.');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT: Patients In Queue */}
      <div className="w-full lg:w-72 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>Today's Consultation Queue</span>
            <span className="text-xs bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded-full">
              {queue.length}
            </span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {queue.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No patients waiting for consultation
            </div>
          ) : (
            queue.map((item) => (
              <button
                key={item.id}
                onClick={() => loadAppointment(item)}
                className={cn(
                  'w-full text-left p-3.5 transition flex items-start justify-between',
                  selectedAppt?.id === item.id
                    ? 'bg-violet-50/80 border-l-4 border-violet-600'
                    : 'hover:bg-slate-100/70'
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-violet-700 text-sm">
                      #{item.token_no}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {item.patient_name || 'Patient'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.op_no}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {item.purpose || item.visit_type}
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                  {item.status}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Doctor EMR Workbench */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6">
        {!selectedAppt || !patient ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Stethoscope className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No Patient Selected</p>
            <p className="text-xs text-slate-400 mt-1">Select a token from the left queue to open consultation</p>
          </div>
        ) : (
          <>
            {/* Patient Info Banner */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 font-bold text-base flex items-center justify-center">
                  #{selectedAppt.token_no}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {patient.first_name} {patient.last_name || ''}
                    </h2>
                    <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {patient.op_no}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                    <span>{patient.gender}</span>
                    <span>{patient.age_years ? `${patient.age_years} yrs` : '-'}</span>
                    <span>Blood: <strong className="text-slate-700">{patient.blood_group || 'Unknown'}</strong></span>
                    <span>Phone: {patient.phone}</span>
                    {patient.known_allergies && (
                      <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 rounded">
                        ⚠️ Allergy: {patient.known_allergies}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveConsultation(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConsultation(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Finalize & Send to Billing
                </button>
              </div>
            </div>

            {/* Vitals Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Patient Vitals
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">BP Sys (mmHg)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={vitals.bp_systolic}
                    onChange={(e) => setVitals((v) => ({ ...v, bp_systolic: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">BP Dia (mmHg)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={vitals.bp_diastolic}
                    onChange={(e) => setVitals((v) => ({ ...v, bp_diastolic: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={vitals.pulse_rate}
                    onChange={(e) => setVitals((v) => ({ ...v, pulse_rate: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={vitals.temperature_f}
                    onChange={(e) => setVitals((v) => ({ ...v, temperature_f: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="99"
                    value={vitals.spo2_percent}
                    onChange={(e) => setVitals((v) => ({ ...v, spo2_percent: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="65"
                    value={vitals.weight_kg}
                    onChange={(e) => setVitals((v) => ({ ...v, weight_kg: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">BMI (auto)</label>
                  <div className="bg-slate-100 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center">
                    {bmi}
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Assessment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Complaints & Examination
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chief Complaints & Duration
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Melasma on cheeks for 6 months, flare up after sun exposure"
                    value={clinical.chief_complaints}
                    onChange={(e) => setClinical((c) => ({ ...c, chief_complaints: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Skin Type</label>
                    <select
                      value={clinical.skin_type}
                      onChange={(e) => setClinical((c) => ({ ...c, skin_type: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="Fitzpatrick I-II">Fitzpatrick I - Fair</option>
                      <option value="Fitzpatrick III">Fitzpatrick III - Medium</option>
                      <option value="Fitzpatrick IV">Fitzpatrick IV - Olive</option>
                      <option value="Fitzpatrick V-VI">Fitzpatrick V-VI - Deep</option>
                      <option value="Oily">Oily / Acne-prone</option>
                      <option value="Dry">Dry / Sensitive</option>
                      <option value="Normal">Normal / Combination</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Known Conditions (K/C/O)</label>
                    <input
                      type="text"
                      placeholder="e.g. Hypothyroidism, PCOD, DM"
                      value={clinical.known_conditions}
                      onChange={(e) => setClinical((c) => ({ ...c, known_conditions: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical / Derm Examination Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Clinical findings, lesion distribution, pigmentation depth..."
                    value={clinical.examination_notes}
                    onChange={(e) => setClinical((c) => ({ ...c, examination_notes: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Diagnosis & Procedures
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnosis / Clinical Impression
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Epidermal Melasma, Acne Vulgaris Grade II"
                    value={clinical.diagnosis}
                    onChange={(e) => setClinical((c) => ({ ...c, diagnosis: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Treatment & Daycare Procedure Done Today
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Chemical peel (Glycolic 30%), Comedone extraction done under aseptic precautions..."
                    value={clinical.treatment_plan}
                    onChange={(e) => setClinical((c) => ({ ...c, treatment_plan: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Private Notes (Not visible on patient printout)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Confidential clinical impressions, cautions for subsequent sessions..."
                    value={clinical.doctor_private_notes}
                    onChange={(e) => setClinical((c) => ({ ...c, doctor_private_notes: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Prescription Builder */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-violet-600" />
                  Prescription Writer (Rx)
                </h3>
                <span className="text-xs text-slate-400">Printed on official clinic letterhead</span>
              </div>

              {/* Medicine Autocomplete Search */}
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search medicine master (e.g. Doxycycline, Sunscreen SPF 50, Azelaic Acid)..."
                    value={medQuery}
                    onChange={(e) => handleMedSearch(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  {medQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={addCustomMedicine}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
                    >
                      + Add As Custom Rx
                    </button>
                  )}
                </div>

                {medSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {medSuggestions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => addMedicine(m)}
                        className="w-full text-left p-2.5 hover:bg-violet-50 text-xs flex items-center justify-between transition"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          {m.generic_name && (
                            <span className="text-slate-400 ml-2">({m.generic_name})</span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[11px]">{m.dosage_form} · {m.strength || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rx Table */}
              {rxList.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Medicine Name</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Timing</th>
                        <th className="py-2.5 px-3">Days</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Instructions</th>
                        <th className="py-2.5 px-3 text-right">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rxList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {item.medicine_name}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) => updateRxItem(idx, 'dosage', e.target.value)}
                              className="w-20 border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.frequency}
                              onChange={(e) => updateRxItem(idx, 'frequency', e.target.value)}
                              className="border border-slate-300 rounded px-1.5 py-1 text-xs bg-white"
                            >
                              <option value="1-0-1">1-0-1 (BD)</option>
                              <option value="1-0-0">1-0-0 (Morning)</option>
                              <option value="0-0-1">0-0-1 (Night)</option>
                              <option value="1-1-1">1-1-1 (TDS)</option>
                              <option value="1-1-1-1">1-1-1-1 (QID)</option>
                              <option value="SOS">SOS (When needed)</option>
                              <option value="Alternate Day">Alternate Day</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.timing}
                              onChange={(e) => updateRxItem(idx, 'timing', e.target.value)}
                              className="border border-slate-300 rounded px-1.5 py-1 text-xs bg-white"
                            >
                              <option value="After Food">After Food</option>
                              <option value="Before Food">Before Food</option>
                              <option value="With Food">With Food</option>
                              <option value="Bedtime">Bedtime</option>
                              <option value="Apply Locally">Apply Locally</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.duration_days}
                              onChange={(e) => updateRxItem(idx, 'duration_days', parseInt(e.target.value) || 1)}
                              className="w-14 border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateRxItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-14 border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="e.g. Avoid sun exposure after application"
                              value={item.special_instructions}
                              onChange={(e) => updateRxItem(idx, 'special_instructions', e.target.value)}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeMedicine(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Follow-up Scheduler */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-violet-600" />
                Schedule Medical Follow-up Review
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review After (Days)
                  </label>
                  <select
                    value={clinical.review_after_days}
                    onChange={(e) => setClinical((c) => ({ ...c, review_after_days: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="0">No follow-up needed</option>
                    <option value="3">3 Days (Quick check)</option>
                    <option value="7">7 Days (1 Week)</option>
                    <option value="14">14 Days (2 Weeks)</option>
                    <option value="21">21 Days (3 Weeks)</option>
                    <option value="30">30 Days (1 Month)</option>
                    <option value="60">60 Days (2 Months)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calculated Review Date
                  </label>
                  <input
                    type="date"
                    readOnly
                    value={reviewDateStr}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review Instructions / Test Advice
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Check skin peeling, bring blood reports"
                    value={clinical.review_instructions}
                    onChange={(e) => setClinical((c) => ({ ...c, review_instructions: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
