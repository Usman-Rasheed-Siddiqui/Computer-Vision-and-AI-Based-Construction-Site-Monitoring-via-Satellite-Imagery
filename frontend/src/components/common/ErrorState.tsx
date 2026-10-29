import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load monitoring data',
  message = 'There was an issue communicating with the API. Please ensure your backend server is running and accessible.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-rose-500/20 bg-rose-950/20 p-6 sm:p-8 text-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
