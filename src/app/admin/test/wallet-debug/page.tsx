'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import WalletPreviewDebug from '../wallet-preview/debug'

export default function WalletDebugPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  // Admin authentication check
  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', user.id)
          .single()

        if (userData?.role_id !== 1) {
          router.push('/')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAdminAuth()
  }, [router])

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <WalletPreviewDebug />
    </AdminLayout>
  )
} 