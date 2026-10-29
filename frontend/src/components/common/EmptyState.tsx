import React from 'react';
import { Satellite, FolderSearch } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No telemetry, satellite captures, or records are currently recorded in the database.',
  actionText,
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  const buttonLabel = actionLabel || actionText;

  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-12 text-center max-w-md mx-auto backdrop-blur-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
        {icon || <Satellite className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">{description}</p>
      {buttonLabel && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
        >
          <FolderSearch className="w-3.5 h-3.5" />
          <span>{buttonLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
