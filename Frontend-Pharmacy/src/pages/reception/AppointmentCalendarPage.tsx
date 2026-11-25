import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Plus, 
  Stethoscope, 
  CheckCircle2, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { appointmentsApi, mastersApi } from '@/api';
import type { Appointment, Staff } from '@/types';
import { formatTime } from '@/lib/utils';

export default function AppointmentCalendarPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Time Slots
  const morningSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'];
  const eveningSlots = ['02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

  useEffect(() => {
    mastersApi.doctors().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDoctors(list);
    });

    appointmentsApi.queue().then((res) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAppointments(list);
    }).finally(() => setLoading(false));
  }, []);

  const filteredAppointments = appointments.filter((a) => {
    const matchesDoctor = selectedDoctorId === 'all' || a.doctor_id === selectedDoctorId;
    return matchesDoctor;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Doctor Appointment Calendar & Slot Grid
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-06] Pre-booked consultation slots, visiting specialist calendar & session bookings
          </p>
        </div>

        <button
          onClick={() => navigate('/reception/register')}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          + Book New Appointment
        </button>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-violet-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Doctor:</span>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">All Doctors & Specialists</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} ({d.department_name || 'Specialist'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Morning & Evening Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning Session */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Morning Clinical Session (09:00 AM – 01:00 PM)</h3>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
              General & Aesthetic OP
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {morningSlots.map((slot, i) => {
              const booked = filteredAppointments[i % filteredAppointments.length];
              const isOccupied = i < 4;
              return (
                <div
                  key={slot}
                  className={`p-3 rounded-lg border text-xs transition ${
                    isOccupied
                      ? 'bg-violet-50/70 border-violet-200 text-slate-800'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{slot}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isOccupied ? 'bg-violet-200 text-violet-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isOccupied ? 'Booked' : 'Available'}
                    </span>
                  </div>

                  {isOccupied && booked ? (
                    <div className="mt-2 space-y-0.5">
                      <p className="font-semibold text-slate-900 truncate">{booked.patient_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{booked.op_no}</p>
                      <p className="text-[11px] text-violet-700 font-medium truncate">{booked.purpose || 'Consultation'}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-400 italic">Empty Slot</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Evening Session */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-900 text-sm">Evening Clinical Session (02:00 PM – 06:00 PM)</h3>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
              Daycare & Procedures
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {eveningSlots.map((slot, i) => {
              const isOccupied = i === 1 || i === 3;
              const booked = filteredAppointments[i];
              return (
                <div
                  key={slot}
                  className={`p-3 rounded-lg border text-xs transition ${
                    isOccupied
                      ? 'bg-sky-50/70 border-sky-200 text-slate-800'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{slot}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isOccupied ? 'bg-sky-200 text-sky-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isOccupied ? 'Booked' : 'Available'}
                    </span>
                  </div>

                  {isOccupied && booked ? (
                    <div className="mt-2 space-y-0.5">
                      <p className="font-semibold text-slate-900 truncate">{booked.patient_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{booked.op_no}</p>
                      <p className="text-[11px] text-sky-700 font-medium truncate">Daycare Laser Session</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-400 italic">Empty Slot</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
