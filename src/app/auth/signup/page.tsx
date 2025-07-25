'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building, Mail, Lock, CheckCircle } from 'lucide-react'

// Form validation schema for Business Account Creation (Step 1 of 3-step wizard)
const businessSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be under 100 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must be under 100 characters').optional().or(z.literal(''))
})

type BusinessSignupForm = z.infer<typeof businessSignupSchema>

export default function BusinessSignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<BusinessSignupForm>({
    resolver: zodResolver(businessSignupSchema),
    defaultValues: {
      email: '',
      password: '',
      businessName: ''
    }
  })

  const watchedValues = form.watch()

  // Calculate profile progress based on provided fields
  const calculateProfileProgress = (data: BusinessSignupForm): number => {
    let progress = 20 // Base progress for email
    if (data.businessName && data.businessName.trim().length > 0) {
      progress = 40 // Business name provided
    }
    return progress
  }

  const onSubmit = async (data: BusinessSignupForm) => {
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
        throw new Error('Failed to create user account')
      }

      // Step 2: Create user profile with BUSINESS role (role_id: 2)
      const profileProgress = calculateProfileProgress(data)
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          role_id: 2 // BUSINESS role
        })

      if (userError) {
        console.error('User creation error:', userError)
        // Continue even if user already exists
      }

      // Step 3: Create business profile with calculated progress
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: data.businessName?.trim() || data.email, // Default to email if no business name
          contact_email: data.email,
          owner_id: authData.user.id,
          status: 'active',
          profile_progress: profileProgress
        })

      if (businessError) {
        throw new Error(`Failed to create business profile: ${businessError.message}`)
      }

      // Step 4: Auto sign-in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError) {
        // User was created but auto sign-in failed, redirect to login
        router.push('/auth/login?message=Account created successfully. Please sign in.')
        return
      }

      // Success! Show confirmation and redirect to onboarding step 2
      setSuccess(true)
      setTimeout(() => {
        router.push('/business/onboarding/profile')
      }, 2000)

    } catch (err) {
      console.error('Business signup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create business account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          <Card className="shadow-xl border-0 text-center">
            <CardContent className="pt-8 pb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
              <p className="text-gray-600 mb-4">
                Welcome to RewardJar 4.0! Redirecting you to complete your profile...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-700 mb-6 text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Business Account</h1>
            <p className="text-gray-600">
              Step 1 of 3 - Start building customer loyalty today
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-green-500 h-2 rounded-full w-1/3"></div>
        </div>

        {/* Business Signup Form */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-center">Business Registration</CardTitle>
            <CardDescription className="text-sm text-center">
              Create your account to start your loyalty program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-sm font-medium">
                  <Mail className="w-4 h-4 mr-2 text-green-600" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@yourbusiness.com"
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center text-sm font-medium">
                  <Lock className="w-4 h-4 mr-2 text-green-600" />
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Business Name (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center text-sm font-medium">
                  <Building className="w-4 h-4 mr-2 text-green-600" />
                  Business Name <span className="text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  {...form.register('businessName')}
                />
                {form.formState.errors.businessName && (
                  <p className="text-sm text-red-600">{form.formState.errors.businessName.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  You can complete this later in your profile
                </p>
              </div>

              {/* Profile Progress Preview */}
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Profile completion:</span>
                  <span className="font-medium text-green-600">
                    {calculateProfileProgress(watchedValues)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${calculateProfileProgress(watchedValues)}%` }}
                  ></div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-medium mt-6"
              >
                {isSubmitting ? 'Creating Your Account...' : 'Create Business Account'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have a business account?{' '}
                <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Preview */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Next: Complete your business profile and create your first loyalty card
          </p>
        </div>
      </div>
    </div>
  )
} 