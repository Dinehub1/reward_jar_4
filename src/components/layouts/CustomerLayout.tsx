'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminAuth } from '@/lib/hooks/use-admin-auth'
import type { User } from '@supabase/supabase-js'
import { User as UserIcon, Home, LogOut } from 'lucide-react'

interface CustomerLayoutProps {
  children: React.ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  
  // ✅ STANDARDIZED: Use consistent auth pattern across all layouts
  const { signOut: adminSignOut } = useAdminAuth(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/auth/login?role=customer')
          return
        }

        // Check if user has customer role
        const { data: userData } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', session.user.id)
          .single()

        if (!userData || userData.role_id !== 3) {
          router.push('/auth/login?error=unauthorized&role=customer')
          return
        }

        // Get customer name
        const { data: customerData } = await supabase
          .from('customers')
          .select('name')
          .eq('user_id', session.user.id)
          .single()

        if (customerData) {
          setCustomerName(customerData.name)
        }

        setUser(session.user)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login?role=customer')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  // ✅ STANDARDIZED: Use consistent sign-out pattern
  const handleSignOut = async () => {
    try {
      await adminSignOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed:', error)
      // Fallback to direct supabase sign out
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navigation Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/customer/dashboard" className="text-xl font-bold text-gray-900">
                RewardJar
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/customer/dashboard" 
                  className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  My Cards
                </Link>
                <Link 
                  href="/customer/profile" 
                  className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {customerName || 'Customer'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 py-3">
            <Link 
              href="/customer/dashboard" 
              className="flex items-center text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              My Cards
            </Link>
            <Link 
              href="/customer/profile" 
              className="flex items-center text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
} 