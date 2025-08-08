'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModernButton, LoadingButton } from '@/components/modern/ui/ModernButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import CardLivePreview, { type CardLivePreviewData } from '@/components/unified/CardLivePreview'
import { 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  Sparkles,
  Eye,
  Save,
  Settings
} from 'lucide-react'
import { SMART_TEMPLATES, generateCardContent, type SmartTemplate, getStampCardTemplates } from '@/lib/smart-templates'
import { designTokens } from '@/lib/design-tokens'

interface Business {
  id: string
  name: string
  contact_email: string
  description?: string
  logo_url?: string
}

interface QuickCardData {
  // Only 5 essential fields
  businessId: string
  businessName: string
  businessLogoUrl?: string
  templateId: string
  cardName: string
  reward: string
  stampsRequired: number
}

interface ValidationError {
  field: string
  message: string
}

const STEPS = [
  {
    id: 'template',
    title: 'Choose Template',
    description: 'Select your business type',
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    id: 'basics',
    title: 'Basic Details',
    description: 'Name, business & reward',
    icon: <Settings className="w-4 h-4" />
  },
  {
    id: 'preview',
    title: 'Review & Create',
    description: 'Preview and save',
    icon: <Eye className="w-4 h-4" />
  }
]

interface QuickStartCardWizardProps {
  businesses: Business[]
  onSwitchToAdvanced: () => void
  onCardCreated: () => void
  preSelectedBusinessId?: string
}

