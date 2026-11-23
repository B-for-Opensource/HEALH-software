import React, { useState, useEffect } from 'react';
import {
  CircleDollarSign,
  Plus,
  FileCheck2,
  Sparkles,
  Stethoscope,
  Download,
  Calendar,
  ChevronRight,
  X,
  CreditCard,
  ShieldCheck,
  Building2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import axios from 'axios';

export default function PayrollView({ branches }) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedSlipItem, setSelectedSlipItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Indian Statutory Compliance Configuration State
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceConfig, setComplianceConfig] = useState({
    epf_enabled: true,
    epf_rate: 12, // 12% employee + 12% employer
    esic_enabled: true,
    esic_rate: 0.75, // 0.75% employee + 3.25% employer
    pt_enabled: true,
    pt_state: 'Kerala', // Kerala, Karnataka, Maharashtra, Tamil Nadu
    tds_enabled: true,
    tax_regime: 'New Regime (Section 115BAC)',
    gratuity_enabled: true
  });

  // Bank Payout Batch Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportBankFormat, setExportBankFormat] = useState('HDFC Bank CMS');

  useEffect(() => {
    fetchPayrollRuns();
  }, []);

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/payroll/runs');
      setRuns(res.data);
      if (res.data.length > 0) {
        fetchRunDetail(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRunDetail = async (runId) => {
    try {
      const res = await axios.get(`/api/payroll/runs/${runId}`);
      setSelectedRun(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateRun = async () => {
    try {
      setGenerating(true);
      const res = await axios.post('/api/payroll/generate', {
        period_label: `November ${new Date().getFullYear()}`
      });
      fetchPayrollRuns();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportBankBatch = () => {
    if (!selectedRun || !selectedRun.items) return;
    const headers = ['BeneficiaryName', 'AccountNo', 'IFSC', 'Amount', 'Currency', 'PaymentType', 'Remarks'];
    const rows = selectedRun.items.map(item => [
      `"${item.employee_name}"`,
      `"9100${10000000 + item.id}"`,
      '"HDFC0001234"',
      item.net_payout,
      '"INR"',
      '"NEFT"',
      `"Salary Payout ${selectedRun.period_label}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Salary_Payout_${selectedRun.period_label.replace(/\s+/g, '_')}_${exportBankFormat.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-blue-600" />
            <span>Payroll, Statutory Compliance & Bank Payout</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated Indian statutory payroll (EPF, ESIC, PT, TDS) with commissions, OPD shares & 1-click bank batch transfers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComplianceModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Statutory Rules</span>
          </button>
          {selectedRun && (
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold shadow-2xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Export Bank Payout</span>
            </button>
          )}
          <button
            onClick={handleGenerateRun}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{generating ? 'Calculating Pay Run...' : 'Run Monthly Payroll'}</span>
          </button>
        </div>
      </div>

      {/* Pay Runs Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {runs.map((run) => (
          <div
            key={run.id}
            onClick={() => fetchRunDetail(run.id)}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${selectedRun?.id === run.id
              ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
              : 'border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{run.period_label}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {run.status}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] text-slate-400">Total Net Payout</span>
              <div className="text-lg font-bold font-mono text-slate-900">
                ${run.total_net?.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{run.items_count} Staff Processed</span>
              <span className="font-mono text-slate-400">{run.processed_date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Itemized Payroll Breakdown for Selected Run */}
      {selectedRun && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Payroll Register: {selectedRun.period_label}
              </h2>
              <p className="text-xs text-slate-500">
                Gross: <strong>${selectedRun.total_gross?.toLocaleString()}</strong> • Net Total: <strong>${selectedRun.total_net?.toLocaleString()}</strong>
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              Disbursed & Reconciled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role & Branch</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Aesthetic Comm.</th>
                  <th className="py-3 px-4">OPD Consult Share</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedRun.items && selectedRun.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.emp_code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{item.role}</div>
                      <div className="text-[10px] text-slate-500">{item.branch_name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      ${item.base_salary?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.aesthetic_commission > 0 ? (
                        <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          +${item.aesthetic_commission?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.consultation_fees > 0 ? (
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          +${item.consultation_fees?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600">
                      -${item.deductions?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                      ${item.net_payout?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedSlipItem(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Payslip Modal (Zoho People signature salary slip preview) */}
      {selectedSlipItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  HEAL Clinic Healthcare Network
                </span>
                <h3 className="text-base font-bold text-slate-900">Official Payslip</h3>
              </div>
              <button onClick={() => setSelectedSlipItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee Name:</span>
                  <span className="font-bold text-slate-900">{selectedSlipItem.employee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-mono text-slate-700">{selectedSlipItem.emp_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Designation & Branch:</span>
                  <span className="text-slate-700">{selectedSlipItem.role} • {selectedSlipItem.branch_name}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-100/60 px-3 py-1.5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Earnings
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-mono font-medium">${selectedSlipItem.base_salary?.toLocaleString()}</span>
                </div>
                {selectedSlipItem.aesthetic_commission > 0 && (
                  <div className="px-3 py-1.5 flex justify-between text-purple-700 font-medium">
                    <span>Aesthetic Procedure Commission</span>
                    <span className="font-mono">+${selectedSlipItem.aesthetic_commission?.toLocaleString()}</span>
                  </div>
                )}
                {selectedSlipItem.consultation_fees > 0 && (
                  <div className="px-3 py-1.5 flex justify-between text-blue-700 font-medium">
                    <span>OPD Consultation Revenue Share</span>
                    <span className="font-mono">+${selectedSlipItem.consultation_fees?.toLocaleString()}</span>
                  </div>
                )}
                {selectedSlipItem.overtime_allowance > 0 && (
                  <div className="px-3 py-1.5 flex justify-between text-slate-700 font-medium">
                    <span>Clinical Overtime Allowance</span>
                    <span className="font-mono">+${selectedSlipItem.overtime_allowance?.toLocaleString()}</span>
                  </div>
                )}

                <div className="bg-slate-100/60 px-3 py-1.5 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Statutory Deductions & Withholding
                </div>
                {complianceConfig.epf_enabled && (
                  <div className="px-3 py-1 flex justify-between text-slate-600">
                    <span>Employee Provident Fund (EPF 12%)</span>
                    <span className="font-mono text-rose-600">-${Math.round(selectedSlipItem.base_salary * 0.12)?.toLocaleString()}</span>
                  </div>
                )}
                {complianceConfig.esic_enabled && (
                  <div className="px-3 py-1 flex justify-between text-slate-600">
                    <span>ESIC (0.75%)</span>
                    <span className="font-mono text-rose-600">-${Math.round(selectedSlipItem.base_salary * 0.0075)?.toLocaleString()}</span>
                  </div>
                )}
                {complianceConfig.pt_enabled && (
                  <div className="px-3 py-1 flex justify-between text-slate-600">
                    <span>Professional Tax (PT - {complianceConfig.pt_state})</span>
                    <span className="font-mono text-rose-600">-$200</span>
                  </div>
                )}
                {complianceConfig.tds_enabled && (
                  <div className="px-3 py-1 flex justify-between text-slate-600">
                    <span>Income Tax Withholding (TDS - {complianceConfig.tax_regime.split(' ')[0]})</span>
                    <span className="font-mono text-rose-600">-${Math.max(0, Math.round(selectedSlipItem.deductions - (selectedSlipItem.base_salary * 0.12) - 200))?.toLocaleString()}</span>
                  </div>
                )}
                <div className="px-3 py-1.5 flex justify-between text-rose-600 font-bold bg-rose-50/50">
                  <span>Total Deductions</span>
                  <span className="font-mono">-${selectedSlipItem.deductions?.toLocaleString()}</span>
                </div>

                <div className="bg-emerald-50 px-3 py-2.5 flex justify-between items-center font-bold text-emerald-900 text-sm">
                  <span>Net Take-Home Pay</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700">
                    ${selectedSlipItem.net_payout?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Generated automatically by HEAL HRMS</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSlipItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => alert(`Payslip downloaded for ${selectedSlipItem.employee_name}`)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indian Statutory Compliance Configuration Modal */}
      {showComplianceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Indian Statutory Compliance Rules</h3>
              </div>
              <button onClick={() => setShowComplianceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Configure statutory salary components. Organizations can activate or bypass components based on legal applicability.
            </p>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* EPF Rule */}
              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Employees' Provident Fund (EPF)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">12% + 12%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Applicable under EPF & MP Act 1952 for establishments with 20+ staff</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={complianceConfig.epf_enabled}
                    onChange={(e) => setComplianceConfig({ ...complianceConfig, epf_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* ESIC Rule */}
              <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Employees' State Insurance (ESIC)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">0.75% / 3.25%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gross wage ceiling ₹21,000/month for medical cover</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={complianceConfig.esic_enabled}
                    onChange={(e) => setComplianceConfig({ ...complianceConfig, esic_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Professional Tax Rule */}
              <div className="p-3 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Professional Tax (PT)</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">State municipal deduction slab based on registered branch state</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={complianceConfig.pt_enabled}
                      onChange={(e) => setComplianceConfig({ ...complianceConfig, pt_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {complianceConfig.pt_enabled && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Applicable State Slab:</span>
                    <select
                      value={complianceConfig.pt_state}
                      onChange={(e) => setComplianceConfig({ ...complianceConfig, pt_state: e.target.value })}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="Kerala">Kerala (₹1,250 half-yearly)</option>
                      <option value="Karnataka">Karnataka (₹200 / month)</option>
                      <option value="Maharashtra">Maharashtra (₹200 / ₹300 month)</option>
                      <option value="Tamil Nadu">Tamil Nadu (Semi-annual slab)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* TDS Withholding Rule */}
              <div className="p-3 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Income Tax TDS Withholding</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Monthly projected tax deduction as per IT Act 1961</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={complianceConfig.tds_enabled}
                      onChange={(e) => setComplianceConfig({ ...complianceConfig, tds_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {complianceConfig.tds_enabled && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Default Regime:</span>
                    <select
                      value={complianceConfig.tax_regime}
                      onChange={(e) => setComplianceConfig({ ...complianceConfig, tax_regime: e.target.value })}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="New Regime (Section 115BAC)">New Tax Regime (Section 115BAC - Default)</option>
                      <option value="Old Regime (With 80C/80D Exemptions)">Old Tax Regime (With 80C / 80D Deductions)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowComplianceModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
              >
                Save Compliance Policies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Payout Batch Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Export Bank Payout File</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-blue-950">
                  <span>Pay Run:</span>
                  <span>{selectedRun?.period_label}</span>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>Total Beneficiaries:</span>
                  <span className="font-mono font-bold">{selectedRun?.items?.length} Employees</span>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>Total Disbursal Amount:</span>
                  <span className="font-mono font-bold text-sm text-emerald-700">${selectedRun?.total_net?.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Bank Transfer Template</label>
                <select
                  value={exportBankFormat}
                  onChange={(e) => setExportBankFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="HDFC Bank CMS">HDFC Bank Corporate CMS (NEFT / RTGS / FT)</option>
                  <option value="ICICI Bank Corporate Bulk Pay">ICICI Bank Corporate Bulk Payment</option>
                  <option value="SBI Corporate e-Pay">SBI Corporate e-Pay Master Format</option>
                  <option value="UPI Batch QR-VPA">Corporate UPI Batch VPA Transfer</option>
                  <option value="Standard Generic CSV">Generic Master Salary Register CSV</option>
                </select>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Output Columns Generated:</div>
                <div>BeneficiaryName, AccountNo, IFSC, Amount, Currency, PaymentType, Remarks</div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExportBankBatch}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {exportBankFormat.split(' ')[0]} Payout File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

