'use client';

import { CompanyHeader } from '@/components/company/CompanyHeader';
import { CompanyDids } from '@/components/company/CompanyDids';
import { hasPermission } from '@/lib/auth';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function CompanyDidsPage() {
  if (!hasPermission('did:read')) {
    return (
      <div>
        <CompanyHeader
          title="DID Numbers"
          subtitle="Phone numbers assigned to your company"
          onMenuClick={() => {}}
        />
        <AccessDenied module="DID Numbers" requiredPermission="did:read" portal="company" />
      </div>
    );
  }

  return (
    <div>
      <CompanyHeader
        title="DID Numbers"
        subtitle="Phone numbers assigned to your company"
        onMenuClick={() => {}}
      />
      <CompanyDids />
    </div>
  );
}
