'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

interface AccessDeniedProps {
  module?: string;
  requiredPermission?: string;
  portal?: 'admin' | 'company';
}

export function AccessDenied({
  module = 'this module',
  requiredPermission,
  portal = 'admin',
}: AccessDeniedProps) {
  const router = useRouter();
  const dashboardPath = portal === 'company' ? '/company/dashboard' : '/admin/dashboard';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center animate-fadeIn">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-10 h-10 text-amber-600" strokeWidth={1.75} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shadow-xs">
          <Lock className="w-3.5 h-3.5 text-red-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        Access Denied
      </h2>

      <p className="text-slate-600 text-sm max-w-md mb-3 leading-relaxed">
        You don&apos;t have permission to access <strong className="text-slate-800">{module}</strong>.
      </p>

      {requiredPermission && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600 mb-6">
          <span className="text-slate-400">Required:</span>
          <span className="font-semibold text-slate-800">{requiredPermission}</span>
        </div>
      )}

      <p className="text-xs text-slate-400 max-w-sm mb-8">
        If you believe you should have access, please contact your system administrator to assign the required permissions to your role.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="btn-outline inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium"
        >
          <ArrowLeft size={14} /> Go Back
        </button>
        <button
          onClick={() => router.push(dashboardPath)}
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium"
        >
          <Home size={14} /> Return to Dashboard
        </button>
      </div>
    </div>
  );
}
