import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Clock, 
  Thermometer, 
  ShieldAlert, 
  Plus, 
  Syringe, 
  Activity, 
  Sparkles, 
  Calendar, 
  Building2, 
  ArrowUpDown, 
  FileText,
  Filter
} from 'lucide-react';
import { 
  getPharmacyStore, 
  savePharmacyStore, 
  subscribeToPharmacyUpdates,
  EnterpriseBatch,
  VialSplittingRecord 
} from '@/lib/pharmacyEnterpriseData';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BatchInventoryPage() {
  const [activeTab, setActiveTab] = useState<'fefo' | 'vial_splitting' | 'cold_chain'>('fefo');
  const [store, setStore] = useState(getPharmacyStore());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical_30' | 'warning_60' | 'review_90' | 'healthy'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'schedule_h1' | 'cold_chain' | 'aesthetic'>('all');

  // Vial draw-down modal state
  const [selectedVial, setSelectedVial] = useState<VialSplittingRecord | null>(null);
  const [drawForm, setDrawForm] = useState({
    patient_op: 'OP-1060',
    patient_name: 'Priya Nambiar',
    doctor_name: 'Dr. Ananya Nair',
    units_drawn: 20,
    target_area: 'Glabellar Frown Lines',
    notes: 'Reconstituted with 2.5ml saline, drawn via 30G needle',
  });

  // Reconstitute new vial modal state
  const [showNewVialModal, setShowNewVialModal] = useState(false);
  const [newVialForm, setNewVialForm] = useState({
    vial_code: `VIAL-BTX-${Math.floor(100 + Math.random() * 900)}`,
    batch_no: 'BX-ALL-9901',
    drug_name: 'BOTOX Cosmetic 100U (Allergan)',
    total_units: 100,
    reconstituted_by: 'Staff Nurse Priyamvada',
    saline_volume_ml: 2.5,
    cold_chain_temp_c: 3.4,
  });

  useEffect(() => {
    const unsub = subscribeToPharmacyUpdates(() => {
      setStore(getPharmacyStore());
    });
    return unsub;
  }, []);

  const handleRecordDraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVial) return;
    if (drawForm.units_drawn > selectedVial.remaining_units) {
      alert(`Cannot draw ${drawForm.units_drawn} units. Only ${selectedVial.remaining_units} units remain in this vial.`);
      return;
    }

    const updatedRemaining = selectedVial.remaining_units - drawForm.units_drawn;
    const newDrawLog = {
      id: `draw-${Date.now()}`,
      patient_op: drawForm.patient_op,
      patient_name: drawForm.patient_name,
      doctor_name: drawForm.doctor_name,
      units_drawn: Number(drawForm.units_drawn),
      target_area: drawForm.target_area,
      timestamp: new Date().toLocaleString(),
      notes: drawForm.notes,
    };

    const updatedVials = store.vialSplits.map((v) => {
      if (v.id === selectedVial.id) {
        return {
          ...v,
          used_units: v.used_units + Number(drawForm.units_drawn),
          remaining_units: updatedRemaining,
          status: updatedRemaining === 0 ? ('exhausted' as const) : ('active' as const),
          draw_logs: [newDrawLog, ...v.draw_logs],
        };
      }
      return v;
    });

    const updatedStore = { ...store, vialSplits: updatedVials };
    savePharmacyStore(updatedStore);
    setStore(updatedStore);
    setSelectedVial(null);
    alert(`✅ Logged ${drawForm.units_drawn} Units drawn for ${drawForm.patient_name} (${drawForm.patient_op}). Remaining in vial: ${updatedRemaining} Units.`);
  };

  const handleCreateVial = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const newVial: VialSplittingRecord = {
      id: `vial-${Date.now()}`,
      vial_code: newVialForm.vial_code,
      batch_no: newVialForm.batch_no,
      drug_name: newVialForm.drug_name,
      total_units: Number(newVialForm.total_units),
      used_units: 0,
      remaining_units: Number(newVialForm.total_units),
      reconstituted_at: now.toLocaleString(),
      reconstituted_by: newVialForm.reconstituted_by,
      saline_volume_ml: Number(newVialForm.saline_volume_ml),
      stability_expiry_at: expiry.toLocaleString(),
      cold_chain_temp_c: Number(newVialForm.cold_chain_temp_c),
      status: 'active',
      draw_logs: [],
    };

    const updatedStore = { ...store, vialSplits: [newVial, ...store.vialSplits] };
    savePharmacyStore(updatedStore);
    setStore(updatedStore);
    setShowNewVialModal(false);
    alert(`✅ New vial ${newVial.vial_code} reconstituted successfully with ${newVial.saline_volume_ml}ml saline! 24-hr stability clock initiated.`);
  };

  const filteredBatches = store.batches.filter((b) => {
    const matchSearch =
      (b.medicine_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.batch_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.salt_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.rack_location || '').toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || b.expiry_status === statusFilter;
    const matchCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'schedule_h1' && b.is_schedule_h1) ||
      (categoryFilter === 'cold_chain' && b.is_cold_chain) ||
      (categoryFilter === 'aesthetic' && b.is_aesthetic_injectable);

    return matchSearch && matchStatus && matchCategory;
  });

  // Sort batches strictly FEFO (First Expiry First Out)
  const sortedBatches = [...filteredBatches].sort((a, b) => a.days_to_expiry - b.days_to_expiry);

  const criticalCount = store.batches.filter((b) => b.expiry_status === 'critical_30').length;
  const warningCount = store.batches.filter((b) => b.expiry_status === 'warning_60').length;
  const reviewCount = store.batches.filter((b) => b.expiry_status === 'review_90').length;
  const activeVialCount = store.vialSplits.filter((v) => v.status === 'active').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl 2xl:max-w-[1700px] mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Module 4 & 5 Enterprise Spec
            </span>
            <span className="text-xs text-stone-500 font-medium">FEFO Sorting · First Expiry First Out</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1 flex items-center gap-2">
            <Layers className="text-emerald-700" size={26} />
            FEFO Batch Inventory & Aesthetic Vial Splitting
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Real-time batch audit, 90/60/30-day expiry radar, multi-patient Botox/filler unit draw-down, and cold-chain stability monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('fefo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fefo'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Clock size={14} />
            FEFO Expiry Radar ({store.batches.length})
          </button>
          <button
            onClick={() => setActiveTab('vial_splitting')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'vial_splitting'
                ? 'bg-purple-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Syringe size={14} />
            Vial Splitting Tracker ({activeVialCount} Open)
          </button>
          <button
            onClick={() => setActiveTab('cold_chain')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cold_chain'
                ? 'bg-sky-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Thermometer size={14} />
            Cold-Chain (2°C–8°C)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-xs font-bold uppercase tracking-wider">Critical (&lt;30 Days)</span>
            <AlertTriangle size={18} />
          </div>
          <div className="text-2xl font-black text-red-900 mt-2">{criticalCount} Batches</div>
          <div className="text-[11px] text-red-700 mt-1">Eligible for Immediate Expiry Return Memo</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Warning (31–60 Days)</span>
            <Clock size={18} />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{warningCount} Batches</div>
          <div className="text-[11px] text-amber-700 mt-1">Prioritize for First-Out Dispensing</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-yellow-700">
            <span className="text-xs font-bold uppercase tracking-wider">Review (61–90 Days)</span>
            <Calendar size={18} />
          </div>
          <div className="text-2xl font-black text-yellow-900 mt-2">{reviewCount} Batches</div>
          <div className="text-[11px] text-yellow-700 mt-1">Audit distributor credit eligibility</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold uppercase tracking-wider">Active Split Vials</span>
            <Sparkles size={18} />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2">{activeVialCount} In Use</div>
          <div className="text-[11px] text-purple-700 mt-1">Botox &amp; Fillers under 24h stability clock</div>
        </div>
      </div>

      {/* TAB 1: FEFO BATCH RADAR */}
      {activeTab === 'fefo' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-stone-50/50">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={15} />
              <input
                type="text"
                placeholder="Search batch #, drug, salt, rack..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
                <Filter size={12} /> Expiry:
              </span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-stone-800"
              >
                <option value="all">All Expiry Windows</option>
                <option value="critical_30">&lt; 30 Days (Critical Return)</option>
                <option value="warning_60">31–60 Days (Warning)</option>
                <option value="review_90">61–90 Days (Review)</option>
                <option value="healthy">&gt; 90 Days (Healthy)</option>
              </select>

              <span className="text-xs font-bold text-stone-600 ml-2">Type:</span>
              <select
                value={categoryFilter}
                onChange={(e: any) => setCategoryFilter(e.target.value)}
                className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-stone-800"
              >
                <option value="all">All Categories</option>
                <option value="schedule_h1">Schedule H1 Drugs Only</option>
                <option value="cold_chain">Cold-Chain (2–8°C) Only</option>
                <option value="aesthetic">Aesthetic Injectables Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold">
                  <th className="py-3 px-4">FEFO Expiry Rank</th>
                  <th className="py-3 px-4">Batch # &amp; Location</th>
                  <th className="py-3 px-4">Drug &amp; Chemical Salt</th>
                  <th className="py-3 px-4">HSN / Tax</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-right">Landed Cost</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4 text-center">Expiry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sortedBatches.map((b, idx) => {
                  let badge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Healthy ({b.days_to_expiry}d)
                    </span>
                  );
                  if (b.expiry_status === 'critical_30') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300 animate-pulse">
                        ⚠️ Critical ({b.days_to_expiry}d)
                      </span>
                    );
                  } else if (b.expiry_status === 'warning_60') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                        Warning ({b.days_to_expiry}d)
                      </span>
                    );
                  } else if (b.expiry_status === 'review_90') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-800 border border-yellow-300">
                        Review ({b.days_to_expiry}d)
                      </span>
                    );
                  }

                  return (
                    <tr key={b.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-stone-500">
                        #{idx + 1}
                        <span className="text-[10px] text-stone-400 block">{formatDate(b.expiry_date)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 font-mono">{b.batch_no}</div>
                        <div className="text-[10px] text-stone-500 font-medium">{b.rack_location}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          {b.medicine_name}
                          {b.is_schedule_h1 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              SCH-H1
                            </span>
                          )}
                          {b.is_cold_chain && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                              2-8°C
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 italic">{b.salt_name} · {b.manufacturer}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                        {b.hsn_code}
                        <span className="text-[10px] block text-emerald-700 font-bold">{b.gst_rate}% GST</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-stone-900 text-sm">{b.stock_qty}</span>
                        <span className="text-[10px] text-stone-500 block">{b.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-stone-700">
                        {formatCurrency(b.purchase_rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(b.mrp)}
                      </td>
                      <td className="py-3 px-4 text-center">{badge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AESTHETIC VIAL SPLITTING TRACKER */}
      {activeTab === 'vial_splitting' && (
        <div className="space-y-6">
          <div className="bg-purple-900 text-purple-100 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-950 uppercase tracking-wider">
                  Aesthetic Clinic Feature
                </span>
                <span className="text-xs text-purple-200">Botulinum Toxin &amp; High-Value Injectables</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">Multi-Patient Vial Splitting &amp; Stability Audit</h2>
              <p className="text-xs text-purple-200 mt-1 max-w-2xl">
                A single 100-Unit vial of Botox (₹18,500) is split across multiple patients (e.g. 28U Glabella, 36U Masseters).
                Enforces a strict 24-hour stability clock from saline reconstitution, cold-chain temperature logging, and per-patient dosage accountability.
              </p>
            </div>

            <button
              onClick={() => setShowNewVialModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-stone-950 transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
            >
              <Plus size={15} />
              Reconstitute New Vial
            </button>
          </div>

          {/* Vials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {store.vialSplits.map((vial) => {
              const pctUsed = Math.round((vial.used_units / vial.total_units) * 100);
              return (
                <div
                  key={vial.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
                    vial.status === 'active' ? 'border-purple-300 ring-2 ring-purple-100' : 'border-stone-200 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
                          {vial.vial_code}
                        </span>
                        <span className="text-xs font-mono text-stone-500">Batch: {vial.batch_no}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                          vial.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {vial.status === 'active' ? '● Open & Reconstituted' : 'Exhausted'}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-stone-900">{vial.drug_name}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Reconstituted with {vial.saline_volume_ml}ml saline by {vial.reconstituted_by} at {vial.reconstituted_at}
                    </p>

                    {/* Stability Clock Alert */}
                    <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-purple-900 font-bold">
                        <Clock size={16} className="text-purple-700" />
                        <span>Stability Clock (24h Max):</span>
                      </div>
                      <span className="font-mono font-black text-purple-950">Valid until {vial.stability_expiry_at}</span>
                    </div>

                    {/* Cold Chain Fridge Temp */}
                    <div className="mt-2 flex items-center justify-between text-xs text-stone-600 px-1">
                      <span className="flex items-center gap-1.5">
                        <Thermometer size={14} className="text-sky-600" />
                        Fridge Storage:
                      </span>
                      <span className="font-bold text-sky-800 font-mono">{vial.cold_chain_temp_c}°C (Nominal 2–8°C)</span>
                    </div>

                    {/* Progress Bar of Units Used */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700">Units Drawn / Available</span>
                        <span className="font-black text-purple-900">
                          {vial.used_units} / {vial.total_units} Units ({pctUsed}% consumed)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
                        <div
                          className="bg-purple-600 h-full transition-all duration-500"
                          style={{ width: `${pctUsed}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-stone-500">
                        <span>Used: {vial.used_units} Units</span>
                        <span className="text-emerald-700 font-black">Remaining: {vial.remaining_units} Units</span>
                      </div>
                    </div>

                    {/* Draw logs */}
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <div className="text-[11px] font-black text-stone-600 uppercase tracking-wider mb-2">
                        Patient Consumption Ledger ({vial.draw_logs.length} injections)
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {vial.draw_logs.map((log) => (
                          <div
                            key={log.id}
                            className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-stone-900">
                                {log.patient_name} <span className="font-mono text-stone-500">({log.patient_op})</span>
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {log.target_area} · {log.doctor_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                {log.units_drawn} Units
                              </span>
                              <div className="text-[9px] text-stone-400 mt-0.5">{log.timestamp.split(',')[1] || log.timestamp}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  {vial.status === 'active' && vial.remaining_units > 0 && (
                    <button
                      onClick={() => {
                        setSelectedVial(vial);
                        setDrawForm((prev) => ({
                          ...prev,
                          units_drawn: Math.min(20, vial.remaining_units),
                        }));
                      }}
                      className="mt-4 w-full py-2 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-600 text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Syringe size={14} />
                      Log Patient Draw-Down ({vial.remaining_units} Units Left)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COLD CHAIN MONITORING */}
      {activeTab === 'cold_chain' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Thermometer className="text-sky-600" size={22} />
                Dispensary Cold-Chain Refrigerator Audit (2°C – 8°C)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Automated continuous temperature logging for Botulinum Toxins, Dermal Fillers, and IV Glutathione kits.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={13} />
              All Refrigerator Sensors Normal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2">
              <div className="flex items-center justify-between text-sky-900 font-bold text-xs">
                <span>Dispensary Cold Fridge #1</span>
                <span className="font-mono text-emerald-700">ONLINE</span>
              </div>
              <div className="text-3xl font-black text-sky-950 font-mono">3.4°C</div>
              <p className="text-[11px] text-stone-600">
                Contents: Botox Cosmetic 100U (8 Vials), Glutathione 600mg (28 Ampoules)
              </p>
              <div className="text-[10px] text-stone-500">Last calibrated: 2026-11-20 by Biomedical Engineering</div>
            </div>

            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2">
              <div className="flex items-center justify-between text-sky-900 font-bold text-xs">
                <span>Aesthetic Procedure Room #2 Fridge</span>
                <span className="font-mono text-emerald-700">ONLINE</span>
              </div>
              <div className="text-3xl font-black text-sky-950 font-mono">4.1°C</div>
              <p className="text-[11px] text-stone-600">
                Contents: Juvederm VOLUMA XC 1ml (6 Syringes), Restylane Defyne (5 Syringes)
              </p>
              <div className="text-[10px] text-stone-500">Last calibrated: 2026-11-18 by Biomedical Engineering</div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between text-stone-700 font-bold text-xs">
                <span>Backup Battery &amp; Generator</span>
                <span className="font-mono text-emerald-700">STANDBY 100%</span>
              </div>
              <div className="text-3xl font-black text-stone-900 font-mono">230V / 50Hz</div>
              <p className="text-[11px] text-stone-600">
                Automatic UPS changeover within 12 milliseconds in event of grid power trip.
              </p>
              <div className="text-[10px] text-stone-500">Tested 48 hours ago · Battery health 98%</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Unit Draw */}
      {selectedVial && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-black text-stone-900 text-base">Draw Units from {selectedVial.vial_code}</h3>
                <p className="text-xs text-stone-500">{selectedVial.drug_name} · Remaining: {selectedVial.remaining_units} Units</p>
              </div>
              <button
                onClick={() => setSelectedVial(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordDraw} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700">Patient OP Number &amp; Name</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <input
                    type="text"
                    required
                    value={drawForm.patient_op}
                    onChange={(e) => setDrawForm({ ...drawForm, patient_op: e.target.value })}
                    className="p-2 border border-stone-200 rounded-lg font-mono font-bold"
                    placeholder="OP-1042"
                  />
                  <input
                    type="text"
                    required
                    value={drawForm.patient_name}
                    onChange={(e) => setDrawForm({ ...drawForm, patient_name: e.target.value })}
                    className="col-span-2 p-2 border border-stone-200 rounded-lg font-bold"
                    placeholder="Patient Full Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Units to Inject</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedVial.remaining_units}
                    required
                    value={drawForm.units_drawn}
                    onChange={(e) => setDrawForm({ ...drawForm, units_drawn: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold text-purple-900 mt-1"
                  />
                  <span className="text-[10px] text-stone-500">Max available: {selectedVial.remaining_units} Units</span>
                </div>
                <div>
                  <label className="font-bold text-stone-700">Treating Aesthetician / Doctor</label>
                  <select
                    value={drawForm.doctor_name}
                    onChange={(e) => setDrawForm({ ...drawForm, doctor_name: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                  >
                    <option value="Dr. Ananya Nair">Dr. Ananya Nair (Derm / Reg #TCMC-49812)</option>
                    <option value="Dr. Rohit Sharma">Dr. Rohit Sharma (Cosmetic Surg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Target Anatomical Area</label>
                <input
                  type="text"
                  required
                  value={drawForm.target_area}
                  onChange={(e) => setDrawForm({ ...drawForm, target_area: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg font-medium mt-1"
                  placeholder="e.g. Glabellar Frown Lines, Forehead Rhytids, Masseters"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700">Clinical / Needle Notes</label>
                <input
                  type="text"
                  value={drawForm.notes}
                  onChange={(e) => setDrawForm({ ...drawForm, notes: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg font-medium mt-1"
                  placeholder="e.g. Drawn via 30G 8mm needle with sterile technique"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVial(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black shadow-md transition"
                >
                  Confirm Draw &amp; Deduct Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reconstitute New Vial */}
      {showNewVialModal && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-black text-stone-900 text-base">Reconstitute New Aesthetic Vial</h3>
                <p className="text-xs text-stone-500">Initiate cold-chain 24-hour stability tracking</p>
              </div>
              <button
                onClick={() => setShowNewVialModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVial} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Vial Tracking Code</label>
                  <input
                    type="text"
                    required
                    value={newVialForm.vial_code}
                    onChange={(e) => setNewVialForm({ ...newVialForm, vial_code: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">Source Batch No</label>
                  <input
                    type="text"
                    required
                    value={newVialForm.batch_no}
                    onChange={(e) => setNewVialForm({ ...newVialForm, batch_no: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Injectable Drug Name</label>
                <select
                  value={newVialForm.drug_name}
                  onChange={(e) => setNewVialForm({ ...newVialForm, drug_name: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                >
                  <option value="BOTOX Cosmetic 100U (Allergan)">BOTOX Cosmetic 100U (Allergan)</option>
                  <option value="Dysport 300U (Galderma)">Dysport 300U (Galderma)</option>
                  <option value="Nabota 100U (Daewoong)">Nabota 100U (Daewoong)</option>
                  <option value="Gluta-Inject 600mg Ampoule">Gluta-Inject 600mg Ampoule</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Total Units</label>
                  <input
                    type="number"
                    required
                    value={newVialForm.total_units}
                    onChange={(e) => setNewVialForm({ ...newVialForm, total_units: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">Saline Vol (ml)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newVialForm.saline_volume_ml}
                    onChange={(e) => setNewVialForm({ ...newVialForm, saline_volume_ml: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">Fridge Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newVialForm.cold_chain_temp_c}
                    onChange={(e) => setNewVialForm({ ...newVialForm, cold_chain_temp_c: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Reconstituted By (Staff / Nurse)</label>
                <input
                  type="text"
                  required
                  value={newVialForm.reconstituted_by}
                  onChange={(e) => setNewVialForm({ ...newVialForm, reconstituted_by: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewVialModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-black shadow-md transition"
                >
                  Initialize Vial Clock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
