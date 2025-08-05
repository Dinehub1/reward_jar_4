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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Globe
} from 'lucide-react'

// Types
interface Business {
  id: string
  name: string
  contact_email: string
  description?: string
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
  reward: string
  rewardDescription: string // NEW: Required field for detailed reward info
  stampsRequired: number
  cardExpiryDays: number
  rewardExpiryDays: number
  
  // Step 2: Design
  cardColor: string
  iconEmoji: string
  barcodeType: 'QR_CODE' | 'PDF417'
  
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

// Enhanced QR Code Display Component with Wallet-Specific Optimization
const QRCodeDisplay = React.memo(({ 
  value, 
  size = 120, 
  walletType = 'default' 
}: { 
  value: string, 
  size?: number,
  walletType?: 'apple' | 'google' | 'pwa' | 'default'
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  // Dynamic sizing based on wallet type for optimal user experience
  const getOptimalSize = () => {
    switch (walletType) {
      case 'apple': return Math.min(size, 60) // Compact for Apple's design
      case 'google': return Math.min(size, 50) // Smaller for Google's header
      case 'pwa': return Math.max(size, 80) // Larger for better PWA visibility
      default: return size
    }
  }

  const optimalSize = getOptimalSize()
  
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrcode = await import('qrcode')
        const url = await qrcode.toDataURL(value, {
          width: optimalSize * 2, // Higher resolution for crisp display
          margin: walletType === 'google' ? 0 : 1, // Minimal margin for Google
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M' // Medium error correction for better scanning
        })
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }
    
    if (value) generateQR()
  }, [value, optimalSize, walletType])

  if (qrCodeUrl) {
    return (
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        width={optimalSize} 
        height={optimalSize} 
        className={`transition-all duration-200 ${
          walletType === 'google' ? 'rounded-sm' : 'rounded'
        }`}
        style={{ imageRendering: 'crisp-edges' }} // Ensure crisp QR code rendering
      />
    )
  }

  return (
    <div 
      className={`bg-white flex items-center justify-center border-2 border-dashed border-gray-300 animate-pulse ${
        walletType === 'google' ? 'rounded-sm' : 'rounded'
      }`}
      style={{ width: optimalSize, height: optimalSize }}
    >
      <QrCode className="w-6 h-6 text-gray-400" />
    </div>
  )
})

