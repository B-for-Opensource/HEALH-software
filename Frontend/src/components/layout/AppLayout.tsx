import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { resetDatabaseToDefaults, mockBranchService, getDb, subscribeToDbChanges } from '@/api';
import CommandPalette from '@/components/shared/CommandPalette';
import BranchNetworkModal from '@/components/shared/BranchNetworkModal';
import HealLogo from '@/components/shared/HealLogo';
import {
  Users, Calendar, Stethoscope, Receipt, FileText,
  BarChart2, Settings, LogOut, Menu, X, ChevronRight, Sparkles,
  RotateCcw, ShieldCheck, MapPin, Bed, Pill, Truck, Award, Lock,
  Search, Layers, Camera, Share2, Globe, Building2, Clock,
  CalendarCheck, CircleDollarSign, Briefcase, User
} from 'lucide-react';

const NAV = [
  {
    section: '1. Reception & Outpatients (CMS)',
    items: [
      { to: '/reception/register',    icon: Users,        label: 'Fast OP Registration' },
      { to: '/reception/queue',       icon: Calendar,     label: 'Live Token Queue' },
      { to: '/reception/calendar',    icon: Calendar,     label: 'Doctor Slot Calendar' },
      { to: '/reception/followups',   icon: FileText,     label: 'Follow-Up Review Queue' },
    ],
  },
  {
    section: '2. Clinical EMR Core',
    items: [
      { to: '/clinical/workbench',    icon: Stethoscope,  label: 'Doctor EMR Workbench' },
    ],
  },
  {
    section: '3. Aesthetic Care & Vault',
    items: [
      { to: '/aesthetic/packages',    icon: Sparkles,     label: 'Packages & Session Ledger' },
      { to: '/aesthetic/photos',      icon: Camera,       label: 'Before/After Photo Vault' },
    ],
  },
  {
    section: '4. Daycare & Minor Procedures',
    items: [
      { to: '/daycare/lounges',       icon: Bed,          label: 'Daycare Bed & Recliner Map' },
    ],
  },
  {
    section: '5. Point of Sale & Billing',
    items: [
      { to: '/billing/pos',           icon: Receipt,      label: 'Unified OP Billing Terminal' },
      { to: '/billing/shifts',        icon: Lock,         label: 'Cashier Shift Balancing' },
      { to: '/billing/ledger',        icon: FileText,     label: 'Customer AR Ledger' },
    ],
  },
  {
    section: '6. Pharmacy & Dispensary',
    items: [
      { to: '/pharmacy/dispensary',   icon: Pill,         label: 'Rx Dispensing & FEFO Batches' },
    ],
  },
  {
    section: '7. Procurement & Consumables',
    items: [
      { to: '/inventory/transfers',   icon: Truck,        label: 'PO, GRN & Branch Transfers' },
    ],
  },
  {
    section: '8. HRMS & Workforce Management Suite',
    items: [
      { to: '/hrms/dashboard',        icon: BarChart2,         label: 'HR Dashboard Overview' },
      { to: '/hrms/organization',     icon: Building2,        label: 'Organization & Branches' },
      { to: '/hrms/employees',        icon: Users,            label: 'Staff Directory' },
      { to: '/hrms/attendance',       icon: Clock,            label: 'Attendance & Live Punch' },
      { to: '/hrms/shifts',           icon: Calendar,         label: 'Shifts & Doctor Rota' },
      { to: '/hrms/leaves',           icon: CalendarCheck,    label: 'Leave Coverage Tracker' },
      { to: '/hrms/payroll',          icon: CircleDollarSign, label: 'Payroll & Commissions' },
      { to: '/hrms/credentials',      icon: Award,            label: 'Medical Board Compliance' },
      { to: '/hrms/recruitment',      icon: Briefcase,        label: 'Recruitment & Job Pipeline' },
      { to: '/hrms/reports',          icon: BarChart2,        label: 'Workforce Analytics' },
      { to: '/hrms/selfservice',      icon: User,             label: 'Employee Self-Service (ESS)' },
      { to: '/hrms/commissions',      icon: Award,            label: 'Duty Roster & Commission' },
      { to: '/masters/doctors',       icon: Users,            label: 'Doctor Profiles & RBAC' },
    ],
  },
  {
    section: '9. Reports & Forensic Audit',
    items: [
      { to: '/reports/dashboard',     icon: BarChart2,    label: 'Executive KPI Dashboard' },
      { to: '/reports/collection',    icon: BarChart2,    label: 'Cashier Collection Audit' },
      { to: '/reports/billing',       icon: BarChart2,    label: 'GST & Sales Summary' },
      { to: '/reports/audit-trail',   icon: ShieldCheck,  label: 'Forensic Audit Trail' },
    ],
  },
  {
    section: '10. Master Data Catalogs',
    items: [
      { to: '/masters/patients',      icon: Users,        label: 'Patient Directory' },
      { to: '/masters/medicines',     icon: Settings,     label: 'Medicine & Formulary Master' },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Branch switcher state
  const [activeBranch, setActiveBranch] = useState(() => mockBranchService.getActiveBranch());
  const branches = [
    { id: 'krn-branch-001', name: 'Karanthoor (Flagship)' },
    { id: 'clt-branch-002', name: 'Beach Road (Calicut City)' },
    { id: 'wyd-branch-003', name: 'Sulthan Bathery (Wayanad)' },
    { id: 'all',            name: 'Consolidated HQ (All 3 Branches)' },
  ];

  // Subscribe to live cross-tab changes
  useEffect(() => {
    const unsubscribe = subscribeToDbChanges(() => {
      // Refresh active branch if changed from another tab
      setActiveBranch(mockBranchService.getActiveBranch());
    });
    return unsubscribe;
  }, []);

  const handleBranchChange = (bId: string) => {
    mockBranchService.setActiveBranch(bId);
    try {
      let num = '1';
      if (bId === 'krn-branch-001') num = '1';
      else if (bId === 'clt-branch-002') num = '2';
      else if (bId === 'wyd-branch-003') num = '3';
      else if (bId === 'all') num = '4';
      sessionStorage.setItem('HEAL_ACTIVE_BRANCH_TAB', bId);
      window.history.replaceState({}, '', `/${num}`);
    } catch (e) {}
    setActiveBranch(mockBranchService.getActiveBranch());
    window.location.reload();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleResetData = () => {
    if (confirm('Reset all demo data back to initial seeds? Any custom patients or bills created during this session will be restored to initial defaults.')) {
      resetDatabaseToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden font-brand-sans">
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
      <BranchNetworkModal
        isOpen={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
        activeBranchId={activeBranch.id}
        onBranchSelect={handleBranchChange}
      />

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-[#1E1815] text-[#EFE8DE] flex flex-col transition-all duration-200 z-20 border-r border-[#2C231E]`}>
        {/* Header with Authentic HEAL Logo */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#2C231E]">
          {sidebarOpen ? (
            <HealLogo size="sm" variant="light" showSubtitle={true} />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#965F36] flex items-center justify-center font-bold text-sm text-white font-brand-serif">
              H
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#C4B3A3] hover:text-white p-1 rounded-lg hover:bg-[#2C231E] transition">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Search button in sidebar */}
        {sidebarOpen && (
          <div className="px-3 pt-3">
            <button
              onClick={() => setCommandOpen(true)}
              className="w-full bg-[#28201B] hover:bg-[#332A24] text-[#C4B3A3] hover:text-[#FAF8F5] text-xs px-3 py-2 rounded-xl flex items-center justify-between border border-[#3A2E26] transition"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-[#965F36]" />
                <span>Command Palette...</span>
              </div>
              <kbd className="text-[10px] bg-[#3A2E26] text-[#EFE8DE] px-1.5 py-0.5 rounded font-mono">
                Ctrl+K
              </kbd>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1">
          {NAV.map((group) => (
            <div key={group.section} className="mb-2">
              {sidebarOpen && (
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-[#8E7E73] uppercase tracking-wider">
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
                    className={`flex items-center gap-2.5 px-3 py-2 my-0.5 mx-1.5 rounded-xl text-xs transition-colors ${
                      active
                        ? 'bg-[#965F36] text-white font-bold shadow-md shadow-[#965F36]/25'
                        : 'text-[#C4B3A3] hover:text-white hover:bg-[#2C231E]'
                    }`}
                  >
                    <Icon size={14} className={`flex-shrink-0 ${active ? 'text-[#FAAE5A]' : 'text-[#8E7E73]'}`} />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                    {sidebarOpen && active && <ChevronRight size={11} className="ml-auto text-[#FAAE5A]" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User / Logout Footer */}
        <div className="border-t border-[#2C231E] p-3 space-y-2 bg-[#17120F]">
          {sidebarOpen && user && (
            <div>
              <p className="text-xs font-bold text-[#FAF8F5] truncate">{user.full_name || user.name || user.username}</p>
              <p className="text-[11px] text-[#A39487] capitalize">{user.role?.replace('_', ' ')} · {activeBranch.branch_code || 'KRN'}</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[#A39487] hover:text-red-400 text-xs px-1 py-1 rounded transition-colors"
            >
              <LogOut size={13} />
              {sidebarOpen && 'Sign Out'}
            </button>
            {sidebarOpen && (
              <button
                onClick={handleResetData}
                title="Reset local storage database to default seeds"
                className="text-[10px] text-[#A39487] hover:text-[#FAAE5A] flex items-center gap-1 transition"
              >
                <RotateCcw size={11} />
                Reset Data
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Banner [SCR-01 & Multi-Branch Switcher] */}
        <header className="h-12 bg-[#FAF8F5] border-b border-[#EDE6DD] px-4 flex items-center justify-between shrink-0 text-xs shadow-2xs z-10">
          <div className="flex items-center gap-3">
            {/* Multi-Branch Selector */}
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[#965F36]" />
              <span className="font-bold text-[#3B312A] hidden sm:inline">Active Branch:</span>
              <select
                value={activeBranch.id}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="bg-white border border-[#EDE6DD] rounded-xl px-2.5 py-1 text-xs font-bold text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#965F36] cursor-pointer shadow-xs"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Investor Links & Cross-Branch Sync Button */}
            <button
              onClick={() => setNetworkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8EE] hover:bg-[#FEEFD8] text-[#965F36] border border-[#F6D3A8] transition cursor-pointer shadow-xs"
              title="View shareable links for all 3 branches and manage cross-branch storage sync"
            >
              <Share2 size={13} className="text-[#965F36]" />
              <span className="hidden sm:inline">3-Branch Links & Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FAAE5A] animate-pulse ml-0.5" />
            </button>

            <span className="text-[#D5C2B1] hidden md:inline">|</span>

            {/* MVP Mode Pill */}
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#F4ECE3] text-[#965F36] border border-[#E5D7C7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#965F36] animate-pulse"></span>
              Full 10-Module ERP · Aesthetic Clinic Suite
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 bg-white hover:bg-[#F5EDE3] text-[#5C5047] px-3 py-1 rounded-xl text-xs font-medium border border-[#EDE6DD] transition shadow-xs"
            >
              <Search size={12} className="text-[#965F36]" />
              <span>Quick Search</span>
              <kbd className="text-[10px] font-mono bg-[#FAF8F5] px-1.5 py-0.2 rounded border border-[#EDE6DD] text-[#8E7E73] ml-1">
                Ctrl+K
              </kbd>
            </button>

            <span className="text-[#8E7E73] font-medium hidden xl:inline">
              User: <strong className="text-[#1E1B18]">{user?.full_name || user?.username}</strong>
            </span>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#FAF7F2]">
          {children}
        </main>
      </div>
    </div>
  );
}
