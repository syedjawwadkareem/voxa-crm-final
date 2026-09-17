// ─── Frontend Permission Fetcher ──────────────────────────────────────────────
// Fetches the live permission list from the backend DB.
// Supports portal scoping ('admin' or 'company') to filter permissions.

import { api } from './api';
import type { ApiSuccess } from './types';

export interface PermissionDoc {
  name: string;
  module: string;
  action: string;
  description?: string;
  scope?: 'admin' | 'company' | 'both';
}

// In-memory cache by scope
const _cacheMap: Record<string, PermissionDoc[]> = {};

/**
 * Fetches permissions from the backend (optionally filtered by scope).
 * Results are cached in memory.
 */
export async function fetchPermissions(scope?: 'admin' | 'company'): Promise<PermissionDoc[]> {
  const cacheKey = scope || 'all';
  if (_cacheMap[cacheKey]) return _cacheMap[cacheKey];

  const query = scope ? `?scope=${scope}` : '';
  const res = await api.get<ApiSuccess<PermissionDoc[]>>(`/permissions${query}`);
  const data = res.data ?? [];
  _cacheMap[cacheKey] = data;
  return data;
}

/**
 * Returns permissions grouped by module, optionally filtered by scope.
 * e.g. { companies: [...], users: [...] }
 */
export async function fetchPermissionsGrouped(scope?: 'admin' | 'company'): Promise<Record<string, PermissionDoc[]>> {
  const perms = await fetchPermissions(scope);
  return perms.reduce<Record<string, PermissionDoc[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});
}

/** Clears the in-memory cache (useful for testing or forced refresh). */
export function clearPermissionCache() {
  for (const k of Object.keys(_cacheMap)) {
    delete _cacheMap[k];
  }
}
