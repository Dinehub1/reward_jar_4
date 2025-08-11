/**
 * MCP Business Operations
 * All business-related database operations
 */

import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server'
import type { MCPResponse, MCPPaginatedResponse, MCPBusiness, MCPQueryOptions, MCPAuthContext } from './types'

/**
 * Get all businesses (admin only)
 */
export async function getAllBusinesses(options: MCPQueryOptions = {}): Promise<MCPPaginatedResponse<MCPBusiness>> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (key === '_search') {
          // Special search filter for name and email
          query = query.or(`name.ilike.%${value}%,contact_email.ilike.%${value}%`)
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
 * Get business by ID
 */
export async function getBusinessById(businessId: string): Promise<MCPResponse<MCPBusiness>> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    return {
      success: true,
      data
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get business by owner (user context)
 */
export async function getBusinessByOwner(context: MCPAuthContext): Promise<MCPResponse<MCPBusiness>> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', context.userId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    return {
      success: true,
      data
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create new business
 */
export async function createBusiness(
  businessData: Omit<MCPBusiness, 'id' | 'created_at' | 'updated_at'>,
  context: MCPAuthContext
): Promise<MCPResponse<MCPBusiness>> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        ...businessData,
        owner_id: context.userId
      })
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    return {
      success: true,
      data
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update business
 */
export async function updateBusiness(
  businessId: string,
  updates: Partial<MCPBusiness>,
  context: MCPAuthContext
): Promise<MCPResponse<MCPBusiness>> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessId)
      .eq('owner_id', context.userId) // Ensure user owns the business
      .select()
      .single()
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      }
    }
    
    return {
      success: true,
      data
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}