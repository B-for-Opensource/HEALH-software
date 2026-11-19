import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  RefreshCw, 
  Filter,
  User
} from 'lucide-react';
import { appointmentsApi } from '@/api';
import { formatDate } from '@/lib/utils';

export default function FollowUpQueuePage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.followups({ date: selectedDate });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFollowups(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

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
    const msg = `Dear ${patientName}, Greetings from HEAL Aesthetic & Medical Clinic. This is a gentle reminder regarding your medical follow-up consultation with Dr. ${doctorName} scheduled for ${dateStr}. Please let us know if you would like to confirm or reschedule your appointment. Thank you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Follow-Up & Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track patients scheduled for reviews, aesthetic session check-ins, and free WhatsApp follow-ups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
          <button
            onClick={fetchFollowups}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-sm font-medium shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Scheduled Due Today</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{followups.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Free WhatsApp Reminders</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">Zero API Cost</p>
          <p className="text-xs text-slate-400 mt-1">Uses WhatsApp Web / App directly</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Completed Contacted</span>
          <p className="text-3xl font-extrabold text-violet-600 mt-2">
            {followups.filter((f) => f.called).length}
          </p>
        </div>
      </div>

      {/* Follow-up list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">OP Number</th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Review Due</th>
                <th className="py-3.5 px-4">Instructions / Notes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    {loading ? 'Checking follow-up schedules...' : 'No patient follow-ups scheduled for this date'}
                  </td>
                </tr>
              ) : (
                followups.map((item) => (
                  <tr key={item.id} className={item.called ? 'bg-slate-50/60 opacity-70' : 'hover:bg-slate-50/70'}>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.patient_name || item.first_name}</div>
                      <div className="text-xs text-slate-500">{item.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-violet-700 font-semibold">
                      {item.op_no || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      Dr. {item.doctor_name || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatDate(item.review_date || item.appointment_date)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {item.review_instructions || item.purpose || 'Routine follow-up review'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.phone && (
                          <a
                            href={generateWhatsAppUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        )}
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
