'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthStatus } from '@/lib/auth-protection'
import type { User } from '@supabase/supabase-js'
import { Settings, Users, Building, LogOut, Shield, CreditCard } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('AdminLayout: Starting auth check...')
        setAuthError(null)

        // Use the improved auth protection utility
        const authStatus = await getAuthStatus()

        if (!authStatus.isAuthenticated) {
          console.log('AdminLayout: User not authenticated')
          router.push('/auth/login?error=unauthorized')
          return
        }

        if (!authStatus.isAdmin) {
          console.error('AdminLayout: User is not an admin user, role_id:', authStatus.user?.role_id)
          setAuthError(`Access denied: Admin access requires role_id: 1, but user has role_id: ${authStatus.user?.role_id}`)
          router.push('/auth/login?error=insufficient_permissions')
          return
        }

        console.log('AdminLayout: Auth check successful for admin user')
        console.log('AdminLayout: User:', authStatus.user?.email, 'Role:', authStatus.user?.role_id)
        
        // Get the actual Supabase User object for UI purposes
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()
        setUser(supabaseUser)
        setAuthError(null)
        
      } catch (error) {
        console.error('AdminLayout: Auth check failed:', error)
        setAuthError(error instanceof Error ? error.message : 'Authentication failed')
        router.push('/auth/login?error=system_error')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{authError}</div>
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  const navigation = [
    { name: 'All Cards', href: '/admin/cards', icon: CreditCard, current: pathname === '/admin/cards' },
    { name: 'Create Cards', href: '/admin/cards/stamp/new', icon: Building, current: pathname.startsWith('/admin/cards/') && !pathname.endsWith('/admin/cards') },
    { name: 'Business Management', href: '/admin/businesses', icon: Users, current: pathname.startsWith('/admin/businesses') },
    { name: 'System Settings', href: '/admin/settings', icon: Settings, current: pathname.startsWith('/admin/settings') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">RewardJar Admin</h1>
                <p className="text-xs text-gray-500">System Administration</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
} 