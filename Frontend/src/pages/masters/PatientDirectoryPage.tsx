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
  AlertCircle
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
    </div>
  );
}
