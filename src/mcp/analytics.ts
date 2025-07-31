/**
 * MCP Analytics Operations
 * All analytics and dashboard statistics operations
 */

import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server'
import type { MCPResponse, MCPAnalytics, MCPAuthContext } from './types'

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<MCPResponse<MCPAnalytics>> {
  try {
    const supabase = createAdminClient()
    
    // Execute all queries in parallel for better performance
    const [
      businessesResult,
      customersResult,
      stampCardsResult,
      membershipCardsResult,
      customerCardsResult
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('stamp_cards').select('*', { count: 'exact', head: true }),
      supabase.from('membership_cards').select('*', { count: 'exact', head: true }),
      supabase.from('customer_cards').select('*', { count: 'exact', head: true })
    ])
    
    // Check for errors
    const errors = [
      businessesResult.error,
      customersResult.error,
      stampCardsResult.error,
      membershipCardsResult.error,
      customerCardsResult.error
    ].filter(Boolean)
    
    if (errors.length > 0) {
      return {
        success: false,
        error: errors[0]?.message || 'Failed to fetch analytics data'
      }
    }
    
    // Calculate active cards (customer_cards with status 'active')
    const { count: activeCardsCount } = await supabase
      .from('customer_cards')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // Calculate recent activity (cards created in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentActivity } = await supabase
      .from('customer_cards')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())
    
    const stats: MCPAnalytics = {
      totalBusinesses: businessesResult.count || 0,
      totalCustomers: customersResult.count || 0,
      totalCards: (customerCardsResult.count || 0),
      totalStampCards: stampCardsResult.count || 0,
      totalMembershipCards: membershipCardsResult.count || 0,
      activeCards: activeCardsCount || 0,
      recentActivity: recentActivity || 0
    }
    
    return {
      success: true,
      data: stats
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get business dashboard statistics
 */
export async function getBusinessStats(context: MCPAuthContext): Promise<MCPResponse<any>> {
  try {
    if (context.userRole !== 2 || !context.businessId) {
      return {
        success: false,
        error: 'Business access required'
      }
    }
    
    const supabase = await createServerClient()
    
    // Get business's stamp cards and membership cards
    const [stampCardsResult, membershipCardsResult] = await Promise.all([
      supabase
        .from('stamp_cards')
        .select('*', { count: 'exact' })
        .eq('business_id', context.businessId)
        .eq('status', 'active'),
      supabase
        .from('membership_cards')
        .select('*', { count: 'exact' })
        .eq('business_id', context.businessId)
        .eq('status', 'active')
    ])
    
    if (stampCardsResult.error || membershipCardsResult.error) {
      return {
        success: false,
        error: stampCardsResult.error?.message || membershipCardsResult.error?.message
      }
    }
    
    // Get customer cards for this business
    const { data: customerCards, error: customerCardsError } = await supabase
      .from('customer_cards')
      .select('*')
      .or(`stamp_card_id.in.(${stampCardsResult.data?.map(sc => sc.id).join(',') || ''}),membership_card_id.in.(${membershipCardsResult.data?.map(mc => mc.id).join(',') || ''})`)
    
    if (customerCardsError) {
      return {
        success: false,
        error: customerCardsError.message
      }
    }
    
    const stats = {
      totalStampCards: stampCardsResult.count || 0,
      totalMembershipCards: membershipCardsResult.count || 0,
      totalCustomerCards: customerCards?.length || 0,
      activeCustomerCards: customerCards?.filter(cc => cc.status === 'active').length || 0,
      recentCustomerCards: customerCards?.filter(cc => {
        const createdAt = new Date(cc.created_at)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return createdAt >= sevenDaysAgo
      }).length || 0
    }
    
    return {
      success: true,
      data: stats
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}