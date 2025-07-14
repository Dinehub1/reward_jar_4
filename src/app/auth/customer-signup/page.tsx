'use client'

import { useState } from 'react'
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

export default function CustomerSignupPage() {
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
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create account')
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
          email: data.email
        })

      if (customerError) {
        console.error('Customer creation error:', customerError)
        // Continue if customer already exists
      }

      // Step 4: Auto sign-in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError) {
        throw new Error(`Failed to sign in: ${signInError.message}`)
      }

      // Step 5: Redirect to next URL or customer dashboard
      router.push(nextUrl || '/customer/dashboard')

    } catch (err) {
      console.error('Customer signup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Back Button */}
        <Link 
          href={nextUrl || '/'}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        {/* Main Signup Card */}
        <Card className="w-full shadow-xl border-0">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Join Loyalty Program
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-base">
              Create your account to start collecting stamps and earning rewards
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 h-12 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                    {...form.register('name')}
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-12 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    className="pl-10 h-12 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                    {...form.register('password')}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-base transition-colors"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account & Join'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href={`/auth/login?role=customer${nextUrl ? `&next=${nextUrl}` : ''}`}
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to collect stamps and receive rewards from participating businesses.
          </p>
        </div>
      </div>
    </div>
  )
} 