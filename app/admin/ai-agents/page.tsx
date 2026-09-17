'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminAiAgents } from '@/components/admin/AiAgents';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { hasPermission } from '@/lib/auth';

export default function AdminAiAgentsPage() {
  if (!hasPermission('agents:read')) {
    return (
      <div>
        <AdminHeader
          title="AI Agents"
          subtitle="Platform-wide AI voice receptionists and call configs"
          onMenuClick={() => {}}
        />
        <AccessDenied module="AI Agents" requiredPermission="agents:read" portal="admin" />
      </div>
    );
  }

  return <AdminAiAgents />;
}
