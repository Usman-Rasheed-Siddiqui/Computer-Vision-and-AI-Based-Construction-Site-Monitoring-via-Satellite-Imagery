import React from 'react';
import './StatusMark.css';

export interface StatusMarkProps {
  status?: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  progress?: number;
  label?: React.ReactNode;
  color?: string;
  doneColor?: string;
  errorColor?: string;
  size?: number;
  strokeWidth?: number;
  dashes?: number;
  fontSize?: number;
  spinDuration?: number;
  arcLength?: number;
  drawDuration?: number;
  fillOpacity?: number;
  strike?: boolean;
  strikeDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

const CHECK = 'M7.5 12.25 10.5 15.25 16.75 8.75';
const CROSS = 'M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5';
const TEXT: Record<string, string> = {
  pending: 'Pending',
  running: 'In progress',
  done: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const StatusMark: React.FC<StatusMarkProps> = ({
  status = 'pending',
  progress,
  label,
  color = 'currentColor',
  doneColor = '#10b981',
  errorColor = '#ef4444',
  size = 18,
  strokeWidth = 2,
  dashes = 8,
  fontSize = 13,
  spinDuration = 1100,
  arcLength = 0.68,
  drawDuration = 240,
  fillOpacity = 0.08,
  strike = false,
  strikeDelay = 60,
  className = '',
  style,
}) => {
  const r = 10 - strokeWidth / 2;
  const C = 2 * Math.PI * r;
  const determinate = status === 'running' && Number.isFinite(progress);
  const indeterminate = status === 'running' && !determinate;
  const targetArc = indeterminate ? arcLength : determinate ? Math.min(1, Math.max(0, progress || 0)) : 1;

  const spoken = TEXT[status] + (determinate ? `, ${Math.round(targetArc * 100)}%` : '');
  const hasLabel = label !== undefined && label !== null;

  return (
    <span
      className={`status-mark inline-flex items-center gap-1.5 ${className}`.trim()}
      data-status={status}
      data-indeterminate={indeterminate ? '' : undefined}
      data-strike={strike && status === 'done' ? '' : undefined}
      style={{
        '--sm-size': `${size}px`,
        '--sm-stroke': strokeWidth,
        '--sm-color': color,
        '--sm-done': doneColor,
        '--sm-error': errorColor,
        '--sm-fill': fillOpacity,
        '--sm-font': `${fontSize}px`,
        '--sm-draw': `${drawDuration}ms`,
        '--sm-strike-delay': `${120 + strikeDelay}ms`,
        ...style,
      } as React.CSSProperties}
    >
      <svg
        className={`status-mark__glyph flex-none overflow-visible transition-colors duration-200 ${
          status === 'running' && indeterminate ? 'animate-spin' : ''
        }`}
        style={indeterminate ? { animationDuration: `${spinDuration}ms` } : undefined}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role={hasLabel ? undefined : 'img'}
        aria-label={hasLabel ? undefined : spoken}
        aria-hidden={hasLabel || undefined}
      >
        <circle
          className="status-mark__track"
          cx="12"
          cy="12"
          r={r}
          transform="rotate(-90 12 12)"
          fill={status === 'done' ? doneColor : status === 'failed' ? errorColor : 'transparent'}
          fillOpacity={status === 'done' || status === 'failed' ? fillOpacity : 0}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity={status === 'running' ? 0.2 : 0}
        />
        <circle
          className="status-mark__ring"
          cx="12"
          cy="12"
          r={r}
          transform="rotate(-90 12 12)"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={
            status === 'pending'
              ? `${(C / dashes) * 0.3} ${(C / dashes) * 0.7}`
              : `${C * targetArc} ${C * (1 - targetArc)}`
          }
          opacity={status === 'pending' ? 0.45 : 1}
        />
        <path
          className="status-mark__check"
          d={CHECK}
          pathLength="1"
          fill="none"
          stroke={doneColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 2"
          strokeDashoffset={status === 'done' ? 0 : 1.05}
          opacity={status === 'done' ? 1 : 0}
          style={{ transition: 'stroke-dashoffset 240ms ease-out, opacity 100ms ease' }}
        />
        <path
          className="status-mark__cross"
          d={CROSS}
          pathLength="1"
          fill="none"
          stroke={errorColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 2"
          strokeDashoffset={status === 'failed' || status === 'cancelled' ? 0 : 1.05}
          opacity={status === 'failed' || status === 'cancelled' ? 1 : 0}
          style={{ transition: 'stroke-dashoffset 240ms ease-out, opacity 100ms ease' }}
        />
      </svg>
      {hasLabel && (
        <span className={`status-mark__label text-xs font-medium ${status === 'done' && strike ? 'line-through opacity-60' : ''}`}>
          {label}
        </span>
      )}
    </span>
  );
};

export default StatusMark;
