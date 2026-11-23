import React, { useState } from 'react';
import {
  UserCircle2,
  Clock,
  CalendarCheck,
  FileCheck2,
  MapPin,
  Mail,
  Phone,
  Award,
  Building2,
  Stethoscope,
  Sparkles
} from 'lucide-react';

export default function SelfServiceView({
  currentUser,
  attendanceLogs,
  leaves,
  onPunch,
  punchLoading,
  setActiveTab
}) {
  const userAttendance = (attendanceLogs || []).filter(a => a.employee_id === currentUser?.id);
  const userLeaves = (leaves || []).filter(l => l.employee_id === currentUser?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCircle2 className="w-5 h-5 text-blue-600" />
          <span>Employee Self-Service (ESS) Portal</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Personal profile, time tracking, leave balances, and salary vouchers
        </p>
      </div>

      {/* Profile Overview Card (Zoho People signature personal profile banner) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name}
              className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-slate-200"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md"
              style={{ backgroundColor: currentUser?.avatar_color || '#0078D4' }}
            >
              {currentUser?.first_name ? currentUser.first_name[0] : 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentUser?.full_name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {currentUser?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">
              {currentUser?.designation_title || currentUser?.role}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="font-mono font-medium">{currentUser?.emp_code}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentUser?.branch_name}</span>
              </span>
              <span>•</span>
              <span>Joined: {currentUser?.date_of_joining}</span>
            </div>
          </div>
        </div>

        {/* Quick Punch Button */}
        <div className="flex flex-col items-center sm:items-end gap-2">
          <button
            onClick={onPunch}
            disabled={punchLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>{punchLoading ? 'Recording...' : 'Quick Web Punch (In/Out)'}</span>
          </button>
          <span className="text-[10px] text-slate-400">Terminal IP: 192.168.1.45 (Verified)</span>
        </div>
      </div>

      {/* Two Column Grid: My Time Logs & My Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Recent Attendance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>My Recent Time Logs</span>
            </h3>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Full Timesheet
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {userAttendance.length > 0 ? (
              userAttendance.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{log.date}</span>
                    <div className="text-[11px] text-slate-400">{log.method} • {log.ip_or_location}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium text-slate-700">
                      In: {log.punch_in || '—'} | Out: {log.punch_out || '—'}
                    </div>
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 mt-0.5">
                      {log.status} ({log.work_hours} hrs)
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400">No time logs recorded yet for current user.</p>
            )}
          </div>
        </div>

        {/* My Leave History & Applications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              <span>My Leave Requests</span>
            </h3>
            <button
              onClick={() => setActiveTab('leaves')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Apply New Leave
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {userLeaves.length > 0 ? (
              userLeaves.map((l) => (
                <div key={l.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{l.leave_type} Leave</span>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {l.start_date} to {l.end_date} ({l.total_days} days)
                    </div>
                    {l.substitute_doctor_name && (
                      <div className="text-[10px] text-blue-600">Cover: {l.substitute_doctor_name}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${l.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : l.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                      {l.status}
                    </span>
                    {l.reviewer_comment && (
                      <div className="text-[10px] text-slate-400 mt-0.5 italic">{l.reviewer_comment}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400">No leave requests on file.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

