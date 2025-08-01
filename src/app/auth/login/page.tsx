'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Simple form validation
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = (email: string, password: string) => {
  const errors: { email?: string; password?: string } = {}
  
  if (!email) {
    errors.email = 'Email is required'
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  if (!password) {
    errors.password = 'Password is required'
  }
  
  return errors
}

// Separate client component for search params logic
function LoginContent() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for messages from URL params
  useEffect(() => {
    const message = searchParams.get('message')
    const errorParam = searchParams.get('error')
    
    if (message) {
      if (message === 'account_created') {
        setSuccessMessage('Account created successfully! Please sign in.')
      } else {
        setSuccessMessage(message)
      }
    }
    if (errorParam) {
      switch (errorParam) {
        case 'unauthorized':
          setError('You need to be logged in to access this page')
          break
        case 'insufficient_permissions':
          setError('You do not have permission to access that page')
          break
        case 'auth_failed':
          setError('Authentication failed. Please try signing in again.')
          break
        case 'profile_not_found':
          setError('User profile not found. Please contact support.')
          break
        case 'system_error':
          setError('A system error occurred. Please try again.')
          break
        default:
          setError('An error occurred. Please try signing in.')
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const errors = validateForm(email, password)
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log('=== LOGIN ATTEMPT START ===')
      console.log('Email:', email)

      // Step 1: Attempt login
      const { data: loginResult, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('Login error:', signInError)
        throw signInError
      }

      if (!loginResult.user) {
        throw new Error('No user returned from login')
      }

      console.log('✅ Login successful for user:', loginResult.user.id)

      // Step 2: Get user role directly (simplified auth check)
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', loginResult.user.id)
        .single()

      const userRole = userData?.role_id || 0
      console.log('👤 User role:', userRole)

      // Show success message
      setSuccessMessage('Login successful! Redirecting...')

      // Check for next URL parameter
      const nextUrl = searchParams.get('next')
      
      if (nextUrl) {
        console.log('🔗 Redirecting to next URL:', nextUrl)
        router.push(decodeURIComponent(nextUrl))
      } else {
        // Redirect based on role
        if (userRole === 1) {
          console.log('🔧 Redirecting to admin dashboard')
          router.push('/admin')
        } else if (userRole === 2) {
          console.log('🏢 Redirecting to business dashboard')
          router.push('/business/dashboard')
        } else if (userRole === 3) {
          console.log('👤 Redirecting to customer dashboard')
          router.push('/customer/dashboard')
        } else {
          console.log('🏠 Redirecting to home (unknown role)')
          router.push('/')
        }
      }

      console.log('=== LOGIN SUCCESSFUL ===')

    } catch (err) {
      console.error('Login error:', err)
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before logging in.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your RewardJar account
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400 text-lg">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sign In</h3>
            <p className="mt-1 text-sm text-gray-600">
              Enter your email and password to access your account
            </p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">📧</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kukrejajaydeep@gmail.com"
                    className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="email-input"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔒</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="password-input"
                  />
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                data-testid="login-button"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign up as Business
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Looking for customer access?{' '}
                <Link href="/auth/customer-signup" className="text-green-600 hover:text-green-500 font-medium">
                  Sign up as Customer
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <span className="mr-2">←</span>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginContent />
}