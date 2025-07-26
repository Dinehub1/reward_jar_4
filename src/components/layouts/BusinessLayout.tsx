'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getAuthStatus, signOut } from '@/lib/auth-protection'
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react'

interface BusinessLayoutProps {
  children: React.ReactNode
}

export default function BusinessLayout({ children }: BusinessLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('BusinessLayout: Starting auth check...')
        setAuthError(null)

        // Use the improved auth protection utility
        const authStatus = await getAuthStatus()

        if (!authStatus.isAuthenticated) {
          console.log('BusinessLayout: User not authenticated')
          router.push('/auth/login?error=unauthorized')
          return
        }

        if (!authStatus.isBusiness) {
          console.error('BusinessLayout: User is not a business user, role_id:', authStatus.user?.role_id)
          setAuthError(`Access denied: Business access requires role_id: 2, but user has role_id: ${authStatus.user?.role_id}`)
          router.push('/auth/login?error=insufficient_permissions')
          return
        }

        console.log('BusinessLayout: Auth check successful for business user')
        console.log('BusinessLayout: User:', authStatus.user?.email, 'Role:', authStatus.user?.role_id)
        
        // Get the actual Supabase User object for UI purposes
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()
        setUser(supabaseUser)
        setAuthError(null)
        
      } catch (error) {
        console.error('BusinessLayout: Auth check failed:', error)
        setAuthError(error instanceof Error ? error.message : 'Authentication failed')
        router.push('/auth/login?error=system_error')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('BusinessLayout: Auth state change:', event)
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/auth/login')
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Re-check auth when user signs in or token refreshes
          checkAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleSignOut = async () => {
    try {
      console.log('BusinessLayout: Signing out...')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('BusinessLayout: Sign out error:', error)
      router.push('/') // Force navigation even if sign out fails
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading...</div>
          <div className="text-sm text-gray-500 mt-1">Verifying business account access</div>
          {authError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">{authError}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Access Denied</div>
          <div className="text-sm text-gray-500 mt-1">Redirecting to login...</div>
          {authError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md max-w-md">
              <div className="text-sm text-red-700">{authError}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/business/dashboard', icon: '📊' },
    { name: 'Stamp Cards', href: '/business/stamp-cards', icon: '🎫' },
    { name: 'Memberships', href: '/business/memberships', icon: '💳' },
    { name: 'Analytics', href: '/business/analytics', icon: '📈' },
    { name: 'Profile', href: '/business/profile', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <span className="text-xl font-semibold text-gray-900">RewardJar Business</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            <div className="flex items-center h-16 px-4 border-b">
              <span className="text-xl font-semibold text-gray-900">RewardJar Business</span>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:ml-64 flex-1">
          {/* Top navigation */}
          <div className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-gray-600"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <UserIcon className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 