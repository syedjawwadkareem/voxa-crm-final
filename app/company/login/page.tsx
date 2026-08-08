'use client';

// ─── Company Portal Login Page ────────────────────────────────────────────────
// /company/login — always sets portal="customer"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setSession, isAuthenticated, getPortal } from '@/lib/auth';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import '@/app/voxa.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && getPortal() === 'customer') {
      router.replace('/company/dashboard');
    }
  }, [router]);

  // ── Client-side validation ────────────────────────────────────────────────
  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password, 'customer');
      const { accessToken, refreshToken, user } = res.data;
      setSession({ accessToken, refreshToken, user });
      router.push('/company/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Clear field error on change
  const onEmailChange = (v: string) => {
    setEmail(v);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
    if (error) setError('');
  };
  const onPasswordChange = (v: string) => {
    setPassword(v);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
    if (error) setError('');
  };

  const inputBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#f1f5f9',
    width: '100%',
    borderRadius: '0.5rem',
    padding: '0.65rem 0.875rem',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 40%, #0a1a35 100%)',
      }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <path
                d="M6 12 L10 28 L14 12 L18 28 L22 12 L26 28 L30 12 L34 28"
                stroke="url(#g-login-company)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="g-login-company" x1="0" x2="40">
                  <stop stopColor="#22c1a5" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <div className="logo-mark text-2xl">VOXA</div>
              <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase -mt-0.5">
                Company Portal
              </div>
            </div>
          </div>

          <h2 className="text-white text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-6">Access your company workspace</p>

          {/* Portal badge */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <span className="text-blue-400 text-xs">🏢</span>
            <span className="text-blue-300 text-xs font-semibold">Company User Access</span>
          </div>

          {/* API Error Alert */}
          <ErrorAlert
            message={error}
            variant="error"
            theme="dark"
            onDismiss={() => setError('')}
          />

          {/* noValidate: we handle all validation in JS */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="company-email">
                Email address
              </label>
              <input
                id="company-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="you@company.com"
                style={{
                  ...inputBase,
                  borderColor: fieldErrors.email ? '#f87171' : 'rgba(255,255,255,0.12)',
                }}
                onFocus={(e) => {
                  if (!fieldErrors.email) e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  if (!fieldErrors.email) e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              />
              {fieldErrors.email && (
                <p className="field-error-msg" style={{ color: '#fca5a5' }}>
                  <span>⚠</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="company-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="company-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    ...inputBase,
                    paddingRight: '2.5rem',
                    borderColor: fieldErrors.password ? '#f87171' : 'rgba(255,255,255,0.12)',
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.password) e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.password) e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="field-error-msg" style={{ color: '#fca5a5' }}>
                  <span>⚠</span> {fieldErrors.password}
                </p>
              )}
              <div className="mt-1.5 text-right">
                <a href="/company/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              id="company-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all mt-2"
              style={{
                background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.4)',
                border: 'none',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Signing in…
                </span>
              ) : 'Sign in to Company Portal'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Voxa staff?{' '}
            <a href="/admin/login" className="text-teal-400 hover:text-teal-300 transition-colors">
              Go to Admin Login →
            </a>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Voxa Communications Platform
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
