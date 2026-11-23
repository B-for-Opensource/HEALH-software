import React, { useState } from 'react';
import {
  getBranchShareableUrls,
  mockBranchService,
  exportDatabaseJson,
  importDatabaseJson,
  resetDatabaseToDefaults
} from '@/api';
import {
  X, Copy, Check, ExternalLink, Globe, Layers, Download,
  Upload, RotateCcw, Share2, Radio, Server, CheckCircle2, Shield
} from 'lucide-react';

interface BranchNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBranchId: string;
  onBranchSelect: (branchId: string) => void;
}

export default function BranchNetworkModal({
  isOpen,
  onClose,
  activeBranchId,
  onBranchSelect,
}: BranchNetworkModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [hubUrl, setHubUrl] = useState(() => localStorage.getItem('HEAL_STORAGE_HUB_URL') || '');
  const [hubSaved, setHubSaved] = useState(false);

  if (!isOpen) return null;

  const branchUrls = getBranchShareableUrls();

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExport = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heal-clinic-database-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJson(content);
        if (success) {
          setImportStatus('Database successfully restored! Reloading...');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          setImportStatus('Invalid database file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSaveHub = () => {
    if (hubUrl.trim()) {
      localStorage.setItem('HEAL_STORAGE_HUB_URL', hubUrl.trim());
    } else {
      localStorage.removeItem('HEAL_STORAGE_HUB_URL');
    }
    setHubSaved(true);
    setTimeout(() => setHubSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1E1815] text-[#FAF8F5] p-5 flex items-center justify-between border-b border-[#2C231E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#965F36]/30 border border-[#965F36]/40 flex items-center justify-center text-[#FAAE5A]">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF8F5] flex items-center gap-2 font-brand-sans">
                Multi-Branch Deployment & Investor Links
              </h2>
              <p className="text-xs text-[#A39487]">
                Unified client-side storage across Karanthoor, Beach Road, Wayanad & HQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A39487] hover:text-white p-1.5 rounded-lg hover:bg-[#2C231E] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-[#5C5047] font-brand-sans bg-[#FAF7F2]">
          {/* Sync Status Banner */}
          <div className="bg-[#FFF8EE] border border-[#F6D3A8] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FAAE5A] mt-1 shrink-0 animate-ping" />
            <div className="space-y-1">
              <p className="font-bold text-[#965F36] text-xs">
                Real-Time Multi-Tab Synchronisation Active
              </p>
              <p className="text-[11px] text-[#7A4A27] leading-relaxed">
                When you open these branch links in different tabs of the <strong>same browser</strong>, data is synchronized live using native <code>BroadcastChannel</code> and <code>localStorage</code>. Any patient registered, stock transfer dispatched, or bill raised in one branch reflects across the other branch tabs instantly.
              </p>
            </div>
          </div>

          {/* Shareable Links Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-bold text-[#1E1B18] text-xs uppercase tracking-wide">
                Clean Investor Links (/1, /2, /3, /4)
              </span>
              <span className="text-[11px] text-[#8E7E73]">Click to switch or copy link</span>
            </div>

            <div className="space-y-2.5">
              {branchUrls.map((b) => {
                const isActive = activeBranchId === b.id;
                return (
                  <div
                    key={b.id}
                    className={`border rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'border-[#965F36] bg-[#FFF8EE] shadow-sm ring-1 ring-[#965F36]/30'
                        : 'border-[#EDE6DD] bg-white hover:border-[#D5C2B1]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1E1B18] text-xs">{b.name}</span>
                        <span className="bg-[#F4ECE3] text-[#965F36] font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {b.code}
                        </span>
                        <span className="bg-[#FAAE5A] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          /{b.num}
                        </span>
                        {isActive && (
                          <span className="bg-[#965F36] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Current Active Tab
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8E7E73]">{b.city}</p>
                      <p className="text-xs font-mono font-bold text-[#965F36] bg-[#FAF8F5] border border-[#EDE6DD] px-2.5 py-0.5 rounded-lg inline-block">
                        {b.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleCopy(b.url, b.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                          copiedId === b.id
                            ? 'bg-[#16A34A] text-white border-[#16A34A]'
                            : 'bg-[#FAAE5A] hover:bg-[#E89D49] text-white border-[#FAAE5A] shadow-xs'
                        }`}
                        title="Copy clean link to clipboard"
                      >
                        {copiedId === b.id ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedId === b.id ? 'Copied!' : 'Copy Link'}</span>
                      </button>

                      <a
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#5C5047] hover:text-[#1E1B18] bg-white hover:bg-[#F5EDE3] border border-[#EDE6DD] transition"
                        title="Open this branch in a new tab"
                      >
                        <ExternalLink size={13} />
                        <span>Open Tab</span>
                      </a>

                      {!isActive && (
                        <button
                          onClick={() => {
                            onBranchSelect(b.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-bold text-[#965F36] bg-[#F4ECE3] hover:bg-[#EAE0D5] transition cursor-pointer"
                        >
                          Switch Here
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cross-Origin Hub Configuration (For 3 Separate Netlify Domains) */}
          <div className="border border-[#EDE6DD] rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-[#965F36]" />
              <h4 className="font-bold text-[#1E1B18] text-xs">
                Hosting as 3 Separate Netlify Domains? (Optional Cross-Origin Hub)
              </h4>
            </div>
            <p className="text-[11px] text-[#8E7E73] leading-relaxed">
              If you host on a single Netlify URL (e.g. <code>heal-mvp.netlify.app</code>), the 3 branch links above share data natively with <strong>zero configuration</strong>. If you deploy 3 separate Netlify sites (e.g. <code>karanthoor.netlify.app</code> and <code>beachroad.netlify.app</code>), set the Primary Hub URL below to enable cross-domain sync via the included <code>storage-hub.html</code> bridge:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://heal-karanthoor.netlify.app"
                value={hubUrl}
                onChange={(e) => setHubUrl(e.target.value)}
                className="flex-1 bg-[#FAF8F5] border border-[#EDE6DD] rounded-xl px-3 py-1.5 text-xs text-[#1E1B18] placeholder-[#A39487] focus:outline-none focus:ring-2 focus:ring-[#965F36]"
              />
              <button
                onClick={handleSaveHub}
                className="bg-[#965F36] hover:bg-[#7A4A27] text-white font-bold px-4 py-1.5 rounded-full text-xs transition shrink-0 cursor-pointer"
              >
                {hubSaved ? 'Saved!' : 'Save Hub URL'}
              </button>
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="border border-[#EDE6DD] rounded-2xl p-4 bg-white space-y-3">
            <h4 className="font-bold text-[#1E1B18] text-xs flex items-center gap-2">
              <Shield size={14} className="text-[#965F36]" />
              Database Backup & Demo Data Management
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1E1815] hover:bg-[#2C231E] text-white transition cursor-pointer"
              >
                <Download size={13} />
                Export DB Snapshot (.json)
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-[#F5EDE3] text-[#3B312A] cursor-pointer border border-[#EDE6DD] transition">
                <Upload size={13} />
                <span>Import DB Snapshot</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('Reset all demo data back to default initial state?')) {
                    resetDatabaseToDefaults();
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#965F36] hover:text-[#7A4A27] bg-[#FFF8EE] hover:bg-[#FEEFD8] border border-[#F6D3A8] transition cursor-pointer"
              >
                <RotateCcw size={13} />
                Reset Initial Seeds
              </button>
            </div>
            {importStatus && (
              <p className="text-xs font-semibold text-[#965F36] animate-pulse">
                {importStatus}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FBF8F4] p-3.5 border-t border-[#EDE6DD] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#8E7E73]">
            <CheckCircle2 size={13} className="text-[#16A34A]" />
            <span>Netlify SPA Routing configured with <code>_redirects</code> and <code>netlify.toml</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#965F36] hover:bg-[#7A4A27] text-white font-bold rounded-full text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
