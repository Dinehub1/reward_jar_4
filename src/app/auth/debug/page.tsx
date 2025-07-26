'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UserData {
  id: string
  email: string
  role_id: number
}

interface BusinessData {
  id: string
  name: string
  owner_id: string
}

export default function AuthDebugPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('=== AUTH DEBUG START ===')

      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session:', session)
      console.log('Session Error:', sessionError)
      setSession(session)

      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('User:', user)
      console.log('User Error:', userError)
      setUser(user)

      if (!user) {
        setError('No authenticated user found')
        return
      }

      // Check user data in users table
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, email, role_id')
        .eq('id', user.id)
        .single()

      console.log('User Data from users table:', userData)
      console.log('User Data Error:', userDataError)
      setUserData(userData)

      if (userDataError) {
        setError(`User data error: ${userDataError.message}`)
        return
      }

      // If role_id is 2, check business data
      if (userData?.role_id === 2) {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, owner_id')
          .eq('owner_id', user.id)
          .single()

        console.log('Business Data:', businessData)
        console.log('Business Error:', businessError)
        setBusinessData(businessData)

        if (businessError) {
          setError(`Business data error: ${businessError.message}`)
        }
      }

      console.log('=== AUTH DEBUG END ===')

    } catch (err) {
      console.error('Debug error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Authentication Debug</h1>
          <p className="text-gray-600 mt-2">Check your current authentication status</p>
        </div>

        <div className="flex justify-center space-x-4">
          <Button onClick={checkAuthStatus} disabled={loading}>
            {loading ? 'Checking...' : 'Refresh Auth Status'}
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>Current session state from getSession()</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</div>
                {session && (
                  <>
                    <div><strong>User ID:</strong> {session.user?.id}</div>
                    <div><strong>Email:</strong> {session.user?.email}</div>
                    <div><strong>Expires At:</strong> {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Current user state from getUser()</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Has User:</strong> {user ? 'Yes' : 'No'}</div>
                {user && (
                  <>
                    <div><strong>User ID:</strong> {user.id}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</div>
                    <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database User Data */}
          <Card>
            <CardHeader>
              <CardTitle>User Database Record</CardTitle>
              <CardDescription>User data from the users table</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Found in Database:</strong> {userData ? 'Yes' : 'No'}</div>
                {userData && (
                  <>
                    <div><strong>Role ID:</strong> {userData.role_id}</div>
                    <div><strong>Role Name:</strong> {userData.role_id === 2 ? 'Business' : userData.role_id === 3 ? 'Customer' : 'Unknown'}</div>
                    <div><strong>Database Email:</strong> {userData.email}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Data */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Business data (if user is business owner)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {userData?.role_id === 2 ? (
                  <>
                    <div><strong>Is Business User:</strong> Yes</div>
                    <div><strong>Has Business:</strong> {businessData ? 'Yes' : 'No'}</div>
                    {businessData && (
                      <>
                        <div><strong>Business ID:</strong> {businessData.id}</div>
                        <div><strong>Business Name:</strong> {businessData.name}</div>
                        <div><strong>Owner ID Match:</strong> {businessData.owner_id === userData.id ? 'Yes' : 'No'}</div>
                      </>
                    )}
                  </>
                ) : (
                  <div><strong>Is Business User:</strong> No (role_id: {userData?.role_id})</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Raw Data (for debugging) */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Data (for debugging)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-xs font-mono">
              <div>
                <strong>Session:</strong>
                <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
              <div>
                <strong>User:</strong>
                <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div>
                <strong>User Data:</strong>
                <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Business Data:</strong>
                <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(businessData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={() => window.location.href = '/business/dashboard'}>
            Try Business Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
} 