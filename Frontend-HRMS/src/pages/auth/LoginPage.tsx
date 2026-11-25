import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi, resetDatabaseToDefaults, mockBranchService } from '@/api';
import HealLogo from '@/components/shared/HealLogo';
import AppSwitcher from '@/components/shared/AppSwitcher';
import { ShieldCheck, RotateCcw, MapPin, Sparkles, ArrowRight, Users } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [activeBranch, setActiveBranch] = useState(() => mockBranchService.getActiveBranch());
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const branches = [
    { id: 'krn-branch-001', name: 'Karanthoor (Flagship)', code: 'KRN', num: '1' },
    { id: 'clt-branch-002', name: 'Beach Road (Calicut City)', code: 'CLT', num: '2' },
    { id: 'wyd-branch-003', name: 'Sulthan Bathery (Wayanad)', code: 'WYD', num: '3' },
    { id: 'all',            name: 'Consolidated HQ (All 3 Branches)', code: 'HQ', num: '4' },
  ];

  const handleBranchSelect = (bId: string) => {
    mockBranchService.setActiveBranch(bId);
    setActiveBranch(mockBranchService.getActiveBranch());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ username, password });
      login(res.token, res.user);
      navigate('/hrms/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Login failed. Please check your username and password, or use one of the quick demo accounts below.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleResetData = () => {
    if (confirm('Reset clinic mock database back to initial demo seeds?')) {
      resetDatabaseToDefaults();
      setResetMessage('Database reset to initial demo seeds!');
      setTimeout(() => setResetMessage(''), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative flex items-center justify-center p-4 overflow-hidden font-brand-sans">
      {/* Background Decorative Motif Grid (fine golden-brown outlines from the brand image) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] flex items-center justify-center">
        <div className="grid grid-cols-6 gap-12 rotate-[-6deg] scale-125">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-16 h-28 border-2 border-[#965F36] rounded-full flex flex-col items-center justify-between p-2">
              <div className="w-3 h-8 border border-[#965F36] rounded-full" />
              <div className="w-3 h-8 border border-[#965F36] rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 bg-white rounded-3xl shadow-xl shadow-[#965F36]/10 w-full max-w-md p-8 sm:p-10 border border-[#EDE6DD]">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <HealLogo size="lg" variant="dark" showSubtitle={true} />
          </div>

          <h2 className="font-brand-sans font-bold text-3xl text-[#1E1B18] tracking-tight mt-3">
            Reveal Your Glow
          </h2>
          <p className="text-xs text-[#685B52] mt-1 font-medium">
            Clinical Aesthetics · Daycare Lounges · Multi-Branch Management
          </p>

          {/* Active Branch Portal Selector Card */}
          <div className="mt-4 bg-[#FBF8F4] border border-[#EDE6DD] rounded-2xl p-3 text-left transition hover:border-[#D5C2B1]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#685B52] mb-1.5">
              <span className="flex items-center gap-1.5 text-[#965F36]">
                <MapPin size={13} className="text-[#965F36]" />
                Selected Branch Portal:
              </span>
              <span className="bg-[#965F36] text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {activeBranch.branch_code || 'KRN'} · /{activeBranch.id === 'krn-branch-001' ? '1' : activeBranch.id === 'clt-branch-002' ? '2' : activeBranch.id === 'wyd-branch-003' ? '3' : '4'}
              </span>
            </div>
            <select
              value={activeBranch.id}
              onChange={(e) => handleBranchSelect(e.target.value)}
              className="w-full bg-white border border-[#EDE6DD] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#965F36] cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (/{b.num})
                </option>
              ))}
            </select>
          </div>
        </div>

        {resetMessage && (
          <div className="bg-[#FFF8EE] border border-[#F6D3A8] text-[#965F36] text-xs rounded-xl p-2.5 mb-4 text-center font-semibold">
            {resetMessage}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4 leading-relaxed font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#3B312A] mb-1 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="e.g. admin or dr.ananya"
              className="w-full bg-[#FAF8F5] border border-[#EDE6DD] rounded-xl px-4 py-2.5 text-sm text-[#1E1B18] placeholder-[#A39487] focus:outline-none focus:ring-2 focus:ring-[#965F36] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3B312A] mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#FAF8F5] border border-[#EDE6DD] rounded-xl px-4 py-2.5 text-sm text-[#1E1B18] placeholder-[#A39487] focus:outline-none focus:ring-2 focus:ring-[#965F36] focus:bg-white transition"
            />
          </div>

          {/* Authentic Warm Amber Pill Button (Matching "MORE INFO" in the uploaded brand image) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FAAE5A] hover:bg-[#E89D49] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 text-xs uppercase tracking-widest shadow-md shadow-[#FAAE5A]/40 hover:shadow-lg hover:shadow-[#FAAE5A]/50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Authenticating…' : (
              <>
                <span>Sign In To Portal</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-[#EDE6DD]">
          <p className="text-[11px] font-bold text-[#8E7E73] uppercase tracking-wider mb-2.5 text-center">
            One-Click Demo Roles
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'Admin@1234')}
              className="p-2.5 rounded-xl border border-[#EDE6DD] hover:border-[#FAAE5A] hover:bg-[#FFF8EE] text-[#3B312A] font-medium transition text-left cursor-pointer"
            >
              👑 <span className="font-bold text-[#1E1B18]">Super Admin</span>
              <div className="text-[10px] text-[#8E7E73]">admin</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('dr.ananya', 'Doctor@1234')}
              className="p-2.5 rounded-xl border border-[#EDE6DD] hover:border-[#FAAE5A] hover:bg-[#FFF8EE] text-[#3B312A] font-medium transition text-left cursor-pointer"
            >
              🩺 <span className="font-bold text-[#1E1B18]">Dr. Ananya</span>
              <div className="text-[10px] text-[#8E7E73]">dr.ananya</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('reception', 'Reception@1234')}
              className="p-2.5 rounded-xl border border-[#EDE6DD] hover:border-[#FAAE5A] hover:bg-[#FFF8EE] text-[#3B312A] font-medium transition text-left cursor-pointer"
            >
              📋 <span className="font-bold text-[#1E1B18]">Reception</span>
              <div className="text-[10px] text-[#8E7E73]">reception</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('cashier', 'Cashier@1234')}
              className="p-2.5 rounded-xl border border-[#EDE6DD] hover:border-[#FAAE5A] hover:bg-[#FFF8EE] text-[#3B312A] font-medium transition text-left cursor-pointer"
            >
              💳 <span className="font-bold text-[#1E1B18]">Cashier POS</span>
              <div className="text-[10px] text-[#8E7E73]">cashier</div>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#8E7E73] mt-4 leading-relaxed">
          ✨ Supports live multi-tab sync across branches <code className="bg-[#F4ECE3] px-1.5 py-0.5 rounded text-[#965F36] font-bold">/1</code>, <code className="bg-[#F4ECE3] px-1.5 py-0.5 rounded text-[#965F36] font-bold">/2</code>, <code className="bg-[#F4ECE3] px-1.5 py-0.5 rounded text-[#965F36] font-bold">/3</code>, <code className="bg-[#F4ECE3] px-1.5 py-0.5 rounded text-[#965F36] font-bold">/4</code>
        </p>

        {/* Reset Demo Data button */}
        <div className="mt-4 pt-3 border-t border-[#EDE6DD] text-center">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#8E7E73] hover:text-[#965F36] transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Demo Database
          </button>
        </div>
      </div>
    </div>
  );
}
