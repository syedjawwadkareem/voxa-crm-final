'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { MasterLogs } from '@/components/admin/MasterLogs';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { hasPermission } from '@/lib/auth';

export default function AdminMasterLogsPage() {
  if (!hasPermission('calls:read')) {
    return (
      <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        <AdminHeader
          title="Master Logs"
          subtitle="Global call history across all users and companies"
          onMenuClick={() => {}}
        />
        <AccessDenied module="Master Logs" requiredPermission="calls:read" portal="admin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <AdminHeader
        title="Master Logs"
        subtitle="Global call history across all users and companies"
        onMenuClick={() => {}}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <MasterLogs />
      </div>
    </div>
  );
}
