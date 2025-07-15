'use client'

import { useState, Suspense } from 'react'
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
import { ArrowLeft, Mail, Lock, User } from 'lucide-react'

// Form validation schema for CUSTOMER-ONLY signup
const customerSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
})

type CustomerSignupForm = z.infer<typeof customerSignupSchema>

// Separate client component for search params logic
function CustomerSignupContent() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const nextUrl = searchParams.get('next')

  const form = useForm<CustomerSignupForm>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: CustomerSignupForm) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'customer'
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // Step 2: Create user profile with CUSTOMER role (role_id: 3)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          role_id: 3 // CUSTOMER role only
        })

      if (userError) {
        console.error('User creation error:', userError)
        // Continue if user already exists in users table
      }

      // Step 3: Create customer profile
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: authData.user.id,
          name: data.name,
          email: data.email,
          created_at: new Date().toISOString()
        })

      if (customerError) {
        console.error('Customer profile creation error:', customerError)
        // Don't throw here - continue with signup process
      }

      // Step 4: Check if user is already confirmed or needs confirmation
      if (authData.user && authData.session) {
        // User is already logged in (no confirmation needed)
        if (nextUrl) {
          router.push(decodeURIComponent(nextUrl))
        } else {
          router.push('/customer/dashboard')
        }
      } else {
        // User needs email confirmation
        if (nextUrl) {
          router.push(`/auth/login?message=Please check your email to confirm your account&next=${encodeURIComponent(nextUrl)}`)
        } else {
          router.push('/auth/login?message=Please check your email to confirm your account')
        }
      }

    } catch (err) {
      console.error('Signup error:', err)
      if (err instanceof Error) {
        if (err.message.includes('User already registered')) {
          // Redirect to login with the same next URL
          if (nextUrl) {
            router.push(`/auth/login?message=Account already exists. Please sign in.&next=${encodeURIComponent(nextUrl)}`)
          } else {
            router.push('/auth/login?message=Account already exists. Please sign in.')
          }
          return
        } else if (err.message.includes('Password should be at least 6 characters')) {
          setError('Password must be at least 6 characters long.')
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Join as Customer</h1>
          <p className="text-gray-600">Create your RewardJar customer account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
            </div>
        )}

        {/* Signup Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>
              Enter your details to create a customer account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    {...form.register('name')}
                  className={form.formState.errors.name ? 'border-red-500' : ''}
                  />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...form.register('email')}
                  className={form.formState.errors.email ? 'border-red-500' : ''}
                  />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                  <Input
                    id="password"
                    type="password"
                  placeholder="Create a password"
                    {...form.register('password')}
                  className={form.formState.errors.password ? 'border-red-500' : ''}
                  />
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3">
              <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                  <Link href="/auth/login" className="text-green-600 hover:text-green-500 font-medium">
                  Sign in
                </Link>
              </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Are you a business?{' '}
                  <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                    Business Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function CustomerSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CustomerSignupContent />
    </Suspense>
  )
} 