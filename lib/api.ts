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
  const isFormData = options.body instanceof FormData;

  // Do NOT set Content-Type for FormData — browser sets it with the boundary automatically
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined
      ? isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
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
  get:      <T>(path: string) => request<T>(path, { method: 'GET' }),
  post:     <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  put:      <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete:   <T>(path: string) => request<T>(path, { method: 'DELETE' }),
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

// ── Integrations endpoints ─────────────────────────────────────────────────────

export type PlatformType = 'meta' | 'whatsapp' | 'sms' | 'email';

export interface MetaCredentials {
  metaAppId?: string;
  metaAppSecret?: string;
  metaPageAccessToken?: string;
  metaPageId?: string;
  metaAdAccountId?: string;
}

export interface PlatformIntegration {
  _id: string;
  platformType: PlatformType;
  status: 'active' | 'disconnected' | 'error';
  leadsReceivedCount: number;
  lastSyncAt?: string;
  connectedAt?: string;
  credentials: MetaCredentials;
}

export interface MetaForm {
  id: string;
  name: string;
  status: string;
  created_time: string;
  leads_count: number;
  created_via_voxa: boolean;
}

export interface MetaLead {
  _id: string;
  fullName: string;
  email: string;
  phoneE164: string;
  globalStatus: string;
  createdAt: string;
  leadListId?: { name?: string };
}

export interface MetaFormLead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  created_time: string;
  raw: Record<string, string>;
}

export const integrationsApi = {
  getConfig: (platformType: PlatformType) =>
    api.get<{ success: boolean; data: PlatformIntegration | null }>(`/integrations/config/${platformType}`),

  saveConfig: (platformType: PlatformType, payload: MetaCredentials) =>
    api.post<{ success: boolean; message: string; data: PlatformIntegration }>(`/integrations/config/${platformType}`, payload),

  deleteConfig: (platformType: PlatformType) =>
    api.delete<{ success: boolean; message: string }>(`/integrations/config/${platformType}`),

  getMetaForms: () =>
    api.get<{ success: boolean; forms: MetaForm[] }>('/integrations/meta/forms'),

  createMetaForm: (payload: { name: string; questions: object[] }) =>
    api.post<{ success: boolean; form_id: string }>('/integrations/meta/forms', payload),

  getMetaLeads: () =>
    api.get<{ success: boolean; leads: MetaLead[] }>('/integrations/meta/leads'),

  getLeadsByFormId: (formId: string) =>
    api.get<{ success: boolean; leads: MetaFormLead[] }>(`/integrations/meta/forms/${formId}/leads`),
};

// ── Leads endpoints ───────────────────────────────────────────────────────────

export interface CapturedLead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  form_id: string | null;
  form_name: string | null;
  lead_status: string;
  assigned_agent: string | null;
  created_at: string;
}

export interface LeadsStats {
  total: number;
  new: number;
  converted: number;
  status: string;
}

export const leadsApi = {
  getAll: () =>
    api.get<{ success: boolean; leads: CapturedLead[] }>('/leads'),

  getStats: () =>
    api.get<{ success: boolean; stats: LeadsStats }>('/leads/stats'),
};

// ── IVR Campaigns endpoints ────────────────────────────────────────────────────

