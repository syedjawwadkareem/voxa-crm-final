'use client';

import { CompanyHeader } from '@/components/company/CompanyHeader';
import { CompanyCallLogs } from '@/components/company/CompanyCallLogs';

export default function CompanyLogsPage() {
  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 0px)' }}>
      <CompanyHeader
        title="Call Logs"
        subtitle="Your company's call history"
        onMenuClick={() => {}}
      />
      <div className="flex-1 overflow-hidden bg-white">
        <CompanyCallLogs />
      </div>
    </div>
  );
}
