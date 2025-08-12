'use client'

import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

function LegacyPricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Pricing</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6 bg-white">
          <h2 className="text-2xl font-semibold">Starter</h2>
          <p className="text-gray-600">Perfect for small businesses</p>
          <div className="mt-4">
            <span className="text-3xl font-bold">₹2,999</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="mt-6 space-y-2">
            <li>• Up to 1,000 customers</li>
            <li>• 5 card templates</li>
            <li>• Basic analytics</li>
            <li>• Email support</li>
          </ul>
        </div>
        <div className="rounded-xl border p-6 bg-blue-50 border-blue-200">
          <h2 className="text-2xl font-semibold">Professional</h2>
          <p className="text-gray-600">For growing businesses</p>
          <div className="mt-4">
            <span className="text-3xl font-bold">₹7,999</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="mt-6 space-y-2">
            <li>• Unlimited customers</li>
            <li>• Unlimited card templates</li>
            <li>• Advanced analytics</li>
            <li>• Priority support</li>
            <li>• Custom branding</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className={modernStyles.layout.container}>
      <LegacyPricingPage />
    </div>
  )
}