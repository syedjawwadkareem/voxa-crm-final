'use client';

import React, { useState } from 'react';
import { Phone, X } from 'lucide-react';
import { AdminDialer } from '@/components/admin/AdminDialer';

export function DialerModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center hover:bg-teal-600 hover:scale-105 active:scale-95 transition-all"
        title="Open Dialer"
      >
        <Phone size={24} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-sm">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white text-slate-500 shadow-md flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
            
            {/* Reused dialer UI */}
            <AdminDialer />
          </div>
        </div>
      )}
    </>
  );
}
