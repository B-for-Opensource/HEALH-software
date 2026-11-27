import React, { useState, useEffect } from 'react';
import {
  Activity,
  FileText,
  Pill,
  FlaskConical,
  Scan,
  HeartPulse,
  Receipt,
  LogOut,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { patientPortalApi, PatientProfile, PatientTimelineData } from '../api/patientPortalApi';

interface PatientPortalDashboardProps {
  onLogout: () => void;
}

export default function PatientPortalDashboard({ onLogout }: PatientPortalDashboardProps) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [timeline, setTimeline] = useState<PatientTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'encounters' | 'prescriptions' | 'lab' | 'imaging' | 'procedures' | 'bills'
  >('encounters');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prof, tline] = await Promise.all([
          patientPortalApi.getProfile(),
          patientPortalApi.getTimeline(),
        ]);
        setProfile(prof);
        setTimeline(tline);
      } catch (err) {
        console.error('Failed to load patient portal data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-stone-100/70 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-serif font-black text-lg">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-wider text-base text-amber-200 uppercase">
                  HEALESTHETIC
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  Patient Health Portal
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Karanthoor, Calicut · Helpline: 0495-2720000
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-white block">
                  {profile.first_name} {profile.last_name || ''}
                </span>
                <span className="text-[11px] font-mono text-amber-300 font-bold">
                  {profile.op_no}
                </span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 transition flex items-center gap-1.5 cursor-pointer border border-stone-700"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Patient Profile Card */}
        {profile && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 border border-amber-200 flex items-center justify-center text-amber-900 font-black text-xl">
                  {profile.first_name?.[0] || 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-stone-900">
                      {profile.first_name} {profile.last_name || ''}
                    </h2>
                    <span className="text-xs font-mono font-black bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-md border border-stone-200">
                      OP: {profile.op_no}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {profile.gender || 'Patient'} · Age: {profile.age_years || 'N/A'} yrs
                    {profile.date_of_birth ? ` (DOB: ${profile.date_of_birth})` : ''} · Contact: +91 {profile.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl text-xs">
                  <span className="text-[10px] text-rose-600 block uppercase font-bold">Blood Group</span>
                  <span className="font-black text-rose-950 text-sm">{profile.blood_group || 'Recorded'}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs">
                  <span className="text-[10px] text-amber-700 block uppercase font-bold">Allergies Alert</span>
                  <span className="font-bold text-amber-950 text-xs">{profile.known_allergies || 'NKDA (None Known)'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-xs">
          <button
            onClick={() => setActiveTab('encounters')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'encounters'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Calendar size={15} />
            <span>Visits &amp; Consultations ({timeline?.encounters?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Pill size={15} />
            <span>Prescriptions &amp; Rx ({timeline?.prescriptions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'lab'
                ? 'bg-sky-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <FlaskConical size={15} />
            <span>Released Lab Reports ({timeline?.lab_reports?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('imaging')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'imaging'
                ? 'bg-indigo-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Scan size={15} />
            <span>Imaging / X-Ray / MRI ({timeline?.imaging_reports?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('procedures')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'procedures'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <HeartPulse size={15} />
            <span>Procedures ({timeline?.procedures?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'bills'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Receipt size={15} />
            <span>Bills &amp; Invoices ({timeline?.bills?.length || 0})</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 text-xs">
            Loading your medical timeline from HEALESTHETIC secure server...
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. VISITS & ENCOUNTERS */}
            {activeTab === 'encounters' && (
              <div className="space-y-4">
                {timeline?.encounters?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-xs text-stone-400">
                    No clinical visit records found yet.
                  </div>
                ) : (
                  timeline?.encounters.map((enc) => (
                    <div key={enc.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-sm text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                            {enc.encounter_no}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            {enc.encounter_type}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 font-medium">
                          {enc.started_at ? new Date(enc.started_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600">
                        Status: <strong className="text-emerald-700">{enc.status}</strong> · Multi-department synchronized encounter
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. PRESCRIPTIONS */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                {timeline?.prescriptions?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-xs text-stone-400">
                    No prescription history found.
                  </div>
                ) : (
                  timeline?.prescriptions.map((rx) => (
                    <div key={rx.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Pill className="text-emerald-700" size={18} />
                          <span className="font-black text-stone-900 text-sm">
                            Rx Prescribed on {rx.rx_date || 'Clinic Visit'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {rx.status}
                        </span>
                      </div>

                      <div className="divide-y divide-stone-100">
                        {rx.items.map((it, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-stone-900">{it.medicine_name}</span>
                              <span className="text-stone-500 block text-[11px] mt-0.5">
                                {it.dosage} · {it.frequency} · {it.duration_days} days
                              </span>
                            </div>
                            <span className="font-mono font-bold text-stone-700 bg-stone-50 px-2 py-1 rounded">
                              Qty: {it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {rx.general_advice && (
                        <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 border border-stone-100">
                          <strong>Doctor's Advice:</strong> {rx.general_advice}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. RELEASED LAB REPORTS */}
            {activeTab === 'lab' && (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-sky-700 shrink-0" />
                  <span>
                    Only pathologically verified &amp; authorized <strong>RELEASED</strong> diagnostic reports are visible here.
                  </span>
                </div>

                {timeline?.lab_reports?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-xs text-stone-400">
                    No released laboratory reports available yet.
                  </div>
                ) : (
                  timeline?.lab_reports.map((lo) => (
                    <div key={lo.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <FlaskConical className="text-sky-700" size={18} />
                            <span className="font-black text-stone-900 text-sm">Lab Order #{lo.order_no}</span>
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              VERIFIED &amp; RELEASED
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Released: {lo.released_at ? new Date(lo.released_at).toLocaleString() : 'Recent'}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 text-left">
                            <tr>
                              <th className="p-2 font-bold">Investigation Parameter</th>
                              <th className="p-2 font-bold">Observed Value</th>
                              <th className="p-2 font-bold">Reference Range</th>
                              <th className="p-2 font-bold text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {lo.results.map((r, i) => (
                              <tr key={i} className="hover:bg-stone-50">
                                <td className="p-2 font-medium text-stone-800">{r.parameter_name}</td>
                                <td className={`p-2 font-mono font-bold ${r.is_abnormal ? 'text-rose-700' : 'text-stone-900'}`}>
                                  {r.observed_value} {r.unit || ''}
                                </td>
                                <td className="p-2 text-stone-500 font-mono">{r.reference_range || 'Normal'}</td>
                                <td className="p-2 text-center">
                                  {r.is_abnormal ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">
                                      ABNORMAL
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      NORMAL
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. IMAGING REPORTS (X-Ray, MRI, CT, USG) */}
            {activeTab === 'imaging' && (
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-700 shrink-0" />
                  <span>
                    Only verified radiologist signed-off scans (X-Ray / MRI / CT / USG) are displayed in this portal.
                  </span>
                </div>

                {timeline?.imaging_reports?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-xs text-stone-400">
                    No verified imaging reports available yet.
                  </div>
                ) : (
                  timeline?.imaging_reports.map((img) => (
                    <div key={img.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Scan className="text-indigo-700" size={18} />
                          <div>
                            <span className="font-black text-stone-900 text-sm">
                              {img.service_name} ({img.modality})
                            </span>
                            <span className="text-[11px] font-mono text-stone-500 block">
                              Order #{img.order_no} · Verified {img.verified_at ? new Date(img.verified_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
                          VERIFIED
                        </span>
                      </div>

                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-2 text-xs">
                        <span className="font-bold text-stone-800 block">Radiologist Findings &amp; Clinical Impression:</span>
                        <p className="text-stone-700 whitespace-pre-line leading-relaxed font-sans">
                          {img.radiologist_findings || 'Radiological review complete with no acute contraindications.'}
                        </p>
                      </div>

                      {img.report_file_url && (
                        <div className="flex justify-end">
                          <a
                            href={img.report_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-700 text-white hover:bg-indigo-600"
                          >
                            <Download size={13} />
                            Download Scan Report
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 5. NURSING & PROCEDURES */}
            {activeTab === 'procedures' && (
              <div className="space-y-4">
                {timeline?.procedures?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-xs text-stone-400">
                    No procedure records found.
                  </div>
                ) : (
                  timeline?.procedures.map((proc) => (
                    <div key={proc.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <HeartPulse className="text-rose-700" size={18} />
                        <div>
                          <span className="font-bold text-stone-900 text-sm block">{proc.procedure_name}</span>
                          <span className="text-stone-500 text-[11px]">
                            Completed on: {proc.completed_at ? new Date(proc.completed_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        COMPLETED
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 6. BILLS & INVOICES */}
            {activeTab === 'bills' && (
              <div className="space-y-4">
                {timeline?.bills?.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-xs text-stone-400">
                    No billing history found.
                  </div>
                ) : (
                  timeline?.bills.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt className="text-amber-700" size={18} />
                          <span className="font-mono font-black text-sm text-stone-900">{b.bill_no}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                            {b.department_scope || 'CLINIC'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Date: {b.bill_date ? new Date(b.bill_date).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-stone-500 text-[10px] block">Net Amount</span>
                          <span className="font-mono font-black text-sm text-stone-900">₹{b.net_amount.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-stone-500 text-[10px] block">Balance Due</span>
                          <span className={`font-mono font-bold text-xs ${b.balance_due > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            ₹{b.balance_due.toFixed(2)}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {b.payment_status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
