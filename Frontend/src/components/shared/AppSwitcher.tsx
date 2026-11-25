import React, { useState, useRef, useEffect } from 'react';
import { Layers, Stethoscope, Users, Pill, ExternalLink, ChevronDown, Check } from 'lucide-react';

export type AppPortalId = 'core' | 'hrms' | 'pharmacy';

interface AppSwitcherProps {
  currentApp: AppPortalId;
  variant?: 'light' | 'dark';
}

const APPS = [
  {
    id: 'core' as AppPortalId,
    name: 'HEAL Clinic Core',
    subtitle: 'OP Reception, EMR Workbench & POS',
    icon: Stethoscope,
    badge: 'Core OS',
    color: 'from-amber-600 to-amber-800',
    port: 3000,
    envUrl: (import.meta as any).env?.VITE_CORE_APP_URL || 'http://localhost:3000',
    path: '/reception/queue',
  },
  {
    id: 'hrms' as AppPortalId,
    name: 'HEAL HRMS Suite',
    subtitle: 'Payroll, Staff Rota & Recruitment',
    icon: Users,
    badge: 'HRMS Portal',
    color: 'from-purple-600 to-indigo-800',
    port: 3001,
    envUrl: (import.meta as any).env?.VITE_HRMS_APP_URL || 'http://localhost:3001',
    path: '/hrms/dashboard',
  },
  {
    id: 'pharmacy' as AppPortalId,
    name: 'HEAL Pharmacy OS',
    subtitle: 'Rx Dispensing, FEFO & Procurement',
    icon: Pill,
    badge: 'Dispensary',
    color: 'from-emerald-600 to-teal-800',
    port: 3002,
    envUrl: (import.meta as any).env?.VITE_PHARMACY_APP_URL || 'http://localhost:3002',
    path: '/pharmacy/dispensary',
  },
];

export default function AppSwitcher({ currentApp, variant = 'dark' }: AppSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeApp = APPS.find((a) => a.id === currentApp) || APPS[0];
  const ActiveIcon = activeApp.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (app: typeof APPS[0]) => {
    setOpen(false);
    if (app.id === currentApp) return;

    // Check if we are running in standalone mode on separate ports
    const currentPort = typeof window !== 'undefined' ? window.location.port : '';
    if (currentPort && currentPort !== String(app.port)) {
      // Running separate ports in dev: redirect to app port
      const targetOrigin = `${window.location.protocol}//${window.location.hostname}:${app.port}`;
      window.location.href = `${targetOrigin}${app.path}`;
    } else if (app.envUrl && !app.envUrl.includes(String(window.location.port))) {
      // Production netlify or remote URL
      window.location.href = `${app.envUrl}${app.path}`;
    } else {
      // Single host fallback
      window.location.href = app.path;
    }
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
          variant === 'dark'
            ? 'bg-[#28201B] hover:bg-[#332A24] text-[#EFE8DE] border-[#3D2E24]'
            : 'bg-white hover:bg-[#FAF7F2] text-[#1E1B18] border-[#EDE6DD] shadow-xs'
        }`}
        title="Switch between HEAL Clinic Frontends"
      >
        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${activeApp.color} flex items-center justify-center text-white shrink-0`}>
          <ActiveIcon size={12} />
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-bold text-[11px] leading-tight truncate">{activeApp.name}</div>
        </div>
        <ChevronDown size={12} className={`opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#EDE6DD] p-2 z-50 text-[#1E1B18] animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-[#F4ECE3] mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8E7E73] uppercase tracking-wider">
                HEAL Enterprise Portals
              </span>
              <span className="text-[10px] bg-[#F4ECE3] text-[#965F36] font-bold px-1.5 py-0.5 rounded">
                Unified Backend
              </span>
            </div>
            <p className="text-[11px] text-[#685B52] mt-0.5">
              3 Independent Frontends · Single Backend API
            </p>
          </div>

          <div className="space-y-1">
            {APPS.map((app) => {
              const Icon = app.icon;
              const isCurrent = app.id === currentApp;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => handleSwitch(app)}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                    isCurrent
                      ? 'bg-[#FFF8EE] border border-[#FAAE5A]/40'
                      : 'hover:bg-[#FAF7F2] border border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1E1B18] truncate">
                        {app.name}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold gap-0.5">
                          <Check size={11} /> Current
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8E7E73] font-mono">
                          :{app.port}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-[#685B52] truncate">
                      {app.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[#F4ECE3] px-2 text-[10px] text-[#8E7E73] flex items-center justify-between">
            <span>FastAPI Backend: :8000</span>
            <span className="text-[#965F36] font-bold">Shared JWT Auth</span>
          </div>
        </div>
      )}
    </div>
  );
}
