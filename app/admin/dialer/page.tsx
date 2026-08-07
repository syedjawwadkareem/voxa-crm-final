'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDialer } from '@/components/admin/AdminDialer';
import { CallLogs } from '@/components/admin/CallLogs';

export default function AdminDialerPage() {
  return (
    <div>
      <AdminHeader
        title="Dialer"
        subtitle="Make calls from the admin portal"
        onMenuClick={() => { }}
      />
      <div className="px-6 py-12 flex flex-col md:flex-row items-stretch justify-center gap-6 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-sm">
          <AdminDialer />
        </div>
        <div className="w-full max-w-sm hidden md:block">
          <CallLogs />
        </div>
      </div>
    </div>
  );
}
