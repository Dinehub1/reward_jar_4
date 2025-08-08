'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAdminAuth } from '@/lib/hooks/use-admin-auth'

interface AdminAuthContextType {
  isAdmin: boolean
  isLoading: boolean
  user: any
  error: string | null
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

interface AdminAuthProviderProps {
  children: ReactNode
  requireAuth?: boolean
}

/**
 * Global Admin Auth Context Provider
 * Prevents multiple instances of useAdminAuth hook and reduces API calls
 */
export function AdminAuthProvider({ children, requireAuth = true }: AdminAuthProviderProps) {
  const adminAuth = useAdminAuth(requireAuth)
  
  console.log('🔄 ADMIN AUTH PROVIDER - State:', {
    isAdmin: adminAuth.isAdmin,
    isLoading: adminAuth.isLoading,
    hasUser: !!adminAuth.user,
    requireAuth
  })

  return (
    <AdminAuthContext.Provider value={adminAuth}>
      {children}
    </AdminAuthContext.Provider>
  )
}

/**
 * Hook to consume admin auth context
 * Use this instead of useAdminAuth directly to prevent duplicate instances
 */
export function useAdminAuthContext(): AdminAuthContextType {
  const context = useContext(AdminAuthContext)
  
  if (context === undefined) {
    throw new Error('useAdminAuthContext must be used within an AdminAuthProvider')
  }
  
  return context
}

export default AdminAuthProvider