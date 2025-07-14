'use client'

import { validateEnvVars } from '@/lib/env-check'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, Copy } from 'lucide-react'
import Link from 'next/link'

export default function SetupPage() {
  const envStatus = validateEnvVars()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exampleEnv = `# Required - Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional - For development
BASE_URL=http://localhost:3000`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">RewardJar Setup</h1>
          <p className="mt-2 text-gray-600">
            Configure your environment to get started with RewardJar
          </p>
        </div>

        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {envStatus.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              Environment Variables
            </CardTitle>
            <CardDescription>
              {envStatus.isValid 
                ? 'All required environment variables are configured!' 
                : 'Some required environment variables are missing.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Required Variables */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Required Variables</h4>
                <div className="space-y-2">
                  {Object.entries(envStatus.required).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-mono text-sm">{key}</span>
                      <div className="flex items-center">
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="ml-2 text-sm">
                          {value ? 'Set' : 'Missing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Variables */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Optional Variables</h4>
                <div className="space-y-2">
                  {Object.entries(envStatus.optional).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-mono text-sm">{key}</span>
                      <div className="flex items-center">
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="ml-2 text-sm">
                          {value ? 'Set' : 'Not set'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Variables Alert */}
              {!envStatus.isValid && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Missing Required Variables
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Please set the following environment variables:</p>
                        <ul className="list-disc list-inside mt-1">
                          {envStatus.missing.map((key) => (
                            <li key={key} className="font-mono">{key}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Setup Guide</CardTitle>
            <CardDescription>
              Follow these steps to configure your RewardJar application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Supabase Project</h3>
                  <p className="mt-1 text-gray-600">
                    Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a> and create a new project.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Get API Keys</h3>
                  <p className="mt-1 text-gray-600">
                    From your Supabase project dashboard, go to Settings → API to find your URL and keys.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Environment File</h3>
                  <p className="mt-1 text-gray-600">
                    Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root:
                  </p>
                  <div className="mt-2 bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(exampleEnv)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <pre className="whitespace-pre-wrap">{exampleEnv}</pre>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Set Up Database</h3>
                  <p className="mt-1 text-gray-600">
                    Follow the SQL setup instructions to create your database schema.
                  </p>
                  <Link href="/doc/SUPABASE_SETUP.md" target="_blank">
                    <Button variant="outline" className="mt-2">
                      View Database Setup Guide
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Refresh Status
          </Button>
          {envStatus.isValid ? (
            <Link href="/auth/signup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started →
              </Button>
            </Link>
          ) : (
            <Button disabled className="bg-gray-400">
              Complete Setup First
            </Button>
          )}
        </div>

        {/* Development Note */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Development Mode
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You can still test the UI components without a Supabase connection, 
                    but authentication and data features will not work.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 