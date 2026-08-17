'use client';

// ─── Admin Omnichannel Overview ───────────────────────────────────────────────
// /admin/omnichannel — Platform-wide channel adoption & integration health.
// Shows which companies have which channels enabled, integration statuses,
// and global aggregated channel activity.

import { useState, useEffect } from 'react';
import {
  Layers, MessageSquare, Mail, Phone, Globe, CheckCircle2,
  XCircle, AlertCircle, Building2, Users, Activity, Wifi, WifiOff,
  ChevronRight, Search, Filter, RefreshCw
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { companiesApi } from '@/lib/api';
import type { Company } from '@/lib/types';

// ── Channel definitions ─────────────────────────────────────────────────────

interface Channel {
  key: string;
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  description: string;
}

const CHANNELS: Channel[] = [
  { key: 'whatsapp', label: 'WhatsApp',  color: '#25D366', bg: '#f0fdf4', icon: MessageSquare, description: 'Business API messaging' },
  { key: 'sms',      label: 'SMS',       color: '#3b82f6', bg: '#eff6ff', icon: Phone,         description: 'Bulk & transactional SMS' },
  { key: 'email',    label: 'Email',     color: '#f59e0b', bg: '#fffbeb', icon: Mail,          description: 'SMTP / API email delivery' },
  { key: 'webchat',  label: 'Web Chat',  color: '#8b5cf6', bg: '#f5f3ff', icon: Globe,         description: 'Embedded site widget' },
  { key: 'meta',     label: 'Meta',      color: '#1877F2', bg: '#eff6ff', icon: MessageSquare, description: 'Facebook & Instagram DMs' },
];

// ── Mock platform-level stats ───────────────────────────────────────────────
// In production these would come from a real endpoint.

interface PlatformStat {
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}

// ── Simulated per-company channel data ─────────────────────────────────────

type ChannelStatus = 'active' | 'inactive' | 'error';

interface CompanyChannel {
  channel: string;
  status: ChannelStatus;
  numbers?: number;
}

interface EnrichedCompany extends Company {
  channels: CompanyChannel[];
}

function mockChannels(seed: number): CompanyChannel[] {
  const all = ['whatsapp', 'sms', 'email', 'webchat', 'meta'];
  const statuses: ChannelStatus[] = ['active', 'inactive', 'error'];
  return all.map((ch, i) => ({
    channel: ch,
    status: statuses[(seed + i) % 3] as ChannelStatus,
    numbers: statuses[(seed + i) % 3] === 'active' ? ((seed + i) % 5) + 1 : 0,
  }));
}

export default function AdminOmnichannelPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await companiesApi.list();
        setCompanies(res.data ?? []);
      } catch {
        // silently fallback to empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Enrich with mock channel data
  const enriched: EnrichedCompany[] = companies.map((c, i) => ({
    ...c,
    channels: mockChannels(i),
  }));

  // Platform stats derived from enriched data
  const totalActive = enriched.reduce(
    (acc, c) => acc + c.channels.filter((ch) => ch.status === 'active').length, 0
  );
  const totalErrors = enriched.reduce(
    (acc, c) => acc + c.channels.filter((ch) => ch.status === 'error').length, 0
  );
  const companiesWithWhatsApp = enriched.filter((c) =>
    c.channels.find((ch) => ch.channel === 'whatsapp' && ch.status === 'active')
  ).length;

  const platformStats: PlatformStat[] = [
    {
      label: 'Total Companies',
      value: String(companies.length),
      sub: 'On platform',
      color: '#3b82f6',
      bg: '#eff6ff',
      icon: Building2,
    },
    {
      label: 'Active Integrations',
      value: String(totalActive),
      sub: 'Across all channels',
      color: '#0f8f7a',
      bg: '#f0fdf9',
      icon: Activity,
    },
    {
      label: 'Integration Errors',
      value: String(totalErrors),
      sub: 'Need attention',
      color: '#ef4444',
      bg: '#fef2f2',
      icon: AlertCircle,
    },
    {
      label: 'WhatsApp Enabled',
      value: String(companiesWithWhatsApp),
      sub: 'Companies with WA',
      color: '#25D366',
      bg: '#f0fdf4',
      icon: MessageSquare,
    },
  ];

  // Channel adoption summary
  const channelAdoption = CHANNELS.map((ch) => {
    const active = enriched.filter(
      (c) => c.channels.find((x) => x.channel === ch.key && x.status === 'active')
    ).length;
    const error = enriched.filter(
      (c) => c.channels.find((x) => x.channel === ch.key && x.status === 'error')
    ).length;
    return { ...ch, activeCount: active, errorCount: error };
  });

  // Filter companies
  const filtered = enriched.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterChannel === 'all') return true;
    return c.channels.find((ch) => ch.channel === filterChannel && ch.status === 'active');
  });

  function statusIcon(s: ChannelStatus) {
    if (s === 'active')   return <CheckCircle2 size={14} className="text-green-500" />;
    if (s === 'error')    return <XCircle      size={14} className="text-red-500" />;
    return                       <WifiOff      size={14} className="text-slate-300" />;
  }

  function statusChip(s: ChannelStatus) {
    if (s === 'active')   return 'chip chip-green';
    if (s === 'error')    return 'chip chip-red';
    return                       'chip chip-gray';
  }

  return (
    <div>
      <AdminHeader
        title="Omnichannel"
        subtitle="Platform-wide channel coverage & integration health"
        onMenuClick={() => {}}
        actions={
          <button
            className="btn-outline flex items-center gap-1.5 text-xs"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        }
      />

      <div className="px-6 py-6 space-y-6">

        {/* ── Platform KPIs ─────────────────────────────────────────── */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}
        >
          {platformStats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="kpi relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: s.bg }}>
                    <Icon size={20} strokeWidth={1.75} style={{ color: s.color }} />
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${s.color}18`, color: s.color }}
                  >
                    {s.sub}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 tabular-nums" style={{ color: s.color }}>
                  {loading ? '—' : s.value}
                </div>
                <div className="text-slate-500 text-sm font-medium">{s.label}</div>
                <div
                  className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.06]"
                  style={{ background: s.color }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Channel Adoption Breakdown ─────────────────────────────── */}
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Layers size={15} strokeWidth={1.75} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800 text-sm">Channel Adoption Overview</h2>
            <span className="ml-auto text-xs text-slate-400">Across all {companies.length} companies</span>
          </div>
          <div className="p-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {channelAdoption.map((ch) => {
              const Icon = ch.icon;
              const pct = companies.length > 0
                ? Math.round((ch.activeCount / companies.length) * 100)
                : 0;
              return (
                <div
                  key={ch.key}
                  className="rounded-xl p-4 flex flex-col gap-3 border border-slate-100"
                  style={{ background: ch.bg }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${ch.color}22` }}
                    >
                      <Icon size={18} strokeWidth={1.75} style={{ color: ch.color }} />
                    </div>
                    {ch.errorCount > 0 && (
                      <span className="chip chip-red text-[10px]">
                        {ch.errorCount} error{ch.errorCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{ch.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{ch.description}</div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>{ch.activeCount} companies</span>
                      <span className="font-semibold" style={{ color: ch.color }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/60 overflow-hidden border border-white/40">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: ch.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Per-Company Channel Matrix ─────────────────────────────── */}
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 size={15} strokeWidth={1.75} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800 text-sm">Company Channel Matrix</h2>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-7 text-xs"
                  style={{ width: 180, padding: '0.4rem 0.7rem 0.4rem 2rem' }}
                  placeholder="Search company…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Channel filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={12} className="text-slate-400" />
                <select
                  className="select text-xs"
                  style={{ width: 130, padding: '0.35rem 0.6rem' }}
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                >
                  <option value="all">All channels</option>
                  {CHANNELS.map((ch) => (
                    <option key={ch.key} value={ch.key}>{ch.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-400 text-sm">
              No companies match the filter.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Status</th>
                    {CHANNELS.map((ch) => (
                      <th key={ch.key} style={{ textAlign: 'center' }}>
                        <span style={{ color: ch.color }}>{ch.label}</span>
                      </th>
                    ))}
                    <th>Active Ch.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const activeCount = c.channels.filter((ch) => ch.status === 'active').length;
                    return (
                      <tr key={c._id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Building2 size={13} strokeWidth={1.75} className="text-slate-500" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800 text-sm">{c.name}</div>
                              <div className="text-xs text-slate-400">{c.billingModel ?? '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`chip ${
                            c.status === 'active' ? 'chip-green' :
                            c.status === 'suspended' ? 'chip-red' : 'chip-yellow'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        {CHANNELS.map((ch) => {
                          const row = c.channels.find((x) => x.channel === ch.key);
                          return (
                            <td key={ch.key} style={{ textAlign: 'center' }}>
                              <div className="flex items-center justify-center gap-1">
                                {statusIcon(row?.status ?? 'inactive')}
                                {row?.status === 'active' && row.numbers ? (
                                  <span className="text-[11px] text-slate-500">{row.numbers}</span>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}
                        <td>
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{
                              color: activeCount >= 4 ? '#0f8f7a' :
                                     activeCount >= 2 ? '#3b82f6' : '#94a3b8'
                            }}
                          >
                            {activeCount} / {CHANNELS.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-green-500" />
              Active
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle size={13} className="text-red-500" />
              Error
            </div>
            <div className="flex items-center gap-1.5">
              <WifiOff size={13} className="text-slate-300" />
              Inactive
            </div>
            <div className="ml-auto text-slate-400">
              Number beside icon = assigned numbers / instances
            </div>
          </div>
        </div>

        {/* ── Integration Health Summary ─────────────────────────────── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const active = enriched.filter(
              (c) => c.channels.find((x) => x.channel === ch.key && x.status === 'active')
            ).length;
            const errors = enriched.filter(
              (c) => c.channels.find((x) => x.channel === ch.key && x.status === 'error')
            ).length;
            const inactive = (companies.length || 0) - active - errors;

            return (
              <div key={ch.key} className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: ch.bg }}
                  >
                    <Icon size={20} strokeWidth={1.75} style={{ color: ch.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{ch.label}</div>
                    <div className="text-xs text-slate-500">{ch.description}</div>
                  </div>
                  <div
                    className="ml-auto w-2.5 h-2.5 rounded-full"
                    style={{ background: errors > 0 ? '#ef4444' : active > 0 ? '#22c55e' : '#e2e8f0' }}
                    title={errors > 0 ? 'Has errors' : active > 0 ? 'Healthy' : 'No companies'}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg p-2.5" style={{ background: '#f0fdf4' }}>
                    <div className="text-xl font-bold text-green-600 tabular-nums">
                      {loading ? '—' : active}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Active</div>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: '#fef2f2' }}>
                    <div className="text-xl font-bold text-red-500 tabular-nums">
                      {loading ? '—' : errors}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Errors</div>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: '#f8fafc' }}>
                    <div className="text-xl font-bold text-slate-400 tabular-nums">
                      {loading ? '—' : inactive}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Inactive</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
