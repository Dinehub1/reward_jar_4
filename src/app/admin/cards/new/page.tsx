'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { WalletProvisioningStatus } from '@/components/admin/WalletProvisioningStatus'
import type { StampConfig, CardFormData } from '@/lib/supabase/types'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload,
  Apple,
  Chrome,
  Globe,
  Star,
  Check,
  Settings,
  Palette,
  Zap,
  QrCode,
  ImageIcon,
  Smartphone
} from 'lucide-react'

interface Business {
  id: string
  name: string
  contact_email: string
  description?: string
}

interface CardTemplate {
  id: string
  name: string
  description: string
  category: string
  theme: {
    background: string
    primaryColor: string
    logo?: string
  }
  defaultValues: {
    total_stamps: number
  }
  preview: {
    stamps_used: number
  }
}

interface EnhancedCardFormData {
  // Primary card fields (matching documentation)
  cardName: string
  businessId: string
  businessName: string
  reward: string
  stampsRequired: number
  cardColor: string
  iconEmoji: string
  barcodeType: 'PDF417' | 'QR_CODE'
  cardExpiryDays: number
  rewardExpiryDays: number
  
  // Stamp logic configuration
  stampConfig: StampConfig
  
  // UI/Display fields
  theme: {
    background: string
    primaryColor: string
    logo?: string
    customLogo?: string
    customIcon?: string
  }
  
  // Legacy compatibility
  card_type: 'stamp' | 'membership'
  status: 'draft' | 'active'
}

// Simplified templates - exactly like in the design
const cardTemplates: CardTemplate[] = [
  {
    id: 'premium-coffee',
    name: 'Premium Coffee Loyalty',
    description: 'Elegant coffee shop loyalty with rich brown theme',
    category: 'Food & Beverage',
    theme: {
      background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      primaryColor: '#8B4513',
      logo: '☕'
    },
    defaultValues: { total_stamps: 10 },
    preview: { stamps_used: 4 }
  },
  {
    id: 'restaurant-deluxe',
    name: 'Restaurant Deluxe',
    description: 'Sophisticated dining rewards program',
    category: 'Food & Beverage',
    theme: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      primaryColor: '#059669',
      logo: '🍽️'
    },
    defaultValues: { total_stamps: 8 },
    preview: { stamps_used: 2 }
  },
  {
    id: 'beauty-spa-luxury',
    name: 'Luxury Beauty & Spa',
    description: 'Premium salon and spa experience',
    category: 'Beauty & Wellness',
    theme: {
      background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      primaryColor: '#EC4899',
      logo: '💅'
    },
    defaultValues: { total_stamps: 6 },
    preview: { stamps_used: 1 }
  },
  {
    id: 'retail-rewards',
    name: 'Retail Rewards Plus',
    description: 'Modern retail loyalty program',
    category: 'Retail & Shopping',
    theme: {
      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
      primaryColor: '#7C3AED',
      logo: '🛍️'
    },
    defaultValues: { total_stamps: 15 },
    preview: { stamps_used: 4 }
  }
]

const STEPS = [
  { id: 'metadata', title: 'Card Details', icon: <Settings className="w-4 h-4" /> },
  { id: 'design', title: 'Design', icon: <Palette className="w-4 h-4" /> },
  { id: 'stamp-logic', title: 'Stamp Rules', icon: <Zap className="w-4 h-4" /> },
  { id: 'save', title: 'Create Card', icon: <Save className="w-4 h-4" /> },
  { id: 'wallet', title: 'Wallet Setup', icon: <Smartphone className="w-4 h-4" /> }
]

// Common emoji options for cards
const EMOJI_OPTIONS = [
  '☕', '🍕', '🧋', '🍔', '🍜', '🥗', '🍰', '🧁', '🍺', '🥂',
  '💅', '💇', '🧖', '💄', '🎨', '🖌️', '✂️', '💆', '🧴', '🪒',
  '🛍️', '👗', '👚', '👖', '👟', '👜', '💍', '👑', '🎁', '🛒',
  '🏋️', '🧘', '🏃', '🚴', '🏊', '🤸', '⚽', '🏀', '🎾', '🏓',
  '🏥', '💊', '🩺', '💉', '🦷', '👓', '🩹', '🧬', '🔬', '⚕️',
  '🏠', '🔧', '🔨', '🪚', '🔩', '⚡', '🚿', '🛁', '🪟', '🚪'
]

