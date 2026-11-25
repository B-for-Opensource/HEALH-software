import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Receipt, 
  Stethoscope, 
  Calendar, 
  Sparkles, 
  Bed, 
  Pill, 
  Truck, 
  DollarSign, 
  ShieldCheck,
  X,
  ArrowRight
} from 'lucide-react';
import { getDb } from '@/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const db = getDb();
  const q = query.trim().toLowerCase();

  // Search items
  const matchedPatients = (db.patients || []).filter((p: any) =>
    (p.first_name || '').toLowerCase().includes(q) ||
    (p.last_name || '').toLowerCase().includes(q) ||
    (p.op_no || '').toLowerCase().includes(q) ||
    (p.phone || '').toLowerCase().includes(q)
  ).slice(0, 4);

  const matchedDoctors = (db.staff || []).filter((s: any) =>
    (s.full_name || '').toLowerCase().includes(q) ||
    (s.specialisation || '').toLowerCase().includes(q)
  ).slice(0, 3);

  const quickNav = [
    { label: 'Register New Patient', icon: User, path: '/reception/register', desc: 'OP Registration' },
    { label: 'Token Queue & Waiting Hall', icon: Calendar, path: '/reception/queue', desc: 'Live token board' },
    { label: 'Doctor EMR Workbench', icon: Stethoscope, path: '/clinical/workbench', desc: 'Active consultations' },
    { label: 'Billing POS Counter', icon: Receipt, path: '/billing/pos', desc: 'New Invoice' },
    { label: 'Daycare & Recovery Beds', icon: Bed, path: '/daycare/lounges', desc: 'Lounge map' },
    { label: 'Pharmacy & OTC Dispensary', icon: Pill, path: '/pharmacy/dispensary', desc: 'Rx dispensing' },
    { label: 'Inter-Branch Stock Transfers', icon: Truck, path: '/inventory/transfers', desc: 'Consumables' },
    { label: 'Commission Engine', icon: DollarSign, path: '/hrms/commissions', desc: 'Doctor payouts' },
  ].filter((n) => !q || n.label.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1815]/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 font-brand-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-[#EDE6DD] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#EDE6DD] flex items-center gap-3 bg-[#FAF8F5]">
          <Search className="w-5 h-5 text-[#965F36] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search patients, OP #, doctors, or screens (e.g. 'Fathima', 'Bill', 'Queue')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-[#1E1B18] placeholder:text-[#A39487] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white border border-[#EDE6DD] rounded text-[#8E7E73] shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="p-3 overflow-y-auto space-y-4 text-xs bg-[#FAF7F2]">
          {/* Matched Patients */}
          {matchedPatients.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8E7E73]">
                Patients Found
              </p>
              <div className="space-y-1">
                {matchedPatients.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/billing/pos?patient_id=${p.id}`)}
                    className="w-full text-left p-2 rounded-xl bg-white border border-[#EDE6DD] hover:border-[#FAAE5A] hover:bg-[#FFF8EE] transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FFF8EE] border border-[#F6D3A8] text-[#965F36] font-bold flex items-center justify-center text-xs">
                        {p.first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#1E1B18]">{p.first_name} {p.last_name}</p>
                        <p className="text-[11px] text-[#8E7E73] font-mono">OP: {p.op_no} · {p.phone}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#965F36] font-bold group-hover:translate-x-0.5 transition flex items-center gap-1">
                      Open Bill <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation Commands */}
          <div>
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8E7E73]">
              Quick Shortcuts & Modules
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickNav.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(item.path)}
                    className="p-2.5 rounded-xl border border-[#EDE6DD] bg-white hover:border-[#FAAE5A] hover:bg-[#FFF8EE] text-left transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EDE6DD] text-[#965F36] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#965F36]" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[#1E1B18] truncate">{item.label}</p>
                      <p className="text-[11px] text-[#8E7E73] truncate">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-[#EDE6DD] bg-[#FAF8F5] flex items-center justify-between text-[11px] text-[#8E7E73] px-4">
          <span>Global Fast Command Palette [SCR-02]</span>
          <span>Press <strong>ESC</strong> to close</span>
        </div>
      </div>
    </div>
  );
}
