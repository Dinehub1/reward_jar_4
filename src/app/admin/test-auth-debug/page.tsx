'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/lib/hooks/use-admin-auth'

export default function TestAuthDebugPage() {
  const { isAdmin, isLoading, user, error } = useAdminAuth(false) // Don't require auth for testing
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    // Test the auth-check API directly
    async function testAuthAPI() {
      try {
        const response = await fetch('/api/admin/auth-check', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (!response.ok) {
          setApiError(`API returned ${response.status}: ${response.statusText}`)
          return
        }
        
        const result = await response.json()
        setApiResponse(result)
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    testAuthAPI()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Auth Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* useAdminAuth Hook Results */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">useAdminAuth Hook</h2>
          <div className="space-y-2 text-sm">
            <div><strong>isLoading:</strong> {isLoading.toString()}</div>
            <div><strong>isAdmin:</strong> {isAdmin.toString()}</div>
            <div><strong>user:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</div>
            <div><strong>error:</strong> {error || 'null'}</div>
          </div>
        </div>

        {/* API Response */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Auth-Check API Response</h2>
          <div className="space-y-2 text-sm">
            {apiError ? (
              <div className="text-red-600">
                <strong>API Error:</strong> {apiError}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Admin User Creation Helper */}
      <div className="mt-8 border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Admin User Helper</h2>
        <p className="text-sm text-gray-600 mb-4">
          If you need to create an admin user, use the promote-user endpoint:
        </p>
        <code className="text-xs bg-gray-100 p-2 rounded block">
          curl -X POST http://localhost:3001/api/admin/promote-user -H "Content-Type: application/json" -d '{"{"email":"your-email@example.com"}"}'
        </code>
      </div>
    </div>
  )
}