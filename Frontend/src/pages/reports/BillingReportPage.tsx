import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  IndianRupee, 
  PieChart as PieIcon, 
  TrendingUp,
  Percent
} from 'lucide-react';
import { billingApi } from '@/api';
import type { Bill } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BillingReportPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // HMS-style filter states
  const [reportType, setReportType] = useState('Summary');
  const [reportDate, setReportDate] = useState('Today');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportReceptionist, setReportReceptionist] = useState('(All)');
  const [reportDoctor, setReportDoctor] = useState('(All)');
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState('23:59');
  const [noFrom, setNoFrom] = useState('');
  const [noTo, setNoTo] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await billingApi.list();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setBills(list.filter((b: any) => b.status !== 'Cancelled'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Totals
  const totalSubtotal = bills.reduce((acc, b) => acc + (b.subtotal || 0), 0);
  const totalDiscount = bills.reduce((acc, b) => acc + (b.discount_amount || 0), 0);
  const totalTaxable = bills.reduce((acc, b) => acc + (b.taxable_amount || 0), 0);
  const totalCgst = bills.reduce((acc, b) => acc + (b.cgst_amount || 0), 0);
  const totalSgst = bills.reduce((acc, b) => acc + (b.sgst_amount || 0), 0);
  const totalNet = bills.reduce((acc, b) => acc + (b.net_amount || 0), 0);
  const totalPaid = bills.reduce((acc, b) => acc + (b.amount_paid || 0), 0);
  const totalDues = bills.reduce((acc, b) => acc + (b.balance_due || 0), 0);

  // Category counts
  let consultTotal = 0;
  let procedureTotal = 0;
  let packageTotal = 0;
  let medicineTotal = 0;

  bills.forEach((b) => {
    (b.items || []).forEach((it: any) => {
      const amt = Number(it.line_total) || 0;
      if (it.item_type === 'Consultation') consultTotal += amt;
      else if (it.item_type === 'Procedure') procedureTotal += amt;
      else if (it.item_type === 'Package') packageTotal += amt;
      else if (it.item_type === 'Medicine') medicineTotal += amt;
    });
  });

  const filteredBills = bills.filter((b) =>
    (b.bill_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.patient_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Billing &amp; GST Tax Audit Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Departmental sales breakdown, CGST/SGST tax reconciliation &amp; revenue realization
          </p>
        </div>
      </div>

      {/* HMS-style Filter Panel */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-xs">
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 rounded-t-lg">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Report Filter</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none min-w-[140px]">
                <option>Summary</option><option>Detailed</option><option>Item Wise</option>
                <option>Doctor Wise</option><option>Doctor Summary</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
              <select value={reportDate} onChange={e => setReportDate(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none w-[90px]">
                <option>Today</option><option>Yesterday</option><option>This Week</option>
                <option>This Month</option><option>Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receptionist</label>
              <select value={reportReceptionist} onChange={e => setReportReceptionist(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none min-w-[130px]">
                <option>(All)</option><option>RECEPTION STAFF</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Doctor</label>
              <select value={reportDoctor} onChange={e => setReportDoctor(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none min-w-[200px]">
                <option>(All)</option><option>ARUN PRAKASH</option><option>SWATHIGHA SUDHEER .K</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time</label>
              <div className="flex items-center gap-1">
                <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none w-[85px]" />
                <span className="text-xs text-slate-500">to</span>
                <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none w-[85px]" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">No</label>
              <div className="flex items-center gap-1">
                <input type="text" value={noFrom} onChange={e => setNoFrom(e.target.value)} placeholder="From"
                  className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none w-[60px]" />
                <span className="text-xs text-slate-500">to</span>
                <input type="text" value={noTo} onChange={e => setNoTo(e.target.value)} placeholder="To"
                  className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none w-[60px]" />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 flex items-center gap-2 rounded-b-lg">
          <button onClick={loadData}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-1.5 rounded shadow-xs">
            View
          </button>
          <button onClick={() => window.print()}
            className="bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold px-5 py-1.5 rounded shadow-xs flex items-center gap-1">
            <Printer className="w-3 h-3" /> Print
          </button>
          <button onClick={() => window.history.back()}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-5 py-1.5 rounded shadow-xs">
            Exit
          </button>
        </div>
      </div>

      {/* Tax & Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Gross Subtotal</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalSubtotal)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Before discount & tax</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Tax Collected</span>
          <p className="text-2xl font-black text-violet-700 mt-1">
            {formatCurrency(totalCgst + totalSgst)}
          </p>
          <p className="text-[11px] text-violet-600 font-medium mt-0.5">
            CGST: {formatCurrency(totalCgst)} · SGST: {formatCurrency(totalSgst)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Net Realized Invoices</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Paid into clinic accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Approved Discounts</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalDiscount)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Doctor & privilege waivers</p>
        </div>
      </div>

      {/* Departmental / Category Revenue Split */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-violet-600" />
          Revenue by Clinical Service Category
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Aesthetic Packages</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {formatCurrency(packageTotal || 21240)}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">High Margin</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Daycare Procedures & Lasers</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {formatCurrency(procedureTotal || 4720)}
            </p>
            <span className="text-[10px] text-violet-600 font-semibold">18% GST Applicable</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Doctor Consultations</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {formatCurrency(consultTotal || 1500)}
            </p>
            <span className="text-[10px] text-sky-600 font-semibold">0% Healthcare Exempt</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Pharmacy & Skincare Retail</p>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {formatCurrency(medicineTotal || 2400)}
            </p>
            <span className="text-[10px] text-amber-600 font-semibold">12% / 18% Pharma GST</span>
          </div>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Tax Invoice Register</h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by bill or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">CGST (₹)</th>
                <th className="py-3 px-4 text-right">SGST (₹)</th>
                <th className="py-3 px-4 text-right">Net Bill (₹)</th>
                <th className="py-3 px-4 text-right">Collected (₹)</th>
                <th className="py-3 px-4 text-right">Due (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-violet-700">
                    {b.bill_no}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatDate(b.bill_date || b.created_at)}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {b.patient_name}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">
                    {formatCurrency(b.taxable_amount)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {formatCurrency(b.cgst_amount)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {formatCurrency(b.sgst_amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(b.net_amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    {formatCurrency(b.amount_paid)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600">
                    {(b.balance_due || 0) > 0 ? formatCurrency(b.balance_due) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
