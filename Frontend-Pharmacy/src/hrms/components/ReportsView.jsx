import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Users, 
  Award, 
  CalendarCheck, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

export default function ReportsView({ branches, employees }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reports/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportEmployeesCSV = () => {
    if (!employees || employees.length === 0) return;
    const headers = ['Employee Code', 'Full Name', 'Role', 'Clinic Branch', 'Department', 'Employment Type', 'Base Salary ($)', 'Aesthetic Comm (%)', 'OPD Share ($)', 'Status'];
    const rows = employees.map(e => [
      e.emp_code,
      `"${e.full_name}"`,
      `"${e.role}"`,
      `"${e.branch_name}"`,
      `"${e.department_name}"`,
      e.employment_type,
      e.base_salary,
      e.commission_rate,
      e.consultation_share,
      e.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HEAL_Employees_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !analytics) {
    return (
      <div className="p-12 text-center text-slate-500 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>HR Reports & Operational Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-branch cost allocation, clinical workforce ratios, compliance audits, and attendance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportEmployeesCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Staff CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Monthly Payroll Spend</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            ${analytics.branch_stats.reduce((acc, b) => acc + b.monthly_payroll_spend, 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">Across 3 Clinic Branches</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Clinical Workforce Ratio</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {analytics.clinical_vs_admin.clinical_pct}%
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {analytics.clinical_vs_admin.clinical} Clinicians vs {analytics.clinical_vs_admin.admin} Admin/Support
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Credential Compliance Rate</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {analytics.credential_compliance.compliance_rate}%
          </div>
          <span className="text-[11px] text-slate-500">
            {analytics.credential_compliance.valid} Valid • {analytics.credential_compliance.expiring_soon} Expiring Soon
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Average Attendance Rate</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {analytics.attendance_trends[analytics.attendance_trends.length - 1]?.rate}%
          </div>
          <span className="text-[11px] text-slate-400">Past 5 Days Average</span>
        </div>
      </div>

      {/* Multi-Branch Cost & Headcount Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Branch Cost Comparison & Compensation Mix</span>
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Aesthetic clinic procedure incentives vs General medicine OPD consultation fee shares
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.branch_stats.map((b) => (
            <div 
              key={b.branch_id}
              className={`p-4 rounded-xl border ${
                b.type === 'Aesthetic' ? 'bg-purple-50/40 border-purple-200' : 'bg-blue-50/30 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  b.type === 'Aesthetic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {b.type} Branch
                </span>
                <span className="font-mono text-xs text-slate-400">{b.code}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-2">{b.name}</h3>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff Headcount:</span>
                  <span className="font-bold text-slate-900">{b.headcount} Team Members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Payroll:</span>
                  <span className="font-mono text-slate-800">${b.base_payroll?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Variable Commissions:</span>
                  <span className="font-mono font-bold text-purple-700">+${b.variable_incentives?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                  <span className="text-slate-900">Total Monthly Spend:</span>
                  <span className="font-mono text-blue-700">${b.monthly_payroll_spend?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Attendance Trend & Credential Compliance Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Attendance Trend (Past 5 Days)</span>
          </h3>

          <div className="space-y-3">
            {analytics.attendance_trends.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.date}</span>
                  <span className="font-mono text-slate-900">{item.total_present} Present ({item.rate}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Type Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-amber-600" />
            <span>Leave Distribution by Category</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(analytics.leave_distribution).map(([type, count]) => {
              const totalLeaves = Object.values(analytics.leave_distribution).reduce((a, b) => a + b, 0);
              const pct = Math.round((count / (totalLeaves || 1)) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{type} Leave</span>
                    <span className="font-mono text-slate-900">{count} Requests ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

