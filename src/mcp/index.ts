/**
 * 🧠 MCP (Model-Controller-Persistence) Layer
 * 
 * This layer handles ALL database interactions for RewardJar.
 * API routes should ONLY call MCP functions, never direct Supabase queries.
 * 
 * RULES:
 * 1. All database queries go through MCP functions
 * 2. MCP functions use createAdminClient() for admin operations
 * 3. MCP functions use createServerClient() for user operations  
 * 4. MCP functions return standardized responses
 * 5. NO console.log() in production MCP code
 */

export * from './businesses'
export * from './customers'
export * from './cards'
export * from './analytics'
export * from './auth'
export * from './types'