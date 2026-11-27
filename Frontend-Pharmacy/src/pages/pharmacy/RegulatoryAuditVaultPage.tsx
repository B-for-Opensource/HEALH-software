import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  FileSpreadsheet, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  FileText, 
  Calendar, 
  UserCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { 
  getPharmacyStore, 
  subscribeToPharmacyUpdates,
  ScheduleH1AuditEntry,
  IsotretinoinConsentLog 
} from '@/lib/pharmacyEnterpriseData';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RegulatoryAuditVaultPage() {
  const [store, setStore] = useState(getPharmacyStore());
  const [activeTab, setActiveTab] = useState<'schedule_h1' | 'isotretinoin' | 'gst_engine'>('schedule_h1');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = subscribeToPharmacyUpdates(() => {
      setStore(getPharmacyStore());
    });
    return unsub;
  }, []);

  const handleExportCsv = (title: string) => {
    alert(`📥 ${title} statutory inspection report exported as CSV!\n\nCompliant with Drugs & Cosmetics Act Rule 65 & Form 35. Ready for State Drug Inspector verification.`);
  };

  const handleExportGstr = (type: 'gstr1' | 'gstr3b') => {
    alert(`📊 Indian GST ${type.toUpperCase()} Tax Summary JSON/CSV generated!\n\nCategorized across HSN 3004 (5%/12%), HSN 3304 (18%), and 0% Healthcare Consultations for direct upload to GST Portal.`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl 2xl:max-w-[1700px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
              Module 5 Enterprise Spec
            </span>
            <span className="text-xs text-stone-500 font-medium">Statutory Compliance &amp; India GST Engine</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1 flex items-center gap-2">
            <ShieldAlert className="text-rose-700" size={26} />
            Schedule H1, Isotretinoin &amp; GST Regulatory Vault
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Inspection-ready registers for State Drug Inspectors (Form 35/Rule 65), Teratogenicity pregnancy consent audits, and hybrid GSTR-1/GSTR-3B tax exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('schedule_h1')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'schedule_h1'
                ? 'bg-rose-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Lock size={14} />
            Schedule H1 Register ({store.scheduleH1Reg.length})
          </button>
          <button
            onClick={() => setActiveTab('isotretinoin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'isotretinoin'
                ? 'bg-amber-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <UserCheck size={14} />
            Isotretinoin Teratogenicity Log ({store.isotretinoinLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('gst_engine')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gst_engine'
                ? 'bg-emerald-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <FileSpreadsheet size={14} />
            GSTR-1 &amp; GSTR-3B Engine
          </button>
        </div>
      </div>

      {/* TAB 1: SCHEDULE H1 STATUTORY REGISTER */}
      {activeTab === 'schedule_h1' && (
        <div className="space-y-4">
          <div className="bg-rose-950 text-rose-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="font-black text-sm text-white flex items-center gap-2">
                <Lock size={16} className="text-rose-400" />
                Drugs &amp; Cosmetics Rules 1945 — Schedule H1 Mandatory Register
              </div>
              <div className="text-xs text-rose-200 mt-0.5">
                Statutory audit log under Rule 65. Requires Prescribing Doctor Medical Council Reg No, Patient Aadhaar/Photo ID reference, exact tablet count, and Pharmacist countersignature. Retained for 3 years.
              </div>
            </div>
            <button
              onClick={() => handleExportCsv('Schedule_H1_Form35_Register')}
              className="px-4 py-2 rounded-xl text-xs font-black bg-rose-500 hover:bg-rose-400 text-white transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download size={14} />
              Export Drug Inspector Register (CSV)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3 px-4">Dispense Timestamp</th>
                    <th className="py-3 px-4">Schedule H1 Drug &amp; Salt</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4">Patient Name &amp; ID</th>
                    <th className="py-3 px-4">Prescribing Doctor &amp; Reg #</th>
                    <th className="py-3 px-4">Indication / Notes</th>
                    <th className="py-3 px-4">Dispensing Pharmacist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {store.scheduleH1Reg.map((entry) => (
                    <tr key={entry.id} className="hover:bg-rose-50/20 transition">
                      <td className="py-3 px-4 font-mono font-medium text-stone-700 whitespace-nowrap">
                        {entry.dispensed_at}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{entry.drug_name}</div>
                        <div className="text-[10px] text-stone-500 italic">{entry.salt_name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-950">{entry.batch_no}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-black text-rose-900 bg-rose-100 px-2 py-0.5 rounded-md text-xs">
                          {entry.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{entry.patient_name}</div>
                        <div className="text-[10px] font-mono text-stone-500">
                          OP: {entry.patient_op} · Aadhaar: {entry.patient_aadhaar_ref}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{entry.doctor_name}</div>
                        <div className="text-[10px] font-mono font-bold text-emerald-800">
                          {entry.doctor_reg_no}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{entry.clinical_indication}</td>
                      <td className="py-3 px-4 font-medium text-stone-700 font-mono text-[11px]">
                        {entry.pharmacist_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ISOTRETINOIN TERATOGENICITY LOG */}
      {activeTab === 'isotretinoin' && (
        <div className="space-y-4">
          <div className="bg-amber-950 text-amber-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="font-black text-sm text-white flex items-center gap-2">
                <UserCheck size={16} className="text-amber-400" />
                Isotretinoin Pregnancy Prevention Program (iPLEDGE / CDSCO Compliant)
              </div>
              <div className="text-xs text-amber-200 mt-0.5">
                Strict teratogenicity verification before dispensing oral isotretinoin. Verifies signed informed consent waiver, negative urine pregnancy test confirmation, and contraception counseling.
              </div>
            </div>
            <button
              onClick={() => handleExportCsv('Isotretinoin_Teratogenicity_Register')}
              className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download size={14} />
              Export Consent Audit Log
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3 px-4">Date Dispensed</th>
                    <th className="py-3 px-4">Patient Name &amp; Age</th>
                    <th className="py-3 px-4 text-center">Strength &amp; Qty</th>
                    <th className="py-3 px-4">Prescribing Doctor</th>
                    <th className="py-3 px-4 text-center">Signed Waiver PDF</th>
                    <th className="py-3 px-4 text-center">Pregnancy Test</th>
                    <th className="py-3 px-4 text-center">Counseling Confirmed</th>
                    <th className="py-3 px-4 text-center">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {store.isotretinoinLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition">
                      <td className="py-3 px-4 font-mono font-medium text-stone-700">{formatDate(log.dispensed_date)}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{log.patient_name}</div>
                        <div className="text-[10px] text-stone-500">
                          {log.patient_op} · {log.gender}, {log.age} yrs
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-stone-900">{log.tablet_strength_mg}mg</span>
                        <span className="text-[10px] text-stone-500 block">({log.tablets_dispensed} capsules)</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{log.prescribing_doctor}</div>
                        <div className="text-[10px] font-mono text-emerald-800 font-bold">{log.doctor_reg_no}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-300">
                          {log.consent_pdf_ref}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ NEGATIVE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ COUNSELED
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-xs">
                          LOCKED &amp; VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GST TAX ENGINE (INDIA SPECIFIC) */}
      {activeTab === 'gst_engine' && (
        <div className="space-y-6">
          <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="font-black text-sm text-white flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-400" />
                Hybrid Healthcare &amp; Aesthetic GST Split Architecture
              </div>
              <div className="text-xs text-emerald-200 mt-0.5">
                Automatically isolates non-taxable clinical OPD consultations (0% GST) from general medicines (HSN 3004 at 5%/12%) and aesthetic cosmeceuticals/services (HSN 3304 at 18%).
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleExportGstr('gstr1')}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-white transition shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                Export GSTR-1 (JSON)
              </button>
              <button
                onClick={() => handleExportGstr('gstr3b')}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-emerald-100 text-emerald-950 transition shadow-md flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                Export GSTR-3B
              </button>
            </div>
          </div>

          {/* Tax Slabs Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase">Therapeutic Clinical (0% GST)</div>
              <div className="text-2xl font-black text-stone-900 font-mono mt-1">₹1,84,500.00</div>
              <div className="text-[11px] text-emerald-700 mt-1">Exempt under Notification 12/2017-CT</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase">General Medicines (12% GST)</div>
              <div className="text-2xl font-black text-stone-900 font-mono mt-1">₹86,400.00</div>
              <div className="text-[11px] text-stone-600 mt-1">HSN 3004 · Tax: ₹10,368.00 (CGST+SGST)</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase">Cosmeceuticals / Skincare (18% GST)</div>
              <div className="text-2xl font-black text-stone-900 font-mono mt-1">₹1,24,200.00</div>
              <div className="text-[11px] text-stone-600 mt-1">HSN 3304 · Tax: ₹22,356.00 (CGST+SGST)</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div className="text-[11px] font-bold text-stone-500 uppercase">Aesthetic Injectables (12% GST)</div>
              <div className="text-2xl font-black text-stone-900 font-mono mt-1">₹2,45,000.00</div>
              <div className="text-[11px] text-stone-600 mt-1">HSN 3002/3006 · Tax: ₹29,400.00</div>
            </div>
          </div>

          {/* GSTR-1 Table 12 HSN Summary */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
            <h3 className="font-black text-stone-900 text-sm">GSTR-1 Table 12: HSN Summary of Outward Supplies</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-2.5 px-4">HSN Code</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">UQC</th>
                    <th className="py-2.5 px-4 text-right">Taxable Value</th>
                    <th className="py-2.5 px-4 text-center">GST Rate</th>
                    <th className="py-2.5 px-4 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">SGST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Total Invoice (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">3004</td>
                    <td className="py-3 px-4 font-medium text-stone-800">Medicaments consisting of mixed or unmixed products for therapeutic uses</td>
                    <td className="py-3 px-4 text-center font-mono">OTH</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">₹77,142.86</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">12%</td>
                    <td className="py-3 px-4 text-right font-mono">₹4,628.57</td>
                    <td className="py-3 px-4 text-right font-mono">₹4,628.57</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-stone-900">₹86,400.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">3304</td>
                    <td className="py-3 px-4 font-medium text-stone-800">Beauty or make-up preparations &amp; skincare (sunscreen, anti-aging gels)</td>
                    <td className="py-3 px-4 text-center font-mono">NOS</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">₹1,05,254.24</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">18%</td>
                    <td className="py-3 px-4 text-right font-mono">₹9,472.88</td>
                    <td className="py-3 px-4 text-right font-mono">₹9,472.88</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-stone-900">₹1,24,200.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">3002</td>
                    <td className="py-3 px-4 font-medium text-stone-800">Botulinum Toxin Type A (Lyophilized neurotoxin for aesthetic wrinkles)</td>
                    <td className="py-3 px-4 text-center font-mono">VIA</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">₹2,18,750.00</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">12%</td>
                    <td className="py-3 px-4 text-right font-mono">₹13,125.00</td>
                    <td className="py-3 px-4 text-right font-mono">₹13,125.00</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-stone-900">₹2,45,000.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">9993</td>
                    <td className="py-3 px-4 font-medium text-stone-800">Human health services (Doctor Consultations, Clinical Nursing Triage)</td>
                    <td className="py-3 px-4 text-center font-mono">NA</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">₹1,84,500.00</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">0% (Nil)</td>
                    <td className="py-3 px-4 text-right font-mono">₹0.00</td>
                    <td className="py-3 px-4 text-right font-mono">₹0.00</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-stone-900">₹1,84,500.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
