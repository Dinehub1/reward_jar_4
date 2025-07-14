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
import { ArrowLeft, Building, Mail, Lock, User } from 'lucide-react'

// Form validation schema for BUSINESS-ONLY signup
const businessSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be under 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be under 100 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must be under 100 characters'),
  businessDescription: z.string().max(500, 'Description must be under 500 characters').optional().or(z.literal(''))
})

type BusinessSignupForm = z.infer<typeof businessSignupSchema>

export default function BusinessSignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<BusinessSignupForm>({
    resolver: zodResolver(businessSignupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      businessName: '',
      businessDescription: ''
    }
  })

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
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          role_id: 2 // BUSINESS role only
        })

      if (userError) {
        console.error('User creation error:', userError)
        // Continue if user already exists in users table
      }

      // Step 3: Create business profile
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: data.businessName,
          description: data.businessDescription || null,
          contact_email: data.email,
          owner_id: authData.user.id,
          status: 'active'
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

      // Success! Redirect to business dashboard
      router.push('/business/dashboard?welcome=true')

    } catch (err) {
      console.error('Business signup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create business account. Please try again.')
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Business Journey</h1>
            <p className="text-gray-600">
              Create your business account and build customer loyalty with digital stamp cards
            </p>
          </div>
        </div>

        {/* Business Signup Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold">Business Registration</CardTitle>
            <CardDescription className="text-sm">
              Join thousands of businesses building customer loyalty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center text-sm font-medium">
                  <User className="w-4 h-4 mr-2" />
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  className="h-11"
                  {...form.register('fullName')}
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-sm font-medium">
                  <Mail className="w-4 h-4 mr-2" />
                  Business Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@yourbusiness.com"
                  className="h-11"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center text-sm font-medium">
                  <Lock className="w-4 h-4 mr-2" />
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="h-11"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center text-sm font-medium">
                  <Building className="w-4 h-4 mr-2" />
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  className="h-11"
                  {...form.register('businessName')}
                />
                {form.formState.errors.businessName && (
                  <p className="text-sm text-red-600">{form.formState.errors.businessName.message}</p>
                )}
              </div>

              {/* Business Description */}
              <div className="space-y-2">
                <Label htmlFor="businessDescription" className="text-sm font-medium">
                  Business Description (Optional)
                </Label>
                <textarea
                  id="businessDescription"
                  rows={3}
                  placeholder="Tell us about your business, products, or services..."
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                  {...form.register('businessDescription')}
                />
                {form.formState.errors.businessDescription && (
                  <p className="text-sm text-red-600">{form.formState.errors.businessDescription.message}</p>
                )}
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
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium mt-6"
              >
                {isSubmitting ? 'Creating Your Business Account...' : 'Create Business Account'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have a business account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Only Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This registration is for business owners only.<br />
            Customers join loyalty programs by scanning QR codes.
          </p>
        </div>
      </div>
    </div>
  )
} 