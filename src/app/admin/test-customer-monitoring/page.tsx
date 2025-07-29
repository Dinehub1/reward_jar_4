
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface Customer {
  id: string
  name: string
  email: string
  created_at: string
  customer_cards: any[]
}

async function getCustomers() {
  const supabase = createAdminClient()
  
  console.log('🧪 TEST CUSTOMERS PAGE - Starting customer data fetch...')
  
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        customer_cards(
          id,
          current_stamps,
          sessions_used,
          membership_type,
          stamp_cards(
            name,
            businesses(name)
          )
        )
      `)
      .order('created_at', { ascending: false })

    console.log('📊 TEST CUSTOMERS PAGE - Raw customer data:', customers?.length || 0, 'customers')
    console.log('❌ TEST CUSTOMERS PAGE - Fetch error:', error)

    if (error) throw error

    return customers || []
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

async function getCustomerStats() {
  const supabase = createAdminClient()
  
  console.log('📈 TEST CUSTOMER STATS - Starting stats fetch...')
  
  try {
    const [
      { count: totalCustomers },
      { count: activeCustomers },
      { data: recentCustomers }
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('customers')
        .select('name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const stats = {
      totalCustomers: totalCustomers || 0,
      activeCustomers: activeCustomers || 0,
      newThisWeek: 0, // Placeholder
      anomalies: 5, // Placeholder for demo
      recentCustomers: recentCustomers || []
    }

    console.log('✅ TEST CUSTOMER STATS - Processed stats:', stats)
    
    return stats
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newThisWeek: 0,
      anomalies: 0,
      recentCustomers: []
    }
  }
}

function CustomerStatsCards({ stats }: { stats: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <span className="text-2xl">👥</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</div>
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
          <div className="text-2xl font-bold text-green-600">{stats.activeCustomers}</div>
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
          <div className="text-2xl font-bold text-purple-600">{stats.newThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            Recent customers (last 5)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
          <span className="text-2xl">🚨</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.anomalies}</div>
          <p className="text-xs text-muted-foreground">
            Require attention
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function CustomerRow({ customer }: { customer: Customer }) {
  const cardCount = customer.customer_cards?.length || 0
  const totalStamps = customer.customer_cards?.reduce((sum, card) => sum + (card.current_stamps || 0), 0) || 0
  const totalSessions = customer.customer_cards?.reduce((sum, card) => sum + (card.sessions_used || 0), 0) || 0

  return (
    <tr className="border-b hover:bg-accent/50 dark:hover:bg-accent/20">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-foreground">{customer.name}</div>
          <div className="text-sm text-muted-foreground">{customer.email}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium text-blue-600">{cardCount}</div>
          <div className="text-muted-foreground">cards</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium text-green-600">{totalStamps}</div>
          <div className="text-muted-foreground">stamps</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium text-purple-600">{totalSessions}</div>
          <div className="text-muted-foreground">sessions</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground">
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
            <CardTitle>All Customers ({customers.length})</CardTitle>
            <CardDescription>
              Monitor customer activity and detect anomalies - TEST MODE
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
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-center font-medium">Cards</th>
                <th className="px-4 py-3 text-center font-medium">Stamps</th>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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

export default async function TestCustomerMonitoringPage() {
  const stats = await getCustomerStats()
  
  console.log('🧪 TEST CUSTOMER MONITORING - Page rendering with stats:', stats)

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">🧪 Test Customer Monitoring</h1>
            <p className="text-muted-foreground">Track customer activity and detect anomalies - No Authentication Required</p>
          </div>
          <div className="flex space-x-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              ✅ Data Loading: {stats.totalCustomers > 0 ? 'Working' : 'No Data'}
            </Badge>
            <Button variant="outline" asChild>
              <a href="/admin/test-dashboard">← Back to Test Dashboard</a>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <CustomerStatsCards stats={stats} />

        {/* Anomaly Detection Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🚨</span>
              <span>Anomaly Detection</span>
            </CardTitle>
            <CardDescription>
              Automated flags for unusual customer behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center space-x-3">
                <Badge variant="destructive">High Activity</Badge>
                <div>
                  <div className="font-medium">Customer with 50+ sessions in 24 hours</div>
                  <div className="text-sm text-muted-foreground">john.doe@example.com</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">2 hours ago</span>
                <Button size="sm">Investigate</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">Repeated Errors</Badge>
                <div>
                  <div className="font-medium">Multiple failed reward redemptions</div>
                  <div className="text-sm text-muted-foreground">jane.smith@example.com</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">4 hours ago</span>
                <Button size="sm">Investigate</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">Duplicate Stamps</Badge>
                <div>
                  <div className="font-medium">Potential stamp duplication attempt</div>
                  <div className="text-sm text-muted-foreground">user123@example.com</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">6 hours ago</span>
                <Button size="sm">Investigate</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <CustomersTable />
      </div>
    </div>
  )
} 