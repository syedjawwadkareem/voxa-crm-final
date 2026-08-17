'use client';

// ─── Company Sidebar ──────────────────────────────────────────────────────────
// Navigation for the Company Portal (company users / customers).
// Portal = "customer". Nav items filtered by user permissions.

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ShieldCheck, LogOut, X, PhoneCall, Layers, ClipboardList } from 'lucide-react';
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
  { key: 'dashboard',    label: 'Dashboard',    href: '/company/dashboard',    icon: LayoutDashboard },
  { key: 'users',        label: 'Users',        href: '/company/users',        icon: Users,       permission: 'users:read' },
  { key: 'roles',        label: 'Roles',        href: '/company/roles',        icon: ShieldCheck, permission: 'roles:read' },
  { key: 'omnichannel',  label: 'Omnichannel',  href: '/company/omnichannel',  icon: Layers },
  { key: 'ivr',          label: 'IVR & Campaigns', href: '/company/ivr',       icon: PhoneCall },
  { key: 'logs',         label: 'Logs',         href: '/company/logs',         icon: PhoneCall },
  { key: 'leads',        label: 'Lead Management', href: '/company/leads',     icon: ClipboardList },
  { key: 'orders',       label: 'Order Management', href: '/company/orders',   icon: ClipboardList },
];

export function CompanySidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const visibleItems = NAV_ITEMS.filter((item) => {
    // Permission check
    if (item.permission && !hasPermission(item.permission)) return false;
    
    // Business Type check
    if (item.key === 'orders') {
      return user?.businessType === 'ecommerce';
    }
    if (item.key === 'leads') {
      return user?.businessType !== 'ecommerce';
    }
    return true;
  });

  async function handleLogout() {
    try { await authApi.logout(); } catch { }
    clearSession();
    router.push('/company/login');
  }

  const initials = (name?: string) =>
    (name ?? 'CU')
      .split(/\s+/)
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-70 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`sidebar w-64 text-slate-200 flex-shrink-0 flex flex-col
          fixed inset-y-0 left-0 z-80 transition-transform duration-250
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:z-auto`}
        style={{ minHeight: '100vh', background: '#0f1b2d' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2 border-b border-white/5">
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 40 40" fill="none">
            <path
              d="M6 12 L10 28 L14 12 L18 28 L22 12 L26 28 L30 12 L34 28"
              stroke="url(#g-company)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="g-company" x1="0" x2="40">
                <stop stopColor="#22c1a5" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-mark">VOXA</span>
          <span className="ml-1 text-xs text-slate-400 font-medium uppercase tracking-widest">Portal</span>
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
          <p className="text-xs text-slate-500 uppercase tracking-widest px-2 mb-2 mt-1">Navigation</p>
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                id={`company-nav-${item.key}`}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => { router.push(item.href); onClose(); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="avatar"
              style={{ background: '#3b82f6', width: 32, height: 32, fontSize: '0.75rem' }}
            >
              {initials(user?.fullName ?? user?.email)}
            </span>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {user?.fullName ?? user?.email ?? 'Company User'}
              </div>
              <div className="text-blue-400 text-xs font-semibold">Company Portal</div>
            </div>
          </div>
          <button
            id="company-logout-btn"
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
