import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserCheck,
  UserPlus,
  Ticket,
  Printer,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  RotateCcw,
  Sparkles,
  User,
  Phone,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';
import { patientsApi, appointmentsApi, mastersApi } from '@/api';
import type { Staff, Department, Patient } from '@/types';

export default function PatientRegisterPage() {
  const navigate = useNavigate();

  // Search State (Step 1: Search Patient ID / Mobile / Name)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Selected Patient (Existing vs New)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Registration / Visit Form State (Step 2 & 3)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    alt_phone: '',
    email: '',
    date_of_birth: '',
    age_years: '',
    gender: 'Female',
    blood_group: '',
    relative_name: '',
    relation_type: 'S/o',
    address: '',
    city: 'Kozhikode',
    district: 'Kozhikode',
    pincode: '',
    consultation_type: 'Aesthetic',
    known_allergies: '',
  });

  // Duplicate warning & linked phone records
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [linkedPhonePatients, setLinkedPhonePatients] = useState<Patient[]>([]);

  // Doctors & Departments (Step 4: Select Doctor)
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Staff | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Visit Specific Attributes (Strictly isolated from Doctor master profile)
  const [visitType, setVisitType] = useState('Walk-in');
  const [purpose, setPurpose] = useState('');
  const [roomNo, setRoomNo] = useState('Room 101');
  const [priority, setPriority] = useState('Normal');

  // Submission & Result States
  const [loading, setLoading] = useState(false);
  const [issuedToken, setIssuedToken] = useState<any | null>(null);

  // Load Doctors and Departments
  useEffect(() => {
    mastersApi.doctors().then((res) => {
      const list: Staff[] = Array.isArray(res) ? res : (res?.data || []);
      setDoctors(list);
      if (list.length > 0) {
        setSelectedDoctorId(list[0].id);
        setSelectedDoctor(list[0]);
        if (list[0].department_id) setSelectedDeptId(list[0].department_id);
      }
    }).catch(() => { });

    mastersApi.departments().then((res) => {
      const list: Department[] = Array.isArray(res) ? res : (res?.data || []);
      setDepartments(list);
    }).catch(() => { });
  }, []);

  // Sync selected doctor object when doctor ID changes
  useEffect(() => {
    if (selectedDoctorId) {
      const doc = doctors.find((d) => d.id === selectedDoctorId) || null;
      setSelectedDoctor(doc);
      if (doc?.department_id) {
        setSelectedDeptId(doc.department_id);
      }
    }
  }, [selectedDoctorId, doctors]);

  // Handle Search Input (Patient ID / Mobile / Name)
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const res = await patientsApi.search(val.trim());
        const list = Array.isArray(res) ? res : (res?.data || []);
        setSearchResults(list);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select Existing Patient: Retrieve profile & auto-populate
  const handleSelectExistingPatient = (p: Patient) => {
    setSelectedPatient(p);
    setShowDropdown(false);
    setSearchQuery(`${p.op_no} — ${p.first_name} ${p.last_name || ''}`.trim());
    setPhoneWarning(null);

    // Auto-populate all patient profile fields
    setFormData({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      phone: p.phone || '',
      alt_phone: (p as any).alt_phone || '',
      email: p.email || '',
      date_of_birth: (p as any).date_of_birth ? String((p as any).date_of_birth).split('T')[0] : '',
      age_years: p.age_years ? String(p.age_years) : '',
      gender: p.gender || 'Female',
      blood_group: (p as any).blood_group || '',
      relative_name: (p as any).relative_name || '',
      relation_type: (p as any).relation_type || 'S/o',
      address: p.address || '',
      city: p.city || 'Kozhikode',
      district: (p as any).district || 'Kozhikode',
      pincode: (p as any).pincode || '',
      consultation_type: p.consultation_type || 'Aesthetic',
      known_allergies: p.known_allergies || '',
    });
  };

  // Reset to New Patient Mode
  const handleStartNewPatient = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setShowDropdown(false);
    setPhoneWarning(null);
    setIssuedToken(null);
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      alt_phone: '',
      email: '',
      date_of_birth: '',
      age_years: '',
      gender: 'Female',
      blood_group: '',
      relative_name: '',
      relation_type: 'S/o',
      address: '',
      city: 'Kozhikode',
      district: 'Kozhikode',
      pincode: '',
      consultation_type: 'Aesthetic',
      known_allergies: '',
    });
    setPurpose('');
  };

  // Form input change with automatic Age calculation from Date of Birth
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'date_of_birth') {
      let calculatedAge = formData.age_years;
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age >= 0 && age <= 130) {
          calculatedAge = String(age);
        }
      }
      setFormData((prev) => ({
        ...prev,
        date_of_birth: value,
        age_years: calculatedAge,
      }));
      return;
    }

    if (name === 'phone') {
      const cleaned = value.replace(/[^\d+-\s]/g, '');
      setFormData((prev) => ({ ...prev, phone: cleaned }));
      // Check linked phone records if >= 10 digits
      if (cleaned.replace(/\D/g, '').length >= 10) {
        patientsApi.search(cleaned.trim()).then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          setLinkedPhonePatients(list);
          if (list.length > 0 && !selectedPatient) {
            setPhoneWarning(`Found ${list.length} registered file${list.length > 1 ? 's' : ''} connected to this phone number.`);
          } else {
            setPhoneWarning(null);
          }
        }).catch(() => { });
      } else {
        setLinkedPhonePatients([]);
        setPhoneWarning(null);
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Check duplicate phone on blur for new patient
  const handlePhoneBlur = async () => {
    const phone = formData.phone.trim();
    if (phone.length >= 10) {
      try {
        const res = await patientsApi.search(phone);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setLinkedPhonePatients(list);
        if (list.length > 0 && !selectedPatient) {
          const match = list[0];
          setPhoneWarning(`⚠️ Mobile connected to OP #${match.op_no} (${match.first_name} ${match.last_name || ''}). Select linked file below or continue creating a new family file.`);
        } else {
          setPhoneWarning(null);
        }
      } catch {
        // ignore
      }
    }
  };

  // Step 5: Review / Edit / Confirm (Create Visit Registration)
  // RULE 1: If Existing Patient, updating patient details in registration form UPDATES the Patient Master Record
  // RULE 2: Doctor selections/updates in OP registration DO NOT update Doctor Master Profile
  const handleReviewConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.phone.trim()) {
      alert('First Name and Mobile Phone are required.');
      return;
    }

    if (!selectedDoctorId) {
      alert('Please assign a consulting doctor.');
      return;
    }

    setLoading(true);
    try {
      let patientId = selectedPatient?.id;
      let opNo = selectedPatient?.op_no;
      let patientName = `${formData.first_name} ${formData.last_name || ''}`.trim();

      if (selectedPatient) {
        // RULE 1: Registration form edit in patient profile WILL update patient details in patient profile
        await patientsApi.update(selectedPatient.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          alt_phone: formData.alt_phone,
          email: formData.email,
          date_of_birth: formData.date_of_birth || null,
          age_years: formData.age_years ? parseInt(formData.age_years) : null,
          gender: formData.gender,
          blood_group: formData.blood_group,
          relative_name: formData.relative_name,
          relation_type: formData.relation_type,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          pincode: formData.pincode,
          consultation_type: formData.consultation_type,
          known_allergies: formData.known_allergies,
        });
      } else {
        // Create brand new patient master record
        const res = await patientsApi.create(formData);
        const created = res?.data || res;
        patientId = created.id;
        opNo = created.op_no;
        patientName = `${created.first_name} ${created.last_name || ''}`.trim();
      }

      // Create Visit Registration / Consultation Token in queue
      // RULE 2: Doctor master profile is strictly isolated; visit metadata saved on appointment record only
      const visitPayload = {
        patient_id: patientId,
        doctor_id: selectedDoctorId,
        department_id: selectedDeptId || selectedDoctor?.department_id,
        visit_type: visitType,
        consultation_type: formData.consultation_type,
        purpose: purpose || `${formData.consultation_type} Consultation`,
        room_no: roomNo,
        priority: priority,
      };

      const apptRes = await appointmentsApi.create(visitPayload);
      const token = apptRes?.data || apptRes;

      // Set issued token result with enriched preview
      setIssuedToken({
        ...token,
        token_no: token.token_no || token.token_number || 1,
        op_no: opNo || 'KRN-00101',
        patient_name: patientName,
        phone: formData.phone,
        doctor_name: selectedDoctor?.full_name?.startsWith('Dr.')
          ? selectedDoctor?.full_name
          : `Dr. ${selectedDoctor?.full_name || 'Consulting Doctor'}`,
        department_name: departments.find((d) => d.id === selectedDeptId)?.name || selectedDoctor?.department_name || 'Aesthetic Dermatology',
        visit_type: visitType,
        consultation_type: formData.consultation_type,
        purpose: purpose || 'Consultation & Clinical Evaluation',
        room_no: roomNo,
        timestamp: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to complete visit registration');
    } finally {
      setLoading(false);
    }
  };

  const printTokenSlip = () => {
    window.print();
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 2xl:p-8 max-w-5xl 2xl:max-w-[1500px] 3xl:max-w-[1800px] mx-auto space-y-6 w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Outpatient (OP) Visit Registration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search existing patient or create new file, review/edit profile, assign doctor & issue consultation token
          </p>
        </div>

        {selectedPatient ? (
          <button
            onClick={handleStartNewPatient}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            <UserPlus className="w-4 h-4 text-violet-600" />
            + Switch to New Patient
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
            <Sparkles className="w-3.5 h-3.5" />
            New Patient Mode
          </span>
        )}
      </div>

      {/* STEP 1: SEARCH PATIENT BAR (Patient ID / Mobile / Name) */}
      <div className="bg-white border-2 border-violet-200 rounded-2xl p-5 shadow-sm space-y-3" ref={searchRef}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-violet-800 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Step 1: Search Existing Patient (Patient ID / Mobile / Name)
          </label>
          <span className="text-[11px] text-slate-400">Search first to avoid duplicate registration</span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Type OP Number (e.g. KRN-00101), 10-digit Mobile, or Patient Name..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            className="w-full pl-10 pr-24 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
              className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}

          {/* Auto-suggest dropdown */}
          {showDropdown && (
            <div className="absolute z-30 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-500">Searching central patient database...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectExistingPatient(p)}
                    className="p-3.5 hover:bg-violet-50 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                          {p.op_no}
                        </span>
                        <span className="font-bold text-sm text-slate-900 group-hover:text-violet-900">
                          {p.first_name} {p.last_name || ''}
                        </span>
                        <span className="text-xs text-slate-400">({p.gender}, {p.age_years || 'Age N/A'})</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>
                        <span>•</span>
                        <span>{p.city || 'Kozhikode'}</span>
                        {p.known_allergies && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 font-medium">Allergy: {p.known_allergies}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold bg-violet-600 group-hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg shadow-2xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Select & Populate
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-slate-500">No matching patient found for "{searchQuery}".</p>
                  <button
                    type="button"
                    onClick={handleStartNewPatient}
                    className="text-xs font-semibold text-violet-700 hover:text-violet-900 underline"
                  >
                    + Register as a New Patient
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Phone Notice for New Patient */}
      {phoneWarning && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl flex items-start justify-between text-sm shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{phoneWarning}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                To prevent duplicate records, use the existing profile or confirm if this is a family member sharing the same phone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS TOKEN SLIP POPUP CARD (Step 6: OP Number + Token + Queue) */}
      {issuedToken ? (
        <div className="bg-white border-2 border-emerald-300 rounded-3xl p-8 max-w-lg mx-auto text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Consultation Token Issued
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">HEAL Aesthetic & Outpatient Clinic</h2>
            <p className="text-xs text-slate-400">Karanthoor Main Road · Calicut Outpatient Network</p>
          </div>

          {/* Big Token Display */}
          <div className="py-5 bg-gradient-to-b from-violet-50 to-white rounded-2xl border border-violet-100 shadow-inner">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation Token No.</span>
            <p className="text-6xl font-black text-violet-700 my-1">#{issuedToken.token_no}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                OP No: {issuedToken.op_no}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Status: Waiting in Queue
              </span>
            </div>
          </div>

          {/* Ticket Information Details */}
          <div className="text-left text-xs space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700">
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Patient Name:</span>
              <span className="font-bold text-slate-900">{issuedToken.patient_name}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Contact Phone:</span>
              <span className="font-mono">{issuedToken.phone}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Consulting Doctor:</span>
              <span className="font-bold text-violet-800">{issuedToken.doctor_name}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Department & Room:</span>
              <span className="font-medium">{issuedToken.department_name} ({issuedToken.room_no || 'Room 101'})</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Visit Category:</span>
              <span className="font-medium">{issuedToken.consultation_type} • {issuedToken.visit_type}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-medium">Purpose Note:</span>
              <span className="font-semibold text-slate-800">{issuedToken.purpose}</span>
            </div>
            <div className="flex justify-between pt-1 text-[11px] text-slate-400">
              <span>Date & Time:</span>
              <span>{issuedToken.timestamp}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={printTokenSlip}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Slip
            </button>
            <button
              onClick={() => navigate('/reception/queue')}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-xs"
            >
              Go to Live Queue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleStartNewPatient}
            className="text-xs font-semibold text-violet-700 hover:text-violet-900 underline block mx-auto"
          >
            + Register / Check-in Another Patient
          </button>
        </div>
      ) : (
        /* STEP 2, 3, 4, 5: REGISTRATION / VISIT FORM */
        <form onSubmit={handleReviewConfirm} className="space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${selectedPatient
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-violet-50/80 border-violet-200 text-violet-950'
            }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${selectedPatient ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white'
                }`}>
                {selectedPatient ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {selectedPatient
                    ? `Existing Patient Profile: OP #${selectedPatient.op_no} — ${selectedPatient.first_name} ${selectedPatient.last_name || ''}`
                    : 'New Patient Registration Form'}
                </p>
                <p className="text-xs opacity-80">
                  {selectedPatient
                    ? 'Rule 1 Enforced: Edits to patient fields below will immediately update the Patient Master Record upon confirmation.'
                    : 'Fill details below to generate a new permanent OP file and assign consultation token.'}
                </p>
              </div>
            </div>

            {selectedPatient && (
              <span className="text-xs font-bold bg-white text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs">
                Auto-Populated from DB
              </span>
            )}
          </div>

          {/* PATIENT REGISTRATION / VISIT FORM CONTAINER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            {/* Section 1: Demographics */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                1. Patient Personal & Contact Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    placeholder="Given name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last / Family Name</label>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Surname"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="10-digit primary mobile"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                {linkedPhonePatients.length > 0 && !selectedPatient && (
                  <div className="col-span-full bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span>{linkedPhonePatients.length} Patient Record{linkedPhonePatients.length > 1 ? 's' : ''} Connected with this Phone Number:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {linkedPhonePatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectExistingPatient(p)}
                          className="bg-white hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-900 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>#{p.op_no}: {p.first_name} {p.last_name || ''} ({p.gender}, {p.age_years ? `${p.age_years} yrs` : 'Age -'})</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-amber-700">
                      💡 Click an existing profile above to check in for follow-up/repeat visit, or continue typing below to register a new family member under this phone.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    name="alt_phone"
                    placeholder="Optional secondary phone"
                    value={formData.alt_phone}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">Optional</span>
                  </div>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Selecting DOB auto-calculates age</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Age (Years)</label>
                    {formData.date_of_birth && <span className="text-[10px] text-violet-600 font-bold">Auto-calculated</span>}
                  </div>
                  <input
                    type="number"
                    name="age_years"
                    placeholder="e.g. 28"
                    min="0"
                    max="120"
                    value={formData.age_years}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Can enter age directly without DOB</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="">Unknown / Not Tested</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Guardian & Address */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                2. Guardian & Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-2">
                  <div className="w-24 shrink-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Relation</label>
                    <select
                      name="relation_type"
                      value={formData.relation_type}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="S/o">S/o</option>
                      <option value="D/o">D/o</option>
                      <option value="W/o">W/o</option>
                      <option value="H/o">H/o</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian / Relative Name</label>
                    <input
                      type="text"
                      name="relative_name"
                      placeholder="Father / Spouse name"
                      value={formData.relative_name}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Calicut"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District / State</label>
                  <input
                    type="text"
                    name="district"
                    placeholder="e.g. Kozhikode, Kerala"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Street Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="House name, street, locality"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="6-digit PIN"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Clinical Allergies & Categories */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                3. Clinical Category & Known Allergies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Category</label>
                  <select
                    name="consultation_type"
                    value={formData.consultation_type}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="Aesthetic">Aesthetic & Dermatology</option>
                    <option value="General">General Medicine & Health</option>
                    <option value="Laser">Laser & Cosmetology</option>
                    <option value="Trichology">Hair Restoration & Trichology</option>
                    <option value="Weight Loss">Wellness & Nutrition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Known Drug / Cosmetic Allergies
                  </label>
                  <input
                    type="text"
                    name="known_allergies"
                    placeholder="e.g. Penicillin, Retinoids, Sulfa, None"
                    value={formData.known_allergies}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: SELECT DOCTOR & VISIT SPECIFICS (Doctor Master Data Auto-Populated) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-violet-600" />
                  Step 4: Select Doctor & Assign Visit Metadata
                </h3>
                <p className="text-xs text-slate-500">
                  Doctor master data is auto-populated. Visit-specific fee and category apply only to this token.
                </p>
              </div>

              {/* RULE 2 CALLOUT BADGE */}
              <div className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Doctor Master Isolated (Profile Untouched)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor *</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name?.startsWith('Dr.') ? d.full_name : `Dr. ${d.full_name}`} ({d.department_name || d.specialisation || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department (Auto-Populated)</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                >
                  <option value="">Select Department</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Type</label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="Walk-in">Walk-in Consultation</option>
                  <option value="Review">Follow-up Review</option>
                  <option value="Appointment">Pre-booked Appointment</option>
                  <option value="Procedure">Daycare Minor Procedure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Room</label>
                <select
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="Room 101">Room 101 (Dermatology OPD)</option>
                  <option value="Room 102">Room 102 (Laser Suite)</option>
                  <option value="Room 103">Room 103 (Trichology Lab)</option>
                  <option value="Room 104">Room 104 (Daycare Procedure Recliner)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Token Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="Normal">Normal Queue</option>
                  <option value="Urgent">Priority / Urgent Attention</option>
                  <option value="VIP">VIP Client</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Purpose / Symptom Note</label>
                <input
                  type="text"
                  placeholder="e.g. Acne consultation, pigmentation peel, skin glow review"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 5: REVIEW / EDIT / CONFIRM BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-900 text-white rounded-2xl shadow-md">
            <div>
              <p className="font-bold text-sm">
                {selectedPatient
                  ? 'Confirm Visit & Sync Patient Master Profile'
                  : 'Register New Patient & Issue Consultation Token'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedPatient
                  ? 'Saves modified demographic details to master records and queues token for doctor.'
                  : 'Assigns unique permanent OP number and puts token into the active queue.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStartNewPatient}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition"
              >
                <Ticket className="w-4 h-4" />
                {loading
                  ? 'Processing Registration...'
                  : selectedPatient
                    ? 'Review / Edit / Confirm Visit'
                    : 'Create Visit Registration & Issue Token'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
