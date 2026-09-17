'use client';

import { CompanyAiAgents } from '@/components/company/AiAgents';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { hasPermission } from '@/lib/auth';
import { AccessDenied } from '@/components/ui/AccessDenied';

export default function CompanyAiAgentsPage() {
  if (!hasPermission('agents:read')) {
    return (
      <div>
        <CompanyHeader
          title="AI Calling Agents"
          subtitle="Configure your AI voice agents and view call results"
          onMenuClick={() => {}}
        />
        <AccessDenied module="AI Calling Agents" requiredPermission="agents:read" portal="company" />
      </div>
    );
  }

  return <CompanyAiAgents />;
}
