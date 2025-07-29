'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, CheckCircle, AlertCircle, Calendar, DollarSign, Users, Building } from 'lucide-react'
import Link from 'next/link'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'

// Form validation interfaces
interface MembershipCardForm {
  name: string
  total_sessions: number
  cost: number
  expiry_date: string
}

interface BusinessData {
  id: string
  name: string
  logo_url?: string
  description?: string
}

interface ValidationErrors {
  name?: string
  total_sessions?: string
  cost?: string
  expiry_date?: string
  business_id?: string
}

export default function AdminNewMembershipCard() {
  const [formData, setFormData] = useState<MembershipCardForm>({
    name: '',
    total_sessions: 20,
    cost: 15000,
    expiry_date: ''
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
      
      // Set default expiry date (1 year from now)
      const defaultExpiry = new Date()
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1)
      setFormData(prev => ({
        ...prev,
        expiry_date: defaultExpiry.toISOString().split('T')[0]
      }))
      
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
  const validateField = useCallback((field: keyof MembershipCardForm, value: string | number) => {
    const errors: ValidationErrors = { ...validationErrors }

    switch (field) {
      case 'name':
        const nameStr = value as string
        if (!nameStr.trim()) {
          errors.name = 'Membership name is required'
        } else if (nameStr.trim().length < 3) {
          errors.name = 'Name must be at least 3 characters'
        } else if (nameStr.trim().length > 100) {
          errors.name = 'Name must be under 100 characters'
        } else {
          delete errors.name
        }
        break

      case 'total_sessions':
        const sessions = value as number
        if (!sessions || sessions < 1) {
          errors.total_sessions = 'Must have at least 1 session'
        } else if (sessions > 100) {
          errors.total_sessions = 'Maximum 100 sessions allowed'
        } else {
          delete errors.total_sessions
        }
        break

      case 'cost':
        const cost = value as number
        if (!cost || cost < 1000) {
          errors.cost = 'Minimum cost is ₩1,000'
        } else if (cost > 10000000) {
          errors.cost = 'Maximum cost is ₩10,000,000'
        } else {
          delete errors.cost
        }
        break

      case 'expiry_date':
        const dateStr = value as string
        if (!dateStr) {
          errors.expiry_date = 'Expiry date is required'
        } else {
          const selectedDate = new Date(dateStr)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (selectedDate <= today) {
            errors.expiry_date = 'Expiry date must be in the future'
          } else {
            delete errors.expiry_date
          }
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [validationErrors])

  const handleInputChange = (field: keyof MembershipCardForm, value: string | number) => {
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

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const isFormValid = () => {
    return Object.keys(validationErrors).length === 0 && 
           formData.name.trim() && 
           formData.total_sessions > 0 && 
           formData.cost >= 1000 && 
           formData.expiry_date &&
           selectedBusinessId
  }

  const handleSubmit = async () => {
    if (!isFormValid() || !selectedBusinessId) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Insert membership card using Supabase with selected business
      const { error: insertError } = await supabase
        .from('membership_cards')
        .insert({
          business_id: selectedBusinessId,
          name: formData.name.trim(),
          total_sessions: formData.total_sessions,
          cost: formData.cost,
          membership_type: 'gym',
          status: 'active'
        })

      if (insertError) {
        throw insertError
      }

      // Success - redirect to admin dashboard
      router.push('/admin?success=membership_created')
      
    } catch (err) {
      console.error('Error creating membership card:', err)
      setError(err instanceof Error ? err.message : 'Failed to create membership card')
    } finally {
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="animate-pulse">
          <div className="h-6 md:h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 md:h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <Link href="/admin" className="w-full md:w-auto">
          <Button variant="outline" size="sm" className="w-full md:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Create New Membership Card</h1>
          <p className="text-sm md:text-base text-gray-600">Set up a new membership program for the selected business</p>
          {businessData && (
            <p className="text-sm text-blue-600">Creating for: {businessData.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-600" />
              Membership Details
            </CardTitle>
            <CardDescription>
              Configure the membership program settings. Customers will purchase sessions and track their usage.
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
                    <SelectValue placeholder="Choose a business to create membership for" />
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
                  Select which business this membership card will belong to
                </p>
              </div>

              {/* Membership Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Membership Name *
                  {validationErrors.name ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.name.trim().length >= 3 ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Premium Gym Membership"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={validationErrors.name ? 'border-red-500' : formData.name.trim().length >= 3 ? 'border-green-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">{validationErrors.name}</p>
                )}
                <p className="text-xs text-gray-500">{formData.name.length}/100 characters</p>
              </div>

              {/* Total Sessions */}
              <div className="space-y-2">
                <Label htmlFor="total_sessions" className="flex items-center">
                  Total Sessions *
                  {validationErrors.total_sessions ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.total_sessions >= 1 ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="total_sessions"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.total_sessions}
                  onChange={(e) => handleInputChange('total_sessions', parseInt(e.target.value) || 0)}
                  className={validationErrors.total_sessions ? 'border-red-500' : formData.total_sessions >= 1 ? 'border-green-500' : ''}
                />
                {validationErrors.total_sessions && (
                  <p className="text-sm text-red-600">{validationErrors.total_sessions}</p>
                )}
                <p className="text-sm text-gray-500">
                  How many sessions are included in this membership?
                </p>
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost" className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Membership Cost *
                  {validationErrors.cost ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.cost >= 1000 ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₩</span>
                  <Input
                    id="cost"
                    type="number"
                    min="1000"
                    max="10000000"
                    step="1000"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseInt(e.target.value) || 0)}
                    className={`pl-8 ${validationErrors.cost ? 'border-red-500' : formData.cost >= 1000 ? 'border-green-500' : ''}`}
                  />
                </div>
                {validationErrors.cost && (
                  <p className="text-sm text-red-600">{validationErrors.cost}</p>
                )}
                <p className="text-sm text-gray-500">
                  Total cost: {formatCurrency(formData.cost)} | Per session: {formatCurrency(Math.round(formData.cost / (formData.total_sessions || 1)))}
                </p>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiry_date" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Membership Expiry *
                  {validationErrors.expiry_date ? (
                    <AlertCircle className="w-4 h-4 ml-1 text-red-500" />
                  ) : formData.expiry_date && new Date(formData.expiry_date) > new Date() ? (
                    <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                  ) : null}
                </Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  className={validationErrors.expiry_date ? 'border-red-500' : formData.expiry_date && new Date(formData.expiry_date) > new Date() ? 'border-green-500' : ''}
                />
                {validationErrors.expiry_date && (
                  <p className="text-sm text-red-600">{validationErrors.expiry_date}</p>
                )}
                <p className="text-sm text-gray-500">
                  When should this membership expire by default?
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
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Membership
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-700">
              <Building className="w-5 h-5 mr-2" />
              Live Preview
            </CardTitle>
            <CardDescription>This is how the membership card will appear to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-xl p-6 text-white shadow-lg">
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
                    <p className="text-xs text-indigo-200">Membership Card</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Premium
                </Badge>
              </div>

              {/* Membership Name */}
              <h4 className="text-xl font-bold mb-3">
                {formData.name || 'Membership Name'}
              </h4>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Sessions Used</span>
                  <span>0 / {formData.total_sessions}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div className="bg-white h-3 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-indigo-200">Total Cost</p>
                  <p className="font-semibold">{formatCurrency(formData.cost)}</p>
                </div>
                <div>
                  <p className="text-indigo-200">Per Session</p>
                  <p className="font-semibold">{formatCurrency(Math.round(formData.cost / (formData.total_sessions || 1)))}</p>
                </div>
                <div>
                  <p className="text-indigo-200">Expires</p>
                  <p className="font-semibold">
                    {formData.expiry_date ? new Date(formData.expiry_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-200">Status</p>
                  <p className="font-semibold">Active</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-indigo-200 text-center">
                  Scan QR code at {businessData?.name || 'business'} to mark sessions
                </p>
              </div>
            </div>

            {/* Validation Status */}
            <div className="mt-4 space-y-2">
              <h5 className="font-medium text-sm text-gray-700">Validation Status</h5>
              <div className="space-y-1">
                {[
                  { field: 'business_id', label: 'Business Selected', valid: !!selectedBusinessId },
                  { field: 'name', label: 'Membership Name', valid: formData.name.trim().length >= 3 },
                  { field: 'total_sessions', label: 'Total Sessions', valid: formData.total_sessions >= 1 },
                  { field: 'cost', label: 'Cost', valid: formData.cost >= 1000 },
                  { field: 'expiry_date', label: 'Expiry Date', valid: formData.expiry_date && new Date(formData.expiry_date) > new Date() }
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
              <CardTitle className="flex items-center text-indigo-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm Membership Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  You&apos;re about to create a new membership card with the following details:
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
                    <span className="font-medium">Sessions:</span>
                    <span>{formData.total_sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cost:</span>
                    <span>{formatCurrency(formData.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Expires:</span>
                    <span>{new Date(formData.expiry_date).toLocaleDateString()}</span>
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
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Membership'}
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