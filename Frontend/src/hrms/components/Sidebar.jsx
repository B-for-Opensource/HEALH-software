import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Clock, 
  CalendarDays, 
  CalendarCheck, 
  CircleDollarSign, 
  Award, 
  Briefcase, 
  UserCircle2,
  Sparkles,
  Stethoscope,
  BarChart3,
  LogOut
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  pendingLeavesCount, 
  expiringCredsCount,
  onLogout,
  currentUser
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organization', label: 'Organization & Branches', icon: Building2 },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'attendance', label: 'Attendance & Punch', icon: Clock },
    { id: 'shifts', label: 'Shifts & Rota', icon: CalendarDays },
    { 
      id: 'leaves', 
      label: 'Leave Tracker', 
      icon: CalendarCheck,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : null,
      badgeColor: 'bg-amber-500'
    },
    { id: 'payroll', label: 'Payroll & Commission', icon: CircleDollarSign },
    { 
      id: 'credentials', 
      label: 'Medical Compliance', 
      icon: Award,
      badge: expiringCredsCount > 0 ? expiringCredsCount : null,
      badgeColor: 'bg-rose-500'
    },
    { id: 'recruitment', label: 'Recruitment & Jobs', icon: Briefcase },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'selfservice', label: 'Self Service (ESS)', icon: UserCircle2 },
  ];

  return (
    <aside className="w-64 bg-zoho-navy text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800 bg-slate-900/40">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-lg">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide text-base">
            <span>HEAL</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">HRMS</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">3-Branch Clinic Suite</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Main Modules
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Clinic Branch Summary Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/30 text-xs">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-300">Clinic Network</span>
        </div>
        <div className="space-y-1.5 text-[11px] mb-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Aesthetic Clinic
            </span>
            <span className="font-mono text-purple-300 text-[10px]">1 Laser Center</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              General Medicine
            </span>
            <span className="font-mono text-blue-300 text-[10px]">2 Clinics</span>
          </div>
        </div>

        {/* User Card + Logout in Sidebar */}
        {currentUser && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <img 
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} 
                alt="" 
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700" 
              />
              <div className="truncate">
                <p className="text-white font-semibold text-[11px] truncate">{currentUser.full_name}</p>
                <p className="text-slate-400 text-[10px] truncate">{currentUser.role}</p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                title="Log out of HR account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
