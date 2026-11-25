import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  RefreshCw, 
  Filter,
  User,
  Search,
  Clock,
  Sparkles,
  Phone,
  AlertCircle
} from 'lucide-react';
import { appointmentsApi } from '@/api';
import { formatDate } from '@/lib/utils';

export default function FollowUpQueuePage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState<'next_3_days' | 'today' | 'tomorrow' | 'custom' | 'all'>('next_3_days');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      let params: any = {};
      if (filterRange === 'next_3_days') {
        params = { range: 'next_3_days' };
      } else if (filterRange === 'today') {
        params = { date: new Date().toISOString().split('T')[0] };
      } else if (filterRange === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        params = { date: tomorrow.toISOString().split('T')[0] };
      } else if (filterRange === 'custom') {
        params = { date: selectedDate };
      } else {
        params = {};
      }

      const res = await appointmentsApi.followups(params);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFollowups(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterRange, selectedDate]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const handleMarkCalled = async (id: string) => {
    setMarkingId(id);
    try {
      await appointmentsApi.updateStatus(id, 'Called');
      setFollowups((prev) =>
        prev.map((item) => (item.id === id ? { ...item, called: true } : item))
      );
    } catch (err) {
      alert('Failed to mark as called');
    } finally {
      setMarkingId(null);
    }
  };

  const generateWhatsAppUrl = (item: any) => {
    const rawPhone = (item.phone || '').replace(/\D/g, '');
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const patientName = item.patient_name || item.first_name || 'Patient';
    const doctorName = item.doctor_name || 'your consulting doctor';
    const dateStr = formatDate(item.review_date || item.appointment_date);
    const msg = `Dear ${patientName}, Greetings from HEAL Aesthetic & Medical Clinic. This is a gentle reminder regarding your medical follow-up consultation with Dr. ${doctorName} scheduled for ${dateStr}. Please let us know if you would like to confirm or reschedule your visit. Call us at 0495-2720000. Thank you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const getRelativeReviewBadge = (reviewDateStr: string) => {
    if (!reviewDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(reviewDateStr.split('T')[0]);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px] animate-pulse">
          Due Today
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
          Due Tomorrow
        </span>
      );
    }
    if (diffDays === 2) {
      return (
        <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[11px]">
          Due in 2 Days
        </span>
      );
    }
    if (diffDays === 3) {
      return (
        <span className="bg-violet-100 text-violet-800 font-bold px-2 py-0.5 rounded text-[11px]">
          Due in 3 Days
        </span>
      );
    }
    if (diffDays < 0) {
      return (
        <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">
          Overdue ({Math.abs(diffDays)}d)
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]">
        In {diffDays} days
      </span>
    );
  };

  const filteredFollowups = followups.filter((f) => {
    const q = search.toLowerCase();
    return (
      (f.patient_name || f.first_name || '').toLowerCase().includes(q) ||
      (f.op_no || '').toLowerCase().includes(q) ||
      (f.phone || '').toLowerCase().includes(q) ||
      (f.doctor_name || '').toLowerCase().includes(q) ||
      (f.review_instructions || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-600" />
            <span>Follow-Up & Doctor Review Queue</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Receptionist caller portal: View upcoming patient review dates for next 3 days, call patients & dispatch WhatsApp reminders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFollowups}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-sm font-medium shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Reviews in Selected Scope
          </span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{filteredFollowups.length}</p>
          <span className="text-xs text-slate-400">Scheduled patient check-ins</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Pending Contact Calls
          </span>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">
            {filteredFollowups.filter((f) => !f.called).length}
          </p>
          <span className="text-xs text-slate-400">Call / WhatsApp reminder pending</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Completed Contacted
          </span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {filteredFollowups.filter((f) => f.called).length}
          </p>
          <span className="text-xs text-slate-400">Confirmed or called by reception</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterRange('next_3_days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              filterRange === 'next_3_days'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next 3 Days (Upcoming Reviews)</span>
          </button>
          <button
            onClick={() => setFilterRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterRange === 'today'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Due Today
          </button>
          <button
            onClick={() => setFilterRange('tomorrow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterRange === 'tomorrow'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Due Tomorrow
          </button>
          <button
            onClick={() => setFilterRange('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
              filterRange === 'custom'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Pick Date</span>
          </button>
          {filterRange === 'custom' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          )}
          <button
            onClick={() => setFilterRange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterRange === 'all'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Pending
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, OP, phone, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Follow-up list table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Patient Profile</th>
                <th className="py-3.5 px-4">OP Number</th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Review Date & Due Status</th>
                <th className="py-3.5 px-4">Doctor Advice / Check-in Notes</th>
                <th className="py-3.5 px-4 text-right">Direct Contact Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFollowups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Checking follow-up schedules...' : 'No patient follow-ups scheduled for this filter.'}
                  </td>
                </tr>
              ) : (
                filteredFollowups.map((item) => (
                  <tr key={item.id} className={item.called ? 'bg-slate-50/60 opacity-70' : 'hover:bg-slate-50/70'}>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.patient_name || item.first_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-violet-700 font-semibold">
                      {item.op_no || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <span className="font-medium flex items-center gap-1">
                        <span>🩺</span>
                        <span>{item.doctor_name?.startsWith('Dr.') ? item.doctor_name : `Dr. ${item.doctor_name || 'Staff'}`}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">
                        {formatDate(item.review_date || item.appointment_date)}
                      </div>
                      <div className="mt-1">
                        {getRelativeReviewBadge(item.review_date || item.appointment_date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                      <p className="line-clamp-2">
                        {item.review_instructions || item.purpose || 'Routine clinical follow-up review'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Direct Phone Call Button */}
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition"
                            title={`Call patient on ${item.phone}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}

                        {/* WhatsApp Message Button */}
                        {item.phone && (
                          <a
                            href={generateWhatsAppUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition"
                            title="Send WhatsApp Follow-up Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {/* Mark Contacted Button */}
                        {!item.called ? (
                          <button
                            onClick={() => handleMarkCalled(item.id)}
                            disabled={markingId === item.id}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            Mark Called
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Called
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
