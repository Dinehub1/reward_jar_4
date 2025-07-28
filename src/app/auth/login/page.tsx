'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthStatus } from '@/lib/auth-protection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginForm = z.infer<typeof loginSchema>

// Separate client component for search params logic
function LoginContent() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
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

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log('=== LOGIN ATTEMPT START ===')
      console.log('Email:', data.email)

      // Step 1: Attempt login
      const { data: loginResult, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError) {
        console.error('Login error:', signInError)
        throw signInError
      }

      if (!loginResult.user) {
        throw new Error('No user returned from login')
      }

      console.log('✅ Login successful for user:', loginResult.user.id)

      // Step 2: Check user role and redirect accordingly
      console.log('🔍 Checking user role...')
      const authStatus = await getAuthStatus()

      if (!authStatus.isAuthenticated) {
        throw new Error('Authentication verification failed after login')
      }

      console.log('👤 User authenticated with role_id:', authStatus.user?.role_id)

      // Show success message
      setSuccessMessage('Login successful! Redirecting...')

      // Check for next URL parameter
      const nextUrl = searchParams.get('next')
      
      if (nextUrl) {
        console.log('🔗 Redirecting to next URL:', nextUrl)
        router.push(decodeURIComponent(nextUrl))
      } else {
        // Redirect based on role
        if (authStatus.isAdmin) {
          console.log('🔧 Redirecting to admin dashboard')
          router.push('/admin')
        } else if (authStatus.isBusiness) {
          console.log('🏢 Redirecting to business dashboard')
          router.push('/business/dashboard')
        } else if (authStatus.isCustomer) {
          console.log('👤 Redirecting to customer dashboard')
          router.push('/customer/dashboard')
        } else {
          throw new Error(`Invalid user role: ${authStatus.user?.role_id}`)
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
        } else if (err.message.includes('Invalid user role')) {
          setError('Your account role is not properly configured. Please contact support.')
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
                <AlertCircle className="h-5 w-5 text-red-400" />
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
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...form.register('password')}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
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
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Loading...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}