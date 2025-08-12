'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

function LegacyBusinessNoAccessPage() {
  const router = useRouter()
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle>Admin‑Only Feature</CardTitle>
          <CardDescription>
            Card creation and editing are restricted to RewardJar Admins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you need a new card or changes to an existing one, please contact support.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/business/dashboard')}>Back to Dashboard</Button>
            <Link href="/support" className="ml-auto">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


export default function BusinessNoAccessPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Access Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the no access</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyBusinessNoAccessPage />
      </div>
    </ComponentErrorBoundary>
  )
}