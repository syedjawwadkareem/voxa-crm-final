'use client';

// ─── StatusBadge ─────────────────────────────────────────────────────────────
// Renders a colour-coded chip based on a status string.

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, string> = {
  active: 'chip chip-green',
  suspended: 'chip chip-red',
  pending: 'chip chip-yellow',
  inactive: 'chip chip-gray',
  exhausted: 'chip chip-red',
  'active': 'chip chip-green',
  paid: 'chip chip-green',
  open: 'chip chip-blue',
  void: 'chip chip-gray',
  draft: 'chip chip-gray',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cls = statusMap[status?.toLowerCase()] ?? 'chip chip-gray';
  return (
    <span className={`${cls} ${className}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
    </span>
  );
}
