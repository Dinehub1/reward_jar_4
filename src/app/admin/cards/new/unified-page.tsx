'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModernButton } from '@/components/modern/ui/ModernButton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { PageTransition } from '@/components/modern/layout/PageTransition'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import CardLivePreview, { type CardLivePreviewData } from '@/components/unified/CardLivePreview'
import { useAdminBusinesses } from '@/lib/hooks/use-admin-data'
import { 
  ArrowLeft, 
  Zap, 
  Settings,
  Timer,
  Sparkles,
  Save,
  Eye,
  CreditCard,
  Users,
  Coffee,
  Dumbbell,
  ShoppingBag,
  Scissors,
  Stethoscope,
  Building
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'
import { getStampCardTemplates, getMembershipCardTemplates, generateCardContent } from '@/lib/smart-templates'
import { CARD_COLORS } from '@/lib/cardDesignTheme'
// Simple notification function (replace with your preferred toast library)
const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message)
    alert(`Success: ${message}`)
  },
  error: (message: string) => {
    console.error('❌ Error:', message)
    alert(`Error: ${message}`)
  }
}

// Types
interface Business {
  id: string
  name: string
  contact_email: string
  description?: string
  logo_url?: string
}

export interface CardType {
  id: 'stamp_card' | 'membership_card'
  name: string
  description: string
  icon: string
  examples: string[]
  features: string[]
  completionTime: string
  color: string
  gradient: string
}

interface UnifiedCardFormData {
  // Common fields
  cardType: 'stamp_card' | 'membership_card'
  businessId: string
  businessName: string
  businessLogoUrl?: string
  cardName: string
  cardColor: string
  iconEmoji: string
  cardDescription: string
  
  // Stamp card fields
  stampsRequired: number
  reward: string
  rewardDescription: string
  howToEarnStamp: string
  rewardDetails: string
  earnedStampMessage: string
  earnedRewardMessage: string
  
  // Membership card fields
  totalSessions: number
  membershipType: string
  cost: number
  durationDays: number
  howToUseCard: string
  membershipDetails: string
  sessionUsedMessage: string
  membershipExpiredMessage: string
}

// Card type configurations
const CARD_TYPES: CardType[] = [
  {
    id: 'stamp_card',
    name: 'Stamp Card',
    description: 'Reward customers with stamps for purchases. Perfect for loyalty programs.',
    icon: '🎫',
    examples: ['Coffee shops', 'Restaurants', 'Retail stores', 'Salons'],
    features: ['Collect stamps', 'Earn rewards', 'Progress tracking', 'QR code scanning'],
    completionTime: '2-3 minutes',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'membership_card',
    name: 'Membership Card',
    description: 'Manage access control and membership benefits. Great for premium services.',
    icon: '💳',
    examples: ['Gyms', 'Clubs', 'Subscriptions', 'VIP access'],
    features: ['Access control', 'Session tracking', 'Membership tiers', 'Expiry management'],
    completionTime: '3-5 minutes',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-purple-600'
  }
]

interface UnifiedCardCreationPageProps {
  businesses: Business[]
}

