'use client'

import { ReactNode } from 'react'
import { AdminAuthProvider } from '@/lib/context/AdminAuthContext'

interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Admin Layout - Provides AdminAuthContext to all admin pages
 * This prevents multiple auth instances and reduces API calls
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider requireAuth={true}>
      {children}
    </AdminAuthProvider>
  )
}