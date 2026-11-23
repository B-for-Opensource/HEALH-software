import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  ArrowRight, 
  Lock, 
  Mail, 
  CheckCircle2, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { DEMO_HR_ACCOUNTS, resetLocalState } from '../services/mockBackend';

export default function LoginPage({ onLogin, onResetData }) {
  const [selectedUser, setSelectedUser] = useState(DEMO_HR_ACCOUNTS[0]);
  const [emailInput, setEmailInput] = useState(DEMO_HR_ACCOUNTS[0].email);
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState(null);

  const handleSelectAccount = (account) => {
    setSelectedUser(account);
    setEmailInput(account.email);
    setPasswordInput('••••••••••••');
  };

  const handleQuickLogin = (account) => {
    setIsLoggingIn(true);
    setLoginFeedback(`Logging in as ${account.full_name}...`);
    setTimeout(() => {
      onLogin(account);
    }, 250);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleQuickLogin(selectedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">HEAL CLINIC NETWORK</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                HRMS v2.4 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">3-Branch Integrated Clinical People Operations & Compliance</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="hidden md:flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              MediAesthetic Laser
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Downtown Urgent Care
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Westside Pediatrics
            </span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data (employees, attendance, leaves, payroll) to pristine seed state?')) {
                resetLocalState();
                if (onResetData) onResetData();
                alert('Database reset to fresh demo data.');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Reset database to fresh default values"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Standalone Client-Side MVP • No Backend Required
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Select Your HR Account to Enter
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
            Click any HR persona below for instant 1-click login without passwords. 
            All modifications, updates, and additions persist directly in your browser's LocalStorage.
          </p>
        </div>

        {/* 4 Interactive Persona Quick-Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {DEMO_HR_ACCOUNTS.map((account) => {
            const isSelected = selectedUser.id === account.id;
            return (
              <div
                key={account.id}
                onClick={() => handleSelectAccount(account)}
                className={`relative flex flex-col justify-between rounded-xl p-5 border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/40 translate-y-[-2px]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {account.is_manager && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider shadow">
                    Super Admin
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="relative">
                      <img
                        src={account.avatar_url}
                        alt={account.full_name}
                        className="w-13 h-13 rounded-full object-cover ring-2 ring-slate-700 shadow"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {account.full_name}
                      </h3>
                      <p className="text-xs text-blue-400 font-medium mt-0.5">{account.role}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${account.badge_color}`}>
                      {account.account_badge}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium">{account.branch_name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                    {account.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLogin(account);
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>1-Click Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Traditional Credentials Bar with Pre-filled Quick Sign-in */}
        <div className="max-w-xl mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Instant Sign In Box</span>
            </div>
            <span className="text-xs text-slate-400">Selected: <strong className="text-white">{selectedUser.full_name}</strong></span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Access Passkey</span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwordless Demo Enabled
                </span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span>Entering Application...</span>
              ) : (
                <>
                  <span>Sign In as {selectedUser.role} ({selectedUser.full_name})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {loginFeedback && (
            <p className="mt-3 text-center text-xs text-blue-400 font-medium animate-pulse">
              {loginFeedback}
            </p>
          )}
        </div>
      </main>

      {/* Footer Features Info */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-4 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>MVP Prototype Specs: Full CRUD across all 10 modules, offline LocalStorage, realistic healthcare rosters & salary models.</span>
        </div>
        <div className="text-slate-500 text-center md:text-right">
          Zoho People Enterprise Design System • MediAesthetic Laser • Urgent Care • Pediatrics
        </div>
      </footer>
    </div>
  );
}

