import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Server-side Supabase client for API routes
export const createServerClient = () => createRouteHandlerClient({ cookies })

// Server-side Supabase client for server components
export const createServerComponentClient = () => createServerComponentClient({ cookies }) 