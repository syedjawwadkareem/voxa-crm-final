// ─── Auth Session Helpers ───────────────────────────────────────────────────
// All session data is stored in localStorage under the 'voxa_session' key.
// This module is always imported as a client-side utility.

import type { AuthSession, AuthUser, Portal } from './types';

const SESSION_KEY = 'voxa_session';

// ── Read ─────────────────────────────────────────────────────────────────────

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getSession()?.refreshToken ?? null;
}

export function getUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function getPortal(): Portal | null {
  return getSession()?.user?.portal ?? null;
}

export function getPermissions(): string[] {
  return getSession()?.user?.permissions ?? [];
}

export function hasPermission(permission: string): boolean {
  return getPermissions().includes(permission);
}

export function isAuthenticated(): boolean {
  const session = getSession();
  return !!(session?.accessToken && session?.user);
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function setSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function updateTokens(accessToken: string, refreshToken: string): void {
  const session = getSession();
  if (!session) return;
  setSession({ ...session, accessToken, refreshToken });
}

// ── Clear ─────────────────────────────────────────────────────────────────────

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
