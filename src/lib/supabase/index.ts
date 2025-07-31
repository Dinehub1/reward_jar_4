/**
 * Supabase Client Exports for RewardJar 4.0
 * 
 * Centralized exports for all Supabase clients and types.
 * Import the appropriate client for your use case.
 */

// Client-side exports (for browser/React components)
export { createClient, createAuthClient } from './client'

// Server-side exports (for API routes and server components)
export { createServerClient } from './server-only'

// Admin-only exports (for admin API routes only)
export { createAdminClient, createSecureAdminClient, createDevAdminClient } from './admin-client'

// Type exports
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  User,
  Business,
  Customer,
  StampCard,
  MembershipCard,
  CustomerCard,
  SessionUsage,
  WalletUpdateQueue,
  BusinessWithDetails,
  CustomerCardWithDetails,
  StampCardWithDetails,
  MembershipCardWithDetails,
  AdminStats,
  ApiResponse,
  PaginatedResponse,
  WalletData,
  StampCardForm,
  MembershipCardForm,
  BusinessForm,
  CustomerForm,
  SupabaseError
} from './types'

// Re-export for backwards compatibility (deprecated)
export { createClient as default } from './client'