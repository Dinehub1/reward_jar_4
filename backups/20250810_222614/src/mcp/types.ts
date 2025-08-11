/**
 * MCP Layer Types
 * Standardized response types for all MCP operations
 */

export interface MCPResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp?: string
}

export interface MCPPaginatedResponse<T = any> extends MCPResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface MCPQueryOptions {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface MCPAuthContext {
  userId: string
  userRole: number
  businessId?: string
}

// Business Types
export interface MCPBusiness {
  id: string
  name: string
  owner_id: string
  contact_email: string
  location?: string
  description?: string
  logo_url?: string
  website_url?: string
  created_at: string
  updated_at: string
}

// Customer Types  
export interface MCPCustomer {
  id: string
  email: string
  name?: string
  phone?: string
  created_at: string
  updated_at: string
}

// Card Types
export interface MCPStampCard {
  id: string
  business_id: string
  name: string
  description?: string
  total_stamps: number
  reward_description: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface MCPMembershipCard {
  id: string
  business_id: string
  name: string
  description?: string
  total_sessions: number
  cost: number
  duration_days: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface MCPCustomerCard {
  id: string
  customer_id: string
  stamp_card_id?: string
  membership_card_id?: string
  current_stamps?: number
  sessions_used?: number
  expiry_date?: string
  status: 'active' | 'expired' | 'redeemed'
  created_at: string
  updated_at: string
}

// Analytics Types
export interface MCPAnalytics {
  totalBusinesses: number
  totalCustomers: number
  totalCards: number
  totalStampCards: number
  totalMembershipCards: number
  activeCards: number
  recentActivity: number
}