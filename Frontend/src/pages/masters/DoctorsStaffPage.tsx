import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Building2, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { mastersApi } from '@/api';
import type { Staff, Department } from '@/types';

export default function DoctorsStaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'Doctor',
    department_id: '',
    doctor_reg_no: '',
    specialisation: '',
    phone: '',
    email: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        mastersApi.staff(),
        mastersApi.departments(),
      ]);
      const sList = Array.isArray(sRes) ? sRes : (sRes?.data || []);
      const dList = Array.isArray(dRes) ? dRes : (dRes?.data || []);
      setStaffList(sList);
      setDepartments(dList);
      if (dList.length > 0 && !formData.department_id) {
        setFormData((prev) => ({ ...prev, department_id: dList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.full_name || !formData.username || !formData.password) {
      setFormError('Full Name, Username, and Password are required');
      return;
    }

    setSubmitting(true);
    try {
      const newStaff = await mastersApi.createStaff(formData);
      setFormSuccess(`User "${newStaff.username}" created successfully! They can now log in immediately.`);
      // Reset form
      setFormData({
        full_name: '',
        username: '',
        password: '',
        role: 'Doctor',
        department_id: departments[0]?.id || '',
        doctor_reg_no: '',
        specialisation: '',
        phone: '',
        email: '',
      });
      await loadData();
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess(null);
      }, 1800);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.specialisation || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || s.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Doctor':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Receptionist':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cashier':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Therapist':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
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
            Doctors & Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage practitioners, clinic personnel & access credentials stored in local storage
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          + Add New User / Staff
        </button>
      </div>

      {/* Info Notice */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Standalone Local Storage User System</p>
          <p className="mt-0.5 text-sky-700 leading-relaxed">
            Any user or doctor added here is permanently stored in browser cache / local storage. You can immediately sign out and sign in with the new username and password without needing a remote backend!
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, username, department or specialisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Doctor">Doctors Only</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Cashier">Cashier</option>
            <option value="Therapist">Therapist</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm">
                    {staff.role === 'Doctor' ? (
                      <Stethoscope className="w-5 h-5" />
                    ) : (
                      staff.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{staff.full_name}</h3>
                    <p className="text-xs font-mono text-slate-400">@{staff.username}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getRoleBadge(
                    staff.role
                  )}`}
                >
                  {staff.role}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                {staff.doctor_reg_no && (
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span className="text-slate-400">Reg:</span>
                    <span className="font-mono">{staff.doctor_reg_no}</span>
                  </div>
                )}
                {staff.specialisation && (
                  <p className="text-violet-700 font-semibold">{staff.specialisation}</p>
                )}
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{staff.department_name || 'General'}</span>
                </div>
                {staff.phone && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                )}
                {staff.email && (
                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{staff.branch_name || 'Karanthoor Main'}</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold text-slate-900">Add New User / Staff</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Dr. Priya S. Nair"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Therapist">Therapist</option>
                    <option value="Nurse">Staff Nurse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="e.g. dr.priya"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medical Reg No (Doctors)</label>
                  <input
                    type="text"
                    name="doctor_reg_no"
                    value={formData.doctor_reg_no}
                    onChange={handleInputChange}
                    placeholder="e.g. TCMC-58491"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialisation / Title</label>
                <input
                  type="text"
                  name="specialisation"
                  value={formData.specialisation}
                  onChange={handleInputChange}
                  placeholder="e.g. Consultant Dermatologist & Trichologist"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="doctor@healclinic.in"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save User & Enable Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
