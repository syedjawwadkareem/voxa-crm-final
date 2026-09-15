// ─── Auth Session Helpers ───────────────────────────────────────────────────
// Supports portal-scoped sessions ('voxa_admin_session' and 'voxa_company_session')
// to prevent multiple tabs or portal switches from overriding each other's login state.
// Falls back to legacy 'voxa_session' for compatibility.

import type { AuthSession, AuthUser, Portal } from './types';

const ADMIN_SESSION_KEY = 'voxa_admin_session';
const COMPANY_SESSION_KEY = 'voxa_company_session';
const LEGACY_SESSION_KEY = 'voxa_session';

function getCurrentPortal(portal?: Portal): Portal | null {
  if (portal) return portal;
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/company')) return 'customer';
  return null;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export function getSession(portal?: Portal): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const targetPortal = getCurrentPortal(portal);
  try {
    if (targetPortal === 'admin') {
      const adminRaw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (adminRaw) {
        const parsed = JSON.parse(adminRaw) as AuthSession;
        if (parsed?.user?.portal === 'admin') return parsed;
      }
    } else if (targetPortal === 'customer') {
      const compRaw = localStorage.getItem(COMPANY_SESSION_KEY);
      if (compRaw) {
        const parsed = JSON.parse(compRaw) as AuthSession;
        if (parsed?.user?.portal === 'customer') return parsed;
      }
    }

    // Fallback: check portal-specific keys first if portal could not be determined
    if (!targetPortal) {
      const adminRaw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (adminRaw) {
        const parsed = JSON.parse(adminRaw) as AuthSession;
        if (parsed?.accessToken) return parsed;
      }
      const compRaw = localStorage.getItem(COMPANY_SESSION_KEY);
      if (compRaw) {
        const parsed = JSON.parse(compRaw) as AuthSession;
        if (parsed?.accessToken) return parsed;
      }
    }

    // Fallback to legacy single key
    const legacyRaw = localStorage.getItem(LEGACY_SESSION_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as AuthSession;
      if (targetPortal) {
        if (parsed?.user?.portal === targetPortal) return parsed;
      } else {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function getAccessToken(portal?: Portal): string | null {
  return getSession(portal)?.accessToken ?? null;
}

export function getRefreshToken(portal?: Portal): string | null {
  return getSession(portal)?.refreshToken ?? null;
}

export function getUser(portal?: Portal): AuthUser | null {
  return getSession(portal)?.user ?? null;
}

export function getPortal(portal?: Portal): Portal | null {
  return getSession(portal)?.user?.portal ?? null;
}

export function getPermissions(portal?: Portal): string[] {
  return getSession(portal)?.user?.permissions ?? [];
}

export function hasPermission(permission: string, portal?: Portal): boolean {
  return getPermissions(portal).includes(permission);
}

export function isAuthenticated(portal?: Portal): boolean {
  const session = getSession(portal);
  return !!(session?.accessToken && session?.user);
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function setSession(session: AuthSession, portal?: Portal): void {
  if (typeof window === 'undefined') return;
  const p = portal || session.user?.portal || getCurrentPortal();
  const serialized = JSON.stringify(session);
  if (p === 'admin') {
    localStorage.setItem(ADMIN_SESSION_KEY, serialized);
  } else if (p === 'customer') {
    localStorage.setItem(COMPANY_SESSION_KEY, serialized);
  }
  localStorage.setItem(LEGACY_SESSION_KEY, serialized);
}

export function updateTokens(accessToken: string, refreshToken: string, portal?: Portal): void {
  const session = getSession(portal);
  if (!session) return;
  setSession({ ...session, accessToken, refreshToken }, portal);
}

// ── Clear ─────────────────────────────────────────────────────────────────────

export function clearSession(portal?: Portal): void {
  if (typeof window === 'undefined') return;
  const targetPortal = getCurrentPortal(portal);
  if (targetPortal === 'admin') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    const legacy = localStorage.getItem(LEGACY_SESSION_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed?.user?.portal === 'admin') localStorage.removeItem(LEGACY_SESSION_KEY);
      } catch { }
    }
  } else if (targetPortal === 'customer') {
    localStorage.removeItem(COMPANY_SESSION_KEY);
    const legacy = localStorage.getItem(LEGACY_SESSION_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed?.user?.portal === 'customer') localStorage.removeItem(LEGACY_SESSION_KEY);
      } catch { }
    }
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(COMPANY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
}
