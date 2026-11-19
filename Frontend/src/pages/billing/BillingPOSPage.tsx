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
        setSelectedPatient(p);
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
        /* BILL COMPOSER */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Line items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Search Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Patient For Bill
              </label>
              {selectedPatient ? (
                <div className="flex items-center justify-between bg-violet-50/80 border border-violet-200 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-200 text-violet-800 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {selectedPatient.first_name} {selectedPatient.last_name || ''}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        OP: {selectedPatient.op_no} · Phone: {selectedPatient.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs text-violet-700 hover:underline font-semibold"
                  >
                    Change Patient
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search patient by Name, Phone number or OP number..."
                    value={patientQuery}
                    onChange={(e) => handleSearchPatient(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  {patientSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {patientSuggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPatient(p)}
                          className="w-full text-left p-3 hover:bg-violet-50 text-xs flex items-center justify-between transition"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">
                              {p.first_name} {p.last_name || ''}
                            </span>
                            <span className="text-slate-400 ml-2 font-mono">({p.op_no})</span>
                          </div>
                          <span className="text-slate-600">{p.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Line items table */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bill Line Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Line Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-2">Type</th>
                      <th className="py-2.5 px-2">Description</th>
                      <th className="py-2.5 px-2 w-16">Qty</th>
                      <th className="py-2.5 px-2 w-24">Price (₹)</th>
                      <th className="py-2.5 px-2 w-20">Disc (₹)</th>
                      <th className="py-2.5 px-2 w-16">GST %</th>
                      <th className="py-2.5 px-2 text-right w-24">Total (₹)</th>
                      <th className="py-2.5 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2">
                          <select
                            value={item.item_type}
                            onChange={(e) => updateItem(idx, 'item_type', e.target.value)}
                            className="border border-slate-300 rounded px-1.5 py-1 text-xs bg-white"
                          >
                            <option value="Consultation">Consultation</option>
                            <option value="Procedure">Procedure</option>
                            <option value="Medicine">Medicine</option>
                            <option value="Package">Package</option>
                            <option value="Retail">Retail</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="Service name..."
                            value={item.item_name}
                            onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-center"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={item.unit_price}
                            onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right font-semibold"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            value={item.discount_amount}
                            onChange={(e) => updateItem(idx, 'discount_amount', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right text-rose-600"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={item.cgst_percent + item.sgst_percent}
                            onChange={(e) => {
                              const totalTaxPct = Number(e.target.value);
                              updateItem(idx, 'cgst_percent', totalTaxPct / 2);
                              updateItem(idx, 'sgst_percent', totalTaxPct / 2);
                            }}
                            className="w-full border border-slate-300 rounded px-1 py-1 text-xs bg-white text-center"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-slate-800">
                          {formatCurrency(item.line_total)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-rose-400 hover:text-rose-600 p-1"
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Discount Remarks / Authorisation Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inaugural 10% discount approved by Clinic Director"
                  value={discountRemarks}
                  onChange={(e) => setDiscountRemarks(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: POS Summary & Checkout */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Order Total Summary
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Taxes:</span>
                  <span className="font-semibold">{formatCurrency(totalTax)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-3">
                  <span>Net Payable:</span>
                  <span className="text-violet-700 text-xl">{formatCurrency(netAmount)}</span>
                </div>
              </div>

              {/* Payment Split Inputs */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payment Collection Modes
                </span>

                {paymentSplits.map((p, idx) => (
                  <div key={p.mode} className="flex items-center gap-2">
                    <span className="w-14 text-xs font-semibold text-slate-600">{p.mode}</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={p.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPaymentSplits((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                        );
                      }}
                      className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-right font-mono font-semibold focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                ))}

                {/* Additional UPI / Card details */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="UPI Ref (e.g. 1234)"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Card Last 4"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-[11px]"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Collected:</span>
                    <span className="font-bold">{formatCurrency(totalEnteredPayment)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Balance Due:</span>
                    <span className={balanceRemaining > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      {formatCurrency(Math.max(0, balanceRemaining))}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalizeBill}
                disabled={loading || !selectedPatient}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? 'Processing Bill...' : 'Confirm Payment & Generate Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
