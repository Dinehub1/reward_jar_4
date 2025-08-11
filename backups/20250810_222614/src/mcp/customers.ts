/**
 * MCP Customer Operations
 * All customer-related database operations
 */

import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server'
import type { MCPResponse, MCPPaginatedResponse, MCPCustomer, MCPQueryOptions, MCPAuthContext } from './types'

/**
 * Get all customers (admin only)
 */
export async function getAllCustomers(options: MCPQueryOptions = {}): Promise<MCPPaginatedResponse<MCPCustomer>> {
  try {
    const supabase = createAdminClient()
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (key === '_search') {
          query = query.or(`name.ilike.%${value}%,email.ilike.%${value}%`)
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
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<MCPResponse<MCPCustomer>> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
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
 * Create new customer
 */
export async function createCustomer(
  customerData: Omit<MCPCustomer, 'id' | 'created_at' | 'updated_at'>
): Promise<MCPResponse<MCPCustomer>> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
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