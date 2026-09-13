// ─── Shared Types for VOXA CRM ─────────────────────────────────────────────

export type Portal = 'admin' | 'customer';

export interface AuthUser {
  userId: string;
  email: string;
  fullName?: string;
  portal: Portal;
  companyId?: string | null;
  businessType?: string | null;
  roleId?: string | null;
  permissions: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── API Response Wrappers ──────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  status: 'success';
  message: string;
  data: T;
}

export interface ApiError {
  status: 'error';
  message: string;
}

// ─── Company ────────────────────────────────────────────────────────────────

export type CompanyStatus = 'active' | 'suspended' | 'pending';
export type BillingModel = 'prepaid' | 'postpaid';

export interface Company {
  _id: string;
  name: string;
  businessType: string;
  status: CompanyStatus;
  billingModel: BillingModel;
  aiReceptionistEnabled: boolean;
  bulkAiCallingEnabled: boolean;
  maxConcurrentCalls: number;
  forceHalt: boolean;
  stripeCustomerId?: string;
  createdBy?: string;
  createdAt: string;
  tenant?: TenantInfo;
  billing?: unknown; // Could be PrepaidBilling or PostpaidBilling
}

export interface TenantInfo {
  _id?: string;
  tenant_id: string;
  region: string;
  province: string;
  address: string;
  contact_name: string;
  contact_email: string;
  is_active?: boolean;
}

export interface Plan {
  _id: string;
  name: string;
  type: BillingModel;
  duration_type: 'monthly' | 'pay-as-you-go';
  cost: number;
  tokens: number;
  ai_receptionist: boolean;
  bulk_ai_calling: boolean;
  max_agents?: number;
  max_concurrent_calls?: number;
  is_custom: boolean;
  is_active: boolean;
  description: string;
}

export interface CreateCompanyPayload {
  name: string;
  businessType: string;
  billingModel: BillingModel;
  adminEmail: string;
  adminFullName: string;
  maxConcurrentCalls?: number;
  aiReceptionistEnabled?: boolean;
  bulkAiCallingEnabled?: boolean;
  forceHalt?: boolean;
  planId: string;
  tenant: TenantInfo;
}

// ─── Admin Users (Voxa staff / super_admins) ────────────────────────────────

export type AdminUserStatus = 'active' | 'inactive';

export interface AdminUser {
  _id: string;
  email: string;
  fullName: string;
  roleId?: string | Role | null;
  isActive: boolean;
  twoFaEnabled: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface CreateAdminUserPayload {
  email: string;
  fullName: string;
  password: string;
  roleId?: string;
}

// ─── Company Users ──────────────────────────────────────────────────────────

export type CompanyUserStatus = 'active' | 'suspended' | 'inactive';

export interface CompanyUser {
  _id: string;
  companyId: string;
  email: string;
  fullName: string;
  username?: string;
  phoneNumber?: string;
  status: CompanyUserStatus;
  roleId?: string | Role | null;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface CreateCompanyUserPayload {
  email: string;
  fullName: string;
  password: string;
  username?: string;
  phoneNumber?: string;
  roleId?: string;
  status?: CompanyUserStatus;
}

// ─── Roles ──────────────────────────────────────────────────────────────────

export type RoleStatus = 'active' | 'inactive';

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  description?: string;
  status: RoleStatus;
  createdAt?: string;
}

export interface CreateRolePayload {
  name: string;
  permissions: string[];
  description?: string;
}

// ─── Permissions ────────────────────────────────────────────────────────────

export const PERMISSION_LIST = [
  // Companies
  'companies:create',
  'companies:read',
  'companies:update',
  'companies:delete',
  // Users
  'users:create',
  'users:read',
  'users:update',
  'users:delete',
  // Roles
  'roles:create',
  'roles:read',
  'roles:update',
  'roles:delete',
  // Permissions
  'permissions:create',
  'permissions:read',
  'permissions:update',
  'permissions:delete',
  // Billing
  'billing:read',
  'billing:update',
  'billing:export',
  // DID
  'did:create',
  'did:read',
  'did:update',
  'did:delete',
  // Calls
  'calls:read',
  'calls:export',
  // Agents
  'agents:create',
  'agents:read',
  'agents:update',
  'agents:delete',
  // Campaigns
  'campaigns:create',
  'campaigns:read',
  'campaigns:update',
  'campaigns:delete',
  // Reports
  'reports:read',
  'reports:export',
] as const;

export type Permission = (typeof PERMISSION_LIST)[number];

// %%% Orders %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

export interface OrderItem {
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id: string;
  companyId: string;
  customerDetails: { name: string; email?: string; phone?: string };
  shippingDetails?: { address?: string; city?: string; state?: string; zip?: string; country?: string; method?: string };
  shippingDate?: string;
  deliveryDate?: string;
  items?: OrderItem[];
  pricing: { subtotal: number; tax?: number; shippingCost?: number; totalAmount: number };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}

export interface CreateOrderPayload {
  customerDetails: { name: string; email?: string; phone?: string };
  shippingDetails?: { address?: string; city?: string; state?: string; zip?: string; country?: string; method?: string };
  shippingDate?: string;
  deliveryDate?: string;
  items?: OrderItem[];
  pricing?: { subtotal?: number; tax?: number; shippingCost?: number; totalAmount?: number };
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}
