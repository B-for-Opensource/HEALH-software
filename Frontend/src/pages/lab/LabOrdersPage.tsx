import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Filter,
  FileText,
  AlertCircle,
  Calendar,
  User,
  Activity,
  Check,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { labApi } from '@/api';
import { formatDate } from '@/lib/utils';

export default function LabOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'Ordered' | 'Sample Collected' | 'Processing' | 'Completed'>('all');
  const [search, setSearch] = useState('');
  
  // Result entry modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [resultSummary, setResultSummary] = useState('');
  const [technicianName, setTechnicianName] = useState('Senior Lab Pathologist');
  const [savingResult, setSavingResult] = useState(false);

  // Print slip modal
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labApi.list();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await labApi.updateStatus(id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSaveResult = async () => {
    if (!selectedOrder) return;
    if (!resultSummary.trim()) {
      alert('Please enter diagnostic findings / result summary');
      return;
    }
    setSavingResult(true);
    try {
      const updated = await labApi.updateStatus(selectedOrder.id, 'Completed', {
        result_summary: resultSummary.trim(),
        technician: technicianName.trim(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...updated, status: 'Completed', result_summary: resultSummary.trim() } : o))
      );
      setSelectedOrder(null);
      setResultSummary('');
      alert('Lab diagnostic report finalized and published!');
    } catch (err) {
      alert('Failed to save lab result');
    } finally {
      setSavingResult(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      (o.patient_name || '').toLowerCase().includes(q) ||
      (o.op_no || '').toLowerCase().includes(q) ||
      (o.test_name || '').toLowerCase().includes(q) ||
      (o.doctor_name || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const orderedCount = orders.filter((o) => o.status === 'Ordered').length;
  const collectedCount = orders.filter((o) => o.status === 'Sample Collected').length;
  const processingCount = orders.filter((o) => o.status === 'Processing').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-violet-600" />
            <span>Clinical Diagnostic Laboratory</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Biopsy histology, blood panels, fungal mounts, allergen patch testing, and endocrinology diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-sm font-medium shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-600' : ''}`} />
            Refresh Orders
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Pending Collection
          </span>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{orderedCount}</p>
          <span className="text-xs text-slate-400">Sample not yet collected</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sample Collected
          </span>
          <p className="text-3xl font-extrabold text-sky-600 mt-1">{collectedCount}</p>
          <span className="text-xs text-slate-400">Accessioned into lab</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            In-Lab Processing
          </span>
          <p className="text-3xl font-extrabold text-violet-600 mt-1">{processingCount}</p>
          <span className="text-xs text-slate-400">Microscopy & analysis</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Reports Completed
          </span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{completedCount}</p>
          <span className="text-xs text-slate-400">Verified by pathologist</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('Ordered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'Ordered'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ordered ({orderedCount})
          </button>
          <button
            onClick={() => setActiveTab('Sample Collected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'Sample Collected'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Collected ({collectedCount})
          </button>
          <button
            onClick={() => setActiveTab('Processing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'Processing'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Processing ({processingCount})
          </button>
          <button
            onClick={() => setActiveTab('Completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'Completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, OP, test, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Lab Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4"># Order</th>
                <th className="py-3.5 px-4">Patient Profile</th>
                <th className="py-3.5 px-4">Test & Investigation</th>
                <th className="py-3.5 px-4">Sample Type</th>
                <th className="py-3.5 px-4">Ordered By</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {loading ? 'Fetching active laboratory orders...' : 'No diagnostic orders found for this filter.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-700">
                      #{o.token_no || o.id.slice(-4)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {formatDate(o.order_date)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{o.patient_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">OP: {o.op_no}</div>
                      {o.phone && <div className="text-[10px] text-slate-400">Ph: {o.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{o.test_name}</p>
                      <span className="text-[11px] text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded font-medium">
                        {o.category || 'General Pathology'}
                      </span>
                      {o.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                          Note: {o.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {o.sample_type || 'Blood / Serum'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <span className="flex items-center gap-1 font-semibold">
                        <span>🩺</span>
                        <span>{o.doctor_name || 'Dr. Ananya Nair'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.priority === 'Stat'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : o.priority === 'Urgent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {o.priority || 'Routine'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          o.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : o.status === 'Processing'
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : o.status === 'Sample Collected'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status === 'Ordered' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'Sample Collected')}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded text-xs font-semibold shadow-xs"
                          >
                            Collect Sample
                          </button>
                        )}
                        {o.status === 'Sample Collected' && (
                          <button
                            onClick={() => handleUpdateStatus(o.id, 'Processing')}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded text-xs font-semibold shadow-xs"
                          >
                            Start Processing
                          </button>
                        )}
                        {o.status === 'Processing' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setResultSummary(o.result_summary || '');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold shadow-xs"
                          >
                            Enter Results
                          </button>
                        )}
                        {o.status === 'Completed' && (
                          <button
                            onClick={() => setPrintOrder(o)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold shadow-2xs"
                          >
                            <Printer className="w-3 h-3 text-slate-600" />
                            Print Report
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

      {/* RESULT ENTRY & VERIFICATION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-violet-600" />
                <span>Enter Laboratory Findings & Publish Report</span>
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><strong>Test:</strong> {selectedOrder.test_name} ({selectedOrder.category})</p>
              <p><strong>Patient:</strong> {selectedOrder.patient_name} (OP #{selectedOrder.op_no})</p>
              <p><strong>Ordering Doctor:</strong> {selectedOrder.doctor_name}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnostic Findings & Report Summary *
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Skin biopsy shows mild hyperkeratosis with dermal perivascular lymphocytic infiltrate. No granulomas or malignancy observed. Compatible with chronic lichenoid dermatitis."
                value={resultSummary}
                onChange={(e) => setResultSummary(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verifying Technologist / Pathologist Name
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                disabled={savingResult}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                {savingResult ? 'Saving...' : 'Finalize & Publish Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT LAB REPORT MODAL */}
      {printOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <h2 className="text-sm font-bold text-slate-800">Diagnostic Laboratory Report Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  onClick={() => setPrintOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">HEAL CLINIC DIAGNOSTICS & PATHOLOGY</h1>
              <p className="text-xs text-slate-600 font-medium">Way to Markaz, Karanthoor, Calicut, Kerala · Ph: 0495-2720000</p>
              <p className="text-[11px] text-slate-500">ISO 15189 Accredited Clinical Laboratory · Reg No: KL-MED-84920</p>
            </div>

            {/* Patient & Test Header */}
            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-b border-slate-200">
              <div>
                <p className="font-bold text-slate-900 text-sm">{printOrder.patient_name}</p>
                <p className="text-slate-500 font-mono">OP: {printOrder.op_no} · Ph: {printOrder.phone || '-'}</p>
                <p className="text-slate-600 font-medium">Referred By: {printOrder.doctor_name || 'Dr. Ananya Nair'}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="font-bold text-violet-800">Order ID: #{printOrder.token_no || printOrder.id.slice(-4)}</p>
                <p className="text-slate-500">Sample Date: {formatDate(printOrder.order_date)}</p>
                <p className="text-slate-500">Report Date: {formatDate(printOrder.result_date || printOrder.order_date)}</p>
              </div>
            </div>

            {/* Test Details */}
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{printOrder.test_name}</h3>
                  <p className="text-xs text-slate-500">Department: {printOrder.category} · Specimen: {printOrder.sample_type}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded text-xs">
                  COMPLETED
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Pathological Findings & Diagnostic Impression:
                </h4>
                <div className="p-3 bg-white rounded-lg border border-slate-300 text-xs text-slate-800 leading-relaxed font-mono">
                  {printOrder.result_summary || 'Findings within normal biological limits for patient age and demographic profile.'}
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 text-xs border-t border-slate-200">
              <div>
                <p className="font-bold text-slate-800">{printOrder.technician || 'Senior Technologist'}</p>
                <p className="text-[10px] text-slate-400">Medical Laboratory Technologist</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">Dr. Ananya Nair (MD Path)</p>
                <p className="text-[10px] text-slate-400">Consultant Clinical Pathologist</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
