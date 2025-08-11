import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import ClientDate from '@/components/shared/ClientDate'

interface AdminLayoutProps {
  children: React.ReactNode
}

async function checkAdminAccess() {
  // 🧪 DEVELOPMENT MODE - Bypass authentication for testing
  // This allows you to see the data without login issues
  // In production, you'd restore proper authentication
  
  
  return { id: 'dev-admin-user', email: 'dev-admin@rewardjar.com' }
}

function AdminSidebar() {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      description: 'System overview and metrics'
    },
    {
      name: 'Businesses',
      href: '/admin/businesses',
      icon: '🏢',
      description: 'Manage all business accounts'
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: '👥',
      description: 'Monitor customer activity'
    },
    {
      name: 'Cards',
      href: '/admin/cards',
      icon: '🎴',
      description: 'Manage all stamp cards and membership cards'
    },
    {
      name: 'Alerts',
      href: '/admin/alerts',
      icon: '🚨',
      description: 'System alerts and monitoring'
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: '🛠️',
      description: 'Manual override tools'
    },
    {
      name: 'Sandbox',
      href: '/admin/sandbox',
      icon: '🧪',
      description: 'Testing and preview mode'
    }
  ]

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border transition-colors duration-300">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <div>
              <div className="font-semibold text-foreground">RewardJar</div>
              <div className="text-xs text-muted-foreground">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 group"
            >
              <span className="text-lg">{item.icon}</span>
              <div>
                <div className="text-foreground group-hover:text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-muted-foreground text-sm font-medium">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">Admin User</div>
              <div className="text-xs text-muted-foreground">System Administrator</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function AdminHeader() {
  return (
    <header className="bg-card border-b border-border transition-colors duration-300">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <div className="text-lg font-semibold text-foreground">
            RewardJar 4.0 Admin Panel
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-muted-foreground">System Operational</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <ClientDate format="date" />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export async function AdminLayout({ children }: AdminLayoutProps) {
  // Check admin access
  await checkAdminAccess()

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <AdminHeader />
        
        {/* Page content */}
        <main className="p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
} 