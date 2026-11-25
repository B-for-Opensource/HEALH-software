import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Building2, 
  FileCheck, 
  ArrowRightLeft, 
  Plus, 
  Package, 
  Layers, 
  Clock,
  X
} from 'lucide-react';
import { inventoryApi } from '@/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ProcurementInventoryPage() {
  const [activeTab, setActiveTab] = useState<'transfers' | 'pos' | 'vendors'>('transfers');
  const [vendors, setVendors] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_branch: 'HEAL Clinic — Karanthoor (Main)',
    to_branch: 'HEAL Clinic — Sulthan Bathery Wayanad',
    items: '',
    dispatched_by: 'Staff',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [vRes, pRes, tRes] = await Promise.all([
        inventoryApi.listVendors(),
        inventoryApi.listPOs(),
        inventoryApi.listTransfers(),
      ]);
      setVendors(Array.isArray(vRes) ? vRes : []);
      setPos(Array.isArray(pRes) ? pRes : []);
      setTransfers(Array.isArray(tRes) ? tRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.items) return;
    await inventoryApi.createTransfer(transferForm);
    alert('Stock transfer requisition created and dispatched!');
    setShowTransferModal(false);
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Procurement & Clinic Consumables Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-34, 35, 36, 37, 38] Central warehouse stock, vendor directory, PO/GRN inwards & inter-branch transfer dispatcher
          </p>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg p-1">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'transfers' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inter-Branch Transfers
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'pos' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Orders & GRN
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'vendors' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vendors & Suppliers
          </button>
        </div>
      </div>

      {activeTab === 'transfers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-violet-600" />
                [SCR-38] Inter-Branch Stock Requisition & Transfer Dispatcher
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch peel solutions, laser tips & cosmeceuticals between Karanthoor, Beach Rd & Wayanad
              </p>
            </div>

            <button
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              + Create Stock Transfer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Transfer #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Origin Branch</th>
                  <th className="py-3 px-4">Destination Branch</th>
                  <th className="py-3 px-4">Transferred Consumables & Items</th>
                  <th className="py-3 px-4">Dispatched By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-violet-700">
                      {t.transfer_no}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(t.dispatch_date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {t.from_branch}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {t.to_branch}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      {t.items}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {t.dispatched_by}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status.includes('Delivered')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-violet-600" />
                [SCR-35, 36] Purchase Orders (PO) & Goods Receipt Notes (GRN)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Procurement tracking, batch pricing & landed cost recording</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Consumables Summary</th>
                  <th className="py-3 px-4 text-right">Order Value</th>
                  <th className="py-3 px-4">GRN Inward Ref</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-violet-700">
                      {p.po_no}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.vendor_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(p.order_date)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      {p.items_summary}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(p.total_amount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.grn_no}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-600" />
                [SCR-34] Approved Vendor & Supplier Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Pharma distributors, laser consumables & skincare brand vendors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-slate-50/40">
                <div className="flex items-start justify-between">
                  <p className="font-bold text-slate-900 text-sm">{v.name}</p>
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                    {v.rating}
                  </span>
                </div>
                <p className="text-slate-600">Contact: {v.contact_person} · {v.phone}</p>
                <p className="text-slate-500 font-mono text-[11px]">GSTIN: {v.gst_in}</p>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500">
                  <span>Location: {v.city}</span>
                  <span className="font-bold text-slate-700">{v.credit_days} Days Credit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Dispatch Inter-Branch Stock</h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">From Origin Branch *</label>
                <select
                  value={transferForm.from_branch}
                  onChange={(e) => setTransferForm((f) => ({ ...f, from_branch: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="HEAL Clinic — Karanthoor (Main)">HEAL Clinic — Karanthoor (Main Warehouse)</option>
                  <option value="HEAL Clinic — Beach Road Calicut">HEAL Clinic — Beach Road Calicut</option>
                  <option value="HEAL Clinic — Sulthan Bathery Wayanad">HEAL Clinic — Sulthan Bathery Wayanad</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Branch *</label>
                <select
                  value={transferForm.to_branch}
                  onChange={(e) => setTransferForm((f) => ({ ...f, to_branch: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="HEAL Clinic — Sulthan Bathery Wayanad">HEAL Clinic — Sulthan Bathery Wayanad</option>
                  <option value="HEAL Clinic — Beach Road Calicut">HEAL Clinic — Beach Road Calicut</option>
                  <option value="HEAL Clinic — Karanthoor (Main)">HEAL Clinic — Karanthoor (Main Warehouse)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Items / Consumables Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Salicylic 20% Peels (4 bottles), Neutralizer 1L (2), Biopsy punches (20)"
                  value={transferForm.items}
                  onChange={(e) => setTransferForm((f) => ({ ...f, items: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-1.5 rounded-lg shadow-xs"
                >
                  Generate Dispatch Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
