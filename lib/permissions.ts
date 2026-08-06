// ─── Frontend Permission Fetcher ──────────────────────────────────────────────
// Fetches the live permission list from the backend DB.
// Replaces the hardcoded PERMISSION_LIST constant in lib/types.ts for UI use.

import { api } from './api';
import type { ApiSuccess } from './types';

export interface PermissionDoc {
  name: string;
  module: string;
  action: string;
  description?: string;
}

// In-memory cache so we only hit the API once per page session
let _cache: PermissionDoc[] | null = null;

/**
 * Fetches all permissions from the backend and returns them as an array.
 * Results are cached in memory for the lifetime of the page.
 */
export async function fetchPermissions(): Promise<PermissionDoc[]> {
  if (_cache) return _cache;
  const res = await api.get<ApiSuccess<PermissionDoc[]>>('/permissions');
  _cache = res.data ?? [];
  return _cache;
}

/**
 * Returns permissions grouped by module.
 * e.g. { companies: [...], users: [...] }
 */
export async function fetchPermissionsGrouped(): Promise<Record<string, PermissionDoc[]>> {
  const perms = await fetchPermissions();
  return perms.reduce<Record<string, PermissionDoc[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});
}

/** Clears the in-memory cache (useful for testing or forced refresh). */
export function clearPermissionCache() {
  _cache = null;
}
