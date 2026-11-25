import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { medicinesApi } from '@/api';
import type { Medicine } from '@/types';

export default function MedicineMasterPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dosageFilter, setDosageFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    brand_name: '',
    dosage_form: 'Tablet',
    strength: '',
    unit: 'Tab',
    default_dosage: '1 Tab',
    default_frequency: '1-0-1',
    default_timing: 'After Food',
    route: 'Oral',
  });

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const res = await medicinesApi.list();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setMedicines(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setSubmitting(true);
    try {
      await medicinesApi.create(formData);
      setMessage('Medicine added to catalog successfully!');
      setFormData({
        name: '',
        generic_name: '',
        brand_name: '',
        dosage_form: 'Tablet',
        strength: '',
        unit: 'Tab',
        default_dosage: '1 Tab',
        default_frequency: '1-0-1',
        default_timing: 'After Food',
        route: 'Oral',
      });
      await loadMedicines();
      setTimeout(() => {
        setShowModal(false);
        setMessage(null);
      }, 1500);
    } catch (err) {
      alert('Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.generic_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.brand_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesForm = dosageFilter === 'all' || m.dosage_form === dosageFilter;
    return matchesSearch && matchesForm;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Medicine & Formulation Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pharmacy formulary, dosage recommendations & topical skincare catalog
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          + Add New Formulation
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by drug name, brand, or generic active molecule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Dosage Form:</span>
          <select
            value={dosageFilter}
            onChange={(e) => setDosageFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">All Forms</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Cream">Cream</option>
            <option value="Gel">Gel</option>
            <option value="Lotion">Lotion</option>
            <option value="Serum">Serum</option>
            <option value="Facewash">Facewash</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-4">Generic Molecule</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Form & Strength</th>
                <th className="py-3 px-4">Default Frequency</th>
                <th className="py-3 px-4">Timing & Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Loading medicine catalog...' : 'No medicines found'}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <Pill className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-mono">
                      {m.generic_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                      {m.brand_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded mr-1">
                        {m.dosage_form}
                      </span>
                      <span className="text-slate-500">{m.strength}</span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono font-medium text-violet-700">
                      {m.default_frequency} ({m.default_dosage})
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <span>{m.default_timing}</span>
                      <span className="text-slate-400 ml-1">· {m.route}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MEDICINE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold text-slate-900">Add Medicine Formulation</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Doxycycline 100mg"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic Molecule</label>
                  <input
                    type="text"
                    name="generic_name"
                    value={formData.generic_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Doxycycline Hyclate"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Doxt-SL"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    name="dosage_form"
                    value={formData.dosage_form}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Cream">Cream</option>
                    <option value="Gel">Gel</option>
                    <option value="Lotion">Lotion</option>
                    <option value="Serum">Serum</option>
                    <option value="Facewash">Facewash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Strength</label>
                  <input
                    type="text"
                    name="strength"
                    value={formData.strength}
                    onChange={handleInputChange}
                    placeholder="e.g. 100mg / 20%"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Route</label>
                  <select
                    name="route"
                    value={formData.route}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Topical">Topical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Dosage</label>
                  <input
                    type="text"
                    name="default_dosage"
                    value={formData.default_dosage}
                    onChange={handleInputChange}
                    placeholder="1 Tab / Pea size"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    name="default_frequency"
                    value={formData.default_frequency}
                    onChange={handleInputChange}
                    placeholder="1-0-1 / 0-0-1"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Timing</label>
                  <input
                    type="text"
                    name="default_timing"
                    value={formData.default_timing}
                    onChange={handleInputChange}
                    placeholder="After Food / Night"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save to Formulary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
