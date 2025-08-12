'use client'

import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

function LegacyUseCasesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Use Cases</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-3">Restaurants & Cafes</h3>
          <p className="text-gray-600">Build customer loyalty with stamp cards for frequent diners.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-3">Retail Stores</h3>
          <p className="text-gray-600">Reward repeat customers with membership benefits and discounts.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-3">Gyms & Fitness</h3>
          <p className="text-gray-600">Track member visits and offer session-based rewards.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-3">Beauty Salons</h3>
          <p className="text-gray-600">Encourage repeat bookings with service-based loyalty cards.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-3">Auto Services</h3>
          <p className="text-gray-600">Build trust with maintenance tracking and loyalty rewards.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-3">Healthcare</h3>
          <p className="text-gray-600">Improve patient engagement with appointment-based rewards.</p>
        </div>
      </div>
    </div>
  )
}

export default function UseCasesPage() {
  return (
    <div className={modernStyles.layout.container}>
      <LegacyUseCasesPage />
    </div>
  )
}