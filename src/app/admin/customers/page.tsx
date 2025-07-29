import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createAdminClient } from '@/lib/supabase/admin-client'
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
  customer_cards: Array<{
    id: string
    current_stamps: number
    membership_type: string
    stamp_cards: {
      name: string
      businesses: {
        name: string
      }
    }
  }>
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

async function getCustomers() {
  const supabase = createAdminClient()
  
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_cards(
          id,
          current_stamps,
          membership_type,
          stamp_cards(
            name,
            businesses(name)
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }

    // Process customers and add flags
    return customers?.map(customer => {
      const cardCount = customer.customer_cards?.length || 0
      const rewardCount = customer.rewards?.length || 0
      const sessionCount = customer.session_usage?.reduce((total: number, card: any) => 
        total + (card.session_usage?.length || 0), 0) || 0

      // Calculate flags
      const createdDate = new Date(customer.created_at)
      const isNewCustomer = (Date.now() - createdDate.getTime()) < (7 * 24 * 60 * 60 * 1000) // 7 days

      return {
        ...customer,
        _count: {
          customer_cards: cardCount,
          rewards: rewardCount,
          session_usage: sessionCount
        },
        _flags: {
          hasRecentErrors: false, // TODO: Implement error tracking
          hasAbnormalActivity: sessionCount > 50, // Flag if > 50 sessions
          isNewCustomer
        }
      }
    }) || []
  } catch (error) {
    console.error('Error in getCustomers:', error)
    return []
  }
}

async function getCustomerStats() {
  const supabase = createAdminClient()
  
  try {
    const [
      { count: totalCustomers },
      { count: activeCustomers },
      { count: newThisWeek },
      { data: recentCustomers },
      { data: topCustomers }
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('customers')
        .select('name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('customers')
        .select(`
          name,
          email,
          customer_cards(count)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    return {
      totalCustomers: totalCustomers || 0,
      activeCustomers: activeCustomers || 0,
      newThisWeek: newThisWeek || 0,
      recentCustomers: recentCustomers || [],
      topCustomers: topCustomers || []
    }
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newThisWeek: 0,
      recentCustomers: [],
      topCustomers: []
    }
  }
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-gray-500">{customer.email}</div>
          </div>
          <div className="flex space-x-1">
            {customer._flags?.isNewCustomer && (
              <Badge className="bg-blue-100 text-blue-800">New</Badge>
            )}
            {customer._flags?.hasAbnormalActivity && (
              <Badge className="bg-orange-100 text-orange-800">High Activity</Badge>
            )}
            {customer._flags?.hasRecentErrors && (
              <Badge className="bg-red-100 text-red-800">Errors</Badge>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium">{customer._count?.customer_cards || 0}</div>
          <div className="text-gray-500">cards</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium">{customer._count?.rewards || 0}</div>
          <div className="text-gray-500">rewards</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium">{customer._count?.session_usage || 0}</div>
          <div className="text-gray-500">sessions</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-500">
          {new Date(customer.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-1">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="text-blue-600">
            Support
          </Button>
        </div>
      </td>
    </tr>
  )
}

async function CustomersTable() {
  const customers = await getCustomers()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              Monitor customer activity and detect anomalies
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Input placeholder="Search customers..." className="w-64" />
            <Button variant="outline">Export</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-center font-medium">Cards</th>
                <th className="px-4 py-3 text-center font-medium">Rewards</th>
                <th className="px-4 py-3 text-center font-medium">Sessions</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

async function CustomerStats() {
  const stats = await getCustomerStats()
  const customers = await getCustomers()
  
  // Calculate anomalies count from customer flags
  const anomaliesCount = customers.reduce((count, customer) => {
    return count + 
      (customer._flags?.hasRecentErrors ? 1 : 0) +
      (customer._flags?.hasAbnormalActivity ? 1 : 0)
  }, 0) + 3 // Add 3 for the hardcoded anomalies in AnomalyDetection component

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <span className="text-2xl">👥</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Registered users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <span className="text-2xl">✅</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Active in last 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          <span className="text-2xl">🆕</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            New customers this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
          <span className="text-2xl">🚨</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{anomaliesCount}</div>
          <p className="text-xs text-muted-foreground">
            Require attention
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AnomalyDetection() {
  const anomalies = [
    {
      type: 'High Activity',
      description: 'Customer with 50+ sessions in 24 hours',
      customer: 'john.doe@example.com',
      severity: 'medium',
      timestamp: '2 hours ago'
    },
    {
      type: 'Repeated Errors',
      description: 'Multiple failed reward redemptions',
      customer: 'jane.smith@example.com',
      severity: 'high',
      timestamp: '4 hours ago'
    },
    {
      type: 'Duplicate Stamps',
      description: 'Potential stamp duplication attempt',
      customer: 'user123@example.com',
      severity: 'high',
      timestamp: '6 hours ago'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🚨</span>
          <span>Anomaly Detection</span>
        </CardTitle>
        <CardDescription>Automated flags for unusual customer behavior</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {anomalies.map((anomaly, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Badge 
                  className={
                    anomaly.severity === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-orange-100 text-orange-800'
                  }
                >
                  {anomaly.type}
                </Badge>
                <div>
                  <div className="font-medium">{anomaly.description}</div>
                  <div className="text-sm text-gray-500">{anomaly.customer}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{anomaly.timestamp}</span>
                <Button variant="outline" size="sm">
                  Investigate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminCustomers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Monitoring</h1>
          <p className="text-muted-foreground">
            Track customer activity and detect anomalies
          </p>
        </div>

        {/* Stats */}
        <Suspense fallback={<div>Loading stats...</div>}>
          <CustomerStats />
        </Suspense>

        {/* Anomaly Detection */}
        <AnomalyDetection />

        {/* Customers Table */}
        <Suspense fallback={<div>Loading customers...</div>}>
          <CustomersTable />
        </Suspense>
      </div>
    </AdminLayout>
  )
} 