'use client';

// ─── Company Portal Layout ────────────────────────────────────────────────────
// Wraps all /company/* pages (except /company/login).
// Guards: user must be authenticated AND portal === 'customer'.

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getPortal } from '@/lib/auth';
import { CompanySidebar } from '@/components/company/CompanySidebar';
import '@/app/voxa.css';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/company/login') {
      setReady(true);
      return;
    }
    if (!isAuthenticated() || getPortal() !== 'customer') {
      router.replace('/company/login');
    } else {
      setReady(true);
    }
  }, [pathname, router]);

  if (pathname === '/company/login') {
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
      <CompanySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* <button
          className="fixed top-4 left-4 z-50 lg:hidden btn-outline shadow-md"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          id="company-mobile-menu-btn"
        >
          ☰
        </button> */}
        {children}
      </main>
    </div>
  );
}
