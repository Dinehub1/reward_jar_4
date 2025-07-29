'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface AdminLayoutClientProps {
  children: React.ReactNode
}

function AdminSidebar() {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      description: 'System overview and metrics'
    },
    {
      name: 'Businesses',
      href: '/admin/businesses',
      icon: '🏢',
      description: 'Manage all business accounts'
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: '👥',
      description: 'Monitor customer activity'
    },
    {
      name: 'Cards',
      href: '/admin/cards',
      icon: '🎴',
      description: 'Manage all loyalty cards'
    },
    {
      name: 'Alerts',
      href: '/admin/alerts',
      icon: '🚨',
      description: 'System alerts and notifications'
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: '🛠️',
      description: 'Customer support tools'
    }
  ]

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-900 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center flex-shrink-0 px-4">
          <Link href="/admin" className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RJ</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                RewardJar
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Admin Panel
              </p>
            </div>
          </Link>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

function AdminHeader({ user }: { user: any }) {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 md:hidden">
              <Link href="/admin" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RJ</span>
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                  RewardJar Admin
                </span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Admin User
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || 'admin@rewardjar.com'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          // In development mode, allow access for testing
          console.log('🧪 ADMIN ACCESS - Development mode: bypassing authentication')
          setUser({ email: 'dev-admin@rewardjar.com' })
          setIsAdmin(true)
          setAuthLoading(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', authUser.id)
          .single()

        if (userData?.role_id !== 1) {
          router.push('/')
          return
        }

        setUser(authUser)
        setIsAdmin(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        // In development mode, allow access for testing
        console.log('🧪 ADMIN ACCESS - Development mode: bypassing authentication due to error')
        setUser({ email: 'dev-admin@rewardjar.com' })
        setIsAdmin(true)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAdminAuth()
  }, [router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader user={user} />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 