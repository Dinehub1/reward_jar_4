/**
 * RewardJar 4.0 - Audit History API
 * Store and retrieve audit history for trend analysis
 * 
 * @version 4.0
 * @path /api/admin/audit-history
 * @created January 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-only'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse } from '@/lib/supabase/types'

/**
 * GET /api/admin/audit-history
 * Retrieve audit history with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching audit history...')

    // Verify admin authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Audit History: Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Verify admin role
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      console.log('❌ Audit History: Admin access denied, user role:', userData?.role_id)
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const auditType = url.searchParams.get('audit_type')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build query
    let query = adminClient
      .from('audit_history')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
    }

    if (auditType) {
      query = query.eq('audit_type', auditType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: auditHistory, error } = await query

    if (error) {
      console.error('❌ Failed to fetch audit history:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit history' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await adminClient
      .from('audit_history')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Retrieved ${auditHistory?.length || 0} audit records`)

    return NextResponse.json({
      success: true,
      data: auditHistory || [],
      meta: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    } as ApiResponse<any[]>)

  } catch (error) {
    console.error('❌ Audit history fetch failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/audit-history
 * Store new audit result
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💾 Storing audit history record...')

    // Verify admin authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Audit History: Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Verify admin role
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      console.log('❌ Audit History: Admin access denied, user role:', userData?.role_id)
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { audit_type, results, timestamp } = body

    if (!audit_type || !results) {
      return NextResponse.json(
        { success: false, error: 'audit_type and results are required' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Store audit record
    const { data: auditRecord, error } = await adminClient
      .from('audit_history')
      .insert({
        audit_type,
        results,
        audit_date: timestamp || new Date().toISOString(),
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to store audit record:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to store audit record' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    console.log(`✅ Stored audit record: ${audit_type}`)

    return NextResponse.json({
      success: true,
      data: auditRecord,
      message: 'Audit record stored successfully'
    } as ApiResponse<any>)

  } catch (error) {
    console.error('❌ Audit history store failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/audit-history
 * Clean up old audit records (keep last 90 days)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Cleaning up old audit records...')

    // Verify admin authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Verify admin role
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Delete records older than 90 days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)

    const { data: deletedRecords, error } = await adminClient
      .from('audit_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      console.error('❌ Failed to clean up audit records:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to clean up audit records' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    const deletedCount = deletedRecords?.length || 0
    console.log(`✅ Cleaned up ${deletedCount} old audit records`)

    return NextResponse.json({
      success: true,
      data: { deletedCount },
      message: `Cleaned up ${deletedCount} old audit records`
    } as ApiResponse<{ deletedCount: number }>)

  } catch (error) {
    console.error('❌ Audit history cleanup failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}