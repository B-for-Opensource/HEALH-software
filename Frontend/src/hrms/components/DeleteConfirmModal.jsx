import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ 
  isOpen, 
  title = "Delete Item", 
  itemName = "", 
  itemType = "Record", 
  onConfirm, 
  onCancel,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete this {itemType.toLowerCase()}?
            </p>
            {itemName && (
              <div className="mt-2.5 p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs font-semibold text-rose-900">
                "{itemName}"
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              This action will remove the record and all associated logs from the clinic database. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Deleting...' : 'Yes, Delete Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

