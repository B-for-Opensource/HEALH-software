import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles, Thermometer, Lock, FileSpreadsheet } from 'lucide-react';
import { medicinesApi } from '@/api';
import { getPharmacyStore } from '@/lib/pharmacyEnterpriseData';
import type { Medicine } from '@/types';

export default function MedicineMasterPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dosageFilter, setDosageFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'salts'>('catalog');

  // Enterprise Pharmacy Store for Salt Master & HSN codes
  const store = getPharmacyStore();

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
    hsn_code: '30049060',
    gst_rate: 12,
    is_schedule_h1: false,
    is_cold_chain: false,
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
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
        hsn_code: '30049060',
        gst_rate: 12,
        is_schedule_h1: false,
        is_cold_chain: false,
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
    <div className="p-4 sm:p-6 max-w-7xl 2xl:max-w-[1700px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
              Formulary &amp; Chemical Salt Architecture
            </span>
            <span className="text-xs text-stone-500 font-medium">HSN Classification &amp; India GST Slabs</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1 flex items-center gap-2">
            <Pill className="text-purple-700" size={26} />
            Medicine Formulary &amp; Chemical Salt Master
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Salt-to-Brand bioequivalent mapping, HSN Codes (3004 / 3304 / 3307), Indian GST tax rates, and Schedule H1 statutory classifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-purple-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Pill size={14} />
            Formulary Catalog ({medicines.length})
          </button>
          <button
            onClick={() => setActiveTab('salts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'salts'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Sparkles size={14} />
            Chemical Salt Families ({store.salts.length})
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            + Add Formulation
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by drug name, brand, or generic active molecule..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600">Dosage Form:</span>
              <select
                value={dosageFilter}
                onChange={(e) => setDosageFilter(e.target.value)}
                className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-white font-bold text-stone-800"
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
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Medicine Name</th>
                    <th className="py-3 px-4">Generic Molecule</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Form &amp; Strength</th>
                    <th className="py-3 px-4">Regulatory &amp; GST</th>
                    <th className="py-3 px-4">Default Frequency &amp; Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400 text-sm">
                        {loading ? 'Loading medicine catalog...' : 'No medicines found'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => {
                      const isH1 = (m.name || '').includes('Doxy') || (m.name || '').includes('Sotret') || (m.name || '').includes('Botox') || (m.generic_name || '').includes('Isotretinoin');
                      const isCold = (m.name || '').includes('Botox') || (m.name || '').includes('Juvederm') || (m.name || '').includes('Glutathione');
                      const isCosmeceutical = (m.name || '').includes('Sunscreen') || (m.name || '').includes('Serum') || (m.name || '').includes('Ahaglow');
                      const hsn = isCosmeceutical ? '33049990 (18% GST)' : '30049060 (12% GST)';

                      return (
                        <tr key={m.id} className="hover:bg-stone-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900 flex items-center gap-2">
                              <Pill className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span>{m.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-stone-600 font-mono">
                            {m.generic_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-stone-800">
                            {m.brand_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className="bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded mr-1">
                              {m.dosage_form}
                            </span>
                            <span className="text-stone-500">{m.strength}</span>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-800 font-bold">{hsn}</span>
                              {isH1 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                  H1
                                </span>
                              )}
                              {isCold && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                                  2-8°C
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-stone-700">
                            <span className="font-mono font-bold text-purple-800">{m.default_frequency} ({m.default_dosage})</span>
                            <span className="text-stone-400 ml-1">· {m.default_timing} ({m.route})</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHEMICAL SALTS HIERARCHY */}
      {activeTab === 'salts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {store.salts.map((salt) => (
            <div key={salt.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div>
                  <span className="font-mono font-black text-xs text-purple-900">{salt.id.toUpperCase()}</span>
                  <h3 className="font-black text-stone-900 text-sm mt-0.5">{salt.chemical_name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {salt.is_schedule_h1 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                      SCHEDULE H1
                    </span>
                  )}
                  {salt.is_cold_chain && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                      COLD CHAIN
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-stone-600 space-y-1">
                <div>Therapeutic Class: <strong>{salt.therapeutic_class}</strong></div>
                <div>HSN Code: <strong className="font-mono">{salt.hsn_code}</strong> · GST: <strong>{salt.gst_rate}%</strong></div>
              </div>

              {/* Mapped brand substitutes */}
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <div className="text-[11px] font-black text-stone-500 uppercase tracking-wider">
                  Associated Brand Formulations ({salt.substitute_brands.length})
                </div>
                {salt.substitute_brands.map((b, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{b.brand_name}</span>
                      <span className="text-[10px] text-stone-500 block">{b.manufacturer} · {b.dosage_form}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-black text-stone-900">₹{b.mrp.toFixed(2)}</span>
                      <span className="text-[10px] text-emerald-700 block font-bold">{b.in_stock_units} in stock</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MEDICINE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-700" />
                <h2 className="text-base font-black text-stone-900">Add Medicine Formulation</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg font-bold"
              >
                ✕
              </button>
            </div>

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                {message}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700">Formulation Name *</label>
                <input
                  type="text"
                  required
                  name="name"
                  placeholder="e.g. Doxt-SL 100mg"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Active Generic Molecule</label>
                  <input
                    type="text"
                    name="generic_name"
                    placeholder="e.g. Doxycycline Hyclate"
                    value={formData.generic_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-stone-200 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">Brand Name</label>
                  <input
                    type="text"
                    name="brand_name"
                    placeholder="e.g. Dr. Reddy"
                    value={formData.brand_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-stone-200 rounded-lg mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Dosage Form</label>
                  <select
                    name="dosage_form"
                    value={formData.dosage_form}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Cream">Cream</option>
                    <option value="Gel">Gel</option>
                    <option value="Lotion">Lotion</option>
                    <option value="Serum">Serum</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700">Strength</label>
                  <input
                    type="text"
                    name="strength"
                    placeholder="100mg / 0.05%"
                    value={formData.strength}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-stone-200 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">HSN Code</label>
                  <input
                    type="text"
                    name="hsn_code"
                    value={formData.hsn_code}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_schedule_h1"
                    checked={formData.is_schedule_h1}
                    onChange={handleInputChange}
                    className="rounded text-rose-600"
                  />
                  <span className="font-bold text-stone-800">Schedule H1 Drug</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_cold_chain"
                    checked={formData.is_cold_chain}
                    onChange={handleInputChange}
                    className="rounded text-sky-600"
                  />
                  <span className="font-bold text-stone-800">Cold Chain (2-8°C)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Formulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
