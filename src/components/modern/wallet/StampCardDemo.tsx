'use client'

import React, { useState } from 'react'
import { WalletPreviewCard } from './WalletPreviewCard'
import type { StampCard } from './WalletPreviewCard'
import type { WalletCardData } from './WalletPassFrame'

// Demo component showing the new stamp card design
export const StampCardDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<'apple' | 'google' | 'pwa'>('apple')
  const [showBackPage, setShowBackPage] = useState(false)
  const [demoFilledStamps, setDemoFilledStamps] = useState(2)

  // Sample card data matching your reference image
  const stampCardData: WalletCardData = {
    businessName: 'Example Business',
    cardName: 'Example card',
    businessLogoUrl: undefined, // You can add a logo URL here
    cardColor: '#8B4513',
    iconEmoji: '🌸', // Lotus-like flower to match your reference
    stampsRequired: 10,
    reward: 'Free Service',
    rewardDescription: 'Free service of your choice',
    cardDescription: 'Collect stamps to get rewards',
    howToEarnStamp: 'Buy anything to get a stamp',
    rewardDetails: 'Valid for any service, subject to terms and conditions',
    // New properties for enhanced design
    backgroundImageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Beautiful spa/wellness background
    cardStyle: 'image',
    textColor: '#FFFFFF',
    accentColor: '#FF6B6B'
  }

  const viewOptions = [
    { id: 'apple' as const, label: '🍎 Apple Wallet', description: 'iOS native design' },
    { id: 'google' as const, label: '🤖 Google Wallet', description: 'Material Design' },
    { id: 'pwa' as const, label: '🌐 Web Pass', description: 'Progressive Web App' }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Enhanced Stamp Card Design</h1>
        <p className="text-gray-600">Beautiful stamp cards with background images and modern layouts</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {/* View Selector */}
        <div className="flex bg-white rounded-2xl p-1 shadow-lg border border-gray-200">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveView(option.id)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${activeView === option.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Stamp Counter */}
        <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-md border border-gray-200">
          <label className="text-sm font-medium text-gray-700">Stamps:</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDemoFilledStamps(Math.max(0, demoFilledStamps - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
            >
              -
            </button>
            <span className="w-8 text-center font-bold">{demoFilledStamps}</span>
            <button
              onClick={() => setDemoFilledStamps(Math.min(10, demoFilledStamps + 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Back Page Toggle */}
        <button
          onClick={() => setShowBackPage(!showBackPage)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
            ${showBackPage
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }
          `}
        >
          {showBackPage ? '📱 Front' : '📋 Back'}
        </button>
      </div>

      {/* Card Preview */}
      <div className="flex justify-center">
        <div 
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            minHeight: '600px',
            minWidth: '400px'
          }}
        >
          <WalletPreviewCard
            platform={activeView === 'pwa' ? 'web' : activeView}
            card={{
              id: 'demo-card',
              business_id: 'demo-business',
              card_name: stampCardData.cardName || 'Example card',
              reward: stampCardData.reward || 'Free Service',
              reward_description: stampCardData.rewardDescription || 'Free service of your choice',
              stamps_required: stampCardData.stampsRequired || 10,
              status: 'active',
              card_color: stampCardData.cardColor || '#8B4513',
              icon_emoji: stampCardData.iconEmoji || '🌸',
              barcode_type: 'QR_CODE',
              card_expiry_days: 60,
              reward_expiry_days: 15,
              stamp_config: {
                manualStampOnly: true,
                minSpendAmount: 0,
                billProofRequired: false,
                maxStampsPerDay: 1,
                duplicateVisitBuffer: 'none'
              },
              card_description: stampCardData.cardDescription || 'Collect stamps to get rewards',
              how_to_earn_stamp: stampCardData.howToEarnStamp || 'Buy anything to get a stamp',
              reward_details: stampCardData.rewardDetails || 'Valid for any service, subject to terms and conditions',
              earned_stamp_message: 'You earned a stamp!',
              earned_reward_message: 'You unlocked a reward!',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              business: {
                name: stampCardData.businessName || 'Example Business',
                logo_url: stampCardData.businessLogoUrl
              }
            }}
            settings={{
              showBackPage,
              screenshotMode: false,
              isDarkMode: false,
              demoFilledStamps,
              debugOverlay: false
            }}
            onToggleBack={setShowBackPage}
          />
        </div>
      </div>

      {/* Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="text-2xl mb-3">🖼️</div>
          <h3 className="font-semibold mb-2">Background Images</h3>
          <p className="text-gray-600 text-sm">
            Support for beautiful background images with automatic overlay for text readability
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="text-2xl mb-3">🎨</div>
          <h3 className="font-semibold mb-2">Enhanced Stamps</h3>
          <p className="text-gray-600 text-sm">
            Larger, more interactive stamps with hover effects and smooth animations
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="text-2xl mb-3">📱</div>
          <h3 className="font-semibold mb-2">Native Feel</h3>
          <p className="text-gray-600 text-sm">
            Authentic Apple Wallet design with proper dimensions and styling
          </p>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
        <pre className="text-sm overflow-x-auto">
{`const stampCardData: WalletCardData = {
  businessName: 'Example Business',
  cardName: 'Example card',
  iconEmoji: '🌸',
  stampsRequired: 10,
  backgroundImageUrl: 'https://your-image-url.jpg',
  cardStyle: 'image',
  // ... other properties
}

<AppleWalletView
  cardData={stampCardData}
  activeView="apple"
  demoFilledStamps={2}
/>`}
        </pre>
      </div>
    </div>
  )
}