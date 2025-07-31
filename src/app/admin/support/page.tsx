'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'

interface SupportLog {
  id: string
  type: 'ticket' | 'bug_report' | 'feature_request'
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  customer_email?: string
  business_name?: string
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
  // Mock data for support logs
  const mockLogs: SupportLog[] = [
    {
      id: '1',
      type: 'ticket',
      title: 'Customer unable to redeem stamps',
      description: 'Customer reports difficulty scanning QR codes for stamp redemption. System logs indicate intermittent connectivity.',
      status: 'open',
      priority: 'high',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      customer_email: 'customer1@example.com'
    },
    {
      id: '2',
      type: 'bug_report',
      title: 'Membership expiry date not updating',
      description: 'Several customers have reported that their membership expiry dates are not being updated correctly after card usage.',
      status: 'in_progress',
      priority: 'medium',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      customer_email: 'customer2@example.com'
    },
    {
      id: '3',
      type: 'feature_request',
      title: 'Integration with third-party loyalty platforms',
      description: 'Customers are requesting the ability to import loyalty points from external platforms directly into their RewardJar cards.',
      status: 'resolved',
      priority: 'low',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      customer_email: 'customer3@example.com'
    }
  ]

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
          {mockLogs.length > 0 ? (
            mockLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge 
                    className={
                      log.type === 'bug_report' 
                        ? 'bg-red-100 text-red-800'
                        : log.type === 'feature_request'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {log.type.replace('_', ' ')}
                  </Badge>
                  <div>
                    <div className="font-medium">
                      {log.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.description}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>{log.customer_email}</div>
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
    <AdminLayoutClient>
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
            <SupportLogs />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
} 