import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface Business {
  id: string
  name: string
  contact_email: string
  description: string
  status: string
  is_flagged: boolean
  admin_notes: string
  created_at: string
  owner_id: string
  users?: {
    email: string
  }
  _count?: {
    stamp_cards: number
    customer_cards: number
  }
}

async function getBusinesses() {
  const supabase = createAdminClient()

  console.log('🏢 BUSINESSES PAGE - Starting business data fetch with admin client...')

  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('📊 BUSINESSES PAGE - Raw businesses data with admin client:', businesses?.length || 0, 'businesses')
    console.log('❌ BUSINESSES PAGE - Fetch error:', error)

    if (error) {
      console.error('🚨 BUSINESSES PAGE - Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    // Also try a simple query to verify connection
    const { data: simpleTest, error: simpleError } = await supabase
      .from('businesses')
      .select('id, name')
      .limit(5)

    console.log('🧪 BUSINESSES PAGE - Simple test query with admin client:', simpleTest?.length || 0, 'businesses')
    console.log('❌ BUSINESSES PAGE - Simple test error:', simpleError)

    // Process the data to add counts (simplified for now)
    const processedBusinesses = businesses?.map(business => ({
      ...business,
      _count: {
        stamp_cards: 5, // Placeholder - would query stamp_cards table separately
        customer_cards: 0 // Placeholder - would query customer enrollments separately
      }
    })) || []

    console.log('✅ BUSINESSES PAGE - Processed businesses with admin client:', processedBusinesses.length)
    if (processedBusinesses.length > 0) {
      console.log('🎯 BUSINESSES PAGE - First business sample:', {
        name: processedBusinesses[0].name,
        id: processedBusinesses[0].id,
        cardCount: processedBusinesses[0]._count
      })
    }

    return processedBusinesses
  } catch (error) {
    console.error('💥 BUSINESSES PAGE - Catch block error with admin client:', error)
    return []
  }
}

async function getBusinessStats() {
  const supabase = createAdminClient()
  
  try {
    const [
      { count: totalBusinesses },
      { count: activeBusinesses },
      { count: flaggedBusinesses },
      { count: newThisWeek }
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
      supabase.from('businesses').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    console.log('📈 BUSINESSES PAGE - System metrics with admin client:', {
      totalBusinesses,
      activeBusinesses,
      flaggedBusinesses,
      newThisWeek
    })

    return {
      totalBusinesses: totalBusinesses || 0,
      activeBusinesses: activeBusinesses || 0,
      flaggedBusinesses: flaggedBusinesses || 0,
      newThisWeek: newThisWeek || 0
    }
  } catch (error) {
    console.error('💥 BUSINESSES PAGE - Error fetching metrics:', error)
    return {
      totalBusinesses: 0,
      activeBusinesses: 0,
      flaggedBusinesses: 0,
      newThisWeek: 0
    }
  }
}

function BusinessRow({ business }: { business: Business }) {
  const statusColor = business.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  const flaggedColor = business.is_flagged ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium">{business.name}</div>
            <div className="text-sm text-gray-500">{business.users?.email}</div>
          </div>
          {business.is_flagged && (
            <Badge className="bg-red-100 text-red-800">🚩 Flagged</Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <div>{business.contact_email}</div>
          <div className="text-gray-500 truncate max-w-xs">
            {business.description || 'No description'}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={statusColor}>
          {business.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium">{business._count?.stamp_cards || 0}</div>
          <div className="text-gray-500">cards</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium">{business._count?.customer_cards || 0}</div>
          <div className="text-gray-500">customers</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-500">
          {new Date(business.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-1">
          <Link href={`/admin/businesses/${business.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-blue-600">
            Impersonate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={business.is_flagged ? "text-green-600" : "text-red-600"}
          >
            {business.is_flagged ? 'Unflag' : 'Flag'}
          </Button>
        </div>
      </td>
    </tr>
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

async function BusinessStats() {
  const stats = await getBusinessStats()
  
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <span className="text-2xl">🏢</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            +12 from last month
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
            +33% from last week
          </p>
        </CardContent>
      </Card>
    </div>
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