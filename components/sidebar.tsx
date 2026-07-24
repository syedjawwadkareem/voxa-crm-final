'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Settings,
  Users,
  Database,
  LogOut,
  LogsIcon,
  Shield,
  Radio,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navigationItems = [
  { label: 'Dashboard', href: '/', icon: BarChart3 },
  { label: 'Softphone', href: '/softphone', icon: Phone },
  { label: 'Outbound Calls', href: '/outbound', icon: PhoneOutgoing },
  { label: 'Inbound Calls', href: '/inbound', icon: PhoneIncoming },
  { label: 'Call Queue', href: '/queue', icon: MessageSquare },
  { label: 'Omnichannel', href: '/omnichannel', icon: Radio },
  { label: 'IVR Settings', href: '/ivr', icon: Settings },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Provisioning', href: '/provisioning', icon: Database },
  { label: 'Logs', href: '/logs', icon: LogsIcon },
  { label: 'Security', href: '/security', icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed z-40 top-4 left-4 p-2 hover:bg-sidebar-accent rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform md:translate-x-0 z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-sidebar-border">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold">
            V
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">VOXA</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
