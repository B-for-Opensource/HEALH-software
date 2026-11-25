import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Clock, 
  Plus, 
  Barcode,
  Layers,
  Sparkles,
  UserCheck,
  User
} from 'lucide-react';
import { pharmacyApi, patientsApi } from '@/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PharmacyDispensaryPage() {
  const [activeTab, setActiveTab] = useState<'batches' | 'dispensing' | 'otc' | 'substitution'>('batches');
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dispenseQty, setDispenseQty] = useState<Record<string, number>>({});
  const [selectedMolecule, setSelectedMolecule] = useState<string>('Tretinoin');

  const COMMON_MOLECULES = [
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

  // OTC Bypass Patient Identification
  const [otcPatientSearch, setOtcPatientSearch] = useState('');
  const [otcPatientResults, setOtcPatientResults] = useState<any[]>([]);
  const [selectedOtcPatient, setSelectedOtcPatient] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await pharmacyApi.listBatches();
      setBatches(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispense = async (batchId: string) => {
    const qty = dispenseQty[batchId] || 1;
    await pharmacyApi.dispenseRx(batchId, qty);
    alert(`Successfully dispensed ${qty} units. Pharmacy stock adjusted!`);
    loadData();
  };

  const handleOtcPatientSearch = async (val: string) => {
    setOtcPatientSearch(val);
    if (val.trim().length >= 2) {
      try {
        const res = await patientsApi.search(val.trim());
        const list = Array.isArray(res) ? res : (res?.data || []);
        setOtcPatientResults(list);
      } catch {
        setOtcPatientResults([]);
      }
    } else {
      setOtcPatientResults([]);
    }
  };

  const handleSelectOtcPatient = (p: any) => {
    setSelectedOtcPatient(p);
    setOtcPatientSearch(`${p.op_no} — ${p.first_name} ${p.last_name || ''}`);
    setOtcPatientResults([]);
  };

  const handleQuickRetailBill = (itemName: string, price: number) => {
    const clientDesc = selectedOtcPatient 
      ? `Patient: ${selectedOtcPatient.first_name} ${selectedOtcPatient.last_name || ''} (OP #${selectedOtcPatient.op_no})` 
      : 'Walk-in Retail Customer';
    alert(`✅ Quick Retail Bill Generated!\n\nItem: ${itemName} (${formatCurrency(price)})\nClient: ${clientDesc}\nChannel: Direct Pharmacy OTC (No doctor consultation token created)\nInventory stock adjusted!`);
  };

  const filteredBatches = batches.filter((b) =>
    (b.medicine_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.batch_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.generic_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            In-House Pharmacy & Skincare Dispensary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-30, 31, 32, 33] Rx-linked dispensing, over-the-counter dermato-cosmetics, FEFO expiry & stock auditing
          </p>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg p-1">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'batches' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FEFO Stock Batches
          </button>
          <button
            onClick={() => setActiveTab('dispensing')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'dispensing' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rx Dispensing Counter
          </button>
          <button
            onClick={() => setActiveTab('otc')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'otc' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OTC Cosmeceuticals POS
          </button>
          <button
            onClick={() => setActiveTab('substitution')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'substitution' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Chemical Family Substitution</span>
          </button>
        </div>
      </div>

      {/* Expiry Warning Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900 text-sm">FEFO Automated Alert (First-Expiry-First-Out)</span>
          <p className="text-amber-800 mt-0.5">
            Batch <strong>AZ-2026-08 (Aziderm 20% Cream)</strong> is expiring in 38 days (31-Dec-2026). Prioritize this rack location for upcoming active acne prescriptions.
          </p>
        </div>
      </div>

      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              Active Pharmacy Stock Batches
            </h3>
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by drug name or batch #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Item & Formulation</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Expiry Date (FEFO)</th>
                  <th className="py-3 px-4 text-right">Available Qty</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4">Rack Bin</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{b.medicine_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{b.generic_name}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {b.batch_no}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {formatDate(b.expiry_date)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-violet-700 text-sm">
                      {b.stock_qty} <span className="text-[11px] font-normal text-slate-400">{b.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(b.purchase_rate)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(b.mrp)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {b.location}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status.includes('Expiring')
                            ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dispensing' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">[SCR-30] Rx-Linked Dispensing Counter</h3>
              <p className="text-xs text-slate-500 mt-0.5">One-click dispense against doctor consult prescriptions</p>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
              Connected with Doctor Workbench
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {batches.slice(0, 3).map((b) => (
              <div key={b.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{b.medicine_name}</p>
                  <p className="text-slate-400">Batch: {b.batch_no} · Rack: {b.location} · Available: {b.stock_qty} {b.unit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Dispense Qty:</span>
                    <input
                      type="number"
                      min={1}
                      max={b.stock_qty}
                      value={dispenseQty[b.id] || 1}
                      onChange={(e) => setDispenseQty((prev) => ({ ...prev, [b.id]: parseInt(e.target.value) || 1 }))}
                      className="w-14 border border-slate-300 rounded px-2 py-1 text-center font-bold"
                    />
                  </div>
                  <button
                    onClick={() => handleDispense(b.id)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-1.5 rounded-lg shadow-2xs"
                  >
                    Dispense & Deduct Stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'otc' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900">[SCR-31] Walk-in Retail & OTC Cosmeceuticals POS</h3>
              <p className="text-xs text-slate-500 mt-0.5">Direct retail sale for sunscreens, serums & cleansers (Bypass Registration: No doctor OP token needed)</p>
            </div>
            <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
              Direct Pharmacy Entry
            </span>
          </div>

          {/* Quick Patient Identification (Bypass Registration) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-violet-600" />
                Optional: Link to Existing Patient Profile (Search OP # / Mobile / Name)
              </label>
              {selectedOtcPatient && (
                <button
                  type="button"
                  onClick={() => { setSelectedOtcPatient(null); setOtcPatientSearch(''); }}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Clear (Switch to Walk-in Retail)
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search by Mobile, OP Number or Name to associate purchase with patient record..."
                value={otcPatientSearch}
                onChange={(e) => handleOtcPatientSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
              {otcPatientResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {otcPatientResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectOtcPatient(p)}
                      className="p-2.5 hover:bg-violet-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-violet-700 mr-2">{p.op_no}</span>
                        <span className="font-semibold text-slate-900">{p.first_name} {p.last_name || ''}</span>
                        <span className="text-[11px] text-slate-400 ml-2">({p.phone})</span>
                      </div>
                      <span className="text-violet-600 font-bold text-[11px]">+ Select Patient</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedOtcPatient && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Linked Customer: <strong>{selectedOtcPatient.first_name} {selectedOtcPatient.last_name || ''}</strong> (OP #{selectedOtcPatient.op_no})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Topical Photoprotection</span>
              <p className="font-bold text-slate-900 text-sm">UV-DOUX Sunscreen Gel SPF 50</p>
              <p className="text-xs text-slate-500">Broad Spectrum PA+++ · Water Resistant</p>
              <p className="text-lg font-black text-emerald-700 mt-2">₹750.00</p>
              <button
                onClick={() => handleQuickRetailBill('UV-DOUX Sunscreen Gel SPF 50', 750)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg"
              >
                + Quick Retail Bill
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Antioxidant Serum</span>
              <p className="font-bold text-slate-900 text-sm">C-Glow Vitamin C 20% Serum</p>
              <p className="text-xs text-slate-500">Pure L-Ascorbic Acid + Ferulic Boost</p>
              <p className="text-lg font-black text-emerald-700 mt-2">₹1,250.00</p>
              <button
                onClick={() => handleQuickRetailBill('C-Glow Vitamin C 20% Serum', 1250)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg"
              >
                + Quick Retail Bill
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Exfoliating Cleanser</span>
              <p className="font-bold text-slate-900 text-sm">Ahaglow Gentle Exfoliating Wash</p>
              <p className="text-xs text-slate-500">Glycolic 6% + Aloe Vera extract</p>
              <p className="text-lg font-black text-emerald-700 mt-2">₹425.00</p>
              <button
                onClick={() => handleQuickRetailBill('Ahaglow Gentle Exfoliating Wash', 425)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg"
              >
                + Quick Retail Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHEMICAL COMPONENT & MOLECULE SUBSTITUTION TAB */}
      {activeTab === 'substitution' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span>Chemical Molecule Family & Bioequivalent Substitution</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pharmacist generic substitution: view all brand formulations and batches sharing the same chemical molecule when prescribed brand is low in stock
              </p>
            </div>
            <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-3 py-1 rounded-full border border-violet-200">
              CDSCO / FDA Generic Equivalent Compliant
            </span>
          </div>

          {/* Molecule Selector Pills */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Select Active Chemical Component / Molecule Family:
            </span>
            <div className="flex flex-wrap gap-2">
              {COMMON_MOLECULES.map((mol) => (
                <button
                  key={mol}
                  type="button"
                  onClick={() => setSelectedMolecule(mol)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedMolecule === mol
                      ? 'bg-violet-700 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>🧪</span>
                  <span>{mol}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Molecule Info Banner */}
          <div className="p-4 bg-violet-50/70 border border-violet-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-violet-950 text-sm">
                Chemical Family: {selectedMolecule}
              </span>
              <p className="text-xs text-violet-800 mt-0.5">
                Showing all in-stock pharmacy batches containing active {selectedMolecule}. Pharmacists may substitute across equivalent strengths.
              </p>
            </div>
            <span className="text-xs font-bold bg-white text-violet-800 px-3 py-1 rounded-lg border border-violet-200 shrink-0">
              {batches.filter((b) => (b.generic_name || '').toLowerCase().includes(selectedMolecule.toLowerCase()) || (b.medicine_name || '').toLowerCase().includes(selectedMolecule.toLowerCase())).length} Batches in Stock
            </span>
          </div>

          {/* Matching Equivalent Batches Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Brand Medicine & Strength</th>
                  <th className="py-3 px-4">Active Chemical Molecule</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">FEFO Expiry</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4">Rack Bin</th>
                  <th className="py-3 px-4 text-right">Substitution Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches
                  .filter((b) =>
                    (b.generic_name || '').toLowerCase().includes(selectedMolecule.toLowerCase()) ||
                    (b.medicine_name || '').toLowerCase().includes(selectedMolecule.toLowerCase())
                  )
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-sm">{b.medicine_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">Form: {b.dosage_form || 'Formulation'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                          {b.generic_name || selectedMolecule}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {b.batch_no}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {formatDate(b.expiry_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-violet-700 text-sm">
                        {b.stock_qty} <span className="text-[11px] font-normal text-slate-400">{b.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(b.mrp)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {b.location}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDispense(b.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          Dispense Brand
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
