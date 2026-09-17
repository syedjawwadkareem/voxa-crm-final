'use client';

// ─── Admin Sidebar ────────────────────────────────────────────────────────────
// Navigation for the Admin Portal (Voxa internal staff).
// All modules remain visible in Admin Portal. Restricted modules show a lock indicator
// and navigating to them displays a clear "Access Denied" screen with required permissions.

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, ShieldCheck, CreditCard, LogOut, X, ListFilter, Layers, Hash, Bot, Lock } from 'lucide-react';
import { authApi } from '@/lib/api';
import { clearSession, getUser, hasPermission } from '@/lib/auth';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',      label: 'Dashboard',      href: '/admin/dashboard',        icon: LayoutDashboard },
  { key: 'companies',      label: 'Companies',      href: '/admin/companies',        icon: Building2,     permission: 'companies:read' },
  { key: 'omnichannel',    label: 'Omnichannel',    href: '/admin/omnichannel',      icon: Layers,        permission: 'integrations:read' },
  { key: 'security',       label: 'Security',       href: '/admin/security',         icon: ShieldCheck,   permission: 'roles:read' },
  { key: 'plans',          label: 'Billing Plans',  href: '/admin/plans',            icon: CreditCard,    permission: 'billing:read' },
  { key: 'master-logs',    label: 'Master Logs',    href: '/admin/master-logs',      icon: ListFilter,    permission: 'calls:read' },
  { key: 'did-management', label: 'DID Management', href: '/admin/did-management',   icon: Hash,          permission: 'did:read' },
  { key: 'ai-agents',      label: 'AI Agents',      href: '/admin/ai-agents',        icon: Bot,           permission: 'agents:read' },
];

export function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  // In Admin Portal, all modules remain visible in the menu.
  // Access control is enforced on-click / on-page via AccessDenied.
  const visibleItems = NAV_ITEMS;

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear locally regardless
    }
    clearSession('admin');
    router.push('/admin/login');
  }

  const initials = (name?: string) =>
    (name ?? 'VA')
      .split(/\s+/)
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar w-64 bg-[#0f1b2d] text-slate-200 flex-shrink-0 flex flex-col
          fixed inset-y-0 left-0 z-80 transition-transform duration-250
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:translate-x-0 lg:z-30`}
        style={{ height: '100vh', maxHeight: '100vh' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex-shrink-0 flex items-center gap-2 border-b border-white/5">
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 40 40" fill="none">
            <path
              d="M6 12 L10 28 L14 12 L18 28 L22 12 L26 28 L30 12 L34 28"
              stroke="url(#g-admin)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="g-admin" x1="0" x2="40">
                <stop stopColor="#22c1a5" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-mark">VOXA</span>
          <span className="ml-1 text-xs text-slate-400 font-medium uppercase tracking-widest">Admin</span>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1 overflow-y-auto text-sm">
          <p className="text-xs text-slate-500 uppercase tracking-widest px-2 mb-2 mt-1">Main Menu</p>
          {visibleItems.map((item) => {
            const bestMatch = visibleItems
              .filter((it) => pathname === it.href || pathname.startsWith(it.href + '/'))
              .sort((a, b) => b.href.length - a.href.length)[0];
            const isActive = bestMatch?.key === item.key;
            const isPermitted = !item.permission || hasPermission(item.permission);
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                id={`admin-nav-${item.key}`}
                className={`sidebar-link ${isActive ? 'active' : ''} flex items-center justify-between group`}
                onClick={() => { router.push(item.href); onClose(); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
                title={!isPermitted ? `Restricted (requires ${item.permission})` : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} strokeWidth={1.75} className={!isPermitted ? 'text-slate-400' : ''} />
                  <span className={`truncate ${!isPermitted ? 'text-slate-400' : ''}`}>{item.label}</span>
                </div>
                {!isPermitted && (
                  <Lock size={12} className="text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 flex-shrink-0 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="avatar"
              style={{ background: '#0f8f7a', width: 32, height: 32, fontSize: '0.75rem' }}
            >
              {initials(user?.fullName ?? user?.email)}
            </span>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {user?.fullName ?? user?.email ?? 'Admin User'}
              </div>
              <div className="text-cyan-400 text-xs font-semibold">Admin Portal</div>
            </div>
          </div>
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            className="w-full text-left text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5"
          >
            <LogOut size={13} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
