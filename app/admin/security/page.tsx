'use client';

// ─── Admin — Security Page ───────────────────────────────────────────────────
// /admin/security — Manage Staff Users and Roles & Permissions in one place.

import { useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminUsersTab } from '@/components/admin/security/AdminUsersTab';
import { AdminRolesTab } from '@/components/admin/security/AdminRolesTab';

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  return (
    <div>
      <AdminHeader
        title="Security"
        subtitle="Manage Staff Users and Roles & Permissions"
        onMenuClick={() => {}}
      />

      <div className="px-6 py-6">
        {/* Tabs Navigation */}
        <div className="flex gap-4 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'users' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} /> Staff Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'roles' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck size={16} /> Roles & Permissions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'roles' && <AdminRolesTab />}
      </div>
    </div>
  );
}
