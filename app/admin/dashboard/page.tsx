'use client';

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
// /admin/dashboard — KPI overview for Voxa admin staff.
// Fetches live data from companies and admin-users APIs.

import { useState, useEffect } from 'react';
import { Building2, CircleCheck, PauseCircle, Users, ArrowRight, TriangleAlert, TrendingUp } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { companiesApi, adminUsersApi } from '@/lib/api';
import type { Company, AdminUser, LucideIcon } from '@/lib/types';

interface KpiCard {
  label: string;
  value: number | string;
  sub: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  trend?: string;
}

export default function AdminDashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [compRes, usersRes] = await Promise.allSettled([
          companiesApi.list(),
          adminUsersApi.list(),
        ]);
        if (compRes.status === 'fulfilled') setCompanies(compRes.value.data ?? []);
        if (usersRes.status === 'fulfilled') setAdminUsers(usersRes.value.data ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const active = companies.filter((c) => c.status === 'active').length;
  const suspended = companies.filter((c) => c.status === 'suspended').length;
  const pending = companies.filter((c) => c.status === 'pending').length;
  const prepaid = companies.filter((c) => c.billingModel === 'prepaid').length;
  const postpaid = companies.filter((c) => c.billingModel === 'postpaid').length;

  const kpis: KpiCard[] = [
    {
      label: 'Total Companies',
      value: companies.length,
      sub: 'All time',
      color: '#3b82f6',
      bg: '#eff6ff',
      icon: Building2,
    },
    {
      label: 'Active Companies',
      value: active,
      sub: 'Currently serving',
      color: '#0f8f7a',
      bg: '#f0fdf9',
      icon: CircleCheck,
    },
    {
      label: 'Suspended',
      value: suspended,
      sub: 'Needs attention',
      color: '#f59e0b',
      bg: '#fffbeb',
      icon: PauseCircle,
    },
    {
      label: 'Admin Staff',
      value: adminUsers.length,
      sub: 'Voxa internal users',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      icon: Users,
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle="Voxa platform overview"
        onMenuClick={() => { }}
      />

      <div className="px-6 py-6">
        {error && (
          <div className="chip chip-red mb-4 px-3 py-2 rounded-lg text-sm">{error}</div>
        )}

        {/* KPI Grid */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="kpi relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ background: k.bg }}
                  >
                    <Icon size={20} strokeWidth={1.75} style={{ color: k.color }} />
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${k.color}18`, color: k.color }}
                  >
                    {k.sub}
                  </span>
                </div>
                <div
                  className="text-3xl font-bold mb-1 tabular-nums"
                  style={{ color: k.color }}
                >
                  {loading ? '—' : k.value}
                </div>
                <div className="text-slate-500 text-sm font-medium">{k.label}</div>
                {/* Subtle decorative circle */}
                <div
                  className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.06]"
                  style={{ background: k.color }}
                />
              </div>
            );
          })}
        </div>

        {/* Billing split mini-cards */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl" style={{ background: '#eff6ff' }}>
              <TrendingUp size={18} strokeWidth={1.75} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: '#3b82f6' }}>
                {loading ? '—' : prepaid}
              </div>
              <div className="text-slate-500 text-xs font-medium">Prepaid Plans</div>
            </div>
          </div>
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl" style={{ background: '#f5f3ff' }}>
              <TrendingUp size={18} strokeWidth={1.75} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: '#8b5cf6' }}>
                {loading ? '—' : postpaid}
              </div>
              <div className="text-slate-500 text-xs font-medium">Postpaid Plans</div>
            </div>
          </div>
        </div>

        {/* Pending alert */}
        {pending > 0 && (
          <div
            className="rounded-xl px-4 py-3.5 flex items-center gap-3 mb-6"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <div className="p-1.5 rounded-lg" style={{ background: '#fef3c7' }}>
              <TriangleAlert size={16} strokeWidth={1.75} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-amber-800 text-sm">
                {pending} compan{pending === 1 ? 'y' : 'ies'} pending review
              </div>
              <div className="text-amber-700 text-xs mt-0.5">
                Review and activate from the{' '}
                <a href="/admin/companies" className="underline font-medium">Companies</a> page.
              </div>
            </div>
            <a href="/admin/companies" className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800">
              Review <ArrowRight size={13} />
            </a>
          </div>
        )}

        {/* Recent companies table */}
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={15} strokeWidth={1.75} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800 text-sm">Recent Companies</h2>
            </div>
            <a href="/admin/companies" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium transition-colors">
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</div>
            ) : companies.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">No companies yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Billing</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.slice(0, 5).map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building2 size={13} strokeWidth={1.75} className="text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-800">{c.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`chip ${c.status === 'active' ? 'chip-green' :
                          c.status === 'suspended' ? 'chip-red' : 'chip-yellow'
                          }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="capitalize text-slate-600">{c.billingModel}</td>
                      <td className="text-slate-400 text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
