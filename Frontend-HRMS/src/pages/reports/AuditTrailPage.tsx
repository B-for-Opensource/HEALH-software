import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Printer, 
  Lock, 
  Terminal, 
  User, 
  Clock 
} from 'lucide-react';
import { auditApi } from '@/api';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    auditApi.list().then((res) => {
      setLogs(Array.isArray(res) ? res : []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((l) =>
    (l.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.entity || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Immutable Forensic System Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-48] Forensic compliance logging: bill edits, discount overrides, clinical finalizations, user creation & IP tracking
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-xs"
        >
          <Printer className="w-4 h-4" />
          Export Forensic Log
        </button>
      </div>

      {/* Security Callout */}
      <div className="bg-slate-900 text-white rounded-xl p-4 text-xs flex items-start gap-3">
        <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm text-emerald-400">Append-Only Immutable Ledger</span>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            Every clinical consult, discount approval, bill cancellation, and inventory dispatch is cryptographically signed with terminal IP address and user identification. Records cannot be edited or purged by any user.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail by user, action or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">{filteredLogs.length} Records Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User & Operator</th>
                <th className="py-3 px-4">Action Code</th>
                <th className="py-3 px-4">Entity Ref</th>
                <th className="py-3 px-4">Terminal IP</th>
                <th className="py-3 px-4">Audit Details & Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((l, i) => (
                <tr key={l.id || i} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {l.timestamp}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                    {l.user_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-violet-700 font-semibold">
                    {l.entity}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {l.ip_address}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-sans text-xs">
                    {l.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
