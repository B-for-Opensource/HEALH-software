import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi, resetDatabaseToDefaults, mockBranchService } from '@/api';
import { ShieldCheck, RotateCcw, MapPin, Sparkles, ArrowRight, Users, Briefcase, UserCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F8FC] via-[#FAF7F2] to-[#EEF2F9] relative flex items-center justify-center p-4 overflow-hidden font-brand-sans">
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-md p-8 sm:p-10 border border-blue-100">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Dedicated HRMS Frontend (Port 3001)</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 my-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                HEAL HRMS
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-blue-700 mt-0.5">
                Workforce & Staff Suite
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2 font-medium">
            Doctor Rosters · Biometric Attendance · Leave & Payroll Governance
          </p>

          {/* Active Branch Portal Selector Card */}
          <div className="mt-4 bg-[#F8FAFC] border border-blue-100 rounded-2xl p-3 text-left transition hover:border-blue-300">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
              <span className="flex items-center gap-1.5 text-blue-700">
                <MapPin size={13} className="text-blue-600" />
                Selected Branch:
              </span>
              <span className="bg-blue-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {activeBranch.branch_code || 'KRN'} · /{activeBranch.id === 'krn-branch-001' ? '1' : activeBranch.id === 'clt-branch-002' ? '2' : activeBranch.id === 'wyd-branch-003' ? '3' : '4'}
              </span>
            </div>
            <select
              value={activeBranch.id}
              onChange={(e) => handleBranchSelect(e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl p-2.5 mb-4 text-center font-semibold">
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
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="e.g. admin or emma.watson"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 text-xs uppercase tracking-widest shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? 'Authenticating…' : (
              <>
                <span>Sign In To HRMS</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
            <UserCheck size={13} className="text-blue-600" />
            <span>HRMS Demo Roles</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'Admin@1234')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 font-medium transition text-left cursor-pointer"
            >
              👑 <span className="font-bold text-slate-900">HR Director</span>
              <div className="text-[10px] text-slate-500">admin</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('dr.ananya', 'Doctor@1234')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 font-medium transition text-left cursor-pointer"
            >
              🩺 <span className="font-bold text-slate-900">Medical Supt.</span>
              <div className="text-[10px] text-slate-500">dr.ananya</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('reception', 'Reception@1234')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 font-medium transition text-left cursor-pointer"
            >
              📋 <span className="font-bold text-slate-900">Front Desk Lead</span>
              <div className="text-[10px] text-slate-500">reception</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('cashier', 'Cashier@1234')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 font-medium transition text-left cursor-pointer"
            >
              💳 <span className="font-bold text-slate-900">Finance & Payroll</span>
              <div className="text-[10px] text-slate-500">cashier</div>
            </button>
          </div>
        </div>

        {/* Reset Demo Data button */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-blue-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset HR Database
          </button>
        </div>
      </div>
    </div>
  );
}
