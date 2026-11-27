import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Plus, 
  ArrowRight, 
  Clock, 
  Receipt, 
  Truck, 
  Download,
  Building2,
  Calendar
} from 'lucide-react';
import { 
  getPharmacyStore, 
  savePharmacyStore, 
  subscribeToPharmacyUpdates,
  ExpiryReturnDebitNote,
  EnterpriseBatch
} from '@/lib/pharmacyEnterpriseData';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ExpiryReturnsPage() {
  const [store, setStore] = useState(getPharmacyStore());
  const [activeTab, setActiveTab] = useState<'debit_notes' | 'eligible_batches'>('debit_notes');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [vendorSelect, setVendorSelect] = useState('Medisync Pharma Distributors');

  useEffect(() => {
    const unsub = subscribeToPharmacyUpdates(() => {
      setStore(getPharmacyStore());
    });
    return unsub;
  }, []);

  // Batches within 90 days of expiry eligible for return
  const eligibleBatches = store.batches.filter((b) => b.days_to_expiry <= 90);

  const toggleSelectBatch = (id: string) => {
    if (selectedBatches.includes(id)) {
      setSelectedBatches(selectedBatches.filter((bId) => bId !== id));
    } else {
      setSelectedBatches([...selectedBatches, id]);
    }
  };

  const handleGenerateDebitNote = () => {
    if (selectedBatches.length === 0) {
      alert('Please select at least one near-expiry batch to generate a Debit Note.');
      return;
    }

    const batchesToReturn = store.batches.filter((b) => selectedBatches.includes(b.id));
    let totalClaim = 0;
    const memoBatches = batchesToReturn.map((b) => {
      const lineVal = b.stock_qty * b.purchase_rate;
      totalClaim += lineVal;
      return {
        batch_no: b.batch_no,
        item_name: b.medicine_name,
        expiry_date: b.expiry_date,
        return_qty: b.stock_qty,
        landed_rate: b.purchase_rate,
        total_value: lineVal,
      };
    });

    const newDebitNote: ExpiryReturnDebitNote = {
      id: `dn-${Date.now()}`,
      debit_note_no: `DN-EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
      distributor_name: vendorSelect,
      distributor_gstin: '32AABCM4590K1Z4',
      created_at: new Date().toISOString().split('T')[0],
      total_claim_amount: totalClaim,
      status: 'dispatched_to_vendor',
      credit_note_ref: 'Debit note dispatched; awaiting vendor credit memo',
      batches: memoBatches,
    };

    // Deduct stock of returned batches from batches inventory
    const updatedBatches = store.batches.map((b) => {
      if (selectedBatches.includes(b.id)) {
        return { ...b, stock_qty: 0 };
      }
      return b;
    });

    const updatedStore = {
      ...store,
      batches: updatedBatches,
      expiryReturns: [newDebitNote, ...store.expiryReturns],
    };

    savePharmacyStore(updatedStore);
    setStore(updatedStore);
    setSelectedBatches([]);
    setActiveTab('debit_notes');
    alert(`📄 Expiry Return Debit Note ${newDebitNote.debit_note_no} created for ${vendorSelect} totaling ${formatCurrency(totalClaim)}!\n\nBatches removed from active inventory and moved to Return Hold.`);
  };

  const handleUpdateStatus = (dnId: string, newStatus: ExpiryReturnDebitNote['status'], ref: string) => {
    const updated = store.expiryReturns.map((dn) => {
      if (dn.id === dnId) {
        return { ...dn, status: newStatus, credit_note_ref: ref };
      }
      return dn;
    });
    const updatedStore = { ...store, expiryReturns: updated };
    savePharmacyStore(updatedStore);
    setStore(updatedStore);
    alert('✅ Credit note adjustment updated and reconciled in financial ledger!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl 2xl:max-w-[1700px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
              Module 4 Enterprise Spec
            </span>
            <span className="text-xs text-stone-500 font-medium">90/60/30-Day Expiry Sweeps &amp; Vendor Credit Recovery</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1 flex items-center gap-2">
            <FileText className="text-rose-700" size={26} />
            Expiry Returns &amp; Distributor Debit Notes
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Identify near-expiry pharmaceutical batches, dispatch official Debit Note Return Memos, and reconcile distributor credit adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('debit_notes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'debit_notes'
                ? 'bg-rose-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Receipt size={14} />
            Dispatched Debit Notes ({store.expiryReturns.length})
          </button>
          <button
            onClick={() => setActiveTab('eligible_batches')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'eligible_batches'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <AlertTriangle size={14} />
            Returnable Near-Expiry Batches ({eligibleBatches.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DEBIT NOTES LIST */}
      {activeTab === 'debit_notes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-xs font-bold text-stone-500 uppercase">Total Expiry Value Claimed</div>
              <div className="text-2xl font-black text-stone-900 font-mono mt-1">
                {formatCurrency(store.expiryReturns.reduce((acc, dn) => acc + dn.total_claim_amount, 0))}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">{store.expiryReturns.length} Distributor Debit Notes Raised</div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-xs font-bold text-emerald-800 uppercase">Settled Credit Notes</div>
              <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
                {formatCurrency(
                  store.expiryReturns
                    .filter((dn) => dn.status === 'credit_note_received' || dn.status === 'adjusted_in_po')
                    .reduce((acc, dn) => acc + dn.total_claim_amount, 0)
                )}
              </div>
              <div className="text-[11px] text-emerald-800 mt-1">Directly adjusted against fresh invoice POs</div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="text-xs font-bold text-amber-800 uppercase">Pending Distributor Action</div>
              <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                {formatCurrency(
                  store.expiryReturns
                    .filter((dn) => dn.status === 'dispatched_to_vendor')
                    .reduce((acc, dn) => acc + dn.total_claim_amount, 0)
                )}
              </div>
              <div className="text-[11px] text-amber-800 mt-1">Under distributor physical verification</div>
            </div>
          </div>

          <div className="space-y-4">
            {store.expiryReturns.map((dn) => (
              <div key={dn.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-rose-950">{dn.debit_note_no}</span>
                      <span className="text-xs text-stone-500 font-mono">Date: {formatDate(dn.created_at)}</span>
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      Distributor: <span className="font-bold text-stone-900">{dn.distributor_name}</span> · GSTIN: <span className="font-mono">{dn.distributor_gstin}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-lg text-stone-900">
                      {formatCurrency(dn.total_claim_amount)}
                    </span>
                    {dn.status === 'credit_note_received' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Credit Note Received
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            dn.id,
                            'credit_note_received',
                            `CN-${Math.floor(1000 + Math.random() * 9000)} (Full credit acknowledged)`
                          )
                        }
                        className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 hover:bg-emerald-100 hover:text-emerald-900 border border-amber-300 transition cursor-pointer flex items-center gap-1"
                      >
                        <Clock size={13} />
                        Pending Pickup (Click to Mark Settled)
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-stone-600 font-medium">
                  Ledger Reference: <span className="font-mono text-stone-800">{dn.credit_note_ref}</span>
                </div>

                {/* Returned Batches List */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-stone-500 font-bold border-b border-stone-100">
                        <th className="py-2">Returned Item &amp; Batch</th>
                        <th className="py-2 text-center">Batch Expiry</th>
                        <th className="py-2 text-center">Returned Qty</th>
                        <th className="py-2 text-right">Landed Unit Rate</th>
                        <th className="py-2 text-right">Total Claim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {dn.batches.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-medium text-stone-900">
                            {item.item_name}
                            <span className="font-mono text-stone-500 block text-[10px]">Batch: {item.batch_no}</span>
                          </td>
                          <td className="py-2 text-center font-mono text-rose-800 font-bold">{formatDate(item.expiry_date)}</td>
                          <td className="py-2 text-center font-mono font-bold text-stone-800">{item.return_qty}</td>
                          <td className="py-2 text-right font-mono text-stone-600">{formatCurrency(item.landed_rate)}</td>
                          <td className="py-2 text-right font-mono font-bold text-stone-900">{formatCurrency(item.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NEAR-EXPIRY RETURNABLE BATCHES */}
      {activeTab === 'eligible_batches' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-black text-stone-900">Select Batches to Generate Return Memo</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Batches expiring in &le; 90 days are flagged for vendor return before absolute shelf expiration.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={vendorSelect}
                onChange={(e) => setVendorSelect(e.target.value)}
                className="text-xs p-2 border border-stone-200 rounded-xl font-bold bg-stone-50 text-stone-900"
              >
                <option value="Medisync Pharma Distributors">Medisync Pharma Distributors</option>
                <option value="Apex Derma Logistics">Apex Derma Logistics</option>
                <option value="Sun Care Distributors Calicut">Sun Care Distributors Calicut</option>
              </select>

              <button
                onClick={handleGenerateDebitNote}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-700 hover:bg-rose-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus size={14} />
                Generate Debit Note ({selectedBatches.length} Selected)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/70 text-stone-600 font-bold border-b border-stone-200">
                  <th className="py-3 px-4 text-center">Select</th>
                  <th className="py-3 px-4">Medicine &amp; Batch</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Days to Expiry</th>
                  <th className="py-3 px-4 text-center">Returnable Stock</th>
                  <th className="py-3 px-4 text-right">Landed Cost</th>
                  <th className="py-3 px-4 text-right">Claim Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {eligibleBatches.map((b) => {
                  const selected = selectedBatches.includes(b.id);
                  const claimVal = b.stock_qty * b.purchase_rate;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => toggleSelectBatch(b.id)}
                      className={`cursor-pointer transition ${selected ? 'bg-rose-50/80' : 'hover:bg-stone-50/60'}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {}} // Controlled by row click
                          className="w-4 h-4 rounded text-rose-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{b.medicine_name}</div>
                        <div className="font-mono text-[10px] text-stone-500">Batch: {b.batch_no} · {b.manufacturer}</div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{b.rack_location}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 font-mono">
                          {b.days_to_expiry} days left
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">
                        {b.stock_qty} {b.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-600">
                        {formatCurrency(b.purchase_rate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-950">
                        {formatCurrency(claimVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
