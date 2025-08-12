'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

function LegacyResetAccountPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {

      // First, sign out any existing session
      await supabase.auth.signOut()

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Try to find and clean up any existing user data
      const { data: { session } } = await supabase.auth.getSession()

      setMessage('Account reset completed. You can now try signing up again with a fresh start.')
      
      // Redirect to signup after a short delay
      setTimeout(() => {
        router.push('/auth/signup')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClearAndRetry = () => {
    // Clear all browser data
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    }
    
    // Hard refresh the page
    window.location.href = '/auth/signup'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Reset Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Clear any corrupted data and start fresh
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Reset</CardTitle>
            <CardDescription>
              If you&apos;re experiencing signup issues, this will clear your session and allow you to start over.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="text-sm text-green-700">{message}</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                />
                <p className="text-sm text-gray-500">
                  Enter the email you&apos;ve been trying to sign up with
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading || !email}
                >
                  {loading ? 'Resetting...' : 'Reset Account Data'}
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleClearAndRetry}
                  className="w-full"
                >
                  Clear All Data & Retry Signup
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Try Login Instead
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link href="/auth/debug" className="text-green-600 hover:text-green-500 font-medium">
                  Debug Authentication
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 
export default function ResetAccountPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the password reset</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyResetAccountPage />
      </div>
    </ComponentErrorBoundary>
  )
}