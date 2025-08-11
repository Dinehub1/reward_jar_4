'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModernButton } from '@/components/modern/ui/ModernButton'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { getEnvironmentStatus } from '@/lib/env'
import { useState, useEffect } from 'react'

interface EnvironmentStatus {
  nodeEnv: string
  hasSupabaseUrl: boolean
  hasAnonKey: boolean
  hasServiceRoleKey: boolean | null
  walletAvailability: {
    apple: boolean
    google: boolean
    pwa: boolean
  }
  baseUrl: string
}

export function EnvironmentStatusCard() {
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkEnvironment = async () => {
    setIsRefreshing(true)
    try {
      // Get client-side environment status
      const clientStatus = getEnvironmentStatus()
      // Fetch server-side environment health (wallets) and environment check in parallel
      const [envRes, walletRes] = await Promise.all([
        fetch('/api/health/env'),
        fetch('/api/health/wallet')
      ])

      const env = envRes.ok ? await envRes.json() : null
      const wallet = walletRes.ok ? await walletRes.json() : null

      // Derive wallet availability from server
      const appleReady = !!(
        wallet?.wallets?.apple && 
        wallet.wallets.apple.configured && 
        wallet.wallets.apple.status === 'configured'
      )

      const googleReady = !!(
        wallet?.wallets?.google && 
        wallet.wallets.google.configured && 
        wallet.wallets.google.status === 'configured'
      )

      setEnvStatus({
        ...clientStatus,
        hasServiceRoleKey: env?.environment?.required?.['SUPABASE_SERVICE_ROLE_KEY']?.present || false,
        walletAvailability: {
          apple: appleReady,
          google: googleReady,
          pwa: true
        }
      })
    } catch (error) {
        console.error("Error:", error)
      } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  if (!envStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Environment Status
          </CardTitle>
          <CardDescription>Checking environment configuration...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean | null, label: string) => {
    if (status === null) return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Unknown</Badge>
    return status ? <Badge className="bg-green-100 text-green-800 border-green-300">✓ {label}</Badge> : <Badge variant="destructive">✗ Missing</Badge>
  }

  const criticalIssues = [
    !envStatus.hasSupabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !envStatus.hasAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    envStatus.hasServiceRoleKey === false && 'SUPABASE_SERVICE_ROLE_KEY'
  ].filter(Boolean) as string[]

  return (
    <Card className={criticalIssues.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {criticalIssues.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            Environment Status
          </div>
          <ModernButton
            variant="outline"
            size="sm"
            onClick={checkEnvironment}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </ModernButton>
        </CardTitle>
        <CardDescription>
          Current environment: <Badge variant="outline">{envStatus.nodeEnv}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Issues Alert */}
        {criticalIssues.length > 0 && (
          <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Critical Configuration Issues</h4>
                <div className="text-sm text-red-700 space-y-1">
                  <p>Missing required environment variables:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {criticalIssues.map((issue) => (
                      <li key={issue}><code className="bg-red-200 px-1 rounded text-xs">{issue}</code></li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-red-700">
                    💡 <strong>To fix:</strong> Add missing variables to your <code className="bg-red-200 px-1 rounded text-xs">.env.local</code> file
                  </p>
                  <div className="flex gap-2">
                    <ModernButton
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Supabase Dashboard
                    </ModernButton>
                    <ModernButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const envContent = `# Add these to your .env.local file
${!envStatus.hasSupabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here\n' : ''}${!envStatus.hasAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n' : ''}${envStatus.hasServiceRoleKey === false ? '# SUPABASE_SERVICE_ROLE_KEY=<set on server only, do NOT prefix with NEXT_PUBLIC>\n' : ''}`
                        navigator.clipboard.writeText(envContent)
                      }}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      📋 Copy Template
                    </ModernButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Environment Variables Status */}
        <div className="grid gap-3">
          <h4 className="font-medium text-sm text-gray-700">Core Configuration</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.hasSupabaseUrl)}
                <span>Supabase URL</span>
              </div>
              {getStatusBadge(envStatus.hasSupabaseUrl, 'Configured')}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.hasAnonKey)}
                <span>Anonymous Key</span>
              </div>
              {getStatusBadge(envStatus.hasAnonKey, 'Configured')}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.hasServiceRoleKey)}
                <span>Service Role Key</span>
                <span className="text-xs text-gray-500">(server-only)</span>
              </div>
              {envStatus.hasServiceRoleKey === null ? (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">Server Check</Badge>
              ) : (
                getStatusBadge(envStatus.hasServiceRoleKey, 'Configured')
              )}
            </div>
          </div>
        </div>

        {/* Wallet Availability */}
        <div className="grid gap-3">
          <h4 className="font-medium text-sm text-gray-700">Wallet Integration</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.walletAvailability.apple)}
                <span>Apple Wallet</span>
              </div>
              {getStatusBadge(envStatus.walletAvailability.apple, 'Ready')}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.walletAvailability.google)}
                <span>Google Wallet</span>
              </div>
              {getStatusBadge(envStatus.walletAvailability.google, 'Ready')}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(envStatus.walletAvailability.pwa)}
                <span>PWA Wallet</span>
              </div>
              {getStatusBadge(envStatus.walletAvailability.pwa, 'Ready')}
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="grid gap-2">
          <h4 className="font-medium text-sm text-gray-700">Base URL</h4>
          <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded font-mono">
            {envStatus.baseUrl}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}