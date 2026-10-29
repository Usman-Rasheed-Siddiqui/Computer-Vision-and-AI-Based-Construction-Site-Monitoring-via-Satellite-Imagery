import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'success' | 'info' | string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  variant,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const contentText = description || message || '';
  const isDangerous = isDestructive || variant === 'danger';
  const isSuccess = variant === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      {/* Dialog box */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-6 shadow-2xl shadow-black/80 z-10">
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-none ${
              isDangerous
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : isSuccess
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">{contentText}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all cursor-pointer ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
