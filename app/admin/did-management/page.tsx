'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { DidManagement } from '@/components/admin/DidManagement';

export default function AdminDidManagementPage() {
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
