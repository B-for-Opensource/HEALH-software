import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Pill,
  User,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  FileText,
  History,
  ChevronDown,
  ChevronUp,
  Copy,
  CalendarDays,
  ShieldAlert,
  Filter,
  Camera,
  Upload,
  FlaskConical,
  Eye,
  X,
  Search,
  Sparkles,
  Layers,
  Phone,
  Activity
} from 'lucide-react';
import {
  appointmentsApi,
  patientsApi,
  consultationsApi,
  prescriptionsApi,
  medicinesApi,
  mastersApi,
  labApi,
  nursingApi
} from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { Appointment, Patient, Medicine } from '@/types';
import { cn, formatDate } from '@/lib/utils';

export function calculateAutoQuantity(frequency: string, duration_days: number): number {
  const days = Math.max(1, Number(duration_days) || 1);
  const freq = (frequency || '').trim();

  // 1. Dash format: e.g. "1-0-1", "1-1-1", "1-0-0", "0-0-1", "1-1-1-1"
  if (/^\d+(-\d+)+$/.test(freq)) {
    const parts = freq.split('-').map(Number);
    const sumPerDay = parts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
    return Math.max(1, sumPerDay * days);
  }

  // 2. Multiplication / 'x' format: e.g. "1 x 1", "1 x 2", "2 x 1", "1x1", "1x2"
  const xMatch = freq.match(/^(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)/);
  if (xMatch) {
    const perDose = parseFloat(xMatch[1]) || 1;
    const timesPerDay = parseFloat(xMatch[2]) || 1;
    return Math.max(1, Math.round(perDose * timesPerDay * days));
  }

  // 3. Named frequencies
  const lower = freq.toLowerCase();
  if (lower.includes('alternate')) {
    return Math.max(1, Math.ceil(days / 2));
  }
  if (lower.includes('sos') || lower.includes('prn')) {
    return 5;
  }
  if (lower.includes('weekly')) {
    return Math.max(1, Math.ceil(days / 7));
  }

  // Default: 2 per day (e.g. BD)
  return Math.max(1, days * 2);
}

const COMMON_LAB_TESTS = [
  { name: 'Skin Biopsy (H&E Histopathology)', category: 'Histopathology', sample: 'Punch / Excisional Biopsy' },
  { name: 'Complete Blood Count (CBC + ESR)', category: 'Hematology', sample: 'Whole Blood (EDTA)' },
  { name: 'Serum IgE Level (Total Allergy Screen)', category: 'Immunology', sample: 'Serum' },
  { name: 'KOH Mount (Direct Fungal Scraping)', category: 'Microbiology', sample: 'Skin Scraping / Nail' },
  { name: 'Wood’s Lamp Examination', category: 'Clinical Dermatology', sample: 'UV Examination' },
  { name: 'Patch Test (European Standard Series 30)', category: 'Allergy & Contact Derm', sample: 'Skin Application' },
  { name: 'Serum Ferritin & Iron Studies', category: 'Biochemistry', sample: 'Serum' },
  { name: 'Thyroid Profile (TSH, FT3, FT4)', category: 'Endocrinology', sample: 'Serum' },
  { name: 'Fasting Blood Sugar & HbA1c', category: 'Biochemistry', sample: 'Fluoride / Whole Blood' },
  { name: 'Liver Function Test (LFT)', category: 'Biochemistry', sample: 'Serum' },
  { name: 'Serum Vitamin D3 (25-OH)', category: 'Biochemistry', sample: 'Serum' },
];

