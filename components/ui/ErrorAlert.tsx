'use client';

// ─── ErrorAlert ──────────────────────────────────────────────────────────────
// A reusable animated inline alert banner.
// Supports error / warning / success variants.
// Supports dark (login) and light (dashboard modal) themes.

import { useState, useEffect } from 'react';

interface ErrorAlertProps {
  message: string;
  variant?: 'error' | 'warning' | 'success';
  theme?: 'dark' | 'light';
  onDismiss?: () => void;
  /** Auto-dismiss after ms (0 = never) */
  autoDismiss?: number;
}

const CONFIG = {
  error: {
    dark: {
      bg: 'rgba(220,38,38,0.13)',
      border: 'rgba(220,38,38,0.35)',
      text: '#fca5a5',
      iconBg: 'rgba(220,38,38,0.25)',
      iconColor: '#f87171',
    },
    light: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
    },
  },
  warning: {
    dark: {
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.3)',
      text: '#fcd34d',
      iconBg: 'rgba(245,158,11,0.2)',
      iconColor: '#fbbf24',
    },
    light: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
    },
  },
  success: {
    dark: {
      bg: 'rgba(15,143,122,0.13)',
      border: 'rgba(15,143,122,0.35)',
      text: '#6ee7b7',
      iconBg: 'rgba(15,143,122,0.25)',
      iconColor: '#34d399',
    },
    light: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      text: '#166534',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
    },
  },
};

const ICONS = {
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export function ErrorAlert({
  message,
  variant = 'error',
  theme = 'light',
  onDismiss,
  autoDismiss = 0,
}: ErrorAlertProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Animate in
  useEffect(() => {
    if (!message) return;
    setDismissed(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [message]);

  // Auto-dismiss
  useEffect(() => {
    if (!autoDismiss || !message) return;
    const t = setTimeout(() => handleDismiss(), autoDismiss);
    return () => clearTimeout(t);
  }, [autoDismiss, message]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, 250);
  }

  if (!message || dismissed) return null;

  const c = CONFIG[variant][theme];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        padding: '0.65rem 0.8rem',
        borderRadius: '0.5rem',
        border: `1px solid ${c.border}`,
        background: c.bg,
        marginBottom: '1rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.98)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        animation: visible ? 'errorShake 0.35s ease' : 'none',
      }}
    >
      {/* Icon */}
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: c.iconBg,
          color: c.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {ICONS[variant]}
      </span>

      {/* Message */}
      <p
        style={{
          flex: 1,
          fontSize: '0.82rem',
          lineHeight: 1.4,
          color: c.text,
          margin: 0,
          paddingTop: 2,
        }}
      >
        {message}
      </p>

      {/* Dismiss */}
      {onDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: c.text,
            opacity: 0.5,
            padding: '2px 4px',
            lineHeight: 1,
            fontSize: '1rem',
            flexShrink: 0,
            borderRadius: 4,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
          onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.5')}
        >
          ✕
        </button>
      )}
    </div>
  );
}