export interface IvrCampaign {
  _id: string;
  name: string;
  type: 'broadcast' | 'dtmf' | 'Broadcast' | 'DTMF';
  audioFile?: string;
  csvFile?: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  schedule?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CreateIvrCampaignPayload {
  name: string;
  type: string;
  audioFile?: string;
  csvFile?: string;
  description?: string;
  schedule?: string;
}

export interface DtmfOption {
  digit: string;
  option_text: string;
  reply_audio: string;
}

export const ivrCampaignsApi = {
  list:      () => api.get<{ success: boolean; data: IvrCampaign[] }>('/ivr-campaigns'),
  listObd:   () => api.get<{ success: boolean; data: unknown[] }>('/ivr-campaigns/obd'),
  getById:   (id: string) => api.get<{ success: boolean; data: IvrCampaign }>(`/ivr-campaigns/${id}`),
  getObdDetail: (id: string) => api.get<{ success: boolean; data: any }>(`/ivr-campaigns/${id}/obd-detail`),
  start:     (id: string) => api.get<{ success: boolean; message: string }>(`/ivr-campaigns/${id}/start`),
  create:    (payload: CreateIvrCampaignPayload) =>
    api.post<{ success: boolean; message: string; data: IvrCampaign }>('/ivr-campaigns', payload),
  /** Use this overload when submitting with a CSV file (multipart/form-data) */
  createWithFile: (formData: FormData) =>
    api.postForm<{ success: boolean; message: string; data: IvrCampaign }>('/ivr-campaigns', formData),
};

// ── Audio (OBD CMS proxy) endpoints ───────────────────────────────────────────

export interface AudioFile {
  id: string;
  original_name: string;
  stored_file: string;
}

export const audioApi = {
  /** Fetch all audio files from OBD CMS */
  list: () =>
    api.get<{ success: boolean; data: AudioFile[] }>('/ivr-campaigns/audio'),

  /** Upload an audio file to OBD CMS */
  upload: (formData: FormData) =>
    api.postForm<{ success: boolean; message: string; data: unknown }>('/ivr-campaigns/audio/upload', formData),
};

// ── Orders endpoints ─────────────────────────────────────────────────────────

import type { Order, CreateOrderPayload } from './types';

export const ordersApi = {
  list: () => api.get<ApiSuccess<Order[]>>('/orders'),
  getById: (id: string) => api.get<ApiSuccess<Order>>(`/orders/${id}`),
  create: (payload: CreateOrderPayload) => api.post<ApiSuccess<Order>>('/orders', payload),
  update: (id: string, payload: Partial<CreateOrderPayload>) => api.patch<ApiSuccess<Order>>(`/orders/${id}`, payload),
  delete: (id: string) => api.delete<ApiSuccess<null>>(`/orders/${id}`),
};

// ── DID endpoints ─────────────────────────────────────────────────────────────

export interface Did {
  _id: string;
  did_number: string;
  label: string;
  notes: string;
  status: 'available' | 'assigned' | 'released';
  company_id: { _id: string; name: string; status: string } | null;
  campaign_id: string | null;
  ai_flow_id: string | null;
  context: string;
  is_active: boolean;
  assigned_at: string;
  released_at: string | null;
  added_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DidHistoryRow {
  _id: string;
  did_number: string;
  status: string;
  company: string;
  assigned_at: string;
  released_at: string | null;
}

export interface CreateDidPayload {
  did_number: string;
  label?: string;
  notes?: string;
  context?: string;
}

// Admin DID API
export const didsApi = {
  // Admin
  list:    () => api.get<ApiSuccess<Did[]>>('/dids'),
  getById: (id: string) => api.get<ApiSuccess<Did>>(`/dids/${id}`),
  getHistory: (id: string) => api.get<ApiSuccess<Did[]>>(`/dids/${id}/history`),
  create:  (payload: CreateDidPayload) => api.post<ApiSuccess<Did>>('/dids', payload),
  update:  (id: string, payload: Partial<CreateDidPayload>) => api.patch<ApiSuccess<Did>>(`/dids/${id}`, payload),
  delete:  (id: string) => api.delete<ApiSuccess<null>>(`/dids/${id}`),
  assign:  (id: string, company_id: string) => api.post<ApiSuccess<Did>>(`/dids/${id}/assign`, { company_id }),
  release: (id: string) => api.post<ApiSuccess<Did>>(`/dids/${id}/release`, {}),

  // Company (own DIDs)
  listMine: () => api.get<ApiSuccess<Did[]>>('/dids/company/mine'),
  getMineHistory: (didId: string) =>
    api.get<ApiSuccess<DidHistoryRow[]>>(`/dids/company/mine/${didId}/history`),
};

// ── AI Agents (Voxa AI Pipeline) ──────────────────────────────────────────────

export type AiCallStatus = 'queued' | 'ringing' | 'completed' | 'no_answer' | 'voicemail' | 'transferred' | 'failed';

export interface TransferDestination {
  name: string;
  phone_number: string;
}

export interface AgentConfig {
  _id: string;
  pipeline_config_id: string | null;
  company_id: { _id: string; name: string; status: string } | string | null;
  name: string;
  language: string;
  tone: string;
  script: string;
  voice: string;
  structured_output_schema_id: string | null;
  webhook_url: string;
  webhook_secret: string;
  hangup_enabled: boolean;
  dtmf_enabled: boolean;
  voicemail_detection_enabled: boolean;
  voicemail_message: string | null;
  speak_first: 'agent' | 'caller';
  greeting_message: string | null;
  goodbye_message: string | null;
  goodbye_message_verbatim: boolean;
  idle_timeout_seconds: number;
  idle_max_reprompts: number;
  call_recording_enabled: boolean;
  noise_cancellation_enabled: boolean;
  transfer_enabled: boolean;
  transfer_destinations: TransferDestination[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptTurn {
  role: 'agent' | 'caller';
  text: string;
  ts: string;
}

export interface AiCall {
  _id: string;
  call_id: string | null;
  agent_config_id: { _id: string; name: string; voice: string } | string | null;
  company_id: { _id: string; name: string } | string | null;
  phone_number: string;
  from_number: string;
  direction: string;
  status: AiCallStatus;
  ended_reason: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: TranscriptTurn[];
  structured_output: Record<string, unknown> | null;
  recording_url: string | null;
  createdAt: string;
}

export interface CreateAgentConfigPayload {
  company_id?: string;
  name: string;
  language?: string;
  tone: string;
  script: string;
  voice: string;
  structured_output_schema_id?: string | null;
  webhook_url?: string;
  webhook_secret?: string;
  hangup_enabled?: boolean;
  dtmf_enabled?: boolean;
  voicemail_detection_enabled?: boolean;
  voicemail_message?: string | null;
  speak_first?: 'agent' | 'caller';
  greeting_message?: string | null;
  goodbye_message?: string | null;
  goodbye_message_verbatim?: boolean;
  idle_timeout_seconds?: number;
  idle_max_reprompts?: number;
  call_recording_enabled?: boolean;
  noise_cancellation_enabled?: boolean;
  transfer_enabled?: boolean;
  transfer_destinations?: TransferDestination[];
}

export const aiAgentsApi = {
  // ── Admin ──────────────────────────────────────────────────────────────
  listConfigs:   (companyId?: string) =>
    api.get<ApiSuccess<AgentConfig[]>>(`/ai-agents/configs${companyId ? `?company_id=${companyId}` : ''}`),
  getConfig:     (id: string) => api.get<ApiSuccess<AgentConfig>>(`/ai-agents/configs/${id}`),
  createConfig:  (payload: CreateAgentConfigPayload) =>
    api.post<ApiSuccess<AgentConfig>>('/ai-agents/configs', payload),
  updateConfig:  (id: string, payload: Partial<CreateAgentConfigPayload>) =>
    api.put<ApiSuccess<AgentConfig>>(`/ai-agents/configs/${id}`, payload),
  deleteConfig:  (id: string) => api.delete<ApiSuccess<null>>(`/ai-agents/configs/${id}`),

  listCalls:     (params?: { company_id?: string; status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return api.get<ApiSuccess<AiCall[]>>(`/ai-agents/calls${qs}`);
  },
  getCall:       (id: string) => api.get<ApiSuccess<AiCall>>(`/ai-agents/calls/${id}`),
  triggerCall:   (payload: { agent_config_id: string; phone_number: string; from_number: string }) =>
    api.post<ApiSuccess<AiCall>>('/ai-agents/calls/trigger', payload),

  // ── Company ────────────────────────────────────────────────────────────
  companyListConfigs:  () => api.get<ApiSuccess<AgentConfig[]>>('/ai-agents/company/configs'),
  companyCreateConfig: (payload: Partial<CreateAgentConfigPayload>) =>
    api.post<ApiSuccess<AgentConfig>>('/ai-agents/company/configs', payload),
  companyUpdateConfig: (id: string, payload: Partial<CreateAgentConfigPayload>) =>
    api.put<ApiSuccess<AgentConfig>>(`/ai-agents/company/configs/${id}`, payload),
  companyDeleteConfig: (id: string) => api.delete<ApiSuccess<null>>(`/ai-agents/company/configs/${id}`),

  companyListCalls:   (status?: string) =>
    api.get<ApiSuccess<AiCall[]>>(`/ai-agents/company/calls${status ? `?status=${status}` : ''}`),
  companyGetCall:     (id: string) => api.get<ApiSuccess<AiCall>>(`/ai-agents/company/calls/${id}`),
  companyTriggerCall: (payload: { agent_config_id: string; phone_number: string; from_number: string }) =>
    api.post<ApiSuccess<AiCall>>('/ai-agents/company/calls/trigger', payload),
};