// Color palette options
const COLOR_OPTIONS = [
  '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B22222', '#DC143C',
  '#FF6347', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00',
  '#ADFF2F', '#32CD32', '#00FF00', '#00FA9A', '#00CED1', '#00BFFF',
  '#1E90FF', '#0000FF', '#4169E1', '#6A5ACD', '#8A2BE2', '#9400D3',
  '#FF1493', '#FF69B4', '#FFC0CB', '#DDA0DD', '#708090', '#2F4F4F'
]

// Card templates inspired by reference design
const CARD_TEMPLATES = [
  {
    id: 'coffee',
    name: 'Coffee Shop',
    description: 'Perfect for cafes and coffee shops',
    stampsRequired: 8,
    primaryColor: '#8B4513',
    logo: '☕',
    reward: 'Free Coffee or Pastry'
  },
  {
    id: 'automotive',
    name: 'ATV Rental',
    description: 'For vehicle rental services',
    stampsRequired: 5,
    primaryColor: '#8B4513',
    logo: '🏍️',
    reward: 'Free Rental Day'
  },
  {
    id: 'art',
    name: 'Art Studio',
    description: 'Perfect for art and creative studios',
    stampsRequired: 8,
    primaryColor: '#FF6347',
    logo: '🎨',
    reward: 'Free Art Class'
  },
  {
    id: 'accessories',
    name: 'Bags & Accessories',
    description: 'Great for fashion accessories',
    stampsRequired: 6,
    primaryColor: '#8A2BE2',
    logo: '👜',
    reward: 'Free Accessory'
  }
]