// Live Preview Component
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
  const qrCodeData = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rewardjar.xyz'}/join/demo-${cardData.cardName.replace(/\s+/g, '-').toLowerCase()}`
  
  // Calculate demo progress (show about 40% completion for preview)
  const demoFilledStamps = Math.max(1, Math.floor(cardData.stampsRequired * 0.4))
  const remainingStamps = cardData.stampsRequired - demoFilledStamps
  const availableRewards = Math.floor(demoFilledStamps / (cardData.stampsRequired / 2)) || 1
  
  // Generate stamp grid for visual representation
  const generateStampGrid = (total: number, filled: number = demoFilledStamps, walletType: 'apple' | 'google' | 'pwa' = 'apple') => {
    const stamps = []
    const maxCols = 5
    const progressPercentage = (filled / total) * 100
    
    for (let i = 0; i < total; i++) {
      const isFilled = i < filled
      const isNext = i === filled // Next stamp to be filled
      
      stamps.push(
        <div
          key={i}
          className={`relative w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold transition-all duration-500 ${
            isFilled 
              ? 'bg-white bg-opacity-30 border-white text-white scale-105' 
              : isNext && walletType === 'pwa'
              ? 'border-white border-opacity-70 text-white text-opacity-70 animate-pulse'
              : 'border-white border-opacity-40 text-white text-opacity-60'
          }`}
          style={{
            animationDelay: `${i * 50}ms`, // Staggered animation
          }}
        >
          <span className={isFilled ? 'animate-bounce-in' : ''}>{cardData.iconEmoji}</span>
          
          {/* Progress indicator for filled stamps */}
          {isFilled && walletType === 'pwa' && (
            <div className="absolute -inset-0.5 rounded border border-green-400 opacity-50 animate-pulse"></div>
          )}
        </div>
      )
    }
    
    return { stamps, progressPercentage }
  }
  
  const AppleWalletView = () => (
    <div className="w-64 h-[420px] bg-black rounded-[2rem] p-2 shadow-xl">
      <div className="relative w-full h-full bg-gray-900 rounded-[1.5rem] overflow-hidden">
        {/* Front Page */}
        <div className={`absolute inset-0 transition-transform duration-300 ${
          showBackPage ? 'transform rotateY-180' : 'transform rotateY-0'
        }`} style={{ backfaceVisibility: 'hidden' }}>
          <div className="h-full p-4 text-white relative" style={{ 
            background: `linear-gradient(135deg, ${cardData.cardColor || '#8B4513'}, ${cardData.cardColor || '#8B4513'}dd)` 
          }}>
            {/* Info Button */}
            {onToggleBack && (
              <button 
                onClick={() => onToggleBack(true)}
                className="absolute top-4 right-4 w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-xs font-semibold"
              >
                i
              </button>
            )}
            
            {/* Header */}
            <div className="text-sm opacity-80 mb-1">{cardData.businessName || 'Business Name'}</div>
            <div className="text-lg font-semibold mb-4">{cardData.cardName || 'Card Name'}</div>
            
            {/* Stamp Grid */}
            <div className="mb-4">
              <div className="grid grid-cols-5 gap-1 justify-center">
                {generateStampGrid(cardData.stampsRequired, demoFilledStamps, 'apple').stamps}
              </div>
            </div>
            
            {/* Reward Progress - Show reward name only on front */}
            <div className="mb-4 text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {demoFilledStamps} / {cardData.stampsRequired}
              </div>
              {cardData.reward && (
                <div className="text-sm opacity-90">{cardData.reward}</div>
              )}
            </div>
            
            {/* QR Code */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <div className="bg-white p-2 rounded inline-block">
                <QRCodeDisplay value={qrCodeData} size={60} walletType="apple" />
              </div>
              <div className="text-xs opacity-60 mt-2">Tap ••• for details</div>
              <div className="text-xs opacity-40 mt-1">Powered by RewardJar</div>
            </div>
          </div>
        </div>
        
        {/* Back Page */}
        <div className={`absolute inset-0 transition-transform duration-300 ${
          showBackPage ? 'transform rotateY-0' : 'transform rotateY-180'
        }`} style={{ backfaceVisibility: 'hidden', transform: showBackPage ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
          <div className="h-full p-4 bg-gray-800 text-white">
            {/* Done Button */}
            {onToggleBack && (
              <button 
                onClick={() => onToggleBack(false)}
                className="absolute top-4 right-4 text-blue-400 text-sm font-medium"
              >
                Done
              </button>
            )}
            
            <h3 className="font-bold mb-4 text-lg">Pass Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="opacity-70">Reward:</span><br/>
                <span className="text-white">{cardData.rewardDescription || cardData.reward || 'No reward description'}</span>
              </div>
              <div>
                <span className="opacity-70">Description:</span><br/>
                <span className="text-white">{cardData.cardDescription || 'No card description'}</span>
              </div>
              <div>
                <span className="opacity-70">How to Earn:</span><br/>
                <span className="text-white">{cardData.howToEarnStamp || 'No instructions provided'}</span>
              </div>
              <div>
                <span className="opacity-70">Reward Details:</span><br/>
                <span className="text-white">{cardData.rewardDetails || 'No additional details'}</span>
              </div>
              <div>
                <span className="opacity-70">Support:</span><br/>
                <span className="text-blue-400">support@rewardjar.xyz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const GoogleWalletView = () => (
    <div className="w-80 bg-black rounded-2xl shadow-xl overflow-hidden border border-gray-800">
      <div className="relative">
        {/* Front Page - Apple-style design */}
        <div className={`transition-all duration-300 ${showBackPage ? 'h-96' : 'h-64'}`}>
          <div className="h-64 p-5 relative" style={{ 
            background: `linear-gradient(135deg, ${cardData.cardColor || '#8B4513'}, ${cardData.cardColor || '#8B4513'}dd)`,
            borderRadius: '16px 16px 0 0'
          }}>
            {/* Apple-style header */}
            <div className="flex justify-between items-start text-white mb-6">
              <div>
                <div className="text-xs opacity-75 uppercase tracking-wide font-medium">{cardData.businessName || 'Business Name'}</div>
                <div className="text-lg font-semibold mt-1 tracking-tight">{cardData.cardName || 'Card Name'}</div>
              </div>
              {onToggleBack && (
                <button 
                  onClick={() => onToggleBack(true)}
                  className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-xs font-semibold bg-white/10 backdrop-blur-sm"
                >
                  i
                </button>
              )}
            </div>
            
            {/* Apple-style stamp grid */}
            <div className="mb-6">
              <div className="grid grid-cols-5 gap-2 justify-center">
                {generateStampGrid(cardData.stampsRequired, demoFilledStamps, 'google').stamps.map((stamp, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      index < demoFilledStamps 
                        ? 'bg-white/20 border-white/60 text-white backdrop-blur-sm' 
                        : 'border-white/30 text-white/60'
                    }`}
                  >
                    {cardData.iconEmoji}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Apple-style progress display */}
            <div className="text-center text-white">
              <div className="text-2xl font-bold mb-2 tracking-tight">
                {demoFilledStamps} / {cardData.stampsRequired}
              </div>
              {cardData.reward && (
                <div className="text-sm opacity-90 font-medium">{cardData.reward}</div>
              )}
            </div>
            
            {/* Apple-style QR code placement */}
            <div className="absolute bottom-4 right-4">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <QRCodeDisplay value={qrCodeData} size={32} walletType="google" />
              </div>
            </div>
          </div>
          
          {/* Apple-style back page */}
          {showBackPage && (
            <div className="p-5 bg-gray-900 text-white space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Pass Details</h3>
                <button 
                  onClick={() => onToggleBack?.(false)}
                  className="text-blue-400 text-sm font-medium"
                >
                  Done
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="opacity-70">Reward:</span><br/>
                  <span className="text-white">{cardData.rewardDescription || 'No reward description'}</span>
                </div>
                <div>
                  <span className="opacity-70">Description:</span><br/>
                  <span className="text-white">{cardData.cardDescription || 'No card description'}</span>
                </div>
                <div>
                  <span className="opacity-70">How to Earn:</span><br/>
                  <span className="text-white">{cardData.howToEarnStamp || 'No instructions provided'}</span>
                </div>
                <div>
                  <span className="opacity-70">Additional Info:</span><br/>
                  <span className="text-white">{cardData.rewardDetails || 'No additional details'}</span>
                </div>
                <div>
                  <span className="opacity-70">Support:</span><br/>
                  <span className="text-blue-400">support@rewardjar.xyz</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 text-center bg-black">Powered by RewardJar</div>
    </div>
  )

  const PWACardView = () => (
    <div className="w-72 bg-black rounded-xl shadow-xl overflow-hidden border border-gray-800">
      {!showBackPage ? (
        // Front Page - Apple-style design
        <div>
          <div className="p-6 relative" style={{ 
            background: `linear-gradient(135deg, ${cardData.cardColor || '#8B4513'}, ${cardData.cardColor || '#8B4513'}dd)`,
            borderRadius: '12px 12px 0 0'
          }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs text-white/75 uppercase tracking-wide font-medium">{cardData.businessName || 'Business Name'}</div>
                <div className="text-lg font-semibold text-white mt-1 tracking-tight">{cardData.cardName || 'Card Name'}</div>
              </div>
              <div className="text-2xl">{cardData.iconEmoji}</div>
            </div>
            
            {/* Apple-style stamp grid */}
            <div className="mb-6">
              <div className="grid grid-cols-5 gap-2 justify-center">
                {generateStampGrid(cardData.stampsRequired, demoFilledStamps, 'pwa').stamps.map((stamp, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      index < demoFilledStamps 
                        ? 'bg-white/20 border-white/60 text-white backdrop-blur-sm' 
                        : 'border-white/30 text-white/60'
                    }`}
                  >
                    {cardData.iconEmoji}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Apple-style progress display */}
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-white mb-2 tracking-tight">
                {demoFilledStamps} / {cardData.stampsRequired}
              </div>
              {cardData.reward && (
                <div className="text-sm text-white/90 font-medium">{cardData.reward}</div>
              )}
            </div>
            
            {/* Apple-style QR code */}
            <div className="absolute bottom-4 right-4">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <QRCodeDisplay value={qrCodeData} size={32} walletType="pwa" />
              </div>
            </div>
            
            {/* Apple-style details button */}
            {onToggleBack && (
              <div className="absolute bottom-4 left-4">
                <button 
                  onClick={() => onToggleBack(true)}
                  className="text-white/80 text-xs font-medium underline"
                >
                  Tap ••• for details
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Apple-style back page
        <div className="p-6 bg-gray-900 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Pass Details</h3>
            {onToggleBack && (
              <button 
                onClick={() => onToggleBack(false)}
                className="text-blue-400 text-sm font-medium"
              >
                Done
              </button>
            )}
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="opacity-70">Reward:</span><br/>
              <span className="text-white">{cardData.rewardDescription || 'No reward description'}</span>
            </div>
            <div>
              <span className="opacity-70">Description:</span><br/>
              <span className="text-white">{cardData.cardDescription || 'No card description'}</span>
            </div>
            <div>
              <span className="opacity-70">How to Earn:</span><br/>
              <span className="text-white">{cardData.howToEarnStamp || 'No instructions provided'}</span>
            </div>
            <div>
              <span className="opacity-70">Additional Info:</span><br/>
              <span className="text-white">{cardData.rewardDetails || 'No additional details'}</span>
            </div>
            <div>
              <span className="opacity-70">Support:</span><br/>
              <span className="text-blue-400">support@rewardjar.xyz</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex justify-center">
      {activeView === 'apple' && <AppleWalletView />}
      {activeView === 'google' && <GoogleWalletView />}
      {activeView === 'pwa' && <PWACardView />}
    </div>
  )
})

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
    reward: '',
    rewardDescription: '', // NEW: Required reward description field
    stampsRequired: 10,
    cardExpiryDays: 60,
    rewardExpiryDays: 15,
    
    // Step 2: Design
    cardColor: '#8B4513',
    iconEmoji: '☕',
    barcodeType: 'QR_CODE',
    
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
              businessName: business.name
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
      const payload = {
        card_name: cardData.cardName,
        business_id: cardData.businessId,
        reward: cardData.reward,
        reward_description: cardData.rewardDescription, // NEW: Include reward description
        stamps_required: cardData.stampsRequired,
        card_color: cardData.cardColor,
        icon_emoji: cardData.iconEmoji,
        barcode_type: cardData.barcodeType,
        card_expiry_days: cardData.cardExpiryDays,
        reward_expiry_days: cardData.rewardExpiryDays,
        stamp_config: cardData.stampConfig,
        card_description: cardData.cardDescription,
        how_to_earn_stamp: cardData.howToEarnStamp,
        reward_details: cardData.rewardDetails,
        earned_stamp_message: cardData.earnedStampMessage,
        earned_reward_message: cardData.earnedRewardMessage
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

    setCardData(prev => ({
      ...prev,
      cardColor: template.cardColor,
      iconEmoji: template.iconEmoji,
      stampsRequired: template.stampsRequired,
      reward: template.reward,
      rewardDescription: template.rewardDescription,
      cardDescription: template.cardDescription,
      howToEarnStamp: template.howToEarnStamp,
      rewardDetails: template.rewardDetails,
      stampConfig: {
        ...template.stampConfig,
        duplicateVisitBuffer: template.stampConfig.duplicateVisitBuffer as '12h' | '1d' | 'none'
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
        <div>
              <Label htmlFor="cardName">Card Name *</Label>
            <Input
                id="cardName"
                value={cardData.cardName}
                onChange={(e) => setCardData(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder="e.g. Pizza Lovers Card"
                className={getError('cardName') ? 'border-red-500' : ''}
              />
              {getError('cardName') && <p className="text-sm text-red-500 mt-1">{getError('cardName')}</p>}
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
                    businessName: business?.name || ''
              }))
            }}
          >
                <SelectTrigger className={getError('businessId') ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a business" />
            </SelectTrigger>
            <SelectContent>
                  {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
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
            <div>
              <Label>Card Color</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                    onClick={() => setCardData(prev => ({ ...prev, cardColor: color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                    cardData.cardColor === color ? 'border-gray-900' : 'border-gray-300'
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
            <div className="text-sm text-blue-700">This information appears when customers tap "Details"</div>
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

            {/* Live Preview */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <LivePreview cardData={cardData} activeView={activePreview} />
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
          <Button 
              onClick={saveCard} 
              disabled={saving}
              className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Card...
              </>
            ) : (
              <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Card
              </>
            )}
          </Button>
          
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
        <Button variant="outline" onClick={() => setShowTemplateSelector(false)}>
          Skip Templates - Start from Scratch
        </Button>
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin/cards')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cards
              </Button>
              <div>
              <h1 className="text-2xl font-bold">Create New Card</h1>
              <p className="text-gray-600">Follow the steps to create your loyalty card</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowTemplateSelector(true)}>
              Change Template
            </Button>
          </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${index <= currentStep 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 text-gray-400'
                  }
                `}>
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-24 h-0.5 mx-2
                    ${index < currentStep ? 'bg-blue-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="text-center" style={{ width: '120px' }}>
                <p className={`text-sm font-medium ${
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {STEPS[currentStep].icon}
                {STEPS[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline"
                  onClick={prevStep} 
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < STEPS.length - 1 && (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
                  </CardContent>
                </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Platform Selector */}
              <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
                <button 
                  onClick={() => setActivePreview('apple')}
                  className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                    activePreview === 'apple' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                  }`}
                >
                  <Apple className="w-4 h-4" />
                  Apple
                </button>
                <button 
                  onClick={() => setActivePreview('google')}
                  className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                    activePreview === 'google' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                  }`}
                >
                  <Chrome className="w-4 h-4" />
                  Google
                </button>
                <button 
                  onClick={() => setActivePreview('pwa')}
                  className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                    activePreview === 'pwa' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  PWA
                </button>
              </div>

              {/* Front/Back Toggle */}
              <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
                <button 
                  onClick={() => setShowBackPage(false)}
                  className={`px-3 py-2 rounded-md transition-all text-sm ${
                    !showBackPage ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Front Page
                </button>
                <button 
                  onClick={() => setShowBackPage(true)}
                  className={`px-3 py-2 rounded-md transition-all text-sm ${
                    showBackPage ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Back Page
                </button>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-6 rounded-lg min-h-[400px] flex items-center justify-center">
                <LivePreview 
                  cardData={cardData} 
                  activeView={activePreview}
                  showBackPage={showBackPage}
                  onToggleBack={setShowBackPage}
                />
          </div>

              {/* Configuration Summary */}
              <div className="mt-6 space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Preview: {activePreview.toUpperCase()} Wallet</h4>
                  <div className="text-sm text-blue-700">
                    {activePreview === 'apple' && 'iOS-style pass with dark theme and flip animation'}
                    {activePreview === 'google' && 'Material Design with light theme and expansion'}
                    {activePreview === 'pwa' && 'Progressive web app with offline-ready design'}
                  </div>
                </div>
                <div className="text-sm text-gray-600">Real-time sync enabled across all platforms</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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