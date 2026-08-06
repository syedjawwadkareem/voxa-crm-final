'use client';

// ─── PermissionCheckboxGrid ───────────────────────────────────────────────────
// Renders a dynamic, grouped-by-module grid of permission checkboxes.
// Permissions are fetched live from the backend, not hardcoded.

import { usePermissions } from '@/hooks/usePermissions';

interface PermissionCheckboxGridProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
}

export function PermissionCheckboxGrid({ selected, onChange }: PermissionCheckboxGridProps) {
  const { grouped, loading, error } = usePermissions();

  function toggle(perm: string) {
    if (selected.includes(perm)) {
      onChange(selected.filter((p) => p !== perm));
    } else {
      onChange([...selected, perm]);
    }
  }

  function toggleModule(module: string, perms: string[]) {
    const permNames = perms.map((p) => p);
    const allSelected = permNames.every((p) => selected.includes(p));
    if (allSelected) {
      onChange(selected.filter((p) => !permNames.includes(p)));
    } else {
      const merged = Array.from(new Set([...selected, ...permNames]));
      onChange(merged);
    }
  }

  if (loading) {
    return <div className="text-slate-400 text-xs py-4 text-center">Loading permissions…</div>;
  }
  if (error) {
    return <div className="text-red-400 text-xs py-2">{error}</div>;
  }

  const modules = Object.keys(grouped).sort();

  return (
    <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
      {modules.map((mod) => {
        const perms = grouped[mod];
        const permNames = perms.map((p) => p.name);
        const allSelected = permNames.every((p) => selected.includes(p));
        const someSelected = permNames.some((p) => selected.includes(p));

        return (
          <div key={mod} className="border border-slate-100 rounded-lg overflow-hidden">
            {/* Module header — select all toggle */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              onClick={() => toggleModule(mod, permNames)}
            >
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                {mod}
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color: allSelected ? '#0f8f7a' : someSelected ? '#f59e0b' : '#94a3b8',
                }}
              >
                {allSelected ? 'All selected' : someSelected ? 'Partial' : 'None'}
              </span>
            </button>

            {/* Permission checkboxes */}
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {perms.map((p) => (
                <label
                  key={p.name}
                  className="flex items-start gap-2 cursor-pointer px-3 py-2 bg-white hover:bg-slate-50 transition-colors"
                  title={p.description}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.name)}
                    onChange={() => toggle(p.name)}
                    className="mt-0.5 rounded flex-shrink-0"
                  />
                  <div>
                    <div className="text-xs text-slate-700 font-mono leading-tight">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-slate-400 leading-tight mt-0.5">{p.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
