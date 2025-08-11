'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignupData {
  email: string
  password: string
  businessName?: string
  contactNumber?: string
  storeNumbers?: string
}

export default function SignupPage() {
  const [data, setData] = useState<SignupData>({
    email: '',
    password: '',
    businessName: '',
    contactNumber: '',
    storeNumbers: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  
  const router = useRouter()
  const supabase = createClient()

  const calculateProfileProgress = (formData: SignupData) => {
    let progressValue = 0
    if (formData.email.trim()) progressValue += 20
    if (formData.businessName?.trim()) progressValue += 20
    if (formData.contactNumber?.trim()) progressValue += 20
    if (formData.storeNumbers?.trim()) progressValue += 20
    // Additional fields would add more progress
    return Math.min(progressValue, 80) // Max 80% from signup form
  }

  const handleInputChange = (field: keyof SignupData, value: string) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    setProgress(calculateProfileProgress(newData))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        throw new Error(`Failed to create account: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('Account creation failed - no user returned')
      }


      // Step 2: Create user profile and business via API route (bypasses RLS)
      
      const profileData = {
        userId: authData.user.id,
        email: data.email,
        businessName: data.businessName?.trim() || data.email.split('@')[0],
        contactNumber: data.contactNumber?.trim() || null,
        storeNumbers: data.storeNumbers?.trim() || null
      }

      const response = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete signup')
      }


      // Step 3: Auto sign-in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError) {
        // Don't throw error - user can sign in manually
        router.push('/auth/login?message=account_created')
        return
      }


      // Redirect to business dashboard
      router.push('/business/dashboard?welcome=true')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Business Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join RewardJar and start building customer loyalty
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Set up your business account to manage loyalty programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">{error}</div>
                  <div className="mt-2 text-xs text-gray-600">
                    If you continue to have issues, try the{' '}
                    <Link href="/auth/reset" className="text-blue-600 hover:text-blue-500 underline">
                      account reset page
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="business@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={data.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name (Optional)</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={data.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="e.g., cheess shop"
                />
                <p className="text-sm text-gray-500">
                  You can complete this later in your profile
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={data.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="+91623266XXXX"
                />
                <p className="text-sm text-gray-500">
                  This will be used for communication with your customers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeNumbers">Store Numbers (Optional)</Label>
                <Input
                  id="storeNumbers"
                  type="text"
                  value={data.storeNumbers}
                  onChange={(e) => handleInputChange('storeNumbers', e.target.value)}
                  placeholder="6362656463"
                />
                <p className="text-sm text-gray-500">
                  This will be used for tracking inventory across multiple stores
                </p>
              </div>

              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profile completion:</span>
                    <span className="font-medium text-green-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Business Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have a business account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign in here
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
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>

        <div className="text-center text-xs text-gray-500">
          Next: Complete your business profile and create your first loyalty card
        </div>
      </div>
    </div>
  )
} 