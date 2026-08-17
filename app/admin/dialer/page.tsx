'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDialer } from '@/components/admin/AdminDialer';

export default function AdminDialerPage() {
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
