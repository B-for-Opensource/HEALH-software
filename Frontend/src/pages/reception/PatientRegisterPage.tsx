import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Ticket,
  Printer
} from 'lucide-react';
import { patientsApi, appointmentsApi, mastersApi } from '@/api';
import type { Staff, Department } from '@/types';

export default function PatientRegisterPage() {
  const navigate = useNavigate();

  // Registration Form State
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
    city: '',
    district: '',
    pincode: '',
    consultation_type: 'General',
    known_allergies: '',
  });

  // Duplicate warning
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [existingPatient, setExistingPatient] = useState<any | null>(null);

  // Doctors & Departments
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Token Form State (post-save)
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [visitType, setVisitType] = useState('Walk-in');
  const [purpose, setPurpose] = useState('');

  // Result state
  const [savedPatient, setSavedPatient] = useState<any | null>(null);
  const [issuedToken, setIssuedToken] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    // Load doctors and departments
    mastersApi.doctors().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDoctors(list);
      if (list.length > 0) setSelectedDoctorId(list[0].id);
    }).catch(() => {});

    mastersApi.departments().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDepartments(list);
      if (list.length > 0) setSelectedDeptId(list[0].id);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneBlur = async () => {
    const phone = formData.phone.trim();
    if (phone.length >= 10) {
      try {
        const res = await patientsApi.search(phone);
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          const p = list[0];
          setPhoneWarning(`⚠️ Phone already registered for OP #${p.op_no}: ${p.first_name} ${p.last_name || ''}`);
          setExistingPatient(p);
        } else {
          setPhoneWarning(null);
          setExistingPatient(null);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.phone) {
      alert('First Name and Phone are required');
      return;
    }
    setLoading(true);
    try {
      const res = await patientsApi.create(formData);
      const patient = res?.data || res;
      setSavedPatient(patient);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Patient registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueToken = async () => {
    if (!savedPatient?.id) return;
    setTokenLoading(true);
    try {
      const payload = {
        patient_id: savedPatient.id,
        doctor_id: selectedDoctorId,
        department_id: selectedDeptId,
        visit_type: visitType,
        consultation_type: formData.consultation_type,
        purpose: purpose,
      };
      const res = await appointmentsApi.create(payload);
      const token = res?.data || res;
      setIssuedToken(token);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to issue token');
    } finally {
      setTokenLoading(false);
    }
  };

  const printTokenSlip = () => {
    window.print();
  };

  const resetForm = () => {
    setSavedPatient(null);
    setIssuedToken(null);
    setPhoneWarning(null);
    setExistingPatient(null);
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
      city: '',
      district: '',
      pincode: '',
      consultation_type: 'General',
      known_allergies: '',
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Patient Registration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Register walk-in or appointment patients, issue OP number, and assign consultation token
        </p>
      </div>

      {/* Duplicate Alert */}
      {phoneWarning && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl flex items-start justify-between text-sm shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{phoneWarning}</p>
              <p className="text-xs text-amber-700 mt-1">
                You can issue a token directly for the existing patient instead of creating a duplicate file.
              </p>
            </div>
          </div>
          {existingPatient && (
            <button
              onClick={() => {
                setSavedPatient(existingPatient);
                setPhoneWarning(null);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xs"
            >
              Use Existing Patient
            </button>
          )}
        </div>
      )}

      {/* SUCCESS TOKEN CARD */}
      {issuedToken ? (
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 max-w-md mx-auto text-center shadow-lg space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">TOKEN ISSUED</h2>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-1">HEAL Aesthetic & Medical Clinic</p>
          </div>

          <div className="py-4 border-y border-dashed border-slate-300">
            <span className="text-xs font-bold text-slate-400 uppercase">Token Number</span>
            <p className="text-6xl font-black text-violet-700 my-1">#{issuedToken.token_no}</p>
            <p className="font-mono text-sm font-semibold text-slate-600">OP: {savedPatient?.op_no}</p>
          </div>

          <div className="text-left text-xs space-y-1.5 bg-slate-50 p-4 rounded-xl text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Patient:</span>
              <span className="font-semibold">{savedPatient?.first_name} {savedPatient?.last_name || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span>{savedPatient?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Doctor:</span>
              <span className="font-semibold">{issuedToken?.doctor_name || 'Assigned Doctor'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span>{issuedToken?.department_name || 'Outpatient'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={printTokenSlip}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Slip
            </button>
            <button
              onClick={() => navigate('/reception/queue')}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-semibold shadow-xs"
            >
              Go to Queue
            </button>
          </div>

          <button
            onClick={resetForm}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
          >
            + Register Another Patient
          </button>
        </div>
      ) : savedPatient ? (
        /* PATIENT SAVED — ISSUE TOKEN STEP */
        <div className="bg-white border border-violet-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {savedPatient.first_name} {savedPatient.last_name || ''}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  OP Number: <span className="text-violet-700 font-bold text-sm">{savedPatient.op_no}</span> · Phone: {savedPatient.phone}
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              Patient Registered
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-violet-600" />
              Assign Doctor & Issue Consultation Token
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor *</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.full_name} ({d.department_name || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Visit Type</label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Appointment">Pre-booked Appointment</option>
                  <option value="Follow-up">Follow-up Review</option>
                  <option value="Procedure">Daycare Procedure</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chief Purpose / Symptom Note</label>
                <input
                  type="text"
                  placeholder="e.g. Skin pigmentation consult, acne review, laser session 2"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setSavedPatient(null)}
              className="text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              ← Edit Patient Details
            </button>
            <button
              onClick={handleIssueToken}
              disabled={tokenLoading || !selectedDoctorId}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-xs transition"
            >
              <Ticket className="w-4 h-4" />
              {tokenLoading ? 'Issuing Token...' : 'Generate Token & Send to Queue'}
            </button>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <form onSubmit={handleRegister} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-violet-700">
              1. Primary Details
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
                  placeholder="10-digit mobile"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Phone</label>
                <input
                  type="tel"
                  name="alt_phone"
                  placeholder="Optional alternate"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
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

          {/* Section 2: Guardian / Relative & Address */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-violet-700">
              2. Address & Guardian
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    name="relative_name"
                    placeholder="Relative name"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Street Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="House name, street, landmark"
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

          {/* Section 3: Clinical Alerts */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 text-violet-700">
              3. Clinical Notes & Allergies
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
                  <option value="General">General Medicine</option>
                  <option value="Laser">Laser & Cosmetology</option>
                  <option value="Trichology">Hair & Trichology</option>
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

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/reception/queue')}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Saving Patient...' : 'Save & Proceed to Token Issue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
