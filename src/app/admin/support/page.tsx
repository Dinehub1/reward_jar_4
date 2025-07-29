import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createClient } from '@/lib/supabase/server-only'

interface SupportLog {
  id: string
  admin_id: string
  action: string
  target_type: 'customer' | 'business' | 'card'
  target_id: string
  target_name: string
  comment: string
  created_at: string
  admin_email?: string
}

async function getSupportLogs() {
  const supabase = createClient()
  
  try {
    // Note: This would need the admin_support_logs table to be created
    // For now, we'll return mock data
    const mockLogs: SupportLog[] = [
      {
        id: '1',
        admin_id: 'admin-1',
        action: 'add_stamp',
        target_type: 'customer',
        target_id: 'customer-1',
        target_name: 'John Doe',
        comment: 'Added stamp due to QR scan failure',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        admin_email: 'admin@rewardjar.com'
      },
      {
        id: '2',
        admin_id: 'admin-1',
        action: 'extend_membership',
        target_type: 'customer',
        target_id: 'customer-2',
        target_name: 'Jane Smith',
        comment: 'Extended membership due to system downtime',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        admin_email: 'admin@rewardjar.com'
      },
      {
        id: '3',
        admin_id: 'admin-1',
        action: 'force_reward',
        target_type: 'customer',
        target_id: 'customer-3',
        target_name: 'Bob Johnson',
        comment: 'Manually triggered reward redemption',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        admin_email: 'admin@rewardjar.com'
      }
    ]
    
    return mockLogs
  } catch (error) {
    console.error('Error fetching support logs:', error)
    return []
  }
}

function ManualStampTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🎫</span>
          <span>Add/Remove Stamps</span>
        </CardTitle>
        <CardDescription>
          Manually adjust stamp counts for customer cards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Customer Email</label>
            <Input placeholder="customer@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Card Selection</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card1">Coffee Loyalty Card</SelectItem>
                <SelectItem value="card2">Restaurant Stamps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Action</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Stamps</SelectItem>
                <SelectItem value="remove">Remove Stamps</SelectItem>
                <SelectItem value="reset">Reset to Zero</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Number of Stamps</label>
            <Input type="number" placeholder="1" min="1" max="50" />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Reason/Comment</label>
          <Textarea placeholder="Explain why this manual action is needed..." />
        </div>
        
        <Button className="w-full">Execute Stamp Action</Button>
      </CardContent>
    </Card>
  )
}

function MembershipTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>💳</span>
          <span>Membership Management</span>
        </CardTitle>
        <CardDescription>
          Extend memberships, add sessions, or modify terms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Customer Email</label>
            <Input placeholder="customer@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Membership Card</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select membership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gym1">Premium Gym Membership</SelectItem>
                <SelectItem value="spa1">Spa Package</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Action</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extend">Extend Expiry</SelectItem>
                <SelectItem value="add_sessions">Add Sessions</SelectItem>
                <SelectItem value="reset_sessions">Reset Sessions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Value</label>
            <Input placeholder="30 (days/sessions)" />
          </div>
          <div>
            <label className="text-sm font-medium">New Expiry Date</label>
            <Input type="date" />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Reason/Comment</label>
          <Textarea placeholder="Explain the reason for this membership modification..." />
        </div>
        
        <Button className="w-full">Execute Membership Action</Button>
      </CardContent>
    </Card>
  )
}

function RewardTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🎉</span>
          <span>Reward Management</span>
        </CardTitle>
        <CardDescription>
          Force reward issuance or reset reward status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Customer Email</label>
            <Input placeholder="customer@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Card Selection</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select card" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card1">Coffee Loyalty Card</SelectItem>
                <SelectItem value="card2">Restaurant Stamps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Action</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="force_reward">Force Issue Reward</SelectItem>
                <SelectItem value="reset_progress">Reset Card Progress</SelectItem>
                <SelectItem value="mark_redeemed">Mark as Redeemed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Notification</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Send notification?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, notify customer</SelectItem>
                <SelectItem value="no">No notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Reason/Comment</label>
          <Textarea placeholder="Explain why this reward action is needed..." />
        </div>
        
        <Button className="w-full">Execute Reward Action</Button>
      </CardContent>
    </Card>
  )
}

function CardResetTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🔄</span>
          <span>Card Reset</span>
        </CardTitle>
        <CardDescription>
          Reset customer cards to initial state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Customer Email</label>
            <Input placeholder="customer@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Reset Type</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select reset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Card</SelectItem>
                <SelectItem value="all">All Customer Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Card Selection (if single)</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select card to reset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card1">Coffee Loyalty Card</SelectItem>
              <SelectItem value="card2">Restaurant Stamps</SelectItem>
              <SelectItem value="card3">Gym Membership</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Reason/Comment</label>
          <Textarea placeholder="Explain why this card reset is necessary..." />
        </div>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <span>⚠️</span>
            <span className="font-medium">Warning</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            This action will permanently reset card progress and cannot be undone.
          </p>
        </div>
        
        <Button className="w-full" variant="destructive">
          Reset Customer Card
        </Button>
      </CardContent>
    </Card>
  )
}

async function SupportLogs() {
  const logs = await getSupportLogs()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📋</span>
          <span>Support Action Logs</span>
        </CardTitle>
        <CardDescription>
          History of all manual support actions performed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge 
                    className={
                      log.action === 'force_reward' 
                        ? 'bg-green-100 text-green-800'
                        : log.action === 'add_stamp'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }
                  >
                    {log.action.replace('_', ' ')}
                  </Badge>
                  <div>
                    <div className="font-medium">
                      {log.target_name} ({log.target_type})
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.comment}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>{log.admin_email}</div>
                  <div>{new Date(log.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No support actions logged yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SupportStats() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Actions Today</CardTitle>
          <span className="text-2xl">🛠️</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">
            Manual interventions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stamps Added</CardTitle>
          <span className="text-2xl">🎫</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">
            Manual stamp additions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rewards Issued</CardTitle>
          <span className="text-2xl">🎉</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">
            Force reward issuance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cards Reset</CardTitle>
          <span className="text-2xl">🔄</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1</div>
          <p className="text-xs text-muted-foreground">
            Card resets performed
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminSupport() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tools</h1>
          <p className="text-muted-foreground">
            Manual override tools and customer support actions
          </p>
        </div>

        {/* Stats */}
        <SupportStats />

        {/* Tabs */}
        <Tabs defaultValue="tools" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tools">Support Tools</TabsTrigger>
            <TabsTrigger value="logs">Action Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ManualStampTool />
              <MembershipTool />
              <RewardTool />
              <CardResetTool />
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            <Suspense fallback={<div>Loading support logs...</div>}>
              <SupportLogs />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 