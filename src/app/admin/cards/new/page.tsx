'use client'

import React, { Suspense } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useAdminBusinesses } from '@/lib/hooks/use-admin-data'
import dynamic from 'next/dynamic'

// Dynamic import for the unified card creation page
const UnifiedCardCreationPage = dynamic(
  () => import('./unified-page'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading card creation...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

interface Business {
  id: string
  name: string
  contact_email: string
  description?: string
  logo_url?: string
}

function NewCardPageContent() {
  const { data: businesses, isLoading, error } = useAdminBusinesses()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading businesses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ Error loading businesses</div>
          <p className="text-gray-600">Please refresh the page to try again</p>
        </div>
      </div>
    )
  }

  // Transform businesses data to match expected interface
  const businessList = businesses?.success ? businesses.data : []
  const transformedBusinesses: Business[] = (businessList || []).map((business: any) => ({
    id: business.id,
    name: business.name,
    contact_email: business.contact_email || '',
    description: business.description || undefined,
    logo_url: undefined // Add logo_url field when available
  }))

  return (
    <ErrorBoundary>
      <UnifiedCardCreationPage businesses={transformedBusinesses} />
    </ErrorBoundary>
  )
}

export default function NewCardPage() {
  return (
    <AdminLayoutClient>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <NewCardPageContent />
      </Suspense>
    </AdminLayoutClient>
  )
}