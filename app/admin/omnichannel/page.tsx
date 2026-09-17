'use client';

// ─── Super Admin Omnichannel Hub ───────────────────────────────────────────────
// /admin/omnichannel — Live Platform-wide channel adoption, integration health,
// and real-time company-specific configuration drill-down.

import { useState, useEffect, useCallback } from 'react';
import {
  Layers, MessageSquare, Mail, Phone, Globe, CheckCircle2,
  XCircle, AlertCircle, Building2, Users, Activity, Wifi, WifiOff,
  ChevronRight, Search, Filter, RefreshCw, ShoppingBag, Package,
  ArrowLeft, Copy, Zap, Info, Calendar, Database, Eye, ExternalLink,
  ChevronDown
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { hasPermission } from '@/lib/auth';
import {
  adminIntegrationsApi,
  type AdminOmnichannelStats,
  type AdminCompanyIntegrationSummary,
  type PlatformIntegration,
  type PlatformType
} from '@/lib/api';
import type { Company } from '@/lib/types';

// ── Channel definitions ─────────────────────────────────────────────────────

interface ChannelDef {
  key: PlatformType;
  label: string;
  category: 'eCommerce' | 'Marketing' | 'Messaging' | 'Telecom';
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
  description: string;
}

const ALL_CHANNELS: ChannelDef[] = [
  { key: 'shopify',  label: 'Shopify',   category: 'eCommerce', color: '#008060', bg: '#ecfdf5', border: '#a7f3d0', icon: ShoppingBag,   description: 'Store sync & order webhooks' },
  { key: 'daraz',    label: 'Daraz',     category: 'eCommerce', color: '#f85606', bg: '#fff7ed', border: '#fed7aa', icon: Package,       description: 'Seller Center marketplace sync' },
  { key: 'meta',     label: 'Meta',      category: 'Marketing', color: '#1877F2', bg: '#e7f0fd', border: '#bfdbfe', icon: MessageSquare, description: 'Lead Ads & Webhook leads' },
  { key: 'whatsapp', label: 'WhatsApp',  category: 'Messaging', color: '#25D366', bg: '#f0fdf4', border: '#bbf7d0', icon: MessageSquare, description: 'Cloud API customer messaging' },
  { key: 'sms',      label: 'SMS',       category: 'Telecom',   color: '#0f8f7a', bg: '#f0fdf9', border: '#99f6e4', icon: Phone,         description: 'Transactional SMS & OTPs' },
  { key: 'email',    label: 'Email',     category: 'Marketing', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: Mail,          description: 'SMTP & marketing notifications' },
];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:5000';

export default function AdminOmnichannelPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminOmnichannelStats | null>(null);
  const [companies, setCompanies] = useState<AdminCompanyIntegrationSummary[]>([]);
  
  // Drill-down state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedCompanyData, setSelectedCompanyData] = useState<{
    company: Company;
    integrations: PlatformIntegration[];
  } | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  // ── Load Platform-wide Overview ───────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminIntegrationsApi.getOverview();
      if (res.data) {
        setStats(res.data.stats);
        setCompanies(res.data.companies);
      }
    } catch (err) {
      console.error('Failed to load admin omnichannel overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load Specific Company Details ─────────────────────────────────────────
  const loadCompanyDetails = useCallback(async (companyId: string) => {
    if (companyId === 'all') {
      setSelectedCompanyData(null);
      return;
    }
    setCompanyLoading(true);
    try {
      const res = await adminIntegrationsApi.getCompanyIntegrations(companyId);
      if (res.data) {
        setSelectedCompanyData(res.data);
      }
    } catch (err) {
      console.error('Failed to load company integrations:', err);
      setSelectedCompanyData(null);
    } finally {
      setCompanyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (selectedCompanyId !== 'all') {
      loadCompanyDetails(selectedCompanyId);
    } else {
      setSelectedCompanyData(null);
    }
  }, [selectedCompanyId, loadCompanyDetails]);

  // ── Filtered companies in Matrix ──────────────────────────────────────────
  const filteredCompanies = companies.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (filterType !== 'all' && (c.businessType || 'other') !== filterType) {
      return false;
    }

    if (filterChannel !== 'all') {
      const hasActive = c.integrations?.some(
        (i) => i.platformType === filterChannel && i.status === 'active'
      );
      if (!hasActive) return false;
    }

    return true;
  });

  if (!hasPermission('integrations:read')) {
    return (
      <div>
        <AdminHeader
          title="Omnichannel"
          subtitle="Platform-wide channel adoption, integration health & company configs"
          onMenuClick={() => {}}
        />
        <AccessDenied module="Omnichannel & Integrations" requiredPermission="integrations:read" portal="admin" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Omnichannel"
        subtitle="Platform-wide channel adoption, integration health & company configs"
        onMenuClick={() => {}}
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-outline flex items-center gap-1.5 text-xs bg-white"
              onClick={() => {
                if (selectedCompanyId === 'all') {
                  loadOverview();
                } else {
                  loadCompanyDetails(selectedCompanyId);
                }
              }}
            >
              <RefreshCw size={13} className={loading || companyLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      <div className="px-6 py-6 space-y-6 max-w-7xl">

        {/* ── Top Bar: Company Selector & Quick Switcher ─────────────────── */}
        <div className="card p-4 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Building2 size={20} className="text-teal-400" />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium uppercase tracking-wider">
                Viewing Scope
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {selectedCompanyId === 'all'
                  ? 'All Companies (Platform-Wide View)'
                  : selectedCompanyData?.company?.name || 'Loading Company…'}
                {selectedCompanyData?.company?.businessType && (
                  <span className="chip chip-blue text-[10px] uppercase font-mono py-0">
                    {selectedCompanyData.company.businessType}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300 font-medium whitespace-nowrap">
              Select Company:
            </label>
            <div className="relative">
              <select
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium cursor-pointer"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="all">🌐 All Companies (Global Overview)</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    🏢 {c.name} {c.businessType ? `[${c.businessType}]` : ''} ({c.integrations?.filter(i => i.status === 'active').length || 0} active)
                  </option>
                ))}
              </select>
            </div>

            {selectedCompanyId !== 'all' && (
              <button
                className="btn-outline text-xs text-white border-slate-600 hover:bg-white/10 ml-2"
                onClick={() => setSelectedCompanyId('all')}
              >
                <ArrowLeft size={13} className="mr-1" />
                Back to All
              </button>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: COMPANY-SPECIFIC DRILL-DOWN VIEW                          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {selectedCompanyId !== 'all' ? (
          companyLoading ? (
            <div className="card flex items-center justify-center py-20 text-slate-400">
              <RefreshCw size={24} className="animate-spin mr-2" /> Loading company integration details…
            </div>
          ) : !selectedCompanyData ? (
            <div className="card p-12 text-center text-slate-500">
              Company integrations could not be found.
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Company Summary Banner */}
              <div className="card p-5 border-l-4 border-l-teal-500 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-800">
                      {selectedCompanyData.company.name}
                    </h2>
                    <span className="chip chip-blue uppercase text-xs">
                      {selectedCompanyData.company.businessType || 'other'}
                    </span>
                    <span className={`chip ${selectedCompanyData.company.status === 'active' ? 'chip-green' : 'chip-red'}`}>
                      {selectedCompanyData.company.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>Billing: <strong className="text-slate-700 uppercase">{selectedCompanyData.company.billingModel || 'prepaid'}</strong></span>
                    <span>Created: <strong className="text-slate-700">{selectedCompanyData.company.createdAt ? new Date(selectedCompanyData.company.createdAt).toLocaleDateString() : '—'}</strong></span>
                    <span>Total Connected Channels: <strong className="text-teal-600">{selectedCompanyData.integrations.filter(i => i.status === 'active').length}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Company ID</div>
                  <div className="font-mono text-xs text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg mt-0.5">
                    {selectedCompanyData.company._id}
                  </div>
                </div>
              </div>

              {/* Configured Integrations Grid */}
              <div>
                <div className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers size={16} className="text-teal-600" />
                  <span>Configured Platforms ({selectedCompanyData.integrations.length})</span>
                </div>

                {selectedCompanyData.integrations.length === 0 ? (
                  <div className="card p-10 text-center text-slate-400">
                    <WifiOff size={32} className="mx-auto mb-2 opacity-50" />
                    <div className="font-semibold text-slate-700">No platforms connected yet</div>
                    <p className="text-xs text-slate-400 mt-1">This company has not configured any integration channels.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCompanyData.integrations.map((intg) => {
                      const channelDef = ALL_CHANNELS.find(ch => ch.key === intg.platformType) || {
                        key: intg.platformType,
                        label: intg.platformType.toUpperCase(),
                        color: '#64748b',
                        bg: '#f8fafc',
                        border: '#e2e8f0',
                        icon: Globe,
                        description: 'Custom Platform'
                      };
                      const Icon = channelDef.icon;

                      return (
                        <div
                          key={intg._id}
                          className="card p-5 border-2 relative overflow-hidden"
                          style={{ borderColor: channelDef.border }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: channelDef.bg }}
                              >
                                <Icon size={20} style={{ color: channelDef.color }} />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 text-sm">
                                  {channelDef.label} Integration
                                </h3>
                                <span className="text-xs text-slate-500">{channelDef.description}</span>
                              </div>
                            </div>
                            <span className={`chip ${intg.status === 'active' ? 'chip-green' : intg.status === 'error' ? 'chip-red' : 'chip-gray'}`}>
                              {intg.status === 'active' ? <CheckCircle2 size={11} className="mr-1 inline" /> : null}
                              {intg.status}
                            </span>
                          </div>

                          {/* Specific Platform Details */}
                          <div className="bg-slate-50/80 rounded-xl p-3 text-xs space-y-2 border border-slate-100 font-mono">
                            {intg.platformType === 'shopify' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Shop Domain:</span>
                                  <span className="font-semibold text-slate-800">{intg.credentials?.shopifyShopUrl || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">API Version:</span>
                                  <span className="text-slate-700">{intg.credentials?.shopifyApiVersion || '2024-04'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Access Token:</span>
                                  <span className="text-slate-700">{intg.credentials?.shopifyAccessToken || '••••••••'}</span>
                                </div>
                              </>
                            )}

                            {intg.platformType === 'daraz' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Shop Name:</span>
                                  <span className="font-semibold text-slate-800">{intg.credentials?.darazShopName || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Seller ID:</span>
                                  <span className="text-slate-700">{intg.credentials?.darazSellerId || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Marketplace Region:</span>
                                  <span className="chip chip-blue text-[10px] py-0">{intg.credentials?.darazRegion || 'PK'}</span>
                                </div>
                              </>
                            )}

                            {intg.platformType === 'meta' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Page ID:</span>
                                  <span className="font-semibold text-slate-800">{intg.credentials?.metaPageId || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">App ID:</span>
                                  <span className="text-slate-700">{intg.credentials?.metaAppId || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Ad Account:</span>
                                  <span className="text-slate-700">{intg.credentials?.metaAdAccountId || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Leads Captured:</span>
                                  <span className="font-bold text-teal-600">{intg.leadsReceivedCount || 0}</span>
                                </div>
                              </>
                            )}

                            {intg.platformType === 'whatsapp' && (
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">Phone Number ID:</span>
                                <span className="text-slate-700">{intg.credentials?.whatsappPhoneNumberId || '—'}</span>
                              </div>
                            )}

                            {intg.platformType === 'sms' && (
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">Sender ID:</span>
                                <span className="text-slate-700">{intg.credentials?.smsSenderId || '—'}</span>
                              </div>
                            )}

                            {intg.platformType === 'email' && (
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">SMTP Host:</span>
                                <span className="text-slate-700">{intg.credentials?.smtpHost || '—'}</span>
                              </div>
                            )}
                          </div>

                          {/* Webhook URLs & Metadata */}
                          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
                            <span>Connected: <strong className="text-slate-700">{intg.connectedAt ? new Date(intg.connectedAt).toLocaleDateString() : '—'}</strong></span>
                            {intg.webhookVerifyToken && (
                              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                                <span>Token: {intg.webhookVerifyToken.slice(0, 14)}…</span>
                                <button
                                  className="text-teal-600 hover:text-teal-800"
                                  onClick={() => copyToClipboard(intg.webhookVerifyToken!, `tok-${intg._id}`)}
                                >
                                  {copiedKey === `tok-${intg._id}` ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* ═════════════════════════════════════════════════════════════════ */
          /* VIEW 2: GLOBAL PLATFORM OVERVIEW (ALL COMPANIES)                  */
          /* ═════════════════════════════════════════════════════════════════ */
          <div className="space-y-6 animate-fade-in">
            {/* ── 4 Key Metric Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Companies */}
              <div className="kpi relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-50">
                    <Building2 size={20} strokeWidth={1.75} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Registered
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 tabular-nums text-slate-800">
                  {loading ? '—' : stats?.totalCompanies ?? companies.length}
                </div>
                <div className="text-slate-500 text-xs font-medium">Total Companies on Platform</div>
              </div>

              {/* Active Integrations */}
              <div className="kpi relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-50">
                    <CheckCircle2 size={20} strokeWidth={1.75} className="text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Active & Healthy
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 tabular-nums text-emerald-600">
                  {loading ? '—' : stats?.totalActiveIntegrations ?? 0}
                </div>
                <div className="text-slate-500 text-xs font-medium">Connected Channels</div>
              </div>

              {/* Total Leads / Events Synced */}
              <div className="kpi relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-teal-50">
                    <Zap size={20} strokeWidth={1.75} className="text-teal-600" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                    Captured
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 tabular-nums text-teal-600">
                  {loading ? '—' : stats?.totalLeadsCaptured ?? 0}
                </div>
                <div className="text-slate-500 text-xs font-medium">Total Captured Leads/Events</div>
              </div>

              {/* Errors */}
              <div className="kpi relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-red-50">
                    <AlertCircle size={20} strokeWidth={1.75} className="text-red-600" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Needs Action
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 tabular-nums text-red-600">
                  {loading ? '—' : stats?.totalErrors ?? 0}
                </div>
                <div className="text-slate-500 text-xs font-medium">Integration Issues / Errors</div>
              </div>
            </div>

            {/* ── Channel Adoption Breakdown ─────────────────────────────── */}
            <div className="card">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <Layers size={15} strokeWidth={1.75} className="text-slate-400" />
                <h2 className="font-semibold text-slate-800 text-sm">Channel Adoption Overview</h2>
                <span className="ml-auto text-xs text-slate-400">
                  Live across {companies.length} registered companies
                </span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {ALL_CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const platformStat = stats?.byPlatform?.[ch.key] || { active: 0, error: 0, total: 0 };
                  const activeCount = platformStat.active;
                  const errorCount = platformStat.error;
                  const totalCompanies = companies.length || 1;
                  const pct = Math.round((activeCount / totalCompanies) * 100);

                  return (
                    <div
                      key={ch.key}
                      className="rounded-xl p-4 flex flex-col justify-between border transition-all duration-150"
                      style={{ background: ch.bg, borderColor: ch.border }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${ch.color}22` }}
                          >
                            <Icon size={16} strokeWidth={1.75} style={{ color: ch.color }} />
                          </div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/70 text-slate-600 uppercase font-mono">
                            {ch.category}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 text-sm">{ch.label}</div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{ch.description}</div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-200/50">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-medium">
                            <strong className="text-slate-800">{activeCount}</strong> active
                          </span>
                          <span className="font-bold" style={{ color: ch.color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: ch.color }}
                          />
                        </div>
                        {errorCount > 0 && (
                          <div className="text-[10px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {errorCount} with errors
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Per-Company Channel Matrix ─────────────────────────────── */}
            <div className="card">
              <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} strokeWidth={1.75} className="text-slate-500" />
                  <h2 className="font-semibold text-slate-800 text-sm">Company Integration Matrix</h2>
                  <span className="chip chip-gray text-xs">{filteredCompanies.length} companies</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className="input pl-7 text-xs"
                      style={{ width: 170, padding: '0.4rem 0.7rem 0.4rem 2rem' }}
                      placeholder="Search company…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Business Type filter */}
                  <select
                    className="select text-xs"
                    style={{ width: 130, padding: '0.35rem 0.6rem' }}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="ecommerce">eCommerce</option>
                    <option value="hospital">Hospital</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Channel filter */}
                  <select
                    className="select text-xs"
                    style={{ width: 130, padding: '0.35rem 0.6rem' }}
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                  >
                    <option value="all">All Channels</option>
                    {ALL_CHANNELS.map((ch) => (
                      <option key={ch.key} value={ch.key}>{ch.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="px-4 py-16 text-center text-slate-400 text-sm">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
                  Loading company integrations…
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="px-4 py-16 text-center text-slate-400 text-sm">
                  No companies match the current search / filter criteria.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Type</th>
                        {ALL_CHANNELS.map((ch) => (
                          <th key={ch.key} style={{ textAlign: 'center' }}>
                            <span style={{ color: ch.color }}>{ch.label}</span>
                          </th>
                        ))}
                        <th style={{ textAlign: 'center' }}>Active</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.map((c) => {
                        const activeIntegrations = c.integrations?.filter(i => i.status === 'active') || [];
                        const activeCount = activeIntegrations.length;

                        return (
                          <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                            <td>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 font-bold text-xs">
                                  {c.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                                  <div className="text-[11px] text-slate-400">{c.billingModel || 'prepaid'}</div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="chip chip-blue uppercase text-[10px] font-mono">
                                {c.businessType || 'other'}
                              </span>
                            </td>

                            {/* Channel status columns */}
                            {ALL_CHANNELS.map((ch) => {
                              const intg = c.integrations?.find((x) => x.platformType === ch.key);
                              const isConnected = intg?.status === 'active';
                              const isError = intg?.status === 'error';

                              return (
                                <td key={ch.key} style={{ textAlign: 'center' }}>
                                  {isConnected ? (
                                    <span
                                      className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-100 text-emerald-600"
                                      title={`Connected (${ch.label})`}
                                    >
                                      <CheckCircle2 size={14} />
                                    </span>
                                  ) : isError ? (
                                    <span
                                      className="inline-flex items-center justify-center p-1 rounded-full bg-red-100 text-red-600"
                                      title="Error"
                                    >
                                      <XCircle size={14} />
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-center p-1 rounded-full text-slate-300"
                                      title="Not Configured"
                                    >
                                      <WifiOff size={13} />
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            <td style={{ textAlign: 'center' }}>
                              <span
                                className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                                style={{
                                  background: activeCount >= 2 ? '#ecfdf5' : '#f8fafc',
                                  color: activeCount >= 2 ? '#059669' : '#64748b'
                                }}
                              >
                                {activeCount} / {ALL_CHANNELS.length}
                              </span>
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn-outline text-xs text-teal-600 border-teal-200 hover:bg-teal-50 py-1 px-2.5"
                                onClick={() => setSelectedCompanyId(c._id)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legend */}
              <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center gap-5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Active / Connected
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle size={13} className="text-red-500" />
                  Error / Issues
                </div>
                <div className="flex items-center gap-1.5">
                  <WifiOff size={13} className="text-slate-300" />
                  Not Configured
                </div>
                <div className="ml-auto text-slate-400 text-[11px]">
                  Click "View Details" or use the top selector to inspect specific credentials & webhooks.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
