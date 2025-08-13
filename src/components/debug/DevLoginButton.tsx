'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DevLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDevLogin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'kukrejajaydeep@gmail.com',
          password: 'test123'
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Force reload to let auth state sync
        window.location.href = '/admin'
      } else {
        alert('Dev login failed: ' + result.error)
      }
    } catch (error) {
      console.error('Dev login error:', error)
      alert('Dev login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleDevLogin}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
      >
        {isLoading ? 'Logging in...' : 'Quick Admin Access'}
      </button>
    </div>
  )
}