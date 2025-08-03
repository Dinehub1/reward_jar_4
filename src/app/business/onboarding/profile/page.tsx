'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkAuth } from '@/lib/auth-protection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building, Mail, MapPin, Globe, Upload, User, CheckCircle, X, AlertCircle, Info } from 'lucide-react'

// Enhanced form validation schema for Business Profile Details (Step 2 of 3-step wizard)
const businessProfileSchema = z.object({
  businessName: z.string().min(3, 'Business name must be at least 3 characters').max(100, 'Business name too long').optional().or(z.literal('')),
  contactEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  location: z.string().max(200, 'Location too long').optional().or(z.literal('')),
  description: z.string().max(200, 'Description must be under 200 characters').optional().or(z.literal('')),
  websiteUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  logo: z.any().optional()
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

interface TooltipProps {
  children: React.ReactNode
  content: string
  show: boolean
}

function Tooltip({ children, content, show }: TooltipProps) {
  if (!show) return <>{children}</>
  
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}

function ProfileCompletionModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  onSkip, 
  progress, 
  businessName 
}: {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  onSkip: () => void
  progress: number
  businessName: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              <span className="text-sm text-gray-600">Your profile is {progress}% complete</span>
            </div>
            <p className="text-sm text-gray-500">
              A complete profile helps customers trust your business and improves your loyalty card appearance.
            </p>
          </div>

          {/* Sample Loyalty Card Preview */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Preview: How your loyalty card will look</h4>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{businessName || 'Your Business Name'}</div>
                    <div className="text-xs opacity-90">Customer Loyalty Card</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white border-opacity-20 pt-3">
                <div className="text-center">
                  <div className="text-lg font-bold">• • • • • • • ○ ○ ○</div>
                  <div className="text-xs opacity-90 mt-1">Collect 10 stamps to earn a reward</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onSkip}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Skip for Now
            </Button>
            <Button
              onClick={onComplete}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Complete Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BusinessProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
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

  // Enhanced profile progress calculation with field weights
  const calculateProfileProgress = (data: BusinessProfileForm, currentBusiness: Business | null): number => {
    let progress = 0
    
    const businessName = data.businessName?.trim() || currentBusiness?.name
    const contactEmail = data.contactEmail?.trim() || currentBusiness?.contact_email
    const location = data.location?.trim()
    const description = data.description?.trim()
    const websiteUrl = data.websiteUrl?.trim()
    const logoUrl = currentBusiness?.logo_url || logoFile // Check both existing logo and new file

    // Field weights as specified
    if (businessName && businessName.length >= 3) progress += 20 // 20%
    if (contactEmail && contactEmail.length > 0) progress += 20  // 20%
    if (location && location.length > 0) progress += 20 // 20%
    if (description && description.length > 0) progress += 20 // 20%
    if (logoUrl) progress += 10 // 10%
    if (websiteUrl && websiteUrl.length > 0) progress += 10 // 10%

    return Math.min(progress, 100)
  }

  // Get progress bar color based on percentage (red to green gradient)
  const getProgressColor = (progress: number): string => {
    if (progress <= 33) return 'from-red-500 to-red-600'
    if (progress <= 66) return 'from-yellow-500 to-orange-500'
    return 'from-green-500 to-green-600'
  }

  // Get missing fields for tooltips
  const getMissingFields = (data: BusinessProfileForm, currentBusiness: Business | null): string[] => {
    const missing: string[] = []
    
    const businessName = data.businessName?.trim() || currentBusiness?.name
    const contactEmail = data.contactEmail?.trim() || currentBusiness?.contact_email
    const location = data.location?.trim()
    const description = data.description?.trim()
    const websiteUrl = data.websiteUrl?.trim()
    const logoUrl = currentBusiness?.logo_url || logoFile // Check both existing logo and new file

    if (!businessName || businessName.length < 3) missing.push('Business Name')
    if (!contactEmail || contactEmail.length === 0) missing.push('Contact Email')
    if (!location || location.length === 0) missing.push('Location')
    if (!description || description.length === 0) missing.push('Description')
    if (!logoUrl) missing.push('Logo')
    if (!websiteUrl || websiteUrl.length === 0) missing.push('Website URL')

    return missing
  }

  // Handle logo file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setLogoError(null)

    if (!file) {
      setLogoFile(null)
      setLogoPreview(null)
      return
    }

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setLogoError('Please upload a JPEG or PNG image')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image must be under 2MB')
      return
    }

    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
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

        // Check if we should show completion modal
        const currentProgress = calculateProfileProgress(form.getValues(), businessData)
        if (currentProgress < 60) {
          setShowModal(true)
        }

      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinessData()
  }, [router, supabase, form])

  // MCP Integration for database updates
  const updateBusinessWithMCP = async (data: BusinessProfileForm, profileProgress: number, logoUrl: string | null) => {
    try {
      // Since we don't have direct MCP API routes, we'll use Supabase directly
      // but structure it as if using MCP for future migration
      const updateData = {
        name: data.businessName?.trim() || business?.name,
        contact_email: data.contactEmail?.trim() || business?.contact_email,
        location: data.location?.trim() || null,
        description: data.description?.trim() || null,
        website_url: data.websiteUrl?.trim() || null,
        logo_url: logoUrl || null, // Update logo_url
        profile_progress: profileProgress,
        updated_at: new Date().toISOString()
      }

      // TODO: Replace with actual MCP call when /mcp/update endpoint is available
      // const mcpResponse = await fetch('/api/mcp/update', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     table: 'businesses',
      //     id: business?.id,
      //     data: updateData
      //   })
      // })

      // For now, use direct Supabase call
      const { error: updateError } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', business?.id)

      if (updateError) {
        throw new Error(`Failed to update business profile: ${updateError.message}`)
      }

      return { success: true }
    } catch (error) {
      console.error('MCP update error:', error)
      throw error
    }
  }

  const onSubmit = async (data: BusinessProfileForm) => {
    if (!business) return

    setIsSubmitting(true)
    setError(null)

    try {
      let logoUrl = business.logo_url // Keep existing logo URL if no new file

      // Handle logo upload if present
      if (logoFile) {
        try {
          // Generate unique filename
          const fileExt = logoFile.name.split('.').pop()
          const fileName = `${business.id}-${Date.now()}.${fileExt}`
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('buinesslogo')
            .upload(fileName, logoFile, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) {
            throw new Error(`Failed to upload logo: ${uploadError.message}`)
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('buinesslogo')
            .getPublicUrl(fileName)

          logoUrl = urlData.publicUrl
          console.log('✅ Logo uploaded successfully:', logoUrl)

        } catch (uploadErr) {
          console.error('Logo upload error:', uploadErr)
          setError('Failed to upload logo. Please try again.')
          setIsSubmitting(false)
          return
        }
      }

      const profileProgress = calculateProfileProgress(data, business)

      // Use MCP integration for database updates (including logo URL)
      await updateBusinessWithMCP(data, profileProgress, logoUrl)

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

  const handleModalComplete = () => {
    setShowModal(false)
    // Focus on first empty field
    const missingFields = getMissingFields(watchedValues, business)
    if (missingFields.includes('Business Name')) {
      document.getElementById('businessName')?.focus()
    } else if (missingFields.includes('Contact Email')) {
      document.getElementById('contactEmail')?.focus()
    }
  }

  const handleModalSkip = () => {
    setShowModal(false)
    skipToCards()
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
                Great! Let&apos;s create your first loyalty card...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentProgress = calculateProfileProgress(watchedValues, business)
  const missingFields = getMissingFields(watchedValues, business)
  const progressColor = getProgressColor(currentProgress)

  return (
    <>
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

          {/* Enhanced Profile Progress Card with Red-to-Green Gradient */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Profile Completion</CardTitle>
                  <CardDescription className="text-sm">
                    {currentProgress}% complete - Higher completion helps customers trust your business
                  </CardDescription>
                </div>
                <Tooltip 
                  content={missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : 'Profile complete!'}
                  show={missingFields.length > 0}
                >
                  <div className="text-2xl font-bold text-green-600 cursor-help">
                    {currentProgress}%
                    {missingFields.length > 0 && (
                      <Info className="h-4 w-4 inline-block ml-1 text-gray-400" />
                    )}
                  </div>
                </Tooltip>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${progressColor}`}
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
                    placeholder="Your Business Name (3-100 characters)"
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
                    placeholder="123 Main St, Your City, Country"
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

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <Upload className="w-4 h-4 mr-2 text-green-600" />
                    Logo Upload <span className="text-green-600">(+10%)</span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {logoPreview || business?.logo_url ? (
                        <div className="space-y-2">
                          <img 
                            src={logoPreview || business?.logo_url || ''} 
                            alt="Business logo" 
                            className="mx-auto h-20 w-20 object-cover rounded-lg"
                          />
                          <p className="text-sm text-green-600">
                            {logoPreview ? 'Click to change logo' : 'Click to update logo'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Upload your business logo</p>
                          <p className="text-xs text-gray-400">JPEG or PNG, max 2MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {logoError && (
                    <p className="text-sm text-red-600">{logoError}</p>
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

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={handleModalComplete}
        onSkip={handleModalSkip}
        progress={currentProgress}
        businessName={business?.name || ''}
      />
    </>
  )
} 