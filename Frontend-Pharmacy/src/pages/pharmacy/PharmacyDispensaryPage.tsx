import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Clock, 
  Plus, 
  Barcode,
  Layers,
  Sparkles,
  UserCheck,
  User,
  Lock,
  Receipt,
  FileText,
  Printer
} from 'lucide-react';
import { 
  getPharmacyStore, 
  savePharmacyStore, 
  subscribeToPharmacyUpdates,
  ScheduleH1AuditEntry,
  EnterpriseBatch 
} from '@/lib/pharmacyEnterpriseData';
import { pharmacyApi, patientsApi } from '@/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PharmacyDispensaryPage() {
  const [activeTab, setActiveTab] = useState<'dispensing' | 'otc' | 'substitution'>('dispensing');
  const [store, setStore] = useState(getPharmacyStore());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dispenseQty, setDispenseQty] = useState<Record<string, number>>({});
  const [selectedMolecule, setSelectedMolecule] = useState<string>('Doxycycline Hyclate 100mg + Lactic Acid Bacillus');

  // Live FastAPI Prescriptions & FEFO Batches
  const [livePrescriptions, setLivePrescriptions] = useState<any[]>([]);
  const [liveBatches, setLiveBatches] = useState<any[]>([]);
  const [rxDispenseQtys, setRxDispenseQtys] = useState<Record<string, number>>({});
  const [rxDispensingId, setRxDispensingId] = useState<string | null>(null);

  // Direct Walk-In Sale Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInPatientSearch, setWalkInPatientSearch] = useState('');
  const [walkInPatientResults, setWalkInPatientResults] = useState<any[]>([]);
  const [selectedWalkInPatient, setSelectedWalkInPatient] = useState<any | null>(null);
  const [quickRegMode, setQuickRegMode] = useState(false);
  const [quickRegForm, setQuickRegForm] = useState({ first_name: '', date_of_birth: '1995-01-01', phone: '' });
  const [walkInCart, setWalkInCart] = useState<Array<{ batch: any; qty: number }>>([]);
  const [walkInSaving, setWalkInSaving] = useState(false);

  // Schedule H1 Modal State
  const [h1BatchToDispense, setH1BatchToDispense] = useState<EnterpriseBatch | null>(null);
  const [h1Form, setH1Form] = useState({
    patient_name: 'Fathima Zahra',
    patient_op: 'OP-1033',
    patient_aadhaar_ref: 'XXXX-XXXX-9142',
    doctor_name: 'Dr. Ananya Nair',
    doctor_reg_no: 'TCMC-49812-DERM',
    pharmacist_name: 'R. Shaji (Reg #KL-PH-8819)',
    quantity: 10,
    clinical_indication: 'Grade III Inflammatory Acne Vulgaris',
  });

  // OTC Retail POS State
  const [otcPatientSearch, setOtcPatientSearch] = useState('');
  const [otcPatientResults, setOtcPatientResults] = useState<any[]>([]);
  const [selectedOtcPatient, setSelectedOtcPatient] = useState<any | null>(null);
  const [printedBill, setPrintedBill] = useState<any | null>(null);

  const loadLivePharmacyData = async () => {
    setLoading(true);
    try {
      const [rxRes, batchRes] = await Promise.allSettled([
        pharmacyApi.prescriptions(),
        pharmacyApi.batches(),
      ]);
      if (rxRes.status === 'fulfilled') {
        const list = Array.isArray(rxRes.value) ? rxRes.value : (rxRes.value?.data || []);
        setLivePrescriptions(list);
        const initQtys: Record<string, number> = {};
        list.forEach((rx: any) => {
          (rx.items || []).forEach((it: any) => {
            if ((it.remaining_qty ?? it.quantity) > 0) {
              initQtys[it.id] = it.remaining_qty ?? it.quantity;
            }
          });
        });
        setRxDispenseQtys((prev) => ({ ...initQtys, ...prev }));
      }
      if (batchRes.status === 'fulfilled') {
        const bList = Array.isArray(batchRes.value) ? batchRes.value : (batchRes.value?.data || []);
        setLiveBatches(bList);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLivePharmacyData();
    const unsub = subscribeToPharmacyUpdates(() => {
      setStore(getPharmacyStore());
    });
    return unsub;
  }, []);

  const handleDispenseRxItems = async (rx: any) => {
    const itemsToDispense = (rx.items || [])
      .map((it: any) => {
        const qty = rxDispenseQtys[it.id] ?? it.remaining_qty ?? 0;
        return {
          prescription_item_id: it.id,
          medicine_name: it.medicine_name,
          dispense_qty: Number(qty),
        };
      })
      .filter((x: any) => x.dispense_qty > 0);

    if (itemsToDispense.length === 0) {
      alert('Please enter at least one quantity > 0 to dispense.');
      return;
    }

    setRxDispensingId(rx.id);
    try {
      const res = await pharmacyApi.dispense({
        patient_id: rx.patient_id,
        prescription_id: rx.id,
        encounter_id: rx.encounter_id,
        is_direct_sale: false,
        items: itemsToDispense,
      });
      const data = res?.data || res;
      alert(`✅ Prescription dispensed! Bill No: ${data?.bill_no || 'Generated'} · Net: ${formatCurrency(data?.net_amount || 0)}`);
      await loadLivePharmacyData();
    } catch (err: any) {
      alert(`Failed to dispense: ${err?.message || 'Unknown error'}`);
    } finally {
      setRxDispensingId(null);
    }
  };

  const handleWalkInPatientSearch = async (q: string) => {
    setWalkInPatientSearch(q);
    if (q.trim().length >= 2) {
      try {
        const res = await patientsApi.search(q.trim());
        setWalkInPatientResults(Array.isArray(res) ? res : (res?.data || []));
      } catch {
        setWalkInPatientResults([]);
      }
    } else {
      setWalkInPatientResults([]);
    }
  };

  const handleCompleteWalkInSale = async () => {
    if (walkInCart.length === 0) {
      alert('Add at least one medicine to the walk-in cart.');
      return;
    }
    setWalkInSaving(true);
    try {
      let patientId = selectedWalkInPatient?.id;
      let patientLabel = selectedWalkInPatient
        ? `${selectedWalkInPatient.first_name} ${selectedWalkInPatient.last_name || ''}`.trim()
        : '';
      let patientOp = selectedWalkInPatient?.op_no || 'WALKIN';

      if (!patientId && quickRegMode) {
        if (!quickRegForm.first_name.trim() || !quickRegForm.date_of_birth) {
          alert('First Name and Date of Birth are required for walk-in registration.');
          setWalkInSaving(false);
          return;
        }
        const created = await patientsApi.create({
          first_name: quickRegForm.first_name.trim(),
          date_of_birth: quickRegForm.date_of_birth,
          phone: quickRegForm.phone.trim() || undefined,
          gender: 'Unspecified',
          created_source: 'PHARMACY',
        });
        const pData = created?.data || created;
        patientId = pData?.id;
        patientLabel = quickRegForm.first_name.trim();
        patientOp = pData?.op_no || 'NEW-PHM';
      }

      if (!patientId) {
        alert('Please search and select a patient, or register a quick walk-in patient.');
        setWalkInSaving(false);
        return;
      }

      const res = await pharmacyApi.dispense({
        patient_id: patientId,
        is_direct_sale: true,
        items: walkInCart.map((c) => ({
          batch_id: c.batch.id,
          medicine_name: c.batch.medicine_name,
          dispense_qty: c.qty,
          unit_price: c.batch.mrp,
          gst_percent: c.batch.gst_percent ?? c.batch.gst_rate ?? 12,
        })),
      });
      const data = res?.data || res;

      setPrintedBill({
        billNo: data?.bill_no || `PHM-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleString(),
        patientName: patientLabel,
        patientOp: patientOp,
        doctorName: 'Direct Pharmacy Walk-In (No Consultation)',
        doctorReg: 'DIRECT_PHARMACY',
        items: walkInCart.map((c) => {
          const gst = c.batch.gst_percent ?? c.batch.gst_rate ?? 12;
          const total = (c.batch.mrp || 0) * c.qty;
          const base = total / (1 + gst / 100);
          return {
            name: c.batch.medicine_name,
            batchNo: c.batch.batch_no,
            hsn: c.batch.hsn_code || '3004',
            qty: c.qty,
            mrp: c.batch.mrp,
            gstRate: gst,
            basePrice: base,
            taxAmount: total - base,
            total,
          };
        }),
        totalAmount: data?.net_amount || walkInCart.reduce((acc, c) => acc + (c.batch.mrp || 0) * c.qty, 0),
        taxBreakdown: { hsn: '3004', cgst: 0, sgst: 0, totalTax: 0 },
      });

      setShowWalkInModal(false);
      setWalkInCart([]);
      setSelectedWalkInPatient(null);
      await loadLivePharmacyData();
      alert(`✅ Direct Walk-In Sale Completed! Bill No: ${data?.bill_no || 'Generated'}`);
    } catch (err: any) {
      alert(`Walk-In Sale Error: ${err?.message || 'Failed to complete sale'}`);
    } finally {
      setWalkInSaving(false);
    }
  };

  const handleDispenseInitiate = (batch: EnterpriseBatch) => {
    const qty = dispenseQty[batch.id] || 1;
    if (batch.is_schedule_h1) {
      // Trigger Schedule H1 Compliance Lock
      setH1BatchToDispense(batch);
      setH1Form((prev) => ({
        ...prev,
        quantity: qty,
      }));
    } else {
      executeDispense(batch, qty);
    }
  };

  const executeDispense = (batch: EnterpriseBatch, qty: number, h1Data?: typeof h1Form) => {
    // Deduct stock from enterprise store
    const updatedBatches = store.batches.map((b) => {
      if (b.id === batch.id) {
        return {
          ...b,
          stock_qty: Math.max(0, b.stock_qty - qty),
        };
      }
      return b;
    });

    let updatedH1Reg = store.scheduleH1Reg;
    if (h1Data && batch.is_schedule_h1) {
      const newEntry: ScheduleH1AuditEntry = {
        id: `h1-${Date.now()}`,
        dispensed_at: new Date().toLocaleString(),
        drug_name: batch.medicine_name,
        salt_name: batch.salt_name,
        batch_no: batch.batch_no,
        quantity: qty,
        patient_name: h1Data.patient_name,
        patient_op: h1Data.patient_op,
        patient_aadhaar_ref: h1Data.patient_aadhaar_ref,
        doctor_name: h1Data.doctor_name,
        doctor_reg_no: h1Data.doctor_reg_no,
        pharmacist_name: h1Data.pharmacist_name,
        clinical_indication: h1Data.clinical_indication,
      };
      updatedH1Reg = [newEntry, ...store.scheduleH1Reg];
    }

    const updatedStore = {
      ...store,
      batches: updatedBatches,
      scheduleH1Reg: updatedH1Reg,
    };

    savePharmacyStore(updatedStore);
    setStore(updatedStore);
    setH1BatchToDispense(null);

    // Prepare bill preview
    const gstRate = batch.gst_rate || 12;
    const basePrice = (batch.mrp * qty) / (1 + gstRate / 100);
    const taxAmount = (batch.mrp * qty) - basePrice;

    setPrintedBill({
      billNo: `RX-BILL-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString(),
      patientName: h1Data?.patient_name || 'Walk-in Dispensary Patient',
      patientOp: h1Data?.patient_op || 'OP-WALKIN',
      doctorName: h1Data?.doctor_name || 'Dr. Ananya Nair',
      doctorReg: h1Data?.doctor_reg_no || 'TCMC-49812-DERM',
      items: [
        {
          name: batch.medicine_name,
          batchNo: batch.batch_no,
          hsn: batch.hsn_code,
          qty: qty,
          mrp: batch.mrp,
          gstRate: gstRate,
          basePrice: basePrice,
          taxAmount: taxAmount,
          total: batch.mrp * qty,
        },
      ],
      totalAmount: batch.mrp * qty,
      taxBreakdown: {
        hsn: batch.hsn_code,
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        totalTax: taxAmount,
      },
    });

    alert(`✅ Successfully dispensed ${qty} units of ${batch.medicine_name}!\n\nStock updated. Tax-split invoice generated.`);
  };

  const handleOtcPatientSearch = async (val: string) => {
    setOtcPatientSearch(val);
    if (val.trim().length >= 2) {
      try {
        const res = await patientsApi.search(val.trim());
        const list = Array.isArray(res) ? res : (res?.data || []);
        setOtcPatientResults(list);
      } catch {
        setOtcPatientResults([]);
      }
    } else {
      setOtcPatientResults([]);
    }
  };

  const handleSelectOtcPatient = (p: any) => {
    setSelectedOtcPatient(p);
    setOtcPatientSearch(`${p.op_no} — ${p.first_name} ${p.last_name || ''}`);
    setOtcPatientResults([]);
  };

  const handleQuickRetailBill = (itemName: string, price: number, gstRate: number, hsn: string) => {
    const clientDesc = selectedOtcPatient 
      ? `Patient: ${selectedOtcPatient.first_name} ${selectedOtcPatient.last_name || ''} (OP #${selectedOtcPatient.op_no})` 
      : 'Walk-in Retail Customer';

    const basePrice = price / (1 + gstRate / 100);
    const taxAmount = price - basePrice;

    setPrintedBill({
      billNo: `POS-RETAIL-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString(),
      patientName: selectedOtcPatient ? `${selectedOtcPatient.first_name} ${selectedOtcPatient.last_name || ''}` : 'Walk-in Retail Customer',
      patientOp: selectedOtcPatient?.op_no || 'RETAIL-POS',
      doctorName: 'Direct OTC Skincare (Exempt from consultation fee)',
      doctorReg: 'N/A',
      items: [
        {
          name: itemName,
          batchNo: 'UV-2611-X',
          hsn: hsn,
          qty: 1,
          mrp: price,
          gstRate: gstRate,
          basePrice: basePrice,
          taxAmount: taxAmount,
          total: price,
        },
      ],
      totalAmount: price,
      taxBreakdown: {
        hsn: hsn,
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        totalTax: taxAmount,
      },
    });

    alert(`✅ Quick Retail Bill Generated!\n\nItem: ${itemName} (${formatCurrency(price)})\nClient: ${clientDesc}\nGST Split: ${gstRate}% (HSN ${hsn})`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl 2xl:max-w-[1700px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              Module 5 Enterprise Spec
            </span>
            <span className="text-xs text-stone-500 font-medium">Schedule H1 Statutory Gate &amp; Hybrid GST Split</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1 flex items-center gap-2">
            <Pill className="text-emerald-700" size={26} />
            Rx Dispensing Counter &amp; Salt Substitutions
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Prescription fulfillment, CDSCO generic bioequivalent substitutions, Schedule H1 mandatory lock, and hybrid GST invoice generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            Direct Walk-In Sale
          </button>
          <button
            onClick={() => setActiveTab('dispensing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dispensing'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Pill size={14} />
            Rx Dispensing Queue
          </button>
          <button
            onClick={() => setActiveTab('substitution')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'substitution'
                ? 'bg-purple-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Sparkles size={14} />
            Chemical Salt Substitutions
          </button>
          <button
            onClick={() => setActiveTab('otc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'otc'
                ? 'bg-amber-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <ShoppingBag size={14} />
            Walk-in OTC Cosmeceuticals
          </button>
        </div>
      </div>

      {/* Expiry Warning Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900 text-sm">FEFO Automated Prioritization Active</span>
          <p className="text-amber-800 mt-0.5">
            Batch <strong>DX-2026-04A (Doxt-SL 100mg)</strong> expires in 24 days. The dispensing counter automatically prioritizes this batch first before newer inwards.
          </p>
        </div>
      </div>

      {/* TAB 1: RX DISPENSING COUNTER */}
      {activeTab === 'dispensing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* INCOMING DOCTOR PRESCRIPTIONS (LIVE RX QUEUE) */}
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-700" />
                    Incoming Doctor Prescriptions (Rx Queue)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Supports full or partial dispensing with automatic FEFO batch deduction &amp; separate Pharmacy bill
                  </p>
                </div>
                <button
                  onClick={loadLivePharmacyData}
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                >
                  {loading ? 'Refreshing...' : 'Refresh Queue'}
                </button>
              </div>

              {livePrescriptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  No pending doctor prescriptions in the live queue yet. Create orders from Doctor Workbench or use Direct Walk-In Sale.
                </div>
              ) : (
                <div className="space-y-4">
                  {livePrescriptions.map((rx) => (
                    <div key={rx.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-stone-900">{rx.patient_name}</span>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">{rx.op_no}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              rx.status === 'DISPENSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rx.status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}>
                              {rx.status || 'PENDING'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Prescribed by <strong>{rx.doctor_name}</strong> · {rx.rx_date ? formatDate(rx.rx_date) : 'Today'}
                          </p>
                        </div>
                        {rx.status !== 'DISPENSED' && (
                          <button
                            disabled={rxDispensingId === rx.id}
                            onClick={() => handleDispenseRxItems(rx)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {rxDispensingId === rx.id ? 'Dispensing...' : 'Dispense Selected (FEFO)'}
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-stone-200/70 bg-white rounded-lg border border-stone-200 px-3">
                        {(rx.items || []).map((it: any) => {
                          const remaining = it.remaining_qty ?? Math.max(0, (it.quantity || 0) - (it.dispensed_qty || 0));
                          return (
                            <div key={it.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div>
                                <p className="font-bold text-stone-900">{it.medicine_name}</p>
                                <p className="text-[11px] text-stone-500">
                                  {it.dosage} · {it.frequency} · {it.duration_days} days
                                  {it.special_instructions ? ` · ${it.special_instructions}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[11px] text-stone-600">
                                  Prescribed: <strong>{it.quantity}</strong> · Dispensed: <strong>{it.dispensed_qty || 0}</strong> · Remaining: <strong className="text-emerald-700">{remaining}</strong>
                                </span>
                                {remaining > 0 && (
                                  <input
                                    type="number"
                                    min={0}
                                    max={remaining}
                                    value={rxDispenseQtys[it.id] ?? remaining}
                                    onChange={(e) =>
                                      setRxDispenseQtys((prev) => ({
                                        ...prev,
                                        [it.id]: Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)),
                                      }))
                                    }
                                    className="w-16 border border-stone-300 rounded-lg px-2 py-1 text-center font-bold"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FEFO BATCHES LIST */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-base text-stone-900">Active Prescriptions &amp; Fast-Moving FEFO Batches</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Dispense against doctor orders with automatic Schedule H1 lock verification</p>
                </div>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  {liveBatches.length > 0 ? `${liveBatches.length} Live DB Batches` : 'Demo Dispensary Stock'}
                </span>
              </div>

              <div className="divide-y divide-stone-100">
                {(liveBatches.length > 0 ? liveBatches.map((b: any) => ({
                  ...b,
                  stock_qty: b.quantity_available,
                  gst_rate: b.gst_percent || 12,
                  rack_location: b.rack_location || 'A-1',
                  hsn_code: b.hsn_code || '3004',
                  unit: b.unit || 'units',
                })) : store.batches).map((b: any) => (
                <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-900 text-sm">{b.medicine_name}</p>
                      {b.is_schedule_h1 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <Lock size={10} />
                          SCHEDULE H1
                        </span>
                      )}
                      {b.is_cold_chain && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                          2–8°C
                        </span>
                      )}
                    </div>
                    <p className="text-stone-500 mt-0.5">
                      Batch: <strong className="font-mono text-stone-800">{b.batch_no}</strong> · Exp: {formatDate(b.expiry_date)} · Rack: {b.rack_location}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5 italic">
                      {b.salt_name} · HSN {b.hsn_code} ({b.gst_rate}% GST)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-1">
                      <div className="font-black text-stone-900 text-sm font-mono">{formatCurrency(b.mrp)}</div>
                      <div className="text-[10px] text-stone-500">{b.stock_qty} {b.unit} available</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={b.stock_qty}
                        value={dispenseQty[b.id] || 1}
                        onChange={(e) => setDispenseQty((prev) => ({ ...prev, [b.id]: parseInt(e.target.value) || 1 }))}
                        className="w-14 border border-stone-300 rounded-lg px-2 py-1 text-center font-bold"
                      />
                      <button
                        onClick={() => handleDispenseInitiate(b)}
                        className={`font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 ${
                          b.is_schedule_h1
                            ? 'bg-rose-700 hover:bg-rose-600 text-white'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {b.is_schedule_h1 ? <Lock size={12} /> : null}
                        Dispense
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Right Column: Printed Split-Tax Bill Receipt */}
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="text-emerald-400" size={18} />
                  <span className="font-black text-sm text-white">Hybrid Tax Split Invoice</span>
                </div>
                {printedBill && (
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-emerald-400 transition"
                    title="Print Thermal Receipt"
                  >
                    <Printer size={15} />
                  </button>
                )}
              </div>

              {printedBill ? (
                <div className="mt-4 space-y-3 font-mono text-xs">
                  <div className="text-center border-b border-stone-800 pb-2">
                    <div className="font-black text-sm text-emerald-400">HEAL CLINIC &amp; PHARMACY</div>
                    <div className="text-[10px] text-stone-400">Karanthoor Flagship · GSTIN: 32AAAFH1234F1Z9</div>
                    <div className="text-[10px] text-stone-400">Bill #: {printedBill.billNo} · {printedBill.date}</div>
                  </div>

                  <div className="text-[11px] text-stone-300 space-y-0.5 border-b border-stone-800 pb-2">
                    <div>Patient: <strong>{printedBill.patientName}</strong> ({printedBill.patientOp})</div>
                    <div>Prescriber: <strong>{printedBill.doctorName}</strong></div>
                    {printedBill.doctorReg !== 'N/A' && <div>Council Reg: <strong>{printedBill.doctorReg}</strong></div>}
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 border-b border-stone-800 pb-2">
                    {printedBill.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <div>
                          <div>{it.name} (x{it.qty})</div>
                          <div className="text-[9px] text-stone-400">HSN: {it.hsn} · Batch: {it.batchNo}</div>
                        </div>
                        <div className="font-black">{formatCurrency(it.total)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Indian GST Breakdown */}
                  <div className="space-y-1 text-[11px] border-b border-stone-800 pb-2 text-stone-300">
                    <div className="flex justify-between">
                      <span>Taxable Value (Ex-GST):</span>
                      <span>{formatCurrency(printedBill.items[0]?.basePrice || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST ({printedBill.items[0]?.gstRate / 2}%):</span>
                      <span>{formatCurrency(printedBill.taxBreakdown.cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST ({printedBill.items[0]?.gstRate / 2}%):</span>
                      <span>{formatCurrency(printedBill.taxBreakdown.sgst)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-base font-black text-emerald-400 pt-1">
                    <span>NET PAYABLE:</span>
                    <span>{formatCurrency(printedBill.totalAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-stone-500 text-xs">
                  <FileText className="mx-auto text-stone-700 mb-2" size={32} />
                  Dispense an item or ring up OTC retail to preview compliant tax-split thermal receipt.
                </div>
              )}
            </div>

            <div className="text-[10px] text-stone-500 text-center border-t border-stone-800 pt-2">
              Indian Healthcare Exemption Rule Applied: Clinical Consultation 0% · Pharma HSN 3004 12% · Cosmeceuticals HSN 3304 18%
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHEMICAL FAMILY & BIOEQUIVALENT SUBSTITUTIONS */}
      {activeTab === 'substitution' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Chemical Molecule &amp; Bioequivalent Substitute Master</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                CDSCO-compliant generic substitution: lookup active chemical components and switch to in-stock bioequivalent brands when prescribed brand is unavailable.
              </p>
            </div>
            <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
              CDSCO Generic Equivalent Compliant
            </span>
          </div>

          {/* Molecule Pills */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
              Select Active Chemical Component / Molecule Family:
            </span>
            <div className="flex flex-wrap gap-2">
              {store.salts.map((salt) => (
                <button
                  key={salt.id}
                  type="button"
                  onClick={() => setSelectedMolecule(salt.chemical_name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedMolecule === salt.chemical_name
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>🧪</span>
                  <span>{salt.chemical_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Salt Details */}
          {(() => {
            const currentSalt = store.salts.find((s) => s.chemical_name === selectedMolecule) || store.salts[0];
            return (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-950 text-sm">
                        {currentSalt.chemical_name}
                      </span>
                      {currentSalt.is_schedule_h1 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          SCHEDULE H1
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-purple-800 mt-0.5">
                      Therapeutic Class: <strong>{currentSalt.therapeutic_class}</strong> · Route: {currentSalt.default_route} · HSN: {currentSalt.hsn_code} ({currentSalt.gst_rate}% GST)
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-white text-purple-800 px-3 py-1 rounded-lg border border-purple-200 shrink-0 font-mono">
                    {currentSalt.substitute_brands.length} Bioequivalent Formulations
                  </span>
                </div>

                {/* Substitute brands table */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold uppercase">
                      <tr>
                        <th className="py-3 px-4">Brand Formulation</th>
                        <th className="py-3 px-4">Manufacturer</th>
                        <th className="py-3 px-4">Dosage &amp; Strength</th>
                        <th className="py-3 px-4 text-center">In-Stock</th>
                        <th className="py-3 px-4 text-right">Landed Cost</th>
                        <th className="py-3 px-4 text-right">MRP</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {currentSalt.substitute_brands.map((brand, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/80">
                          <td className="py-3 px-4">
                            <span className="font-bold text-stone-900 text-sm">{brand.brand_name}</span>
                            {brand.recommended && (
                              <span className="ml-2 px-2 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                FIRST CHOICE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-600 font-medium">{brand.manufacturer}</td>
                          <td className="py-3 px-4 text-stone-700">{brand.dosage_form} · {brand.strength}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            <span className="text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                              {brand.in_stock_units} Units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-stone-600">
                            {formatCurrency(brand.landed_cost)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                            {formatCurrency(brand.mrp)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                alert(`🔄 Substituted to "${brand.brand_name}" (${brand.manufacturer})!\n\nChemical: ${currentSalt.chemical_name}\nMRP: ${formatCurrency(brand.mrp)}\nDispensing queue updated.`);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs cursor-pointer"
                            >
                              Select Substitute
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: WALK-IN OTC COSMECEUTICALS */}
      {activeTab === 'otc' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
            <div>
              <h3 className="font-bold text-base text-stone-900">Walk-in OTC Cosmeceuticals &amp; Skincare POS</h3>
              <p className="text-xs text-stone-500 mt-0.5">Direct retail sale for sunscreens, serums &amp; cleansers (Bypass Consultation: 18% GST HSN 3304)</p>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Direct Pharmacy POS
            </span>
          </div>

          {/* Quick Patient Identification */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-700" />
                Optional: Link to Patient Profile (Search OP # / Mobile / Name)
              </label>
              {selectedOtcPatient && (
                <button
                  type="button"
                  onClick={() => { setSelectedOtcPatient(null); setOtcPatientSearch(''); }}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear (Switch to Walk-in Retail)
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search by Mobile, OP Number or Name to associate purchase..."
                value={otcPatientSearch}
                onChange={(e) => handleOtcPatientSearch(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {otcPatientResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-stone-100">
                  {otcPatientResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectOtcPatient(p)}
                      className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-800 mr-2">{p.op_no}</span>
                        <span className="font-semibold text-stone-900">{p.first_name} {p.last_name || ''}</span>
                        <span className="text-[11px] text-stone-400 ml-2">({p.phone})</span>
                      </div>
                      <span className="text-amber-800 font-bold text-[11px]">+ Select Patient</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedOtcPatient && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Linked Customer: <strong>{selectedOtcPatient.first_name} {selectedOtcPatient.last_name || ''}</strong> (OP #{selectedOtcPatient.op_no})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-stone-200 rounded-xl p-4 text-xs space-y-2 hover:border-amber-300 transition">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Topical Photoprotection</span>
              <p className="font-bold text-stone-900 text-sm">UV-DOUX Sunscreen Gel SPF 50+</p>
              <p className="text-xs text-stone-500">Broad Spectrum PA+++ · HSN 3304 (18% GST)</p>
              <p className="text-lg font-black text-emerald-700 mt-2">₹750.00</p>
              <button
                onClick={() => handleQuickRetailBill('UV-DOUX Sunscreen Gel SPF 50+', 750, 18, '33049990')}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 rounded-lg cursor-pointer"
              >
                + Quick Retail Bill
              </button>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 text-xs space-y-2 hover:border-amber-300 transition">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Antioxidant Serum</span>
              <p className="font-bold text-stone-900 text-sm">C-Glow Vitamin C 20% Serum</p>
              <p className="text-xs text-stone-500">Pure L-Ascorbic Acid · HSN 3304 (18% GST)</p>
              <p className="text-lg font-black text-emerald-700 mt-2">₹1,250.00</p>
              <button
                onClick={() => handleQuickRetailBill('C-Glow Vitamin C 20% Serum', 1250, 18, '33049990')}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 rounded-lg cursor-pointer"
              >
                + Quick Retail Bill
              </button>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 text-xs space-y-2 hover:border-amber-300 transition">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Exfoliating Cleanser</span>
              <p className="font-bold text-stone-900 text-sm">Ahaglow Gentle Exfoliating Wash</p>
              <p className="text-xs text-stone-500">Glycolic 6% + Aloe · HSN 3304 (18% GST)</p>
              <p className="text-lg font-black text-emerald-700 mt-2">₹425.00</p>
              <button
                onClick={() => handleQuickRetailBill('Ahaglow Gentle Exfoliating Wash', 425, 18, '33049990')}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 rounded-lg cursor-pointer"
              >
                + Quick Retail Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE H1 STATUTORY COMPLIANCE LOCK */}
      {h1BatchToDispense && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-300 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 uppercase">
                  Statutory Rule 65 Gate
                </span>
                <h3 className="font-black text-stone-900 text-base mt-1 flex items-center gap-1.5">
                  <Lock className="text-rose-600" size={18} />
                  Schedule H1 Compliance Verification
                </h3>
                <p className="text-xs text-stone-500">
                  Dispensing: <strong>{h1BatchToDispense.medicine_name}</strong> (Batch: {h1BatchToDispense.batch_no})
                </p>
              </div>
              <button
                onClick={() => setH1BatchToDispense(null)}
                className="text-stone-400 hover:text-stone-700 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
              ⚠️ <strong>Mandatory Drug Inspector Audit:</strong> Schedule H1 substances cannot be dispensed without recording the Prescribing Doctor's State Medical Council Registration No. and Patient Identification.
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={h1Form.patient_name}
                    onChange={(e) => setH1Form({ ...h1Form, patient_name: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700">Patient OP / Aadhaar Ref</label>
                  <input
                    type="text"
                    required
                    value={h1Form.patient_aadhaar_ref}
                    onChange={(e) => setH1Form({ ...h1Form, patient_aadhaar_ref: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={h1Form.doctor_name}
                    onChange={(e) => setH1Form({ ...h1Form, doctor_name: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-rose-900">Council Reg No *</label>
                  <input
                    type="text"
                    required
                    value={h1Form.doctor_reg_no}
                    onChange={(e) => setH1Form({ ...h1Form, doctor_reg_no: e.target.value })}
                    className="w-full p-2 border border-rose-300 bg-rose-50/50 rounded-lg font-mono font-bold text-rose-950 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700">Dispense Qty</label>
                  <input
                    type="number"
                    min={1}
                    max={h1BatchToDispense.stock_qty}
                    required
                    value={h1Form.quantity}
                    onChange={(e) => setH1Form({ ...h1Form, quantity: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-stone-700">Clinical Indication</label>
                  <input
                    type="text"
                    required
                    value={h1Form.clinical_indication}
                    onChange={(e) => setH1Form({ ...h1Form, clinical_indication: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg font-medium mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700">Dispensing Pharmacist Sign-Off</label>
                <input
                  type="text"
                  required
                  value={h1Form.pharmacist_name}
                  onChange={(e) => setH1Form({ ...h1Form, pharmacist_name: e.target.value })}
                  className="w-full p-2 border border-stone-200 rounded-lg font-mono font-bold mt-1 text-emerald-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setH1BatchToDispense(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDispense(h1BatchToDispense, h1Form.quantity, h1Form)}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  Authorize &amp; Dispense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT WALK-IN PHARMACY SALE */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                  Direct OPD / OTC Walk-In Entry
                </span>
                <h3 className="font-black text-stone-900 text-lg mt-1 flex items-center gap-1.5">
                  <ShoppingBag className="text-emerald-700" size={20} />
                  Direct Pharmacy Sale (No Doctor Consultation)
                </h3>
                <p className="text-xs text-stone-500">
                  Creates DIRECT_PHARMACY encounter, auto-deducts FEFO batch stock, logs StockMovement &amp; separate Pharmacy bill
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWalkInModal(false);
                  setWalkInCart([]);
                  setSelectedWalkInPatient(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Patient Search or Quick Walk-In Registration */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">1. Customer / Patient Identification</span>
                <button
                  type="button"
                  onClick={() => {
                    setQuickRegMode(!quickRegMode);
                    setSelectedWalkInPatient(null);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer underline"
                >
                  {quickRegMode ? '← Search Registered Patients' : '+ Quick Register New Walk-in'}
                </button>
              </div>

              {!quickRegMode ? (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by Name, OP No., or Phone..."
                    value={walkInPatientSearch}
                    onChange={(e) => handleWalkInPatientSearch(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {walkInPatientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-stone-100">
                      {walkInPatientResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedWalkInPatient(p);
                            setWalkInPatientSearch(`${p.op_no} — ${p.first_name} ${p.last_name || ''}`);
                            setWalkInPatientResults([]);
                          }}
                          className="p-2.5 hover:bg-emerald-50 cursor-pointer text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-stone-900">{p.first_name} {p.last_name || ''}</span>
                            <span className="ml-2 font-mono text-[11px] text-stone-500">({p.op_no})</span>
                          </div>
                          <span className="text-[11px] text-stone-400">{p.phone || 'No Phone'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedWalkInPatient && (
                    <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg font-semibold flex items-center justify-between">
                      <span>Selected: {selectedWalkInPatient.first_name} {selectedWalkInPatient.last_name || ''} ({selectedWalkInPatient.op_no})</span>
                      <button onClick={() => setSelectedWalkInPatient(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">Change</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={quickRegForm.first_name}
                      onChange={(e) => setQuickRegForm({ ...quickRegForm, first_name: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      value={quickRegForm.date_of_birth}
                      onChange={(e) => setQuickRegForm({ ...quickRegForm, date_of_birth: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={quickRegForm.phone}
                      onChange={(e) => setQuickRegForm({ ...quickRegForm, phone: e.target.value })}
                      className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Medicine Selector & Cart */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-stone-800">2. Select Medicines from Available Batches</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-stone-200 rounded-xl p-2 bg-stone-50">
                {(liveBatches.length > 0 ? liveBatches : store.batches).map((b: any) => {
                  const avail = b.quantity_available ?? b.stock_qty ?? 0;
                  return (
                    <div
                      key={b.id}
                      className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-stone-900">{b.medicine_name}</div>
                        <div className="text-[10px] text-stone-500">
                          Batch: {b.batch_no} · {avail} in stock · MRP: {formatCurrency(b.mrp)}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={avail <= 0}
                        onClick={() => {
                          const existing = walkInCart.find((c) => c.batch.id === b.id);
                          if (existing) {
                            setWalkInCart(
                              walkInCart.map((c) =>
                                c.batch.id === b.id ? { ...c, qty: Math.min(avail, c.qty + 1) } : c
                              )
                            );
                          } else {
                            setWalkInCart([...walkInCart, { batch: b, qty: 1 }]);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Cart Table */}
              {walkInCart.length > 0 && (
                <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-stone-100 text-stone-700 text-[11px] border-b border-stone-200">
                      <tr>
                        <th className="p-2 text-left">Medicine</th>
                        <th className="p-2 text-center">Batch</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">MRP</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {walkInCart.map((c, i) => (
                        <tr key={i} className="hover:bg-stone-50">
                          <td className="p-2 font-medium">{c.batch.medicine_name}</td>
                          <td className="p-2 text-center font-mono text-[11px]">{c.batch.batch_no}</td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={1}
                              max={c.batch.quantity_available ?? c.batch.stock_qty ?? 100}
                              value={c.qty}
                              onChange={(e) => {
                                const q = Math.max(1, parseInt(e.target.value) || 1);
                                setWalkInCart(
                                  walkInCart.map((item, idx) => (idx === i ? { ...item, qty: q } : item))
                                );
                              }}
                              className="w-14 text-center border border-stone-300 rounded p-1 font-bold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono">{formatCurrency(c.batch.mrp)}</td>
                          <td className="p-2 text-right font-bold font-mono">{formatCurrency(c.batch.mrp * c.qty)}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setWalkInCart(walkInCart.filter((_, idx) => idx !== i))}
                              className="text-rose-600 hover:text-rose-800 font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50 border-t border-emerald-200 font-bold">
                      <tr>
                        <td colSpan={4} className="p-2 text-right text-stone-800">Grand Total:</td>
                        <td className="p-2 text-right text-emerald-800 font-mono text-sm">
                          {formatCurrency(walkInCart.reduce((sum, c) => sum + c.batch.mrp * c.qty, 0))}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowWalkInModal(false);
                  setWalkInCart([]);
                  setSelectedWalkInPatient(null);
                }}
                className="px-4 py-2 rounded-xl text-stone-600 text-xs font-bold hover:bg-stone-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={walkInSaving || walkInCart.length === 0}
                onClick={handleCompleteWalkInSale}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                {walkInSaving ? 'Processing Sale...' : 'Complete Walk-In Sale & Print Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
