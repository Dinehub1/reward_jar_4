'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoUpload } from '@/components/ui/logo-upload'
import { GooglePlacesInput } from '@/components/ui/google-places-input'
import { Save, X, AlertCircle, Building2, Mail, FileText, Settings, MapPin, Image } from 'lucide-react'

interface BusinessFormData {
  name: string
  description: string
  contact_email: string
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
}

interface BusinessEditFormProps {
  business: any
  onSave: (updatedBusiness: any) => void
  onCancel: () => void
  loading?: boolean
}

export function BusinessEditForm({ 
  business, 
  onSave, 
  onCancel, 
  loading = false 
}: BusinessEditFormProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: business?.name || '',
    description: business?.description || '',
    contact_email: business?.contact_email || '',
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
    formatted_address: business?.formatted_address || ''
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync form data when business prop changes
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        description: business.description || '',
        contact_email: business.contact_email || '',
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
        formatted_address: business.formatted_address || ''
      })
    }
  }, [business])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required'
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof BusinessFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleLocationSelect = (locationData: any) => {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    setErrors({})

    try {
      let logoUrl = formData.logo_url

      // Upload logo if new file is provided
      if (logoFile) {
        setUploading(true)
        
        const logoFormData = new FormData()
        logoFormData.append('file', logoFile)
        logoFormData.append('type', 'logo')
        logoFormData.append('businessId', business.id)

        const uploadResponse = await fetch('/api/admin/upload-media', {
          method: 'POST',
          body: logoFormData
        })

        const uploadResult = await uploadResponse.json()
        setUploading(false)

        if (!uploadResult.success) {
          setErrors({ logo: uploadResult.error || 'Failed to upload logo' })
          setSaving(false)
          return
        }

        logoUrl = uploadResult.data.publicUrl
      }

      // Update business data
      const updatePayload = {
        ...formData,
        logo_url: logoUrl
      }

      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      })

      const result = await response.json()

      if (result.success) {
        onSave(result.data)
      } else {
        // Handle API error
        if (response.status === 409) {
          setErrors({ contact_email: 'Another business with this email already exists' })
        } else {
          setErrors({ submit: result.error || 'Failed to update business' })
        }
      }
    } catch (error) {
      console.error('Error updating business:', error)
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Edit Business Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Bella Buono Restaurant"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading || saving}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Email *
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="e.g. owner@bellabunao.com"
                className={errors.contact_email ? 'border-red-500' : ''}
                disabled={loading || saving}
              />
              {errors.contact_email && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.contact_email}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the business"
              rows={3}
              disabled={loading || saving}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Logo Upload */}
            <LogoUpload
              value={logoFile}
              onChange={setLogoFile}
              previewUrl={formData.logo_url}
              disabled={loading || saving || uploading}
              error={errors.logo}
            />

            {/* Google Places Location Input */}
            <GooglePlacesInput
              value={formData.location}
              onChange={handleLocationSelect}
              placeholder="Enter business address"
              error={errors.location}
              disabled={loading || saving}
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="website_url" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Website URL
            </Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
              placeholder="https://www.example.com"
              disabled={loading || saving}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'pending') => 
                  handleInputChange('status', value)
                }
                disabled={loading || saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Flags */}
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label className="text-sm font-medium">Flagged Business</Label>
                  <p className="text-xs text-gray-500">Mark if this business needs attention</p>
                </div>
                <Switch
                  checked={formData.is_flagged}
                  onCheckedChange={(checked) => handleInputChange('is_flagged', checked)}
                  disabled={loading || saving}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label className="text-sm font-medium">Card Requested</Label>
                  <p className="text-xs text-gray-500">Business needs cards created</p>
                </div>
                <Switch
                  checked={formData.card_requested}
                  onCheckedChange={(checked) => handleInputChange('card_requested', checked)}
                  disabled={loading || saving}
                />
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin_notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Admin Notes
            </Label>
            <Textarea
              id="admin_notes"
              value={formData.admin_notes}
              onChange={(e) => handleInputChange('admin_notes', e.target.value)}
              placeholder="Internal notes for tracking and support..."
              rows={4}
              disabled={loading || saving}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              disabled={loading || saving || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving || uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}