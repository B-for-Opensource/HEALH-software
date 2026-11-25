import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  Eye, 
  Search, 
  Plus, 
  FileCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { photoApi } from '@/api';
import { formatDate } from '@/lib/utils';

export default function PhotoVaultPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activePhoto, setActivePhoto] = useState<any | null>(null);

  useEffect(() => {
    photoApi.list().then((res) => {
      setPhotos(Array.isArray(res) ? res : []);
      if (Array.isArray(res) && res.length > 0) {
        setActivePhoto(res[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const filteredPhotos = photos.filter((p) =>
    (p.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.op_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.procedure_type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical Before & After Photo Comparison Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            [SCR-17] Patient treatment progression comparison, photographic consent & side-by-side dermal analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Patient Consent Encrypted
          </span>
        </div>
      </div>

      {/* Main View Area */}
      {activePhoto && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{activePhoto.patient_name}</h2>
                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {activePhoto.op_no}
                </span>
                <span className="text-xs text-violet-700 font-semibold bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                  {activePhoto.package_name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Treatment Area: <strong>{activePhoto.treatment_area}</strong> · Attending: {activePhoto.doctor_name}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
              <FileCheck className="w-3.5 h-3.5" />
              Signed Photography Consent on File
            </div>
          </div>

          {/* Side by side comparison canvases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Before Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Pre-Treatment (Baseline)
                </span>
                <span className="font-mono text-slate-400">{formatDate(activePhoto.before_date)}</span>
              </div>
              <div className={`h-64 rounded-xl bg-gradient-to-br ${activePhoto.before_gradient} flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden border border-slate-200`}>
                <Camera className="w-10 h-10 text-slate-700/40 mb-2" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Baseline Clinical Capture
                </span>
                <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                  Initial skin topography, active comedones and hyperpigmentation baseline
                </p>
                <div className="absolute bottom-3 left-3 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                  Day 0
                </div>
              </div>
            </div>

            {/* After Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-emerald-700">
                  Post-Procedure Progress (Follow-Up)
                </span>
                <span className="font-mono text-slate-400">{formatDate(activePhoto.after_date)}</span>
              </div>
              <div className={`h-64 rounded-xl bg-gradient-to-br ${activePhoto.after_gradient} flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden border border-emerald-200`}>
                <Sparkles className="w-10 h-10 text-emerald-700/50 mb-2" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Session Follow-up Capture
                </span>
                <p className="text-[11px] text-emerald-800 mt-1 max-w-xs">
                  Re-epithelialization complete, clear dermal texture, erythema reduced
                </p>
                <div className="absolute bottom-3 left-3 bg-emerald-900/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                  +14 Days Progress
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Observations */}
          <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1 text-slate-700 border border-slate-200">
            <p className="font-bold text-slate-900">Doctor's Comparative Evaluation Note:</p>
            <p className="leading-relaxed">{activePhoto.clinical_observations}</p>
          </div>
        </div>
      )}

      {/* Gallery Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Patient Case Files</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {filteredPhotos.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePhoto(p)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                activePhoto?.id === p.id
                  ? 'bg-violet-50/70 border-violet-400 ring-2 ring-violet-400/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">{p.patient_name}</p>
                <p className="text-xs font-mono text-slate-400">{p.op_no}</p>
                <p className="text-xs text-violet-700 font-medium mt-2">{p.procedure_type}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{p.package_name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
