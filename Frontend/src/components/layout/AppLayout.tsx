import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Users, Calendar, Stethoscope, Receipt, FileText,
  BarChart2, Settings, LogOut, Menu, X, ChevronRight, Sparkles
} from 'lucide-react';

const NAV = [
  {
    section: 'Reception',
    items: [
      { to: '/reception/register',    icon: Users,       label: 'Patient Registration' },
      { to: '/reception/queue',       icon: Calendar,    label: 'Token Queue' },
      { to: '/reception/followups',   icon: FileText,    label: 'Follow-Up Queue' },
    ],
  },
  {
    section: 'Clinical',
    items: [
      { to: '/clinical/workbench',    icon: Stethoscope, label: 'Doctor Workbench' },
    ],
  },
  {
    section: 'Aesthetic',
    items: [
      { to: '/aesthetic/packages',    icon: Sparkles,    label: 'Packages & Sessions' },
    ],
  },
  {
    section: 'Billing',
    items: [
      { to: '/billing/pos',           icon: Receipt,     label: 'Billing POS' },
      { to: '/billing/ledger',        icon: FileText,    label: 'AR Ledger' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { to: '/reports/dashboard',     icon: BarChart2,   label: 'Dashboard' },
      { to: '/reports/collection',    icon: BarChart2,   label: 'Collection Report' },
      { to: '/reports/billing',       icon: BarChart2,   label: 'Billing Report' },
    ],
  },
  {
    section: 'Masters',
    items: [
      { to: '/masters/patients',      icon: Users,       label: 'Patient Directory' },
      { to: '/masters/doctors',       icon: Stethoscope, label: 'Doctors' },
      { to: '/masters/medicines',     icon: Settings,    label: 'Medicine Master' },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} flex-shrink-0 bg-slate-900 text-white flex flex-col transition-all duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center font-black text-xs">H</div>
              <span className="font-bold text-sm text-white">HEAL Clinic</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1 rounded">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((group) => (
            <div key={group.section} className="mb-1">
              {sidebarOpen && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                    {sidebarOpen && active && <ChevronRight size={12} className="ml-auto" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-slate-700 p-3">
          {sidebarOpen && user && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user.role.replace('_', ' ')} · {user.branch_name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs w-full px-1 py-1.5 rounded transition-colors"
          >
            <LogOut size={14} />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
