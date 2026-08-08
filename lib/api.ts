// ─── API Client ─────────────────────────────────────────────────────────────
// Central fetch wrapper that:
//   1. Attaches the JWT Authorization header automatically
//   2. Retries once with a refreshed token on 401
//   3. Clears session and redirects to login on unrecoverable 401

import {
  getAccessToken,
  getRefreshToken,
  updateTokens,
  clearSession,
} from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// ── Core fetch ────────────────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    if (path === '/auth/login') {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.message ?? 'Invalid email or password');
    }

    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);
    clearSession();
    // Redirect to whichever login applies
    if (typeof window !== 'undefined') {
      const href = window.location.pathname;
      if (!href.endsWith('/login')) {
        const portal = href.startsWith('/admin') ? '/admin/login' : '/company/login';
        window.location.href = portal;
      }
    }
    throw new Error('Session expired');
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? `HTTP ${res.status}`);
  }
  return json as T;
}

// ── Token refresh ─────────────────────────────────────────────────────────────

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const { accessToken, refreshToken: newRefresh } = json.data ?? {};
    if (accessToken && newRefresh) {
      updateTokens(accessToken, newRefresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ── Auth endpoints ────────────────────────────────────────────────────────────

import type { ApiSuccess, AuthUser, Portal } from './types';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string, portal: Portal) =>
    api.post<ApiSuccess<LoginResponse>>('/auth/login', { email, password, portal }),

  logout: () => api.post<ApiSuccess<null>>('/auth/logout', {}),

  forgotPassword: (email: string) =>
    api.post<ApiSuccess<null>>('/auth/forgot-password', { email }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post<ApiSuccess<null>>('/auth/change-password', { oldPassword, newPassword }),
};

// ── Company endpoints (admin portal) ─────────────────────────────────────────

import type { Company, CreateCompanyPayload, CompanyStatus, TenantInfo } from './types';

export const companiesApi = {
  list: () => api.get<ApiSuccess<Company[]>>('/companies'),
  getById: (id: string) => api.get<ApiSuccess<Company>>(`/companies/${id}`),
  create: (payload: CreateCompanyPayload) => api.post<ApiSuccess<{ company: Company; tempPassword: string }>>('/companies', payload),
  update: (id: string, payload: Partial<CreateCompanyPayload>) => api.patch<ApiSuccess<Company>>(`/companies/${id}`, payload),
  updateStatus: (id: string, status: CompanyStatus) => api.patch<ApiSuccess<Company>>(`/companies/${id}/status`, { status }),
  updateTenant: (id: string, tenant: TenantInfo) => api.post<ApiSuccess<TenantInfo>>(`/companies/${id}/tenant`, tenant),
};

import type { Plan } from './types';

export const billingApi = {
  getPlans: () => api.get<ApiSuccess<Plan[]>>('/billing/plans'),
  createPlan: (payload: Partial<Plan>) => api.post<ApiSuccess<Plan>>('/billing/plans', payload),
  updatePlan: (id: string, payload: Partial<Plan>) => api.put<ApiSuccess<Plan>>(`/billing/plans/${id}`, payload),
  deletePlan: (id: string) => api.delete<ApiSuccess<null>>(`/billing/plans/${id}`),
};

// ── Admin users endpoints ────────────────────────────────────────────────────

import type { AdminUser, CreateAdminUserPayload } from './types';

export const adminUsersApi = {
  list: () => api.get<ApiSuccess<AdminUser[]>>('/admin-users'),
  getById: (id: string) => api.get<ApiSuccess<AdminUser>>(`/admin-users/${id}`),
  create: (payload: CreateAdminUserPayload) => api.post<ApiSuccess<AdminUser>>('/admin-users', payload),
  update: (id: string, payload: Partial<CreateAdminUserPayload>) => api.patch<ApiSuccess<AdminUser>>(`/admin-users/${id}`, payload),
  assignRole: (id: string, roleId: string) => api.patch<ApiSuccess<AdminUser>>(`/admin-users/${id}/role`, { roleId }),
  deactivate: (id: string) => api.delete<ApiSuccess<null>>(`/admin-users/${id}`),
};

// ── Company users endpoints ──────────────────────────────────────────────────

import type { CompanyUser, CreateCompanyUserPayload } from './types';

export const companyUsersApi = {
  list: () => api.get<ApiSuccess<CompanyUser[]>>('/company-users'),
  getById: (id: string) => api.get<ApiSuccess<CompanyUser>>(`/company-users/${id}`),
  create: (payload: CreateCompanyUserPayload) => api.post<ApiSuccess<CompanyUser>>('/company-users', payload),
  update: (id: string, payload: Partial<CreateCompanyUserPayload>) => api.patch<ApiSuccess<CompanyUser>>(`/company-users/${id}`, payload),
  assignRole: (id: string, roleId: string) => api.patch<ApiSuccess<CompanyUser>>(`/company-users/${id}/role`, { roleId }),
  deactivate: (id: string) => api.delete<ApiSuccess<null>>(`/company-users/${id}`),
};

// ── Roles endpoints ───────────────────────────────────────────────────────────

import type { Role, CreateRolePayload } from './types';

export const rolesApi = {
  // Admin portal (Voxa internal roles)
  adminList: () => api.get<ApiSuccess<Role[]>>('/roles'),
  adminCreate: (payload: CreateRolePayload) => api.post<ApiSuccess<Role>>('/roles', payload),
  adminUpdate: (id: string, payload: Partial<CreateRolePayload>) => api.patch<ApiSuccess<Role>>(`/roles/${id}`, payload),
  adminDelete: (id: string) => api.delete<ApiSuccess<null>>(`/roles/${id}`),

  // Company portal (company-scoped roles)
  companyList: () => api.get<ApiSuccess<Role[]>>('/roles/company'),
  companyCreate: (payload: CreateRolePayload) => api.post<ApiSuccess<Role>>('/roles/company', payload),
  companyUpdate: (id: string, payload: Partial<CreateRolePayload>) => api.patch<ApiSuccess<Role>>(`/roles/company/${id}`, payload),
  companyDelete: (id: string) => api.delete<ApiSuccess<null>>(`/roles/company/${id}`),
};
