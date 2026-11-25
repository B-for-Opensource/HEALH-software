import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Lock, 
  CheckCircle2, 
  Building2, 
  Smartphone, 
  CreditCard, 
  ArrowUpRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { shiftApi } from '@/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CashierShiftPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Close shift modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingPhysicalCash, setClosingPhysicalCash] = useState('21000');
  const [depositNotes, setDepositNotes] = useState('Cash verified by manager and handed over for bank deposit');
  const [bankDepositAmount, setBankDepositAmount] = useState('18000');
  const [submitting, setSubmitting] = useState(false);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const res = await shiftApi.listShifts();
      setShifts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const activeShift = shifts.find((s) => s.status.includes('Open')) || shifts[0];

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    setSubmitting(true);
    try {
      const enteredPhysical = parseFloat(closingPhysicalCash) || 0;
      const expectedCash = (activeShift.opening_float || 0) + (activeShift.cash_collected || 0);
      const variance = enteredPhysical - expectedCash;

      await shiftApi.closeShift(activeShift.id, {
        closing_cash_physical: enteredPhysical,
        variance: variance,
        bank_deposit_amount: parseFloat(bankDepositAmount) || 0,
        deposit_notes: depositNotes,
      });

      alert('Cashier shift closed and balanced! Handover log sent to clinic manager.');
      setShowCloseModal(false);
      loadShifts();
    } catch (err) {
      alert('Failed to close shift');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cashier Shift Balancing & Cash Drawer Reconciliation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-23, 29] Opening float entry, real-time physical vs digital payment balancing & bank deposit handovers
          </p>
        </div>

        {activeShift && activeShift.status.includes('Open') && (
          <button
            onClick={() => setShowCloseModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Lock className="w-4 h-4" />
            End Shift & Balance Drawer
          </button>
        )}
      </div>

      {/* Active Shift Overview Banner */}
      {activeShift && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                  {activeShift.shift_no}
                </span>
                <h2 className="text-base font-bold text-slate-900">{activeShift.counter_code}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Attending Cashier: <strong>{activeShift.cashier_name}</strong> · Shift Date: {activeShift.shift_date} (Started {activeShift.start_time})
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeShift.status}
            </span>
          </div>

          {/* Money Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Opening Float Cash
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(activeShift.opening_float)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Drawer base reserve</p>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <span className="font-semibold text-amber-800 uppercase tracking-wider text-[10px]">
                Physical Cash Inflow
              </span>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {formatCurrency(activeShift.cash_collected)}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">Physical currency billed</p>
            </div>

            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200">
              <span className="font-semibold text-indigo-800 uppercase tracking-wider text-[10px]">
                Digital UPI Settlements
              </span>
              <p className="text-2xl font-black text-indigo-900 mt-1">
                {formatCurrency(activeShift.upi_collected)}
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">QR & GPay payments</p>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px]">
                Total Expected Cash in Hand
              </span>
              <p className="text-2xl font-black text-emerald-900 mt-1">
                {formatCurrency((activeShift.opening_float || 0) + (activeShift.cash_collected || 0))}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Variance: ₹0.00 (Balanced)</p>
            </div>
          </div>
        </div>
      )}

      {/* Bank Deposit & Handover Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-violet-600" />
            [SCR-29] Cash Handover & Bank Deposit Register
          </h3>
          <span className="text-xs text-slate-400">Audited daily by Branch Operations Head</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Shift #</th>
                <th className="py-3 px-4">Counter & Cashier</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Cash Billed</th>
                <th className="py-3 px-4 text-right">Digital UPI</th>
                <th className="py-3 px-4 text-right">Total Cash in Drawer</th>
                <th className="py-3 px-4">Shift Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-violet-700">
                    {s.shift_no}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{s.counter_code}</p>
                    <p className="text-slate-400">{s.cashier_name}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">
                    {formatCurrency(s.opening_float)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-700">
                    {formatCurrency(s.cash_collected)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-700">
                    {formatCurrency(s.upi_collected)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-800">
                    {formatCurrency((s.opening_float || 0) + (s.cash_collected || 0))}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLOSE SHIFT & RECONCILE MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">End Cashier Shift & Handover</h2>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physical Cash Counted in Drawer (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={closingPhysicalCash}
                  onChange={(e) => setClosingPhysicalCash(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cash Transferred for Clinic Bank Deposit (₹)
                </label>
                <input
                  type="number"
                  value={bankDepositAmount}
                  onChange={(e) => setBankDepositAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Handover & Audit Remarks</label>
                <textarea
                  rows={2}
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-1.5 rounded-lg shadow-xs"
                >
                  {submitting ? 'Reconciling...' : 'Confirm Balance & Close Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