export function QuickStartCardWizard({
  businesses,
  onSwitchToAdvanced,
  onCardCreated,
  preSelectedBusinessId
}: QuickStartCardWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  
  const [quickData, setQuickData] = useState<QuickCardData>({
    businessId: preSelectedBusinessId || '',
    businessName: '',
    businessLogoUrl: '',
    templateId: '',
    cardName: '',
    reward: '',
    stampsRequired: 10
  })

  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate | null>(null)

  // Auto-populate business info when business is selected
  useEffect(() => {
    if (quickData.businessId) {
      const business = businesses.find(b => b.id === quickData.businessId)
      if (business) {
        setQuickData(prev => ({
          ...prev,
          businessName: business.name,
          businessLogoUrl: business.logo_url || ''
        }))
      }
    }
  }, [quickData.businessId, businesses])

  // Auto-populate template data when template is selected
  useEffect(() => {
    if (quickData.templateId) {
      const template = getStampCardTemplates().find(t => t.id === quickData.templateId)
      if (template) {
        setSelectedTemplate(template)
        setQuickData(prev => ({
          ...prev,
          stampsRequired: template.defaultStampsRequired || 10,
          reward: prev.reward || template.smartRewardSuggestions?.[0] || 'Free reward',
          cardName: prev.cardName || `${prev.businessName} ${template.name} Card`
        }))
      }
    }
  }, [quickData.templateId, quickData.businessName])

  // Validation
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: ValidationError[] = []
    
    switch (step) {
      case 0: // Template
        if (!quickData.templateId) {
          newErrors.push({ field: 'templateId', message: 'Please select a template' })
        }
        break
      
      case 1: // Basics
        if (!quickData.cardName.trim()) {
          newErrors.push({ field: 'cardName', message: 'Card name is required' })
        }
        if (!quickData.businessId) {
          newErrors.push({ field: 'businessId', message: 'Please select a business' })
        }
        if (!quickData.reward.trim()) {
          newErrors.push({ field: 'reward', message: 'Reward is required' })
        }
        if (quickData.stampsRequired < 1 || quickData.stampsRequired > 20) {
          newErrors.push({ field: 'stampsRequired', message: 'Stamps required must be between 1 and 20' })
        }
        break
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }, [quickData])

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const getError = useCallback((field: string) => {
    return errors.find(err => err.field === field)?.message
  }, [errors])

  // Generate preview card data for new unified component
  const getPreviewData = useCallback((): CardLivePreviewData | null => {
    if (!selectedTemplate || !quickData.businessName) return null

    const generatedContent = generateCardContent(
      quickData.businessName,
      selectedTemplate,
      quickData.reward
    )

    return {
      cardType: 'stamp',
      businessId: quickData.businessId,
      businessName: quickData.businessName,
      businessLogoUrl: undefined,
      cardName: quickData.cardName,
      cardColor: generatedContent.cardColor,
      iconEmoji: generatedContent.iconEmoji,
      cardDescription: generatedContent.cardDescription,
      stampsRequired: quickData.stampsRequired,
      reward: quickData.reward,
      rewardDescription: quickData.reward,
      howToEarnStamp: generatedContent.howToEarnStamp,
      rewardDetails: generatedContent.rewardDetails,
      earnedStampMessage: generatedContent.earnedStampMessage,
      earnedRewardMessage: generatedContent.earnedRewardMessage
    }
  }, [selectedTemplate, quickData])

  // Save card
  const saveCard = useCallback(async () => {
    if (!validateStep(1) || !selectedTemplate) return
    
    setSaving(true)
    setErrors([])
    
    try {
      const generatedContent = generateCardContent(
        quickData.businessName,
        selectedTemplate,
        quickData.reward
      )

      const payload = {
        card_name: quickData.cardName,
        business_id: quickData.businessId,
        reward: quickData.reward,
        reward_description: quickData.reward,
        stamps_required: quickData.stampsRequired,
        card_color: generatedContent.cardColor,
        icon_emoji: generatedContent.iconEmoji,
        barcode_type: 'QR_CODE',
        card_expiry_days: 60,
        reward_expiry_days: 15,
        stamp_config: generatedContent.stampConfig,
        card_description: generatedContent.cardDescription,
        how_to_earn_stamp: generatedContent.howToEarnStamp,
        reward_details: generatedContent.rewardDetails,
        earned_stamp_message: generatedContent.earnedStampMessage,
        earned_reward_message: generatedContent.earnedRewardMessage
      }

      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        onCardCreated()
        router.push('/admin/cards?created=true&mode=quick')
      } else {
        throw new Error(result.error || 'Failed to create card')
      }
    } catch (error) {
      console.error('Failed to save card:', error)
      setErrors([{ field: 'save', message: error instanceof Error ? error.message : 'Failed to save card' }])
    } finally {
      setSaving(false)
    }
  }, [quickData, selectedTemplate, validateStep, router, onCardCreated])

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Template Selection
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Choose Your Business Type</h3>
              <p className="text-gray-600 text-sm">We'll automatically configure everything for you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getStampCardTemplates().map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setQuickData(prev => ({ ...prev, templateId: template.id }))}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${quickData.templateId === template.id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">{template.designSettings.iconEmoji}</div>
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: template.designSettings.cardColor }}
                    />
                  </div>
                  <h4 className="font-semibold text-base mb-1">{template.name}</h4>
                  <p className="text-gray-600 text-xs mb-3">{template.description}</p>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>• {template.smartRewardSuggestions?.[0] || 'Free reward'}</div>
                    <div>• {template.defaultStampsRequired || 10} stamps recommended</div>
                    <div>• Min spend: ₹{template.recommendedStampConfig?.minSpendAmount || 0}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {getError('templateId') && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {getError('templateId')}
              </p>
            )}
          </div>
        )

      case 1: // Basic Details
        return (
          <div className="space-y-6">
            {selectedTemplate && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{selectedTemplate.designSettings.iconEmoji}</span>
                  <div>
                    <h4 className="font-semibold text-blue-900">{selectedTemplate.name} Template</h4>
                    <p className="text-blue-700 text-sm">Auto-configured for your business type</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessId" className="text-sm font-medium">Business *</Label>
                <Select
                  value={quickData.businessId}
                  onValueChange={(value) => setQuickData(prev => ({ ...prev, businessId: value }))}
                >
                  <SelectTrigger className={getError('businessId') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        <div className="flex items-center gap-2">
                          {business.logo_url && (
                            <div className="w-4 h-4 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                              <img 
                                src={business.logo_url} 
                                alt="" 
                                className="w-3 h-3 object-contain"
                              />
                            </div>
                          )}
                          <span>{business.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getError('businessId') && <p className="text-sm text-red-500 mt-1">{getError('businessId')}</p>}
              </div>

              <div>
                <Label htmlFor="cardName" className="text-sm font-medium">Card Name *</Label>
                <Input
                  id="cardName"
                  value={quickData.cardName}
                  onChange={(e) => setQuickData(prev => ({ ...prev, cardName: e.target.value }))}
                  placeholder="e.g. Coffee Lovers Card"
                  className={getError('cardName') ? 'border-red-500' : ''}
                />
                {getError('cardName') && <p className="text-sm text-red-500 mt-1">{getError('cardName')}</p>}
              </div>

              <div>
                <Label htmlFor="reward" className="text-sm font-medium">Reward *</Label>
                {selectedTemplate && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Popular rewards for {selectedTemplate.name}:</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedTemplate.smartRewardSuggestions || []).slice(0, 3).map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50 text-xs"
                          onClick={() => setQuickData(prev => ({ ...prev, reward: suggestion }))}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Input
                  id="reward"
                  value={quickData.reward}
                  onChange={(e) => setQuickData(prev => ({ ...prev, reward: e.target.value }))}
                  placeholder="e.g. Free Coffee"
                  className={getError('reward') ? 'border-red-500' : ''}
                />
                {getError('reward') && <p className="text-sm text-red-500 mt-1">{getError('reward')}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium">Stamps Required: {quickData.stampsRequired}</Label>
                <Slider
                  value={[quickData.stampsRequired]}
                  onValueChange={([value]) => setQuickData(prev => ({ ...prev, stampsRequired: value }))}
                  min={1}
                  max={20}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 stamp</span>
                  <span>20 stamps</span>
                </div>
                {getError('stampsRequired') && <p className="text-sm text-red-500 mt-1">{getError('stampsRequired')}</p>}
              </div>
            </div>
          </div>
        )

      case 2: // Preview & Save
        const previewData = getPreviewData()
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Your Card Preview</h3>
              <p className="text-gray-600 text-sm">Everything looks good? Let's create your card!</p>
            </div>

            {previewData && (
              <CardLivePreview
                cardData={previewData}
                showControls={false}
                defaultPlatform="apple"
                sticky={false}
              />
            )}

            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Card Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Template:</span>
                  <span className="font-medium">{selectedTemplate?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Business:</span>
                  <span className="font-medium">{quickData.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Card Name:</span>
                  <span className="font-medium">{quickData.cardName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reward:</span>
                  <span className="font-medium">{quickData.reward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stamps Required:</span>
                  <span className="font-medium">{quickData.stampsRequired}</span>
                </div>
              </CardContent>
            </Card>

            <LoadingButton 
              onClick={saveCard} 
              loading={saving}
              loadingText="Creating Card..."
              className="w-full"
              size="lg"
              variant="gradient"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Quick Card
            </LoadingButton>
            
            {getError('save') && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">{getError('save')}</p>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Quick Start</h2>
        </div>
        <p className="text-gray-600">Create your card in under 2 minutes</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center relative z-10">
              <motion.div 
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${index <= currentStep 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg' 
                    : 'border-gray-300 text-gray-400 bg-white'
                  }
                `}
                whileHover={{ scale: index <= currentStep ? 1.05 : 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {index < currentStep ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {step.icon}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {index < STEPS.length - 1 && (
                <div className="relative">
                  <div className="w-16 h-0.5 mx-3 bg-gray-200 rounded-full" />
                  <motion.div 
                    className="absolute top-0 left-3 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: index < currentStep ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3">
          {STEPS.map((step, index) => (
            <div key={step.id} className="text-center flex-1 max-w-[100px]">
              <p className={`text-xs font-semibold transition-colors duration-200 ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            {STEPS[currentStep].icon}
            <span>{STEPS[currentStep].title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <div className="flex gap-3">
              <ModernButton 
                variant="outline"
                onClick={prevStep} 
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </ModernButton>
              
              <ModernButton 
                variant="ghost"
                onClick={onSwitchToAdvanced}
                className="text-gray-600 hover:text-gray-800"
              >
                Need more control?
              </ModernButton>
            </div>
            
            {currentStep < STEPS.length - 1 && (
              <ModernButton 
                onClick={nextStep} 
                variant="gradient"
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </ModernButton>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}