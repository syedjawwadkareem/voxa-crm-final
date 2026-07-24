'use client'

import { Sidebar } from '@/components/sidebar'
import { Card, Button, Toggle, Chip } from '@/components/ui-components'
import { Shield, AlertTriangle, Lock, Eye, Key } from 'lucide-react'

const sessions = [
  {
    id: '001',
    device: 'Chrome on Windows',
    ip: '192.168.1.100',
    lastActive: '2 minutes ago',
    status: 'Active',
  },
  {
    id: '002',
    device: 'Safari on iPhone',
    ip: '203.45.67.89',
    lastActive: '30 minutes ago',
    status: 'Active',
  },
  {
    id: '003',
    device: 'Firefox on Ubuntu',
    ip: '192.168.1.150',
    lastActive: '2 hours ago',
    status: 'Inactive',
  },
]

const securityEvents = [
  {
    id: '001',
    event: 'Failed login attempt',
    severity: 'Warning',
    timestamp: '09:32 AM',
    details: '5 failed attempts from IP 198.51.100.45',
  },
  {
    id: '002',
    event: 'Password changed',
    severity: 'Info',
    timestamp: '08:15 AM',
    details: 'User password updated successfully',
  },
  {
    id: '003',
    event: 'Unusual activity detected',
    severity: 'Error',
    timestamp: '07:45 AM',
    details: 'Login from new device detected',
  },
]

export default function Security() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield size={32} />
            Security
          </h1>
          <p className="text-muted-foreground mt-2">
            Account security and access management
          </p>
        </div>

        {/* Security Alert */}
        <div className="mb-8 bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-600 dark:text-red-400">
              Security Recommendation
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              We recommend enabling two-factor authentication for enhanced account security.
            </p>
          </div>
        </div>

        {/* Security Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Password Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Key size={20} />
              Password Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
              <Button variant="primary" className="w-full">
                Update Password
              </Button>
            </div>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Lock size={20} />
              Two-Factor Authentication
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-foreground">Enable 2FA</span>
                  <Toggle checked={false} onChange={() => {}} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Require a verification code when logging in
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-foreground">
                    SMS Verification
                  </span>
                  <Toggle checked={false} onChange={() => {}} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Send verification codes via SMS
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Generate Backup Codes
              </Button>
            </div>
          </Card>
        </div>

        {/* Active Sessions */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Eye size={20} />
            Active Sessions
          </h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-start p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div>
                  <p className="font-semibold text-card-foreground">
                    {session.device}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    IP: {session.ip}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last active: {session.lastActive}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Chip
                    label={session.status}
                    variant={
                      session.status === 'Active' ? 'success' : 'default'
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Events */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Security Events
          </h2>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <div
                key={event.id}
                className="flex gap-4 p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex-1">
                  <p className="font-semibold text-card-foreground">
                    {event.event}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.details}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {event.timestamp}
                  </p>
                </div>
                <Chip
                  label={event.severity}
                  variant={
                    event.severity === 'Error'
                      ? 'error'
                      : event.severity === 'Warning'
                        ? 'warning'
                        : 'info'
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
