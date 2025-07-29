import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Building, 
  Users,
  Flag,
  Clock,
  Eye
} from 'lucide-react'

interface Alert {
  id: string
  type: 'low_activity' | 'high_activity' | 'new_business' | 'flagged_business'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
  business_id?: string
  business_name?: string
}

async function getInactiveBusinesses() {
  const supabase = createAdminClient()

  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        created_at,
        stamp_cards(
          customer_cards(created_at)
        )
      `)
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10)

    if (error) {
      console.error('Error fetching inactive businesses:', error)
      return []
    }

    return businesses?.map(business => ({
      id: business.id,
      type: 'low_activity' as const,
      title: `Low Activity: ${business.name}`,
      description: 'No customer activity in the last 30 days',
      severity: 'medium' as const,
      created_at: new Date().toISOString(),
      business_id: business.id,
      business_name: business.name
    })) || []
  } catch (error) {
    console.error('Error fetching inactive businesses:', error)
    return []
  }
}

async function getAbnormalActivity() {
  const supabase = createAdminClient()

  try {
    // This would be more complex in a real scenario
    // For now, return empty array as placeholder
    return []
  } catch (error) {
    console.error('Error fetching abnormal activity:', error)
    return []
  }
}

async function getNewBusinesses() {
  const supabase = createAdminClient()

  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching new businesses:', error)
      return []
    }

    return businesses?.map(business => ({
      id: business.id,
      type: 'new_business' as const,
      title: `New Business: ${business.name}`,
      description: 'Recently registered business',
      severity: 'low' as const,
      created_at: business.created_at,
      business_id: business.id,
      business_name: business.name
    })) || []
  } catch (error) {
    console.error('Error fetching new businesses:', error)
    return []
  }
}

async function getAllAlerts(): Promise<Alert[]> {
  try {
    const [inactiveBusinesses, abnormalActivity, newBusinesses] = await Promise.all([
      getInactiveBusinesses(),
      getAbnormalActivity(),
      getNewBusinesses()
    ])

    return [
      ...inactiveBusinesses,
      ...abnormalActivity,
      ...newBusinesses
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    console.error('Error getting all alerts:', error)
    return []
  }
}

function AlertCard({ alert }: { alert: Alert }) {
  const severityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const typeIcons = {
    low_activity: '📉',
    high_activity: '🔁',
    new_business: '🆕'
  }

  return (
    <Card className={`border-l-4 ${severityColors[alert.severity]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{typeIcons[alert.type]}</span>
            <div>
              <CardTitle className="text-lg">{alert.title}</CardTitle>
              <CardDescription>{alert.business_name}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={severityColors[alert.severity]}>
              {alert.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {alert.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{alert.description}</p>
          
          {/* Metadata */}
          {alert.business_id && (
            <div className="text-xs text-gray-500 space-y-1">
              <Link href={`/admin/businesses/${alert.business_id}`}>
                <Button variant="outline" size="sm">
                  View Business
                </Button>
              </Link>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(alert.created_at).toLocaleString()}
            </span>
            <div className="flex space-x-2">
              {alert.business_id && (
                <Link href={`/admin/businesses/${alert.business_id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm">
                Mark Resolved
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function AlertsOverview() {
  const alerts = await getAllAlerts()
  
  const stats = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    unresolved: alerts.filter(a => !a.resolved).length
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          <span className="text-2xl">🚨</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Active alerts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <span className="text-2xl">🔴</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.high}</div>
          <p className="text-xs text-muted-foreground">
            Immediate attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
          <span className="text-2xl">🟠</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
          <p className="text-xs text-muted-foreground">
            Monitor closely
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
          <span className="text-2xl">🔵</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
          <p className="text-xs text-muted-foreground">
            Informational
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
          <span className="text-2xl">⏳</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unresolved}</div>
          <p className="text-xs text-muted-foreground">
            Need action
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function AlertsList({ type }: { type?: string }) {
  const allAlerts = await getAllAlerts()
  const alerts = type ? allAlerts.filter(alert => alert.type === type) : allAlerts

  return (
    <div className="space-y-4">
      {alerts.length > 0 ? (
        alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No alerts found
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function AdminAlerts() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
            <p className="text-muted-foreground">
              Automated monitoring and anomaly detection
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Refresh Alerts</Button>
            <Button>Configure Rules</Button>
          </div>
        </div>

        {/* Overview Stats */}
        <Suspense fallback={<div>Loading overview...</div>}>
          <AlertsOverview />
        </Suspense>

        {/* Alerts Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Alerts</TabsTrigger>
            <TabsTrigger value="low_activity">Inactive Businesses</TabsTrigger>
            <TabsTrigger value="high_activity">Abnormal Activity</TabsTrigger>
            <TabsTrigger value="new_business">New Businesses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Suspense fallback={<div>Loading alerts...</div>}>
              <AlertsList />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="low_activity">
            <Suspense fallback={<div>Loading inactive businesses...</div>}>
              <AlertsList type="low_activity" />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="high_activity">
            <Suspense fallback={<div>Loading abnormal activity...</div>}>
              <AlertsList type="high_activity" />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="new_business">
            <Suspense fallback={<div>Loading new businesses...</div>}>
              <AlertsList type="new_business" />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 