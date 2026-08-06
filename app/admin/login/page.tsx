'use client';

// ─── Admin Portal Login Page ──────────────────────────────────────────────────
// /admin/login — always sets portal="admin"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setSession, isAuthenticated, getPortal } from '@/lib/auth';
import '@/app/voxa.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated() && getPortal() === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password, 'admin');
      const { accessToken, refreshToken, user } = res.data;
      setSession({ accessToken, refreshToken, user });
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0f1b2d 0%, #0f2d3d 40%, #0a1628 100%)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
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
                stroke="url(#g-login-admin)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="g-login-admin" x1="0" x2="40">
                  <stop stopColor="#22c1a5" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <div className="logo-mark text-2xl">VOXA</div>
              <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase -mt-0.5">
                Admin Portal
              </div>
            </div>
          </div>

          <h2 className="text-white text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your Voxa admin account</p>

          {/* Portal badge */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6"
            style={{ background: 'rgba(15,143,122,0.15)', border: '1px solid rgba(15,143,122,0.3)' }}
          >
            <span className="text-teal-400 text-xs">🛡</span>
            <span className="text-teal-300 text-xs font-semibold">Voxa Internal Staff Access</span>
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-3 py-2 rounded-lg text-sm mb-4"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="admin-email">
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@voxa.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-all outline-none"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#f1f5f9',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0f8f7a')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-all outline-none pr-10"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#f1f5f9',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0f8f7a')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
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
              <div className="mt-1.5 text-right">
                <a
                  href="/admin/forgot-password"
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all mt-2"
              style={{
                background: loading ? 'rgba(15,143,122,0.5)' : 'linear-gradient(135deg, #0f8f7a, #22c1a5)',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(15,143,122,0.4)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in to Admin Portal'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Company portal?{' '}
            <a href="/company/login" className="text-teal-400 hover:text-teal-300 transition-colors">
              Go to Company Login →
            </a>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Voxa Communications Platform
        </p>
      </div>
    </div>
  );
}
