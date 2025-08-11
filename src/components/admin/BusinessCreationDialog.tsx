'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Building2, Mail, FileText, Settings, AlertCircle } from 'lucide-react'
import { LogoUpload } from '@/components/ui/logo-upload'

interface BusinessFormData {
  name: string
  description: string
  contact_email: string
  status: 'active' | 'inactive' | 'pending'
  card_requested: boolean
  logo_url?: string
}

interface BusinessCreationDialogProps {
  onBusinessCreated?: () => void
}

export function BusinessCreationDialog({ onBusinessCreated }: BusinessCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    contact_email: '',
    status: 'active',
    card_requested: false,
    logo_url: undefined
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      let logoUrl = formData.logo_url

      // Upload logo if provided
      if (logoFile) {
        setUploading(true)
        
        const logoFormData = new FormData()
        logoFormData.append('file', logoFile)
        logoFormData.append('type', 'logo')
        logoFormData.append('businessId', 'temp-' + Date.now()) // Temporary ID for upload

        const uploadResponse = await fetch('/api/admin/upload-media', {
          method: 'POST',
          body: logoFormData
        })

        const uploadResult = await uploadResponse.json()
        setUploading(false)

        if (!uploadResult.success) {
          setErrors({ logo: uploadResult.error || 'Failed to upload logo' })
          setLoading(false)
          return
        }

        logoUrl = uploadResult.data.publicUrl
      }

      const businessPayload = {
        ...formData,
        logo_url: logoUrl
      }

      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessPayload)
      })

      const result = await response.json()

      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          contact_email: '',
          status: 'active',
          card_requested: false,
          logo_url: undefined
        })
        setLogoFile(null)
        
        // Close dialog
        setOpen(false)
        
        // Notify parent component
        if (onBusinessCreated) {
          onBusinessCreated()
        }

        // Show success message
        alert('✅ Business created successfully!')
      } else {
        // Handle API error
        if (response.status === 409) {
          setErrors({ contact_email: 'Business with this email already exists' })
        } else {
          setErrors({ submit: result.error || 'Failed to create business' })
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create business' })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const handleInputChange = (field: keyof BusinessFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Business
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Business
          </DialogTitle>
          <DialogDescription>
            Add a new business to the RewardJar platform. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
            {errors.contact_email && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.contact_email}
              </p>
            )}
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
              placeholder="Brief description of the business (optional)"
              rows={3}
            />
          </div>

          {/* Logo Upload */}
          <LogoUpload
            value={logoFile}
            onChange={setLogoFile}
            disabled={loading || uploading}
            error={errors.logo}
          />

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

          {/* Card Requested */}
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Card Requested
              </Label>
              <p className="text-sm text-gray-500">
                Mark if this business needs cards created
              </p>
            </div>
            <Switch
              checked={formData.card_requested}
              onCheckedChange={(checked) => handleInputChange('card_requested', checked)}
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
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading || uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {uploading ? 'Uploading Logo...' : 'Creating...'}
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 mr-2" />
                Create Business
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}