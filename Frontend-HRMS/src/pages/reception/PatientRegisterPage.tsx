import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserCheck,
  UserPlus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  User,
  Phone,
  Calendar,
  Activity,
  MapPin,
  Clock,
  Printer,
  FileText,
  RotateCcw,
  Save,
  HelpCircle,
  Trash2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Plus
} from 'lucide-react';
import { patientsApi, appointmentsApi, mastersApi } from '@/api';
import type { Patient, Staff } from '@/types';

export default function PatientRegisterPage() {
  const navigate = useNavigate();

  // Search State (Search Patient by Mobile / Name / OP No)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Selected Patient (Existing vs New)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Exact Fields matching Screenshot (9) & (10) "Out Patient":
  const [regNo, setRegNo] = useState<string>('246');
  const [regDate, setRegDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [regTime, setRegTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  );
  const [systemType, setSystemType] = useState<string>('Alopathy'); // (None), Alopathy, Ayurvedham, Homeo
  const [opNo, setOpNo] = useState<string>(() => `A00${Math.floor(300 + Math.random() * 600)}`);
  
  // Patient details
  const [patientName, setPatientName] = useState('');
  const [place, setPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  
  // Age(YMD) 3 separate inputs
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [ageDays, setAgeDays] = useState('');
  
  // Relative info
  const [relationType, setRelationType] = useState('S/O'); // S/O, D/O, W/O, H/O, C/O
  const [relativeName, setRelativeName] = useState('');
  
  // Doctor & Financials
  const [selectedDoctor, setSelectedDoctor] = useState('ARUN PRAKASH');
  const [amount, setAmount] = useState<number>(300);
  const [discount, setDiscount] = useState<number>(0);
  const [rDate, setRDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cash, setCash] = useState<number>(300);
  const [card, setCard] = useState<number>(0);
  
  // Token & Booking info
  const [tokenDate, setTokenDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tokenTime, setTokenTime] = useState<string>('12:00 AM');
  const [tokenNo, setTokenNo] = useState<string>('1');
  const [bookingNo, setBookingNo] = useState<string>('');
  const [refund, setRefund] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  
  // Footer options
  const [receptionist, setReceptionist] = useState('(none)');
  const [printType, setPrintType] = useState('OPA5');

  // History / Visit records for selected patient
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  // Duplicate warning & linked phone records
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [linkedPhonePatients, setLinkedPhonePatients] = useState<Patient[]>([]);

  // Doctors list
  const [doctorsList, setDoctorsList] = useState<any[]>([
    { id: 'doc-arun', name: 'ARUN PRAKASH', dept: 'General Medicine' },
    { id: 'doc-swathigha', name: 'SWATHIGHA SUDHEER .K', dept: 'Cosmetic Dermatology' },
    { id: 'doc-ananya', name: 'Dr. Ananya Nair', dept: 'Dermatology & Cosmetology' },
    { id: 'doc-rohit', name: 'Dr. Rohit Sharma', dept: 'Aesthetic Surgery' },
  ]);

  // Receptionist list
  const receptionists = ['(none)', 'Receptionist 01', 'Emma Watson', 'Priya S.', 'Kavitha R.'];

  // Submission & Result States
  const [loading, setLoading] = useState(false);
  const [issuedPass, setIssuedPass] = useState<any | null>(null);

  // Load Doctors from API
  useEffect(() => {
    mastersApi.doctors().then((res) => {
      const list: Staff[] = Array.isArray(res) ? res : (res?.data || []);
      if (list.length > 0) {
        setDoctorsList(list.map((d) => ({
          id: d.id,
          name: d.full_name || (d as any).name,
          dept: d.department_name || 'Clinical'
        })));
      }
    }).catch(() => { });
  }, []);

  // Net Amount calculated automatically
  const netAmount = Math.max(0, amount - discount);

  // Search auto-complete debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        patientsApi.search(searchQuery.trim()).then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          setSearchResults(list);
          setShowDropdown(true);
        }).catch(() => {
          setSearchResults([]);
        }).finally(() => {
          setIsSearching(false);
        });
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search dropdown dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Populate Existing Patient Profile
  const handleSelectExistingPatient = (p: Patient) => {
    setSelectedPatient(p);
    setShowDropdown(false);
    setSearchQuery(`${p.first_name} ${p.last_name || ''} (${p.op_no})`);
    setPhoneWarning(null);

    setOpNo(p.op_no || opNo);
    setPatientName(`${p.first_name} ${p.last_name || ''}`.trim());
    setPhone(p.phone || '');
    setPlace(p.city || '');
    setAddress(p.address || '');
    setSex(p.gender === 'Female' ? 'Female' : p.gender === 'Other' ? 'Other' : 'Male');
    setAgeYears(p.age_years ? String(p.age_years) : '');
    setAgeMonths('');
    setAgeDays('');
    setRelativeName(p.relative_name || '');
    setRelationType(p.relation_type || 'S/O');

    // Sample visit history for the right-hand panel
    setPatientHistory([
      { date: '15-10-2026', doctor: 'ARUN PRAKASH', purpose: 'Consultation', status: 'Completed', bill: '₹300' },
      { date: '02-09-2026', doctor: 'SWATHIGHA SUDHEER .K', purpose: 'Skin Review', status: 'Completed', bill: '₹500' },
      { date: '12-07-2026', doctor: 'Dr. Ananya Nair', purpose: 'Chemical Peel', status: 'Completed', bill: '₹2,500' },
    ]);
  };

  // Reset to New Patient Mode
  const handleStartNewPatient = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setShowDropdown(false);
    setPhoneWarning(null);
    setIssuedPass(null);

    setRegNo(String(Math.floor(200 + Math.random() * 800)));
    setOpNo(`A00${Math.floor(300 + Math.random() * 600)}`);
    setPatientName('');
    setPlace('');
    setPhone('');
    setAddress('');
    setSex('Male');
    setAgeYears('');
    setAgeMonths('');
    setAgeDays('');
    setRelativeName('');
    setRelationType('S/O');
    setAmount(300);
    setDiscount(0);
    setCash(300);
    setCard(0);
    setRemarks('');
    setBookingNo('');
    setPatientHistory([]);
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[^\d+-\s]/g, '');
    setPhone(cleaned);
    if (cleaned.replace(/\D/g, '').length >= 10) {
      patientsApi.search(cleaned.trim()).then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setLinkedPhonePatients(list);
        if (list.length > 0 && !selectedPatient) {
          setPhoneWarning(`Found ${list.length} registered patient record${list.length > 1 ? 's' : ''} connected to this phone number.`);
        } else {
          setPhoneWarning(null);
        }
      }).catch(() => { });
    } else {
      setLinkedPhonePatients([]);
      setPhoneWarning(null);
    }
  };

  // Submit Registration -> Create Visit Token & Pass to Nurse Station
  const handleSaveAndPassToNurse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!patientName.trim()) {
      alert('Please enter Patient name.');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter Phone number.');
      return;
    }

    setLoading(true);
    try {
      let patientId = selectedPatient?.id;
      let finalOpNo = selectedPatient?.op_no || opNo;

      const nameParts = patientName.trim().split(' ');
      const firstName = nameParts[0] || patientName.trim();
      const lastName = nameParts.slice(1).join(' ');

      const patientPayload = {
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        gender: sex,
        age_years: ageYears ? parseInt(ageYears) : null,
        city: place || 'Kozhikode',
        address: address,
        relative_name: relativeName,
        relation_type: relationType,
        consultation_type: systemType,
      };

      if (selectedPatient) {
        await patientsApi.update(selectedPatient.id, patientPayload);
      } else {
        const res = await patientsApi.create(patientPayload);
        const created = res?.data || res;
        patientId = created.id;
        finalOpNo = created.op_no || opNo;
      }

      // Find doctor ID
      const doc = doctorsList.find((d) => d.name === selectedDoctor) || doctorsList[0];

      // Create Appointment Token passed to Nurse
      const visitPayload = {
        patient_id: patientId,
        doctor_id: doc.id || 'doc-001',
        department_name: doc.dept || 'General Medicine',
        visit_type: selectedPatient ? 'Follow-up' : 'Walk-in',
        consultation_type: systemType,
        purpose: remarks || 'Doctor Consultation',
        status: 'With-Nurse', // Passed to Nurse Station
        token_no: parseInt(tokenNo) || 1,
      };

      const apptRes = await appointmentsApi.create(visitPayload);
      const token = apptRes?.data || apptRes;

      if (token?.id) {
        await appointmentsApi.updateStatus(token.id, 'With-Nurse');
      }

      setIssuedPass({
        token_no: token?.token_no || tokenNo || 1,
        op_no: finalOpNo,
        patient_name: patientName.trim(),
        phone: phone,
        gender: sex,
        age: ageYears ? `${ageYears} Y` : 'N/A',
        doctor: selectedDoctor,
        amount: netAmount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      alert(`✅ Registration #${regNo} Saved for OP ${finalOpNo} (${patientName})!\n\nPatient transferred to Nurse Station queue.`);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 2xl:p-8 max-w-6xl 2xl:max-w-[1700px] mx-auto space-y-4 font-sans text-slate-800">
      {/* Top Search & Patient Lookup Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3" ref={searchRef}>
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Existing OP No, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            className="w-full pl-9 pr-20 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
              className="absolute right-2 top-1.5 text-[10px] font-bold text-stone-500 hover:text-stone-800 bg-white border border-stone-200 px-2 py-0.5 rounded"
            >
              Clear
            </button>
          )}

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-stone-100">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-stone-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectExistingPatient(p)}
                    className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-emerald-800 mr-2">{p.op_no}</span>
                      <strong className="text-stone-900">{p.first_name} {p.last_name || ''}</strong>
                      <span className="text-[11px] text-stone-500 ml-2">({p.gender}, {p.phone})</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[11px]">+ Select</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-stone-400">No patient found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedPatient && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Editing #{selectedPatient.op_no}
            </span>
          )}
          <button
            type="button"
            onClick={handleStartNewPatient}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            + New Out Patient
          </button>
        </div>
      </div>

      {phoneWarning && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded-xl flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{phoneWarning}</span>
        </div>
      )}

      {/* CONFIRMATION CARD (When registered) */}
      {issuedPass && (
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                  OP #{issuedPass.op_no}
                </span>
                <span className="font-bold text-sm text-stone-900">{issuedPass.patient_name}</span>
                <span className="text-xs text-stone-500">Token #{issuedPass.token_no}</span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Passed to <strong>Nurse Station</strong> for BMI &amp; Vitals check · Doctor: <strong>{issuedPass.doctor}</strong> · Net: ₹{issuedPass.amount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/daycare/lounges')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white transition flex items-center gap-1 cursor-pointer"
            >
              <Activity size={14} />
              Go to Nurse Station ➔
            </button>
            <button
              onClick={handleStartNewPatient}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer"
            >
              + Next Registration
            </button>
          </div>
        </div>
      )}

      {/* EXACT WINDOW: "Out Patient" (Screenshot 9 & 10) */}
      <div className="bg-[#DFE8F6] border-2 border-[#7DA2CE] rounded-xl shadow-xl overflow-hidden font-sans">
        {/* Title Bar with Windows Styling */}
        <div className="bg-gradient-to-r from-[#205898] via-[#3572B0] to-[#518EC7] text-white px-3 py-1.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block border border-amber-600"></span>
            <span>Out Patient</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <button className="w-5 h-4 bg-[#4A7EB5] hover:bg-[#6899CC] rounded-xs flex items-center justify-center font-bold">_</button>
            <button className="w-5 h-4 bg-[#4A7EB5] hover:bg-[#6899CC] rounded-xs flex items-center justify-center font-bold">□</button>
            <button onClick={() => navigate('/reception/queue')} className="w-5 h-4 bg-[#C23B3B] hover:bg-red-600 rounded-xs flex items-center justify-center font-bold">✕</button>
          </div>
        </div>

        {/* Action Toolbar Icons (Matching Screenshot 9) */}
        <div className="bg-[#F0F4FC] border-b border-[#B5C8E2] px-3 py-1.5 flex items-center gap-3 text-[11px] text-[#1E395B] font-medium overflow-x-auto">
          <button type="button" onClick={() => alert('Viewing previous registration')} className="flex items-center gap-1 hover:text-blue-700 cursor-pointer">
            <span className="text-blue-600">◀</span> Previous
          </button>
          <button type="button" onClick={() => alert('Viewing next registration')} className="flex items-center gap-1 hover:text-blue-700 cursor-pointer">
            Next <span className="text-blue-600">▶</span>
          </button>
          <button type="button" onClick={() => handleSaveAndPassToNurse()} className="flex items-center gap-1 hover:text-emerald-700 font-bold cursor-pointer">
            <Save size={13} className="text-emerald-600" /> Save
          </button>
          <button type="button" onClick={() => { if (searchRef.current) searchRef.current.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center gap-1 hover:text-blue-700 cursor-pointer">
            <Search size={13} className="text-blue-600" /> Search
          </button>
          <button type="button" onClick={handleStartNewPatient} className="flex items-center gap-1 hover:text-blue-700 font-bold cursor-pointer">
            <Plus size={13} className="text-blue-600" /> New
          </button>
          <button type="button" onClick={() => alert('Record Copied')} className="flex items-center gap-1 hover:text-blue-700 cursor-pointer">
            <FileText size={13} className="text-stone-500" /> Copy
          </button>
          <button type="button" onClick={() => window.location.reload()} className="flex items-center gap-1 hover:text-blue-700 cursor-pointer">
            <RotateCcw size={13} className="text-stone-500" /> Refresh
          </button>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => alert('Help: Enter primary OP details and click Save to pass to Nurse.')} className="flex items-center gap-1 text-blue-700 cursor-pointer">
              <HelpCircle size={13} /> Help
            </button>
            <button type="button" onClick={() => alert('Delete record disabled in live session')} className="flex items-center gap-1 text-red-600 cursor-pointer">
              <Trash2 size={13} /> Delete
            </button>
            <button type="button" onClick={() => navigate('/reception/queue')} className="flex items-center gap-1 text-red-700 font-bold cursor-pointer">
              <LogOut size={13} /> Exit
            </button>
          </div>
        </div>

        {/* Main Form Body */}
        <form onSubmit={handleSaveAndPassToNurse} className="p-4 bg-white grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
          {/* Left Form Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-2.5">
            {/* Row 1: No., Date, Time */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">No.</label>
              <div className="col-span-3">
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono font-bold bg-stone-50 text-stone-900"
                />
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">Date</label>
              <div className="col-span-2">
                <input
                  type="date"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full px-1.5 py-1 border border-stone-300 rounded text-stone-800"
                />
              </div>

              <label className="col-span-1 text-stone-700 font-bold text-right">Time</label>
              <div className="col-span-2">
                <input
                  type="text"
                  value={regTime}
                  onChange={(e) => setRegTime(e.target.value)}
                  className="w-full px-1.5 py-1 border border-stone-300 rounded font-mono text-stone-800"
                />
              </div>
            </div>

            {/* Row 2: Type (Alopathy, Ayurvedham, Homeo, (None)) */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Type</label>
              <div className="col-span-10">
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="w-full sm:w-64 px-2 py-1 border border-stone-300 rounded font-semibold bg-white text-stone-900"
                >
                  <option value="Alopathy">Alopathy</option>
                  <option value="(None)">(None)</option>
                  <option value="Ayurvedham">Ayurvedham</option>
                  <option value="Homeo">Homeo</option>
                </select>
              </div>
            </div>

            {/* Row 3: OP No. & Booking button */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">OP No.</label>
              <div className="col-span-4">
                <input
                  type="text"
                  required
                  value={opNo}
                  onChange={(e) => setOpNo(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono font-bold text-blue-900 bg-blue-50/50"
                />
              </div>
              <div className="col-span-3">
                <span className="font-mono font-black text-sm text-stone-900">{opNo}</span>
              </div>
              <div className="col-span-3 text-right">
                <button
                  type="button"
                  onClick={() => alert(`Opening Booking Queue for ${opNo}`)}
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-xs font-bold text-stone-800 cursor-pointer shadow-2xs"
                >
                  Booking
                </button>
              </div>
            </div>

            {/* Row 4: Patient */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Patient *</label>
              <div className="col-span-10">
                <input
                  type="text"
                  required
                  placeholder="Full patient name (e.g. RAKESH KUMAR)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-bold text-stone-900 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Row 5: Place & Phone */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Place</label>
              <div className="col-span-4">
                <input
                  type="text"
                  placeholder="e.g. CHEVAYUR / CALICUT"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded text-stone-900"
                />
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">Phone *</label>
              <div className="col-span-4">
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono font-bold text-stone-900"
                />
              </div>
            </div>

            {/* Row 6: Address */}
            <div className="grid grid-cols-12 gap-2 items-start">
              <label className="col-span-2 text-stone-700 font-bold pt-1">Address</label>
              <div className="col-span-10">
                <textarea
                  rows={2}
                  placeholder="House/Street, Locality, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded text-stone-900 text-xs"
                />
              </div>
            </div>

            {/* Row 7: Sex & Age(YMD) & Relative */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Sex</label>
              <div className="col-span-2">
                <select
                  value={sex}
                  onChange={(e: any) => setSex(e.target.value)}
                  className="w-full px-1.5 py-1 border border-stone-300 rounded font-medium bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">Age(YMD)</label>
              <div className="col-span-3 flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Y"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                  className="w-10 px-1 py-1 border border-stone-300 rounded text-center font-mono font-bold"
                  title="Years"
                />
                <input
                  type="number"
                  placeholder="M"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(e.target.value)}
                  className="w-9 px-1 py-1 border border-stone-300 rounded text-center font-mono"
                  title="Months"
                />
                <input
                  type="number"
                  placeholder="D"
                  value={ageDays}
                  onChange={(e) => setAgeDays(e.target.value)}
                  className="w-9 px-1 py-1 border border-stone-300 rounded text-center font-mono"
                  title="Days"
                />
              </div>

              <div className="col-span-3 flex items-center gap-1">
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                  className="w-14 px-1 py-1 border border-stone-300 rounded font-semibold bg-white"
                >
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                  <option value="H/O">H/O</option>
                  <option value="C/O">C/O</option>
                </select>
                <input
                  type="text"
                  placeholder="Guardian Name"
                  value={relativeName}
                  onChange={(e) => setRelativeName(e.target.value)}
                  className="flex-1 px-1.5 py-1 border border-stone-300 rounded"
                />
              </div>
            </div>

            {/* Row 8: Doctor */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Doctor</label>
              <div className="col-span-10">
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-2 py-1.5 border border-stone-300 rounded font-bold text-stone-900 bg-white"
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.dept})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 9: Amount & Discount */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Amount</label>
              <div className="col-span-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono font-bold"
                />
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">Discount</label>
              <div className="col-span-4">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono"
                />
              </div>
            </div>

            {/* Row 10: Net Amount & RDate */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Net Amount</label>
              <div className="col-span-4">
                <input
                  type="text"
                  readOnly
                  value={netAmount}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono font-black bg-stone-100 text-stone-900"
                />
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">RDate</label>
              <div className="col-span-4">
                <input
                  type="date"
                  value={rDate}
                  onChange={(e) => setRDate(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded text-stone-800"
                />
              </div>
            </div>

            {/* Row 11: Cash & Card */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Cash</label>
              <div className="col-span-4">
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono font-bold"
                />
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">Card</label>
              <div className="col-span-4">
                <input
                  type="number"
                  value={card}
                  onChange={(e) => setCard(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono"
                />
              </div>
            </div>

            {/* Row 12: Token Date, Time, Token No */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Token Date</label>
              <div className="col-span-3">
                <input
                  type="date"
                  value={tokenDate}
                  onChange={(e) => setTokenDate(e.target.value)}
                  className="w-full px-1.5 py-1 border border-stone-300 rounded"
                />
              </div>

              <label className="col-span-1 text-stone-700 font-bold text-right">Time</label>
              <div className="col-span-2">
                <input
                  type="text"
                  value={tokenTime}
                  onChange={(e) => setTokenTime(e.target.value)}
                  className="w-full px-1.5 py-1 border border-stone-300 rounded font-mono"
                />
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">Token No</label>
              <div className="col-span-2">
                <input
                  type="text"
                  value={tokenNo}
                  onChange={(e) => setTokenNo(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono font-black bg-emerald-50 text-emerald-900 text-center"
                />
              </div>
            </div>

            {/* Row 13: Booking No */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Booking No</label>
              <div className="col-span-10">
                <input
                  type="text"
                  placeholder="Optional appointment booking ref"
                  value={bookingNo}
                  onChange={(e) => setBookingNo(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono"
                />
              </div>
            </div>

            {/* Row 14: Refund & Remarks */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-2 text-stone-700 font-bold">Refund</label>
              <div className="col-span-3">
                <input
                  type="number"
                  value={refund}
                  onChange={(e) => setRefund(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-stone-300 rounded font-mono"
                />
              </div>

              <label className="col-span-2 text-stone-700 font-bold text-right pr-1">Remarks</label>
              <div className="col-span-5">
                <input
                  type="text"
                  placeholder="Special instructions or consultation note"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-2 py-1 border border-stone-300 rounded text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Big History / Past Visits Panel (5 Cols, Matching Screenshot 9) */}
          <div className="lg:col-span-5 flex flex-col justify-between border-2 border-stone-300 rounded-lg p-3 bg-stone-50/50 min-h-[350px]">
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2">
                <span className="font-bold text-xs text-stone-700 uppercase tracking-wider">
                  Patient Visits &amp; Medical History
                </span>
                <span className="text-[10px] text-stone-500 font-mono">OP: {opNo}</span>
              </div>

              {patientHistory.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.map((h, i) => (
                    <div key={i} className="p-2 rounded border border-stone-200 bg-white text-[11px] space-y-0.5 shadow-2xs">
                      <div className="flex justify-between font-bold text-stone-800">
                        <span>{h.date}</span>
                        <span className="text-emerald-700">{h.bill}</span>
                      </div>
                      <div className="text-stone-600">Dr. {h.doctor} · {h.purpose}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-center p-4">
                  <FileText size={32} className="mb-2 text-stone-300" />
                  <p className="text-xs">No prior visit history recorded for this OP number.</p>
                  <p className="text-[10px] mt-1 text-stone-400">Previous consultations and vitals will appear here.</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200 text-right">
              <a href="#settings" onClick={(e) => { e.preventDefault(); alert('Out Patient Configuration Settings: Counter auto-numbering, printer formats OPA5.'); }} className="text-[11px] text-blue-700 hover:underline">
                Settings
              </a>
            </div>
          </div>

          {/* Bottom Bar matching Screenshot 9 */}
          <div className="col-span-12 border-t-2 border-stone-300 pt-3 flex flex-wrap items-center justify-between gap-2 bg-[#F6F8FC] p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-xs font-bold text-stone-800 cursor-pointer shadow-2xs"
              >
                Print
              </button>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-600 font-bold">Receptionist:</span>
                <select
                  value={receptionist}
                  onChange={(e) => setReceptionist(e.target.value)}
                  className="px-2 py-1 border border-stone-300 rounded bg-white font-medium"
                >
                  {receptionists.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => alert(`Previewing registration pass for ${patientName || opNo}`)}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-xs font-bold text-stone-800 cursor-pointer shadow-2xs"
              >
                View
              </button>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-600 font-bold">Print Type:</span>
                <select
                  value={printType}
                  onChange={(e) => setPrintType(e.target.value)}
                  className="px-2 py-1 border border-stone-300 rounded bg-white font-mono font-bold"
                >
                  <option value="OPA5">OPA5</option>
                  <option value="A4">A4</option>
                  <option value="Thermal">Thermal 80mm</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-[#205898] hover:bg-[#1A477B] text-white rounded text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Save size={13} />
                {loading ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                onClick={handleStartNewPatient}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-xs font-bold text-stone-800 cursor-pointer"
              >
                New
              </button>

              <button
                type="button"
                onClick={() => navigate('/reception/queue')}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-xs font-bold text-stone-800 cursor-pointer"
              >
                Exit
              </button>

              {/* Dedicated Pipeline Action Button */}
              <button
                type="button"
                onClick={() => handleSaveAndPassToNurse()}
                className="ml-2 px-4 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                title="Saves patient and passes directly to Nurse Station in the patient pipeline"
              >
                <Activity size={14} />
                Register &amp; Pass to Nurse ➔
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
