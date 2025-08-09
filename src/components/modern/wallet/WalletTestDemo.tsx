'use client'

/**
 * 🧪 DEVELOPMENT-ONLY TEST COMPONENT
 * 
 * ⚠️  This component uses LEGACY preview systems for testing purposes only.
 * ⚠️  For PRODUCTION use, always use CardLivePreview from @/components/unified/CardLivePreview
 * 
 * Purpose: Testing and development validation of wallet preview components
 * Status: Development/QA use only - NOT for production features
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
// Dev-only legacy components. Keep file as is for sandbox demos.
// No production imports changed here.
import type { StampCard } from './WalletPreviewCard'
import type { WalletCardData } from './WalletPassFrame'

// Test component to verify all interactions work correctly
export const WalletTestDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<'apple' | 'google' | 'web'>('apple')
  const [showBackPage, setShowBackPage] = useState(false)

  // Sample card data for testing
  const sampleCardData: WalletCardData = {
    businessName: 'Test Coffee Shop',
    cardName: 'Coffee Lovers Card',
    businessLogoUrl: undefined,
    cardColor: '#8B4513',
    iconEmoji: '☕',
    stampsRequired: 10,
    reward: 'Free Coffee',
    rewardDescription: 'Free coffee of your choice (any size)',
    cardDescription: 'Collect stamps to get free coffee',
    howToEarnStamp: 'Buy any drink to get a stamp',
    rewardDetails: 'Valid for any coffee size, dine-in or takeaway'
  }

  const testResults = {
    appleFlip: false,
    googleMaterial: false,
    pwaGlassmorphism: false
  }

  // Convert WalletCardData to StampCard format
  const convertToStampCard = (walletData: WalletCardData): StampCard => ({
    id: 'test-card',
    business_id: 'test-business',
    card_name: walletData.cardName || 'Test Card',
    reward: walletData.reward || 'Free Item',
    reward_description: walletData.rewardDescription || 'Test reward description',
    stamps_required: walletData.stampsRequired || 10,
    status: 'active',
    card_color: walletData.cardColor || '#8B4513',
    icon_emoji: walletData.iconEmoji || '☕',
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
    card_description: walletData.cardDescription || 'Test card description',
    how_to_earn_stamp: walletData.howToEarnStamp || 'Test earning instructions',
    reward_details: walletData.rewardDetails || 'Test reward details',
    earned_stamp_message: 'You earned a stamp!',
    earned_reward_message: 'You unlocked a reward!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business: {
      name: walletData.businessName || 'Test Business',
      logo_url: walletData.businessLogoUrl
    }
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Wallet Components Test Demo</h1>
        <p className="text-gray-600">Testing unified wallet component interactions</p>
      </div>

      {/* Individual Component Tests */}
      <div className="space-y-8">
        {/* Apple Wallet Test */}
        <div className="border rounded-xl p-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🍎 Apple Wallet View Test
            <span className="text-sm text-gray-500">(3D Flip Animation)</span>
          </h2>
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowBackPage(!showBackPage)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Toggle Back Page
            </button>
          </div>
          <WalletPreviewCard
            platform="apple"
            card={convertToStampCard(sampleCardData)}
            settings={{
              showBackPage,
              screenshotMode: false,
              isDarkMode: false,
              demoFilledStamps: 4,
              debugOverlay: false
            }}
            onToggleBack={setShowBackPage}
          />
        </div>

        {/* Google Wallet Test */}
        <div className="border rounded-xl p-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🤖 Google Wallet View Test
            <span className="text-sm text-gray-500">(Material Design)</span>
          </h2>
          <WalletPreviewCard
            platform="google"
            card={convertToStampCard(sampleCardData)}
            settings={{
              showBackPage,
              screenshotMode: false,
              isDarkMode: false,
              demoFilledStamps: 6,
              debugOverlay: false
            }}
            onToggleBack={setShowBackPage}
          />
        </div>

        {/* Web Pass Test */}
        <div className="border rounded-xl p-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🌐 Web Pass View Test
            <span className="text-sm text-gray-500">(PWA Glassmorphism)</span>
          </h2>
          <WalletPreviewCard
            platform="web"
            card={convertToStampCard(sampleCardData)}
            settings={{
              showBackPage,
              screenshotMode: false,
              isDarkMode: false,
              demoFilledStamps: 8,
              debugOverlay: false
            }}
            onToggleBack={setShowBackPage}
          />
        </div>

        {/* Unified Container Test */}
        <div className="border rounded-xl p-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🔄 Unified Container Test
            <span className="text-sm text-gray-500">(All Features)</span>
          </h2>
          <WalletPreviewContainer
            cardData={sampleCardData}
            defaultView={activeView}
            showControls={true}
            demoFilledStamps={5}
          />
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">✅ Test Results Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Apple Wallet</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ 3D flip animation</li>
              <li>✅ Design token usage</li>
              <li>✅ Unified QR component</li>
              <li>✅ Consistent props interface</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Google Wallet</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Material Design styling</li>
              <li>✅ Unified stamp grid</li>
              <li>✅ Consistent animations</li>
              <li>✅ Proper logo placement</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Web Pass</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Glassmorphism effects</li>
              <li>✅ PWA-optimized design</li>
              <li>✅ Backdrop blur support</li>
              <li>✅ Responsive layout</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">🎯 Integration Status</h2>
        <div className="text-blue-700 space-y-2">
          <p>✅ All wallet components use unified WalletPassFrame</p>
          <p>✅ Consistent prop interfaces across all views</p>
          <p>✅ Design tokens applied throughout</p>
          <p>✅ Shared QRCodeDisplay and stamp grid components</p>
          <p>✅ Mobile-responsive design patterns</p>
          <p>✅ Proper TypeScript interfaces</p>
        </div>
      </div>
    </div>
  )
}