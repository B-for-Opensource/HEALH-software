import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi, resetDatabaseToDefaults, mockBranchService } from '@/api';
import { ShieldCheck, RotateCcw, MapPin, Sparkles, ArrowRight, Pill, FlaskConical, Package, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('pharmacist');
  const [password, setPassword] = useState('Pharmacy@1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [activeBranch, setActiveBranch] = useState(() => mockBranchService.getActiveBranch());
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const branches = [
    { id: 'krn-branch-001', name: 'Karanthoor Dispensary (Flagship)', code: 'KRN', num: '1' },
    { id: 'clt-branch-002', name: 'Beach Road Pharmacy (Calicut)', code: 'CLT', num: '2' },
    { id: 'wyd-branch-003', name: 'Sulthan Bathery Dispensary', code: 'WYD', num: '3' },
    { id: 'all',            name: 'Central Warehouse / All Branches', code: 'HQ', num: '4' },
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
      navigate('/pharmacy/dispensary');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'Authentication failed. Please check your pharmacy credentials or select a quick demo role below.'
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
    if (confirm('Reset pharmacy and clinic mock database back to initial seeds?')) {
      resetDatabaseToDefaults();
      setResetMessage('Pharmacy database reset to default inventory & batches!');
      setTimeout(() => setResetMessage(''), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4FAF6] via-[#FAF7F2] to-[#EBF5EF] relative flex items-center justify-center p-4 overflow-hidden font-brand-sans">
      {/* Background Decorative Pharmacy Motif */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] flex items-center justify-center">
        <div className="grid grid-cols-6 gap-12 rotate-[-6deg] scale-125">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-16 h-28 border-2 border-emerald-800 rounded-full flex flex-col items-center justify-between p-2">
              <div className="w-3 h-8 border border-emerald-800 rounded-full" />
              <div className="w-3 h-8 border border-emerald-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-emerald-900/10 w-full max-w-md p-8 sm:p-10 border border-emerald-100/80">
        {/* Pharmacy Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3 shadow-2xs">
            <Pill className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dedicated Pharmacy Frontend (Port 3002)</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 my-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                HEAL PHARMACY
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 mt-0.5">
                Dispensary & Inventory OS
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2 font-medium">
            Prescription Fulfillment · Batch Inventory (FEFO) · Drug Master Control
          </p>

          {/* Active Dispensary Branch Selector Card */}
          <div className="mt-4 bg-[#F7FBF8] border border-emerald-100 rounded-2xl p-3 text-left transition hover:border-emerald-300">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <MapPin size={13} className="text-emerald-600" />
                Active Dispensary Branch:
              </span>
              <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {activeBranch.branch_code || 'KRN'} · /{activeBranch.id === 'krn-branch-001' ? '1' : activeBranch.id === 'clt-branch-002' ? '2' : activeBranch.id === 'wyd-branch-003' ? '3' : '4'}
              </span>
            </div>
            <select
              value={activeBranch.id}
              onChange={(e) => handleBranchSelect(e.target.value)}
              className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
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
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-2.5 mb-4 text-center font-semibold">
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
              Pharmacist Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="e.g. pharmacist"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Pharmacy Green Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 text-xs uppercase tracking-widest shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? 'Authenticating…' : (
              <>
                <span>Sign In To Pharmacy OS</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Dedicated Pharmacy One-Click Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
            <Pill size={13} className="text-emerald-600" />
            <span>Pharmacy Demo Personas</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoCredentials('pharmacist', 'Pharmacy@1234')}
              className={`p-2.5 rounded-xl border transition text-left cursor-pointer ${
                username === 'pharmacist'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-400'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <span>💊</span>
                <span>Chief Pharmacist</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-mono mt-0.5">pharmacist</div>
              <div className="text-[9px] text-slate-400">Full Rx fulfillment & FEFO</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('pharmacy.dispensary', 'Pharmacy@1234')}
              className={`p-2.5 rounded-xl border transition text-left cursor-pointer ${
                username === 'pharmacy.dispensary'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-400'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <span>📦</span>
                <span>Dispensary Counter</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-mono mt-0.5">pharmacy.dispensary</div>
              <div className="text-[9px] text-slate-400">Counter token dispensing</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('pharmacy.inventory', 'Pharmacy@1234')}
              className={`p-2.5 rounded-xl border transition text-left cursor-pointer ${
                username === 'pharmacy.inventory'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-400'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <span>📊</span>
                <span>Inventory & PO</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-mono mt-0.5">pharmacy.inventory</div>
              <div className="text-[9px] text-slate-400">Stock transfers & expiry</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('pharmacy.admin', 'Pharmacy@1234')}
              className={`p-2.5 rounded-xl border transition text-left cursor-pointer ${
                username === 'pharmacy.admin'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-400'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <span>👑</span>
                <span>Pharmacy Admin</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-mono mt-0.5">pharmacy.admin</div>
              <div className="text-[9px] text-slate-400">Master pricing & catalogue</div>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
          🌿 Dedicated to Pharmacy Dispensary, FEFO Batch Dispensing, and Drug Catalogs on <code className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-800 font-bold">Port 3002</code>
        </p>

        {/* Reset Demo Data button */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Pharmacy Database
          </button>
        </div>
      </div>
    </div>
  );
}
