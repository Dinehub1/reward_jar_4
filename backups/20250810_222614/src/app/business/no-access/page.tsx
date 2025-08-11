'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BusinessNoAccessPage() {
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

