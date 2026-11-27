import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Building2, 
  Calculator, 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Plus, 
  ArrowRight, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  Layers, 
  Calendar,
  Sparkles,
  Barcode
} from 'lucide-react';
import { 
  getPharmacyStore, 
  savePharmacyStore, 
  subscribeToPharmacyUpdates,
  VelocityReorderItem,
  BonusSchemeCalc,
  GRNReconciliation 
} from '@/lib/pharmacyEnterpriseData';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ProcurementPOPage() {
  const [activeTab, setActiveTab] = useState<'velocity' | 'bonus_calc' | 'grn_reconciliation'>('velocity');
  const [store, setStore] = useState(getPharmacyStore());
  const [search, setSearch] = useState('');

  // Bonus Scheme Calculator Interactive Form State
  const [bonusForm, setBonusForm] = useState({
    item_name: 'Dolo 650 Strips',
    distributor_name: 'Medisync Pharma Distributors',
    standard_mrp: 33.50,
    standard_ptr: 24.00,
    base_quantity: 10,
    free_quantity: 2,
    gst_percent: 12,
  });

  // Calculate live bonus scheme results
  const calculateBonus = () => {
    const totalUnits = Number(bonusForm.base_quantity) + Number(bonusForm.free_quantity);
    const invoiceCostExGst = Number(bonusForm.base_quantity) * Number(bonusForm.standard_ptr);
    const gstAmount = invoiceCostExGst * (Number(bonusForm.gst_percent) / 100);
    const totalInvoiceLanded = invoiceCostExGst + gstAmount;

    // Standard unit landed if no free goods
    const standardUnitCost = (Number(bonusForm.standard_ptr) * (1 + Number(bonusForm.gst_percent) / 100));
    // Effective landed cost with free goods
    const effectiveLandedCost = totalInvoiceLanded / totalUnits;

    const marginStandardPct = ((Number(bonusForm.standard_mrp) - standardUnitCost) / Number(bonusForm.standard_mrp)) * 100;
    const marginEffectivePct = ((Number(bonusForm.standard_mrp) - effectiveLandedCost) / Number(bonusForm.standard_mrp)) * 100;
    const distributorSavings = (Number(bonusForm.free_quantity) * standardUnitCost);

    return {
      totalUnits,
      totalInvoiceLanded,
      standardUnitCost,
      effectiveLandedCost,
      marginStandardPct,
      marginEffectivePct,
      distributorSavings,
    };
  };

  const bonusResults = calculateBonus();

  const handleSaveBonusScheme = () => {
    const newScheme: BonusSchemeCalc = {
      item_name: bonusForm.item_name,
      distributor_name: bonusForm.distributor_name,
      standard_mrp: Number(bonusForm.standard_mrp),
      standard_ptr: Number(bonusForm.standard_ptr),
      base_quantity: Number(bonusForm.base_quantity),
      free_quantity: Number(bonusForm.free_quantity),
      gst_percent: Number(bonusForm.gst_percent),
      standard_unit_cost: Number(bonusResults.standardUnitCost.toFixed(2)),
      effective_landed_cost: Number(bonusResults.effectiveLandedCost.toFixed(2)),
      margin_standard_pct: Number(bonusResults.marginStandardPct.toFixed(1)),
      margin_effective_pct: Number(bonusResults.marginEffectivePct.toFixed(1)),
      distributor_savings: Number(bonusResults.distributorSavings.toFixed(2)),
    };

    const updatedStore = {
      ...store,
      bonusSchemes: [newScheme, ...store.bonusSchemes],
    };
    savePharmacyStore(updatedStore);
    setStore(updatedStore);
    alert(`✅ Scheme for "${bonusForm.item_name}" saved! Effective landed cost calculated at ${formatCurrency(bonusResults.effectiveLandedCost)}/unit (${bonusResults.marginEffectivePct.toFixed(1)}% margin).`);
  };

  const handleDraftPO = (item: VelocityReorderItem) => {
    alert(`📋 Draft Purchase Order created for ${item.primary_vendor}:\n\nItem: ${item.medicine_name}\nQuantity: ${item.suggested_order_qty} units\nEstimated PO Value: ${formatCurrency(item.estimated_cost)}\nLead Time: ${item.lead_time_days} days\n\nPO dispatched to procurement inbox!`);
  };

  const handleVerifyGRN = (grnId: string) => {
    const updated = store.grns.map((g) => {
      if (g.id === grnId) {
        return { ...g, reconciliation_status: 'verified' as const };
      }
      return g;
    });
    const updatedStore = { ...store, grns: updated };
    savePharmacyStore(updatedStore);
    setStore(updatedStore);
    alert('✅ GRN flagged discrepancies resolved and verified against warehouse ledger!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl 2xl:max-w-[1700px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Module 4 Enterprise Spec
            </span>
            <span className="text-xs text-stone-500 font-medium">Daily Moving Avg Velocity &amp; Vendor Lifecycle</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1 flex items-center gap-2">
            <Truck className="text-amber-700" size={26} />
            Procurement, Min-Max PO &amp; GRN Inward Reconciliation
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Automated consumption velocity reordering, free-goods / bonus scheme margin calculator, and invoice reconciliation with price-hike &amp; shelf-life flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'velocity'
                ? 'bg-amber-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <TrendingUp size={14} />
            Velocity &amp; Min-Max PO ({store.velocityReorders.length})
          </button>
          <button
            onClick={() => setActiveTab('bonus_calc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bonus_calc'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Calculator size={14} />
            Free-Goods Bonus Calculator
          </button>
          <button
            onClick={() => setActiveTab('grn_reconciliation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'grn_reconciliation'
                ? 'bg-indigo-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <FileCheck2 size={14} />
            GRN Inward Invoices ({store.grns.length})
          </button>
        </div>
      </div>

      {/* TAB 1: VELOCITY REORDER ENGINE */}
      {activeTab === 'velocity' && (
        <div className="space-y-4">
          <div className="bg-amber-900 text-amber-50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="font-black text-sm text-white">Daily Moving Average (DMA) Consumption Algorithm</div>
              <div className="text-xs text-amber-200 mt-0.5">
                Calculates daily run rates across Karanthoor, Calicut Beach Road, and Sulthan Bathery branches to automatically draft exact order quantities before stockouts happen.
              </div>
            </div>
            <button
              onClick={() => {
                alert(`🚀 Multi-Branch Consolidated PO Generated!\n\nDispatched 3 POs to Medisync, Apex Derma, and Allergan totaling ₹5,18,766 for 1,068 units.`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-white text-amber-950 hover:bg-amber-100 transition shadow-md shrink-0 cursor-pointer"
            >
              Draft All Suggested POs (₹5.18L)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3 px-4">Medicine &amp; Salt</th>
                    <th className="py-3 px-4 text-center">Daily Velocity (DMA)</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Min / Max Range</th>
                    <th className="py-3 px-4 text-center">Lead Time</th>
                    <th className="py-3 px-4 text-center">Suggested PO Qty</th>
                    <th className="py-3 px-4">Primary Distributor</th>
                    <th className="py-3 px-4 text-right">Est. Value</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {store.velocityReorders.map((item) => {
                    const isCritical = item.status === 'critical_reorder';
                    return (
                      <tr key={item.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{item.medicine_name}</div>
                          <div className="text-[10px] text-stone-500 italic">{item.salt_name}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-stone-700">
                          {item.daily_moving_avg} units/day
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black font-mono px-2 py-0.5 rounded-md ${
                              isCritical ? 'bg-red-100 text-red-900 border border-red-300' : 'text-stone-800'
                            }`}
                          >
                            {item.current_stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-stone-600">
                          {item.min_threshold} / {item.max_threshold}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-stone-600">
                          {item.lead_time_days} days
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                            +{item.suggested_order_qty}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-700 font-medium">
                          {item.primary_vendor}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                          {formatCurrency(item.estimated_cost)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDraftPO(item)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-black bg-amber-700 hover:bg-amber-600 text-white transition shadow-xs cursor-pointer"
                          >
                            Draft PO
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FREE-GOODS / BONUS SCHEME CALCULATOR */}
      {activeTab === 'bonus_calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Calculator Left Column */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                Pharma Deal Engine
              </span>
              <h2 className="text-lg font-black text-stone-900 mt-1 flex items-center gap-2">
                <Calculator className="text-emerald-700" size={20} />
                Bonus Scheme Calculator
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Accurately recalculates the effective landed unit cost when distributors offer free strips/tubes (e.g. Buy 10 Get 2 Free).
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700">Medicine / Product Name</label>
                <input
                  type="text"
                  value={bonusForm.item_name}
                  onChange={(e) => setBonusForm({ ...bonusForm, item_name: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700">Distributor Name</label>
                <input
                  type="text"
                  value={bonusForm.distributor_name}
                  onChange={(e) => setBonusForm({ ...bonusForm, distributor_name: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg font-medium mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Standard MRP (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bonusForm.standard_mrp}
                    onChange={(e) => setBonusForm({ ...bonusForm, standard_mrp: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">Standard PTR (Ex-GST) (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bonusForm.standard_ptr}
                    onChange={(e) => setBonusForm({ ...bonusForm, standard_ptr: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Billed Qty</label>
                  <input
                    type="number"
                    value={bonusForm.base_quantity}
                    onChange={(e) => setBonusForm({ ...bonusForm, base_quantity: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-emerald-800">Free Qty</label>
                  <input
                    type="number"
                    value={bonusForm.free_quantity}
                    onChange={(e) => setBonusForm({ ...bonusForm, free_quantity: Number(e.target.value) })}
                    className="w-full p-2 border border-emerald-300 bg-emerald-50 text-emerald-950 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">GST %</label>
                  <select
                    value={bonusForm.gst_percent}
                    onChange={(e) => setBonusForm({ ...bonusForm, gst_percent: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                  >
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              {/* Calculated Outputs Preview */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Total Landed Units:</span>
                  <span className="font-bold font-mono text-emerald-950">{bonusResults.totalUnits} Units</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Standard Landed Unit Cost:</span>
                  <span className="font-mono text-stone-700 line-through">{formatCurrency(bonusResults.standardUnitCost)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-900 font-bold">Effective Landed Cost / Unit:</span>
                  <span className="font-black font-mono text-sm text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded">
                    {formatCurrency(bonusResults.effectiveLandedCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600">Margin Boost:</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {bonusResults.marginStandardPct.toFixed(1)}% → {bonusResults.marginEffectivePct.toFixed(1)}% (+{(bonusResults.marginEffectivePct - bonusResults.marginStandardPct).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200">
                  <span className="text-stone-700 font-bold">Total Scheme Savings:</span>
                  <span className="font-black text-emerald-900 font-mono">{formatCurrency(bonusResults.distributorSavings)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveBonusScheme}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                Save Scheme to Master Catalog
              </button>
            </div>
          </div>

          {/* Saved Schemes Right Columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <h3 className="font-black text-stone-900 text-sm">Active Distributor Schemes &amp; Landed Margins</h3>
            <div className="space-y-3">
              {store.bonusSchemes.map((scheme, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{scheme.item_name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Buy {scheme.base_quantity} + {scheme.free_quantity} Free
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Distributor: <span className="font-medium text-stone-700">{scheme.distributor_name}</span> · {scheme.gst_percent}% GST
                    </div>
                    <div className="text-xs text-stone-600 mt-2 flex items-center gap-3">
                      <span>Standard Cost: <del>{formatCurrency(scheme.standard_unit_cost)}</del></span>
                      <span className="font-black text-emerald-900">
                        Effective Cost: {formatCurrency(scheme.effective_landed_cost)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-stone-200 sm:pl-4 shrink-0">
                    <div className="text-xs text-stone-500 font-medium">Realized Profit Margin</div>
                    <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">
                      {scheme.margin_effective_pct}%
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Saves {formatCurrency(scheme.distributor_savings)}/order
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GRN & INVOICE RECONCILIATION */}
      {activeTab === 'grn_reconciliation' && (
        <div className="space-y-4">
          <div className="bg-indigo-950 text-indigo-50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="font-black text-sm text-white">Three-Way Inward Match (PO ↔ Delivery ↔ Vendor Invoice)</div>
              <div className="text-xs text-indigo-200 mt-0.5">
                Automatically detects price hikes against contracted PO rates, short-received quantities, and batches with less than 6 months shelf life before inventory entry.
              </div>
            </div>
            <button
              onClick={() => {
                alert(`📷 Barcode Scan Simulator Triggered!\n\nScanned batch DX-2026-11B on Bay A. Checked shelf-life (22 months OK), Rate ₹92.00 matches PO-2026-092.`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-500 hover:bg-indigo-400 text-white transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Barcode size={15} />
              Simulate Barcode Inward Scan
            </button>
          </div>

          <div className="space-y-4">
            {store.grns.map((grn) => {
              const isHike = grn.reconciliation_status === 'price_hike_flagged';
              const isShort = grn.reconciliation_status === 'short_qty_flagged';
              return (
                <div
                  key={grn.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 ${
                    isHike
                      ? 'border-red-300 ring-2 ring-red-100'
                      : isShort
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-stone-900 text-sm">{grn.grn_no}</span>
                        <span className="text-xs font-mono text-stone-500">Ref: {grn.po_no}</span>
                        <span className="text-xs font-mono text-stone-500">Inv: {grn.invoice_no}</span>
                      </div>
                      <div className="text-xs text-stone-600 mt-0.5">
                        Supplier: <span className="font-bold text-stone-800">{grn.distributor_name}</span> · {formatDate(grn.invoice_date)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-base text-stone-900">
                        {formatCurrency(grn.total_amount)}
                      </span>
                      {grn.reconciliation_status === 'verified' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Verified OK
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyGRN(grn.id)}
                          className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 hover:bg-emerald-100 hover:text-emerald-800 border border-red-300 transition cursor-pointer flex items-center gap-1"
                        >
                          <AlertTriangle size={13} />
                          Discrepancy Flagged (Click to Resolve)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-stone-500 font-bold border-b border-stone-100">
                          <th className="py-2">Item &amp; Batch</th>
                          <th className="py-2 text-center">Shelf Life</th>
                          <th className="py-2 text-center">PO Qty</th>
                          <th className="py-2 text-center">Received Qty</th>
                          <th className="py-2 text-right">PO Rate</th>
                          <th className="py-2 text-right">Invoice Rate</th>
                          <th className="py-2 text-right">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {grn.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50/50">
                            <td className="py-2.5 font-medium text-stone-900">
                              {item.item_name}
                              <span className="font-mono text-stone-500 block text-[10px]">
                                Batch: {item.batch_no} · Exp: {formatDate(item.expiry_date)}
                              </span>
                              {item.flag && (
                                <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md inline-block mt-1">
                                  ⚠️ {item.flag}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-center font-mono">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {item.shelf_life_months} mos
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-stone-700">{item.po_qty}</td>
                            <td className="py-2.5 text-center font-mono font-bold">
                              <span className={item.received_qty < item.po_qty ? 'text-red-700 font-black' : 'text-stone-900'}>
                                {item.received_qty}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-mono text-stone-600">{formatCurrency(item.po_rate)}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-stone-900">{formatCurrency(item.invoice_rate)}</td>
                            <td className="py-2.5 text-right font-mono font-bold">
                              {item.price_variance > 0 ? (
                                <span className="text-red-700">+{formatCurrency(item.price_variance)}</span>
                              ) : (
                                <span className="text-emerald-700">₹0.00</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
