'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
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
      setSuccessMessage(message)
    }
    if (errorParam === 'unauthorized') {
      setError('You need to be logged in to access this page')
    }
  }, [searchParams])

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const createFallbackProfile = async (user: any, role: 'business' | 'customer' = 'business') => {
    try {
      // Create user record in users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          role_id: role === 'business' ? 2 : 3,
          created_at: new Date().toISOString()
        })

      if (userError) {
        console.error('Error creating user profile:', userError)
        // Continue if user already exists
      }

      // For business users, create a basic business profile
      if (role === 'business') {
        const { error: businessError } = await supabase
          .from('businesses')
          .insert({
            name: `Business for ${user.email}`,
            description: 'Auto-created business profile',
            contact_email: user.email,
            owner_id: user.id,
            status: 'active',
            created_at: new Date().toISOString()
          })

        if (businessError) {
          console.error('Error creating business profile:', businessError)
          // Continue even if business creation fails
        }
      }

      // For customer users, create a basic customer profile
      if (role === 'customer') {
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: user.email.split('@')[0], // Use email prefix as name
            email: user.email,
            created_at: new Date().toISOString()
          })

        if (customerError) {
          console.error('Error creating customer profile:', customerError)
          // Continue even if customer creation fails
        }
      }

      return { role_id: role === 'business' ? 2 : 3 }
    } catch (error) {
      console.error('Error in fallback profile creation:', error)
      return { role_id: 2 } // Default to business role
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError) {
        throw signInError
      }

      // Check user role after successful login
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No user found after login')
      }

      // Get user profile to determine role - using correct users table
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', user.id)
        .single()

      // If profile doesn't exist, create a fallback profile
      if (profileError || !profile) {
        console.log('User profile not found, creating fallback profile...')
        
        // Try to determine role from search params or default to business
        const roleParam = searchParams.get('role')
        const defaultRole = roleParam === 'customer' ? 'customer' : 'business'
        
        profile = await createFallbackProfile(user, defaultRole)
        
        if (!profile) {
          throw new Error('Failed to create user profile')
        }
      }

      // Show success message
      setSuccessMessage('Login successful! Redirecting...')

      // Redirect based on role
      if (profile.role_id === 2) { // Business role
        router.push('/business/dashboard')
      } else if (profile.role_id === 3) { // Customer role
        router.push('/customer/dashboard')
      } else {
        throw new Error('Invalid user role')
      }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your RewardJar account</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-600 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...form.register('password')}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-600 text-sm">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Sign Up Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?
              </p>
              <div className="flex flex-col space-y-2">
                <Link
                  href="/auth/signup"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Sign up as Business
                </Link>
                <Link
                  href="/auth/customer-signup"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Sign up as Customer
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}