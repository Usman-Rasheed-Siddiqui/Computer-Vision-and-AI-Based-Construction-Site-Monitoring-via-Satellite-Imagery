import React from 'react';
import StatusMark from './StatusMark';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  showIcon?: boolean;
  size?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
  size = 14,
}) => {
  const norm = (status || 'unknown').toLowerCase();

  let badgeColor = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let label = status || 'Unknown';
  let markStatus: 'pending' | 'running' | 'done' | 'failed' | 'cancelled' = 'pending';

  switch (norm) {
    case 'active':
    case 'in_progress':
    case 'running':
    case 'processing':
      badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      label = norm === 'in_progress' ? 'In Progress' : norm.charAt(0).toUpperCase() + norm.slice(1);
      markStatus = 'running';
      break;
    case 'completed':
    case 'done':
    case 'accepted':
    case 'success':
      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      label = norm === 'completed' ? 'Completed' : norm.charAt(0).toUpperCase() + norm.slice(1);
      markStatus = 'done';
      break;
    case 'pending':
    case 'queued':
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      label = 'Pending';
      markStatus = 'pending';
      break;
    case 'rejected':
    case 'failed':
    case 'error':
      badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      label = norm === 'rejected' ? 'Rejected' : norm.charAt(0).toUpperCase() + norm.slice(1);
      markStatus = 'failed';
      break;
    case 'cancelled':
      badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
      label = 'Cancelled';
      markStatus = 'cancelled';
      break;
    default:
      badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
      label = status || 'Standard';
      markStatus = 'done';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor} ${className}`}
    >
      {showIcon && <StatusMark status={markStatus} size={size} />}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
