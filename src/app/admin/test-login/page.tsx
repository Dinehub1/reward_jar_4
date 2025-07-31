'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TestLoginPage() {
  const [email, setEmail] = useState('isabellagarcia@protonmail.com') // One of the test users
  const [password, setPassword] = useState('password123') // Default password
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🔐 Test Login: Attempting login with:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(`Login failed: ${error.message}`)
        console.error('🔐 Test Login: Error:', error)
        return
      }

      console.log('🔐 Test Login: Success:', data)
      setResult(`Login successful! User ID: ${data.user?.id}`)
      
      // Wait a moment then redirect to admin
      setTimeout(() => {
        router.push('/admin/cards/new')
      }, 2000)
      
    } catch (error) {
      setResult(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('🔐 Test Login: Exception:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteToAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/promote-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      setResult(`Promote result: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setResult(`Promote error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Admin Login</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handlePromoteToAdmin}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Working...' : '1. Promote to Admin'}
          </button>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Working...' : '2. Login & Go to Admin'}
          </button>
        </div>
        
        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}