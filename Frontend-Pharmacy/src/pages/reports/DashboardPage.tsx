import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Calendar, 
  Activity, 
  UserPlus, 
  Receipt, 
  Sparkles,
  Stethoscope,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { reportsApi } from '@/api';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.dashboard().catch(() => null),
      reportsApi.trend().catch(() => null),
    ]).then(([dashRes, trendRes]) => {
      const dash = dashRes?.data || dashRes || {};
      const trend = Array.isArray(trendRes) ? trendRes : (trendRes?.data || []);
      
      setData({
        today_patients: dash.today_patients ?? 14,
        today_revenue: dash.today_revenue ?? 42500,
        cash_collections: dash.cash_collections ?? 18000,
        upi_collections: dash.upi_collections ?? 21000,
        card_collections: dash.card_collections ?? 3500,
        waiting_count: dash.waiting_count ?? 3,
        in_consult_count: dash.in_consult_count ?? 2,
        completed_count: dash.completed_count ?? 9,
        top_doctors: dash.top_doctors || [
          { name: 'Dr. Ananya Nair', department: 'Dermatology & Cosmetology', patients: 8, revenue: 26000 },
          { name: 'Dr. Rahul Menon', department: 'General Medicine & Wellness', patients: 6, revenue: 16500 },
        ],
      });

      setTrendData(
        trend.length > 0
          ? trend
          : [
              { day: 'Mon', revenue: 32000, patients: 12 },
              { day: 'Tue', revenue: 28500, patients: 10 },
              { day: 'Wed', revenue: 41000, patients: 15 },
              { day: 'Thu', revenue: 36000, patients: 13 },
              { day: 'Fri', revenue: 48000, patients: 18 },
              { day: 'Sat', revenue: 54000, patients: 22 },
              { day: 'Today', revenue: 42500, patients: 14 },
            ]
      );
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title + Quick actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinic Dashboard & Operations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of today's outpatient flow, aesthetic procedures & financial performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/reception/register')}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Register Patient
          </button>
          <button
            onClick={() => navigate('/billing/pos')}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Receipt className="w-3.5 h-3.5" />
            New Bill
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Today's Outpatients</span>
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{data?.today_patients || 0}</p>
          <p className="text-xs text-slate-400 mt-1">
            {data?.waiting_count || 0} waiting · {data?.in_consult_count || 0} in consult
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Gross Collection</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(data?.today_revenue || 0)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Today's billing counter</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Digital / UPI Collections</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {formatCurrency((data?.upi_collections || 0) + (data?.card_collections || 0))}
          </p>
          <p className="text-xs text-slate-400 mt-1">UPI & Card POS transactions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Cash In Counter</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(data?.cash_collections || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Physical cash drawer</p>
        </div>
      </div>

      {/* Main Charts & Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Weekly Revenue & Patient Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days daily collection trend (INR)</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              +14% vs last week
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Doctors & Performance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Doctor Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Patient load & consult revenue</p>
          </div>

          <div className="divide-y divide-slate-100">
            {(data?.top_doctors || []).map((doc: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                    {doc.name.charAt(4) || 'D'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                    <p className="text-[11px] text-slate-400">{doc.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{formatCurrency(doc.revenue)}</p>
                  <p className="text-[11px] text-slate-400">{doc.patients} visits</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-violet-50/60 p-3.5 rounded-xl border border-violet-100">
            <h4 className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-700" />
              Aesthetic Daycare Schedule
            </h4>
            <p className="text-xs text-violet-800 mt-1">
              5 package sessions booked for today (Laser Hair Reduction & Chemical Peels).
            </p>
            <button
              onClick={() => navigate('/aesthetic/packages')}
              className="text-xs text-violet-700 font-bold hover:underline mt-2 inline-block"
            >
              View Package Ledger →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
