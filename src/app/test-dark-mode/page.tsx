'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestDarkModeRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new admin-protected location
    router.replace('/admin/test/dark-mode')
  }, [router])

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirecting to admin test area...</p>
      </div>
    </div>
  )
} 