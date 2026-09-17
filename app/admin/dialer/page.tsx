'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDialer } from '@/components/admin/AdminDialer';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { hasPermission } from '@/lib/auth';

export default function AdminDialerPage() {
  if (!hasPermission('dialer:access')) {
    return (
      <div>
        <AdminHeader
          title="Dialer"
          subtitle="Make calls from the admin portal"
          onMenuClick={() => {}}
        />
        <AccessDenied module="Dialer" requiredPermission="dialer:access" portal="admin" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Dialer"
        subtitle="Make calls from the admin portal"
        onMenuClick={() => {}}
      />
      <div className="px-6 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-sm">
          <AdminDialer />
        </div>
      </div>
    </div>
  );
}
