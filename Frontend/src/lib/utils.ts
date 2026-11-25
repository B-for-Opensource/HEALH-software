import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount?: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatTime(timeStr?: string): string {
  if (!timeStr) return '-';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${min} ${ampm}`;
}

export function getStatusBadgeClass(status?: string): string {
  const map: Record<string, string> = {
    Waiting: 'bg-amber-100 text-amber-800 border-amber-200',
    'With-Nurse': 'bg-teal-100 text-teal-800 border-teal-200',
    'Nurse-Station': 'bg-teal-100 text-teal-800 border-teal-200',
    'Passed-to-Doctor': 'bg-sky-100 text-sky-800 border-sky-200',
    Called: 'bg-blue-100 text-blue-800 border-blue-200',
    'In-Consult': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Sent-to-Pharmacy': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Sent-to-Nursing': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'Sent-to-Lab': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    Procedure: 'bg-purple-100 text-purple-800 border-purple-200',
    'Billing-Pending': 'bg-orange-100 text-orange-800 border-orange-200',
    'Sent-Back-to-Reception': 'bg-orange-100 text-orange-800 border-orange-200',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
    'No-Show': 'bg-gray-100 text-gray-800 border-gray-200',

    Paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Partial: 'bg-amber-100 text-amber-800 border-amber-200',
    Unpaid: 'bg-rose-100 text-rose-800 border-rose-200',
    Refunded: 'bg-gray-100 text-gray-800 border-gray-200',

    Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Expired: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return map[status || ''] || 'bg-slate-100 text-slate-700 border-slate-200';
}
