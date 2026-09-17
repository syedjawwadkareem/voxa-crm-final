'use client';

// ─── usePermissions Hook ──────────────────────────────────────────────────────
// React hook that fetches the live permission list from the backend.
// Supports portal scoping ('admin' or 'company').

import { useState, useEffect } from 'react';
import { fetchPermissions, fetchPermissionsGrouped, type PermissionDoc } from '@/lib/permissions';

interface UsePermissionsReturn {
  permissions: PermissionDoc[];
  grouped: Record<string, PermissionDoc[]>;
  loading: boolean;
  error: string;
}

export function usePermissions(scope?: 'admin' | 'company'): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionDoc[]>([]);
  const [grouped, setGrouped] = useState<Record<string, PermissionDoc[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [flat, grp] = await Promise.all([
          fetchPermissions(scope),
          fetchPermissionsGrouped(scope),
        ]);
        setPermissions(flat);
        setGrouped(grp);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scope]);

  return { permissions, grouped, loading, error };
}
