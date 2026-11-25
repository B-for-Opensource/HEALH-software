import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  CreditCard, 
  Smartphone,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { billingApi } from '@/api';
import type { Bill } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LedgerPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Settle modal state
  const [settleBill, setSettleBill] = useState<Bill | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState('UPI');
  const [settling, setSettling] = useState(false);

  // View modal state
  const [viewBill, setViewBill] = useState<Bill | null>(null);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await billingApi.list();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setBills(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleOpenSettle = (b: Bill) => {
    setSettleBill(b);
    setSettleAmount(b.balance_due?.toString() || '0');
    setSettleMode('UPI');
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleBill) return;
    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setSettling(true);
    try {
      await billingApi.pay(settleBill.id, {
        amount: amt,
        payment_mode: settleMode,
      });
      alert(`Payment of ${formatCurrency(amt)} recorded successfully!`);
      setSettleBill(null);
      await loadBills();
    } catch (err) {
      alert('Failed to record settlement');
    } finally {
      setSettling(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      (b.bill_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.op_no || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary Metrics
  const totalInvoiced = bills.reduce((acc, b) => acc + (b.net_amount || 0), 0);
  const totalCollected = bills.reduce((acc, b) => acc + (b.amount_paid || 0), 0);
  const totalDue = bills.reduce((acc, b) => acc + (b.balance_due || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Accounts Receivable (AR) & Invoice Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete history of patient billing, dues, payment reconciliations and balances
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-xs"
        >
          <Printer className="w-4 h-4" />
          Print Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Invoiced</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalInvoiced)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{bills.length} total bills</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Collected Cash & Digital</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Realized revenues</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Outstanding Balance Due</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalDue)}</p>
          <p className="text-xs text-rose-600 font-medium mt-0.5">Pending collection from patients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Bill Number (e.g. BILL-KRN), Patient Name, or OP number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">All Invoices</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partial">Partial Dues</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Patient & OP</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4 text-right">Net Amount</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Loading ledger invoices...' : 'No invoices found matching criteria'}
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-violet-700 text-xs">
                      {b.bill_no}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(b.bill_date || b.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{b.patient_name || 'Patient'}</div>
                      <div className="text-xs font-mono text-slate-400">{b.op_no || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {b.doctor_name || 'Clinic Team'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(b.net_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(b.amount_paid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {(b.balance_due || 0) > 0 ? formatCurrency(b.balance_due) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          b.payment_status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : b.payment_status === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewBill(b)}
                          className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded transition"
                          title="View Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(b.balance_due || 0) > 0 && (
                          <button
                            onClick={() => handleOpenSettle(b)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded-md transition shadow-2xs"
                          >
                            Settle Due
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SETTLE DUE MODAL */}
      {settleBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Settle Outstanding Due</h2>
              <button
                onClick={() => setSettleBill(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl space-y-1">
              <p className="font-semibold text-slate-800">{settleBill.patient_name}</p>
              <p className="text-slate-500">Bill No: {settleBill.bill_no}</p>
              <p className="text-rose-600 font-bold text-sm">
                Total Due: {formatCurrency(settleBill.balance_due)}
              </p>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paying Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
                <select
                  value={settleMode}
                  onChange={(e) => setSettleMode(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Physical Cash</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleBill(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded-lg shadow-xs"
                >
                  {settling ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT MODAL */}
      {viewBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Patient Invoice Receipt</h2>
              <button
                onClick={() => setViewBill(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center pb-2 border-b border-dashed border-slate-200">
              <h3 className="font-black text-slate-900 text-base">HEAL CLINIC & AESTHETIC CARE</h3>
              <p className="text-xs text-slate-400">Way to Markaz, Karanthoor, Calicut</p>
              <p className="text-xs font-mono font-bold text-violet-700 mt-1">{viewBill.bill_no}</p>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Patient:</span>
                <span className="font-semibold text-slate-900">{viewBill.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span>OP Number:</span>
                <span className="font-mono">{viewBill.op_no}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(viewBill.bill_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Doctor:</span>
                <span>{viewBill.doctor_name || 'Dr. Ananya Nair'}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-2 space-y-1.5 text-xs">
              {(viewBill.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {it.item_name} <span className="text-slate-400">×{it.quantity}</span>
                  </span>
                  <span className="font-semibold">{formatCurrency(it.line_total)}</span>
                </div>
              ))}
            </div>

            <div className="text-xs space-y-1 font-semibold">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(viewBill.subtotal)}</span>
              </div>
              {viewBill.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(viewBill.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax (CGST + SGST):</span>
                <span>{formatCurrency((viewBill.cgst_amount || 0) + (viewBill.sgst_amount || 0))}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Net Amount:</span>
                <span>{formatCurrency(viewBill.net_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid:</span>
                <span>{formatCurrency(viewBill.amount_paid)}</span>
              </div>
              {(viewBill.balance_due || 0) > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(viewBill.balance_due)}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
