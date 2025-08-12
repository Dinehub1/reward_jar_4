'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Target, 
  CreditCard, 
  TrendingUp, 
  Settings 
} from 'lucide-react'

/**
 * 📱 MOBILE BOTTOM NAVIGATION
 * 
 * Touch-optimized navigation for 70% mobile users
 * Replaces sidebar navigation on mobile devices
 */

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activePattern: string
}

const businessNavItems: NavItem[] = [
  {
    href: '/business/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    activePattern: '/business/dashboard'
  },
  {
    href: '/business/stamp-cards',
    label: 'Cards',
    icon: Target,
    activePattern: '/business/stamp-cards'
  },
  {
    href: '/business/memberships',
    label: 'Members',
    icon: CreditCard,
    activePattern: '/business/memberships'
  },
  {
    href: '/business/analytics',
    label: 'Analytics',
    icon: TrendingUp,
    activePattern: '/business/analytics'
  },
  {
    href: '/business/profile',
    label: 'Settings',
    icon: Settings,
    activePattern: '/business/profile'
  }
]

interface MobileBottomNavProps {
  className?: string
}

export default function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden ${className}`}>
      {/* Background with blur effect */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="grid grid-cols-5 h-16">
          {businessNavItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.activePattern)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center h-full"
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`mb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                {/* Label */}
                <span className={`text-xs font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>

                {/* Haptic feedback overlay */}
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  whileTap={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  transition={{ duration: 0.1 }}
                />
              </Link>
            )
          })}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  )
}

// Alternative version for admin users
export function AdminMobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()

  const adminNavItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: BarChart3,
      activePattern: '/admin'
    },
    {
      href: '/admin/businesses',
      label: 'Business',
      icon: Target,
      activePattern: '/admin/businesses'
    },
    {
      href: '/admin/cards',
      label: 'Cards',
      icon: CreditCard,
      activePattern: '/admin/cards'
    },
    {
      href: '/admin/customers',
      label: 'Customers',
      icon: TrendingUp,
      activePattern: '/admin/customers'
    },
    {
      href: '/admin/dev-tools',
      label: 'Tools',
      icon: Settings,
      activePattern: '/admin/dev-tools'
    }
  ]

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="grid grid-cols-5 h-16">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.activePattern)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center h-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="adminActiveTab"
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`mb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                <span className={`text-xs font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>

                <motion.div
                  className="absolute inset-0 rounded-lg"
                  whileTap={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  transition={{ duration: 0.1 }}
                />
              </Link>
            )
          })}
        </div>
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  )
}

// Hook to determine which navigation to show
export function useMobileNavigation() {
  const pathname = usePathname()
  
  if (pathname.startsWith('/admin')) {
    return AdminMobileBottomNav
  } else if (pathname.startsWith('/business')) {
    return MobileBottomNav
  }
  
  return null
}