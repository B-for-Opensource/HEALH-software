import React from 'react';
import { 
  Users, 
  Clock, 
  CalendarCheck, 
  AlertTriangle, 
  Building2, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  UserPlus, 
  FileText, 
  Sparkles,
  Stethoscope
} from 'lucide-react';

export default function DashboardView({ 
  stats, 
  branches, 
  selectedBranch, 
  onReviewLeave, 
  setActiveTab,
  showStaffDetails = false,
  setShowStaffDetails
}) {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Active Staff',
      value: stats.total_employees,
      subtitle: `${stats.branches_count} Clinic Branches`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      tab: 'employees'
    },
    {
      title: "Today's Attendance",
      value: `${stats.present_today} Present`,
      subtitle: `${stats.attendance_rate}% attendance rate (${stats.late_today} late)`,
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      tab: 'attendance'
    },
    {
      title: 'Pending Leave Approvals',
      value: stats.pending_leaves,
      subtitle: 'Doctor/Staff requests waiting',
      icon: CalendarCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      tab: 'leaves'
    },
    {
      title: 'Credential Expiry Alerts',
      value: stats.expiring_credentials,
      subtitle: 'Licenses expiring in ≤ 30 days',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      tab: 'credentials'
    },
  ];

  return (
    <div className="space-y-6">
      {!showStaffDetails ? (
        <div className="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 border border-blue-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Staff Details & Current Staff Are Hidden</span>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Focused View</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Current focus is on the Live Patient Journey Pipeline above. To view staff headcount, attendance rate, doctor roster, and branch distribution, click below or use the button in the top navigation bar.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowStaffDetails && setShowStaffDetails(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Show Staff Details & Operations</span>
          </button>
        </div>
      ) : (
        <>
          {/* Page Title & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Clinic Operations & HR Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized management across 1 Aesthetic Clinic & 2 General Medicine Practice Branches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('employees')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff</span>
          </button>
          <button 
            onClick={() => setActiveTab('leaves')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Apply Leave</span>
          </button>
          <button 
            onClick={() => setActiveTab('payroll')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-xs transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Pay Runs</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Zoho People signature rectangular metric tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx}
              onClick={() => setActiveTab(kpi.tab)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer group hover:border-blue-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.bgColor} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {kpi.value}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{kpi.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Multi-Branch Clinic Breakdown Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Multi-Branch Operating Status</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time headcount and operational focus per clinic facility</p>
          </div>
          <button 
            onClick={() => setActiveTab('organization')} 
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Manage Structure</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.branch_distribution?.map((b) => (
            <div 
              key={b.branch_id}
              className={`p-4 rounded-xl border transition-all ${
                b.type === 'Aesthetic'
                  ? 'bg-purple-50/40 border-purple-200/70 hover:border-purple-300'
                  : 'bg-blue-50/30 border-blue-200/70 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  b.type === 'Aesthetic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {b.type === 'Aesthetic' ? 'Aesthetic & Beauty' : 'General Healthcare'}
                </span>
                <span className="text-xs font-mono font-medium text-slate-400">{b.code}</span>
              </div>
              
              <h3 className="text-sm font-bold text-slate-900 mt-2.5">{b.name}</h3>
              
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
                <span>Active Headcount:</span>
                <span className="font-bold text-slate-900">{b.employee_count} Staff</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Compensation Mode:</span>
                <span className="font-medium text-slate-700">
                  {b.type === 'Aesthetic' ? 'Base + Laser/Skin Commission' : 'Base + OPD Consultation Share'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Today's Shifts & Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Doctor & Clinical Rota */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Today's Roster & On-Call Doctors</span>
            </h2>
            <button 
              onClick={() => setActiveTab('shifts')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Full Roster
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.today_rosters && stats.today_rosters.length > 0 ? (
              stats.today_rosters.map((roster) => (
                <div key={roster.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {roster.employee_avatar ? (
                      <img src={roster.employee_avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-800">{roster.employee_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>{roster.branch_name}</span>
                        <span>•</span>
                        <span>{roster.shift_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-700">{roster.start_time} - {roster.end_time}</div>
                    {roster.is_on_call && (
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Emergency On-Call
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">No shifts scheduled for today.</p>
            )}
          </div>
        </div>

        {/* Pending Approvals (Leave Requests) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              <span>Pending Approvals</span>
            </h2>
            <button 
              onClick={() => setActiveTab('leaves')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              All Requests
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recent_leaves && stats.recent_leaves.filter(l => l.status === 'Pending').length > 0 ? (
              stats.recent_leaves.filter(l => l.status === 'Pending').map((leave) => (
                <div key={leave.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{leave.employee_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{leave.leave_type} Leave</span> ({leave.total_days} days) • {leave.start_date} to {leave.end_date}
                    </div>
                    {leave.substitute_doctor_name && (
                      <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                        Replacement: {leave.substitute_doctor_name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onReviewLeave(leave.id, 'Approved', 'Approved via quick action')}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="Approve Leave"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onReviewLeave(leave.id, 'Rejected', 'Declined due to clinic coverage requirement')}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                      title="Reject Leave"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                <span>All employee requests are up to date!</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

