'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  User, 
  Mail, 
  MapPin, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Building
} from 'lucide-react'

// Interfaces

interface ValidationErrors {
  name?: string
  contact_email?: string
  location?: string
  description?: string
  logo_url?: string
  website_url?: string
}

interface FormData {
  name: string
  contact_email: string
  location: string
  description: string
  logo_url: string
  website_url: string
}

export default function BusinessProfilePage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact_email: '',
    location: '',
    description: '',
    logo_url: '',
    website_url: ''
  })
  const [originalData, setOriginalData] = useState<FormData>({
    name: '',
    contact_email: '',
    location: '',
    description: '',
    logo_url: '',
    website_url: ''
  })
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [business, setBusiness] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  const router = useRouter()


  // Calculate profile progress
  const calculateProgress = useCallback((data: FormData) => {
    let progressValue = 0
    if (data.name.trim()) progressValue += 20
    if (data.contact_email.trim()) progressValue += 20
    if (data.location.trim()) progressValue += 20
    if (data.description.trim()) progressValue += 20
    if (data.logo_url.trim()) progressValue += 10
    if (data.website_url.trim()) progressValue += 10
    return progressValue
  }, [])

  // Get missing fields for tooltips
  const getMissingFields = useCallback((data: FormData) => {
    const missing = []
    if (!data.name.trim()) missing.push('Business name')
    if (!data.contact_email.trim()) missing.push('Contact email')
    if (!data.location.trim()) missing.push('Location')
    if (!data.description.trim()) missing.push('Description')
    if (!data.logo_url.trim()) missing.push('Logo')
    if (!data.website_url.trim()) missing.push('Website')
    return missing
  }, [])

  // Fetch business profile data
  const fetchBusinessProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use MCP-powered API route to get business profile
      const response = await fetch('/api/business/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        throw new Error(`Failed to fetch business profile: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load business profile')
      }

      const businessData = result.data

      if (!businessData) {
        setError('Business profile not found')
        return
      }

      setBusiness(businessData)
      
      const profileData = {
        name: businessData.name || '',
        contact_email: businessData.contact_email || '',
        location: businessData.location || '',
        description: businessData.description || '',
        logo_url: businessData.logo_url || '',
        website_url: businessData.website_url || ''
      }

      setFormData(profileData)
      setOriginalData(profileData)
      setProgress(calculateProgress(profileData))

    } catch (err) {
      console.error('Error fetching business profile:', err)
      setError('Failed to load business profile')
    } finally {
      setLoading(false)
    }
  }, [router, calculateProgress])

  useEffect(() => {
    fetchBusinessProfile()
  }, [fetchBusinessProfile])

  // Real-time validation
  const validateField = useCallback((field: keyof FormData, value: string) => {
    const errors: ValidationErrors = { ...validationErrors }

    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Business name is required'
        } else if (value.trim().length < 3) {
          errors.name = 'Name must be at least 3 characters'
        } else if (value.trim().length > 100) {
          errors.name = 'Name must be under 100 characters'
        } else {
          delete errors.name
        }
        break

      case 'contact_email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.contact_email = 'Please enter a valid email address'
        } else {
          delete errors.contact_email
        }
        break

      case 'location':
        if (value.trim() && value.trim().length > 200) {
          errors.location = 'Location must be under 200 characters'
        } else {
          delete errors.location
        }
        break

      case 'description':
        if (value.trim() && value.trim().length > 500) {
          errors.description = 'Description must be under 500 characters'
        } else {
          delete errors.description
        }
        break

      case 'website_url':
        if (value.trim() && !/^https?:\/\/.+\..+/.test(value)) {
          errors.website_url = 'Please enter a valid URL (e.g., https://example.com)'
        } else {
          delete errors.website_url
        }
        break

      case 'logo_url':
        if (value.trim() && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
          errors.logo_url = 'Please enter a valid image URL (.jpg, .png, .gif, .webp)'
        } else {
          delete errors.logo_url
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [validationErrors])

  const handleInputChange = (field: keyof FormData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    setProgress(calculateProgress(newData))
    validateField(field, value)
    
    // Clear success message when user starts editing
    if (success) setSuccess(null)
  }

  const isFormValid = () => {
    return Object.keys(validationErrors).length === 0
  }

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid() || !business || !hasChanges()) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Use MCP-powered API route to update business profile
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          contact_email: formData.contact_email.trim() || null,
          location: formData.location.trim() || null,
          description: formData.description.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          website_url: formData.website_url.trim() || null
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setOriginalData(formData)
      setSuccess('Profile updated successfully!')
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error('Error updating business profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'from-red-500 to-red-500'
    if (progress < 50) return 'from-red-500 to-orange-500'
    if (progress < 80) return 'from-orange-500 to-yellow-500'
    if (progress < 100) return 'from-yellow-500 to-green-500'
    return 'from-green-500 to-green-500'
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </BusinessLayout>
    )
  }

  const missingFields = getMissingFields(formData)

  return (
    <BusinessLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
              <Building className="w-5 md:w-6 h-5 md:h-6 mr-2 text-green-600 flex-shrink-0" />
              <span className="truncate">Business Profile</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              Manage your business information and settings
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">Profile Completion</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {progress}% Complete
              </Badge>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {missingFields.length > 0 && (
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">Complete your profile by adding:</p>
                <ul className="list-disc list-inside space-y-1">
                  {missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700">{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchBusinessProfile}
                  className="ml-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Business Information
            </CardTitle>
            <CardDescription>
              Update your business details to improve customer experience and complete your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Business Name *
                  {validationErrors.name ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.name.trim().length >= 3 ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="name"
                  placeholder="Your Business Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={validationErrors.name ? 'border-red-500' : formData.name.trim().length >= 3 ? 'border-green-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
                <p className="text-xs text-gray-500">{formData.name.length}/100 characters</p>
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Contact Email
                  {validationErrors.contact_email ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.contact_email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email) ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className={validationErrors.contact_email ? 'border-red-500' : formData.contact_email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email) ? 'border-green-500' : ''}
                />
                {validationErrors.contact_email && (
                  <p className="text-sm text-red-600">{validationErrors.contact_email}</p>
                )}
                <p className="text-sm text-gray-500">
                  Email address for customer inquiries and support
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location
                  {validationErrors.location ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.location.trim() ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="location"
                  placeholder="City, State or Full Address"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={validationErrors.location ? 'border-red-500' : formData.location.trim() ? 'border-green-500' : ''}
                />
                {validationErrors.location && (
                  <p className="text-sm text-red-600">{validationErrors.location}</p>
                )}
                <p className="text-xs text-gray-500">{formData.location.length}/200 characters</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Description
                  {validationErrors.description ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.description.trim() ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Brief description of your business and services"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={validationErrors.description ? 'border-red-500' : formData.description.trim() ? 'border-green-500' : ''}
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-600">{validationErrors.description}</p>
                )}
                <p className="text-xs text-gray-500">{formData.description.length}/500 characters</p>
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logo_url" className="flex items-center">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Logo URL
                  {validationErrors.logo_url ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.logo_url.trim() && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(formData.logo_url) ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="logo_url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className={validationErrors.logo_url ? 'border-red-500' : formData.logo_url.trim() && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(formData.logo_url) ? 'border-green-500' : ''}
                />
                {validationErrors.logo_url && (
                  <p className="text-sm text-red-600">{validationErrors.logo_url}</p>
                )}
                <p className="text-sm text-gray-500">
                  Direct URL to your business logo (JPG, PNG, GIF, WebP)
                </p>
                {formData.logo_url.trim() && !validationErrors.logo_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="website_url" className="flex items-center">
                  <Globe className="w-4 h-4 mr-1" />
                  Website URL
                  {validationErrors.website_url ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.website_url.trim() && /^https?:\/\/.+\..+/.test(formData.website_url) ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="website_url"
                  placeholder="https://yourbusiness.com"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className={validationErrors.website_url ? 'border-red-500' : formData.website_url.trim() && /^https?:\/\/.+\..+/.test(formData.website_url) ? 'border-green-500' : ''}
                />
                {validationErrors.website_url && (
                  <p className="text-sm text-red-600">{validationErrors.website_url}</p>
                )}
                <p className="text-sm text-gray-500">
                  Your business website or social media page
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col md:flex-row md:justify-end space-y-3 md:space-y-0 md:space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchBusinessProfile}
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid() || saving || !hasChanges()}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
} 