export default function UnifiedCardCreationPage({ businesses }: UnifiedCardCreationPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Page state
  const [selectedCardType, setSelectedCardType] = useState<'stamp_card' | 'membership_card' | null>(null)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form data with default values
  const [formData, setFormData] = useState<UnifiedCardFormData>({
    cardType: 'stamp_card',
    businessId: '',
    businessName: '',
    businessLogoUrl: '',
    cardName: '',
    cardColor: CARD_COLORS.primary.purple,
    iconEmoji: '⭐',
    cardDescription: '',
    
    // Stamp card defaults
    stampsRequired: 10,
    reward: '',
    rewardDescription: '',
    howToEarnStamp: '',
    rewardDetails: '',
    earnedStampMessage: '',
    earnedRewardMessage: '',
    
    // Membership card defaults
    totalSessions: 10,
    membershipType: 'gym',
    cost: 1000,
    durationDays: 30,
    howToUseCard: '',
    membershipDetails: '',
    sessionUsedMessage: '',
    membershipExpiredMessage: ''
  })

  // Business data
  const { data: businessesData, error: businessError } = useAdminBusinesses()
  const allBusinesses = businessesData || businesses || []

  // Get templates based on card type
  const availableTemplates = selectedCardType === 'stamp_card' 
    ? getStampCardTemplates() 
    : getMembershipCardTemplates()

  // Convert form data to preview data
  const getPreviewData = useCallback((): CardLivePreviewData => {
    const selectedBusiness = allBusinesses.find(b => b.id === formData.businessId)
    
    return {
      cardType: formData.cardType,
      businessId: formData.businessId,
      businessName: formData.businessName || selectedBusiness?.name || 'Your Business',
      businessLogoUrl: formData.businessLogoUrl || selectedBusiness?.logo_url,
      cardName: formData.cardName || 'Your Card',
      cardColor: formData.cardColor,
      iconEmoji: formData.iconEmoji,
      cardDescription: formData.cardDescription,
      
      // Stamp card data
      ...(formData.cardType === 'stamp_card' && {
        stampsRequired: formData.stampsRequired,
        reward: formData.reward,
        rewardDescription: formData.rewardDescription,
        howToEarnStamp: formData.howToEarnStamp,
        rewardDetails: formData.rewardDetails,
        earnedStampMessage: formData.earnedStampMessage,
        earnedRewardMessage: formData.earnedRewardMessage
      }),
      
      // Membership card data
      ...(formData.cardType === 'membership_card' && {
        totalSessions: formData.totalSessions,
        membershipType: formData.membershipType,
        cost: formData.cost,
        durationDays: formData.durationDays,
        howToUseCard: formData.howToUseCard,
        membershipDetails: formData.membershipDetails,
        sessionUsedMessage: formData.sessionUsedMessage,
        membershipExpiredMessage: formData.membershipExpiredMessage
      })
    }
  }, [formData, allBusinesses])

  // Handle card type selection
  const handleCardTypeSelect = (cardType: 'stamp_card' | 'membership_card') => {
    setSelectedCardType(cardType)
    setFormData(prev => ({ ...prev, cardType }))
  }

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = availableTemplates.find(t => t.id === templateId)
    if (!template) return

    const businessName = formData.businessName || 'Your Business'
    const generatedContent = generateCardContent(businessName, template)
    
    setFormData(prev => ({
      ...prev,
      cardName: `${businessName} ${template.name} Card`,
      cardColor: template.designSettings.cardColor,
      iconEmoji: template.designSettings.iconEmoji,
      ...generatedContent
    }))
  }

  // Handle business selection
  const handleBusinessSelect = (businessId: string) => {
    const business = allBusinesses.find(b => b.id === businessId)
    if (!business) return

    setFormData(prev => ({
      ...prev,
      businessId,
      businessName: business.name,
      businessLogoUrl: business.logo_url
    }))
  }

  // Handle form field updates
  const updateFormField = (field: keyof UnifiedCardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Save card
  const handleSaveCard = async () => {
    if (!formData.businessId || !formData.cardName) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      const payload = {
        card_type: formData.cardType,
        business_id: formData.businessId,
        card_name: formData.cardName,
        card_color: formData.cardColor,
        icon_emoji: formData.iconEmoji,
        card_description: formData.cardDescription,
        
        ...(formData.cardType === 'stamp_card' && {
          stamps_required: formData.stampsRequired,
          reward: formData.reward,
          reward_description: formData.rewardDescription,
          how_to_earn_stamp: formData.howToEarnStamp,
          reward_details: formData.rewardDetails,
          earned_stamp_message: formData.earnedStampMessage,
          earned_reward_message: formData.earnedRewardMessage
        }),
        
        ...(formData.cardType === 'membership_card' && {
          total_sessions: formData.totalSessions,
          membership_type: formData.membershipType,
          cost: formData.cost,
          duration_days: formData.durationDays,
          how_to_use_card: formData.howToUseCard,
          membership_details: formData.membershipDetails,
          session_used_message: formData.sessionUsedMessage,
          membership_expired_message: formData.membershipExpiredMessage
        })
      }

      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create card')
      }

      const result = await response.json()
      toast.success('Card created successfully!')
      router.push('/admin/cards')
      
    } catch (error) {
      console.error('Error creating card:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create card')
    } finally {
      setIsCreating(false)
    }
  }

  // Step 1: Card Type Selection
  if (!selectedCardType) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center space-x-4 mb-8">
                <ModernButton
                  variant="ghost"
                  onClick={() => router.push('/admin/cards')}
                  className="text-gray-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cards
                </ModernButton>
              </div>

              <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Create New Card</h1>
                <p className="text-gray-600 text-lg">Choose the type of card you want to create</p>
              </div>

              {/* Card Type Selection */}
              <div className="grid md:grid-cols-2 gap-8">
                {CARD_TYPES.map((cardType) => (
                  <motion.div
                    key={cardType.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300"
                      onClick={() => handleCardTypeSelect(cardType.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="text-4xl">{cardType.icon}</div>
                          <div>
                            <CardTitle className="text-xl">{cardType.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-2">
                              <Timer className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{cardType.completionTime}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">{cardType.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Perfect for:</h4>
                            <div className="flex flex-wrap gap-2">
                              {cardType.examples.map((example, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                            <ul className="space-y-1">
                              {cardType.features.map((feature, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-center">
                                  <Sparkles className="w-3 h-3 mr-2 text-blue-500" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  // Main creation interface with side-by-side layout
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <ModernButton
                variant="ghost"
                onClick={() => setSelectedCardType(null)}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to card types
              </ModernButton>
              <div className="flex items-center space-x-2">
                <div className="text-2xl">
                  {CARD_TYPES.find(t => t.id === selectedCardType)?.icon}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create {CARD_TYPES.find(t => t.id === selectedCardType)?.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Quick Mode</span>
                <Switch
                  checked={isAdvancedMode}
                  onCheckedChange={setIsAdvancedMode}
                />
                <span className="text-sm font-medium">Advanced</span>
                <Settings className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Main Layout - Side by Side */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Card Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Business Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Business *
                    </label>
                    <select
                      value={formData.businessId}
                      onChange={(e) => handleBusinessSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a business</option>
                      {allBusinesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template Selection */}
                  {!isAdvancedMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Choose Template
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {availableTemplates.map((template) => (
                          <div
                            key={template.id}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedTemplate === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleTemplateSelect(template.id)}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{template.designSettings.iconEmoji}</span>
                              <span className="font-medium text-sm">{template.name}</span>
                            </div>
                            <p className="text-xs text-gray-600">{template.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Card Name *
                    </label>
                    <input
                      type="text"
                      value={formData.cardName}
                      onChange={(e) => updateFormField('cardName', e.target.value)}
                      placeholder="e.g., Coffee Loyalty Card"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Card Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Card Color
                    </label>
                    <div className="flex space-x-2">
                      {Object.values(CARD_COLORS.primary).map((color) => (
                        <button
                          key={color}
                          onClick={() => updateFormField('cardColor', color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.cardColor === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Type-specific fields */}
                  {selectedCardType === 'stamp_card' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Reward *
                        </label>
                        <input
                          type="text"
                          value={formData.reward}
                          onChange={(e) => updateFormField('reward', e.target.value)}
                          placeholder="e.g., Free Coffee"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Stamps Required
                        </label>
                        <input
                          type="number"
                          value={formData.stampsRequired}
                          onChange={(e) => updateFormField('stampsRequired', parseInt(e.target.value))}
                          min={1}
                          max={20}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {selectedCardType === 'membership_card' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Membership Type
                        </label>
                        <select
                          value={formData.membershipType}
                          onChange={(e) => updateFormField('membershipType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="gym">Gym</option>
                          <option value="club">Club</option>
                          <option value="spa">Spa</option>
                          <option value="coworking">Coworking</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Total Sessions
                          </label>
                          <input
                            type="number"
                            value={formData.totalSessions}
                            onChange={(e) => updateFormField('totalSessions', parseInt(e.target.value))}
                            min={1}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Duration (Days)
                          </label>
                          <input
                            type="number"
                            value={formData.durationDays}
                            onChange={(e) => updateFormField('durationDays', parseInt(e.target.value))}
                            min={1}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Advanced Mode Fields */}
                  {isAdvancedMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 border-t pt-4"
                    >
                      <h4 className="font-medium text-gray-900">Advanced Settings</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Card Description
                        </label>
                        <textarea
                          value={formData.cardDescription}
                          onChange={(e) => updateFormField('cardDescription', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {/* Add more advanced fields here */}
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <ModernButton
                onClick={handleSaveCard}
                disabled={isCreating || !formData.businessId || !formData.cardName}
                className="w-full"
                loading={isCreating}
              >
                <Save className="w-4 h-4 mr-2" />
                Create Card
              </ModernButton>
            </div>

            {/* Right Panel - Live Preview */}
            <div>
              <ErrorBoundary>
                <CardLivePreview
                  cardData={getPreviewData()}
                  sticky={true}
                  defaultPlatform="apple"
                  onDimensionWarning={(warnings) => {
                    if (warnings.length > 0) {
                      console.log('Dimension warnings:', warnings)
                    }
                  }}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}