import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { resetDatabaseToDefaults, mockBranchService, getDb, subscribeToDbChanges } from '@/api';
import CommandPalette from '@/components/shared/CommandPalette';
import BranchNetworkModal from '@/components/shared/BranchNetworkModal';
import HealLogo from '@/components/shared/HealLogo';
import AppSwitcher from '@/components/shared/AppSwitcher';
import PatientPipelineTracker from '@/components/shared/PatientPipelineTracker';
import {
  Users, Calendar, Stethoscope, Receipt, FileText,
  BarChart2, Settings, LogOut, Menu, X, ChevronRight, Sparkles,
  RotateCcw, ShieldCheck, MapPin, Bed, Pill, Truck, Award, Lock,
  Search, Layers, Camera, Share2, Globe, Building2, Clock,
  CalendarCheck, CircleDollarSign, Briefcase, User, FlaskConical, Activity
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  roles?: string[];
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    section: '1. Reception & Outpatients (CMS)',
    items: [
      { to: '/reception/register', icon: Users, label: 'Fast OP Registration', roles: ['Super Admin', 'Branch Manager', 'Receptionist', 'Reception'] },
      { to: '/reception/queue', icon: Calendar, label: 'Live Token Queue', roles: ['Super Admin', 'Branch Manager', 'Receptionist', 'Reception', 'Doctor', 'Therapist', 'Nurse'] },
      { to: '/reception/calendar', icon: Calendar, label: 'Doctor Slot Calendar', roles: ['Super Admin', 'Branch Manager', 'Receptionist', 'Reception', 'Doctor'] },
      { to: '/reception/followups', icon: FileText, label: 'Follow-Up Review Queue', roles: ['Super Admin', 'Branch Manager', 'Receptionist', 'Reception', 'Doctor'] },
    ],
  },
  {
    section: '2. Clinical EMR Core',
    items: [
      { to: '/clinical/workbench', icon: Stethoscope, label: 'Doctor EMR Workbench', roles: ['Super Admin', 'Branch Manager', 'Doctor'] },
      { to: '/clinical/lab', icon: FlaskConical, label: 'Lab Orders & Diagnostics', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Nurse', 'Lab Technician'] },
      { to: '/clinical/imaging', icon: Camera, label: 'Imaging & Radiology (X-Ray/MRI)', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Nurse', 'Radiologist'] },
    ],
  },
  {
    section: '3. Aesthetic Care & Vault',
    items: [
      { to: '/aesthetic/packages', icon: Sparkles, label: 'Packages & Session Ledger', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Therapist', 'Nurse'] },
      { to: '/aesthetic/photos', icon: Camera, label: 'Before/After Photo Vault', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Therapist', 'Nurse'] },
    ],
  },
  {
    section: '4. Nurse Station & Minor Procedures',
    items: [
      { to: '/daycare/lounges', icon: Activity, label: 'Nurse Station & Minor Procedures', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Therapist', 'Nurse'] },
    ],
  },
  {
    section: '5. Point of Sale & Billing',
    items: [
      { to: '/billing/pos', icon: Receipt, label: 'Unified OP Billing Terminal', roles: ['Super Admin', 'Branch Manager', 'Cashier', 'Receptionist', 'Reception'] },
      { to: '/billing/shifts', icon: Lock, label: 'Cashier Shift Balancing', roles: ['Super Admin', 'Branch Manager', 'Cashier'] },
      { to: '/billing/ledger', icon: FileText, label: 'Customer AR Ledger', roles: ['Super Admin', 'Branch Manager', 'Cashier', 'Receptionist', 'Reception'] },
    ],
  },
  {
    section: '6. Pharmacy & Dispensary',
    items: [
      { to: '/pharmacy/dispensary', icon: Pill, label: 'Rx Dispensing & FEFO Batches', roles: ['Super Admin', 'Branch Manager', 'Pharmacist'] },
    ],
  },
  {
    section: '7. Procurement & Consumables',
    items: [
      { to: '/inventory/transfers', icon: Truck, label: 'PO, GRN & Branch Transfers', roles: ['Super Admin', 'Branch Manager', 'Pharmacist'] },
    ],
  },
  {
    section: '8. HRMS & Workforce Management Suite',
    items: [
      { to: '/hrms/dashboard', icon: BarChart2, label: 'HR Dashboard Overview', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/organization', icon: Building2, label: 'Organization & Branches', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/employees', icon: Users, label: 'Staff Directory', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/attendance', icon: Clock, label: 'Attendance & Live Punch', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/shifts', icon: Calendar, label: 'Shifts & Doctor Rota', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/leaves', icon: CalendarCheck, label: 'Leave Coverage Tracker', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/payroll', icon: CircleDollarSign, label: 'Payroll & Commissions', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/credentials', icon: Award, label: 'Medical Board Compliance', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/recruitment', icon: Briefcase, label: 'Recruitment & Job Pipeline', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/reports', icon: BarChart2, label: 'Workforce Analytics', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/hrms/selfservice', icon: User, label: 'Employee Self-Service (ESS)', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Receptionist', 'Reception', 'Cashier', 'Pharmacist', 'Therapist', 'Nurse'] },
      { to: '/hrms/commissions', icon: Award, label: 'Duty Roster & Commission', roles: ['Super Admin', 'Branch Manager', 'Doctor'] },
      { to: '/masters/doctors', icon: Users, label: 'Doctor Profiles & RBAC', roles: ['Super Admin', 'Branch Manager'] },
    ],
  },
  {
    section: '9. Reports & Forensic Audit',
    items: [
      { to: '/reports/dashboard', icon: BarChart2, label: 'Executive KPI Dashboard', roles: ['Super Admin', 'Branch Manager'] },
      { to: '/reports/collection', icon: BarChart2, label: 'Cashier Collection Audit', roles: ['Super Admin', 'Branch Manager', 'Cashier'] },
      { to: '/reports/billing', icon: BarChart2, label: 'GST & Sales Summary', roles: ['Super Admin', 'Branch Manager', 'Cashier'] },
      { to: '/reports/audit-trail', icon: ShieldCheck, label: 'Forensic Audit Trail', roles: ['Super Admin', 'Branch Manager'] },
    ],
  },
  {
    section: '10. Master Data Catalogs',
    items: [
      { to: '/masters/patients', icon: Users, label: 'Patient Directory', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Receptionist', 'Reception', 'Cashier', 'Pharmacist', 'Therapist', 'Nurse'] },
      { to: '/masters/medicines', icon: Settings, label: 'Medicine & Formulary Master', roles: ['Super Admin', 'Branch Manager', 'Doctor', 'Pharmacist', 'Therapist', 'Nurse'] },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [commandOpen, setCommandOpen] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Responsive screen-size listener
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Branch switcher state
  const [activeBranch, setActiveBranch] = useState(() => mockBranchService.getActiveBranch());
  const isSuperUser = ['Super Admin', 'Admin', 'Branch Manager'].includes(user?.role || '');
  const branches = [
    { id: 'krn-branch-001', name: 'Karanthoor (Flagship)' },
    { id: 'clt-branch-002', name: 'Beach Road (Calicut City)' },
    { id: 'wyd-branch-003', name: 'Sulthan Bathery (Wayanad)' },
    ...(isSuperUser ? [{ id: 'all', name: 'Consolidated HQ (All 3 Branches)' }] : []),
  ];

  // Role-based navigation filtering
  const visibleNav = NAV.map((group) => {
    const visibleItems = group.items.filter((item) => {
      if (isSuperUser) return true;
      if (!item.roles) return false;
      return item.roles.includes(user?.role || '');
    });
    return { ...group, items: visibleItems };
  }).filter((group) => group.items.length > 0);

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
    } catch (e) { }
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
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden font-brand-sans relative">
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
      <BranchNetworkModal
        isOpen={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
        activeBranchId={activeBranch.id}
        onBranchSelect={handleBranchChange}
      />

      {/* Mobile/Tablet Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Responsive Sidebar (Slide-over drawer on Mobile/Tablet, Collapsible Rail/Bar on Laptop & TV) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-[#1E1815] text-[#EFE8DE] transition-all duration-300 border-r border-[#2C231E]
          lg:static lg:z-20
          ${sidebarOpen
            ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none'
            : '-translate-x-full lg:translate-x-0 lg:w-16'
          }
        `}
      >
        {/* Header with Authentic HEAL Logo */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#2C231E]">
          {sidebarOpen ? (
            <HealLogo size="sm" variant="light" showSubtitle={true} />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#965F36] flex items-center justify-center font-bold text-sm text-white font-brand-serif">
              H
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#C4B3A3] hover:text-white p-1 rounded-lg hover:bg-[#2C231E] transition"
            title="Toggle Menu"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Universal Portal Switcher in Sidebar */}
        {sidebarOpen && (
          <div className="px-3 pt-3">
            <AppSwitcher currentApp="core" variant="dark" />
          </div>
        )}

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
          {visibleNav.map((group) => (
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
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 my-0.5 mx-1.5 rounded-xl text-xs transition-colors ${active
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Banner [Responsive across Mobile, Tablet, Laptop & TV] */}
        <header className="h-12 bg-[#FAF8F5] border-b border-[#EDE6DD] px-3 sm:px-4 flex items-center justify-between shrink-0 text-xs shadow-2xs z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile/Tablet Menu Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-[#5C5047] hover:text-[#1E1815] p-1.5 rounded-lg hover:bg-[#EDE6DD] transition shrink-0"
              title="Toggle Menu"
            >
              <Menu size={18} />
            </button>

            <AppSwitcher currentApp="core" variant="light" />

            {/* Multi-Branch Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <MapPin size={14} className="text-[#965F36] shrink-0" />
              <span className="font-bold text-[#3B312A] hidden sm:inline">Branch:</span>
              <select
                value={activeBranch.id}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="bg-white border border-[#EDE6DD] rounded-xl px-2 py-1 text-xs font-bold text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#965F36] cursor-pointer shadow-xs max-w-[130px] sm:max-w-none truncate"
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
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8EE] hover:bg-[#FEEFD8] text-[#965F36] border border-[#F6D3A8] transition cursor-pointer shadow-xs shrink-0"
              title="View shareable links for all 3 branches and manage cross-branch storage sync"
            >
              <Share2 size={13} className="text-[#965F36]" />
              <span className="hidden md:inline">3-Branch Links</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FAAE5A] animate-pulse ml-0.5" />
            </button>

            <span className="text-[#D5C2B1] hidden lg:inline">|</span>

            {/* MVP Mode Pill */}
            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#F4ECE3] text-[#965F36] border border-[#E5D7C7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#965F36] animate-pulse"></span>
              Full Clinic Suite
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 bg-white hover:bg-[#F5EDE3] text-[#5C5047] px-2.5 sm:px-3 py-1 rounded-xl text-xs font-medium border border-[#EDE6DD] transition shadow-xs"
            >
              <Search size={12} className="text-[#965F36]" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="text-[10px] font-mono bg-[#FAF8F5] px-1.5 py-0.2 rounded border border-[#EDE6DD] text-[#8E7E73] ml-1">
                Ctrl+K
              </kbd>
            </button>

            <span className="text-[#8E7E73] font-medium hidden 2xl:inline">
              User: <strong className="text-[#1E1B18]">{user?.full_name || user?.username}</strong>
            </span>
          </div>
        </header>

        {/* Scrollable Main Content — Responsive for Mobile, Tablet, Laptop & TV screens */}
        <main className="flex-1 overflow-y-auto bg-[#FAF7F2] p-3 sm:p-4 md:p-6 2xl:p-8 3xl:p-10 w-full">
          <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto w-full transition-all">
            <PatientPipelineTracker />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
