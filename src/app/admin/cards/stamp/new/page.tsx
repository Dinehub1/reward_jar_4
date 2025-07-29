'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, CheckCircle, AlertCircle, Gift, Hash, Building, Star, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'

// Form validation interfaces
interface StampCardForm {
  name: string
  total_stamps: number
  reward_description: string
}

interface BusinessData {
  id: string
  name: string
  logo_url?: string
  description?: string
}

interface ValidationErrors {
  name?: string
  total_stamps?: string
  reward_description?: string
  business_id?: string
}

export default function AdminNewStampCard() {
  const [formData, setFormData] = useState<StampCardForm>({
    name: '',
    total_stamps: 10,
    reward_description: ''
  })
  const [businessData, setBusiness] = useState<BusinessData | null>(null)
  const [businesses, setBusinesses] = useState<BusinessData[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  // Fetch all businesses for admin selection
  const fetchBusinesses = useCallback(async () => {
    const { data: businessesData, error } = await supabase
      .from('businesses')
      .select('id, name, logo_url, description')
      .eq('status', 'active')
      .order('name')

    if (error) {
      throw new Error('Failed to load businesses')
    }

    return businessesData || []
  }, [supabase])

  // Fetch business data and list of all businesses
  const fetchBusinessData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Get current session (admin)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      // Fetch all businesses for selection
      const businessesList = await fetchBusinesses()
      setBusinesses(businessesList)
      
      // Set first business as default if available
      if (businessesList.length > 0) {
        setSelectedBusinessId(businessesList[0].id)
        setBusiness(businessesList[0])
      }
      
    } catch (err) {
      console.error('Error fetching business data:', err)
      setError('Failed to load business information.')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router, fetchBusinesses])

  useEffect(() => {
    fetchBusinessData()
  }, [fetchBusinessData])

  // Real-time validation
  const validateField = useCallback((field: keyof StampCardForm, value: string | number) => {
    const errors: ValidationErrors = { ...validationErrors }

    switch (field) {
      case 'name':
        const nameStr = value as string
        if (!nameStr.trim()) {
          errors.name = 'Card name is required'
        } else if (nameStr.trim().length < 3) {
          errors.name = 'Name must be at least 3 characters'
        } else if (nameStr.trim().length > 100) {
          errors.name = 'Name must be under 100 characters'
        } else {
          delete errors.name
        }
        break

      case 'total_stamps':
        const stamps = value as number
        if (!stamps || stamps < 1) {
          errors.total_stamps = 'Must require at least 1 stamp'
        } else if (stamps > 50) {
          errors.total_stamps = 'Maximum 50 stamps allowed'
        } else {
          delete errors.total_stamps
        }
        break

      case 'reward_description':
        const descStr = value as string
        if (!descStr.trim()) {
          errors.reward_description = 'Reward description is required'
        } else if (descStr.trim().length < 5) {
          errors.reward_description = 'Description must be at least 5 characters'
        } else if (descStr.trim().length > 500) {
          errors.reward_description = 'Description must be under 500 characters'
        } else {
          delete errors.reward_description
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [validationErrors])

  const handleInputChange = (field: keyof StampCardForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId)
    const selectedBusiness = businesses.find(b => b.id === businessId)
    if (selectedBusiness) {
      setBusiness(selectedBusiness)
    }
    
    // Clear business validation error if one was set
    const errors = { ...validationErrors }
    delete errors.business_id
    setValidationErrors(errors)
  }

  const isFormValid = () => {
    return Object.keys(validationErrors).length === 0 && 
           formData.name.trim() && 
           formData.total_stamps > 0 && 
           formData.reward_description.trim() &&
           selectedBusinessId
  }

  const handleSubmit = async () => {
    if (!isFormValid() || !selectedBusinessId) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Insert stamp card using Supabase with selected business
      const { error: insertError } = await supabase
        .from('stamp_cards')
        .insert({
          business_id: selectedBusinessId,
          name: formData.name.trim(),
          total_stamps: formData.total_stamps,
          reward_description: formData.reward_description.trim(),
          status: 'active'
        })

      if (insertError) {
        throw insertError
      }

      // Success - redirect to admin dashboard
      router.push('/admin?success=stamp_card_created')
      
    } catch (err) {
      console.error('Error creating stamp card:', err)
      setError(err instanceof Error ? err.message : 'Failed to create stamp card')
    } finally {
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
  }

  const renderStampGrid = () => {
    const stamps = Array.from({ length: formData.total_stamps }, (_, i) => i)
    const cols = Math.min(5, formData.total_stamps)
    const rows = Math.ceil(formData.total_stamps / cols)
    
    return (
      <div 
        className="grid gap-2 mb-4"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {stamps.map((index) => (
          <div
            key={index}
            className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center"
          >
            <Star className="w-4 h-4 text-white/50" />
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Stamp Card</h1>
          <p className="text-gray-600">Set up a new loyalty program for the selected business</p>
          {businessData && (
            <p className="text-sm text-blue-600">Creating for: {businessData.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="w-5 h-5 mr-2 text-green-600" />
              Stamp Card Details
            </CardTitle>
          <CardDescription>
            Configure the loyalty program settings. Customers will collect stamps and receive rewards when they complete the card.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-6">
            {/* Business Selection */}
            <div className="space-y-2">
              <Label htmlFor="business_id" className="flex items-center">
                <Building className="w-4 h-4 mr-1" />
                Select Business *
                {selectedBusinessId ? (
                  <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                )}
              </Label>
              <Select value={selectedBusinessId} onValueChange={handleBusinessChange}>
                <SelectTrigger className={selectedBusinessId ? 'border-green-500' : 'border-red-500'}>
                  <SelectValue placeholder="Choose a business to create card for" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      <div className="flex items-center space-x-2">
                        {business.logo_url ? (
                          <img 
                            src={business.logo_url} 
                            alt="Logo" 
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <Building className="w-4 h-4 text-gray-400" />
                        )}
                        <span>{business.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Select which business this stamp card will belong to
              </p>
            </div>

            {/* Card Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Card Name *
                  {validationErrors.name ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.name.trim().length >= 3 ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
              <Input
                id="name"
                placeholder="e.g., Coffee Loyalty Card"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={validationErrors.name ? 'border-red-500' : formData.name.trim().length >= 3 ? 'border-green-500' : ''}
              />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
              )}
                <p className="text-xs text-gray-500">{formData.name.length}/100 characters</p>
            </div>

            {/* Total Stamps */}
            <div className="space-y-2">
                <Label htmlFor="total_stamps" className="flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  Number of Stamps Required *
                  {validationErrors.total_stamps ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.total_stamps >= 1 ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
              <Input
                id="total_stamps"
                type="number"
                min="1"
                max="50"
                  value={formData.total_stamps}
                  onChange={(e) => handleInputChange('total_stamps', parseInt(e.target.value) || 0)}
                  className={validationErrors.total_stamps ? 'border-red-500' : formData.total_stamps >= 1 ? 'border-green-500' : ''}
              />
                {validationErrors.total_stamps && (
                  <p className="text-sm text-red-600">{validationErrors.total_stamps}</p>
              )}
              <p className="text-sm text-gray-500">
                How many stamps do customers need to collect to earn the reward?
              </p>
            </div>

            {/* Reward Description */}
            <div className="space-y-2">
                <Label htmlFor="reward_description" className="flex items-center">
                  <Gift className="w-4 h-4 mr-1" />
                  Reward Description *
                  {validationErrors.reward_description ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.reward_description.trim().length >= 5 ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Textarea
                id="reward_description"
                rows={3}
                placeholder="e.g., Free coffee of your choice"
                  value={formData.reward_description}
                  onChange={(e) => handleInputChange('reward_description', e.target.value)}
                  className={validationErrors.reward_description ? 'border-red-500' : formData.reward_description.trim().length >= 5 ? 'border-green-500' : ''}
              />
                {validationErrors.reward_description && (
                  <p className="text-sm text-red-600">{validationErrors.reward_description}</p>
              )}
                <p className="text-xs text-gray-500">{formData.reward_description.length}/500 characters</p>
              <p className="text-sm text-gray-500">
                Describe what reward customers will receive when they complete their card.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
              <Link href="/admin">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
                <Button 
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!isFormValid() || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Create Stamp Card
              </Button>
              </div>
            </div>
        </CardContent>
      </Card>

        {/* Live Preview */}
        <Card className="border-green-200">
        <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <Building className="w-5 h-5 mr-2" />
              Live Preview
            </CardTitle>
          <CardDescription>This is how your stamp card will appear to customers</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {businessData?.logo_url ? (
                    <img 
                      src={businessData.logo_url} 
                      alt="Business Logo" 
                      className="w-10 h-10 rounded-full bg-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {businessData?.name || 'Selected Business'}
            </h3>
                    <p className="text-xs text-green-200">Loyalty Card</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Loyalty
                </Badge>
              </div>

              {/* Card Name */}
              <h4 className="text-xl font-bold mb-4">
                {formData.name || 'Your Card Name'}
              </h4>

              {/* Stamp Grid */}
              <div className="mb-4">
                <p className="text-sm text-green-200 mb-2">
                  Collect {formData.total_stamps} stamps to earn your reward
                </p>
                {renderStampGrid()}
              </div>

              {/* Reward */}
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm text-green-200 mb-1">Your Reward:</p>
                <p className="font-semibold">
                  {formData.reward_description || 'Your reward description'}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-green-200 text-center">
                  Scan QR code at {businessData?.name || 'business'} to collect stamps
                </p>
              </div>
            </div>

            {/* Validation Status */}
            <div className="mt-4 space-y-2">
              <h5 className="font-medium text-sm text-gray-700">Validation Status</h5>
              <div className="space-y-1">
                {[
                  { field: 'business_id', label: 'Business Selected', valid: !!selectedBusinessId },
                  { field: 'name', label: 'Card Name', valid: formData.name.trim().length >= 3 },
                  { field: 'total_stamps', label: 'Total Stamps', valid: formData.total_stamps >= 1 },
                  { field: 'reward_description', label: 'Reward Description', valid: formData.reward_description.trim().length >= 5 }
                ].map(({ field, label, valid }) => (
                  <div key={field} className="flex items-center space-x-2 text-sm">
                    {valid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={valid ? 'text-green-700' : 'text-red-700'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm Stamp Card Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  You&apos;re about to create a new stamp card with the following details:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Business:</span>
                    <span>{businessData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Stamps Required:</span>
                    <span>{formData.total_stamps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Reward:</span>
                    <span className="text-right text-sm">{formData.reward_description}</span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Stamp Card'}
                  </Button>
                </div>
          </div>
        </CardContent>
      </Card>
        </div>
      )}
      </div>
    </AdminLayoutClient>
  )
} 