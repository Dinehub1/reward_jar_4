'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoUpload } from '@/components/ui/logo-upload'
import { GooglePlacesInput } from '@/components/ui/google-places-input'
import { 
  Save, 
  X, 
  AlertCircle, 
  Building2, 
  Mail, 
  FileText, 
  Settings, 
  MapPin, 
  Image,
  Globe,
  Phone,
  Clock,
  Users,
  CreditCard,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

interface BusinessFormData {
  name: string
  description: string
  contact_email: string
  phone?: string
  location: string
  website_url: string
  status: 'active' | 'inactive' | 'pending'
  is_flagged: boolean
  card_requested: boolean
  admin_notes: string
  logo_url?: string
  // Location data
  latitude?: number
  longitude?: number
  place_id?: string
  formatted_address?: string
  // Additional fields
  business_hours?: string
  category?: string
  established_date?: string
  social_media?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

interface BusinessStats {
  totalCards: number
  activeCards: number
  totalCustomers: number
  monthlyActivity: number
  revenue: number
}

interface EnhancedBusinessEditFormProps {
  business: any
  onSave: (updatedBusiness: any) => void
  onCancel: () => void
  loading?: boolean
  stats?: BusinessStats
}

export function EnhancedBusinessEditForm({ 
  business, 
  onSave, 
  onCancel, 
  loading = false,
  stats
}: EnhancedBusinessEditFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<BusinessFormData>({
    name: business?.name || '',
    description: business?.description || '',
    contact_email: business?.contact_email || '',
    phone: business?.phone || '',
    location: business?.location || '',
    website_url: business?.website_url || '',
    status: business?.status || 'active',
    is_flagged: business?.is_flagged || false,
    card_requested: business?.card_requested || false,
    admin_notes: business?.admin_notes || '',
    logo_url: business?.logo_url || '',
    latitude: business?.latitude || undefined,
    longitude: business?.longitude || undefined,
    place_id: business?.place_id || '',
    formatted_address: business?.formatted_address || '',
    business_hours: business?.business_hours || '',
    category: business?.category || '',
    established_date: business?.established_date || '',
    social_media: business?.social_media || {}
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Auto-save functionality
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

  // Sync form data when business prop changes
  useEffect(() => {
    if (business) {
      const newFormData = {
        name: business.name || '',
        description: business.description || '',
        contact_email: business.contact_email || '',
        phone: business.phone || '',
        location: business.location || '',
        website_url: business.website_url || '',
        status: business.status || 'active',
        is_flagged: business.is_flagged || false,
        card_requested: business.card_requested || false,
        admin_notes: business.admin_notes || '',
        logo_url: business.logo_url || '',
        latitude: business.latitude || undefined,
        longitude: business.longitude || undefined,
        place_id: business.place_id || '',
        formatted_address: business.formatted_address || '',
        business_hours: business.business_hours || '',
        category: business.category || '',
        established_date: business.established_date || '',
        social_media: business.social_media || {}
      }
      setFormData(newFormData)
      setIsDirty(false)
    }
  }, [business])

  // Track form changes for dirty state
  useEffect(() => {
    setIsDirty(true)
    
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    // Set new auto-save timer (5 seconds)
    const timer = setTimeout(() => {
      if (isDirty && validateForm(true)) {
        handleAutoSave()
      }
    }, 5000)

    setAutoSaveTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [formData])

  const validateForm = (silent = false): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required'
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s|-|\(|\)/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (formData.website_url && !formData.website_url.startsWith('http')) {
      newErrors.website_url = 'Website URL must start with http:// or https://'
    }

    if (!silent) {
      setErrors(newErrors)
    }
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = useCallback((field: keyof BusinessFormData, value: string | boolean | number | object) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const handleLocationSelect = useCallback((locationData: any) => {
    if (locationData) {
      setFormData(prev => ({
        ...prev,
        location: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        place_id: locationData.placeId,
        formatted_address: locationData.formatted_address
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        location: '',
        latitude: undefined,
        longitude: undefined,
        place_id: '',
        formatted_address: ''
      }))
    }
  }, [])

  const handleAutoSave = async () => {
    if (!isDirty || saving) return

    try {
      setSaving(true)
      
      let logoUrl = formData.logo_url
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const payload = {
        ...formData,
        logo_url: logoUrl,
        id: business.id
      }

      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Auto-save failed')
      }

      const result = await response.json()
      setLastSaved(new Date())
      setIsDirty(false)
      
      // Show subtle success indicator
      
    } catch (error) {
        console.error("Error:", error)
      } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return formData.logo_url || ''

    setUploading(true)
    try {
      const logoFormData = new FormData()
      logoFormData.append('file', logoFile)
      logoFormData.append('type', 'logo')
      logoFormData.append('businessId', business.id)

      const response = await fetch('/api/admin/upload-media', {
        method: 'POST',
        body: logoFormData
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload logo')
      }

      return result.data.publicUrl
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      let logoUrl = formData.logo_url
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const payload = {
        ...formData,
        logo_url: logoUrl,
        id: business.id
      }

      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update business')
      }

      const result = await response.json()
      setLastSaved(new Date())
      setIsDirty(false)
      onSave(result.data)
      
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Edit Business Profile</h2>
          {isDirty && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Unsaved Changes
            </Badge>
          )}
          {lastSaved && !isDirty && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            size="sm"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
        </div>
      </div>

      {/* Business Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCards}</div>
              <p className="text-xs text-gray-500">Total Cards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.activeCards}</div>
              <p className="text-xs text-gray-500">Active Cards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCustomers}</div>
              <p className="text-xs text-gray-500">Customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.monthlyActivity}</div>
              <p className="text-xs text-gray-500">Monthly Activity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">${stats.revenue}</div>
              <p className="text-xs text-gray-500">Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Business Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                      disabled={loading || saving}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <div className="flex">
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        className={errors.contact_email ? 'border-red-500' : ''}
                        disabled={loading || saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formData.contact_email)}
                        className="ml-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {errors.contact_email && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.contact_email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    disabled={loading || saving}
                    placeholder="Describe your business..."
                  />
                </div>

                {showAdvanced && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={errors.phone ? 'border-red-500' : ''}
                          disabled={loading || saving}
                          placeholder="+1 (555) 123-4567"
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="category">Business Category</Label>
                        <Select 
                          value={formData.category || ''} 
                          onValueChange={(value) => handleInputChange('category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="fitness">Fitness</SelectItem>
                            <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                            <SelectItem value="automotive">Automotive</SelectItem>
                            <SelectItem value="professional">Professional Services</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="business_hours">Business Hours</Label>
                      <Textarea
                        id="business_hours"
                        value={formData.business_hours || ''}
                        onChange={(e) => handleInputChange('business_hours', e.target.value)}
                        rows={2}
                        disabled={loading || saving}
                        placeholder="Mon-Fri: 9AM-6PM, Sat: 10AM-4PM, Sun: Closed"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Business Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GooglePlacesInput
                  value={formData.location}
                  onChange={handleLocationSelect}
                  placeholder="Enter business address"
                  error={errors.location}
                  disabled={loading || saving}
                />

                {formData.latitude && formData.longitude && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">📍 Location Confirmed</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Address:</strong> {formData.formatted_address}</div>
                      <div><strong>Coordinates:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</div>
                      {formData.place_id && <div><strong>Place ID:</strong> {formData.place_id}</div>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${formData.latitude},${formData.longitude}`)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Coordinates
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://maps.google.com/?q=${formData.latitude},${formData.longitude}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on Maps
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Business Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <LogoUpload
                  value={logoFile}
                  onChange={setLogoFile}
                  previewUrl={formData.logo_url}
                  disabled={loading || saving || uploading}
                  error={errors.logo}
                />

                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <div className="flex">
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      className={errors.website_url ? 'border-red-500' : ''}
                      disabled={loading || saving}
                      placeholder="https://www.example.com"
                    />
                    {formData.website_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.website_url, '_blank')}
                        className="ml-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {errors.website_url && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.website_url}
                    </p>
                  )}
                </div>

                {showAdvanced && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Social Media Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.social_media?.facebook || ''}
                          onChange={(e) => handleInputChange('social_media', {
                            ...formData.social_media,
                            facebook: e.target.value
                          })}
                          placeholder="https://facebook.com/yourpage"
                          disabled={loading || saving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.social_media?.instagram || ''}
                          onChange={(e) => handleInputChange('social_media', {
                            ...formData.social_media,
                            instagram: e.target.value
                          })}
                          placeholder="https://instagram.com/yourprofile"
                          disabled={loading || saving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.social_media?.twitter || ''}
                          onChange={(e) => handleInputChange('social_media', {
                            ...formData.social_media,
                            twitter: e.target.value
                          })}
                          placeholder="https://twitter.com/yourhandle"
                          disabled={loading || saving}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Business Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="status">Business Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'active' | 'inactive' | 'pending') => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Inactive
                          </div>
                        </SelectItem>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Pending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="is_flagged">Flagged Business</Label>
                        <p className="text-sm text-gray-500">Mark if this business needs attention</p>
                      </div>
                      <Switch
                        id="is_flagged"
                        checked={formData.is_flagged}
                        onCheckedChange={(checked) => handleInputChange('is_flagged', checked)}
                        disabled={loading || saving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="card_requested">Card Requested</Label>
                        <p className="text-sm text-gray-500">Business needs cards created</p>
                      </div>
                      <Switch
                        id="card_requested"
                        checked={formData.card_requested}
                        onCheckedChange={(checked) => handleInputChange('card_requested', checked)}
                        disabled={loading || saving}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="admin_notes">Admin Notes</Label>
                  <Textarea
                    id="admin_notes"
                    value={formData.admin_notes}
                    onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                    rows={4}
                    disabled={loading || saving}
                    placeholder="Internal notes about this business..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.submit}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {saving && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            )}
            {uploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading logo...
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading || saving || uploading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={loading || saving || uploading || !isDirty}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}