/**
 * MCP Card Operations
 * All card-related database operations (stamp cards, membership cards, customer cards)
 */

import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server'
import type { 
  MCPResponse, 
  MCPPaginatedResponse, 
  MCPStampCard, 
  MCPMembershipCard, 
  MCPCustomerCard,
  MCPQueryOptions, 
  MCPAuthContext 
} from './types'

/**
 * Get all stamp cards
 */
export async function getAllStampCards(options: MCPQueryOptions = {}): Promise<MCPPaginatedResponse<MCPStampCard>> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('stamp_cards')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (key === '_search') {
          query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%`)
        } else {
          query = query.eq(key, value)
        }
      })
    }
    
    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.orderDirection === 'asc' 
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }
    
    // Apply pagination
    const page = options.page || 1
    const limit = options.limit || 10
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > page * limit
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all membership cards
 */
export async function getAllMembershipCards(options: MCPQueryOptions = {}): Promise<MCPPaginatedResponse<MCPMembershipCard>> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('membership_cards')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (key === '_search') {
          query = query.or(`name.ilike.%${value}%,description.ilike.%${value}%`)
        } else {
          query = query.eq(key, value)
        }
      })
    }
    
    // Apply ordering  
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.orderDirection === 'asc' 
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }
    
    // Apply pagination
    const page = options.page || 1
    const limit = options.limit || 10
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > page * limit
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all customer cards
 */
export async function getAllCustomerCards(options: MCPQueryOptions = {}): Promise<MCPPaginatedResponse<MCPCustomerCard>> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('customer_cards')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.orderDirection === 'asc' 
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }
    
    // Apply pagination
    const page = options.page || 1
    const limit = options.limit || 10
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > page * limit
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get cards by business ID
 */
export async function getCardsByBusiness(
  businessId: string, 
  context: MCPAuthContext, 
  options: MCPQueryOptions = {}
): Promise<MCPResponse<{ stampCards: MCPStampCard[], membershipCards: MCPMembershipCard[] }>> {
  try {
    const supabase = await createServerClient()
    
    // Verify user owns the business
    if (context.businessId !== businessId && context.userRole !== 1) {
      return {
        success: false,
        error: 'Access denied'
      }
    }
    
    const [stampCardsResult, membershipCardsResult] = await Promise.all([
      supabase
        .from('stamp_cards')
        .select('*')
        .eq('business_id', businessId),
      supabase
        .from('membership_cards')
        .select('*')
        .eq('business_id', businessId)
    ])
    
    if (stampCardsResult.error || membershipCardsResult.error) {
      return {
        success: false,
        error: stampCardsResult.error?.message || membershipCardsResult.error?.message
      }
    }
    
    return {
      success: true,
      data: {
        stampCards: stampCardsResult.data || [],
        membershipCards: membershipCardsResult.data || []
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}