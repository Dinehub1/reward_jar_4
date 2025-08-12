'use client'

import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

function LegacyFAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">FAQ</h1>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold">How fast can we go live?</h3>
          <p className="text-gray-600">Most businesses go live within 24–48 hours after onboarding.</p>
        </div>
        <div>
          <h3 className="font-semibold">Do you design the cards?</h3>
          <p className="text-gray-600">Yes, expert design is included and tailored to your brand.</p>
        </div>
        <div>
          <h3 className="font-semibold">Do customers need an app?</h3>
          <p className="text-gray-600">No. Customers use Apple Wallet, Google Wallet, or web — no app required.</p>
        </div>
      </div>
    </div>
  )
}


export default function FAQPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">FAQ Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the faq</p>
          <a 
            href="/faq"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </a>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyFAQPage />
      </div>
    </ComponentErrorBoundary>
  )
}