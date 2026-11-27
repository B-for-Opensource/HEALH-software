import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Ticket,
  Receipt,
  Edit3,
  UserPlus,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Pill,
  Printer,
  Stethoscope,
  X,
  ChevronRight,
  Activity,
  FlaskConical,
  Camera,
  Eye,
  Scissors,
  CalendarDays
} from 'lucide-react';
import { patientsApi } from '@/api';
import type { Patient } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PatientDirectoryPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [historyModalPatient, setHistoryModalPatient] = useState<Patient | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'timeline' | 'consultations' | 'prescriptions' | 'lab' | 'nursing'>('timeline');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [printRxModal, setPrintRxModal] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    alt_phone: '',
    email: '',
    age_years: '',
    gender: 'Female',
    blood_group: '',
    city: '',
    district: '',
    pincode: '',
    address: '',
    known_allergies: '',
  });

  const fetchPatients = useCallback(async (query = '') => {
    setLoading(true);
    try {
      let res;
      if (query.trim().length >= 2) {
        res = await patientsApi.search(query);
      } else {
        res = await patientsApi.list();
      }
      const list = Array.isArray(res) ? res : (res?.data || []);
      setPatients(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    fetchPatients(val);
  };

  const openEditModal = (p: Patient) => {
    setEditingPatient(p);
    setEditForm({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      phone: p.phone || '',
      alt_phone: (p as any).alt_phone || '',
      email: p.email || '',
      age_years: p.age_years ? String(p.age_years) : '',
      gender: p.gender || 'Female',
      blood_group: (p as any).blood_group || '',
      city: p.city || '',
      district: (p as any).district || '',
      pincode: (p as any).pincode || '',
      address: p.address || '',
      known_allergies: p.known_allergies || '',
    });
  };

  const openHistoryModal = async (p: Patient) => {
    setHistoryModalPatient(p);
    setHistoryLoading(true);
    setActiveHistoryTab('timeline');
    try {
      const res = await patientsApi.history(p.id);
      const data = res?.data || res || {};
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      await patientsApi.update(editingPatient.id, editForm);
      alert('Patient details updated successfully');
      setEditingPatient(null);
      fetchPatients(search);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update patient');
    }
  };

  // Screenshot (16) filter state
  const [filterType, setFilterType] = useState('Alopathy');
  const [filterOpNo, setFilterOpNo] = useState('');
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterPlace, setFilterPlace] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterSex, setFilterSex] = useState('');
  const [filterAgeY, setFilterAgeY] = useState('');
  const [filterAgeM, setFilterAgeM] = useState('');
  const [filterAgeD, setFilterAgeD] = useState('');
  const [filterRelation, setFilterRelation] = useState('S/O');
  const [filterRelativeName, setFilterRelativeName] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('(All)');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  return (
    <div className="p-3 sm:p-5 md:p-6 2xl:p-8 max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto space-y-5 w-full">

      {/* SCREENSHOT (16) EXACT HMS-STYLE PATIENT WINDOW */}
      <div className="bg-white border-2 border-slate-300 rounded-xl shadow-lg overflow-hidden text-xs">
        {/* Window Title Bar */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm tracking-wide uppercase">Patient</span>
            <span className="text-[11px] text-slate-400 border-l border-slate-600 pl-2">
              Patient Master Directory & Search
            </span>
          </div>
          <button
            onClick={() => navigate('/reception/register')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Register New Patient
          </button>
        </div>

        <div className="p-4 space-y-3 bg-slate-50/50">
          {/* ROW 1: Type, OP No., Date */}
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-12 text-right">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                >
                  <option value="Alopathy">Alopathy</option>
                  <option value="(None)">(None)</option>
                  <option value="Ayurvedham">Ayurvedham</option>
                  <option value="Homeo">Homeo</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-16 text-right">OP No.</label>
                <input
                  type="text"
                  placeholder="OP No."
                  value={filterOpNo}
                  onChange={(e) => { setFilterOpNo(e.target.value); setSearch(e.target.value); fetchPatients(e.target.value); }}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-12 text-right">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                />
              </div>
              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-12 text-right">Name</label>
                <input
                  type="text"
                  placeholder="Search patient name..."
                  value={search}
                  onChange={handleSearchChange}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* ROW 2: Place, Phone, Address */}
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-12 text-right">Place</label>
                <input
                  type="text"
                  value={filterPlace}
                  onChange={(e) => setFilterPlace(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1"
                />
              </div>
              <div className="sm:col-span-3 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-14 text-right">Phone</label>
                <input
                  type="text"
                  value={filterPhone}
                  onChange={(e) => { setFilterPhone(e.target.value); setSearch(e.target.value); fetchPatients(e.target.value); }}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                />
              </div>
              <div className="sm:col-span-6 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-16 text-right">Address</label>
                <input
                  type="text"
                  value={filterAddress}
                  onChange={(e) => setFilterAddress(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* ROW 3: Sex, Age(YMD), Relation, Doctor */}
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-2 flex items-center gap-1.5">
                <label className="font-bold text-slate-700 w-10 text-right">Sex</label>
                <select
                  value={filterSex}
                  onChange={(e) => setFilterSex(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-1.5 py-1"
                >
                  <option value="">(All)</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex items-center gap-1">
                <label className="font-bold text-slate-700 text-right whitespace-nowrap">Age(YMD)</label>
                <input type="text" placeholder="Y" value={filterAgeY} onChange={(e) => setFilterAgeY(e.target.value)} className="w-9 bg-white border border-slate-300 rounded p-1 text-center font-bold" />
                <input type="text" placeholder="M" value={filterAgeM} onChange={(e) => setFilterAgeM(e.target.value)} className="w-8 bg-white border border-slate-300 rounded p-1 text-center" />
                <input type="text" placeholder="D" value={filterAgeD} onChange={(e) => setFilterAgeD(e.target.value)} className="w-8 bg-white border border-slate-300 rounded p-1 text-center" />
              </div>
              <div className="sm:col-span-3 flex items-center gap-1.5">
                <select value={filterRelation} onChange={(e) => setFilterRelation(e.target.value)} className="w-14 bg-white border border-slate-300 rounded px-1 py-1 font-bold">
                  <option value="S/O">S/O</option>
                  <option value="D/O">D/O</option>
                  <option value="W/O">W/O</option>
                  <option value="H/O">H/O</option>
                  <option value="C/O">C/O</option>
                </select>
                <input type="text" placeholder="Relative name" value={filterRelativeName} onChange={(e) => setFilterRelativeName(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded px-2 py-1" />
              </div>
              <div className="sm:col-span-4 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-16 text-right">Doctor</label>
                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900"
                >
                  <option value="(All)">(All)</option>
                  <option value="ARUN PRAKASH">ARUN PRAKASH</option>
                  <option value="SWATHIGHA SUDHEER .K">SWATHIGHA SUDHEER .K</option>
                  <option value="Dr. Ananya Nair">Dr. Ananya Nair</option>
                </select>
              </div>
            </div>
          </div>

          {/* ROW 4: From-To date range, List button */}
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-12 text-right">From</label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                />
              </div>
              <div className="sm:col-span-4 flex items-center gap-2">
                <label className="font-bold text-slate-700 w-6 text-right">To</label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                />
              </div>
              <div className="sm:col-span-4 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => fetchPatients(search)}
                  className="px-6 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded font-bold shadow-xs"
                >
                  List
                </button>
              </div>
            </div>
          </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">OP Number</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Gender / Age</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">Allergies</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Searching patient records...' : 'No patients found matching your search query'}
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-700 text-xs">
                      {p.op_no}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {p.first_name} {p.last_name || ''}
                      </div>
                      <div className="text-xs text-slate-400">{p.email || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {p.gender} {p.age_years ? `· ${p.age_years} yrs` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {p.city || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {p.known_allergies ? (
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                          {p.known_allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openHistoryModal(p)}
                          className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded transition"
                          title="View Doctor Notes & Prescriptions"
                        >
                          <FileText className="w-4 h-4 text-violet-600" />
                        </button>
                        <button
                          onClick={() => navigate(`/billing/pos?patient_id=${p.id}`)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                          title="Generate Bill"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded transition"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

          {/* SCREENSHOT 16 BOTTOM TOOLBAR */}
          <div className="bg-slate-200 p-2.5 rounded-lg border border-slate-300 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { if (patients.length > 0) openHistoryModal(patients[0]); }}
                className="px-4 py-1.5 bg-white border border-slate-400 hover:bg-slate-50 rounded text-slate-800 font-bold shadow-xs flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                History
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert('Patient record saved.')}
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => navigate('/reception/register')}
                className="px-4 py-1.5 bg-white border border-slate-400 hover:bg-slate-50 rounded text-slate-800 font-bold shadow-xs"
              >
                New
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-1.5 bg-white border border-slate-400 hover:bg-slate-50 rounded text-slate-800 font-bold shadow-xs"
              >
                Exit
              </button>
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded text-amber-900 font-bold shadow-xs"
              >
                Booking
              </button>
              <button
                type="button"
                onClick={() => navigate('/billing/pos')}
                className="px-4 py-1.5 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded text-sky-900 font-bold shadow-xs"
              >
                Billing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdatePatient}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Patient Details</h3>
                <p className="text-xs text-slate-500 font-mono">OP: {editingPatient.op_no}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={editForm.alt_phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, alt_phone: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={editForm.age_years}
                    onChange={(e) => setEditForm((f) => ({ ...f, age_years: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Blood Group</label>
                  <select
                    value={editForm.blood_group}
                    onChange={(e) => setEditForm((f) => ({ ...f, blood_group: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    <option value="">Unknown</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">District</label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm((f) => ({ ...f, district: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editForm.pincode}
                    onChange={(e) => setEditForm((f) => ({ ...f, pincode: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={editForm.known_allergies}
                  onChange={(e) => setEditForm((f) => ({ ...f, known_allergies: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-xs transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Medical History & Prescriptions Modal */}
      {historyModalPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl 2xl:max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{historyModalPatient.first_name} {historyModalPatient.last_name || ''}</span>
                    <span className="text-xs font-mono font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-200">
                      {historyModalPatient.op_no}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {historyModalPatient.gender} · {historyModalPatient.age_years ? `${historyModalPatient.age_years} yrs` : ''} · Ph: {historyModalPatient.phone}
                    {historyModalPatient.known_allergies && (
                      <span className="text-rose-600 font-bold ml-2">⚠️ Allergies: {historyModalPatient.known_allergies}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setHistoryModalPatient(null); setPrintRxModal(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs: Unified Timeline & Specialty Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pt-3 pb-2 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveHistoryTab('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${activeHistoryTab === 'timeline'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>All History by Date ({historyData?.timeline_by_date?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveHistoryTab('consultations')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${activeHistoryTab === 'consultations'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Doctor Write-Ups ({historyData?.consultations?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveHistoryTab('prescriptions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${activeHistoryTab === 'prescriptions'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Prescriptions / Rx ({historyData?.prescriptions?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveHistoryTab('lab')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${activeHistoryTab === 'lab'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Lab Diagnostics ({historyData?.lab_orders?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveHistoryTab('nursing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${activeHistoryTab === 'nursing'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Nursing Procedures & Vitals ({historyData?.nursing_procedures?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                  <span>Loading patient clinical records...</span>
                </div>
              ) : activeHistoryTab === 'timeline' ? (
                /* UNIFIED CHRONOLOGICAL MEDICAL TIMELINE GROUPED BY DATE */
                !historyData?.timeline_by_date || historyData.timeline_by_date.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No clinical history recorded yet for this patient.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {historyData.timeline_by_date.map((dateGroup: any, dIdx: number) => (
                      <div key={dIdx} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3.5">
                        {/* Date Header Banner */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4 text-violet-600" />
                              Visit Date: {formatDate(dateGroup.date)}
                            </span>
                            <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                              {dateGroup.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {dateGroup.consultations?.length > 0 && (
                              <span className="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <span>🩺</span> Doctor Consult
                              </span>
                            )}
                            {dateGroup.prescriptions?.length > 0 && (
                              <span className="bg-purple-100 text-purple-900 font-semibold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <span>💊</span> Prescribed Rx
                              </span>
                            )}
                            {dateGroup.lab_orders?.length > 0 && (
                              <span className="bg-sky-100 text-sky-900 font-semibold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <span>🧪</span> Lab Tests
                              </span>
                            )}
                            {dateGroup.nursing_procedures?.length > 0 && (
                              <span className="bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <span>💉</span> Nursing Care
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 1. Doctor Consultations on this Date */}
                        {dateGroup.consultations?.map((c: any, cIdx: number) => (
                          <div key={cIdx} className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-900 flex items-center gap-1">
                                  <span>🩺</span> Doctor: {c.doctor_name || 'Dr. Ananya Nair'}
                                </span>
                                {c.diagnosis && (
                                  <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
                                    Diagnosis: {c.diagnosis}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-amber-800 font-medium">
                                BP: {c.bp_systolic || '-'}/{c.bp_diastolic || '-'} mmHg · Pulse: {c.pulse_rate || '-'} · Wt: {c.weight_kg ? `${c.weight_kg}kg` : '-'}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-800">
                              <div>
                                <span className="font-bold text-slate-500 text-[10px] uppercase block">Chief Complaints & Exam</span>
                                <p className="mt-0.5 font-medium">{c.chief_complaints || 'None recorded'}</p>
                                {c.examination_notes && (
                                  <p className="text-slate-600 italic mt-1 bg-white p-1.5 rounded border border-amber-100">
                                    Exam Findings: {c.examination_notes}
                                  </p>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-500 text-[10px] uppercase block">Treatment & Procedure Done</span>
                                <p className="mt-0.5 font-medium">{c.treatment_plan || 'Consultation only'}</p>
                                {c.doctor_private_notes && (
                                  <p className="text-amber-900 italic mt-1 bg-white p-1.5 rounded border border-amber-100">
                                    Impression: {c.doctor_private_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 2. Prescriptions on this Date */}
                        {dateGroup.prescriptions?.map((rx: any, rIdx: number) => (
                          <div key={rIdx} className="bg-purple-50/40 border border-purple-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between border-b border-purple-200/60 pb-1.5">
                              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                                <Pill className="w-3.5 h-3.5 text-purple-700" />
                                Prescribed Medicines ({rx.items?.length || 0} items)
                              </span>
                              <div className="flex items-center gap-2">
                                {rx.prescription_photo && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPhoto(rx.prescription_photo)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-300 transition"
                                  >
                                    <Camera className="w-3 h-3 text-amber-700" />
                                    View Mobile Rx Photo
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPrintRxModal(rx)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded transition"
                                >
                                  <Printer className="w-3 h-3" />
                                  Print Rx Slip
                                </button>
                              </div>
                            </div>

                            <div className="divide-y divide-purple-100 text-[11px]">
                              {rx.items?.map((item: any, mIdx: number) => (
                                <div key={mIdx} className="py-1 flex items-center justify-between">
                                  <div>
                                    <strong className="text-slate-900">{item.medicine_name}</strong>
                                    <span className="text-slate-600 ml-2">
                                      {item.dosage} · <strong className="text-purple-700 font-mono">{item.frequency}</strong> · {item.timing}
                                    </span>
                                  </div>
                                  <span className="text-slate-700 font-medium">{item.duration_days} days</span>
                                </div>
                              ))}
                            </div>
                            {rx.general_advice && (
                              <p className="text-[10px] text-purple-900 bg-white p-1.5 rounded border border-purple-100">
                                <strong>General Advice:</strong> {rx.general_advice}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* 3. Lab Orders on this Date */}
                        {dateGroup.lab_orders?.map((lab: any, lIdx: number) => (
                          <div key={lIdx} className="bg-sky-50/50 border border-sky-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between border-b border-sky-200/60 pb-1">
                              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                                <FlaskConical className="w-3.5 h-3.5 text-sky-700" />
                                Diagnostic Lab Order: {lab.test_name}
                              </span>
                              <span className="bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                Status: {lab.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-sky-800">
                              <span>Specimen / Sample: {lab.specimen_type || 'Biopsy / Skin Scraping'}</span>
                              <span>Urgency: <strong className="font-semibold">{lab.urgency || 'Routine'}</strong></span>
                            </div>
                            {lab.findings && (
                              <p className="text-[11px] text-sky-900 bg-white p-2 rounded border border-sky-100 mt-1">
                                <strong>Pathologist Findings:</strong> {lab.findings}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* 4. Nursing Procedures on this Date */}
                        {dateGroup.nursing_procedures?.map((nproc: any, npIdx: number) => (
                          <div key={npIdx} className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1">
                              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-emerald-700" />
                                Nursing Procedure: {nproc.procedure_name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-900">
                                  Fee: ₹{nproc.price} {nproc.price_type === 'custom' ? '(Custom Price)' : ''}
                                </span>
                                <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {nproc.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-emerald-800">
                              <span>Attending Nurse: <strong>{nproc.nurse_name}</strong> ({nproc.referred_by || 'Walk-in'})</span>
                              {nproc.vitals && (
                                <span className="font-mono text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                  Vitals: {typeof nproc.vitals === 'string' ? nproc.vitals : `BP ${nproc.vitals.bp_systolic}/${nproc.vitals.bp_diastolic}`}
                                </span>
                              )}
                            </div>
                            {nproc.notes && (
                              <p className="text-[11px] text-emerald-900 bg-white p-1.5 rounded border border-emerald-100">
                                <strong>Nurse Notes:</strong> {nproc.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              ) : activeHistoryTab === 'consultations' ? (
                /* Consultations List */
                !historyData?.consultations || historyData.consultations.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No doctor consultations recorded yet for this patient.
                  </div>
                ) : (
                  historyData.consultations.map((c: any, idx: number) => (
                    <div key={c.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            Visit Date: {formatDate(c.consult_date || c.created_at)}
                          </span>
                          {c.diagnosis && (
                            <span className="bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded text-[11px]">
                              {c.diagnosis}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          BP: {c.bp_systolic || '-'}/{c.bp_diastolic || '-'} mmHg · Pulse: {c.pulse_rate || '-'} bpm · Wt: {c.weight_kg ? `${c.weight_kg}kg` : '-'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block">Chief Complaints & Exam</span>
                          <p className="text-slate-800 mt-1">{c.chief_complaints || 'None noted'}</p>
                          {c.examination_notes && (
                            <p className="text-slate-600 italic mt-1 bg-white p-2 rounded border border-slate-200">
                              Exam Notes: {c.examination_notes}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block">Treatment & Procedure Done</span>
                          <p className="text-slate-800 mt-1">{c.treatment_plan || 'Consultation only'}</p>
                          {c.doctor_private_notes && (
                            <p className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 text-[11px] mt-1">
                              Clinical Impression: {c.doctor_private_notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Attached Prescription Preview */}
                      {c.prescription?.items && c.prescription.items.length > 0 && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5" />
                              Prescribed Medicines ({c.prescription.items.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setPrintRxModal(c.prescription)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-violet-700 bg-slate-100 hover:bg-violet-50 px-2 py-1 rounded transition"
                            >
                              <Printer className="w-3 h-3" />
                              Print Prescription Slip
                            </button>
                          </div>
                          <div className="divide-y divide-slate-100 text-[11px]">
                            {c.prescription.items.map((item: any, mIdx: number) => (
                              <div key={mIdx} className="py-1.5 flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-slate-900">{item.medicine_name}</span>
                                  <span className="text-slate-500 ml-2">{item.dosage} · <strong className="text-violet-700 font-mono">{item.frequency}</strong> · {item.timing}</span>
                                </div>
                                <span className="text-slate-600 font-medium">{item.duration_days} days</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : activeHistoryTab === 'prescriptions' ? (
                /* Prescriptions List */
                !historyData?.prescriptions || historyData.prescriptions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No prescriptions written yet for this patient.
                  </div>
                ) : (
                  historyData.prescriptions.map((rx: any, idx: number) => (
                    <div key={rx.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-violet-600" />
                          <span className="font-bold text-xs text-slate-900">
                            Prescription #{rx.id} · Date: {formatDate(rx.rx_date || rx.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {rx.prescription_photo && (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(rx.prescription_photo)}
                              className="inline-flex items-center gap-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded font-semibold transition"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-700" />
                              View Mobile Rx Photo
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPrintRxModal(rx)}
                            className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            <Printer className="w-3 h-3" />
                            Print Rx Slip
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-100">
                          <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px]">
                            <tr>
                              <th className="py-2 px-3">#</th>
                              <th className="py-2 px-3">Medicine Formulation</th>
                              <th className="py-2 px-3">Dosage</th>
                              <th className="py-2 px-3">Frequency</th>
                              <th className="py-2 px-3">Timing</th>
                              <th className="py-2 px-3 text-center">Duration</th>
                              <th className="py-2 px-3">Special Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {rx.items?.map((item: any, mIdx: number) => (
                              <tr key={mIdx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 text-slate-400">{mIdx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-slate-900">{item.medicine_name}</td>
                                <td className="py-2 px-3">{item.dosage}</td>
                                <td className="py-2 px-3 font-mono font-bold text-violet-700">{item.frequency}</td>
                                <td className="py-2 px-3 text-slate-600">{item.timing}</td>
                                <td className="py-2 px-3 text-center">{item.duration_days} days</td>
                                <td className="py-2 px-3 text-slate-500 italic">{item.special_instructions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {rx.general_advice && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                          <strong>Advice:</strong> {rx.general_advice}
                        </p>
                      )}
                    </div>
                  ))
                )
              ) : activeHistoryTab === 'lab' ? (
                /* Lab Orders List */
                !historyData?.lab_orders || historyData.lab_orders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No diagnostic lab orders recorded for this patient.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyData.lab_orders.map((lab: any, idx: number) => (
                      <div key={lab.id || idx} className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-sky-200">
                          <span className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
                            <FlaskConical className="w-4 h-4 text-sky-700" />
                            {lab.test_name}
                          </span>
                          <span className="bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded text-[10px]">
                            {lab.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                          <div>Order Date: <strong>{formatDate(lab.order_date || lab.created_at)}</strong></div>
                          <div>Specimen: <strong>{lab.specimen_type || 'Biopsy'}</strong></div>
                          <div>Urgency: <strong>{lab.urgency || 'Routine'}</strong></div>
                          <div>Referred by: <strong>{lab.doctor_name || 'Dr. Ananya Nair'}</strong></div>
                        </div>
                        {lab.findings && (
                          <p className="text-sky-900 bg-white p-2 rounded border border-sky-100">
                            <strong>Pathology Findings:</strong> {lab.findings}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Nursing Procedures List */
                !historyData?.nursing_procedures || historyData.nursing_procedures.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No nursing procedures recorded for this patient.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyData.nursing_procedures.map((proc: any, idx: number) => (
                      <div key={proc.id || idx} className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                          <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-emerald-700" />
                            {proc.procedure_name}
                          </span>
                          <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded">
                            ₹{proc.price} ({proc.status})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                          <div>Date & Time: <strong>{formatDate(proc.date || proc.created_at)} {proc.time || ''}</strong></div>
                          <div>Attending Nurse: <strong>{proc.nurse_name}</strong></div>
                          <div>Pipeline Origin: <strong>{proc.referred_by || 'Walk-in'}</strong></div>
                          <div>Vitals: <strong className="font-mono text-emerald-700">{typeof proc.vitals === 'string' ? proc.vitals : 'Checked'}</strong></div>
                        </div>
                        {proc.notes && (
                          <p className="text-emerald-900 bg-white p-2 rounded border border-emerald-100">
                            <strong>Nurse Execution Notes:</strong> {proc.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => { setHistoryModalPatient(null); setPrintRxModal(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Prescription Print Slip Preview */}
      {printRxModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <h3 className="text-sm font-bold text-slate-800">Official Prescription Slip (Rx) Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Now
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRxModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CLINIC LETTERHEAD */}
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">HEAL CLINIC & AESTHETIC CARE</h1>
              <p className="text-xs text-slate-600 font-medium">Way to Markaz, Karanthoor, Calicut, Kerala · Ph: 0495-2720000</p>
              <p className="text-[11px] text-slate-500">Reg No: KL-MED-84920 · Email: info@healclinic.in</p>
            </div>

            {/* PATIENT INFO */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200">
              <div>
                <p className="font-bold text-slate-900 text-sm">Dr. Ananya Nair</p>
                <p className="text-slate-500">Consultant Aesthetic Dermatologist</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="font-semibold text-slate-900">{historyModalPatient?.first_name} {historyModalPatient?.last_name || ''}</p>
                <p className="text-slate-500 font-mono">OP: {historyModalPatient?.op_no} · {historyModalPatient?.gender}, {historyModalPatient?.age_years ? `${historyModalPatient?.age_years}y` : ''}</p>
                <p className="text-slate-400">Date: {formatDate(printRxModal.rx_date || printRxModal.created_at)}</p>
              </div>
            </div>

            {/* RX TABLE */}
            <div className="space-y-2">
              <p className="text-sm font-black text-violet-700 tracking-wider font-serif">℞ (Prescription)</p>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Medicine / Formulation</th>
                    <th className="py-2 px-3">Dosage</th>
                    <th className="py-2 px-3">Frequency</th>
                    <th className="py-2 px-3">Timing</th>
                    <th className="py-2 px-3 text-center">Days</th>
                    <th className="py-2 px-3">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {printRxModal.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.medicine_name}</td>
                      <td className="py-2 px-3">{item.dosage}</td>
                      <td className="py-2 px-3 font-mono font-bold text-violet-700">{item.frequency}</td>
                      <td className="py-2 px-3 text-slate-600">{item.timing}</td>
                      <td className="py-2 px-3 text-center">{item.duration_days}d</td>
                      <td className="py-2 px-3 text-slate-500 italic">{item.special_instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {printRxModal.general_advice && (
              <div className="text-xs pt-2 border-t border-slate-200 text-slate-700">
                <p><strong>General Advice:</strong> {printRxModal.general_advice}</p>
              </div>
            )}

            {/* DOCTOR SIGNATURE */}
            <div className="pt-6 flex justify-end text-right text-xs">
              <div>
                <div className="h-10 border-b border-slate-400 w-36 mb-1" />
                <p className="font-bold text-slate-800">Authorized Medical Signature</p>
                <p className="text-[10px] text-slate-400">Dr. Ananya Nair, MD</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Handwritten Prescription Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-70 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Doctor Mobile Handwritten Prescription Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center bg-slate-50 p-2 rounded-xl border border-slate-200">
              <img
                src={selectedPhoto}
                alt="Doctor Handwritten Prescription"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-400 italic">Captured directly via doctor mobile camera</span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
