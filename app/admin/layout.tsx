'use client';

// ─── Admin Portal Layout ──────────────────────────────────────────────────────
// Wraps all /admin/* pages (except /admin/login).
// Guards: user must be authenticated AND portal === 'admin'.

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getPortal } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DialerModal } from '@/components/ui/DialerModal';
import '@/app/voxa.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Skip the guard on the login page itself
    if (pathname === '/admin/login') {
      setReady(true);
      return;
    }
    if (!isAuthenticated() || getPortal() !== 'admin') {
      router.replace('/admin/login');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  // Login page renders without the sidebar shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f9]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Pass setter down via a context-free prop approach — each page supplies its own header */}
        {/* We inject onMenuClick via a custom event instead of prop drilling */}
        <div id="admin-menu-trigger" style={{ display: 'none' }} data-open={String(sidebarOpen)} />
        {/* Mobile floating menu button */}
        {/* <button
          className="fixed top-4 left-4 z-50 lg:hidden btn-outline shadow-md"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          id="admin-mobile-menu-btn"
        >
          ☰
        </button> */}
        {children}
        <DialerModal />
      </main>
    </div>
  );
}
