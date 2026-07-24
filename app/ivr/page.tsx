'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, Button, Toggle, Chip } from '@/components/ui-components'
import { Settings, Plus, Trash2 } from 'lucide-react'

const ivrFlows = [
  {
    id: '001',
    name: 'Main Menu',
    description: 'Primary IVR flow for incoming calls',
    status: 'Active',
    calls: 2145,
    lastModified: '2 days ago',
  },
  {
    id: '002',
    name: 'Support Queue',
    description: 'Route technical support calls',
    status: 'Active',
    calls: 1823,
    lastModified: '1 week ago',
  },
  {
    id: '003',
    name: 'Billing Department',
    description: 'Handle billing inquiries',
    status: 'Active',
    calls: 456,
    lastModified: '3 days ago',
  },
  {
    id: '004',
    name: 'After Hours',
    description: 'Weekend and holiday greeting',
    status: 'Inactive',
    calls: 0,
    lastModified: '2 weeks ago',
  },
]

export default function IVR() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings size={32} />
              IVR Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure interactive voice response flows
            </p>
          </div>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            Create Flow
          </Button>
        </div>

        {/* Global Settings */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Global Settings
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold text-card-foreground">
                  Enable IVR System
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Activate or deactivate all IVR flows
                </p>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>

            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold text-card-foreground">
                  Recording Enabled
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Record all IVR interactions
                </p>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>

            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold text-card-foreground">
                  Analytics Tracking
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Track user interactions and paths
                </p>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>
          </div>
        </Card>

        {/* IVR Flows */}
        <div className="grid gap-4">
          {ivrFlows.map((flow) => (
            <Card key={flow.id} className="p-6 hover:border-border/80 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {flow.name}
                    </h3>
                    <Chip
                      label={flow.status}
                      variant={
                        flow.status === 'Active' ? 'success' : 'default'
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {flow.description}
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>
                      <strong>{flow.calls}</strong> calls
                    </span>
                    <span>
                      Last modified <strong>{flow.lastModified}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
