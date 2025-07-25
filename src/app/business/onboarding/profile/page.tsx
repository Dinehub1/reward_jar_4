'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { checkAuth } from '@/lib/auth-protection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building, Mail, MapPin, Globe, Upload, User, CheckCircle } from 'lucide-react'

// Form validation schema for Business Profile Details (Step 2 of 3-step wizard)
const businessProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name too long').optional().or(z.literal('')),
  contactEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  location: z.string().max(200, 'Location too long').optional().or(z.literal('')),
  description: z.string().max(200, 'Description must be under 200 characters').optional().or(z.literal('')),
  websiteUrl: z.string().url('Please enter a valid URL').optional().or(z.literal(''))
})

type BusinessProfileForm = z.infer<typeof businessProfileSchema>

interface Business {
  id: string
  name: string
  contact_email: string | null
  location: string | null
  description: string | null
  website_url: string | null
  logo_url: string | null
  profile_progress: number
}

export default function BusinessProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<BusinessProfileForm>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: '',
      contactEmail: '',
      location: '',
      description: '',
      websiteUrl: ''
    }
  })

  const watchedValues = form.watch()

  // Calculate profile progress based on completed fields
  const calculateProfileProgress = (data: BusinessProfileForm, currentBusiness: Business | null): number => {
    let progress = 20 // Base progress for email (from Step 1)
    
    const businessName = data.businessName?.trim() || currentBusiness?.name
    const contactEmail = data.contactEmail?.trim() || currentBusiness?.contact_email
    const location = data.location?.trim()
    const description = data.description?.trim()
    const websiteUrl = data.websiteUrl?.trim()
    const logoUrl = currentBusiness?.logo_url

    if (businessName && businessName.length > 0) progress += 20
    if (contactEmail && contactEmail.length > 0) progress += 20  
    if (location && location.length > 0) progress += 20
    if (description && description.length > 0) progress += 20
    if (logoUrl) progress += 10
    if (websiteUrl && websiteUrl.length > 0) progress += 10

    return Math.min(progress, 100)
  }

  // Load existing business data
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const authResult = await checkAuth()
        if (!authResult.isAuthenticated || !authResult.isBusiness) {
          router.push('/auth/login')
          return
        }

        const { data: businessData, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', authResult.user!.id)
          .single()

        if (error) {
          console.error('Error loading business:', error)
          setError('Failed to load business profile')
          return
        }

        setBusiness(businessData)
        
        // Pre-fill form with existing data
        form.setValue('businessName', businessData.name || '')
        form.setValue('contactEmail', businessData.contact_email || '')
        form.setValue('location', businessData.location || '')
        form.setValue('description', businessData.description || '')
        form.setValue('websiteUrl', businessData.website_url || '')

      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinessData()
  }, [router, supabase, form])

  const onSubmit = async (data: BusinessProfileForm) => {
    if (!business) return

    setIsSubmitting(true)
    setError(null)

    try {
      const profileProgress = calculateProfileProgress(data, business)

      // Update business profile
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          name: data.businessName?.trim() || business.name,
          contact_email: data.contactEmail?.trim() || business.contact_email,
          location: data.location?.trim() || null,
          description: data.description?.trim() || null,
          website_url: data.websiteUrl?.trim() || null,
          profile_progress: profileProgress
        })
        .eq('id', business.id)

      if (updateError) {
        throw new Error(`Failed to update business profile: ${updateError.message}`)
      }

      // Success! Show confirmation and redirect to step 3
      setSuccess(true)
      setTimeout(() => {
        router.push('/business/onboarding/cards')
      }, 2000)

    } catch (err) {
      console.error('Profile update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipToCards = () => {
    router.push('/business/onboarding/cards')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your business profile...</p>
        </div>
      </div>
    )
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Updated!</h2>
              <p className="text-gray-600 mb-4">
                Great! Let's create your first loyalty card...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentProgress = calculateProfileProgress(watchedValues, business)

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Business Profile</h1>
            <p className="text-gray-600">
              Step 2 of 3 - All fields are optional, but help customers find you
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-green-500 h-2 rounded-full w-2/3"></div>
        </div>

        {/* Profile Progress Card */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Profile Completion</CardTitle>
                <CardDescription className="text-sm">
                  {currentProgress}% complete - Higher completion helps customers trust your business
                </CardDescription>
              </div>
              <div className="text-2xl font-bold text-green-600">{currentProgress}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
          </CardHeader>
        </Card>

        {/* Business Profile Form */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-center">Business Details</CardTitle>
            <CardDescription className="text-sm text-center">
              Customize your business profile for customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center text-sm font-medium">
                  <Building className="w-4 h-4 mr-2 text-green-600" />
                  Business Name <span className="text-green-600">(+20%)</span>
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
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="flex items-center text-sm font-medium">
                  <Mail className="w-4 h-4 mr-2 text-green-600" />
                  Contact Email <span className="text-green-600">(+20%)</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  {...form.register('contactEmail')}
                />
                {form.formState.errors.contactEmail && (
                  <p className="text-sm text-red-600">{form.formState.errors.contactEmail.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center text-sm font-medium">
                  <MapPin className="w-4 h-4 mr-2 text-green-600" />
                  Business Location <span className="text-green-600">(+20%)</span>
                </Label>
                <Input
                  id="location"
                  placeholder="123 Main St, Seoul, South Korea"
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  {...form.register('location')}
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-red-600">{form.formState.errors.location.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center text-sm font-medium">
                  <User className="w-4 h-4 mr-2 text-green-600" />
                  Short Description <span className="text-green-600">(+20%)</span>
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Tell customers about your business, products, or services... (200 chars max)"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
                  {...form.register('description')}
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>This appears on your loyalty cards</span>
                  <span>{(watchedValues.description || '').length}/200</span>
                </div>
                {form.formState.errors.description && (
                  <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="flex items-center text-sm font-medium">
                  <Globe className="w-4 h-4 mr-2 text-green-600" />
                  Website URL <span className="text-green-600">(+10%)</span>
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://yourbusiness.com"
                  className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  {...form.register('websiteUrl')}
                />
                {form.formState.errors.websiteUrl && (
                  <p className="text-sm text-red-600">{form.formState.errors.websiteUrl.message}</p>
                )}
              </div>

              {/* Logo Upload Placeholder */}
              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium">
                  <Upload className="w-4 h-4 mr-2 text-green-600" />
                  Logo Upload <span className="text-green-600">(+10%)</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Logo upload coming soon!</p>
                  <p className="text-xs text-gray-400">Your logo will appear on all loyalty cards</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={skipToCards}
                  className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-11 font-medium"
                >
                  {isSubmitting ? 'Saving Profile...' : 'Save & Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Next Steps Preview */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Next: Learn about loyalty cards and create your first one
          </p>
        </div>
      </div>
    </div>
  )
} 