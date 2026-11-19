import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'waking'>('checking');
  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // Check backend health on mount
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const rawBase = import.meta.env.VITE_API_URL || 'https://healh-software.onrender.com/api';
        const rootUrl = rawBase.replace(/\/api\/?$/, '');
        const res = await fetch(`${rootUrl}/health`, { signal: AbortSignal.timeout(6000) });
        if (res.ok && mounted) {
          setBackendStatus('online');
        } else if (mounted) {
          setBackendStatus('waking');
        }
      } catch {
        if (mounted) setBackendStatus('waking');
      }
    };
    checkHealth();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      const { token, user } = res.data.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      if (err.message === 'Network Error' || !err.response) {
        setError('Backend is currently waking up or deploying on Render (cold start takes ~40s). Please wait a few seconds and click Sign In again.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 mb-3 shadow-md shadow-sky-200">
            <span className="text-white text-2xl font-black">H</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HEAL Clinic</h1>
          <p className="text-xs text-slate-500 mt-1">Aesthetic & Healthcare Management</p>

          {/* Backend Status indicator */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500 animate-ping'
              }`}
            />
            <span>
              {backendStatus === 'online' ? 'Backend Online' : 'Backend Connecting / Waking…'}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-4 leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="admin"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm shadow-md shadow-sky-100"
          >
            {loading ? 'Signing in… (please wait)' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Quick Fill Demo Logins
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'Admin@1234')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700 font-medium transition text-left"
            >
              👑 <span className="font-semibold">Super Admin</span>
              <div className="text-[10px] text-slate-400">admin</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('dr.ananya', 'Doctor@1234')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700 font-medium transition text-left"
            >
              🩺 <span className="font-semibold">Doctor (Dr. Ananya)</span>
              <div className="text-[10px] text-slate-400">dr.ananya</div>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          HEAL Clinic Management System • Karanthoor • Calicut • Wayanad
        </p>
      </div>
    </div>
  );
}
