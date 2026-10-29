import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Retrieving satellite telemetry and construction data...',
  className = '',
  fullHeight = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${
        fullHeight ? 'min-h-[400px]' : 'py-12'
      } ${className}`}
    >
      <div className="relative mb-4">
        {/* Radar-like pulsing outer ring */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping opacity-60" />
        <div className="relative w-12 h-12 rounded-full border border-blue-500/40 bg-slate-900/80 flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-300 tracking-wide">{message}</p>
      <span className="text-xs text-slate-500 mt-1">Connecting to Django REST Framework backend</span>
    </div>
  );
};

export default LoadingState;
