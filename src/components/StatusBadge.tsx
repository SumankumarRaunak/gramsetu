import React from 'react';
import { ComplaintStatus } from '../types';
import { useApp } from '../context/AppContext';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

const DOT: Record<ComplaintStatus, string> = {
  pending: 'bg-slate-400',
  in_progress: 'bg-emerald-500',
  forwarded: 'bg-amber-500',
  resolved: 'bg-emerald-700',
  rejected: 'bg-rose-600',
};

const DOT_LABEL: Record<ComplaintStatus, string> = {
  pending: 'status_pending',
  in_progress: 'status_in_progress',
  forwarded: 'status_forwarded',
  resolved: 'status_resolved',
  rejected: 'status_rejected',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useApp();
  const label = t[DOT_LABEL[status] as keyof typeof t] as string;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[status]} ${status === 'in_progress' || status === 'pending' ? 'animate-pulse' : ''}`} />
      <span className={`font-medium ${size === 'sm' ? 'text-[10px]' : 'text-[11px]'} uppercase tracking-wide`}>{label}</span>
    </span>
  );
};