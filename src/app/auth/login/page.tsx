'use client'

import { useState, useEffect } from 'react'
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

export default function LoginPage() {
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
      setError('Unauthorized access. Please sign in with a business account.')
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
      // Get the next parameter and role parameter from URL
      const nextUrl = searchParams.get('next')
      const roleParam = searchParams.get('role')
      
      console.log('🔐 Login attempt:', { email: data.email, nextUrl, roleParam })
      
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      console.log('🔐 Auth result:', { authData: authData ? 'success' : 'null', authError })

      if (authError) {
        console.error('🔐 Auth error:', authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Login failed. Please try again.')
      }

      // Step 2: Check user role from users table
      console.log('🔐 Fetching user role for:', authData.user.id)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', authData.user.id)
        .single()

      console.log('🔐 User role query result:', { userData, userError })

      if (userError) {
        console.error('Error fetching user role:', userError)
        
        // If user doesn't exist in users table, create it based on context
        const defaultRole = roleParam === 'customer' ? 3 : 2 // Customer or Business
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            role_id: defaultRole
          })
        
        if (insertError) {
          console.error('Error creating user record:', insertError)
        }
        
        // Redirect based on role and next parameter
        if (defaultRole === 3 && nextUrl) {
          router.push(nextUrl)
        } else if (defaultRole === 3) {
          router.push('/customer/dashboard')
        } else {
          router.push('/business/dashboard')
        }
        return
      }

      // Step 3: Redirect based on role and context
      if (userData.role_id === 2) {
        // Business user
        if (roleParam === 'customer') {
          await supabase.auth.signOut()
          throw new Error('Please use a customer account to join loyalty programs.')
        }
        router.push('/business/dashboard')
      } else if (userData.role_id === 3) {
        // Customer user
        if (roleParam === 'business') {
          await supabase.auth.signOut()
          throw new Error('Please use a business account to access the business dashboard.')
        }
        // Redirect to next URL or customer dashboard
        router.push(nextUrl || '/customer/dashboard')
      } else {
        // Unsupported role
        await supabase.auth.signOut()
        throw new Error('Account type not supported.')
      }

    } catch (err) {
      console.error('🔐 Complete login error:', err)
      console.error('🔐 Error type:', typeof err)
      console.error('🔐 Error structure:', JSON.stringify(err, null, 2))
      
      let errorMessage = 'Login failed. Please try again.'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">
              Sign in to your RewardJar business account
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg font-semibold">Business Login</CardTitle>
            <CardDescription className="text-center text-sm">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@business.com"
                  autoComplete="email"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium mt-6"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Forgot Password */}
            <div className="mt-4 text-center">
              <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot your password?
              </Link>
            </div>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Account Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This portal is for business accounts only. Customers join through QR codes.
          </p>
        </div>
      </div>
    </div>
  )
} 