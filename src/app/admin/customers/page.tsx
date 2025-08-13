'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { useCustomers, useAdminStatsCompat as useAdminStats } from '@/lib/hooks/use-admin-data'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { getPageEnhancement, createErrorFallback, createLoadingState } from '@/lib/design-consistency/page-enhancer'
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Mail,
  Calendar,
  CreditCard
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  created_at: string
  user_id: string
  customer_cards: Array<any>
  _count?: {
    customer_cards: number
    rewards: number
    session_usage: number
  }
  _flags?: {
    hasRecentErrors: boolean
    hasAbnormalActivity: boolean
    isNewCustomer: boolean
  }
}

interface CustomerMetrics {
  totalCustomers: number
  activeCustomers: number
  newThisWeek: number
  anomalies: number
}

function CustomerStats() {
  const { data: statsData, loading: statsLoading } = useAdminStats()
  const { data: customersData, loading: customersLoading } = useCustomers()

  const loading = statsLoading || customersLoading
  const safeCustomersData = Array.isArray(customersData) ? customersData : []

  // Calculate customer metrics with safety checks
  const customerMetrics: CustomerMetrics = {
    totalCustomers: statsData?.stats?.totalCustomers || safeCustomersData.length || 0,
    activeCustomers: safeCustomersData.filter(c => {
      try {
        if (!c?.created_at) return false
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        return new Date(c.created_at) > monthAgo
      } catch {
        return false
      }
    }).length || 0,
    newThisWeek: safeCustomersData.filter(c => {
      try {
        if (!c?.created_at) return false
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(c.created_at) > weekAgo
      } catch {
        return false
      }
    }).length || 0,
    anomalies: safeCustomersData.filter(c => (c as any)?._flags?.hasAbnormalActivity).length || 0
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-6 w-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customerMetrics.totalCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Registered users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customerMetrics.activeCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Active in last 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customerMetrics.newThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            New customers this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customerMetrics.anomalies}</div>
          <p className="text-xs text-muted-foreground">
            Require attention
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AnomalyDetection() {
  // TODO: Replace with real anomaly detection API
  const anomalies: any[] = []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span>Anomaly Detection</span>
        </CardTitle>
        <CardDescription>Automated flags for unusual customer behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {anomalies.length > 0 ? (
          anomalies.map((anomaly) => (
          <div key={anomaly.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Badge variant={anomaly.type === 'High Activity' ? 'default' : 'destructive'}>
                {anomaly.type}
              </Badge>
              <div>
                <h3 className="font-medium">{anomaly.description}</h3>
                <p className="text-sm text-muted-foreground">{anomaly.customer}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{anomaly.time}</span>
              <Button variant="outline" size="sm">Investigate</Button>
            </div>
          </div>
          ))) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No anomalies detected</p>
              <p className="text-sm text-gray-400">System monitoring is active</p>
            </div>
          )}
      </CardContent>
    </Card>
  )
}

function CustomersTable() {
  const { data: customersData, loading, error, refetch } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')

  const safeCustomersData = Array.isArray(customersData) ? customersData : []
  
  const filteredCustomers = safeCustomersData.filter(customer => 
    customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Monitor customer activity and detect anomalies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Monitor customer activity and detect anomalies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-lg font-medium">Error loading customers</p>
            <p className="text-muted-foreground mb-4">{(error as any) instanceof Error ? (error as any).message : String(error)}</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Customers</CardTitle>
        <CardDescription>Monitor customer activity and detect anomalies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No customers have been registered yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers.slice(0, 10).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{customer.name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {(customer as any).customer_cards?.length || 0} cards
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredCustomers.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 10 of {filteredCustomers.length} customers
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Create Customer Dialog Component
function CreateCustomerDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For now, show that this needs proper implementation
    alert(`Customer Creation Not Yet Implemented
    
This feature requires:
1. Creating a Supabase auth user account
2. Creating a customer record linked to that user
3. Proper role assignment (role_id = 3 for customers)

Form data would be:
- Name: ${formData.name}
- Email: ${formData.email}

Please implement the full user + customer creation flow in /api/admin/customers endpoint.`)
    
    // Reset form and close dialog
    setFormData({ name: '', email: '' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer account. This will create both a user account and customer profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">Full Name</Label>
              <Input
                id="customer-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer's full name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">Email Address</Label>
              <Input
                id="customer-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
                required
              />
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This will create a customer account with a temporary password. 
                The customer will receive an email to set their password.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LegacyAdminCustomers() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Monitoring</h1>
            <p className="text-muted-foreground">
              Track customer activity and detect anomalies
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Stats */}
        <CustomerStats />

        {/* Anomaly Detection */}
        <AnomalyDetection />

        {/* Customers Table */}
        <CustomersTable />
      </div>
      
      {/* Add Customer Dialog */}
      <CreateCustomerDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </AdminLayoutClient>
  )
}

export default function AdminCustomers() {
  const enhancement = getPageEnhancement('admin', 'management')
  
  return (
    <ComponentErrorBoundary fallback={createErrorFallback('admin', 'Customer Management')}>
      <div className={enhancement.containerClass}>
        <LegacyAdminCustomers />
      </div>
    </ComponentErrorBoundary>
  )
} 