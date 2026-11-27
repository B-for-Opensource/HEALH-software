import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  FileText,
  User,
  AlertCircle
} from 'lucide-react';
import { billingApi, patientsApi } from '@/api';
import type { Patient, BillItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BillingPOSPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Screenshot (11) Header Fields
  const [entryNo, setEntryNo] = useState('1');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState(() => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [department, setDepartment] = useState('Alopathy');
  const [billNo, setBillNo] = useState('1042');
  const [opNo, setOpNo] = useState('');
  const [ipNo, setIpNo] = useState('');
  const [doctorName, setDoctorName] = useState('SWATHIGHA SUDHEER .K');
  const [patientName, setPatientName] = useState('');
  const [address, setAddress] = useState('');
  const [sex, setSex] = useState('Female');
  const [ageY, setAgeY] = useState('');
  const [ageM, setAgeM] = useState('');
  const [ageD, setAgeD] = useState('');
  const [manualDiscount, setManualDiscount] = useState('0');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [receptionist, setReceptionist] = useState('Receptionist 1');

  // Patient Selection
  const [patientQuery, setPatientQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Line items
  const [items, setItems] = useState<BillItem[]>([
    {
      item_type: 'Consultation',
      item_name: 'Doctor Consultation Fee',
      quantity: 1,
      unit_price: 500,
      discount_amount: 0,
      cgst_percent: 0,
      sgst_percent: 0,
      line_total: 500,
    },
  ]);

  const [discountRemarks, setDiscountRemarks] = useState('');

  // Payment Breakdown
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState([
    { mode: 'Cash', amount: '' },
    { mode: 'UPI', amount: '' },
    { mode: 'Card', amount: '' },
  ]);
  const [upiRef, setUpiRef] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  // Saved result
  const [savedBill, setSavedBill] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // If query params passed from workbench or queue
  useEffect(() => {
    const pId = searchParams.get('patient_id');
    if (pId) {
      patientsApi.get(pId).then((res) => {
        const p = res?.data || res;
        selectPatient(p);
      });
    }
  }, [searchParams]);

  // Search Patient
  const handleSearchPatient = async (val: string) => {
    setPatientQuery(val);
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
    setSelectedPatient(p);
    setPatientName(`${p.first_name} ${p.last_name || ''}`.trim());
    setOpNo(p.op_no || '');
    setAddress(p.address || '');
    setSex(p.gender || 'Male');
    setAgeY(p.age_years ? String(p.age_years) : '');
    setPatientQuery('');
    setPatientSuggestions([]);
  };

  // Line item manipulation
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        item_type: 'Procedure',
        item_name: '',
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        cgst_percent: 9,
        sgst_percent: 9,
        line_total: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof BillItem, val: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: val };
        
        // Recalculate totals
        const qty = Number(updated.quantity) || 0;
        const unitPrice = Number(updated.unit_price) || 0;
        const discount = Number(updated.discount_amount) || 0;
        const sub = Math.max(0, qty * unitPrice - discount);
        const cgstPct = Number(updated.cgst_percent) || 0;
        const sgstPct = Number(updated.sgst_percent) || 0;
        const tax = sub * ((cgstPct + sgstPct) / 100);
        
        updated.taxable_amount = sub;
        updated.cgst_amount = sub * (cgstPct / 100);
        updated.sgst_amount = sub * (sgstPct / 100);
        updated.line_total = sub + tax;
        return updated;
      })
    );
  };

  // Totals
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) * Number(it.unit_price)), 0);
  const totalDiscount = items.reduce((acc, it) => acc + Number(it.discount_amount), 0);
  const totalTax = items.reduce((acc, it) => acc + (Number(it.cgst_amount || 0) + Number(it.sgst_amount || 0)), 0);
  const netAmount = Math.max(0, subtotal - totalDiscount + totalTax);

  // Split payment validation
  const totalEnteredPayment = paymentSplits.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const balanceRemaining = netAmount - totalEnteredPayment;

  // Save Bill
  const handleFinalizeBill = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }
    if (items.some((i) => !i.item_name.trim() || i.unit_price <= 0)) {
      alert('Please fill in valid descriptions and prices for all items');
      return;
    }

    setLoading(true);
    try {
      const activePayments = paymentSplits
        .filter((p) => parseFloat(p.amount) > 0)
        .map((p) => ({
          payment_mode: p.mode,
          amount: parseFloat(p.amount),
          upi_ref: p.mode === 'UPI' ? upiRef : null,
          card_last4: p.mode === 'Card' ? cardLast4 : null,
        }));

      const payload = {
        patient_id: selectedPatient.id,
        appointment_id: searchParams.get('appointment_id') || null,
        subtotal,
        discount_amount: totalDiscount,
        discount_remarks: discountRemarks,
        taxable_amount: subtotal - totalDiscount,
        cgst_amount: items.reduce((acc, it) => acc + Number(it.cgst_amount || 0), 0),
        sgst_amount: items.reduce((acc, it) => acc + Number(it.sgst_amount || 0), 0),
        net_amount: netAmount,
        amount_paid: totalEnteredPayment,
        balance_due: Math.max(0, balanceRemaining),
        items,
        payments: activePayments,
      };

      const res = await billingApi.create(payload);
      const bill = res?.data || res;
      setSavedBill(bill);
      setShowPaymentModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const startNewBill = () => {
    setSavedBill(null);
    setSelectedPatient(null);
    setDiscountRemarks('');
    setItems([
      {
        item_type: 'Consultation',
        item_name: 'Doctor Consultation Fee',
        quantity: 1,
        unit_price: 500,
        discount_amount: 0,
        cgst_percent: 0,
        sgst_percent: 0,
        line_total: 500,
      },
    ]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & POS Counter</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cashier checkout — Consultations, Procedures, Medicines, Aesthetic Packages & Retail
          </p>
        </div>
        {savedBill && (
          <button
            onClick={startNewBill}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-xs"
          >
            + Create Next Bill
          </button>
        )}
      </div>

      {savedBill ? (
        /* PRINTABLE INVOICE RECEIPT */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm space-y-6 print:m-0 print:border-none print:shadow-none">
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">HEAL CLINIC</h2>
            <p className="text-xs text-slate-500 font-medium">Aesthetic, Dermatology & Outpatient Care</p>
            <p className="text-[11px] text-slate-400 mt-0.5">GSTIN: 32AABCH1234F1Z5 · Contact: 0495-2720000</p>
          </div>

          <div className="flex justify-between text-xs text-slate-600">
            <div>
              <p><strong>Bill No:</strong> {savedBill.bill_no || 'HEAL-B-001'}</p>
              <p><strong>Date:</strong> {formatDate(savedBill.bill_date || savedBill.created_at)}</p>
              <p><strong>Patient:</strong> {selectedPatient?.first_name} {selectedPatient?.last_name || ''}</p>
              <p><strong>OP Number:</strong> {selectedPatient?.op_no}</p>
            </div>
            <div className="text-right">
              <p><strong>Status:</strong> <span className="text-emerald-700 font-bold uppercase">{savedBill.payment_status || 'Paid'}</span></p>
              <p><strong>Cashier:</strong> Front Desk</p>
              <p><strong>Phone:</strong> {selectedPatient?.phone}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-y border-slate-200">
            <thead className="bg-slate-50 text-slate-600 uppercase">
              <tr>
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="py-2 font-medium text-slate-800">{it.item_name}</td>
                  <td className="py-2 text-center">{it.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(it.unit_price)}</td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end text-xs space-y-1">
            <div className="w-56 space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>GST (CGST+SGST):</span>
                  <span>{formatCurrency(totalTax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Net Total:</span>
                <span className="text-violet-700">{formatCurrency(netAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Amount Paid:</span>
                <span>{formatCurrency(totalEnteredPayment || netAmount)}</span>
              </div>
              {balanceRemaining > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(balanceRemaining)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 print:hidden pt-4 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Receipt (A4 / Thermal)
            </button>
            <button
              onClick={() => navigate('/reception/queue')}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium"
            >
              Back to Queue
            </button>
          </div>
        </div>
      ) : (
        /* SCREENSHOT (11) DESKTOP HMS BILLING WINDOW */
        <div className="bg-white border-2 border-slate-300 rounded-xl shadow-lg overflow-hidden font-sans">
          {/* WINDOW HEADER */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm tracking-wide">Billing</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono">
                {savedBill ? 'SAVED' : 'ENTRY'}
              </span>
              <button onClick={() => navigate(-1)} className="hover:bg-slate-700 px-2 py-0.5 rounded text-slate-300 hover:text-white">✕</button>
            </div>
          </div>

          <div className="p-4 space-y-4 bg-slate-50/50">
            {/* TOP HEADER CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
              {/* Row 1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">No.</label>
                <input
                  type="text"
                  value={entryNo}
                  onChange={(e) => setEntryNo(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Time</label>
                <input
                  type="text"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-semibold"
                >
                  <option value="Alopathy">Alopathy</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Cosmetology">Cosmetology</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Trichology">Trichology</option>
                  <option value="(None)">(None)</option>
                </select>
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Bill No.</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setBillNo(`BILL-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs font-bold text-slate-700"
                    title="Generate / Browse Bill No"
                  >
                    🔍
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">OPNo.</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="OP No..."
                    value={opNo}
                    onChange={(e) => {
                      setOpNo(e.target.value);
                      handleSearchPatient(e.target.value);
                    }}
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/appointments')}
                    className="px-2 py-1 bg-violet-100 hover:bg-violet-200 text-violet-800 rounded text-[11px] font-bold"
                  >
                    Booking
                  </button>
                </div>
                {patientSuggestions.length > 0 && (
                  <div className="absolute z-30 mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-40 overflow-y-auto w-64 text-xs">
                    {patientSuggestions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        className="p-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100"
                      >
                        <p className="font-bold text-slate-900">{p.first_name} {p.last_name || ''}</p>
                        <p className="text-[10px] text-slate-500 font-mono">OP: {p.op_no} · {p.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IPNo.</label>
                <input
                  type="text"
                  placeholder="(None)"
                  value={ipNo}
                  onChange={(e) => setIpNo(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Doctor</label>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-semibold text-slate-800"
                >
                  <option value="ARUN PRAKASH">ARUN PRAKASH</option>
                  <option value="SWATHIGHA SUDHEER .K">SWATHIGHA SUDHEER .K</option>
                  <option value="Dr. Ananya Nair">Dr. Ananya Nair</option>
                  <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar</option>
                </select>
              </div>

              {/* Row 3 */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Patient</label>
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    handleSearchPatient(e.target.value);
                  }}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white font-semibold"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Age(YMD)</label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    placeholder="Y"
                    value={ageY}
                    onChange={(e) => setAgeY(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-1 text-xs text-center font-bold"
                  />
                  <input
                    type="number"
                    placeholder="M"
                    value={ageM}
                    onChange={(e) => setAgeM(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-1 text-xs text-center"
                  />
                  <input
                    type="number"
                    placeholder="D"
                    value={ageD}
                    onChange={(e) => setAgeD(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-1 text-xs text-center"
                  />
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Patient residential address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                />
              </div>
            </div>

            {/* SCREENSHOT 11 TABLE: SNo | Item | Rate */}
            <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Billing Items & Procedures
                </span>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">SNo</th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 w-28 text-right">Rate</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-24 text-right">Disc</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center font-bold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Enter consultation, medicine or procedure name..."
                            value={item.item_name}
                            onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-slate-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={item.unit_price}
                            onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right font-bold"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className="w-16 border border-slate-300 rounded px-1.5 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.discount_amount}
                            onChange={(e) => updateItem(idx, 'discount_amount', e.target.value)}
                            className="w-20 border border-slate-300 rounded px-1.5 py-1 text-xs text-right text-rose-600 font-semibold"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-black text-slate-900">
                          {formatCurrency(item.line_total)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SCREENSHOT 11 FINANCIALS & TOTALS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter billing notes, discount approvals or remarks..."
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setDiscountRemarks(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Discount:</span>
                  <input
                    type="number"
                    min="0"
                    value={manualDiscount}
                    onChange={(e) => setManualDiscount(e.target.value)}
                    className="w-32 border border-slate-300 rounded px-2 py-1 text-right font-bold text-rose-600"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <span className="font-bold text-slate-900 text-sm">Net Amount:</span>
                  <span className="text-base font-black text-violet-800">
                    {formatCurrency(netAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <span className="font-bold text-slate-700">Cash:</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={cashAmount}
                    onChange={(e) => {
                      setCashAmount(e.target.value);
                      setPaymentSplits((prev) =>
                        prev.map((p) => (p.mode === 'Cash' ? { ...p, amount: e.target.value } : p))
                      );
                    }}
                    className="w-32 border border-slate-300 rounded px-2 py-1 text-right font-bold font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Card:</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={cardAmount}
                    onChange={(e) => {
                      setCardAmount(e.target.value);
                      setPaymentSplits((prev) =>
                        prev.map((p) => (p.mode === 'Card' ? { ...p, amount: e.target.value } : p))
                      );
                    }}
                    className="w-32 border border-slate-300 rounded px-2 py-1 text-right font-bold font-mono"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-300 pt-1.5 font-bold">
                  <span className="text-slate-800">Balance:</span>
                  <span className={balanceRemaining > 0 ? 'text-amber-700 font-black' : 'text-emerald-700 font-black'}>
                    {formatCurrency(balanceRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* SCREENSHOT 11 BOTTOM ACTION TOOLBAR */}
            <div className="bg-slate-200 p-3 rounded-lg border border-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-400 rounded text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700">Receptionist:</span>
                  <select
                    value={receptionist}
                    onChange={(e) => setReceptionist(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                  >
                    <option value="(All)">(All)</option>
                    <option value="Receptionist 1">Receptionist 1</option>
                    <option value="SUPER ADMIN">SUPER ADMIN</option>
                    <option value="Emma Watson">Emma Watson</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFinalizeBill}
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs transition"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={startNewBill}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-400 rounded text-xs font-bold text-slate-800 shadow-xs"
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/reception/queue')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-400 rounded text-xs font-bold text-slate-800 shadow-xs"
                >
                  Exit
                </button>
                <button
                  type="button"
                  onClick={() => alert("Billing Settings:\nTax Profile: GST Standard\nThermal Print: Enabled\nA5 Invoice: Enabled")}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-400 rounded text-xs font-bold text-slate-800 shadow-xs"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
