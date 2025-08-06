'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/lib/hooks/use-admin-auth'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface AdminLayoutClientProps {
  children: ReactNode
  requireAuth?: boolean
}

// Admin Sidebar Component
function AdminSidebar() {
  const router = useRouter()

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/businesses', label: 'Businesses', icon: '🏢' },
    { href: '/admin/customers', label: 'Customers', icon: '👥' },
    { href: '/admin/cards', label: 'Cards', icon: '🎴' },
    { href: '/admin/alerts', label: 'Alerts', icon: '🚨' },
    { href: '/admin/support', label: 'Support', icon: '💬' },
    { href: '/admin/dev-tools', label: 'Developer Tools', icon: '🛠️' },
  ]

  return (
    <div className="w-64 bg-card border-r min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

// Admin Header Component
function AdminHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <div className="flex items-center space-x-4 ml-auto">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Logout
          </Link>
        </div>
      </div>
    </header>
  )
}

// Loading State Component
function LoadingState() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <div className="text-lg">Loading...</div>
            </div>
          </div>
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
        <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
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

  // Debug logging for troubleshooting
  console.log('🔍 AdminLayoutClient Debug:', {
    isAdmin,
    isLoading,
    user: user ? { id: user.id, email: user.email } : null,
    error,
    requireAuth
  })

  // Enhanced loading guards - prevent any rendering until auth is fully resolved
  if (isLoading) {
    console.log('🔄 AdminLayoutClient: Auth still loading, showing loading state')
    return <LoadingState />
  }

  // Additional safety check - if we don't have user data but should be admin, keep loading
  if (requireAuth && isAdmin && !user) {
    console.log('🔄 AdminLayoutClient: Admin verified but user data not loaded, continuing to load')
    return <LoadingState />
  }

  // If auth is required but user is not admin, redirect to login
  if (requireAuth && !isAdmin) {
    console.log('❌ AdminLayoutClient: Access denied - redirecting to login')
    // Use setTimeout to avoid redirect during render
    setTimeout(() => {
      router.push('/auth/login?error=admin_required')
    }, 0)
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-xl font-bold text-primary">
              RewardJar Admin
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            )}
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Default export for backward compatibility
export default AdminLayoutClient 