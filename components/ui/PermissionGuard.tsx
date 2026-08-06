'use client';

// ─── PermissionGuard ─────────────────────────────────────────────────────────
// Renders children only if the current user has the required permission.
// Falls back to `fallback` (default: null) if the user lacks it.

import { hasPermission } from '@/lib/auth';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
