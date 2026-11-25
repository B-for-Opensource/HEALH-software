import React, { useState, useEffect } from 'react';
import {
  Bed,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  LogOut,
  X,
  Search,
  UserCheck
} from 'lucide-react';
import { daycareApi, patientsApi } from '@/api';

export default function DaycareLoungePage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<any | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [allocateForm, setAllocateForm] = useState({
    patient_name: '',
    op_no: '',
    procedure_name: 'HydraFacial + LED Therapy',
    attending_staff: 'Anjali Pillai',
    post_care_instructions: 'Drink water and avoid heavy sun exposure.',
  });

  const loadBeds = async () => {
    setLoading(true);
    try {
      const res = await daycareApi.listBeds();
      setBeds(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeds();
  }, []);

  const handleDischarge = async (bedId: string) => {
    if (confirm('Clear and discharge patient from this daycare bed? Status will shift to Cleaning.')) {
      await daycareApi.dischargeBed(bedId);
      loadBeds();
    }
  };

  const handleSanitized = async (bedId: string) => {
    await daycareApi.markSanitized(bedId);
    loadBeds();
  };

  const handlePatientSearch = async (val: string) => {
    setPatientSearch(val);
    if (val.trim().length >= 2) {
      try {
        const res = await patientsApi.search(val.trim());
        const list = Array.isArray(res) ? res : (res?.data || []);
        setPatientResults(list);
      } catch {
        setPatientResults([]);
      }
    } else {
      setPatientResults([]);
    }
  };

  const handleSelectPatient = (p: any) => {
    setAllocateForm((f) => ({
      ...f,
      patient_name: `${p.first_name} ${p.last_name || ''}`.trim(),
      op_no: p.op_no || '',
    }));
    setPatientSearch(`${p.op_no} — ${p.first_name}`);
    setPatientResults([]);
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    await daycareApi.allocateBed(selectedBed.id, allocateForm);
    setShowAllocateModal(false);
    setPatientSearch('');
    setPatientResults([]);
    loadBeds();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Occupied':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Vacant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cleaning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daycare & Minor Procedure Lounge Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-18, 19, 20] Bed & recliner status visualizer, pre-procedure consent, recovery monitoring & discharge advice
          </p>
        </div>

        <button
          onClick={loadBeds}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-violet-600' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Bed Map Visualizer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {beds.map((bed) => (
          <div
            key={bed.id}
            className={`border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition ${bed.status === 'Occupied'
                ? 'bg-purple-50/40 border-purple-200'
                : bed.status === 'Cleaning'
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${bed.status === 'Occupied'
                        ? 'bg-purple-200 text-purple-900'
                        : bed.status === 'Cleaning'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                  >
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{bed.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{bed.room}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                    bed.status
                  )}`}
                >
                  {bed.status}
                </span>
              </div>

              {/* Status Specific Details */}
              {bed.status === 'Occupied' ? (
                <div className="mt-4 bg-white/80 p-3.5 rounded-xl border border-purple-100 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Current Patient</span>
                    <p className="font-bold text-slate-900 text-sm">{bed.patient_name}</p>
                    <p className="text-[11px] font-mono text-purple-700">{bed.op_no}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Procedure</span>
                    <p className="text-slate-800 font-semibold">{bed.procedure_name}</p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-purple-100">
                    <span>Started: {bed.start_time}</span>
                    <span className="font-mono text-emerald-700 font-bold">{bed.vitals}</span>
                  </div>
                </div>
              ) : bed.status === 'Cleaning' ? (
                <div className="mt-4 bg-amber-100/40 p-3.5 rounded-xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Post-Procedure Sanitization In Progress</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">{bed.notes}</p>
                </div>
              ) : (
                <div className="mt-4 p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Ready for incoming procedure patient
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              {bed.status === 'Occupied' && (
                <button
                  onClick={() => handleDischarge(bed.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Discharge & Clear Bed
                </button>
              )}
              {bed.status === 'Cleaning' && (
                <button
                  onClick={() => handleSanitized(bed.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Ready & Vacant
                </button>
              )}
              {bed.status === 'Vacant' && (
                <button
                  onClick={() => {
                    setSelectedBed(bed);
                    setShowAllocateModal(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg shadow-2xs"
                >
                  + Allocate Patient
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ALLOCATE BED MODAL */}
      {showAllocateModal && selectedBed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Allocate {selectedBed.name}</h2>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-3">
              {/* Quick Patient Search (Bypass Registration) */}
              <div className="bg-violet-50/60 p-2.5 rounded-xl border border-violet-100 space-y-1.5">
                <label className="block font-bold text-violet-900 text-[11px] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-violet-600" />
                  Quick Patient Lookup (Search OP / Mobile / Name)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type OP # (e.g. KRN-00101) or Name to auto-fill..."
                    value={patientSearch}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  {patientResults.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {patientResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="p-2 hover:bg-violet-50 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-violet-700 mr-2">{p.op_no}</span>
                            <span className="font-semibold text-slate-900">{p.first_name} {p.last_name || ''}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{p.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sneha Varghese"
                  value={allocateForm.patient_name}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, patient_name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">OP Number</label>
                <input
                  type="text"
                  placeholder="e.g. KRN-00103"
                  value={allocateForm.op_no}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, op_no: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procedure / Infusion</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glutathione IV Drip + Vitamin C"
                  value={allocateForm.procedure_name}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, procedure_name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attending Nurse / Aesthetician</label>
                <input
                  type="text"
                  value={allocateForm.attending_staff}
                  onChange={(e) => setAllocateForm((f) => ({ ...f, attending_staff: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded-lg shadow-xs"
                >
                  Confirm Bed Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
