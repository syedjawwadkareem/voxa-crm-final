'use client';

import { CompanyHeader } from '@/components/company/CompanyHeader';
import { CompanyDids } from '@/components/company/CompanyDids';

export default function CompanyDidsPage() {
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
