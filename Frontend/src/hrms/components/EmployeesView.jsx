import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Award, 
  Calendar, 
  CheckCircle2, 
  X,
  Edit,
  Trash2,
  Stethoscope,
  Sparkles,
  Star,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  FileText,
  UserCheck2,
  TrendingUp,
  Clock
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function EmployeesView({ 
  employees, 
  branches, 
  departments, 
  designations,
  onAddEmployee, 
  onUpdateEmployee, 
  onDeleteEmployee 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [deletingEmp, setDeletingEmp] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [drawerTab, setDrawerTab] = useState('profile'); // 'profile', 'performance'

  // Performance Rating Modal state
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratingEmp, setRatingEmp] = useState(null);
  const [empRatings, setEmpRatings] = useState([]);
  const [newRating, setNewRating] = useState({
    month: 'November 2026',
    punctuality_score: 9,
    performance_score: 9,
    team_coordination_score: 9,
    skill_upgradation_score: 8,
    feedback: 'Consistent clinical quality and punctual attendance.',
    improvement_plan: 'Review advanced protocol documentation.'
  });

  // Form State for New
  const [newEmp, setNewEmp] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    branch_id: branches[0]?.id || 1,
    department_id: departments[0]?.id || 1,
    designation_id: designations[0]?.id || 1,
    role: 'Doctor',
    employment_type: 'Full-Time',
    base_salary: 8000,
    commission_rate: 0,
    consultation_share: 0,
    blood_group: 'O+',
    avatar_color: '#0F6CBD',
    avatar_url: '',
    probation_period_days: 90,
    probation_status: 'Under Probation',
    guarantor_name: '',
    guarantor_phone: '',
    guarantor_relation: 'Parent / Guardian',
    id_proof_number: '',
    pan_number: ''
  });

  // Load ratings when an employee is selected
  useEffect(() => {
    if (selectedEmp) {
      loadEmployeeRatings(selectedEmp.id);
    }
  }, [selectedEmp]);

  const loadEmployeeRatings = async (empId) => {
    try {
      const res = await axios.get(`/api/employees/${empId}/performance`);
      setEmpRatings(res.data || []);
    } catch (err) {
      console.error('Error loading ratings', err);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch = searchTerm === '' || 
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.emp_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchBranch = !filterBranch || emp.branch_id === parseInt(filterBranch);
    const matchDept = !filterDept || emp.department_id === parseInt(filterDept);
    const matchRole = !filterRole || emp.role === filterRole;

    return matchSearch && matchBranch && matchDept && matchRole;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddEmployee(newEmp);
    setShowAddModal(false);
    setNewEmp({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      branch_id: branches[0]?.id || 1,
      department_id: departments[0]?.id || 1,
      designation_id: designations[0]?.id || 1,
      role: 'Doctor',
      employment_type: 'Full-Time',
      base_salary: 8000,
      commission_rate: 0,
      consultation_share: 0,
      blood_group: 'O+',
      avatar_color: '#0F6CBD',
      avatar_url: '',
      probation_period_days: 90,
      probation_status: 'Under Probation',
      guarantor_name: '',
      guarantor_phone: '',
      guarantor_relation: 'Parent / Guardian',
      id_proof_number: '',
      pan_number: ''
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    onUpdateEmployee(editingEmp.id, editingEmp);
    setEditingEmp(null);
  };

  const handleConfirmProbation = (emp) => {
    onUpdateEmployee(emp.id, {
      ...emp,
      probation_status: 'Confirmed'
    });
    if (selectedEmp && selectedEmp.id === emp.id) {
      setSelectedEmp({ ...selectedEmp, probation_status: 'Confirmed' });
    }
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!ratingEmp) return;
    try {
      await axios.post('/api/performance/ratings', {
        employee_id: ratingEmp.id,
        ...newRating
      });
      setShowRateModal(false);
      if (selectedEmp && selectedEmp.id === ratingEmp.id) {
        loadEmployeeRatings(ratingEmp.id);
      }
      alert(`Performance Scorecard recorded for ${ratingEmp.full_name}!`);
    } catch (err) {
      alert('Error saving rating: ' + err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Employee Directory & Lifecycle Master</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {employees.length} healthcare professionals, probation tracking, emergency guarantor profiles, and monthly performance scorecards
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Healthcare Professional</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, employee code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Branch Filter */}
        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Reset Filter Button */}
        {(searchTerm || filterBranch || filterDept || filterRole) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterBranch('');
              setFilterDept('');
              setFilterRole('');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Branch & Dept</th>
                <th className="py-3 px-4">Probation Status</th>
                <th className="py-3 px-4">Compensation Model</th>
                <th className="py-3 px-4">Guarantor Person</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const isProbation = emp.probation_status === 'Under Probation';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                            alt={emp.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{emp.full_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{emp.emp_code} • {emp.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Title */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{emp.designation_title || emp.role}</div>
                        <div className="text-[10px] text-blue-600 font-medium">{emp.role}</div>
                      </td>

                      {/* Branch & Dept */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{emp.branch_name}</div>
                        <div className="text-[10px] text-slate-500">{emp.department_name}</div>
                      </td>

                      {/* Probation Status */}
                      <td className="py-3 px-4">
                        {isProbation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            Probation (90d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Confirmed
                          </span>
                        )}
                      </td>

                      {/* Compensation */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-900 font-semibold">${emp.base_salary?.toLocaleString()}/mo</div>
                        {emp.commission_rate > 0 && (
                          <div className="text-[10px] text-purple-600 font-medium">
                            +{emp.commission_rate}% Aesthetic Comm
                          </div>
                        )}
                        {emp.consultation_share > 0 && (
                          <div className="text-[10px] text-blue-600 font-medium">
                            +${emp.consultation_share} OPD Share
                          </div>
                        )}
                      </td>

                      {/* Guarantor / Emergency Contact */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[140px]">
                          {emp.guarantor_name || 'Emergency Guarantor'}
                        </div>
                        <div className="text-[10px] text-slate-500">{emp.guarantor_phone || '+1 555-0192'}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setRatingEmp(emp);
                              setShowRateModal(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 flex items-center gap-1"
                            title="Assign Monthly Performance Rating"
                          >
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Score</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmp(emp);
                              setDrawerTab('profile');
                            }}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="View Full Profile & Performance Dossier"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => setEditingEmp({ ...emp })}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingEmp(emp)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No employees matching the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EMPLOYEE FULL PROFILE & PERFORMANCE DOSSIER SLIDE-OVER                    */}
      {/* ========================================================================= */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Avatar & Details */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedEmp.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                  alt={selectedEmp.full_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-blue-500/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedEmp.full_name}</h3>
                    {selectedEmp.probation_status === 'Confirmed' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Confirmed Staff
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Under Probation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 font-medium">{selectedEmp.job_title || selectedEmp.designation_title} • {selectedEmp.emp_code}</p>
                  <p className="text-[11px] text-slate-400">{selectedEmp.branch_name} • {selectedEmp.department_name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs: Profile vs Monthly Performance Scorecard */}
            <div className="flex items-center gap-2 mt-4 border-b border-slate-200 pb-2">
              <button
                onClick={() => setDrawerTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  drawerTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Profile & Guarantor Verification
              </button>
              <button
                onClick={() => setDrawerTab('performance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  drawerTab === 'performance'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Monthly Performance Scorecard ({empRatings.length})</span>
              </button>
            </div>

            {/* TAB 1: Profile, Probation & Guarantor */}
            {drawerTab === 'profile' && (
              <div className="mt-4 space-y-4 text-xs">
                {/* Probation Lifecycle Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Probation Status</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      {selectedEmp.probation_status === 'Confirmed' ? 'Probation Successfully Completed & Confirmed' : 'Under 90-Day Initial Probation Period'}
                    </p>
                    <p className="text-[11px] text-slate-500">Evaluation End Date: {selectedEmp.probation_end_date || '2026-12-15'}</p>
                  </div>
                  {selectedEmp.probation_status !== 'Confirmed' && (
                    <button
                      onClick={() => handleConfirmProbation(selectedEmp)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      Confirm Probation Now
                    </button>
                  )}
                </div>

                {/* Emergency Contact & Guarantor Person Details (Crucial for Trainees) */}
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Emergency Contact Person & Trainee Guarantor Profile</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mb-2.5">
                    Authorized guardian/guarantor on file for trainees and medical personnel:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Guarantor Name</span>
                      <strong className="text-slate-900">{selectedEmp.guarantor_name || 'Designated Family Guarantor'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Relationship</span>
                      <strong className="text-slate-900">{selectedEmp.guarantor_relation || 'Parent / Relative'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Guarantor Phone</span>
                      <strong className="text-slate-900">{selectedEmp.guarantor_phone || '+1 (555) 987-6543'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Address</span>
                      <span className="text-slate-800">{selectedEmp.emergency_contact_address || '104 Healthcare Blvd, Suite 2B'}</span>
                    </div>
                  </div>
                </div>

                {/* Identity, Banking & Compensation */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">National ID / Aadhaar</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedEmp.id_proof_number || 'XXXX-XXXX-1082'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">PAN Card Number</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedEmp.pan_number || 'ABCDE1082F'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Base Salary</span>
                    <span className="font-mono font-bold text-slate-900">${selectedEmp.base_salary?.toLocaleString()}/mo</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Incentive Structure</span>
                    <span className="text-slate-800 font-medium">
                      {selectedEmp.commission_rate > 0 ? `${selectedEmp.commission_rate}% Aesthetic Comm` : selectedEmp.consultation_share > 0 ? `$${selectedEmp.consultation_share} OPD Share` : 'Fixed Monthly'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Monthly Performance Scorecard & Feedback */}
            {drawerTab === 'performance' && (
              <div className="mt-4 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500">
                    Monthly ratings evaluated by Department Head and HR across 4 core operational pillars
                  </p>
                  <button
                    onClick={() => {
                      setRatingEmp(selectedEmp);
                      setShowRateModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Score Monthly Performance</span>
                  </button>
                </div>

                {empRatings.length > 0 ? (
                  <div className="space-y-3">
                    {empRatings.map((r) => (
                      <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{r.month}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Total Score: {r.total_score} / {r.max_score} ({Math.round((r.total_score / r.max_score) * 100)}%)
                          </span>
                        </div>

                        {/* 4 Core Pillars Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Punctuality</span>
                            <strong className="text-sm text-blue-600">{r.punctuality_score} / 10</strong>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Work Performance</span>
                            <strong className="text-sm text-emerald-600">{r.performance_score} / 10</strong>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">3. Team Coordination</span>
                            <strong className="text-sm text-purple-600">{r.team_coordination_score} / 10</strong>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">4. Skill Upgradation</span>
                            <strong className="text-sm text-indigo-600">{r.skill_upgradation_score} / 10</strong>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                          <p className="text-slate-700"><strong>Evaluator Feedback:</strong> {r.feedback}</p>
                          <p className="text-blue-700"><strong>Action / Improvement Plan:</strong> {r.improvement_plan}</p>
                          <p className="text-[10px] text-slate-400 pt-1">Evaluated by: {r.rated_by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No monthly ratings recorded yet for this staff member. Click "Score Monthly Performance" to assign a scorecard.
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEmp(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RATE EMPLOYEE PERFORMANCE MODAL                                           */}
      {/* ========================================================================= */}
      {showRateModal && ratingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-slate-900 text-base">Monthly Performance Scorecard</h3>
              </div>
              <button onClick={() => setShowRateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Scoring <strong>{ratingEmp.full_name}</strong> ({ratingEmp.job_title}) across the 4 core pillars (Score 1 to 10):
            </p>

            <form onSubmit={handleScoreSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evaluation Period (Month)</label>
                <input
                  type="text"
                  required
                  value={newRating.month}
                  onChange={(e) => setNewRating({ ...newRating, month: e.target.value })}
                  placeholder="e.g. November 2026"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1">1. Punctuality & Attendance</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={newRating.punctuality_score}
                      onChange={(e) => setNewRating({ ...newRating, punctuality_score: Number(e.target.value) })}
                      className="w-16 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                    />
                    <span className="text-slate-400">/ 10</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1">2. Work Performance</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={newRating.performance_score}
                      onChange={(e) => setNewRating({ ...newRating, performance_score: Number(e.target.value) })}
                      className="w-16 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                    />
                    <span className="text-slate-400">/ 10</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1">3. Team Coordination</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={newRating.team_coordination_score}
                      onChange={(e) => setNewRating({ ...newRating, team_coordination_score: Number(e.target.value) })}
                      className="w-16 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                    />
                    <span className="text-slate-400">/ 10</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1">4. Skill Upgradation</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={newRating.skill_upgradation_score}
                      onChange={(e) => setNewRating({ ...newRating, skill_upgradation_score: Number(e.target.value) })}
                      className="w-16 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                    />
                    <span className="text-slate-400">/ 10</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evaluator Feedback</label>
                <textarea
                  rows={2}
                  required
                  value={newRating.feedback}
                  onChange={(e) => setNewRating({ ...newRating, feedback: e.target.value })}
                  placeholder="Commendations, clinical delivery observations..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action & Improvement Plan</label>
                <textarea
                  rows={2}
                  required
                  value={newRating.improvement_plan}
                  onChange={(e) => setNewRating({ ...newRating, improvement_plan: e.target.value })}
                  placeholder="Specific learning goals, attendance punctuality expectations..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Scorecard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingEmp && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Employee"
          message={`Are you sure you want to delete ${deletingEmp.full_name}? All associated attendance and records will be deleted.`}
          onConfirm={() => {
            onDeleteEmployee(deletingEmp.id);
            setDeletingEmp(null);
          }}
          onCancel={() => setDeletingEmp(null)}
        />
      )}
    </div>
  );
}
