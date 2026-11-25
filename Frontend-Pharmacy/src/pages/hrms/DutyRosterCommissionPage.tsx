import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  Award,
  ShieldCheck
} from 'lucide-react';
import { hrmsApi } from '@/api';
import { formatCurrency } from '@/lib/utils';

export default function DutyRosterCommissionPage() {
  const [activeTab, setActiveTab] = useState<'roster' | 'commissions'>('commissions');
  const [roster, setRoster] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        hrmsApi.listRoster(),
        hrmsApi.listCommissions(),
      ]);
      setRoster(Array.isArray(rRes) ? rRes : []);
      setCommissions(Array.isArray(cRes) ? cRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    await hrmsApi.approveCommission(id);
    alert('Commission payout statement approved for salary disbursement!');
    loadData();
  };

  const totalIncentives = commissions.reduce((acc, c) => acc + (c.total_incentive || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            HRMS, Duty Rosters & Practitioner Commission Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-40, 41, 42] Cross-branch visiting doctor schedules, consultation cuts & aesthetic procedure incentives
          </p>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg p-1">
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'commissions' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Commission Engine
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'roster' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Branch Duty Roster
          </button>
        </div>
      </div>

      {activeTab === 'commissions' && (
        <div className="space-y-6">
          {/* Summary KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-500">Total Calculated Incentives</span>
              <p className="text-2xl font-black text-violet-700 mt-1">{formatCurrency(totalIncentives)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">February 2026 Payroll Cycle</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-500">Consultation Cut Rules</span>
              <p className="text-lg font-bold text-slate-900 mt-1">₹200 / Completed OP Visit</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Auto-deducted from clinic share</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-500">Aesthetic Procedure Split</span>
              <p className="text-lg font-bold text-slate-900 mt-1">20% Laser/Peels · ₹100 Therapist</p>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Factor in authorized doctor discounts</p>
            </div>
          </div>

          {/* Commissions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-600" />
                [SCR-42] Practitioner Commission Statement
              </h3>
              <span className="text-xs text-slate-400">Payroll Cycle: Feb 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Practitioner / Staff</th>
                    <th className="py-3 px-4">Specialisation</th>
                    <th className="py-3 px-4 text-center">OP Consults</th>
                    <th className="py-3 px-4 text-right">Consultation Fee Cut</th>
                    <th className="py-3 px-4 text-right">Procedure Revenue</th>
                    <th className="py-3 px-4 text-right">Procedure Incentive</th>
                    <th className="py-3 px-4 text-right">Total Net Payout</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.doctor_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.specialisation}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {c.op_consult_count} visits
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatCurrency(c.op_consult_fee)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(c.procedure_billing)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {formatCurrency(c.procedure_commission)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-violet-700 text-sm">
                        {formatCurrency(c.total_incentive)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.status.includes('Approved') ? (
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded-md text-[11px]"
                          >
                            Disburse
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                [SCR-40] 3-Branch Duty Roster & Visiting Specialist Calendar
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rostering across Karanthoor, Beach Road Calicut & Sulthan Bathery Wayanad
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {roster.map((r, i) => (
              <div key={i} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{r.staff_name}</h4>
                    <p className="text-xs text-slate-400">{r.role} · {r.specialisation}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Active Rostering
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  {r.schedule.map((s: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                        <span>{s.day}</span>
                        <span className="text-violet-700">{s.branch}</span>
                      </div>
                      <p className="font-medium text-slate-800 mt-1">{s.shift}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
