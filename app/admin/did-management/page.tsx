'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { DidManagement } from '@/components/admin/DidManagement';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { hasPermission } from '@/lib/auth';

export default function AdminDidManagementPage() {
  if (!hasPermission('did:read')) {
    return (
      <div>
        <AdminHeader
          title="DID Management"
          subtitle="Provision and assign DID numbers to companies"
          onMenuClick={() => {}}
        />
        <AccessDenied module="DID Management" requiredPermission="did:read" portal="admin" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="DID Management"
        subtitle="Provision and assign DID numbers to companies"
        onMenuClick={() => {}}
      />
      <DidManagement />
    </div>
  );
}
