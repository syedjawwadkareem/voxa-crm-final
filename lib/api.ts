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
    
    // Refresh genuinely failed (e.g. refresh token expired after 7 days)
    const portal = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'admin' : 'customer';
    clearSession(portal);
    if (typeof window !== 'undefined') {
      const href = window.location.pathname;
      if (!href.endsWith('/login')) {
        const portalLogin = href.startsWith('/admin') ? '/admin/login' : '/company/login';
        window.location.href = portalLogin;
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

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
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
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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

import type {
  ApiSuccess, AuthUser, Portal, Company, CreateCompanyPayload, CompanyStatus, TenantInfo,
  Plan, AdminUser, CreateAdminUserPayload, CompanyUser, CreateCompanyUserPayload,
  Role, CreateRolePayload, Order, CreateOrderPayload
} from './types';

export type {
  Company, CreateCompanyPayload, CompanyStatus, TenantInfo,
  Plan, AdminUser, CreateAdminUserPayload, CompanyUser, CreateCompanyUserPayload,
  Role, CreateRolePayload, Order, CreateOrderPayload
};

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

export const companiesApi = {
  list: () => api.get<ApiSuccess<Company[]>>('/companies'),
  getById: (id: string) => api.get<ApiSuccess<Company>>(`/companies/${id}`),
  getNextTenantId: () => api.get<ApiSuccess<{ nextTenantId: string }>>('/companies/next-tenant-id'),
  create: (payload: CreateCompanyPayload) => api.post<ApiSuccess<{ company: Company; tempPassword: string }>>('/companies', payload),
  update: (id: string, payload: Partial<CreateCompanyPayload>) => api.patch<ApiSuccess<Company>>(`/companies/${id}`, payload),
  updateStatus: (id: string, status: CompanyStatus) => api.patch<ApiSuccess<Company>>(`/companies/${id}/status`, { status }),
  updateTenant: (id: string, tenant: TenantInfo) => api.post<ApiSuccess<TenantInfo>>(`/companies/${id}/tenant`, tenant),
};

export const billingApi = {
  getPlans: () => api.get<ApiSuccess<Plan[]>>('/billing/plans'),
  createPlan: (payload: Partial<Plan>) => api.post<ApiSuccess<Plan>>('/billing/plans', payload),
  updatePlan: (id: string, payload: Partial<Plan>) => api.put<ApiSuccess<Plan>>(`/billing/plans/${id}`, payload),
  deletePlan: (id: string) => api.delete<ApiSuccess<null>>(`/billing/plans/${id}`),
};

// ── Admin users endpoints ────────────────────────────────────────────────────

export const adminUsersApi = {
  list: () => api.get<ApiSuccess<AdminUser[]>>('/admin-users'),
  getById: (id: string) => api.get<ApiSuccess<AdminUser>>(`/admin-users/${id}`),
  create: (payload: CreateAdminUserPayload) => api.post<ApiSuccess<AdminUser>>('/admin-users', payload),
  update: (id: string, payload: Partial<CreateAdminUserPayload>) => api.patch<ApiSuccess<AdminUser>>(`/admin-users/${id}`, payload),
  assignRole: (id: string, roleId: string) => api.patch<ApiSuccess<AdminUser>>(`/admin-users/${id}/role`, { roleId }),
  deactivate: (id: string) => api.delete<ApiSuccess<null>>(`/admin-users/${id}`),
};

// ── Company users endpoints ──────────────────────────────────────────────────

export const companyUsersApi = {
  list: () => api.get<ApiSuccess<CompanyUser[]>>('/company-users'),
  getById: (id: string) => api.get<ApiSuccess<CompanyUser>>(`/company-users/${id}`),
  create: (payload: CreateCompanyUserPayload) => api.post<ApiSuccess<CompanyUser>>('/company-users', payload),
  update: (id: string, payload: Partial<CreateCompanyUserPayload>) => api.patch<ApiSuccess<CompanyUser>>(`/company-users/${id}`, payload),
  assignRole: (id: string, roleId: string) => api.patch<ApiSuccess<CompanyUser>>(`/company-users/${id}/role`, { roleId }),
  deactivate: (id: string) => api.delete<ApiSuccess<null>>(`/company-users/${id}`),
};

// ── Roles endpoints ───────────────────────────────────────────────────────────

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

export type PlatformType = 'meta' | 'whatsapp' | 'sms' | 'email' | 'shopify' | 'daraz';

export interface MetaCredentials {
  metaAppId?: string;
  metaAppSecret?: string;
  metaPageAccessToken?: string;
  metaPageId?: string;
  metaAdAccountId?: string;
}

export interface ShopifyCredentials {
  shopifyShopUrl?: string;
  shopifyAccessToken?: string;
  shopifyApiKey?: string;
  shopifyApiSecretKey?: string;
  shopifyApiVersion?: string;
}

export interface DarazCredentials {
  darazShopName?: string;
  darazSellerId?: string;
  darazAppKey?: string;
  darazAppSecret?: string;
  darazAccessToken?: string;
  darazRegion?: string;
}

export type PlatformCredentials = MetaCredentials & ShopifyCredentials & DarazCredentials & Record<string, any>;

export interface PlatformIntegration {
  _id: string;
  platformType: PlatformType;
  status: 'active' | 'disconnected' | 'error';
  leadsReceivedCount: number;
  lastSyncAt?: string;
  connectedAt?: string;
  webhookVerifyToken?: string;
  credentials: PlatformCredentials;
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

export interface MessengerConversation {
  thread_id: string;
  psid: string;
  display_name: string;
  snippet: string;
  updated_time: string;
}

export interface MessengerMessage {
  direction: 'inbound' | 'outbound';
  content: string;
  sent_at: string;
}

export const messengerApi = {
  getConversations: () =>
    api.get<{ success: boolean; conversations: MessengerConversation[] }>('/integrations/messages'),

  getThread: (psid: string) =>
    api.get<{ success: boolean; messages: MessengerMessage[] }>(`/integrations/messages/${psid}`),

  sendMessage: (psid: string, text: string) =>
    api.post<{ success: boolean }>('/integrations/messages/send', { psid, text }),
};

export interface CampaignInsights {
  spend: string;
  reach: string;
  impressions: string;
  clicks: string;
  unique_clicks?: string;
  ctr: string;
  unique_ctr?: string;
  cpm?: string;
  cpc?: string;
  cpp?: string;
  frequency?: string;
  actions?: Record<string, string>;
  cost_per_action_type?: Record<string, string>;
  action_values?: Record<string, string>;
  date_start?: string;
  date_stop?: string;
}

export interface AgeInsight {
  age: string;
  spend: string;
  impressions: string;
  clicks: string;
  ctr?: string;
  cpm?: string;
  cpc?: string;
  actions?: Record<string, string>;
}

export interface GenderInsight {
  gender: string;
  spend: string;
  impressions: string;
  clicks: string;
}

export interface PlacementInsight {
  publisher_platform: string;
  platform_position: string;
  spend: string;
  impressions: string;
  clicks: string;
}

export interface CountryInsight {
  country: string;
  spend: string;
  impressions: string;
  clicks: string;
}

export interface DeviceInsight {
  impression_device: string;
  spend: string;
  impressions: string;
  clicks: string;
}

export interface DailyInsight {
  date_start: string;
  date_stop: string;
  spend: string;
  reach: string;
  impressions: string;
  clicks: string;
}

export interface AdCreative {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  image_url?: string;
  thumbnail_url?: string;
  call_to_action_type?: string;
  object_story_spec?: any;
  created_time?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id?: string;
  campaign_id?: string;
  status: string;
  effective_status: string;
  configured_status?: string;
  bid_type?: string;
  preview_shareable_link?: string;
  created_time?: string;
  updated_time?: string;
  creative?: AdCreative | null;
  insights?: CampaignInsights | null;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  effective_status: string;
  configured_status?: string;
  daily_budget?: string | null;
  lifetime_budget?: string | null;
  budget_remaining?: string | null;
  bid_strategy?: string;
  optimization_goal?: string;
  billing_event?: string;
  destination_type?: string;
  promoted_object?: any;
  targeting?: {
    age_min?: number;
    age_max?: number;
    genders?: number[];
    geo_locations?: {
      countries?: string[];
      cities?: Array<{ key: string; name: string }>;
    };
    interests?: Array<{ id: string; name: string }>;
    publisher_platforms?: string[];
  };
  is_dynamic_creative?: boolean;
  learning_stage_info?: any;
  start_time?: string;
  created_time?: string;
  updated_time?: string;
  insights?: CampaignInsights | null;
  ads?: MetaAd[];
}

export interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | string;
  effective_status: string;
  configured_status?: string;
  daily_budget?: string | null;
  lifetime_budget?: string | null;
  budget_remaining?: string | null;
  spend_cap?: string | null;
  bid_strategy?: string;
  buying_type?: string;
  pacing_type?: string[];
  start_time?: string | null;
  stop_time?: string | null;
  created_time?: string;
  updated_time?: string;
  special_ad_categories?: string[];
  issues_info?: any;
  source_campaign_id?: string;
  ad_account_id?: string;
  ad_account_name?: string;
  page_id?: string;
  page_name?: string;
  insights?: CampaignInsights | null;
  insights_by_age?: AgeInsight[];
  insights_by_gender?: GenderInsight[];
  insights_by_placement?: PlacementInsight[];
  insights_by_country?: CountryInsight[];
  insights_by_device?: DeviceInsight[];
  insights_daily?: DailyInsight[];
  adsets?: MetaAdSet[];
}

export interface CreateCampaignPayload {
  name: string;
  objective: string;
  status?: string;
  special_ad_categories?: string[];
  daily_budget?: number;
  lifetime_budget?: number;
  bid_strategy?: string;
  start_time?: string;
  stop_time?: string;
}

export interface CreateAdSetPayload {
  name: string;
  campaign_id: string;
  daily_budget?: number;
  lifetime_budget?: number;
  status?: string;
  targeting?: any;
  bid_amount?: number;
  start_time?: string;
  end_time?: string;
  optimization_goal?: string;
  billing_event?: string;
  promoted_object?: any;
  destination_type?: string;
}

export interface CreateAdCreativePayload {
  name: string;
  image_hash: string;
  message: string;
  headline: string;
  description?: string;
  lead_gen_form_id?: string;
  cta_type?: string;
  link_url?: string;
}

export interface CreateAdPayload {
  name: string;
  adset_id: string;
  creative_id: string;
  status?: string;
}

export const campaignsApi = {
  getCampaigns: (datePreset = 'last_30d') =>
    api.get<{ success: boolean; date_preset: string; campaigns: MetaCampaign[]; accounts?: any[]; error?: string }>(
      `/integrations/campaigns?date_preset=${datePreset}`
    ),

  getCampaignById: (id: string, datePreset = 'last_30d', includeBreakdowns = false) =>
    api.get<{ success: boolean; date_preset: string; campaign: MetaCampaign; error?: string }>(
      `/integrations/campaigns/${id}?date_preset=${datePreset}${includeBreakdowns ? '&include_breakdowns=true' : ''}`
    ),

  createCampaign: (payload: CreateCampaignPayload) =>
    api.post<{ success: boolean; campaign_id: string; error?: string }>('/integrations/campaigns/create', payload),

  updateCampaign: (id: string, payload: Partial<MetaCampaign>) =>
    api.patch<{ success: boolean; updated_campaign_id: string; error?: string }>(`/integrations/campaigns/${id}`, payload),

  deleteCampaign: (id: string) =>
    api.delete<{ success: boolean; deleted_campaign_id: string; error?: string }>(`/integrations/campaigns/${id}`),

  getAdSets: (campaignId?: string) =>
    api.get<{ success: boolean; adsets: MetaAdSet[]; error?: string }>(
      campaignId ? `/integrations/adsets?campaign_id=${campaignId}` : '/integrations/adsets'
    ),

  createAdSet: (payload: CreateAdSetPayload) =>
    api.post<{ success: boolean; adset_id: string; error?: string }>('/integrations/adsets/create', payload),

  updateAdSet: (id: string, payload: Partial<MetaAdSet>) =>
    api.patch<{ success: boolean; updated_adset_id: string; error?: string }>(`/integrations/adsets/${id}`, payload),

  deleteAdSet: (id: string) =>
    api.delete<{ success: boolean; deleted_adset_id: string; error?: string }>(`/integrations/adsets/${id}`),

  uploadAdImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    // Use raw fetch or custom post with multipart
    const token = typeof window !== 'undefined' ? localStorage.getItem('voxa_auth_token_customer') || localStorage.getItem('voxa_auth_token_admin') : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const res = await fetch(`${baseUrl}/integrations/adcreatives/upload-image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return res.json() as Promise<{ success: boolean; image_hash?: string; error?: string }>;
  },

  createAdCreative: (payload: CreateAdCreativePayload) =>
    api.post<{ success: boolean; creative_id: string; error?: string }>('/integrations/adcreatives/create', payload),

  getAdCreatives: () =>
    api.get<{ success: boolean; creatives: AdCreative[]; error?: string }>('/integrations/adcreatives'),

  deleteAdCreative: (id: string) =>
    api.delete<{ success: boolean; deleted_creative_id: string; error?: string }>(`/integrations/adcreatives/${id}`),

  getAds: (adsetId?: string) =>
    api.get<{ success: boolean; ads: MetaAd[]; error?: string }>(
      adsetId ? `/integrations/ads?adset_id=${adsetId}` : '/integrations/ads'
    ),

  createAd: (payload: CreateAdPayload) =>
    api.post<{ success: boolean; ad_id: string; error?: string }>('/integrations/ads/create', payload),

  updateAd: (id: string, payload: Partial<MetaAd>) =>
    api.patch<{ success: boolean; updated_ad_id: string; error?: string }>(`/integrations/ads/${id}`, payload),

  deleteAd: (id: string) =>
    api.delete<{ success: boolean; deleted_ad_id: string; error?: string }>(`/integrations/ads/${id}`),
};

export const integrationsApi = {
  getConfig: (platformType: PlatformType) =>
    api.get<{ success: boolean; data: PlatformIntegration | null }>(`/integrations/config/${platformType}`),

  saveConfig: (platformType: PlatformType, payload: PlatformCredentials) =>
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

export interface AdminOmnichannelStats {
  totalCompanies: number;
  totalActiveIntegrations: number;
  totalErrors: number;
  totalLeadsCaptured: number;
  byPlatform: Record<string, { active: number; error: number; total: number }>;
}

export interface AdminCompanyIntegrationSummary {
  _id: string;
  name: string;
  businessType?: string;
  status: string;
  billingModel?: string;
  createdAt?: string;
  integrations: Array<{
    _id: string;
    platformType: PlatformType;
    status: 'active' | 'disconnected' | 'error';
    leadsReceivedCount: number;
    lastSyncAt?: string;
    connectedAt?: string;
    credentials: PlatformCredentials;
  }>;
}

export const adminIntegrationsApi = {
  getOverview: () =>
    api.get<{
      success: boolean;
      data: {
        stats: AdminOmnichannelStats;
        companies: AdminCompanyIntegrationSummary[];
      };
    }>('/integrations/admin/overview'),

  getCompanyIntegrations: (companyId: string) =>
    api.get<{
      success: boolean;
      data: {
        company: Company;
        integrations: PlatformIntegration[];
      };
    }>(`/integrations/admin/company/${companyId}`),
};

// ── Leads endpoints ───────────────────────────────────────────────────────────

export interface CapturedLead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  form_id: string | null;
  form_name: string | null;
  source?: string | null;
  lead_status?: string;
  status?: string;
  assigned_agent?: string | null;
  created_at: string;
  raw_data?: any;
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

  addSingleLead: (payload: { fullName?: string; email?: string; phone?: string; formName?: string }) =>
    api.post<{ success: boolean; message: string; lead: CapturedLead }>('/leads/single', payload),

  importCsvLeads: (payload: { formName?: string; leads: Array<{ fullName?: string; email?: string; phone?: string }> }) =>
    api.post<{ success: boolean; message: string; count: number; form_name: string }>('/leads/csv', payload),
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

export const ordersApi = {
  list: () => api.get<ApiSuccess<Order[]>>('/orders'),
  getById: (id: string) => api.get<ApiSuccess<Order>>(`/orders/${id}`),
  create: (payload: CreateOrderPayload) => api.post<ApiSuccess<Order>>('/orders', payload),
  update: (id: string, payload: Partial<CreateOrderPayload>) => api.patch<ApiSuccess<Order>>(`/orders/${id}`, payload),
  delete: (id: string) => api.delete<ApiSuccess<null>>(`/orders/${id}`),
};

// ── DID endpoints ─────────────────────────────────────────────────────────────

export interface DidAssignedUser {
  _id: string;
  fullName?: string;
  email?: string;
  roleId?: {
    _id: string;
    name: string;
  } | string;
}

export interface Did {
  _id: string;
  did_number: string;
  label: string;
  notes: string;
  status: 'available' | 'assigned' | 'released';
  company_id: { _id: string; name: string; status: string } | null;
  assigned_user_id?: DidAssignedUser | null;
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

// Admin & Company DID API
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
  assignUserToMine: (didId: string, user_id: string | null) =>
    api.patch<ApiSuccess<Did>>(`/dids/company/mine/${didId}/assign-user`, { user_id }),
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

// ─── CRM Call Recording Pipeline & Telephony Types ───────────────────────────

export interface TranscriptSegment {
  speaker: string;
  start_time: number;
  end_time: number;
  text: string;
  language?: string | null;
}

export interface Transcript {
  segments: TranscriptSegment[];
  full_text: string;
}

export type CallOutcome =
  | 'interested'
  | 'not_interested'
  | 'follow_up_required'
  | 'converted'
  | 'complaint'
  | 'other';

export type CallSentiment = 'positive' | 'neutral' | 'negative';

export interface CallSummary {
  outcome: CallOutcome;
  sentiment: CallSentiment;
  caller_intent: string;
  key_points: string[];
  action_items: string[];
  topics_discussed: string[];
  language_notes?: string | null;
}

export interface ProcessResult {
  call_id: string;
  transcript: Transcript;
  summary: CallSummary;
}

export interface SummarizeResult {
  call_id: string;
  summary: CallSummary;
}

export interface TranscribeResult {
  call_id: string;
  transcript: Transcript;
}

export interface CallAnalysisRecord {
  _id?: string;
  call_id: string;
  uniqueid?: string;
  callerid?: string;
  destination?: string;
  recording_filename?: string | null;
  recording_url?: string | null;
  script?: 'urdu' | 'roman_urdu' | 'mixed';
  transcript: Transcript;
  summary: CallSummary;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const telephonyApi = {
  getCompanyCallLogs: () => {
    return api.get<ApiSuccess<{ logs: any[]; isCompanyAdmin: boolean; roleName: string }>>('/telephony/company/logs');
  },

  getAdminMasterLogs: (companyId?: string) => {
    const qs = companyId && companyId !== 'all' ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return api.get<ApiSuccess<{ logs: any[]; totalAll: number; totalFiltered: number }>>(`/telephony/admin/logs${qs}`);
  },

  checkRecording: (params: { uniqueid?: string; phone?: string; filename?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<ApiSuccess<{ exists: boolean; uniqueid?: string; filename?: string; stream_url: string }>>(`/telephony/recordings/check?${qs}`);
  },

  getRecordingStreamUrl: (params: { uniqueid?: string; phone?: string; filename?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return `${BASE}/telephony/recordings/stream?${qs}`;
  },

  getCallAnalysis: (callId: string) => {
    return api.get<ApiSuccess<CallAnalysisRecord>>(`/telephony/calls/${encodeURIComponent(callId)}/analysis`);
  },

  processCall: (payload: {
    call_id: string;
    uniqueid?: string;
    phone?: string;
    filename?: string;
    audio_url?: string;
    script?: 'urdu' | 'roman_urdu' | 'mixed';
    force?: boolean;
  }) => {
    return api.post<ApiSuccess<CallAnalysisRecord>>('/telephony/calls/process', payload);
  },

  transcribeCall: (payload: {
    call_id: string;
    uniqueid?: string;
    phone?: string;
    filename?: string;
    audio_url?: string;
    script?: 'urdu' | 'roman_urdu' | 'mixed';
  }) => {
    return api.post<ApiSuccess<TranscribeResult>>('/telephony/calls/transcribe', payload);
  },

  summarizeCall: (payload: {
    call_id: string;
    uniqueid?: string;
    phone?: string;
    filename?: string;
    audio_url?: string;
  }) => {
    return api.post<ApiSuccess<SummarizeResult>>('/telephony/calls/summarize', payload);
  },

  getCallNotes: (callId: string) => {
    return api.get<ApiSuccess<CallNoteRecord[]>>(`/telephony/notes/${encodeURIComponent(callId)}`);
  },

  addCallNote: (callId: string, note: string) => {
    return api.post<ApiSuccess<CallNoteRecord>>(`/telephony/notes/${encodeURIComponent(callId)}`, { note });
  },
};

export interface CallNoteRecord {
  _id: string;
  companyId: string;
  callId: string;
  userId: string;
  authorName: string;
  note: string;
  createdAt: string;
}



