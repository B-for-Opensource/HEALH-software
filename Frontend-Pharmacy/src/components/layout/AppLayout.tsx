import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { mockBranchService, subscribeToDbChanges } from '@/api';
import CommandPalette from '@/components/shared/CommandPalette';
import BranchNetworkModal from '@/components/shared/BranchNetworkModal';
import HealLogo from '@/components/shared/HealLogo';
import AppSwitcher from '@/components/shared/AppSwitcher';
import {
  Pill, Truck, Settings, LogOut, Menu, X, ChevronRight,
  MapPin, Search, Receipt, Layers, FileText
} from 'lucide-react';

const PHARMACY_NAV = [
  {
    section: '1. Clinical Pharmacy & Dispensing',
    items: [
      { to: '/pharmacy/dispensary', icon: Pill, label: 'Rx Dispensing & FEFO Batches' },
    ],
  },
  {
    section: '2. Procurement & Consumables',
    items: [
      { to: '/inventory/transfers', icon: Truck, label: 'PO, GRN & Branch Transfers' },
    ],
  },
  {
    section: '3. Formulary & Medicine Master',
    items: [
      { to: '/masters/medicines', icon: Settings, label: 'Medicine & Formulary Master' },
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const [activeBranch, setActiveBranch] = useState(() => mockBranchService.getActiveBranch());
  const branches = [
    { id: 'krn-branch-001', name: 'Karanthoor (Flagship)' },
    { id: 'clt-branch-002', name: 'Beach Road (Calicut City)' },
    { id: 'wyd-branch-003', name: 'Sulthan Bathery (Wayanad)' },
    { id: 'all',            name: 'Consolidated HQ (All 3 Branches)' },
  ];

  useEffect(() => {
    const unsubscribe = subscribeToDbChanges(() => {
      setActiveBranch(mockBranchService.getActiveBranch());
    });
    return unsubscribe;
  }, []);

  const handleBranchChange = (bId: string) => {
    mockBranchService.setActiveBranch(bId);
    setActiveBranch(mockBranchService.getActiveBranch());
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

      {/* Responsive Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0E1F1A] text-[#EFE8DE] transition-all duration-300 border-r border-[#1B352D]
          lg:static lg:z-20
          ${sidebarOpen
            ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none'
            : '-translate-x-full lg:translate-x-0 lg:w-16'
          }
        `}
      >
        {/* Header with HEAL Logo */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#1B352D]">
          {sidebarOpen ? (
            <div>
              <HealLogo size="sm" variant="light" showSubtitle={false} />
              <div className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase mt-0.5">
                Pharmacy & Dispensary OS
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-sm text-white">
              Rx
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#C4B3A3] hover:text-white p-1 rounded-lg hover:bg-[#1B352D] transition cursor-pointer"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Universal Portal Switcher in Sidebar */}
        {sidebarOpen && (
          <div className="px-3 pt-3">
            <AppSwitcher currentApp="pharmacy" variant="dark" />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1">
          {PHARMACY_NAV.map((group) => (
            <div key={group.section} className="mb-2">
              {sidebarOpen && (
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-emerald-300/60 uppercase tracking-wider">
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
                    className={`flex items-center gap-2.5 px-3 py-2 my-0.5 mx-1.5 rounded-xl text-xs transition-colors ${
                      active
                        ? 'bg-emerald-700 text-white font-bold shadow-md shadow-emerald-950/40'
                        : 'text-[#C4B3A3] hover:text-white hover:bg-[#1B352D]'
                    }`}
                  >
                    <Icon size={14} className={`shrink-0 ${active ? 'text-amber-300' : 'text-emerald-400/80'}`} />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                    {sidebarOpen && active && <ChevronRight size={11} className="ml-auto text-amber-300" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User / Logout Footer */}
        <div className="border-t border-[#1B352D] p-3 space-y-2 bg-[#0A1713]">
          {sidebarOpen && user && (
            <div>
              <p className="text-xs font-bold text-[#FAF8F5] truncate">{user.full_name || user.name || user.username}</p>
              <p className="text-[11px] text-emerald-300/80 capitalize">{user.role?.replace('_', ' ')} · Pharmacy OS</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-emerald-300/80 hover:text-red-400 text-xs px-1 py-1 rounded transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              {sidebarOpen && 'Sign Out'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-12 bg-[#FAF8F5] border-b border-[#EDE6DD] px-3 sm:px-4 flex items-center justify-between shrink-0 text-xs shadow-2xs z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile/Tablet Menu Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-emerald-900 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-100 transition shrink-0"
              title="Toggle Menu"
            >
              <Menu size={18} />
            </button>

            <AppSwitcher currentApp="pharmacy" variant="light" />

            <div className="flex items-center gap-1.5 shrink-0">
              <MapPin size={14} className="text-emerald-700 shrink-0" />
              <span className="font-bold text-[#3B312A] hidden sm:inline">Dispensary:</span>
              <select
                value={activeBranch.id}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="bg-white border border-[#EDE6DD] rounded-xl px-2 py-1 text-xs font-bold text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-xs max-w-[130px] sm:max-w-none truncate"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Dedicated Pharmacy Frontend (Port 3002)
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[#8E7E73] font-medium hidden md:inline">
              Pharmacist: <strong className="text-[#1E1B18]">{user?.full_name || user?.username}</strong>
            </span>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#FAF7F2] p-3 sm:p-5 md:p-6 2xl:p-8 3xl:p-10 w-full">
          <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
