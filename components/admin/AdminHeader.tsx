'use client';

// ─── Admin Header (Topbar) ────────────────────────────────────────────────────
// Mobile topbar + page title area for the Admin Portal.

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, onMenuClick, actions }: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible only on mobile (handled by main-topbar CSS) */}
        <button
          id="admin-menu-toggle"
          className="mobile-nav-btn btn-outline lg:hidden"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
