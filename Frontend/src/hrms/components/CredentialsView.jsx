import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Building2, 
  X,
  Edit,
  Trash2,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function CredentialsView({ 
  branches, 
  employees,
  onAddCredential,
  onUpdateCredential,
  onDeleteCredential 
}) {
  const [credentials, setCredentials] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCred, setEditingCred] = useState(null);
  const [deletingCred, setDeletingCred] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newCred, setNewCred] = useState({
    employee_id: employees[0]?.id || 1,
    license_type: 'Board Certification in Dermatology',
    license_number: 'LIC-2026-99',
    issuing_authority: 'State Board of Medical Specialties',
    issue_date: '2023-01-01',
    expiry_date: '2027-01-01',
    document_name: 'medical_license_scan.pdf'
  });

  useEffect(() => {
    fetchCredentials();
  }, [statusFilter]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/credentials?status=${statusFilter}` : '/api/credentials';
      const res = await axios.get(url);
      setCredentials(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/credentials', newCred);
      setShowModal(false);
      fetchCredentials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCred) return;
    try {
      await axios.put(`/api/credentials/${editingCred.id}`, editingCred);
      setEditingCred(null);
      fetchCredentials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCred) return;
    try {
      await axios.delete(`/api/credentials/${deletingCred.id}`);
      setDeletingCred(null);
      fetchCredentials();
    } catch (err) {
      console.error(err);
    }
  };

  const expiringSoonCount = credentials.filter(c => c.status === 'Expiring Soon').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span>Medical Credentials & License Compliance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated monitoring of medical licenses, aesthetic laser operator certs, and nurse registrations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Credential</span>
        </button>
      </div>

      {/* Compliance Alert Banner if expiring soon */}
      {expiringSoonCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-sm">Compliance Action Required: {expiringSoonCount} Clinical License(s) Expiring</div>
            <p className="mt-0.5 text-amber-800">
              Healthcare regulations mandate active licenses prior to patient consultation or laser procedures. Please review and request renewed certificates.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === '' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
        >
          All Licenses ({credentials.length})
        </button>
        <button
          onClick={() => setStatusFilter('expiring_soon')}
          className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'expiring_soon' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600'}`}
        >
          Expiring Soon (≤30 Days)
        </button>
        <button
          onClick={() => setStatusFilter('valid')}
          className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'valid' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600'}`}
        >
          Valid & Active
        </button>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
              cred.status === 'Expiring Soon'
                ? 'border-amber-300 ring-2 ring-amber-100'
                : cred.status === 'Expired'
                ? 'border-rose-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cred.status === 'Valid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : cred.status === 'Expiring Soon'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {cred.status === 'Valid' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  <span>{cred.status}</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-medium text-slate-400">
                    {cred.days_to_expiry > 0 ? `${cred.days_to_expiry}d left` : 'Expired'}
                  </span>
                  <button
                    onClick={() => setEditingCred({ ...cred })}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    title="Renew/Edit Credential"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingCred(cred)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Credential"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-2.5">{cred.license_type}</h3>
              <div className="text-[11px] font-mono font-semibold text-blue-600 mt-0.5">{cred.license_number}</div>

              <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Practitioner:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {cred.employee_avatar && (
                      <img src={cred.employee_avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    <span>{cred.employee_name}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clinic Branch:</span>
                  <span className="text-slate-700">{cred.branch_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authority:</span>
                  <span className="text-slate-700">{cred.issuing_authority}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-1 mt-1">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="font-mono font-bold text-slate-900">{cred.expiry_date}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[140px]">{cred.document_name}</span>
              </span>
              <button 
                onClick={() => alert(`Viewing document: ${cred.document_name}`)}
                className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
              >
                View File
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Credential Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Clinical Credential / License</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Healthcare Professional *</label>
                <select
                  value={newCred.employee_id}
                  onChange={(e) => setNewCred({ ...newCred, employee_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">License / Certification Title *</label>
                <input
                  type="text"
                  required
                  value={newCred.license_type}
                  onChange={(e) => setNewCred({ ...newCred, license_type: e.target.value })}
                  placeholder="e.g. State Medical Council Practicing License"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">License Number *</label>
                  <input
                    type="text"
                    required
                    value={newCred.license_number}
                    onChange={(e) => setNewCred({ ...newCred, license_number: e.target.value })}
                    placeholder="e.g. MED-88912"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issuing Authority *</label>
                  <input
                    type="text"
                    required
                    value={newCred.issuing_authority}
                    onChange={(e) => setNewCred({ ...newCred, issuing_authority: e.target.value })}
                    placeholder="e.g. Medical Board"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={newCred.issue_date}
                    onChange={(e) => setNewCred({ ...newCred, issue_date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newCred.expiry_date}
                    onChange={(e) => setNewCred({ ...newCred, expiry_date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Attachment Name</label>
                <input
                  type="text"
                  value={newCred.document_name}
                  onChange={(e) => setNewCred({ ...newCred, document_name: e.target.value })}
                  placeholder="e.g. license_scan.pdf"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Credential Modal */}
      {editingCred && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Renew / Update Credential</h2>
              <button onClick={() => setEditingCred(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">License Type</label>
                <input
                  type="text"
                  required
                  value={editingCred.license_type}
                  onChange={(e) => setEditingCred({ ...editingCred, license_type: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">License Number</label>
                  <input
                    type="text"
                    required
                    value={editingCred.license_number}
                    onChange={(e) => setEditingCred({ ...editingCred, license_number: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Authority</label>
                  <input
                    type="text"
                    required
                    value={editingCred.issuing_authority}
                    onChange={(e) => setEditingCred({ ...editingCred, issuing_authority: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={editingCred.expiry_date}
                  onChange={(e) => setEditingCred({ ...editingCred, expiry_date: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none font-bold text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCred(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Save Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Credential Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingCred)}
        title="Delete Medical Credential"
        itemType="Medical License / Credential"
        itemName={`${deletingCred?.license_type} (${deletingCred?.employee_name})`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCred(null)}
      />
    </div>
  );
}
