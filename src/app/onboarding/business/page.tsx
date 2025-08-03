'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface BusinessFormData {
  ownerName: string
  phone: string
  email: string
  businessName: string
  location: string
  description: string
  logoFile: File | null
  logoPreview: string | null
}

interface User {
  id: string
  email?: string
}

export default function BusinessOnboardingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<BusinessFormData>({
    ownerName: '',
    phone: '',
    email: '',
    businessName: '',
    location: '',
    description: '',
    logoFile: null,
    logoPreview: null
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndExistingBusiness()
  }, [])

  const checkAuthAndExistingBusiness = async () => {
    try {
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        router.push('/auth/login?redirect=/onboarding/business')
        return
      }

      const currentUser = {
        id: session.user.id,
        email: session.user.email
      }
      
      setUser(currentUser)
      
      // Pre-fill email if available
      if (currentUser.email) {
        setFormData(prev => ({ ...prev, email: currentUser.email || '' }))
      }

      // Check if user already has a business
      const { data: existingBusiness, error: businessError } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', currentUser.id)
        .single()

      if (existingBusiness && !businessError) {
        // User already has a business, redirect to dashboard
        router.push('/business/dashboard?info=business_exists')
        return
      }

      setLoading(false)
    } catch (err) {
      console.error('Auth check failed:', err)
      router.push('/auth/login?redirect=/onboarding/business')
    }
  }

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null) // Clear errors when user starts typing
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, etc.)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file must be smaller than 5MB')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          logoFile: file,
          logoPreview: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      // Simulate file input change
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>
      handleLogoUpload(fakeEvent)
    }
  }

  const validateForm = (): boolean => {
    if (!formData.ownerName.trim()) {
      setError('Owner name is required')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.businessName.trim()) {
      setError('Business name is required')
      return false
    }
    if (!formData.location.trim()) {
      setError('Business location is required')
      return false
    }
    
    // Validate phone format (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(formData.phone.replace(/\s|-|\(|\)/g, ''))) {
      setError('Please enter a valid phone number')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Upload logo if provided using secure API endpoint
      let logoUrl = null
      if (formData.logoFile) {
        console.log('🖼️ BUSINESS ONBOARDING - Starting logo upload via API')
        
        const logoFormData = new FormData()
        logoFormData.append('logo', formData.logoFile)
        logoFormData.append('userId', user.id)

        const uploadResponse = await fetch('/api/onboarding/upload-logo', {
          method: 'POST',
          body: logoFormData
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResult.success) {
          console.error('❌ BUSINESS ONBOARDING - Logo upload failed:', uploadResult.error)
          setError(`Failed to upload logo: ${uploadResult.error}`)
          return
        }

        logoUrl = uploadResult.data.publicUrl
        console.log('✅ BUSINESS ONBOARDING - Logo uploaded successfully:', logoUrl)
      }

      // Create business record
      const businessData = {
        owner_id: user.id,
        name: formData.businessName.trim(),
        contact_email: formData.email.trim() || user.email,
        contact_number: formData.phone.trim(),
        location: formData.location.trim(),
        description: formData.description.trim() || null,
        logo_url: logoUrl,
        card_requested: true, // Flag for admin to create cards
        status: 'active', // Business is active but needs cards
        created_at: new Date().toISOString()
      }

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single()

      if (businessError) {
        console.error('Business creation failed:', businessError)
        setError('Failed to create business profile. Please try again.')
        return
      }

      // Update user role to business owner (role_id = 2)
      const { error: roleError } = await supabase
        .from('users')
        .update({ role_id: 2 })
        .eq('id', user.id)

      if (roleError) {
        console.error('Role update failed:', roleError)
        // Don't fail the whole process for role update
      }

      console.log('✅ Business created successfully:', business)

      // Redirect to dashboard with success message
              router.push('/business/dashboard?success=business_created&business_id=' + business.id)

    } catch (err) {
      console.error('Submission error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-muted-foreground">Checking your account</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Business Onboarding</h1>
              <p className="text-muted-foreground">
                Set up your business profile to get started with RewardJar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">{error}</span>
                    </div>
                  )}

                  {/* Owner Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Owner Information</h3>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="ownerName">Full Name *</Label>
                        <Input
                          id="ownerName"
                          type="text"
                          placeholder="John Smith"
                          value={formData.ownerName}
                          onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@business.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-1"
                        disabled={!!user?.email}
                      />
                      {user?.email && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Using your account email
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Business Details</h3>
                    
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Smith's Coffee Shop"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Business Location *</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="123 Main St, City, State 12345"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Business Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell us about your business..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Business Logo (Optional)</h3>
                    
                    <div
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('logoUpload')?.click()}
                    >
                      {formData.logoPreview ? (
                        <div className="space-y-2">
                          <div className="relative w-20 h-20 mx-auto">
                            <Image
                              src={formData.logoPreview}
                              alt="Logo preview"
                              fill
                              className="object-contain rounded-lg"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Click or drag to replace logo
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-sm font-medium">Upload your business logo</p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating Your Business...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submit & Request My Card
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Logo Preview */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-2">
                    {formData.logoPreview ? (
                      <Image
                        src={formData.logoPreview}
                        alt="Business logo"
                        width={60}
                        height={60}
                        className="object-contain rounded-lg"
                      />
                    ) : (
                      <Building className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.logoPreview ? 'Your logo' : 'Your logo will appear here'}
                  </p>
                </div>

                {/* Business Info Preview */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Business:</span>
                    <span className="ml-2 text-muted-foreground">
                      {formData.businessName || 'Business name'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Owner:</span>
                    <span className="ml-2 text-muted-foreground">
                      {formData.ownerName || 'Owner name'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <span className="ml-2 text-muted-foreground">
                      {formData.location || 'Business location'}
                    </span>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">What happens next?</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Our team will review your business</li>
                    <li>• We'll create your custom stamp cards and membership cards</li>
                    <li>• You'll receive an email when ready</li>
                    <li>• Start engaging customers right away!</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}