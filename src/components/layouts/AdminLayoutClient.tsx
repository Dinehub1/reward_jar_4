'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      description: 'System alerts and monitoring'
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: '🛠️',
      description: 'Manual override tools'
    },
    {
      name: 'Sandbox',
      href: '/admin/sandbox',
      icon: '🧪',
      description: 'Testing and preview mode'
    }
  ]

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center space-x-2">
          <span className="text-2xl">🎯</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">RewardJar</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-gray-500 group-hover:text-gray-700">
                {item.description}
              </div>
            </div>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Admin Mode
          </div>
          <Link
            href="/auth/logout"
            className="text-sm text-red-600 hover:text-red-700"
          >
            Logout
          </Link>
        </div>
      </div>
    </div>
  )
}

function AdminHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            RewardJar 4.0 Admin Panel
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-gray-600">System Operational</span>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </header>
  )
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user has admin role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', user.id)
          .single()

        if (userError || !userData || userData.role_id !== 1) {
          router.push('/') // Redirect non-admin users
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Admin access check failed:', error)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl">🎯</div>
          <div className="mt-2 text-gray-600">Loading admin panel...</div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <AdminHeader />
        
        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 