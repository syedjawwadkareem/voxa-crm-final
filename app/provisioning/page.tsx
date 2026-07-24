'use client'

import { Sidebar } from '@/components/sidebar'
import { Card, Button, Chip, Toggle } from '@/components/ui-components'
import { Database, Plus, RefreshCw } from 'lucide-react'

const extensions = [
  {
    id: '001',
    number: '2001',
    user: 'John Smith',
    type: 'Fixed',
    status: 'Active',
    sipUri: 'sip:2001@voxa.company.com',
  },
  {
    id: '002',
    number: '2002',
    user: 'Sarah Davis',
    type: 'Mobile',
    status: 'Active',
    sipUri: 'sip:2002@voxa.company.com',
  },
  {
    id: '003',
    number: '2003',
    user: 'Mike Brown',
    type: 'Fixed',
    status: 'Active',
    sipUri: 'sip:2003@voxa.company.com',
  },
  {
    id: '004',
    number: '2004',
    user: 'Unassigned',
    type: 'Fixed',
    status: 'Available',
    sipUri: 'sip:2004@voxa.company.com',
  },
]

export default function Provisioning() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Database size={32} />
              Provisioning
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage SIP extensions and device provisioning
            </p>
          </div>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            New Extension
          </Button>
        </div>

        {/* System Status */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Provisioning Status
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                SIP Server
              </span>
              <Chip label="Connected" variant="success" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                DHCP Server
              </span>
              <Chip label="Connected" variant="success" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                Auto Provisioning
              </span>
              <Chip label="Enabled" variant="success" />
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border border-border">
              <span className="text-sm font-medium text-foreground">
                Auto Update Devices
              </span>
              <Toggle checked={true} onChange={() => {}} />
            </div>
          </div>
        </Card>

        {/* Extensions List */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              SIP Extensions
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Extension
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    SIP URI
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {extensions.map((ext) => (
                  <tr
                    key={ext.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-semibold text-card-foreground">
                      {ext.number}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {ext.user}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {ext.type}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Chip
                        label={ext.status}
                        variant={
                          ext.status === 'Active' ? 'success' : 'default'
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {ext.sipUri}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Device Templates */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Device Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Yealink', 'Cisco', 'Polycom', 'Grandstream'].map((brand) => (
              <div
                key={brand}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors flex justify-between items-center"
              >
                <span className="font-medium text-foreground">{brand}</span>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
