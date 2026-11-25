import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { packagesApi, patientsApi, mastersApi } from '@/api';
import type { Patient, Package, PatientPackage, Staff } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState<'patient-ledger' | 'catalog'>('patient-ledger');

  // Patient Lookup
  const [patientQuery, setPatientQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Patient Packages
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Master Catalog
  const [catalog, setCatalog] = useState<Package[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Log Session Modal State
  const [sessionModalPkg, setSessionModalPkg] = useState<PatientPackage | null>(null);
  const [sessionForm, setSessionForm] = useState({
    performed_by: '',
    device_used: '',
    energy_level: '',
    areas_treated: '',
    patient_feedback: '',
    adverse_reaction: 'None',
    next_session_date: '',
    notes: '',
  });
  const [loggingSession, setLoggingSession] = useState(false);

  // Load catalog & staff
  useEffect(() => {
    packagesApi.list().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCatalog(list);
    }).catch(() => {});

    mastersApi.staff().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setStaffList(list);
    }).catch(() => {});
  }, []);

  const handleSearchPatient = async (val: string) => {
    setPatientQuery(val);
    if (val.trim().length >= 2) {
      try {
        const res = await patientsApi.search(val);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setPatientSuggestions(list);
      } catch {
        setPatientSuggestions([]);
      }
    } else {
      setPatientSuggestions([]);
    }
  };

  const selectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    setPatientQuery('');
    setPatientSuggestions([]);
    loadPatientPackages(p.id);
  };

  const loadPatientPackages = async (patientId: string) => {
    setLoadingPackages(true);
    try {
      const res = await packagesApi.patientList(patientId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setPatientPackages(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleOpenLogModal = (pkg: PatientPackage) => {
    setSessionModalPkg(pkg);
    // Suggest next session in 21 days
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 21);
    setSessionForm({
      performed_by: staffList.length > 0 ? staffList[0].id : '',
      device_used: 'Diode Laser 808nm',
      energy_level: '24 J/cm2, 30ms pulse',
      areas_treated: 'Full Face & Chin',
      patient_feedback: 'Tolerated well with mild erythema',
      adverse_reaction: 'None',
      next_session_date: nextDate.toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSaveSession = async () => {
    if (!sessionModalPkg || !selectedPatient) return;
    setLoggingSession(true);
    try {
      const payload = {
        patient_package_id: sessionModalPkg.id,
        patient_id: selectedPatient.id,
        session_no: (sessionModalPkg.sessions_used || 0) + 1,
        session_date: new Date().toISOString().split('T')[0],
        ...sessionForm,
      };
      await packagesApi.logSession(payload);
      alert('Treatment session logged successfully! Package balance updated.');
      setSessionModalPkg(null);
      loadPatientPackages(selectedPatient.id);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to log session');
    } finally {
      setLoggingSession(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Aesthetic Packages & Daycare Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Multi-session laser & skin treatment tracker, session logs, progress & clinical parameters
          </p>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg p-1">
          <button
            onClick={() => setActiveTab('patient-ledger')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'patient-ledger' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient Package Ledger
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'catalog' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Treatment Package Catalog
          </button>
        </div>
      </div>

      {activeTab === 'patient-ledger' ? (
        <div className="space-y-6">
          {/* Patient Lookup Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Patient To View Treatment Packages
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between bg-violet-50/80 border border-violet-200 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-200 text-violet-800 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedPatient.first_name} {selectedPatient.last_name || ''}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      OP: {selectedPatient.op_no} · Phone: {selectedPatient.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-violet-700 hover:underline font-semibold"
                >
                  Change Patient
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patient by Name, Phone number or OP number..."
                  value={patientQuery}
                  onChange={(e) => handleSearchPatient(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
                {patientSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {patientSuggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="w-full text-left p-3 hover:bg-violet-50 text-xs flex items-center justify-between transition"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">
                            {p.first_name} {p.last_name || ''}
                          </span>
                          <span className="text-slate-400 ml-2 font-mono">({p.op_no})</span>
                        </div>
                        <span className="text-slate-600">{p.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Packages for Selected Patient */}
          {selectedPatient && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Active & Enrolled Packages ({patientPackages.length})</span>
                <span className="text-xs text-slate-500 font-normal">
                  Sessions are deducted automatically upon logging procedure
                </span>
              </h2>

              {loadingPackages ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  Loading treatment package ledger...
                </div>
              ) : patientPackages.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No Packages Purchased Yet</p>
                  <p className="text-xs text-slate-400">
                    Packages can be billed and assigned to this patient from the Billing POS counter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientPackages.map((pkg) => {
                    const remaining = pkg.total_sessions - pkg.sessions_used;
                    const pct = Math.min(100, Math.round((pkg.sessions_used / pkg.total_sessions) * 100));

                    return (
                      <div
                        key={pkg.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">
                              {pkg.package_name || 'Treatment Package'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Purchased on {formatDate(pkg.purchase_date)} · Expires: {formatDate(pkg.expiry_date) || '12 Months'}
                            </p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {pkg.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                            <span>
                              {pkg.sessions_used} of {pkg.total_sessions} Sessions Done ({pct}%)
                            </span>
                            <span className="text-violet-700 font-bold">
                              {remaining} Sessions Remaining
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-violet-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-medium">
                            Paid: {formatCurrency(pkg.amount_paid)}
                          </span>
                          {remaining > 0 && pkg.status === 'Active' ? (
                            <button
                              onClick={() => handleOpenLogModal(pkg)}
                              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Log Session #{pkg.sessions_used + 1}
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">All Sessions Completed</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* CATALOG TAB */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Official Clinic Treatment Packages</h2>
            <span className="text-xs text-slate-500">Fixed rate multi-session packages with GST included</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {catalog.map((cat) => (
              <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                      {cat.category || 'Aesthetic'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{cat.name}</h3>
                  </div>
                  <span className="font-mono text-xs text-slate-400">{cat.code}</span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{cat.description || 'Full course package with post-procedure care'}</p>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">{cat.total_sessions} Sessions ({cat.validity_months} Mo validity)</span>
                    <span className="text-lg font-black text-slate-900">{formatCurrency(cat.package_price)}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">GST {cat.cgst_percent + cat.sgst_percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOG SESSION MODAL */}
      {sessionModalPkg && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Log Treatment Session #{sessionModalPkg.sessions_used + 1}
                </h3>
                <p className="text-xs text-slate-500">{sessionModalPkg.package_name}</p>
              </div>
              <button
                onClick={() => setSessionModalPkg(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Performed By (Doctor/Therapist) *</label>
                  <select
                    value={sessionForm.performed_by}
                    onChange={(e) => setSessionForm((s) => ({ ...s, performed_by: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Device / Machine Used</label>
                  <input
                    type="text"
                    value={sessionForm.device_used}
                    onChange={(e) => setSessionForm((s) => ({ ...s, device_used: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Energy Level / Parameters</label>
                  <input
                    type="text"
                    placeholder="e.g. 24 J/cm2, Pulse 30ms"
                    value={sessionForm.energy_level}
                    onChange={(e) => setSessionForm((s) => ({ ...s, energy_level: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Areas Treated</label>
                  <input
                    type="text"
                    placeholder="e.g. Full face, neck"
                    value={sessionForm.areas_treated}
                    onChange={(e) => setSessionForm((s) => ({ ...s, areas_treated: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Patient Feedback & Tolerance</label>
                <input
                  type="text"
                  placeholder="e.g. Comfortable, mild transient redness"
                  value={sessionForm.patient_feedback}
                  onChange={(e) => setSessionForm((s) => ({ ...s, patient_feedback: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Adverse Reaction (if any)</label>
                  <input
                    type="text"
                    value={sessionForm.adverse_reaction}
                    onChange={(e) => setSessionForm((s) => ({ ...s, adverse_reaction: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Next Session Due Date</label>
                  <input
                    type="date"
                    value={sessionForm.next_session_date}
                    onChange={(e) => setSessionForm((s) => ({ ...s, next_session_date: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSessionModalPkg(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                disabled={loggingSession}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-xs transition"
              >
                {loggingSession ? 'Saving Session...' : 'Record Session & Deduct 1 Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