export default function OptimizedCardCreationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const logoUploadRef = useRef<HTMLInputElement>(null)
  const iconUploadRef = useRef<HTMLInputElement>(null)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null)
  const [activePreview, setActivePreview] = useState<'apple' | 'google' | 'pwa'>('apple')
  const [previewKey, setPreviewKey] = useState(0)
  const [createdCardId, setCreatedCardId] = useState<string | null>(null)
  const [showWalletProvisioning, setShowWalletProvisioning] = useState(false)

  // Apply template function
  const applyTemplate = (template: typeof CARD_TEMPLATES[0]) => {
    setCardData(prev => ({
      ...prev,
      cardName: template.name,
      stampsRequired: template.stampsRequired,
      cardColor: template.primaryColor,
      iconEmoji: template.logo,
      reward: template.reward
    }))
  }

  const [cardData, setCardData] = useState<EnhancedCardFormData>({
    // Primary card fields
    cardName: '',
    businessId: searchParams?.get('businessId') || '',
    businessName: '',
    reward: '',
    stampsRequired: 10,
    cardColor: '#8B4513',
    iconEmoji: '☕',
    barcodeType: 'QR_CODE',
    cardExpiryDays: 60,
    rewardExpiryDays: 15,
    
    // Stamp logic configuration
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '12h'
    },
    
    // UI/Display fields
    theme: {
      background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      primaryColor: '#8B4513',
      logo: '☕'
    },
    
    // Legacy compatibility
    card_type: 'stamp',
    status: 'draft'
  })

  // Load businesses
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const response = await fetch('/api/admin/businesses')
        const data = await response.json()
        if (data.success) {
          setBusinesses(data.data)
          // Auto-select business if provided in URL
          const businessId = searchParams?.get('businessId')
          if (businessId) {
            const business = data.data.find((b: Business) => b.id === businessId)
            if (business) {
              setCardData(prev => ({
                ...prev,
                businessId: business.id,
                businessName: business.name
              }))
            }
          }
        }
      } catch (error) {
        console.error('Failed to load businesses:', error)
      }
    }
    loadBusinesses()
  }, [searchParams])

  // Auto-select card type if provided in URL
  useEffect(() => {
    const type = searchParams?.get('type')
    if (type === 'stamp' || type === 'membership') {
      setCardData(prev => ({ ...prev, card_type: type }))
      setCurrentStep(1) // Skip to template selection
    }
  }, [searchParams])

  // Update preview when cardData changes
  useEffect(() => {
    setPreviewKey(prev => prev + 1)
  }, [cardData])

  const handleTemplateSelect = (template: CardTemplate) => {
    setSelectedTemplate(template)
    setCardData(prev => ({
      ...prev,
      theme: {
        ...template.theme,
        customLogo: prev.theme.customLogo,
        customIcon: prev.theme.customIcon
      },
      stampsRequired: template.defaultValues.total_stamps,
      cardColor: template.theme.primaryColor,
      iconEmoji: template.theme.logo || '☕'
    }))
    setCurrentStep(2) // Move to branding step
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && cardData.businessId) {
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'logo')
        formData.append('businessId', cardData.businessId)

        const response = await fetch('/api/admin/upload-media', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()
        if (result.success) {
          setCardData(prev => ({
            ...prev,
            theme: {
              ...prev.theme,
              customLogo: result.data.publicUrl
            }
          }))
        } else {
          console.error('Logo upload failed:', result.error)
          alert('Failed to upload logo: ' + result.error)
        }
      } catch (error) {
        console.error('Logo upload error:', error)
        alert('Failed to upload logo. Please try again.')
      } finally {
        setLoading(false)
      }
    } else if (!cardData.businessId) {
      alert('Please select a business first.')
    }
  }

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && cardData.businessId) {
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'icon')
        formData.append('businessId', cardData.businessId)

        const response = await fetch('/api/admin/upload-media', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()
        if (result.success) {
          setCardData(prev => ({
            ...prev,
            theme: {
              ...prev.theme,
              customIcon: result.data.publicUrl
            }
          }))
        } else {
          console.error('Icon upload failed:', result.error)
          alert('Failed to upload icon: ' + result.error)
        }
      } catch (error) {
        console.error('Icon upload error:', error)
        alert('Failed to upload icon. Please try again.')
      } finally {
        setLoading(false)
      }
    } else if (!cardData.businessId) {
      alert('Please select a business first.')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Prepare enhanced card data for new API
      const enhancedCardData = {
        cardName: cardData.cardName,
        businessId: cardData.businessId,
        reward: cardData.reward,
        stampsRequired: cardData.stampsRequired,
        cardColor: cardData.cardColor,
        iconEmoji: cardData.iconEmoji,
        cardExpiryDays: cardData.cardExpiryDays,
        rewardExpiryDays: cardData.rewardExpiryDays,
        stampConfig: cardData.stampConfig
      }

      console.log('🔍 Creating card with enhanced data:', enhancedCardData)

      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedCardData)
      })

      const result = await response.json()
      if (result.success) {
        console.log('✅ Card created successfully:', result.data)
        setCreatedCardId(result.data.id)
        setShowWalletProvisioning(true)
        setCurrentStep(currentStep + 1) // Move to wallet provisioning step
      } else {
        throw new Error(result.error || 'Failed to create card')
      }
    } catch (error) {
      console.error('Failed to save card:', error)
      alert('Failed to save card. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const canContinueToNextStep = () => {
    switch (currentStep) {
      case 0: // metadata
        return cardData.cardName !== '' && cardData.businessId !== '' && cardData.reward !== ''
      case 1: // design
        return cardData.cardColor !== '' && cardData.iconEmoji !== ''
      case 2: // stamp-logic
        return cardData.stampsRequired >= 1 && cardData.stampsRequired <= 20
      case 3: // preview
        return true
      default: return false
    }
  }

  const validateCardData = () => {
    const errors: string[] = []
    
    if (!cardData.cardName.trim()) errors.push('Card name is required')
    if (!cardData.businessId) errors.push('Business selection is required')
    if (!cardData.reward.trim()) errors.push('Reward description is required')
    if (cardData.stampsRequired < 1 || cardData.stampsRequired > 20) {
      errors.push('Stamps required must be between 1 and 20')
    }
    if (!cardData.cardColor) errors.push('Card color is required')
    if (!cardData.iconEmoji) errors.push('Icon emoji is required')
    if (cardData.cardExpiryDays < 1) errors.push('Card expiry days must be positive')
    if (cardData.rewardExpiryDays < 1) errors.push('Reward expiry days must be positive')
    
    return errors
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
            index <= currentStep 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-300 text-gray-400'
          }`}>
            {index < currentStep ? <Check className="w-4 h-4" /> : step.icon}
          </div>
          <span className={`text-xs mt-1 ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
            {step.title}
          </span>
        </div>
      ))}
    </div>
  )

  const renderCardTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Card Type</h2>
        <p className="text-gray-600">Select stamp or membership card</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cardData.card_type === 'stamp' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCardData(prev => ({ ...prev, card_type: 'stamp' }))}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Stamp Card</h3>
            <p className="text-gray-600 text-sm">Collect stamps for rewards</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cardData.card_type === 'membership' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setCardData(prev => ({ ...prev, card_type: 'membership' }))}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Membership Card</h3>
            <p className="text-gray-600 text-sm">Session-based access</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderTemplateStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Template</h2>
        <p className="text-gray-600">Select from RewardJar's professionally designed templates for stamp cards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg"
                  style={{ background: template.theme.primaryColor }}
                >
                  {template.theme.logo}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </div>
                <div 
                  className="w-6 h-6 rounded"
                  style={{ background: template.theme.background }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                <Badge variant="outline" className="text-xs">{template.defaultValues.total_stamps} stamps</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderBrandingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Branding</h2>
        <p className="text-gray-600">Customize colors & logo</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Business Selection */}
        <div>
          <Label htmlFor="business">Business</Label>
          <select
            id="business"
            className="w-full mt-1 p-2 border rounded-md"
            value={cardData.businessId}
            onChange={(e) => {
              const business = businesses.find(b => b.id === e.target.value)
              setCardData(prev => ({
                ...prev,
                businessId: e.target.value,
                business_name: business?.name || ''
              }))
            }}
          >
            <option value="">Select a business</option>
            {businesses.map(business => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        {/* Logo Upload */}
        <div>
          <Label>Business Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              {cardData.theme.customLogo ? (
                <img src={cardData.theme.customLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => logoUploadRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Uploading...' : 'Upload Logo'}
            </Button>
            <input
              ref={logoUploadRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Stamp Icon Upload */}
        <div>
          <Label>Custom Stamp Icon</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              {cardData.theme.customIcon ? (
                <img src={cardData.theme.customIcon} alt="Icon" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-2xl">{cardData.theme.logo}</span>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => iconUploadRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Uploading...' : 'Upload Icon'}
            </Button>
            <input
              ref={iconUploadRef}
              type="file"
              accept="image/*"
              onChange={handleIconUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="mt-2 flex items-center gap-4">
            <input
              type="color"
              id="primaryColor"
              value={cardData.theme.primaryColor}
              onChange={(e) => setCardData(prev => ({
                ...prev,
                theme: { ...prev.theme, primaryColor: e.target.value }
              }))}
              className="w-12 h-12 rounded border"
            />
            <Input
              value={cardData.theme.primaryColor}
              onChange={(e) => setCardData(prev => ({
                ...prev,
                theme: { ...prev.theme, primaryColor: e.target.value }
              }))}
              placeholder="#8B4513"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // New step renderers matching documentation
  const renderMetadataStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Card Details</h2>
        <p className="text-gray-600">Basic card information and business assignment</p>
      </div>

      {/* Quick Templates */}
      <div className="max-w-4xl mx-auto mb-8">
        <h3 className="text-lg font-semibold mb-4">Quick Start Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {CARD_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all hover:shadow-md"
              onClick={() => applyTemplate(template)}
            >
              <div className="w-full h-24 rounded-lg mb-3 flex items-center justify-center text-white text-3xl"
                   style={{ backgroundColor: template.primaryColor }}>
                {template.logo}
              </div>
              <h4 className="font-medium text-center text-sm">{template.name}</h4>
              <p className="text-xs text-gray-500 text-center">{template.description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Click any template to apply it, then customize as needed
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Business Selection */}
        <div>
          <Label htmlFor="business">Business *</Label>
          <Select
            value={cardData.businessId}
            onValueChange={(value) => {
              const business = businesses.find(b => b.id === value)
              setCardData(prev => ({
                ...prev,
                businessId: value,
                businessName: business?.name || ''
              }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a business" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map(business => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Card Name */}
        <div>
          <Label htmlFor="cardName">Card Name *</Label>
          <Input
            id="cardName"
            value={cardData.cardName}
            onChange={(e) => setCardData(prev => ({ ...prev, cardName: e.target.value }))}
            placeholder="e.g. Pizza Lovers Card"
          />
        </div>

        {/* Reward Description */}
        <div>
          <Label htmlFor="reward">Reward Description *</Label>
          <Textarea
            id="reward"
            value={cardData.reward}
            onChange={(e) => setCardData(prev => ({ ...prev, reward: e.target.value }))}
            placeholder="e.g. Free Garlic Bread or Soft Drink"
          />
        </div>

        {/* Stamps Required with Slider */}
        <div>
          <Label htmlFor="stampsRequired">Stamps Required: {cardData.stampsRequired}</Label>
          <div className="mt-2">
            <Slider
              value={[cardData.stampsRequired]}
              onValueChange={(value: number[]) => setCardData(prev => ({ 
                ...prev, 
                stampsRequired: value[0] 
              }))}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Expiry Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cardExpiryDays">Card Expiry (days)</Label>
            <Input
              id="cardExpiryDays"
              type="number"
              value={cardData.cardExpiryDays}
              onChange={(e) => setCardData(prev => ({ 
                ...prev, 
                cardExpiryDays: parseInt(e.target.value) || 60 
              }))}
              min="1"
              placeholder="60"
            />
          </div>
          <div>
            <Label htmlFor="rewardExpiryDays">Reward Expiry (days)</Label>
            <Input
              id="rewardExpiryDays"
              type="number"
              value={cardData.rewardExpiryDays}
              onChange={(e) => setCardData(prev => ({ 
                ...prev, 
                rewardExpiryDays: parseInt(e.target.value) || 15 
              }))}
              min="1"
              placeholder="15"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderDesignStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Design</h2>
        <p className="text-gray-600">Customize card appearance</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Color Picker */}
        <div>
          <Label>Card Background Color</Label>
          <div className="mt-2">
            <div className="grid grid-cols-10 gap-2 mb-4">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 ${
                    cardData.cardColor === color ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCardData(prev => ({ ...prev, cardColor: color }))}
                />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={cardData.cardColor}
                onChange={(e) => setCardData(prev => ({ ...prev, cardColor: e.target.value }))}
                className="w-12 h-12 rounded border"
              />
              <Input
                value={cardData.cardColor}
                onChange={(e) => setCardData(prev => ({ ...prev, cardColor: e.target.value }))}
                placeholder="#8B4513"
              />
            </div>
          </div>
        </div>

        {/* Emoji Picker */}
        <div>
          <Label>Icon Emoji</Label>
          <div className="mt-2">
            <div className="grid grid-cols-10 gap-2 mb-4 max-h-48 overflow-y-auto">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  className={`w-8 h-8 text-lg border-2 rounded ${
                    cardData.iconEmoji === emoji ? 'border-gray-900 bg-gray-100' : 'border-gray-300'
                  }`}
                  onClick={() => setCardData(prev => ({ ...prev, iconEmoji: emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Input
              value={cardData.iconEmoji}
              onChange={(e) => setCardData(prev => ({ ...prev, iconEmoji: e.target.value }))}
              placeholder="Or enter custom emoji"
              className="mt-2"
            />
          </div>
        </div>

        {/* Barcode Type Selection */}
        <div>
          <Label>Barcode Type</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="pdf417"
                name="barcodeType"
                value="PDF417"
                checked={cardData.barcodeType === 'PDF417'}
                onChange={(e) => setCardData(prev => ({ ...prev, barcodeType: e.target.value as 'PDF417' | 'QR_CODE' }))}
                className="w-4 h-4"
              />
              <Label htmlFor="pdf417" className="text-sm">PDF 417</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="qrcode"
                name="barcodeType"
                value="QR_CODE"
                checked={cardData.barcodeType === 'QR_CODE'}
                onChange={(e) => setCardData(prev => ({ ...prev, barcodeType: e.target.value as 'PDF417' | 'QR_CODE' }))}
                className="w-4 h-4"
              />
              <Label htmlFor="qrcode" className="text-sm">QR Code</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStampLogicStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stamp Rules</h2>
        <p className="text-gray-600">Configure stamp logic and anti-abuse settings</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Manual Stamp Only */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label>Manual Stamp Only</Label>
            <p className="text-sm text-gray-500">Stamps can only be added by staff</p>
          </div>
          <Switch
            checked={cardData.stampConfig.manualStampOnly}
            onCheckedChange={(checked) => setCardData(prev => ({
              ...prev,
              stampConfig: { ...prev.stampConfig, manualStampOnly: checked }
            }))}
          />
        </div>

        {/* Minimum Spend Amount */}
        <div>
          <Label htmlFor="minSpendAmount">Minimum Spend Amount (₹)</Label>
          <Input
            id="minSpendAmount"
            type="number"
            value={cardData.stampConfig.minSpendAmount}
            onChange={(e) => setCardData(prev => ({
              ...prev,
              stampConfig: { 
                ...prev.stampConfig, 
                minSpendAmount: parseInt(e.target.value) || 0 
              }
            }))}
            min="0"
            placeholder="500"
          />
        </div>

        {/* Bill Proof Required */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label>Require Bill Proof</Label>
            <p className="text-sm text-gray-500">Require bill number when adding stamps</p>
          </div>
          <Switch
            checked={cardData.stampConfig.billProofRequired}
            onCheckedChange={(checked) => setCardData(prev => ({
              ...prev,
              stampConfig: { ...prev.stampConfig, billProofRequired: checked }
            }))}
          />
        </div>

        {/* Max Stamps Per Day */}
        <div>
          <Label htmlFor="maxStampsPerDay">Max Stamps Per Day</Label>
          <Input
            id="maxStampsPerDay"
            type="number"
            value={cardData.stampConfig.maxStampsPerDay}
            onChange={(e) => setCardData(prev => ({
              ...prev,
              stampConfig: { 
                ...prev.stampConfig, 
                maxStampsPerDay: parseInt(e.target.value) || 1 
              }
            }))}
            min="1"
            max="10"
            placeholder="1"
          />
        </div>

        {/* Duplicate Visit Buffer */}
        <div>
          <Label>Duplicate Visit Buffer</Label>
          <Select
            value={cardData.stampConfig.duplicateVisitBuffer}
            onValueChange={(value: '12h' | '1d' | 'none') => setCardData(prev => ({
              ...prev,
              stampConfig: { ...prev.stampConfig, duplicateVisitBuffer: value }
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Buffer</SelectItem>
              <SelectItem value="12h">12 Hours</SelectItem>
              <SelectItem value="1d">1 Day</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            Minimum time between stamps to prevent abuse
          </p>
        </div>
      </div>
    </div>
  )

  // Compact Live Preview for Sidebar
  const renderLivePreview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        <p className="text-sm text-gray-600">Updates as you configure</p>
      </div>

      {/* Compact Mobile Preview */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Phone Frame - Smaller for Sidebar */}
          <div className="w-64 h-[420px] bg-black rounded-[2rem] p-1.5 shadow-xl">
            <div className="w-full h-full bg-gray-900 rounded-[1.5rem] relative overflow-hidden">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-black rounded-t-[1.5rem] flex items-center justify-center">
                <div className="w-24 h-4 bg-black rounded-full"></div>
              </div>
              
              {/* Card Content */}
              <div className="pt-12 px-3 h-full">
                <div 
                  className="w-full h-64 rounded-xl shadow-lg p-4 text-white relative overflow-hidden mx-auto"
                  style={{ 
                    background: `linear-gradient(135deg, ${cardData.cardColor} 0%, ${cardData.cardColor}88 100%)`,
                    aspectRatio: '2/3'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-sm">{cardData.cardName || 'Card Name'}</h4>
                      <p className="text-xs opacity-80">{cardData.businessName || 'Business'}</p>
                    </div>
                    <div className="text-xl">{cardData.iconEmoji}</div>
                  </div>

                  {/* Stamps Progress */}
                  <div className="mb-3">
                    <p className="text-xs opacity-75 text-center mb-2">STAMPS UNTIL REWARD</p>
                    
                    {/* Compact Stamp Grid */}
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      {Array.from({ length: Math.min(cardData.stampsRequired, 10) }, (_, i) => (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-xs ${
                            i < 2 ? 'bg-white text-black' : 'bg-transparent'
                          }`}
                        >
                          {i < 2 ? cardData.iconEmoji : ''}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <span className="text-lg font-bold">2</span>
                      <span className="text-sm mx-1">/</span>
                      <span className="text-lg font-bold">{cardData.stampsRequired}</span>
                      <span className="text-xs block opacity-75">stamps collected</span>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="text-center mb-3">
                    <p className="text-xs opacity-75 mb-1">AVAILABLE REWARDS</p>
                    <p className="text-xs font-medium">{cardData.reward || 'Reward...'}</p>
                  </div>

                  {/* Compact Barcode */}
                  <div className="absolute bottom-2 left-4 right-4 text-center">
                    <div className="bg-white rounded p-1 mx-auto w-8 h-8 flex items-center justify-center">
                      {cardData.barcodeType === 'QR_CODE' ? (
                        <div className="text-black text-xs font-mono leading-none">
                          ■■<br/>■■
                        </div>
                      ) : (
                        <div className="text-black text-xs font-mono leading-none">
                          |||<br/>|||
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Status */}
                <div className="text-center mt-2">
                  <p className="text-white text-xs">
                    <span className="text-green-400">●</span> Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Configuration Summary */}
      <div className="space-y-3 mt-6">
        <h4 className="font-medium text-sm">Configuration</h4>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Card Name:</span>
            <span className="font-medium">{cardData.cardName || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Business:</span>
            <span className="font-medium">{cardData.businessName || 'Not selected'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Stamps:</span>
            <span className="font-medium">{cardData.stampsRequired}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Color:</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: cardData.cardColor }}
              ></div>
              <span className="font-medium text-xs">{cardData.cardColor}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Icon:</span>
            <span className="font-medium">{cardData.iconEmoji}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Barcode:</span>
            <span className="font-medium">{cardData.barcodeType}</span>
          </div>
        </div>

        {/* Quick Validation */}
        <div className="pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => {
              const errors = validateCardData()
              if (errors.length > 0) {
                alert('Validation errors:\n' + errors.join('\n'))
              } else {
                alert('✅ Card configuration is valid!')
              }
            }}
          >
            <Check className="w-3 h-3 mr-1" />
            Validate
          </Button>
        </div>
      </div>
    </div>
  )









  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderMetadataStep()      // Card Details
      case 1: return renderDesignStep()        // Design
      case 2: return renderStampLogicStep()    // Stamp Rules  
      case 3: return renderSaveStep()          // Create Card
      case 4: return renderWalletStep()        // Wallet Setup
      default: return renderMetadataStep()
    }
  }

  const renderWalletStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Provisioning</h2>
        <p className="text-gray-600">Setting up multi-platform wallet support</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {createdCardId ? (
          <WalletProvisioningStatus
            cardId={createdCardId}
            cardName={cardData.cardName}
            onStatusUpdate={(statuses) => {
              console.log('Wallet statuses updated:', statuses)
            }}
          />
        ) : (
          <div className="text-center text-gray-500">
            <p>Card must be created first before wallet provisioning.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push('/admin/cards?created=true')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            size="lg"
          >
            <Check className="w-5 h-5 mr-2" />
            Complete & Return to Cards
          </Button>
        </div>
      </div>
    </div>
  )

  const renderSaveStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Card</h2>
        <p className="text-gray-600">Review and create your loyalty card</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Final validation */}
        <div className="mb-6">
          {(() => {
            const errors = validateCardData()
            if (errors.length > 0) {
              return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">Please fix the following errors:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )
            } else {
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900">✅ Card configuration is valid</h3>
                  <p className="text-sm text-green-700">Ready to create your loyalty card!</p>
                </div>
              )
            }
          })()}
        </div>

        {/* Create button */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleSave}
            disabled={saving || validateCardData().length > 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Creating Card...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Create & Assign QR
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-500">
            This will create the loyalty card, generate QR codes, and prepare wallet provisioning
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Design and configure a new loyalty or membership card with live wallet previews
                </h1>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Current Step */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  {renderCurrentStep()}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                {currentStep < STEPS.length - 1 ? (
                  <Button 
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canContinueToNextStep()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to {STEPS[currentStep + 1]?.title}
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Right Side - Live Preview */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  {renderLivePreview()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  )
}