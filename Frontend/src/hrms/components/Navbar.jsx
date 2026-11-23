import React, { useState } from 'react';
import { 
  Building2, 
  Clock, 
  Bell, 
  ChevronDown, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { DEMO_HR_ACCOUNTS } from '../services/mockBackend';

export default function Navbar({ 
  branches, 
  selectedBranch, 
  setSelectedBranch, 
  currentUser, 
  usersList, 
  setCurrentUser,
  onPunch,
  punchLoading,
  expiringCredsCount,
  setActiveTab,
  onLogout,
  onResetData
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);

  const selectedBranchObj = branches.find(b => b.id === selectedBranch);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Branch Selector */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button 
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-slate-800 text-sm font-semibold transition-all shadow-xs"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{selectedBranchObj ? selectedBranchObj.name : 'All Clinic Branches'}</span>
            {selectedBranchObj && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                selectedBranchObj.branch_type === 'Aesthetic' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedBranchObj.branch_type}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {showBranchMenu && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Active Branch
              </div>
              <button
                onClick={() => { setSelectedBranch(null); setShowBranchMenu(false); }}
                className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
                  selectedBranch === null ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-medium">All Branches (Group View)</div>
                  <div className="text-xs text-slate-400">Consolidated cross-clinic data</div>
                </div>
                {selectedBranch === null && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
              
              <div className="my-1 border-t border-slate-100" />

              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBranch(b.id); setShowBranchMenu(false); }}
                  className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
                    selectedBranch === b.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium flex items-center gap-1.5">
                      <span>{b.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        b.branch_type === 'Aesthetic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {b.branch_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{b.city} • {b.operating_hours}</div>
                  </div>
                  {selectedBranch === b.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions: Web Punch, Notifications, Persona Switcher */}
      <div className="flex items-center gap-4">
        {/* Quick Web Punch Clock-in/Clock-out */}
        <button
          onClick={onPunch}
          disabled={punchLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          title="Quick biometric/web punch for active logged-in employee"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{punchLoading ? 'Recording...' : 'Web Punch In / Out'}</span>
        </button>

        {/* Expiring Medical Credentials Alert Button */}
        {expiringCredsCount > 0 && (
          <button
            onClick={() => setActiveTab('credentials')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-all animate-pulse"
            title="Medical licenses expiring within 30 days"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{expiringCredsCount} Expiring License{expiringCredsCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Notification Bell */}
        <button 
          onClick={() => setActiveTab('leaves')}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          title="Leave Approvals & Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5"></span>
        </button>

        {/* Persona Switcher / Active Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-left transition-all"
          >
            {currentUser?.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.full_name} 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs" 
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs bg-blue-600"
              >
                {currentUser?.first_name ? currentUser.first_name[0] : (currentUser?.full_name ? currentUser.full_name[0] : 'U')}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.full_name || 'Loading...'}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight flex items-center gap-1">
                <span className="font-medium text-blue-600">{currentUser?.role}</span>
                <span>•</span>
                <span>{currentUser?.branch_code || 'HQ'}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Active User Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
                <img 
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30" 
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 leading-tight truncate">{currentUser?.full_name}</p>
                  <p className="text-xs text-blue-600 font-medium truncate">{currentUser?.job_title || currentUser?.role}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                </div>
              </div>

              {/* 4 Demo HR Accounts Section */}
              <div className="px-3.5 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch HR Persona:
              </div>

              <div className="px-2 space-y-0.5">
                {DEMO_HR_ACCOUNTS.map((account) => {
                  const isCurrent = currentUser?.id === account.id || currentUser?.email === account.email;
                  return (
                    <button
                      key={account.id}
                      onClick={() => {
                        setCurrentUser(account);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isCurrent 
                          ? 'bg-blue-50 text-blue-700 font-semibold' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img src={account.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold truncate leading-tight">{account.full_name}</div>
                          <div className="text-[10px] text-slate-500 leading-tight truncate">{account.account_badge}</div>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Clinical Staff Roster Section */}
              <div className="px-3.5 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-2">
                Or View As Clinical Staff:
              </div>

              <div className="max-h-40 overflow-y-auto px-2 space-y-0.5">
                {usersList.slice(0, 8).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 ${
                      currentUser?.id === user.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      <span className="truncate">{user.full_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      {user.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* Footer Actions: Reset Demo Data & Logout */}
              <div className="mt-2 pt-2 border-t border-slate-100 px-2 space-y-1">
                {onResetData && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onResetData();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset to Pristine Demo Data</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sign Out & Return to Login</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
