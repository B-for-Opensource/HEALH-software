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
  ChevronRight
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
  const [activeHistoryTab, setActiveHistoryTab] = useState<'consultations' | 'prescriptions'>('consultations');
  const [printRxModal, setPrintRxModal] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
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
      email: p.email || '',
      city: p.city || '',
      address: p.address || '',
      known_allergies: p.known_allergies || '',
    });
  };

  const openHistoryModal = async (p: Patient) => {
    setHistoryModalPatient(p);
    setHistoryLoading(true);
    setActiveHistoryTab('consultations');
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Master Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete database of registered outpatients across Karanthoor, Calicut Beach & Wayanad branches
          </p>
        </div>
        <button
          onClick={() => navigate('/reception/register')}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          + Register New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by OP Number (e.g. KRN-00001), Patient Name, Phone or City..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
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
                  <label className="block font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
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
              </div>

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
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

            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pt-3 pb-2 shrink-0">
              <button
                onClick={() => setActiveHistoryTab('consultations')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeHistoryTab === 'consultations'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Doctor Write-Ups & Consultations ({historyData?.consultations?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveHistoryTab('prescriptions')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeHistoryTab === 'prescriptions'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Prescribed Medicines / Rx ({historyData?.prescriptions?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                  <span>Loading patient clinical records...</span>
                </div>
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
              ) : (
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
                        <button
                          type="button"
                          onClick={() => setPrintRxModal(rx)}
                          className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1 rounded-lg text-xs font-semibold transition"
                        >
                          <Printer className="w-3 h-3" />
                          Print Rx Slip
                        </button>
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
    </div>
  );
}
