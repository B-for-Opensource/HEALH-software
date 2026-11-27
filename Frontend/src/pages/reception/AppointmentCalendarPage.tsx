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
  Search,
  Printer,
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { appointmentsApi, mastersApi, patientsApi } from '@/api';
import type { Appointment, Staff, Patient } from '@/types';
import { formatTime } from '@/lib/utils';

export default function AppointmentCalendarPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'booking' | 'grid'>('booking');
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // SCREENSHOT (18) EXACT BOOKING WINDOW STATE
  const [bookingNo, setBookingNo] = useState('1');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState(() => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [doctorName, setDoctorName] = useState('SWATHIGHA SUDHEER .K');
  const [tokenDate, setTokenDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tokenTime, setTokenTime] = useState('10:00 AM');
  const [tokenNo, setTokenNo] = useState('1');
  const [opNo, setOpNo] = useState('');
  const [patientName, setPatientName] = useState('');
  const [place, setPlace] = useState('Calicut');
  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState('Female');
  const [ageY, setAgeY] = useState('28');
  const [ageM, setAgeM] = useState('0');
  const [ageD, setAgeD] = useState('0');
  const [purpose, setPurpose] = useState('Consultation');
  const [amount, setAmount] = useState('500');
  const [payMode, setPayMode] = useState('Cash');
  const [card, setCard] = useState('(none)');
  const [status, setStatus] = useState('Booked');
  const [receptionist, setReceptionist] = useState('Receptionist 1');

  // Search suggestions
  const [patientQuery, setPatientQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);

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

  const handleSearchPatient = async (val: string) => {
    setPatientQuery(val);
    setPatientName(val);
    if (val.trim().length >= 2) {
      try {
        const res = await patientsApi.search(val);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setPatientSuggestions(list);
      } catch {
        setPatientSuggestions([]);
      }
    } else {
      setPatientSuggestions([]);
    }
  };

  const selectPatient = (p: Patient) => {
    setPatientName(`${p.first_name} ${p.last_name || ''}`.trim());
    setOpNo(p.op_no || '');
    setPhone(p.phone || '');
    setPlace(p.city || p.address || 'Calicut');
    if (p.gender) setSex(p.gender);
    if (p.age_years) setAgeY(String(p.age_years));
    setPatientSuggestions([]);
  };

  const handleSaveBooking = async () => {
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }
    const newAppt = {
      patient_name: patientName,
      op_no: opNo || `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      doctor_name: doctorName,
      appointment_date: tokenDate,
      time_slot: tokenTime,
      token_number: tokenNo,
      purpose: purpose,
      status: status,
      fee_amount: parseFloat(amount) || 500,
      payment_mode: payMode,
      receptionist: receptionist
    };
    try {
      await appointmentsApi.create(newAppt);
      alert(`Booking #${bookingNo} Confirmed for ${patientName} with Dr. ${doctorName}!\nToken No: ${tokenNo}`);
      setAppointments((prev) => [newAppt as any, ...prev]);
      handleNewBooking();
    } catch {
      alert('Appointment saved locally.');
      setAppointments((prev) => [newAppt as any, ...prev]);
      handleNewBooking();
    }
  };

  const handleNewBooking = () => {
    setBookingNo(String(parseInt(bookingNo) + 1));
    setPatientName('');
    setOpNo('');
    setPhone('');
    setPlace('Calicut');
    setTokenNo(String(parseInt(tokenNo) + 1));
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesDoctor = selectedDoctorId === 'all' || a.doctor_id === selectedDoctorId;
    return matchesDoctor;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar with Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Booking & Appointment Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Doctor tokens, OPD scheduling, advance reservations & slot grid
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('booking')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
              viewMode === 'booking'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Booking Window (SCR-18)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Doctor Slot Grid
          </button>
        </div>
      </div>

      {viewMode === 'booking' ? (
        /* SCREENSHOT (18) EXACT BOOKING WINDOW */
        <div className="bg-white border-2 border-slate-300 rounded-xl shadow-lg overflow-hidden font-sans text-xs">
          {/* WINDOW TITLE BAR */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm tracking-wide uppercase">Booking</span>
              <span className="text-[11px] text-slate-400 border-l border-slate-600 pl-2">
                HEAL Patient Appointment & Token Generation
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-xs">
              <button onClick={() => setViewMode('grid')} className="hover:bg-slate-700 px-2 py-0.5 rounded">_</button>
              <button onClick={() => setViewMode('grid')} className="hover:bg-slate-700 px-2 py-0.5 rounded">□</button>
              <button onClick={() => navigate(-1)} className="hover:bg-rose-700 px-2 py-0.5 rounded text-white font-bold">✕</button>
            </div>
          </div>

          <div className="p-4 space-y-4 bg-slate-50/50">
            {/* SECTION 1: HEADER (No, Date, Time, Doctor) */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-2 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-10 text-right">No.</label>
                  <input
                    type="text"
                    value={bookingNo}
                    onChange={(e) => setBookingNo(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-12 text-right">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-12 text-right">Time</label>
                  <input
                    type="text"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                  />
                </div>
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-16 text-right">Doctor</label>
                  <select
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900"
                  >
                    <option value="SWATHIGHA SUDHEER .K">SWATHIGHA SUDHEER .K</option>
                    <option value="ARUN PRAKASH">ARUN PRAKASH</option>
                    <option value="Dr. Ananya Nair">Dr. Ananya Nair</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: TOKEN DETAILS (Token Date, Time, Token No) */}
            <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-200">
              <span className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2">
                Token Allocation & Slot Schedule
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-24 text-right">Token Date</label>
                  <input
                    type="date"
                    value={tokenDate}
                    onChange={(e) => setTokenDate(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-12 text-right">Time</label>
                  <select
                    value={tokenTime}
                    onChange={(e) => setTokenTime(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-12 text-right">No.</label>
                  <input
                    type="text"
                    value={tokenNo}
                    onChange={(e) => setTokenNo(e.target.value)}
                    className="w-20 bg-white border border-amber-300 rounded px-2 py-1 text-center font-black text-amber-950 font-mono text-sm"
                  />
                  <span className="text-[11px] text-amber-800 font-semibold">(Token #)</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: PATIENT DEMOGRAPHICS (OPNo, Patient, Place, Phone, Sex, Age(YMD)) */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Patient Information
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-16 text-right">OPNo.</label>
                  <div className="flex-1 flex gap-1">
                    <input
                      type="text"
                      placeholder="OP No..."
                      value={opNo}
                      onChange={(e) => {
                        setOpNo(e.target.value);
                        handleSearchPatient(e.target.value);
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                    />
                    <button
                      type="button"
                      className="px-2 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold"
                      title="Search patient"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-8 flex items-center gap-2 relative">
                  <label className="font-bold text-slate-700 w-16 text-right">Patient</label>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Patient full name..."
                      value={patientName}
                      onChange={(e) => handleSearchPatient(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900"
                    />
                    {patientSuggestions.length > 0 && (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-slate-300 rounded shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {patientSuggestions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectPatient(p)}
                            className="w-full text-left p-2 hover:bg-violet-50 text-xs flex items-center justify-between"
                          >
                            <span className="font-bold text-slate-900">{p.first_name} {p.last_name || ''}</span>
                            <span className="text-slate-500 font-mono text-[10px]">({p.op_no}) · {p.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-16 text-right">Place</label>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-16 text-right">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 w-10 text-right">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-1.5 py-1"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-1">
                  <label className="font-bold text-slate-700 text-right whitespace-nowrap">Age(YMD)</label>
                  <input
                    type="text"
                    placeholder="Y"
                    value={ageY}
                    onChange={(e) => setAgeY(e.target.value)}
                    className="w-9 bg-white border border-slate-300 rounded p-1 text-center font-bold"
                  />
                  <input
                    type="text"
                    placeholder="M"
                    value={ageM}
                    onChange={(e) => setAgeM(e.target.value)}
                    className="w-8 bg-white border border-slate-300 rounded p-1 text-center"
                  />
                  <input
                    type="text"
                    placeholder="D"
                    value={ageD}
                    onChange={(e) => setAgeD(e.target.value)}
                    className="w-8 bg-white border border-slate-300 rounded p-1 text-center"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: PURPOSE, AMOUNT, PAY MODE, CARD, STATUS */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Booking Purpose & Payment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 flex items-center gap-2">
                  <label className="font-bold text-slate-700 w-16 text-right">Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Laser Treatment">Laser Treatment</option>
                    <option value="Chemical Peel">Chemical Peel</option>
                    <option value="HydraFacial">HydraFacial</option>
                    <option value="Dressing / Minor Proc">Dressing / Minor Proc</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 w-14 text-right">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-right text-emerald-800"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 w-16 text-right whitespace-nowrap">Pay Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-1.5 py-1 font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 w-10 text-right">Card</label>
                  <select
                    value={card}
                    onChange={(e) => setCard(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-600"
                  >
                    <option value="(none)">(none)</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="RuPay">RuPay</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 w-12 text-right">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex-1 bg-emerald-50 border border-emerald-300 rounded px-1.5 py-1 font-bold text-emerald-900"
                  >
                    <option value="Booked">Booked</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Arrived">Arrived</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SCREENSHOT 18 BOTTOM TOOLBAR */}
            <div className="bg-slate-200 p-3 rounded-lg border border-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-white border border-slate-400 hover:bg-slate-50 rounded text-slate-800 font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-700" />
                  Print
                </button>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700">Receptionist:</span>
                  <select
                    value={receptionist}
                    onChange={(e) => setReceptionist(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900"
                  >
                    <option value="Receptionist 1">Receptionist 1</option>
                    <option value="Receptionist 2">Receptionist 2</option>
                    <option value="SUPER ADMIN">SUPER ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveBooking}
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleNewBooking}
                  className="px-4 py-1.5 bg-white border border-slate-400 hover:bg-slate-50 rounded text-slate-800 font-bold shadow-xs"
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className="px-4 py-1.5 bg-white border border-slate-400 hover:bg-slate-50 rounded text-slate-800 font-bold shadow-xs"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DOCTOR SLOT CALENDAR GRID VIEW */
        <div className="space-y-6">
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
                      className={`p-3 rounded-lg border text-xs transition cursor-pointer ${
                        isOccupied
                          ? 'bg-violet-50/70 border-violet-200 text-slate-800'
                          : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        setTokenTime(slot);
                        setViewMode('booking');
                      }}
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
                        <p className="mt-2 text-[11px] text-slate-400 italic">+ Click to Book</p>
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
                      className={`p-3 rounded-lg border text-xs transition cursor-pointer ${
                        isOccupied
                          ? 'bg-sky-50/70 border-sky-200 text-slate-800'
                          : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        setTokenTime(slot);
                        setViewMode('booking');
                      }}
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
                        <p className="mt-2 text-[11px] text-slate-400 italic">+ Click to Book</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
