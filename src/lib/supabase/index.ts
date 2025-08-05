/**
 * Supabase Client Exports for RewardJar 4.0
 * 
 * Centralized exports for all Supabase clients and types.
 * Import the appropriate client for your use case.
 */

// Client-side exports (for browser/React components)
export { createClient, createAuthClient } from './client'

// Server-side exports (for API routes and server components)
// Import directly from './server-only' in server components to avoid client-side bundle issues
// export { createServerClient } from './server-only' // Commented out to prevent client-side imports

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

// Deprecated re-export removed - import createClient directly from './client'