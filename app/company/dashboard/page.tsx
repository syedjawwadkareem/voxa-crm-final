'use client';

// ─── Company Dashboard ────────────────────────────────────────────────────────
// /company/dashboard — Overview for company users.

import { useState, useEffect } from 'react';
import { Users, CircleCheck, PauseCircle, ArrowRight, UserCircle } from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { companyUsersApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { CompanyUser } from '@/lib/types';

interface KpiCard {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ElementType;
  sub: string;
}

export default function CompanyDashboardPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    companyUsersApi
      .list()
      .then((res) => setUsers(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = users.filter((u) => u.status === 'active').length;
  const suspended = users.filter((u) => u.status === 'suspended').length;

  const kpis: KpiCard[] = [
    {
      label: 'Total Users',
      value: users.length,
      color: '#3b82f6',
      bg: '#eff6ff',
      icon: Users,
      sub: 'All accounts',
    },
    {
      label: 'Active Users',
      value: active,
      color: '#0f8f7a',
      bg: '#f0fdf9',
      icon: CircleCheck,
      sub: 'Currently active',
    },
    {
      label: 'Suspended',
      value: suspended,
      color: '#f59e0b',
      bg: '#fffbeb',
      icon: PauseCircle,
      sub: 'Needs review',
    },
  ];

  return (
    <div>
      <CompanyHeader
        title="Dashboard"
        subtitle={`Welcome back${user?.fullName ? ', ' + user.fullName : ''}!`}
        onMenuClick={() => {}}
      />

      <div className="px-6 py-6">
        {/* KPI Grid */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="kpi relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: k.bg }}>
                    <Icon size={20} strokeWidth={1.75} style={{ color: k.color }} />
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${k.color}18`, color: k.color }}
                  >
                    {k.sub}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 tabular-nums" style={{ color: k.color }}>
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

        {/* Recent users */}
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={15} strokeWidth={1.75} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800 text-sm">Team Members</h2>
            </div>
            <a href="/company/users" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors">
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">Loading…</div>
            ) : users.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">No users yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 5).map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            <UserCircle size={14} strokeWidth={1.75} className="text-slate-400" />
                          </div>
                          <span className="font-medium text-slate-800">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{u.email}</td>
                      <td>
                        <span className={`chip ${u.status === 'active' ? 'chip-green' : u.status === 'suspended' ? 'chip-red' : 'chip-gray'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="text-slate-400 text-xs">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
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
