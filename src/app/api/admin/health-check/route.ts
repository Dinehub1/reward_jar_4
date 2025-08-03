import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  console.log('🏥 ADMIN HEALTH CHECK - Starting comprehensive health check...')
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    admin_client: {
      creation: 'unknown',
      connection: 'unknown',
      data_access: 'unknown'
    },
    api_endpoints: {
      dashboard_stats: 'unknown',
      businesses_simple: 'unknown'
    },
    database_tables: {
      businesses: 0,
      customers: 0,
      customer_cards: 0,
      stamp_cards: 0,
      membership_cards: 0
    },
    issues: [] as string[],
    recommendations: [] as string[]
  }

  // Test admin client creation
  try {
    const supabase = createAdminClient()
    results.admin_client.creation = 'success'
    console.log('✅ Admin client created successfully')

    // Test database connection
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .limit(1)

      if (error) {
        results.admin_client.connection = 'failed'
        results.issues.push(`Database connection failed: ${error.message}`)
        console.error('❌ Database connection failed:', error)
      } else {
        results.admin_client.connection = 'success'
        results.admin_client.data_access = 'success'
        console.log('✅ Database connection successful')
      }
    } catch (dbError) {
      results.admin_client.connection = 'error'
      results.issues.push(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
      console.error('❌ Database error:', dbError)
    }

    // Test table access and get counts
    try {
      const [
        businessesResult,
        customersResult,
        customerCardsResult,
        stampCardsResult,
        membershipCardsResult
      ] = await Promise.allSettled([
        supabase.from('businesses').select('id'),
        supabase.from('customers').select('id'),
        supabase.from('customer_cards').select('id'),
        supabase.from('stamp_cards').select('id'),
        supabase.from('membership_cards').select('id')
      ])

      if (businessesResult.status === 'fulfilled') {
        results.database_tables.businesses = businessesResult.value.data?.length || 0
      } else {
        results.issues.push(`Businesses table access failed: ${businessesResult.reason}`)
      }

      if (customersResult.status === 'fulfilled') {
        results.database_tables.customers = customersResult.value.data?.length || 0
      } else {
        results.issues.push(`Customers table access failed: ${customersResult.reason}`)
      }

      if (customerCardsResult.status === 'fulfilled') {
        results.database_tables.customer_cards = customerCardsResult.value.data?.length || 0
      } else {
        results.issues.push(`Customer cards table access failed: ${customerCardsResult.reason}`)
      }

      if (stampCardsResult.status === 'fulfilled') {
        results.database_tables.stamp_cards = stampCardsResult.value.data?.length || 0
      } else {
        results.issues.push(`Stamp cards table access failed: ${stampCardsResult.reason}`)
      }

      if (membershipCardsResult.status === 'fulfilled') {
        results.database_tables.membership_cards = membershipCardsResult.value.data?.length || 0
      } else {
        results.issues.push(`Membership cards table access failed: ${membershipCardsResult.reason}`)
      }

      console.log('📊 Database table counts:', results.database_tables)

    } catch (tableError) {
      results.issues.push(`Table access error: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`)
      console.error('❌ Table access error:', tableError)
    }

  } catch (clientError) {
    results.admin_client.creation = 'failed'
    results.issues.push(`Admin client creation failed: ${clientError instanceof Error ? clientError.message : 'Unknown error'}`)
    console.error('❌ Admin client creation failed:', clientError)
  }

  // Test API endpoints
  try {
    const baseUrl = request.nextUrl.origin
    
    // Test dashboard stats endpoint
    try {
      const statsResponse = await fetch(`${baseUrl}/api/admin/dashboard-stats`)
      results.api_endpoints.dashboard_stats = statsResponse.ok ? 'success' : `failed (${statsResponse.status})`
    } catch (statsError) {
      results.api_endpoints.dashboard_stats = 'error'
      results.issues.push(`Dashboard stats API failed: ${statsError instanceof Error ? statsError.message : 'Unknown error'}`)
    }

    // Test businesses simple endpoint
    try {
      const businessesResponse = await fetch(`${baseUrl}/api/admin/businesses-simple`)
      results.api_endpoints.businesses_simple = businessesResponse.ok ? 'success' : `failed (${businessesResponse.status})`
    } catch (businessesError) {
      results.api_endpoints.businesses_simple = 'error'
      results.issues.push(`Businesses simple API failed: ${businessesError instanceof Error ? businessesError.message : 'Unknown error'}`)
    }

  } catch (apiError) {
    results.issues.push(`API endpoint testing failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`)
  }

  // Generate recommendations
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    results.recommendations.push('Add SUPABASE_SERVICE_ROLE_KEY to environment variables for admin operations')
  }

  if (results.database_tables.businesses === 0) {
    results.recommendations.push('No businesses found - consider seeding test data')
  }

  if (results.database_tables.customers === 0) {
    results.recommendations.push('No customers found - consider seeding test data')
  }

  if (results.issues.length === 0) {
    results.recommendations.push('All systems operational - admin dashboard should work correctly')
  }

  // Determine overall health status
  const healthStatus = results.issues.length === 0 ? 'healthy' : 
                      results.issues.length <= 2 ? 'warning' : 'critical'

  console.log(`🏥 ADMIN HEALTH CHECK - Status: ${healthStatus.toUpperCase()}`)
  console.log(`📊 Issues found: ${results.issues.length}`)
  console.log(`💡 Recommendations: ${results.recommendations.length}`)

  return NextResponse.json({
    status: healthStatus,
    ...results
  }, { 
    status: healthStatus === 'critical' ? 500 : healthStatus === 'warning' ? 200 : 200 
  })
}