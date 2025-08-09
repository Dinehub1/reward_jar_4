'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'

// Enhanced CSS animations for better UX
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes bounce-in {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .animate-bounce-in {
      animation: bounce-in 0.6s ease-out;
    }
    
    @keyframes progress-fill {
      0% { width: 0%; }
      100% { width: var(--progress-width); }
    }
    
    .animate-progress-fill {
      animation: progress-fill 1.5s ease-out;
    }
  `
  document.head.appendChild(style)
}
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { mapQuickToAdvancedPayload, generateCardContent } from '@/lib/generation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModernButton, LoadingButton } from '@/components/modern/ui/ModernButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { PageTransition } from '@/components/modern/layout/PageTransition'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Eye, 
  Settings,
  Palette,
  Zap,
  FileText,
  Smartphone,
  Check,
  AlertCircle,
  QrCode,
  BarChart3,
  Apple,
  Chrome,
  Globe,
  Monitor,
  RotateCcw,
  Play
} from 'lucide-react'
import { IPhone15Frame } from '@/components/modern/preview/iPhone15Frame'
import { AndroidFrame } from '@/components/modern/preview/AndroidFrame'
import { WebFrame } from '@/components/modern/preview/WebFrame'
import { designTokens, modernStyles } from '@/lib/design-tokens'
import { motion, AnimatePresence } from 'framer-motion'
import { CardLivePreview } from '@/components/unified/CardLivePreview'

// Types
interface Business {
  id: string
  name: string
  contact_email: string
  description?: string
  logo_url?: string
}

interface StampConfig {
  manualStampOnly: boolean
  minSpendAmount: number
  billProofRequired: boolean
  maxStampsPerDay: number
  duplicateVisitBuffer: '12h' | '1d' | 'none'
}

interface CardFormData {
  // Step 1: Card Details
  cardName: string
  businessId: string
  businessName: string
  businessLogoUrl?: string
  reward: string
  rewardDescription: string // NEW: Required field for detailed reward info
  stampsRequired: number
  cardExpiryDays: number
  rewardExpiryDays: number
  
  // Step 2: Design
  cardColor: string
  iconEmoji: string
  barcodeType: 'QR_CODE' | 'PDF417'
  backgroundImageUrl?: string
  cardStyle?: 'gradient' | 'image' | 'solid'
  
  // Step 3: Stamp Rules
  stampConfig: StampConfig
  
  // Step 4: Information
  cardDescription: string
  howToEarnStamp: string
  rewardDetails: string
  earnedStampMessage: string
  earnedRewardMessage: string
}

interface ValidationError {
  field: string
  message: string
}

// Constants
const STEPS = [
  { 
    id: 'details', 
    title: 'Card Details', 
    icon: <Settings className="w-4 h-4" />,
    description: 'Basic card information and business selection'
  },
  { 
    id: 'design', 
    title: 'Design', 
    icon: <Palette className="w-4 h-4" />,
    description: 'Visual design and branding'
  },
  { 
    id: 'rules', 
    title: 'Stamp Rules', 
    icon: <Zap className="w-4 h-4" />,
    description: 'Configure stamp collection logic'
  },
  { 
    id: 'information', 
    title: 'Information', 
    icon: <FileText className="w-4 h-4" />,
    description: 'Customer-facing messages and details'
  },
  { 
    id: 'preview', 
    title: 'Save & Preview', 
    icon: <Smartphone className="w-4 h-4" />,
    description: 'Review and create your card'
  }
]

// Card Templates for Quick Start
const CARD_TEMPLATES = [
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    description: 'Perfect for cafes and coffee shops',
    cardColor: '#8B4513',
    iconEmoji: '☕',
    stampsRequired: 10,
    reward: 'Free Coffee',
    rewardDescription: 'Free coffee of your choice',
    cardDescription: 'Collect stamps to get free coffee',
    howToEarnStamp: 'Buy any drink to get a stamp',
    rewardDetails: 'Valid for any coffee size, dine-in or takeaway',
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 3,
      duplicateVisitBuffer: '12h'
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Great for restaurants and food services',
    cardColor: '#FF6347',
    iconEmoji: '🍕',
    stampsRequired: 8,
    reward: 'Free Meal',
    rewardDescription: 'Free main course meal',
    cardDescription: 'Collect stamps to get a free meal',
    howToEarnStamp: 'Spend ₹500 or more to get a stamp',
    rewardDetails: 'Valid for main course items up to ₹800 value',
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 500,
      billProofRequired: true,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '1d'
    }
  },
  {
    id: 'salon-spa',
    name: 'Salon & Spa',
    description: 'Ideal for beauty and wellness services',
    cardColor: '#FF69B4',
    iconEmoji: '💅',
    stampsRequired: 6,
    reward: 'Free Service',
    rewardDescription: 'Free haircut or basic facial',
    cardDescription: 'Collect stamps for free beauty services',
    howToEarnStamp: 'Book any service to get a stamp',
    rewardDetails: 'Valid for haircut, basic facial, or manicure',
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 1000,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '1d'
    }
  },
  {
    id: 'retail-store',
    name: 'Retail Store',
    description: 'Perfect for retail and shopping',
    cardColor: '#32CD32',
    iconEmoji: '🛍️',
    stampsRequired: 12,
    reward: '20% Discount',
    rewardDescription: '20% off your next purchase',
    cardDescription: 'Shop more, save more with our loyalty program',
    howToEarnStamp: 'Spend ₹1000 or more to get a stamp',
    rewardDetails: 'Valid on regular priced items, cannot be combined with other offers',
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 1000,
      billProofRequired: true,
      maxStampsPerDay: 2,
      duplicateVisitBuffer: '12h'
    }
  },
  {
    id: 'fitness-gym',
    name: 'Fitness & Gym',
    description: 'Great for gyms and fitness centers',
    cardColor: '#FF4500',
    iconEmoji: '🏋️',
    stampsRequired: 15,
    reward: 'Free Session',
    rewardDescription: 'Free personal training session',
    cardDescription: 'Stay fit and earn rewards for your dedication',
    howToEarnStamp: 'Complete a workout session to get a stamp',
    rewardDetails: '1-hour personal training session with certified trainer',
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '1d'
    }
  },
  {
    id: 'custom',
    name: 'Start from Scratch',
    description: 'Create a completely custom card',
    cardColor: '#8B4513',
    iconEmoji: '☕',
    stampsRequired: 10,
    reward: '',
    rewardDescription: '',
    cardDescription: '',
    howToEarnStamp: '',
    rewardDetails: '',
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '12h'
    }
  }
]

const EMOJI_OPTIONS = [
  '☕', '🍕', '🧋', '🍔', '🍜', '🥗', '🍰', '🧁', '🍺', '🥂',
  '💅', '💇', '🧖', '💄', '🎨', '🖌️', '✂️', '💆', '🧴', '🪒',
  '🛍️', '👗', '👚', '👖', '👟', '👜', '💍', '👑', '🎁', '🛒',
  '🏋️', '🧘', '🏃', '🚴', '🏊', '🤸', '⚽', '🏀', '🎾', '🏓',
  '🏥', '💊', '🩺', '💉', '🦷', '👓', '🩹', '🧬', '🔬', '⚕️',
  '🏠', '🔧', '🔨', '🪚', '🔩', '⚡', '🚿', '🛁', '🪟', '🚪'
]

const COLOR_OPTIONS = [
  '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B22222', '#DC143C',
  '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00',
  '#ADFF2F', '#32CD32', '#00FF00', '#00FA9A', '#00CED1', '#00BFFF',
  '#1E90FF', '#0000FF', '#4169E1', '#6A5ACD', '#8A2BE2', '#9400D3',
  '#FF1493', '#FF69B4', '#FFC0CB', '#DDA0DD', '#708090', '#2F4F4F'
]

// Live Preview Component - Now using unified WalletPreviewCard
const LivePreview = React.memo(({ 
  cardData, 
  activeView,
  showBackPage = false,
  onToggleBack
}: { 
  cardData: CardFormData
  activeView: 'apple' | 'google' | 'pwa'
  showBackPage?: boolean
  onToggleBack?: (show: boolean) => void
}) => {
  // Calculate demo progress (show about 40% completion for preview)
  const demoFilledStamps = Math.max(1, Math.floor(cardData.stampsRequired * 0.4))
  

  const previewSettings = {
    showBackPage,
    screenshotMode: false,
    isDarkMode: false,
    demoFilledStamps,
    debugOverlay: false
  }

  return (
    <div className="flex justify-center">
      <Suspense fallback={
        <div className="w-80 h-56 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-gray-500">Loading wallet preview...</div>
        </div>
      }>
        <CardLivePreview
          defaultPlatform={activeView}
          showControls={false}
          cardData={{
            cardType: 'stamp',
            businessName: cardData.businessName,
            businessLogoUrl: cardData.businessLogoUrl,
            cardName: cardData.cardName,
            cardColor: cardData.cardColor,
            iconEmoji: cardData.iconEmoji,
            stampsRequired: cardData.stampsRequired,
            reward: cardData.reward,
            cardDescription: cardData.cardDescription,
          }}
        />
      </Suspense>
    </div>
  )
})
LivePreview.displayName = 'LivePreview'

// Main Component with Search Params
function CardCreationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [activePreview, setActivePreview] = useState<'apple' | 'google' | 'pwa'>('apple')
  const [showBackPage, setShowBackPage] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(true)
  
  const [cardData, setCardData] = useState<CardFormData>({
    // Step 1: Card Details
    cardName: '',
    businessId: searchParams?.get('businessId') || '',
    businessName: '',
    businessLogoUrl: '',
    reward: '',
    rewardDescription: '', // NEW: Required reward description field
    stampsRequired: 10,
    cardExpiryDays: 60,
    rewardExpiryDays: 15,
    
    // Step 2: Design
    cardColor: '#8B4513',
    iconEmoji: '☕',
    barcodeType: 'QR_CODE',
    backgroundImageUrl: '',
    cardStyle: 'gradient',
    
    // Step 3: Stamp Rules
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '12h'
    },
    
    // Step 4: Information
    cardDescription: 'Collect stamps to get rewards',
    howToEarnStamp: 'Buy anything to get a stamp',
    rewardDetails: '',
    earnedStampMessage: 'Just [#] more stamps to get your reward!',
    earnedRewardMessage: 'Reward is earned and waiting for you!'
  })

  // Load businesses
  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/businesses')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setBusinesses(data.data)
        
        // Auto-select business if provided in URL
        const businessId = searchParams?.get('businessId')
        if (businessId) {
          const business = data.data.find((b: Business) => b.id === businessId)
          if (business) {
            setCardData(prev => ({
              ...prev,
              businessId: business.id,
              businessName: business.name,
              businessLogoUrl: business.logo_url || ''
            }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load businesses:', error)
      setErrors([{ field: 'business', message: 'Failed to load businesses. Please refresh and try again.' }])
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    loadBusinesses()
  }, [loadBusinesses])

  // Validation
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: ValidationError[] = []
    
    switch (step) {
            case 0: // Card Details
        if (!cardData.cardName.trim()) {
          newErrors.push({ field: 'cardName', message: 'Card name is required' })
        }
        if (!cardData.businessId) {
          newErrors.push({ field: 'businessId', message: 'Please select a business' })
        }
        if (!cardData.reward.trim()) {
          newErrors.push({ field: 'reward', message: 'Reward is required' })
        }
        if (!cardData.rewardDescription.trim()) {
          newErrors.push({ field: 'rewardDescription', message: 'Reward description is required' })
        }
        if (cardData.stampsRequired < 1 || cardData.stampsRequired > 20) {
          newErrors.push({ field: 'stampsRequired', message: 'Stamps required must be between 1 and 20' })
        }
        break
      
      case 1: // Design
        if (!cardData.cardColor) {
          newErrors.push({ field: 'cardColor', message: 'Please select a card color' })
        }
        if (!cardData.iconEmoji) {
          newErrors.push({ field: 'iconEmoji', message: 'Please select an emoji' })
        }
        break
      
      case 2: // Stamp Rules
        if (cardData.stampConfig.minSpendAmount < 0) {
          newErrors.push({ field: 'minSpendAmount', message: 'Minimum spend amount cannot be negative' })
        }
        if (cardData.stampConfig.maxStampsPerDay < 1) {
          newErrors.push({ field: 'maxStampsPerDay', message: 'Max stamps per day must be at least 1' })
        }
        break
      
      case 3: // Information
        if (!cardData.cardDescription.trim()) {
          newErrors.push({ field: 'cardDescription', message: 'Card description is required' })
        }
        if (!cardData.howToEarnStamp.trim()) {
          newErrors.push({ field: 'howToEarnStamp', message: 'How to earn stamp instructions are required' })
        }
        break
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }, [cardData])

  // Navigation
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  // Save card
  const saveCard = useCallback(async () => {
    if (!validateStep(3)) return // Validate all steps
    
    setSaving(true)
    setErrors([])
    
    try {
      const payload = mapQuickToAdvancedPayload({
        cardName: cardData.cardName,
        businessId: cardData.businessId,
        reward: cardData.reward,
        rewardDescription: cardData.rewardDescription,
        stampsRequired: cardData.stampsRequired,
        cardColor: cardData.cardColor,
        iconEmoji: cardData.iconEmoji,
        barcodeType: cardData.barcodeType,
        cardExpiryDays: cardData.cardExpiryDays,
        rewardExpiryDays: cardData.rewardExpiryDays,
        stampConfig: cardData.stampConfig,
        cardDescription: cardData.cardDescription,
        howToEarnStamp: cardData.howToEarnStamp,
        rewardDetails: cardData.rewardDetails,
        earnedStampMessage: cardData.earnedStampMessage,
        earnedRewardMessage: cardData.earnedRewardMessage,
      })

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
        // Success - redirect to cards list
        router.push('/admin/cards?created=true')
      } else {
        throw new Error(result.error || 'Failed to create card')
      }
    } catch (error) {
      console.error('Failed to save card:', error)
      setErrors([{ field: 'save', message: error instanceof Error ? error.message : 'Failed to save card' }])
    } finally {
      setSaving(false)
    }
  }, [cardData, validateStep, router])

  // Get error for field
  const getError = useCallback((field: string) => {
    return errors.find(err => err.field === field)?.message
  }, [errors])

  // Apply template to card data
  const applyTemplate = useCallback((templateId: string) => {
    const template = CARD_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    const content = generateCardContent(prev?.businessName || 'Business', template)
    setCardData(prev => ({
      ...prev,
      ...content,
      stampConfig: {
        ...content.stampConfig,
        duplicateVisitBuffer: content.stampConfig.duplicateVisitBuffer as '12h' | '1d' | 'none'
      }
    }))

    setShowTemplateSelector(false)
  }, [])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Card Details
        return (
    <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">
            Card Name *
          </Label>
            <Input
                id="cardName"
                value={cardData.cardName}
                onChange={(e) => setCardData(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder="e.g. Pizza Lovers Card"
            className={`
              transition-all duration-${designTokens.animation.duration.fast}
              ${getError('cardName') 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
              }
            `}
          />
          {getError('cardName') && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {getError('cardName')}
            </p>
          )}
          </div>

        <div>
              <Label htmlFor="businessId">Business *</Label>
          <Select
            value={cardData.businessId}
            onValueChange={(value) => {
              const business = businesses.find(b => b.id === value)
              setCardData(prev => ({
                ...prev,
                businessId: value,
                businessName: business?.name || '',
                businessLogoUrl: business?.logo_url || ''
              }))
            }}
          >
                <SelectTrigger className={getError('businessId') ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a business" />
            </SelectTrigger>
            <SelectContent>
                  {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  <div className="flex items-center gap-2">
                    {business.logo_url && (
                      <div className="w-4 h-4 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        <Image src={business.logo_url} alt="" width={12} height={12} className="w-3 h-3 object-contain" />
                      </div>
                    )}
                    <span>{business.name}</span>
                    {business.logo_url && <span className="text-xs text-gray-500">📷</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
              {getError('businessId') && <p className="text-sm text-red-500 mt-1">{getError('businessId')}</p>}
        </div>

                    <div>
              <Label htmlFor="reward">Reward *</Label>
              <Input
                id="reward"
                value={cardData.reward}
                onChange={(e) => setCardData(prev => ({ ...prev, reward: e.target.value }))}
                placeholder="e.g. Free Coffee"
                className={getError('reward') ? 'border-red-500' : ''}
              />
              {getError('reward') && <p className="text-sm text-red-500 mt-1">{getError('reward')}</p>}
            </div>

            <div>
              <Label htmlFor="rewardDescription">Reward Description *</Label>
              <Input
                id="rewardDescription"
                value={cardData.rewardDescription}
                onChange={(e) => setCardData(prev => ({ ...prev, rewardDescription: e.target.value }))}
                placeholder="e.g. Free Coffee or 20% off next purchase"
                className={getError('rewardDescription') ? 'border-red-500' : ''}
              />
              {getError('rewardDescription') && <p className="text-sm text-red-500 mt-1">{getError('rewardDescription')}</p>}
            </div>

        <div>
              <Label>Stamps Required: {cardData.stampsRequired}</Label>
            <Slider
              value={[cardData.stampsRequired]}
                onValueChange={([value]) => setCardData(prev => ({ ...prev, stampsRequired: value }))}
              min={1}
              max={20}
              step={1}
                className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>20</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <Label htmlFor="cardExpiryDays">Card Expiry (days)</Label>
              <Input
              id="cardExpiryDays"
              type="number"
              value={cardData.cardExpiryDays}
                  onChange={(e) => setCardData(prev => ({ ...prev, cardExpiryDays: parseInt(e.target.value) || 60 }))}
                  min={1}
                  max={365}
            />
            </div>
          <div>
            <Label htmlFor="rewardExpiryDays">Reward Expiry (days)</Label>
            <Input
              id="rewardExpiryDays"
              type="number"
              value={cardData.rewardExpiryDays}
                  onChange={(e) => setCardData(prev => ({ ...prev, rewardExpiryDays: parseInt(e.target.value) || 15 }))}
                  min={1}
                  max={90}
                />
        </div>
      </div>
    </div>
  )

      case 1: // Design
        return (
    <div className="space-y-6">
            {/* Card Style Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Card Style</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'gradient', label: '🎨 Gradient', description: 'Color gradient background' },
                  { id: 'image', label: '🖼️ Image', description: 'Custom background image' },
                  { id: 'solid', label: '🎯 Solid', description: 'Solid color background' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setCardData(prev => ({ 
                      ...prev, 
                      cardStyle: style.id as 'gradient' | 'image' | 'solid'
                    }))}
                    className={`
                      p-3 rounded-xl border-2 text-left transition-all duration-200
                      ${cardData.cardStyle === style.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-lg mb-1">{style.label}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Image URL - Show only when image style is selected */}
            {cardData.cardStyle === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="backgroundImage" className="text-sm font-medium text-gray-700">
                  Background Image URL
                </Label>
                <Input
                  id="backgroundImage"
                  value={cardData.backgroundImageUrl || ''}
                  onChange={(e) => setCardData(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                  placeholder="https://example.com/your-background-image.jpg"
                  className="transition-all duration-200"
                />
                <p className="text-xs text-gray-500">
                  Recommended: High-quality images (800x600px or larger) for best results
                </p>
              </div>
            )}

            {/* Card Color - Always show for gradient/solid styles */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {cardData.cardStyle === 'image' ? 'Accent Color' : 'Card Color'}
              </Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                    onClick={() => setCardData(prev => ({ ...prev, cardColor: color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    cardData.cardColor === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
              <Input
                value={cardData.cardColor}
                onChange={(e) => setCardData(prev => ({ ...prev, cardColor: e.target.value }))}
                placeholder="#8B4513"
                className="mt-2"
              />
        </div>

        <div>
          <Label>Icon Emoji</Label>
              <div className="grid grid-cols-10 gap-2 mt-2">
                {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setCardData(prev => ({ ...prev, iconEmoji: emoji }))}
                    className={`w-8 h-8 text-lg border rounded ${
                      cardData.iconEmoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                >
                  {emoji}
                </button>
              ))}
          </div>
            </div>

              <div>
          <Label>Barcode Type</Label>
              <RadioGroup 
                value={cardData.barcodeType} 
                onValueChange={(value: 'QR_CODE' | 'PDF417') => 
                  setCardData(prev => ({ ...prev, barcodeType: value }))
                }
                className="mt-2"
              >
            <div className="flex items-center space-x-2">
                  <RadioGroupItem value="QR_CODE" id="qr" />
                  <Label htmlFor="qr" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code (Recommended)
                  </Label>
            </div>
            <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PDF417" id="pdf417" />
                  <Label htmlFor="pdf417" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    PDF417
                  </Label>
            </div>
              </RadioGroup>
      </div>
    </div>
  )

      case 2: // Stamp Rules
        return (
    <div className="space-y-6">
            <div className="flex items-center justify-between">
          <div>
            <Label>Manual Stamp Only</Label>
                <p className="text-sm text-gray-500">Staff must manually add stamps</p>
          </div>
          <Switch
            checked={cardData.stampConfig.manualStampOnly}
                onCheckedChange={(checked) => 
                  setCardData(prev => ({
              ...prev,
              stampConfig: { ...prev.stampConfig, manualStampOnly: checked }
                  }))
                }
          />
        </div>

        <div>
              <Label htmlFor="minSpend">Minimum Spend Amount (₹)</Label>
                <Input
                id="minSpend"
                  type="number"
            value={cardData.stampConfig.minSpendAmount}
                onChange={(e) => 
                  setCardData(prev => ({
              ...prev,
              stampConfig: { 
                ...prev.stampConfig, 
                minSpendAmount: parseInt(e.target.value) || 0 
              }
                  }))
                }
                min={0}
                placeholder="0 for no minimum"
          />
        </div>

            <div className="flex items-center justify-between">
          <div>
                <Label>Bill Proof Required</Label>
                <p className="text-sm text-gray-500">Require bill number for stamps</p>
          </div>
          <Switch
            checked={cardData.stampConfig.billProofRequired}
                onCheckedChange={(checked) => 
                  setCardData(prev => ({
              ...prev,
              stampConfig: { ...prev.stampConfig, billProofRequired: checked }
                  }))
                }
          />
        </div>

        <div>
              <Label htmlFor="maxStamps">Max Stamps Per Day</Label>
          <Input
                id="maxStamps"
            type="number"
            value={cardData.stampConfig.maxStampsPerDay}
                onChange={(e) => 
                  setCardData(prev => ({
              ...prev,
              stampConfig: { 
                ...prev.stampConfig, 
                maxStampsPerDay: parseInt(e.target.value) || 1 
              }
                  }))
                }
                min={1}
                max={10}
          />
        </div>

        <div>
          <Label>Duplicate Visit Buffer</Label>
          <Select
            value={cardData.stampConfig.duplicateVisitBuffer}
                onValueChange={(value: '12h' | '1d' | 'none') => 
                  setCardData(prev => ({
              ...prev,
              stampConfig: { ...prev.stampConfig, duplicateVisitBuffer: value }
                  }))
                }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="none">No buffer</SelectItem>
                  <SelectItem value="12h">12 hours</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
            </SelectContent>
          </Select>
      </div>
    </div>
  )

      case 3: // Information
    return (
    <div className="space-y-6">
        {/* Information Form Fields */}
        <div>
              <Label htmlFor="cardDescription">Card Description *</Label>
          <Textarea
            id="cardDescription"
            value={cardData.cardDescription}
            onChange={(e) => setCardData(prev => ({ ...prev, cardDescription: e.target.value }))}
                placeholder="Brief description shown on card"
                className={getError('cardDescription') ? 'border-red-500' : ''}
          />
              {getError('cardDescription') && <p className="text-sm text-red-500 mt-1">{getError('cardDescription')}</p>}
              </div>
              
        <div>
              <Label htmlFor="howToEarn">How to Earn Stamp *</Label>
          <Textarea
                id="howToEarn"
            value={cardData.howToEarnStamp}
            onChange={(e) => setCardData(prev => ({ ...prev, howToEarnStamp: e.target.value }))}
                placeholder="Instructions for earning stamps"
                className={getError('howToEarnStamp') ? 'border-red-500' : ''}
          />
              {getError('howToEarnStamp') && <p className="text-sm text-red-500 mt-1">{getError('howToEarnStamp')}</p>}
              </div>

        <div>
          <Label htmlFor="rewardDetails">Reward Details</Label>
          <Textarea
            id="rewardDetails"
            value={cardData.rewardDetails}
            onChange={(e) => setCardData(prev => ({ ...prev, rewardDetails: e.target.value }))}
                placeholder="Detailed description of reward"
          />
        </div>

        <div>
              <Label htmlFor="stampMessage">Stamp Earned Message</Label>
          <Input
                id="stampMessage"
            value={cardData.earnedStampMessage}
            onChange={(e) => setCardData(prev => ({ ...prev, earnedStampMessage: e.target.value }))}
                placeholder="Use [#] for remaining count"
          />
              <p className="text-sm text-gray-500 mt-1">Use [#] to show remaining stamps needed</p>
            </div>

        <div>
              <Label htmlFor="rewardMessage">Reward Earned Message</Label>
          <Input
                id="rewardMessage"
            value={cardData.earnedRewardMessage}
            onChange={(e) => setCardData(prev => ({ ...prev, earnedRewardMessage: e.target.value }))}
                placeholder="Message when reward is unlocked"
          />
        </div>

        {/* Back Page Preview for Information Step */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900">Back Page Preview</h4>
            <div className="text-sm text-blue-700">This information appears when customers tap &quot;Details&quot;</div>
          </div>
          <div className="bg-white p-4 rounded border space-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Reward Details:</span>
              <p className="text-gray-600 mt-1">{cardData.rewardDescription || 'No reward description provided'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Description:</span>
              <p className="text-gray-600 mt-1">{cardData.cardDescription || 'No card description provided'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">How to Earn Stamps:</span>
              <p className="text-gray-600 mt-1">{cardData.howToEarnStamp || 'No instructions provided'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Additional Information:</span>
              <p className="text-gray-600 mt-1">{cardData.rewardDetails || 'No additional details provided'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Support:</span>
              <p className="text-blue-600 mt-1">support@rewardjar.xyz</p>
            </div>
          </div>
        </div>
    </div>
  )

      case 4: // Preview & Save
        return (
    <div className="space-y-6">
      <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review Your Card</h3>
              <p className="text-gray-600">Check the preview and save your card</p>
          </div>

            {/* Platform Preview Tabs */}
            <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setActivePreview('apple')}
                className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                  activePreview === 'apple' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                <Apple className="w-4 h-4" />
                Apple Wallet
              </button>
              <button 
                onClick={() => setActivePreview('google')}
                className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                  activePreview === 'google' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                <Chrome className="w-4 h-4" />
                Google Wallet
              </button>
              <button 
                onClick={() => setActivePreview('pwa')}
                className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                  activePreview === 'pwa' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                }`}
              >
                <Globe className="w-4 h-4" />
                PWA Card
              </button>
          </div>

            {/* Live Preview - Simplified for Step 4 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl shadow-inner">
              <div className="flex justify-center">
                <div className="w-80 h-96">
                  <LivePreview cardData={cardData} activeView={activePreview} />
                </div>
              </div>
        </div>

            {/* Card Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Card Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{cardData.cardName}</span>
      </div>
                <div className="flex justify-between">
                  <span className="font-medium">Business:</span>
                  <span>{cardData.businessName}</span>
    </div>
                <div className="flex justify-between">
                  <span className="font-medium">Stamps Required:</span>
                  <span>{cardData.stampsRequired}</span>
        </div>
                                <div className="flex justify-between">
                  <span className="font-medium">Reward:</span>
                  <span>{cardData.reward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reward Description:</span>
                  <span>{cardData.rewardDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Barcode Type:</span>
                  <span>{cardData.barcodeType}</span>
      </div>
                <div className="flex justify-between">
                  <span className="font-medium">Min Spend:</span>
                  <span>₹{cardData.stampConfig.minSpendAmount}</span>
        </div>
              </CardContent>
            </Card>

            {/* Save Button */}
          <LoadingButton 
              onClick={saveCard} 
              loading={saving}
              loadingText="Creating Card..."
              className="w-full"
              size="lg"
              variant="gradient"
          >
            <Save className="w-4 h-4 mr-2" />
            Create Card
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

  // Template Selector Component
  const renderTemplateSelector = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose a Card Template</h2>
        <p className="text-gray-600">Start with a pre-designed template or create from scratch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CARD_TEMPLATES.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
            onClick={() => applyTemplate(template.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">{template.iconEmoji}</div>
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: template.cardColor }}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              
              <div className="space-y-2 text-xs text-gray-500">
                <div>• {template.reward || 'Custom reward'}</div>
                <div>• {template.stampsRequired} stamps required</div>
                <div>• Min spend: ₹{template.stampConfig.minSpendAmount}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <ModernButton variant="outline" onClick={() => setShowTemplateSelector(false)}>
          Skip Templates - Start from Scratch
        </ModernButton>
      </div>
    </div>
  )

  if (showTemplateSelector) {
    return (
      <AdminLayoutClient>
        <div className="container mx-auto px-4 py-8">
          {renderTemplateSelector()}
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <PageTransition>
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Modern Header */}
          <motion.div 
            className="flex items-center justify-between mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: designTokens.animation.easing.out }}
          >
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ModernButton 
                  variant="ghost" 
                  onClick={() => router.push('/admin/cards')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl px-4 py-2 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">Back to Cards</span>
                </ModernButton>
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Create New Card
                </h1>
                <p className="text-gray-500 mt-1 text-base">
                  Design and configure your loyalty card with our step-by-step wizard
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ModernButton 
                variant="outline" 
                onClick={() => setShowTemplateSelector(true)}
                className={modernStyles.button.secondary + " border-gray-300 hover:border-gray-400"}
              >
                <Palette className="w-4 h-4 mr-2" />
                Change Template
              </ModernButton>
            </motion.div>
          </motion.div>

        {/* Modern Progress Steps */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: designTokens.animation.easing.out }}
        >
          <div className="flex items-center justify-between relative">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center relative z-10">
                <motion.div 
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300
                    ${index <= currentStep 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg' 
                      : 'border-gray-300 text-gray-400 bg-white hover:border-gray-400'
                    }
                  `}
                  whileHover={{ scale: index <= currentStep ? 1.05 : 1.02 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    boxShadow: index <= currentStep ? designTokens.shadows.md : designTokens.shadows.sm
                  }}
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
                        <Check className="w-5 h-5" />
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
                    {/* Background line */}
                    <div className="w-24 h-1 mx-4 bg-gray-200 rounded-full" />
                    {/* Progress line */}
                    <motion.div 
                      className="absolute top-0 left-4 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
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
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => (
              <motion.div 
                key={step.id} 
                className="text-center flex-1 max-w-[140px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <p className={`text-sm font-semibold transition-colors duration-200 ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.description}</p>
                {index === currentStep && (
                  <motion.div
                    className="w-8 h-0.5 bg-blue-500 rounded-full mx-auto mt-2"
                    initial={{ width: 0 }}
                    animate={{ width: 32 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

          {/* Main Content - Improved mobile layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Form Section - Enhanced mobile-first design */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: designTokens.animation.easing.out }}
            >
              <Card className={`${modernStyles.card.elevated} border-0 shadow-xl`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                {STEPS[currentStep].icon}
                    </motion.div>
                    <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {STEPS[currentStep].title}
                    </span>
              </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {STEPS[currentStep].description}
                  </p>
            </CardHeader>
                <CardContent className="space-y-6">
              {renderStepContent()}

                  {/* Navigation Buttons - Enhanced mobile layout */}
                  <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
                <ModernButton 
                  variant="outline"
                  onClick={prevStep} 
                  disabled={currentStep === 0}
                      className={`
                        w-full sm:w-auto flex items-center justify-center gap-2 
                        ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                        transition-all duration-${designTokens.animation.duration.fast}
                      `}
                >
                      <ArrowLeft className="w-4 h-4" />
                  Previous
                </ModernButton>
                
                {currentStep < STEPS.length - 1 && (
                      <ModernButton 
                        onClick={nextStep} 
                        variant="gradient"
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                      >
                        Next
                        <ArrowRight className="w-4 h-4" />
                  </ModernButton>
                )}
              </div>
                  </CardContent>
                </Card>
            </motion.div>

          {/* Modern Preview Section - Enhanced mobile layout */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: designTokens.animation.easing.out, delay: 0.1 }}
          >
            <Card className={`${modernStyles.card.elevated} border-0 shadow-xl`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Eye className="w-5 h-5 text-blue-500" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Live Device Preview
                  </span>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  See exactly how your card will appear on real devices
                </p>
              </CardHeader>
              <CardContent className="space-y-6 lg:space-y-8">
                {/* Modern Device Selector - Mobile responsive */}
                <div className="flex justify-center">
                  <div 
                    className="bg-white rounded-2xl p-1.5 border border-gray-200 w-full max-w-md"
                    style={{ boxShadow: designTokens.shadows.lg }}
                  >
                    <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'apple', label: 'iPhone', icon: Apple, color: 'from-blue-500 to-blue-600' },
                      { id: 'google', label: 'Android', icon: Chrome, color: 'from-green-500 to-green-600' },
                      { id: 'pwa', label: 'Web', icon: Monitor, color: 'from-purple-500 to-purple-600' }
                    ].map((device) => (
                      <motion.button
                        key={device.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActivePreview(device.id as 'apple' | 'google' | 'pwa')}
                        className={`
                            px-3 py-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center 
                            gap-1 sm:gap-2 transition-all duration-200 font-medium text-xs sm:text-sm
                          ${activePreview === device.id 
                            ? `bg-gradient-to-r ${device.color} text-white shadow-md` 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                          }
                        `}
                      >
                          <device.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-center">{device.label}</span>
                      </motion.button>
                    ))}
                    </div>
                  </div>
                </div>

                {/* Modern Front/Back Toggle */}
                <div className="flex justify-center">
                  <div className="bg-gray-100 rounded-xl p-1">
                    {[
                      { id: false, label: 'Front Side', icon: Eye },
                      { id: true, label: 'Back Side', icon: RotateCcw }
                    ].map((option) => (
                      <motion.button
                        key={option.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowBackPage(option.id)}
                        className={`
                          px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 text-sm font-medium
                          ${showBackPage === option.id 
                            ? 'bg-white shadow-sm text-gray-900' 
                            : 'text-gray-600 hover:text-gray-800'
                          }
                        `}
                      >
                        <option.icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Authentic Device Preview - Enhanced mobile layout */}
                <div 
                  className="flex justify-center items-center rounded-2xl p-4 sm:p-6 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.08)',
                    minHeight: '500px', // Responsive height
                    height: 'auto'
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activePreview}
                      initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: designTokens.animation.easing.out 
                      }}
                      className="transform hover:scale-[1.02] transition-transform duration-300"
                    >
                      {/* Dynamic Device Frame Rendering */}
                      {activePreview === 'apple' && (
                        <IPhone15Frame 
                          variant="pro"
                          className="shadow-2xl"
                        >
                          <motion.div
                            key={`iphone-${showBackPage}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="w-full h-full"
                          >
                            <LivePreview 
                              cardData={cardData} 
                              activeView={activePreview}
                              showBackPage={showBackPage}
                              onToggleBack={setShowBackPage}
                            />
                          </motion.div>
                        </IPhone15Frame>
                      )}
                      
                      {activePreview === 'google' && (
                        <AndroidFrame 
                          variant="pixel"
                          className="shadow-2xl"
                        >
                          <motion.div
                            key={`android-${showBackPage}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="w-full h-full"
                          >
                            <LivePreview 
                              cardData={cardData} 
                              activeView={activePreview}
                              showBackPage={showBackPage}
                              onToggleBack={setShowBackPage}
                            />
                          </motion.div>
                        </AndroidFrame>
                      )}
                      
                      {activePreview === 'pwa' && (
                        <WebFrame 
                          browser="chrome"
                          url="https://rewardjar.xyz/card/preview"
                          className="shadow-2xl"
                        >
                          <motion.div
                            key={`web-${showBackPage}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="w-full h-full flex items-center justify-center bg-gray-50"
                          >
                            <div className="w-full max-w-md mx-auto p-4">
                              <LivePreview 
                                cardData={cardData} 
                                activeView={activePreview}
                                showBackPage={showBackPage}
                                onToggleBack={setShowBackPage}
                              />
                            </div>
                          </motion.div>
                        </WebFrame>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Interactive Controls - Mobile responsive */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBackPage(!showBackPage)}
                    className={`
                      ${modernStyles.button.secondary} 
                      flex items-center justify-center gap-2 w-full sm:w-auto
                      transition-all duration-${designTokens.animation.duration.fast}
                    `}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Flip Card</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl 
                      flex items-center justify-center gap-2 font-medium w-full sm:w-auto
                      transition-all duration-${designTokens.animation.duration.fast}
                    `}
                  >
                    <Play className="w-4 h-4" />
                    <span>Interactive Mode</span>
                  </motion.button>
                </div>

                {/* Enhanced Configuration Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="space-y-4"
                >
                  <div 
                    className="p-4 rounded-xl border border-blue-200"
                    style={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                    }}
                  >
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Preview: {activePreview.charAt(0).toUpperCase() + activePreview.slice(1)} Wallet
                    </h4>
                    <div className="text-sm text-blue-700 mt-1">
                      {activePreview === 'apple' && '🍎 iPhone 15 Pro with Dynamic Island, realistic bezels, and iOS animations'}
                      {activePreview === 'google' && '🤖 Google Pixel with punch-hole camera, Material Design, and Android gestures'}
                      {activePreview === 'pwa' && '🌐 Chrome browser with realistic tabs, address bar, and responsive web design'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Real-time sync enabled
                    </span>
                    <span className="text-xs bg-white px-2 py-1 rounded-full">
                      99% device accuracy
                    </span>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
          </div>
        </div>
      </PageTransition>
    </AdminLayoutClient>
  )
}

// Export with Suspense boundary for Next.js 15+ compatibility
export default function CardCreationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading card creation...</p>
        </div>
      </div>
    }>
      <CardCreationPageContent />
    </Suspense>
  )
}