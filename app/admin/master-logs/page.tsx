'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { MasterLogs } from '@/components/admin/MasterLogs';

export default function AdminMasterLogsPage() {
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
