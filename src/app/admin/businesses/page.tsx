import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AdminLayout } from '@/components/layouts/AdminLayout'

interface Business {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  status: string
  flagged?: boolean
  created_at: string
  updated_at?: string
  total_cards: number
  active_cards: number
}

interface BusinessMetrics {
  totalBusinesses: number
  activeBusinesses: number
  flaggedBusinesses: number
  newThisWeek: number
}

// Fetch businesses using the working API endpoint
async function getBusinesses(): Promise<Business[]> {
  console.log('🏢 BUSINESSES PAGE - Starting business data fetch via API...')

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/all-data`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch businesses')
    }

    const businesses = data.data.businesses || []
    console.log('✅ BUSINESSES PAGE - Fetched businesses via API:', businesses.length)

    return businesses
  } catch (error) {
    console.error('❌ BUSINESSES PAGE - Error fetching businesses:', error)
    return []
  }
}

// Fetch business stats using the working API endpoint
async function getBusinessStats(): Promise<BusinessMetrics> {
  console.log('📈 BUSINESSES PAGE - Starting business stats fetch via API...')

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/all-data`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch business stats')
    }

    const metrics = data.data.metrics.businesses
    console.log('✅ BUSINESSES PAGE - Business stats via API:', metrics)

    return metrics
  } catch (error) {
    console.error('❌ BUSINESSES PAGE - Error fetching business stats:', error)
    return {
      totalBusinesses: 0,
      activeBusinesses: 0,
      flaggedBusinesses: 0,
      newThisWeek: 0
    }
  }
}

function BusinessRow({ business }: { business: Business }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium">{business.name}</div>
          <div className="text-sm text-gray-500">{business.id.slice(0, 8)}...</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <div className="text-sm">{business.email}</div>
          {business.phone && (
            <div className="text-sm text-gray-500">{business.phone}</div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
          {business.status}
        </Badge>
        {business.flagged && (
          <Badge variant="destructive" className="ml-1">
            Flagged
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div>{business.total_cards} total</div>
          <div className="text-gray-500">{business.active_cards} active</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div>{business.active_cards}</div>
          <div className="text-gray-500">enrolled</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          {new Date(business.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          <Link href={`/admin/businesses/${business.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
          <Button variant="outline" size="sm">Edit</Button>
        </div>
      </td>
    </tr>
  )
}

async function BusinessStats() {
  const stats = await getBusinessStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <span className="text-2xl">🏢</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.newThisWeek} from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
          <span className="text-2xl">✅</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalBusinesses > 0 ? Math.round((stats.activeBusinesses / stats.totalBusinesses) * 100) : 0}% active rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flagged Businesses</CardTitle>
          <span className="text-2xl">🚩</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.flaggedBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            Require attention
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
            +{stats.newThisWeek > 0 ? Math.round((stats.newThisWeek / Math.max(stats.totalBusinesses, 1)) * 100) : 0}% from last week
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function BusinessesTable() {
  const businesses = await getBusinesses()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>All Businesses</CardTitle>
            <CardDescription>
              Manage and monitor all business accounts
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Input placeholder="Search businesses..." className="w-64" />
            <Button>Add Business</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Business</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Cards</th>
                <th className="px-4 py-3 text-center font-medium">Customers</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.length > 0 ? (
                businesses.map((business) => (
                  <BusinessRow key={business.id} business={business} />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No businesses found
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

export default function AdminBusinesses() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Management</h1>
          <p className="text-muted-foreground">
            View, control, and monitor all business accounts
          </p>
        </div>

        {/* Stats */}
        <Suspense fallback={<div>Loading stats...</div>}>
          <BusinessStats />
        </Suspense>

        {/* Businesses Table */}
        <Suspense fallback={<div>Loading businesses...</div>}>
          <BusinessesTable />
        </Suspense>
      </div>
    </AdminLayout>
  )
} 