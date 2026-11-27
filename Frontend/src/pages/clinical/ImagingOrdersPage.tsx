import { useState, useEffect } from 'react';
import { Scan, CheckCircle2, Clock, FileText, Play, ShieldCheck, XCircle, Plus } from 'lucide-react';
import { imagingApi, patientsApi } from '@/api';
import { connectPipelineWebSocket } from '@/api/httpClient';

const MODALITIES = ['all', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound'];
const STATUSES = ['ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'REPORT_READY', 'VERIFIED', 'CANCELLED'];

export default function ImagingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalityFilter, setModalityFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [reportForm, setReportForm] = useState({
    room_equipment: '',
    technician_notes: '',
    radiologist_findings: '',
    report_file_url: '',
  });
  const [showNewModal, setShowNewModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientMatches, setPatientMatches] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [newOrderForm, setNewOrderForm] = useState({
    modality: 'X-Ray',
    service_name: 'Chest X-Ray PA View',
    room_equipment: 'Room 104 (Radiology)',
    price: 600,
    technician_notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, srvRes] = await Promise.all([
        imagingApi.listOrders(modalityFilter !== 'all' ? { modality: modalityFilter } : undefined),
        imagingApi.listServices(),
      ]);
      setOrders(Array.isArray(ordRes) ? ordRes : []);
      setServices(Array.isArray(srvRes) ? srvRes : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const disconnect = connectPipelineWebSocket((evt) => {
      if (evt.includes('Imaging') || evt === 'DoctorOrdersCreated') loadData();
    });
    const timer = setInterval(loadData, 10000);
    return () => { disconnect(); clearInterval(timer); };
  }, [modalityFilter]);

  const handleStatusChange = async (orderId: string, status: string) => {
    await imagingApi.updateOrder(orderId, { status });
    loadData();
  };

  const handleSaveReport = async () => {
    if (!selectedOrder) return;
    await imagingApi.updateOrder(selectedOrder.id, {
      ...reportForm,
      status: reportForm.radiologist_findings ? 'REPORT_READY' : selectedOrder.status,
    });
    setSelectedOrder(null);
    loadData();
  };

  const handlePatientLookup = async (q: string) => {
    setPatientSearch(q);
    if (q.trim().length >= 2) {
      const res = await patientsApi.search(q);
      setPatientMatches(Array.isArray(res) ? res : []);
    } else {
      setPatientMatches([]);
    }
  };

  const handleCreateDirectImaging = async () => {
    if (!selectedPatient) return;
    await imagingApi.createOrder({
      patient_id: selectedPatient.id,
      ...newOrderForm,
    });
    setShowNewModal(false);
    setSelectedPatient(null);
    loadData();
  };

  const counts = {
    ordered: orders.filter((o) => o.status === 'ORDERED').length,
    inProgress: orders.filter((o) => ['SCHEDULED', 'IN_PROGRESS'].includes(o.status)).length,
    reportReady: orders.filter((o) => o.status === 'REPORT_READY').length,
    verified: orders.filter((o) => o.status === 'VERIFIED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scan className="w-6 h-6 text-indigo-600" />
            Imaging &amp; Radiology Queue (X-Ray / MRI / CT / USG)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Order lifecycle: ORDERED → SCHEDULED → IN_PROGRESS → REPORT_READY → VERIFIED
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs"
        >
          <Plus className="w-4 h-4" /> New Imaging Order
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold uppercase text-slate-500">New Orders</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{counts.ordered}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold uppercase text-slate-500">Scheduled / Scanning</span>
          <p className="text-2xl font-black text-sky-600 mt-1">{counts.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold uppercase text-slate-500">Report Ready</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{counts.reportReady}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold uppercase text-slate-500">Verified &amp; Released</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{counts.verified}</p>
        </div>
      </div>

      {/* Modality Filter */}
      <div className="flex flex-wrap gap-2">
        {MODALITIES.map((m) => (
          <button
            key={m}
            onClick={() => setModalityFilter(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              modalityFilter === m
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {m === 'all' ? 'All Modalities' : m}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="py-3 px-4">Order #</th>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Modality &amp; Study</th>
              <th className="py-3 px-4">Room / Equipment</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  {loading ? 'Loading imaging orders...' : 'No imaging orders in queue'}
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{o.order_no}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{o.patient_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{o.op_no}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold mr-1.5">{o.modality}</span>
                    <span className="font-medium text-slate-800">{o.service_name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{o.room_equipment || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {o.status === 'ORDERED' && (
                      <button onClick={() => handleStatusChange(o.id, 'SCHEDULED')} className="px-2 py-1 rounded bg-sky-50 text-sky-700 font-semibold">
                        Schedule
                      </button>
                    )}
                    {o.status === 'SCHEDULED' && (
                      <button onClick={() => handleStatusChange(o.id, 'IN_PROGRESS')} className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold inline-flex items-center gap-1">
                        <Play className="w-3 h-3" /> Start Scan
                      </button>
                    )}
                    {['IN_PROGRESS', 'ORDERED', 'SCHEDULED', 'REPORT_READY'].includes(o.status) && (
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setReportForm({
                            room_equipment: o.room_equipment || '',
                            technician_notes: o.technician_notes || '',
                            radiologist_findings: o.radiologist_findings || '',
                            report_file_url: o.report_file_url || '',
                          });
                        }}
                        className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Findings / Report
                      </button>
                    )}
                    {o.status === 'REPORT_READY' && (
                      <button onClick={() => handleStatusChange(o.id, 'VERIFIED')} className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verify &amp; Release
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Findings & Report Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {selectedOrder.order_no} — {selectedOrder.modality}: {selectedOrder.service_name}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Room / Equipment</label>
                <input
                  type="text"
                  value={reportForm.room_equipment}
                  onChange={(e) => setReportForm({ ...reportForm, room_equipment: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Technician Notes</label>
                <textarea
                  rows={2}
                  value={reportForm.technician_notes}
                  onChange={(e) => setReportForm({ ...reportForm, technician_notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Radiologist Findings</label>
                <textarea
                  rows={3}
                  value={reportForm.radiologist_findings}
                  onChange={(e) => setReportForm({ ...reportForm, radiologist_findings: e.target.value })}
                  placeholder="Enter impression / clinical findings..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Report PDF / Image URL</label>
                <input
                  type="text"
                  value={reportForm.report_file_url}
                  onChange={(e) => setReportForm({ ...reportForm, report_file_url: e.target.value })}
                  placeholder="/uploads/reports/scan.pdf"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-1.5 rounded-lg border text-xs font-semibold">Cancel</button>
              <button onClick={handleSaveReport} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">Save Report</button>
            </div>
          </div>
        </div>
      )}

      {/* New Direct Imaging Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <h3 className="text-base font-bold text-slate-900">Create Imaging Order</h3>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Search Patient (Name / OP No / Phone)</label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => handlePatientLookup(e.target.value)}
                placeholder="Type 2+ characters..."
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
              />
              {patientMatches.length > 0 && (
                <div className="border border-slate-200 rounded-lg mt-1 max-h-32 overflow-y-auto divide-y">
                  {patientMatches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setPatientSearch(`${p.first_name} (${p.op_no})`); setPatientMatches([]); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-indigo-50"
                    >
                      {p.first_name} {p.last_name || ''} — <span className="font-mono text-slate-500">{p.op_no}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Modality</label>
                <select
                  value={newOrderForm.modality}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, modality: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5"
                >
                  <option>X-Ray</option><option>MRI</option><option>CT Scan</option><option>Ultrasound</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newOrderForm.price}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, price: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Study / Service Name</label>
              <input
                type="text"
                value={newOrderForm.service_name}
                onChange={(e) => setNewOrderForm({ ...newOrderForm, service_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-1.5 rounded-lg border font-semibold">Cancel</button>
              <button disabled={!selectedPatient} onClick={handleCreateDirectImaging} className="px-4 py-1.5 rounded-lg bg-indigo-600 disabled:opacity-50 text-white font-bold">
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
