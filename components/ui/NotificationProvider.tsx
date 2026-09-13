'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Trash2,
  AlertOctagon,
  HelpCircle,
  Loader2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  title?: string;
  duration?: number; // ms, default 4000
}

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration: number;
}

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmOptions {
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: 'trash' | 'alert' | 'help' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

// ─── Global Event / State Dispatcher ─────────────────────────────────────────

type ToastListener = (toasts: ToastItem[]) => void;
type ConfirmListener = (state: ConfirmState | null) => void;

let activeToasts: ToastItem[] = [];
let toastListeners: ToastListener[] = [];
let confirmListener: ConfirmListener | null = null;

function notifyToastListeners() {
  toastListeners.forEach((fn) => fn([...activeToasts]));
}

export const toast = {
  show: (message: string, variant: ToastVariant = 'info', options: ToastOptions = {}) => {
    const id = options.id || Math.random().toString(36).substring(2, 9);
    const duration = options.duration ?? 4000;
    const item: ToastItem = {
      id,
      message,
      title: options.title,
      variant,
      duration,
    };

    activeToasts = [item, ...activeToasts.filter((t) => t.id !== id)].slice(0, 5);
    notifyToastListeners();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  success: (message: string, options?: ToastOptions) => toast.show(message, 'success', options),
  error: (message: string, options?: ToastOptions) => toast.show(message, 'error', options),
  warning: (message: string, options?: ToastOptions) => toast.show(message, 'warning', options),
  info: (message: string, options?: ToastOptions) => toast.show(message, 'info', options),
  dismiss: (id: string) => {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    notifyToastListeners();
  },
};

/**
 * Trigger a stylish modal confirmation dialog.
 * Resolves to `true` if user confirmed, `false` if cancelled or closed.
 */
export function confirmModal(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (confirmListener) {
      confirmListener({
        ...options,
        open: true,
        resolve,
      });
    } else {
      // Fallback if provider not mounted
      const ok = window.confirm(typeof options.message === 'string' ? options.message : options.title || 'Confirm?');
      resolve(ok);
    }
  });
}

// ─── Notification Provider Component ─────────────────────────────────────────

export function NotificationProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    toastListeners.push(setToasts);
    confirmListener = setConfirmState;

    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts);
      confirmListener = null;
    };
  }, []);

  // Handle Confirm Dialog actions
  const handleConfirm = () => {
    if (confirmState?.resolve) {
      confirmState.resolve(true);
    }
    setConfirmState(null);
  };

  const handleCancel = () => {
    if (confirmState?.resolve) {
      confirmState.resolve(false);
    }
    setConfirmState(null);
  };

  // Close confirm on Escape key
  useEffect(() => {
    if (!confirmState?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmState?.open]);

  return (
    <>
      {/* ── Toast Container (Top-Right) ── */}
      <div
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none sm:max-w-md"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((item) => {
          let bg = 'bg-slate-900/95 text-white border-slate-700/80 shadow-slate-950/20';
          let iconColor = 'text-blue-400';
          let IconComponent = Info;

          if (item.variant === 'success') {
            bg = 'bg-slate-900/95 text-white border-emerald-500/30 shadow-emerald-950/10';
            iconColor = 'text-emerald-400';
            IconComponent = CheckCircle2;
          } else if (item.variant === 'error') {
            bg = 'bg-slate-900/95 text-white border-rose-500/30 shadow-rose-950/10';
            iconColor = 'text-rose-400';
            IconComponent = AlertCircle;
          } else if (item.variant === 'warning') {
            bg = 'bg-slate-900/95 text-white border-amber-500/30 shadow-amber-950/10';
            iconColor = 'text-amber-400';
            IconComponent = AlertTriangle;
          }

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all transform animate-in slide-in-from-top-3 fade-in duration-200 ${bg}`}
              role="alert"
            >
              <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                <IconComponent size={18} />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                {item.title && (
                  <h5 className="text-xs font-semibold text-white mb-0.5 leading-tight">
                    {item.title}
                  </h5>
                )}
                <p className="text-xs text-slate-200 leading-relaxed break-words">
                  {item.message}
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(item.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Confirm Modal Dialog ── */}
      {confirmState?.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-150 text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="flex items-start gap-4">
              {/* Icon Circle */}
              {confirmState.variant === 'danger' ? (
                <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                  <Trash2 size={20} />
                </div>
              ) : confirmState.variant === 'warning' ? (
                <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={20} />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                  <HelpCircle size={20} />
                </div>
              )}

              {/* Title & Body */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h3
                  id="confirm-modal-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {confirmState.title || (confirmState.variant === 'danger' ? 'Are you sure?' : 'Confirm Action')}
                </h3>
                <div className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-normal">
                  {confirmState.message}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white shadow-sm transition-all focus:ring-2 focus:ring-offset-2 ${
                  confirmState.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                    : confirmState.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                    : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                }`}
              >
                {confirmState.confirmText || (confirmState.variant === 'danger' ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
