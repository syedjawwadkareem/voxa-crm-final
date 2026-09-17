'use client';

// ─── Admin — Security Page ───────────────────────────────────────────────────
// /admin/security — Manage Staff Users and Roles & Permissions in one place.

import { useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminUsersTab } from '@/components/admin/security/AdminUsersTab';
import { AdminRolesTab } from '@/components/admin/security/AdminRolesTab';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { hasPermission } from '@/lib/auth';

export default function AdminSecurityPage() {
  const canReadUsers = hasPermission('users:read');
  const canReadRoles = hasPermission('roles:read');

  // Default active tab based on permissions
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>(
    canReadUsers ? 'users' : 'roles'
  );

  // If user has neither permission, show Access Denied
  if (!canReadUsers && !canReadRoles) {
    return (
      <div>
        <AdminHeader
          title="Security"
          subtitle="Manage Staff Users and Roles & Permissions"
          onMenuClick={() => {}}
        />
        <AccessDenied
          module="Security (Users & Roles)"
          requiredPermission="users:read or roles:read"
          portal="admin"
        />
      </div>
    );
  }

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
          {canReadUsers && (
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'users' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={16} /> Staff Users
            </button>
          )}
          {canReadRoles && (
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'roles' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldCheck size={16} /> Roles & Permissions
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && canReadUsers && <AdminUsersTab />}
        {activeTab === 'roles' && canReadRoles && <AdminRolesTab />}
      </div>
    </div>
  );
}