const CHEMICAL_FAMILIES = [
  'Tretinoin',
  'Minoxidil',
  'Azelaic Acid',
  'Doxycycline',
  'Salicylic Acid',
  'Hydroquinone',
  'Clobetasol Propionate',
  'Ketoconazole',
  'Cetirizine',
  'Paracetamol',
];

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
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [patientNursingProcs, setPatientNursingProcs] = useState<any[]>([]);
  const [patientLabOrders, setPatientLabOrders] = useState<any[]>([]);
  const [showPastHistory, setShowPastHistory] = useState(false);
  const [showQueueSidebar, setShowQueueSidebar] = useState(true);

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
  const [showRxModal, setShowRxModal] = useState(false);

  // Chemical Family Molecule Selector
  const [rxSearchMode, setRxSearchMode] = useState<'brand' | 'chemical'>('brand');
  const [selectedChemical, setSelectedChemical] = useState<string>('');
  const [chemicalMedicines, setChemicalMedicines] = useState<Medicine[]>([]);

  // Mobile Handwritten Prescription Photo
  const [prescriptionPhoto, setPrescriptionPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Lab Investigation Orders
  const [orderedLabTests, setOrderedLabTests] = useState<{
    test_name: string;
    category: string;
    priority: 'Routine' | 'Urgent' | 'Stat';
    sample_type: string;
    notes: string;
  }[]>([]);
  const [selectedLabTestName, setSelectedLabTestName] = useState<string>('');
  const [customLabTestName, setCustomLabTestName] = useState<string>('');
  const [labPriority, setLabPriority] = useState<'Routine' | 'Urgent' | 'Stat'>('Routine');
  const [labNotes, setLabNotes] = useState<string>('');

  // Doctor Filter for Past Records
  const [pastDoctorFilter, setPastDoctorFilter] = useState<string>('all');

  // Post-Doctor Nursing Procedure Orders (Clean & Dressing, TT, Simple Dressing, etc.)
  const [orderedNursingProcedures, setOrderedNursingProcedures] = useState<{
    procedure_name: string;
    procedure_category: string;
    nurse_id: string;
    nurse_name: string;
    price: number;
    price_type: 'catalog' | 'custom';
    notes: string;
  }[]>([]);
  const [selectedNursingProcId, setSelectedNursingProcId] = useState<string>('proc-clean-dress');
  const [customNursingProcName, setCustomNursingProcName] = useState<string>('');
  const [nursingProcPrice, setNursingProcPrice] = useState<string>('250');
  const [isCustomNursingPrice, setIsCustomNursingPrice] = useState<boolean>(false);
  const [selectedNurseStaff, setSelectedNurseStaff] = useState<{ id: string; name: string }>({
    id: 'staff-ther-001',
    name: 'Anjali Pillai (Staff Nurse / Daycare)',
  });
  const [nursingDoctorNotes, setNursingDoctorNotes] = useState<string>('');
  const [nursingCatalogList, setNursingCatalogList] = useState<any[]>([]);

  const AVAILABLE_NURSES = [
    { id: 'staff-ther-001', name: 'Anjali Pillai (Staff Nurse / Daycare)' },
    { id: 'staff-nurse-002', name: 'Sneha Varma (Staff Nurse - Dressing & Injections)' },
    { id: 'staff-nurse-003', name: 'Kavya Nair (Treatment Room Nurse)' },
  ];

  useEffect(() => {
    nursingApi.catalogue().then((res) => {
      setNursingCatalogList(Array.isArray(res) ? res : []);
    });
  }, []);

  // User & RBAC Scoping
  const user = useAuthStore((s) => s.user);
  const isDoctor = user?.role === 'Doctor';
  const isSuperUser = ['Super Admin', 'Admin', 'Branch Manager'].includes(user?.role || '');

  // Doctor selector for Director / Super Admin view
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>(() => {
    if (isDoctor) return user?.id || '';
    return 'all';
  });

  // Fetch doctors list for Super Admin dropdown
  useEffect(() => {
    if (isSuperUser) {
      mastersApi.doctors().then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setDoctorsList(list);
      });
    }
  }, [isSuperUser]);

  // Doctor Scoping Check: ensures a doctor only sees their own assigned patients
  const matchesDoctorScope = useCallback((a: any) => {
    if (isDoctor) {
      const docId = user?.id;
      const docFullName = (user?.full_name || '').toLowerCase();
      const docName = (user?.name || user?.username || '').toLowerCase();
      const aDocId = a.doctor_id;
      const aDocName = (a.doctor_name || '').toLowerCase();

      // Check ID match
      if (docId && aDocId && docId === aDocId) return true;
      // Check Name match
      if (docFullName && aDocName && (aDocName.includes(docFullName) || docFullName.includes(aDocName))) return true;
      if (docName && aDocName && (aDocName.includes(docName) || docName.includes(aDocName))) return true;
      return false;
    }

    if (selectedDoctorFilter === 'all') return true;
    return a.doctor_id === selectedDoctorFilter || (a.doctor_name && a.doctor_name.toLowerCase().includes(selectedDoctorFilter.toLowerCase()));
  }, [isDoctor, user, selectedDoctorFilter]);

  // Load Queue with strict Doctor Scoping
  useEffect(() => {
    appointmentsApi.queue().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      // Filter waiting, in-consult, or called
      const statusFiltered = list.filter((a: any) => ['In-Consult', 'Waiting', 'Called'].includes(a.status));
      // Apply Doctor Scoping
      const scopedList = statusFiltered.filter(matchesDoctorScope);
      setQueue(scopedList);

      if (apptId) {
        const found = scopedList.find((a: any) => a.id === apptId);
        if (found) {
          loadAppointment(found);
        } else if (list.some((a: any) => a.id === apptId)) {
          // Token exists but is assigned to another doctor
          const otherDoc = list.find((a: any) => a.id === apptId);
          alert(`Access Denied: Token #${otherDoc?.token_no} (${otherDoc?.patient_name}) is assigned to ${otherDoc?.doctor_name || 'another doctor'}. Doctor isolation policy prevents viewing other doctors' consultations.`);
          if (scopedList.length > 0) loadAppointment(scopedList[0]);
        }
      } else if (scopedList.length > 0 && (!selectedAppt || !scopedList.some((a: any) => a.id === selectedAppt.id))) {
        loadAppointment(scopedList[0]);
      }
    });
  }, [apptId, matchesDoctorScope]);

  const loadAppointment = async (appt: Appointment) => {
    if (isDoctor && !matchesDoctorScope(appt)) {
      alert(`Access Denied: Patient is assigned to ${appt.doctor_name}. You can only consult your assigned patients.`);
      return;
    }
    setSelectedAppt(appt);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowQueueSidebar(false);
    }
    try {
      const pRes = await patientsApi.get(appt.patient_id);
      const pat = pRes?.data || pRes;
      setPatient(pat);

      // Load full patient medical history & prescriptions
      const hRes = await patientsApi.history(appt.patient_id);
      const historyData = hRes?.data || hRes || {};
      const pastConsults = Array.isArray(historyData) ? historyData : (historyData.consultations || []);
      const pastRx = historyData.prescriptions || [];
      setPatientHistory(pastConsults);
      setPatientPrescriptions(pastRx);
      setPatientNursingProcs(historyData.nursing_procedures || []);
      setPatientLabOrders(historyData.lab_orders || []);

      // If this appointment was already consulted, load existing consultation notes & Rx
      const existingConsult = pastConsults.find((c: any) => c.appointment_id === appt.id);
      if (existingConsult) {
        setVitals({
          bp_systolic: existingConsult.bp_systolic ? String(existingConsult.bp_systolic) : '',
          bp_diastolic: existingConsult.bp_diastolic ? String(existingConsult.bp_diastolic) : '',
          pulse_rate: existingConsult.pulse_rate ? String(existingConsult.pulse_rate) : '',
          temperature_f: existingConsult.temperature_f ? String(existingConsult.temperature_f) : '',
          spo2_percent: existingConsult.spo2_percent ? String(existingConsult.spo2_percent) : '',
          weight_kg: existingConsult.weight_kg ? String(existingConsult.weight_kg) : '',
          height_cm: existingConsult.height_cm ? String(existingConsult.height_cm) : '',
        });
        setClinical({
          known_conditions: existingConsult.known_conditions || '',
          chief_complaints: existingConsult.chief_complaints || appt.purpose || '',
          complaint_duration: existingConsult.complaint_duration || '',
          skin_type: existingConsult.skin_type || 'Normal',
          examination_notes: existingConsult.examination_notes || '',
          diagnosis: existingConsult.diagnosis || '',
          treatment_plan: existingConsult.treatment_plan || '',
          doctor_private_notes: existingConsult.doctor_private_notes || '',
          review_after_days: existingConsult.review_after_days ? String(existingConsult.review_after_days) : '7',
          review_instructions: existingConsult.review_instructions || '',
        });
        const matchedRx = pastRx.find((p: any) => p.consultation_id === existingConsult.id) || existingConsult.prescription;
        if (matchedRx?.items && Array.isArray(matchedRx.items)) {
          setRxList(matchedRx.items);
        }
        if (existingConsult.prescription_photo) {
          setPrescriptionPhoto(existingConsult.prescription_photo);
        } else {
          setPrescriptionPhoto(null);
        }
      } else {
        // Reset consultation inputs for new consultation
        setVitals({
          bp_systolic: '',
          bp_diastolic: '',
          pulse_rate: '',
          temperature_f: '',
          spo2_percent: '',
          weight_kg: '',
          height_cm: '',
        });
        setClinical({
          known_conditions: pat.known_conditions || '',
          chief_complaints: appt.purpose || '',
          complaint_duration: '',
          skin_type: 'Normal',
          examination_notes: '',
          diagnosis: '',
          treatment_plan: '',
          doctor_private_notes: '',
          review_after_days: '7',
          review_instructions: '',
        });
        setRxList([]);
        setPrescriptionPhoto(null);
        setOrderedLabTests([]);
        setOrderedNursingProcedures([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Medicine search with exclusion of already added medicines
  const handleMedSearch = async (val: string) => {
    setMedQuery(val);
    if (val.trim().length >= 1) {
      try {
        const res = await medicinesApi.search(val);
        const list = Array.isArray(res) ? res : (res?.data || []);
        // Filter out medicines already in rxList
        const filtered = list.filter(
          (m: any) =>
            !rxList.some(
              (rx) =>
                (rx.medicine_id && rx.medicine_id === m.id) ||
                rx.medicine_name.toLowerCase().startsWith(m.name.toLowerCase())
            )
        );
        setMedSuggestions(filtered);
      } catch {
        setMedSuggestions([]);
      }
    } else {
      setMedSuggestions([]);
    }
  };

  const addMedicine = (m: Medicine) => {
    const defaultFreq = m.default_frequency || '1-0-1';
    const defaultDays = 5;
    const autoQty = calculateAutoQuantity(defaultFreq, defaultDays);
    setRxList((prev) => [
      ...prev,
      {
        medicine_id: m.id,
        medicine_name: `${m.name} ${m.strength ? `(${m.strength})` : ''}`.trim(),
        dosage: m.default_dosage || '1 Tab',
        frequency: defaultFreq,
        timing: m.default_timing || 'After Food',
        duration_days: defaultDays,
        quantity: autoQty,
        special_instructions: '',
      },
    ]);
    setMedQuery('');
    setMedSuggestions([]);
  };

  const addCustomMedicine = () => {
    if (!medQuery.trim()) return;
    const defaultFreq = '1-0-1';
    const defaultDays = 5;
    const autoQty = calculateAutoQuantity(defaultFreq, defaultDays);
    setRxList((prev) => [
      ...prev,
      {
        medicine_name: medQuery.trim(),
        dosage: '1 Tab',
        frequency: defaultFreq,
        timing: 'After Food',
        duration_days: defaultDays,
        quantity: autoQty,
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
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: val };
        // Auto recalculate quantity when frequency or duration changes
        if (field === 'frequency' || field === 'duration_days') {
          const freq = field === 'frequency' ? String(val) : item.frequency;
          const days = field === 'duration_days' ? (parseInt(val) || 1) : item.duration_days;
          updated.quantity = calculateAutoQuantity(freq, days);
        }
        return updated;
      })
    );
  };

  const handleSelectChemical = async (chem: string) => {
    setSelectedChemical(chem);
    if (!chem) {
      setChemicalMedicines([]);
      return;
    }
    try {
      const res = await medicinesApi.search(chem);
      const list = Array.isArray(res) ? res : (res?.data || []);
      const matching = list.filter((m: any) =>
        (m.generic_name || '').toLowerCase().includes(chem.toLowerCase()) ||
        (m.name || '').toLowerCase().includes(chem.toLowerCase())
      );
      const available = matching.filter(
        (m: any) =>
          !rxList.some(
            (rx) =>
              (rx.medicine_id && rx.medicine_id === m.id) ||
              rx.medicine_name.toLowerCase().startsWith(m.name.toLowerCase())
          )
      );
      setChemicalMedicines(available);
    } catch {
      setChemicalMedicines([]);
    }
  };

  const handleAddLabTest = () => {
    const testName = (customLabTestName.trim() || selectedLabTestName).trim();
    if (!testName) {
      alert('Please select or type a diagnostic test name');
      return;
    }
    const matchedCommon = COMMON_LAB_TESTS.find((t) => t.name === testName);
    const newTest = {
      test_name: testName,
      category: matchedCommon?.category || 'Clinical Pathology',
      priority: labPriority,
      sample_type: matchedCommon?.sample || 'Blood / Clinical Sample',
      notes: labNotes.trim(),
    };
    setOrderedLabTests((prev) => [...prev, newTest]);
    setSelectedLabTestName('');
    setCustomLabTestName('');
    setLabNotes('');
  };

  const handleRemoveLabTest = (idx: number) => {
    setOrderedLabTests((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSelectNursingProc = (procId: string) => {
    setSelectedNursingProcId(procId);
    if (procId === 'custom') {
      setNursingProcPrice('200');
      setIsCustomNursingPrice(true);
      return;
    }
    const found = nursingCatalogList.find((p) => p.id === procId);
    if (found) {
      setNursingProcPrice(String(found.default_price));
      setIsCustomNursingPrice(false);
      setCustomNursingProcName('');
    }
  };

  const handleAddNursingProcedure = () => {
    const isCustom = selectedNursingProcId === 'custom' || customNursingProcName.trim().length > 0;
    const found = nursingCatalogList.find((p) => p.id === selectedNursingProcId);
    const procName = isCustom ? customNursingProcName.trim() : (found?.name || 'Clean & Dressing');
    if (!procName) {
      alert('Please specify nursing procedure name');
      return;
    }
    const priceNum = parseFloat(nursingProcPrice) || 0;
    const newProc = {
      procedure_name: procName,
      procedure_category: found?.category || 'Wound Care / Procedure',
      nurse_id: selectedNurseStaff.id,
      nurse_name: selectedNurseStaff.name.split('(')[0].trim(),
      price: priceNum,
      price_type: (isCustomNursingPrice || isCustom ? 'custom' : 'catalog') as 'catalog' | 'custom',
      notes: nursingDoctorNotes.trim(),
    };
    setOrderedNursingProcedures((prev) => [...prev, newProc]);
    setNursingDoctorNotes('');
    setCustomNursingProcName('');
  };

  const handleRemoveNursingProcedure = (idx: number) => {
    setOrderedNursingProcedures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePrescriptionPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        prescription_photo: prescriptionPhoto || null,
        prescription_photo_label: prescriptionPhoto ? 'PRESCRIOTION / photo taken from mobile' : null,
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

      // Save ordered lab investigations if any
      if (orderedLabTests.length > 0) {
        for (const test of orderedLabTests) {
          await labApi.create({
            patient_id: patient.id,
            patient_name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
            op_no: patient.op_no,
            phone: patient.phone,
            doctor_id: selectedAppt.doctor_id,
            doctor_name: selectedAppt.doctor_name || user?.full_name || 'Dr. Ananya Nair',
            test_name: test.test_name,
            category: test.category,
            priority: test.priority,
            sample_type: test.sample_type,
            notes: test.notes,
          });
        }
      }

      // Save ordered nursing procedures (Clean & dressing, TT, etc. sent to Nurse Station)
      if (orderedNursingProcedures.length > 0) {
        for (const np of orderedNursingProcedures) {
          await nursingApi.create({
            patient_id: patient.id,
            patient_name: `${patient.first_name} ${patient.last_name || ''}`.trim(),
            op_no: patient.op_no,
            phone: patient.phone,
            doctor_id: selectedAppt.doctor_id,
            doctor_name: selectedAppt.doctor_name || user?.full_name || 'Dr. Ananya Nair',
            referred_by: 'Doctor',
            procedure_name: np.procedure_name,
            procedure_category: np.procedure_category,
            nurse_id: np.nurse_id,
            nurse_name: np.nurse_name,
            price: np.price,
            price_type: np.price_type,
            notes: np.notes,
            status: 'Referred',
            vitals: {
              bp_systolic: vitals.bp_systolic,
              bp_diastolic: vitals.bp_diastolic,
              pulse_rate: vitals.pulse_rate,
              temperature_f: vitals.temperature_f,
              spo2_percent: vitals.spo2_percent,
              weight_kg: vitals.weight_kg,
            },
          });
        }
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
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-4rem)] overflow-hidden w-full">
      {/* Mobile/Tablet Queue Toggle Bar */}
      <div className="lg:hidden p-2.5 bg-[#FAF8F5] border-b border-[#EDE6DD] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => setShowQueueSidebar(!showQueueSidebar)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#EDE6DD] text-[#3B312A] shadow-2xs"
        >
          <Users className="w-3.5 h-3.5 text-[#965F36]" />
          <span>{showQueueSidebar ? 'Hide Queue' : `View Queue (${queue.length})`}</span>
        </button>
        {selectedAppt && (
          <div className="text-right">
            <span className="text-xs font-bold text-[#1E1B18] block truncate max-w-[180px]">
              {selectedAppt.patient_name}
            </span>
            <span className="text-[10px] font-mono text-[#965F36] font-bold">
              Token #{selectedAppt.token_no}
            </span>
          </div>
        )}
      </div>

      {/* LEFT: Patients In Queue (Responsive on Mobile, Tablet, Laptop & TV) */}
      <div
        className={`${showQueueSidebar ? 'flex' : 'hidden lg:flex'
          } w-full lg:w-80 border-r border-slate-200 bg-slate-50 flex-col shrink-0 max-h-[45vh] lg:max-h-none`}
      >
        {/* Isolation / Scoping Banner */}
        {isDoctor ? (
          <div className="p-3 bg-[#2D1B13] text-[#FAF7F2] border-b border-[#3D281E]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FAAE5A]">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>My Consultation Queue</span>
            </div>
            <div className="font-bold text-sm text-white truncate mt-0.5">
              {user?.full_name || user?.name || 'Assigned Doctor'}
            </div>
            <div className="text-[10px] text-[#C4B3A3] flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Doctor Isolation Active · {queue.length} My Patient{queue.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        ) : isSuperUser ? (
          <div className="p-3 bg-[#F4ECE3] border-b border-[#E0D3C5]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-[#685B52] uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#965F36]" />
                <span>Doctor Oversight Filter</span>
              </label>
              <span className="text-[10px] font-bold bg-[#965F36] text-white px-1.5 py-0.2 rounded">
                {queue.length}
              </span>
            </div>
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="w-full text-xs bg-white border border-[#D5C6B7] rounded-lg px-2.5 py-1.5 font-medium text-[#1E1B18] focus:outline-none focus:ring-1 focus:ring-[#965F36]"
            >
              <option value="all">All Doctors (Clinic Overview)</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} ({doc.specialisation || 'Doctor'})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Today's Consultation Queue</span>
              <span className="text-xs bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded-full">
                {queue.length}
              </span>
            </h2>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {queue.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {isDoctor
                ? 'No patients waiting in your consultation queue.'
                : 'No patients waiting for consultation.'}
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
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-violet-700 text-sm">
                      #{item.token_no}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {item.patient_name || 'Patient'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.op_no}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {item.purpose || item.visit_type}
                  </div>
                  <div className="text-[11px] text-[#965F36] font-medium mt-1 flex items-center gap-1">
                    <span>🩺</span>
                    <span className="truncate">{item.doctor_name || 'Consulting Doctor'}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
                  {item.status}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Doctor EMR Workbench */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-3 sm:p-5 md:p-6 2xl:p-8 3xl:p-10 space-y-6 w-full">
        {!selectedAppt || !patient ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <Stethoscope className="w-16 h-16 stroke-1 mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No Patient Selected</p>
            <p className="text-xs text-slate-400 mt-1">Select a token from the left queue to open consultation</p>
          </div>
        ) : (
          <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto space-y-6">
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
                {patientHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPastHistory(!showPastHistory)}
                    className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
                    title="View Previous Consultations & Prescriptions for this patient"
                  >
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    <span>Past Records ({patientHistory.length})</span>
                    {showPastHistory ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                  </button>
                )}
                {rxList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowRxModal(true)}
                    className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Preview & Print Rx
                  </button>
                )}
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

            {/* Expandable Past Medical Records & Prescriptions Panel */}
            {showPastHistory && (
              <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-amber-200/80 pb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Previous Consultations & Prescriptions ({patientHistory.length} Past Visits)
                    </h3>
                  </div>
                  {/* Doctor Filter for Past Records */}
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-amber-700" />
                      <span>Filter by Doctor:</span>
                    </label>
                    <select
                      value={pastDoctorFilter}
                      onChange={(e) => setPastDoctorFilter(e.target.value)}
                      className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none"
                    >
                      <option value="all">All Doctors ({patientHistory.length} visits)</option>
                      {Array.from(new Set(patientHistory.map((p) => p.doctor_name || 'Dr. Ananya Nair'))).map((docName: any) => (
                        <option key={docName} value={docName}>
                          {docName} ({patientHistory.filter((p) => (p.doctor_name || 'Dr. Ananya Nair') === docName).length} visits)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {patientHistory
                    .filter((past: any) => {
                      if (pastDoctorFilter === 'all') return true;
                      const doc = past.doctor_name || 'Dr. Ananya Nair';
                      return doc === pastDoctorFilter || doc.toLowerCase().includes(pastDoctorFilter.toLowerCase());
                    })
                    .map((past: any, idx: number) => {
                      const pastRxObj = patientPrescriptions.find((p: any) => p.consultation_id === past.id) || past.prescription;
                      return (
                        <div key={past.id || idx} className="bg-white rounded-lg border border-amber-200 p-3.5 shadow-2xs space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-1.5 border-b border-slate-100 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5 text-violet-600" />
                                {formatDate(past.consult_date || past.created_at)}
                              </span>
                              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                                <span>🩺</span>
                                <span>{past.doctor_name || 'Dr. Ananya Nair'}</span>
                              </span>
                              {past.diagnosis && (
                                <span className="bg-violet-100 text-violet-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                                  {past.diagnosis}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              BP: {past.bp_systolic || '-'}/{past.bp_diastolic || '-'} mmHg · Pulse: {past.pulse_rate || '-'} · Wt: {past.weight_kg ? `${past.weight_kg}kg` : '-'}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700">
                            <div>
                              <span className="font-semibold text-slate-500 block">Chief Complaints & Exam:</span>
                              <p className="text-slate-800 mt-0.5">{past.chief_complaints || '-'}</p>
                              {past.examination_notes && (
                                <p className="text-slate-600 italic mt-0.5">Exam: {past.examination_notes}</p>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500 block">Treatment / Procedure Done:</span>
                              <p className="text-slate-800 mt-0.5">{past.treatment_plan || '-'}</p>
                            </div>
                          </div>

                          {/* Mobile Handwritten Prescription Photo in Past Record */}
                          {past.prescription_photo && (
                            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Camera className="w-4 h-4 text-amber-700 shrink-0" />
                                <div>
                                  <span className="font-bold text-amber-900 text-xs">PRESCRIOTION / photo taken from mobile</span>
                                  <p className="text-[10px] text-amber-700">Handwritten doctor Rx captured directly from phone/tablet</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPrescriptionPhoto(past.prescription_photo);
                                  setShowPhotoModal(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 px-2.5 py-1 rounded font-semibold transition"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700" />
                                View Rx Photo
                              </button>
                            </div>
                          )}

                          {/* Prescribed Medicines in that visit */}
                          {pastRxObj?.items && pastRxObj.items.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-violet-700 flex items-center gap-1">
                                  <Pill className="w-3 h-3" />
                                  Prescribed Medicines ({pastRxObj.items.length}):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRxList((prev) => [...prev, ...pastRxObj.items]);
                                    alert(`Copied ${pastRxObj.items.length} medicines into today's prescription builder!`);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-0.5 rounded border border-violet-200 transition"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                  Copy into Today's Rx
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {pastRxObj.items.map((med: any, mIdx: number) => (
                                  <span key={mIdx} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[11px] text-slate-800 font-medium">
                                    <strong>{med.medicine_name}</strong> · {med.dosage} ({med.frequency}) · {med.duration_days}d
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Nursing Care & Procedures on this Date */}
                          {(() => {
                            const dateStr = (past.consult_date || past.created_at || '').split('T')[0];
                            const procsOnDate = patientNursingProcs.filter((np: any) => (np.date || np.created_at || '').startsWith(dateStr));
                            if (procsOnDate.length === 0) return null;
                            return (
                              <div className="pt-2 border-t border-slate-100 space-y-1">
                                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                  <span>💉</span> Nursing Procedures on this Date ({procsOnDate.length}):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {procsOnDate.map((np: any, npIdx: number) => (
                                    <span key={npIdx} className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] text-emerald-900 font-medium">
                                      <strong>{np.procedure_name}</strong> (Nurse: {np.nurse_name}) · ₹{np.price}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Diagnostic Lab Tests on this Date */}
                          {(() => {
                            const dateStr = (past.consult_date || past.created_at || '').split('T')[0];
                            const labsOnDate = patientLabOrders.filter((lo: any) => (lo.order_date || '').startsWith(dateStr));
                            if (labsOnDate.length === 0) return null;
                            return (
                              <div className="pt-2 border-t border-slate-100 space-y-1">
                                <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1">
                                  <span>🧪</span> Diagnostic Lab Tests on this Date ({labsOnDate.length}):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {labsOnDate.map((lo: any, lIdx: number) => (
                                    <span key={lIdx} className="bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[11px] text-sky-900 font-medium">
                                      <strong>{lo.test_name}</strong> ({lo.status})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-violet-600" />
                    Prescription Writer (Rx)
                  </h3>
                  <span className="text-xs text-slate-400">· Printed on clinic letterhead</span>
                </div>

                {/* Mode Toggle: Brand vs Chemical Component */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRxSearchMode('brand')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1',
                      rxSearchMode === 'brand' ? 'bg-white text-violet-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Search className="w-3 h-3" />
                    <span>Search Brand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxSearchMode('chemical')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1',
                      rxSearchMode === 'chemical' ? 'bg-violet-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>By Chemical Component</span>
                  </button>
                </div>
              </div>

              {/* BRAND SEARCH MODE */}
              {rxSearchMode === 'brand' && (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search medicine master (e.g. Doxycycline, Sunscreen SPF 50, Azelaic Acid)..."
                        value={medQuery}
                        onChange={(e) => handleMedSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>
                    {medQuery.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={addCustomMedicine}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
                      >
                        + Add Custom Rx
                      </button>
                    )}
                  </div>

                  {/* Suggestions Dropdown with TOP Custom Item & Filtered Catalog */}
                  {(medQuery.trim().length > 0 || medSuggestions.length > 0) && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {/* TOP: Custom Medicine Entry (Not saved to DB catalog) */}
                      {medQuery.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={addCustomMedicine}
                          className="w-full text-left p-2.5 bg-violet-50/70 hover:bg-violet-100 text-xs flex items-center justify-between text-violet-900 font-semibold transition"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5 text-violet-700" />
                            <span>Use Custom Medicine: <span className="underline decoration-violet-400 font-bold">"{medQuery.trim()}"</span></span>
                          </div>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded text-violet-700 border border-violet-200 font-normal">
                            Free-text Rx (Not saved to DB)
                          </span>
                        </button>
                      )}

                      {/* Filtered Catalog Suggestions */}
                      {medSuggestions.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMedicine(m)}
                          className="w-full text-left p-2.5 hover:bg-slate-50 text-xs flex items-center justify-between transition"
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
              )}

              {/* CHEMICAL COMPONENT / GENERIC FAMILY SELECTOR */}
              {rxSearchMode === 'chemical' && (
                <div className="p-3.5 bg-violet-50/60 rounded-xl border border-violet-200 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-900 block mb-1.5">
                      Select Active Chemical Component / Molecule Family:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {CHEMICAL_FAMILIES.map((chem) => (
                        <button
                          key={chem}
                          type="button"
                          onClick={() => handleSelectChemical(chem)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-xs font-semibold transition',
                            selectedChemical === chem
                              ? 'bg-violet-700 text-white shadow-2xs'
                              : 'bg-white border border-violet-200 text-violet-800 hover:bg-violet-100'
                          )}
                        >
                          🧪 {chem}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Matching Brands under selected chemical molecule */}
                  {selectedChemical && (
                    <div className="pt-2 border-t border-violet-200/70">
                      <span className="text-xs font-semibold text-violet-900 block mb-2">
                        Available Brand Formulations for <strong>{selectedChemical}</strong>:
                      </span>
                      {chemicalMedicines.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          All available brands of {selectedChemical} are already added to today's prescription, or catalog needs stock.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {chemicalMedicines.map((m) => (
                            <div
                              key={m.id}
                              className="bg-white p-2.5 rounded-lg border border-violet-200 shadow-2xs flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{m.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  {m.strength} · {m.dosage_form} ({m.generic_name})
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => addMedicine(m)}
                                className="bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Rx Table with Auto-Calculated Quantity */}
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
                        <th className="py-2.5 px-3">Qty (Auto)</th>
                        <th className="py-2.5 px-3">Instructions</th>
                        <th className="py-2.5 px-3 text-right">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rxList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {item.medicine_name}
                            {!item.medicine_id && (
                              <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-normal">
                                Custom
                              </span>
                            )}
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
                              className="border border-slate-300 rounded px-1.5 py-1 text-xs bg-white font-medium text-slate-800"
                            >
                              <option value="1-0-1">1-0-1 (BD - Twice daily)</option>
                              <option value="1-0-0">1-0-0 (Morning)</option>
                              <option value="0-0-1">0-0-1 (Night)</option>
                              <option value="1-1-1">1-1-1 (TDS - 3 times)</option>
                              <option value="1-1-1-1">1-1-1-1 (QID - 4 times)</option>
                              <option value="1 x 1">1 x 1 (Once daily)</option>
                              <option value="1 x 2">1 x 2 (Twice daily)</option>
                              <option value="1 x 3">1 x 3 (Thrice daily)</option>
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
                              className="w-14 border border-slate-300 rounded px-2 py-1 text-xs text-center font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateRxItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-16 border border-violet-300 bg-violet-50/50 rounded px-2 py-1 text-xs text-center font-bold text-violet-800"
                              />
                              <span className="text-[9px] text-violet-600 block text-center font-medium mt-0.5">auto count</span>
                            </div>
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

            {/* HANDWRITTEN PRESCRIPTION MOBILE PHOTO UPLOAD */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Handwritten Prescription Capture (Mobile Camera / Photo)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">For handwritten paper prescriptions</span>
              </div>

              {prescriptionPhoto ? (
                <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={prescriptionPhoto}
                      alt="Handwritten Rx"
                      className="w-14 h-14 object-cover rounded-lg border border-violet-300 shadow-2xs"
                    />
                    <div>
                      <span className="text-xs font-bold text-violet-900 block">
                        PRESCRIOTION / photo taken from mobile
                      </span>
                      <p className="text-[11px] text-violet-700 mt-0.5">
                        Attached to patient consultation file and history
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 border border-violet-300 text-violet-800 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrescriptionPhoto(null)}
                      className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition">
                    <Camera className="w-4 h-4 text-violet-600" />
                    <span>Take Photo / Upload Mobile Rx</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePrescriptionPhotoChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    Snap paper prescription with mobile camera or upload saved image
                  </span>
                </div>
              )}
            </div>

            {/* DIAGNOSTIC & LAB TEST ORDERS */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Diagnostic & Lab Test Orders
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Orders route directly to clinic diagnostic lab</span>
              </div>

              {/* Add Test Form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Choose Standard Test or Enter Custom
                  </label>
                  <select
                    value={selectedLabTestName}
                    onChange={(e) => {
                      setSelectedLabTestName(e.target.value);
                      if (e.target.value) setCustomLabTestName('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none mb-1.5"
                  >
                    <option value="">-- Choose from standard clinic investigations --</option>
                    {COMMON_LAB_TESTS.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom test name (e.g. Patch test allergens)..."
                    value={customLabTestName}
                    onChange={(e) => {
                      setCustomLabTestName(e.target.value);
                      if (e.target.value) setSelectedLabTestName('');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={labPriority}
                    onChange={(e) => setLabPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Stat">Stat / Immediate</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Clinical notes / indication..."
                    value={labNotes}
                    onChange={(e) => setLabNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none mt-1.5"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddLabTest}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-3 rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Order Test</span>
                  </button>
                </div>
              </div>

              {/* Ordered Tests Table */}
              {orderedLabTests.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Investigation Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Sample Type</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Doctor Notes</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderedLabTests.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{t.test_name}</td>
                          <td className="py-2 px-3 text-slate-600">{t.category}</td>
                          <td className="py-2 px-3 text-slate-600">{t.sample_type}</td>
                          <td className="py-2 px-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                t.priority === 'Stat'
                                  ? 'bg-rose-100 text-rose-800'
                                  : t.priority === 'Urgent'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 italic">{t.notes || '-'}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLabTest(idx)}
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

            {/* NURSING PROCEDURES & WOUND CARE ORDERS (POST-DOCTOR REFERRAL) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Nursing Procedures & Minor Care Orders (Post-Doctor Referral)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Clean & Dressing, TT injection, suture care — routed directly to Nurse Desk
                </span>
              </div>

              {/* Add Nursing Procedure Form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Choose Procedure (Dropdown or Custom)
                  </label>
                  <select
                    value={selectedNursingProcId}
                    onChange={(e) => handleSelectNursingProc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none mb-1.5 font-medium text-slate-800"
                  >
                    {nursingCatalogList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Standard ₹{p.default_price} ({p.category})
                      </option>
                    ))}
                    <option value="custom">✏️ Enter Custom Procedure Name & Custom Price...</option>
                  </select>

                  {selectedNursingProcId === 'custom' && (
                    <input
                      type="text"
                      placeholder="Type custom nursing procedure (e.g. Abscess dressing with iodoform pack)..."
                      value={customNursingProcName}
                      onChange={(e) => setCustomNursingProcName(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  )}

                  <input
                    type="text"
                    placeholder="Doctor's clinical instructions for nurse (e.g. Clean with normal saline, apply betadine gauze)..."
                    value={nursingDoctorNotes}
                    onChange={(e) => setNursingDoctorNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none mt-1.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Procedure Charge (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={nursingProcPrice}
                      onChange={(e) => {
                        setNursingProcPrice(e.target.value);
                        setIsCustomNursingPrice(true);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    {isCustomNursingPrice && (
                      <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                        ✓ Custom Price Applied
                      </span>
                    )}
                  </div>

                  <label className="block text-[11px] font-semibold text-slate-600 mt-2 mb-1">
                    Assign to Nurse
                  </label>
                  <select
                    value={selectedNurseStaff.id}
                    onChange={(e) => {
                      const nurse = AVAILABLE_NURSES.find((n) => n.id === e.target.value) || AVAILABLE_NURSES[0];
                      setSelectedNurseStaff(nurse);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    {AVAILABLE_NURSES.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddNursingProcedure}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Order Procedure</span>
                  </button>
                </div>
              </div>

              {/* Ordered Nursing Procedures Table */}
              {orderedNursingProcedures.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Procedure Name</th>
                        <th className="py-2.5 px-3">Assigned Nurse</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3">Doctor Instructions</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderedNursingProcedures.map((np, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {np.procedure_name}
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {np.procedure_category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-emerald-800 font-semibold">
                            🩺 {np.nurse_name}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            ₹{np.price}
                            {np.price_type === 'custom' && (
                              <span className="block text-[9px] text-amber-700 font-normal">custom</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 italic">
                            {np.notes || 'As per clinic protocol'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveNursingProcedure(idx)}
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

            {/* PRESCRIPTION PRINT PREVIEW MODAL */}
            {showRxModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
                    <h2 className="text-sm font-bold text-slate-800">Prescription Slip (Rx) Preview</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Prescription
                      </button>
                      <button
                        onClick={() => setShowRxModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* CLINIC LETTERHEAD */}
                  <div className="text-center pb-3 border-b-2 border-slate-900">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">HEAL CLINIC & AESTHETIC CARE</h1>
                    <p className="text-xs text-slate-600 font-medium">Way to Markaz, Karanthoor, Calicut, Kerala · Ph: 0495-2720000</p>
                    <p className="text-[11px] text-slate-500">Reg No: KL-MED-84920 · Email: info@healclinic.in</p>
                  </div>

                  {/* DOCTOR & PATIENT HEADER */}
                  <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedAppt?.doctor_name || 'Dr. Ananya Nair'}</p>
                      <p className="text-slate-500">{selectedAppt?.department_name || 'Consultant Dermatologist'}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="font-semibold text-slate-900">{patient?.first_name} {patient?.last_name || ''}</p>
                      <p className="text-slate-500 font-mono">OP: {patient?.op_no} · {patient?.gender}, {patient?.age_years ? `${patient?.age_years}y` : ''}</p>
                      <p className="text-slate-400">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* VITALS & DIAGNOSIS SUMMARY */}
                  <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-700">
                    {clinical.diagnosis && (
                      <p><strong>Clinical Diagnosis:</strong> {clinical.diagnosis}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      {vitals.bp_systolic && <span>BP: {vitals.bp_systolic}/{vitals.bp_diastolic} mmHg</span>}
                      {vitals.pulse_rate && <span>Pulse: {vitals.pulse_rate} bpm</span>}
                      {vitals.weight_kg && <span>Wt: {vitals.weight_kg} kg</span>}
                      {bmi !== '-' && <span>BMI: {bmi}</span>}
                      {patient?.known_allergies && <span className="text-rose-600 font-bold">⚠️ Allergy: {patient.known_allergies}</span>}
                    </div>
                  </div>

                  {/* RX MEDICINES LIST */}
                  {rxList.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-black text-violet-700 tracking-wider font-serif">℞ (Prescription)</p>
                      <table className="w-full text-left text-xs border border-slate-200">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Medicine / Formulation</th>
                            <th className="py-2 px-3">Dosage</th>
                            <th className="py-2 px-3">Frequency</th>
                            <th className="py-2 px-3">Timing</th>
                            <th className="py-2 px-3 text-center">Days</th>
                            <th className="py-2 px-3 text-center">Qty</th>
                            <th className="py-2 px-3">Special Advice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rxList.map((item, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{item.medicine_name}</td>
                              <td className="py-2 px-3">{item.dosage}</td>
                              <td className="py-2 px-3 font-mono font-bold text-violet-700">{item.frequency}</td>
                              <td className="py-2 px-3 text-slate-600">{item.timing}</td>
                              <td className="py-2 px-3 text-center">{item.duration_days}d</td>
                              <td className="py-2 px-3 text-center font-bold text-violet-800">{item.quantity}</td>
                              <td className="py-2 px-3 text-slate-500 italic">{item.special_instructions || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ORDERED LAB INVESTIGATIONS */}
                  {orderedLabTests.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <p className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-violet-600" />
                        Diagnostic Investigations Advised:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {orderedLabTests.map((t, idx) => (
                          <span key={idx} className="bg-violet-50 border border-violet-200 text-violet-900 px-2.5 py-1 rounded text-xs font-medium">
                            {t.test_name} ({t.priority})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ORDERED NURSING PROCEDURES */}
                  {orderedNursingProcedures.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <p className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        Nursing & Minor Procedures Advised (Nurse Station):
                      </p>
                      <div className="space-y-1.5">
                        {orderedNursingProcedures.map((np, idx) => (
                          <div key={idx} className="p-2 bg-emerald-50/60 rounded border border-emerald-200 text-xs flex items-center justify-between">
                            <div>
                              <span className="font-bold text-emerald-950">{np.procedure_name}</span>
                              {np.notes && <p className="text-[11px] text-emerald-800 italic">{np.notes}</p>}
                            </div>
                            <span className="font-semibold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                              Nurse: {np.nurse_name} · ₹{np.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ATTACHED HANDWRITTEN RX PHOTO */}
                  {prescriptionPhoto && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs font-bold text-violet-800 mb-1 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        PRESCRIOTION / photo taken from mobile:
                      </p>
                      <img
                        src={prescriptionPhoto}
                        alt="Handwritten prescription photo"
                        className="max-h-48 rounded border border-slate-300 object-contain"
                      />
                    </div>
                  )}

                  {/* ADVICE & REVIEW */}
                  <div className="text-xs space-y-1 pt-2 border-t border-slate-200">
                    {clinical.review_instructions && (
                      <p><strong>General Advice:</strong> {clinical.review_instructions}</p>
                    )}
                    {reviewDateStr && (
                      <p><strong>Next Review Follow-Up:</strong> {reviewDateStr} ({clinical.review_after_days} days)</p>
                    )}
                  </div>

                  {/* DOCTOR SIGNATURE */}
                  <div className="pt-6 flex justify-end text-right text-xs">
                    <div>
                      <div className="h-10 border-b border-slate-400 w-36 mb-1"></div>
                      <p className="font-bold text-slate-800">{selectedAppt?.doctor_name || 'Consulting Doctor'}</p>
                      <p className="text-[10px] text-slate-400">Authorized Medical Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FULL PHOTO VIEW MODAL */}
            {showPhotoModal && prescriptionPhoto && (
              <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-violet-600" />
                      <h3 className="font-bold text-slate-800 text-sm">
                        PRESCRIOTION / photo taken from mobile
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowPhotoModal(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-lg p-2">
                    <img
                      src={prescriptionPhoto}
                      alt="Handwritten doctor prescription"
                      className="max-w-full h-auto rounded shadow-sm"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowPhotoModal(false)}
                      className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
