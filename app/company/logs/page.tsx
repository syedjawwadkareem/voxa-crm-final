'use client';

import { CompanyHeader } from '@/components/company/CompanyHeader';
import { CompanyCallLogs } from '@/components/company/CompanyCallLogs';
import { hasPermission } from '@/lib/auth';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function CompanyLogsPage() {
  if (!hasPermission('calls:read')) {
    return (
      <div>
        <CompanyHeader
          title="Call Logs"
          subtitle="Your company's call history"
          onMenuClick={() => {}}
        />
        <AccessDenied module="Call Logs" requiredPermission="calls:read" portal="company" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <CompanyHeader
        title="Call Logs"
        subtitle="Your company's call history"
        onMenuClick={() => {}}
      />
      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        <CompanyCallLogs />
      </div>
    </div>
  );
}
