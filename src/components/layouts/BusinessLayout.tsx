'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getAuthStatus, signOut } from '@/lib/auth-protection'
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

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
          setAuthError('Access denied: Business account required')
          setTimeout(() => router.push('/'), 2000)
          return
        }

        console.log('BusinessLayout: Auth successful, setting user')
        setUser(authStatus.user)
      } catch (error) {
        console.error('BusinessLayout: Auth check failed:', error)
        setAuthError('Authentication failed')
        setTimeout(() => router.push('/auth/login'), 2000)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/business/dashboard',
      icon: '📊',
      current: pathname === '/business/dashboard'
    },
    {
      name: 'Stamp Cards',
      href: '/business/stamp-cards',
      icon: '🎯',
      current: pathname.startsWith('/business/stamp-cards')
    },
    {
      name: 'Memberships',
      href: '/business/memberships',
      icon: '💳',
      current: pathname.startsWith('/business/memberships')
    },
    {
      name: 'Analytics',
      href: '/business/analytics',
      icon: '📈',
      current: pathname === '/business/analytics'
    },
    {
      name: 'Profile',
      href: '/business/profile',
      icon: '⚙️',
      current: pathname === '/business/profile'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-4">{authError}</div>
          <div className="text-muted-foreground">Redirecting...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Authenticating...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">R</span>
              </div>
              <div>
                <div className="font-semibold text-foreground">RewardJar</div>
                <div className="text-xs text-muted-foreground">Business Portal</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${item.current 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </div>
                <div className="text-xs text-muted-foreground">Business Account</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            
            <div className="text-lg font-semibold text-foreground lg:hidden">
              RewardJar Business
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-muted-foreground">System Operational</span>
            </div>
            <div className="text-sm text-muted-foreground hidden md:block">
              {new Date().toLocaleDateString()}
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 