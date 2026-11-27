import { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  Filter, 
  Download, 
  IndianRupee, 
  Calendar 
} from 'lucide-react';
import { reportsApi } from '@/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CollectionReportPage() {
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('all');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  // HMS-style filter states
  const [reportType, setReportType] = useState('Summary');
  const [reportDate, setReportDate] = useState('Today');
  const [reportReceptionist, setReportReceptionist] = useState('(All)');
  const [reportDoctor, setReportDoctor] = useState('(All)');
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState('23:59');
  const [noFrom, setNoFrom] = useState('');
  const [noTo, setNoTo] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.collection({
        from_date: fromDate,
        to_date: toDate,
        payment_mode: paymentMode !== 'all' ? paymentMode : undefined,
      });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setRecords(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Summary calculations
  const totalNet = records.reduce((acc, r) => acc + (parseFloat(r.net_amount) || 0), 0);
  const totalPaid = records.reduce((acc, r) => acc + (parseFloat(r.amount_paid) || 0), 0);
  const totalDiscount = records.reduce((acc, r) => acc + (parseFloat(r.discount_amount) || 0), 0);
  const totalCash = records.reduce((acc, r) => acc + (parseFloat(r.cash_amount || 0)), 0);
  const totalUpi = records.reduce((acc, r) => acc + (parseFloat(r.upi_amount || 0)), 0);
  const totalCard = records.reduce((acc, r) => acc + (parseFloat(r.card_amount || 0)), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Collection & Revenue Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit daily cashier collections, payment splits & GST reconciliation
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-xs"
        >
          <Printer className="w-4 h-4" />
          Print Audit Report
        </button>
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none min-w-[110px]">
                <option value="all">All Modes</option><option value="Cash">Cash Only</option>
                <option value="UPI">UPI Only</option><option value="Card">Card Only</option>
                <option value="Advance">Advance Adjusted</option>
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
          <button onClick={fetchReport} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-1.5 rounded shadow-xs">
            {loading ? 'Loading...' : 'View'}
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

      {/* Summary KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Billed</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalNet)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{records.length} invoices generated</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Net Collected</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Realized revenue</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Cash Collections</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalCash)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Physical cash drawer</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">UPI / QR Collections</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{formatCurrency(totalUpi)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Bank direct settle</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Discounts Given</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalDiscount)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Approved concessions</p>
        </div>
      </div>

      {/* Detailed Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient / OP</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4 text-right">Net Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4">Payment Modes</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Loading collection records...' : 'No billing records found for the selected dates'}
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-violet-700">
                      {r.bill_no}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(r.bill_date || r.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.patient_name || 'Patient'}</div>
                      <div className="text-[11px] font-mono text-slate-400">{r.op_no}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.doctor_name?.startsWith('Dr.') ? r.doctor_name : `Dr. ${r.doctor_name || 'Clinic Team'}`}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {formatCurrency(r.net_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(r.amount_paid)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {r.cash_amount > 0 && (
                          <span className="bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                            Cash: {formatCurrency(r.cash_amount)}
                          </span>
                        )}
                        {r.upi_amount > 0 && (
                          <span className="bg-indigo-50 text-indigo-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                            UPI: {formatCurrency(r.upi_amount)}
                          </span>
                        )}
                        {r.card_amount > 0 && (
                          <span className="bg-purple-50 text-purple-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                            Card: {formatCurrency(r.card_amount)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {r.payment_status || 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
