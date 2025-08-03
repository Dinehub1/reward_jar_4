'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createClient } from '@/lib/supabase/client'

export default function TestDarkModePage() {
  const { theme, isDark } = useTheme()
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  // Admin authentication check
  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', user.id)
          .single()

        if (userData?.role_id !== 1) {
          router.push('/')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAdminAuth()
  }, [router])

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dark Mode Test</h1>
            <p className="text-muted-foreground">
              Current theme: <Badge variant="outline">{theme}</Badge> | 
              Dark mode: <Badge variant={isDark ? 'default' : 'secondary'}>{isDark ? 'ON' : 'OFF'}</Badge>
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Test Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Primary Card</CardTitle>
              <CardDescription>This is a primary card component</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-4">
                This card demonstrates the primary styling in both light and dark modes.
              </p>
              <Button className="w-full">Primary Button</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary Card</CardTitle>
              <CardDescription>This is a secondary card component</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This card shows muted text and secondary styling.
              </p>
              <Button variant="outline" className="w-full">Secondary Button</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accent Card</CardTitle>
              <CardDescription>This is an accent card component</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-4">
                This card demonstrates accent colors and styling.
              </p>
              <Button variant="destructive" className="w-full">Destructive Button</Button>
            </CardContent>
          </Card>
        </div>

        {/* Color Palette Test */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette Test</CardTitle>
            <CardDescription>All theme colors in action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-12 bg-background border border-border rounded"></div>
                <p className="text-xs text-muted-foreground">Background</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-card border border-border rounded"></div>
                <p className="text-xs text-muted-foreground">Card</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-primary rounded"></div>
                <p className="text-xs text-muted-foreground">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-secondary rounded"></div>
                <p className="text-xs text-muted-foreground">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-muted rounded"></div>
                <p className="text-xs text-muted-foreground">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-accent rounded"></div>
                <p className="text-xs text-muted-foreground">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-destructive rounded"></div>
                <p className="text-xs text-muted-foreground">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 border-2 border-ring rounded"></div>
                <p className="text-xs text-muted-foreground">Ring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Test</CardTitle>
            <CardDescription>Text colors and styling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Foreground Text</h2>
              <p className="text-muted-foreground">Muted foreground text for descriptions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Default Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="outline">Outline Badge</Badge>
              <Badge variant="destructive">Destructive Badge</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>All button styles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </AdminLayout>
  )
} 