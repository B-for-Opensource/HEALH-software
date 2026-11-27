import React, { useState } from 'react';
import { Phone, ShieldCheck, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { patientPortalApi, setPatientToken } from '@/api/client';

interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await patientPortalApi.requestOtp(phone.trim());
      setDevOtp(res.dev_otp || null);
      if (res.dev_otp) setOtp(res.dev_otp);
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Unable to send OTP. Check your registered phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await patientPortalApi.verifyOtp(phone.trim(), otp.trim());
      if (res?.token) {
        setPatientToken(res.token);
        onSuccess();
      } else {
        setError('Invalid login response');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50/40 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 text-xs font-bold border border-amber-200">
            <Sparkles size={13} />
            Patient Health Portal
          </div>
          <h1 className="text-3xl font-black tracking-wider text-rose-950 font-serif uppercase">
            HEALESTHETIC
          </h1>
          <p className="text-xs text-stone-500">
            View your visit timeline, prescriptions, released lab &amp; imaging reports, and billing receipts.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Registered Mobile Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.trim().length < 10}
              className="w-full py-3 rounded-xl bg-rose-950 hover:bg-rose-900 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Sending OTP...' : 'Send One-Time Password'}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {devOtp && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between">
                <span className="font-semibold">Local Dev OTP:</span>
                <span className="font-mono font-black text-base tracking-widest">{devOtp}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Enter 6-Digit OTP sent to {phone}
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(null); }}
                className="px-4 py-3 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.trim().length < 4}
                className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck size={16} />
                {loading ? 'Verifying...' : 'Verify & Access Records'}
              </button>
            </div>
          </form>
        )}

        <p className="text-[11px] text-center text-stone-400">
          Only verified &amp; released clinical reports are visible in your portal.
        </p>
      </div>
    </div>
  );
}
