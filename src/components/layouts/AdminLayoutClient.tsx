'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAdminAuth } from '@/lib/hooks/use-admin-auth'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ModernSidebar } from '@/components/modern/layout/ModernSidebar'
import { designTokens } from '@/lib/design-tokens'
import { User, LogOut } from 'lucide-react'

interface AdminLayoutClientProps {
  children: ReactNode
  requireAuth?: boolean
}

// Modern Admin Header Component
const ModernAdminHeader: React.FC<{ user: any, signOut: () => void }> = ({ user, signOut }) => {
  return (
    <motion.header 
      className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: designTokens.animation.easing.out }}
      style={{ borderColor: 'rgb(var(--border) / 0.6)' }}
    >
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          {/* Breadcrumb or page title can go here */}
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <motion.div 
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-accent/30 hover:bg-accent/40 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground/90">
                {user.email}
              </span>
            </motion.div>
          )}
          <ThemeToggle />
          <motion.button
            onClick={() => signOut()}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}



// Modern Loading State Component
function LoadingState() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ModernSidebar />
      <div className="flex-1">
        <ModernAdminHeader user={null} signOut={() => {}} />
        <main className="p-6">
          <motion.div 
            className="flex items-center justify-center min-h-[400px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <motion.div 
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="text-lg font-medium text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Loading admin panel...
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

// Access Denied State Component
function AccessDeniedState() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You don&apos;t have permission to access this page.</p>
        <Link href="/auth/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  )
}

// Main Admin Layout Component
export function AdminLayoutClient({ children, requireAuth = true }: AdminLayoutClientProps) {
  const { isAdmin, isLoading, user, error, signOut } = useAdminAuth(requireAuth)
  const router = useRouter()
  const isBrowser = typeof window !== 'undefined'

  // Debug logging for troubleshooting (browser only to avoid SSR/HEAD noise)
  if (isBrowser && process.env.NODE_ENV === 'development') {
    // Auth debugging removed in cleanup
  }

  // Enhanced loading guards - prevent any rendering until auth is fully resolved
  if (isLoading && isBrowser) {
    return <LoadingState />
  }

  // Additional safety check - if we don't have user data but should be admin, keep loading
  if (isBrowser && requireAuth && isAdmin && !user) {
    return <LoadingState />
  }

  // If auth is required but user is not admin, show access denied
  if (requireAuth && !isAdmin) {
    return <AccessDeniedState />
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: designTokens.animation.easing.out }}
    >
      {/* Modern Main Layout */}
      <div className="flex">
        <ModernSidebar />
        <div className="flex-1 flex flex-col">
          <ModernAdminHeader user={user} signOut={signOut} />
          <motion.main 
            className="flex-1 p-6 overflow-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: designTokens.animation.easing.out }}
          >
            {children}
          </motion.main>
        </div>
      </div>
    </motion.div>
  )
}

// Default export for backward compatibility
export default AdminLayoutClient 