/**
 * MCP Auth Operations
 * All authentication-related database operations
 */

import { createAdminClient } from '@/lib/supabase/admin-client'
import { getServerUser, getServerSession } from '@/lib/supabase/server'
import type { MCPResponse, MCPAuthContext } from './types'

export interface MCPUser {
  id: string
  email: string
  role_id: number
  created_at: string
  updated_at: string
}

/**
 * Get auth context from server session
 * This is the main function API routes should use to get user context
 */
export async function getAuthContext(): Promise<MCPResponse<MCPAuthContext>> {
  try {
    const { user, error } = await getServerUser()
    
    if (error || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }
    
    // Get user role from database
    const supabase = createAdminClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      return {
        success: false,
        error: 'Failed to get user role'
      }
    }
    
    // Get business ID if user is a business owner
    let businessId: string | undefined
    if (userData.role_id === 2) { // Business role
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      
      businessId = business?.id
    }
    
    return {
      success: true,
      data: {
        userId: user.id,
        userRole: userData.role_id,
        businessId
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
 * Require admin authentication
 */
export async function requireAdmin(): Promise<MCPResponse<MCPAuthContext>> {
  const authResult = await getAuthContext()
  
  if (!authResult.success || !authResult.data) {
    return authResult
  }
  
  if (authResult.data.userRole !== 1) {
    return {
      success: false,
      error: 'Admin access required'
    }
  }
  
  return authResult
}

/**
 * Require business authentication
 */
export async function requireBusiness(): Promise<MCPResponse<MCPAuthContext>> {
  const authResult = await getAuthContext()
  
  if (!authResult.success || !authResult.data) {
    return authResult
  }
  
  if (authResult.data.userRole !== 2) {
    return {
      success: false,
      error: 'Business access required'
    }
  }
  
  return authResult
}

/**
 * Require customer authentication
 */
export async function requireCustomer(): Promise<MCPResponse<MCPAuthContext>> {
  const authResult = await getAuthContext()
  
  if (!authResult.success || !authResult.data) {
    return authResult
  }
  
  if (authResult.data.userRole !== 3) {
    return {
      success: false,
      error: 'Customer access required'
    }
  }
  
  return authResult
}

/**
 * Get user by ID (admin only)
 */
export async function getUserById(userId: string): Promise<MCPResponse<MCPUser>> {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
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