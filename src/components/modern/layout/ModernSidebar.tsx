'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { designTokens } from '@/lib/design-tokens'
import { 
  BarChart3,
  Building2, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface MenuItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

interface ModernSidebarProps {
  className?: string
}

// Modern menu items with consistent Lucide icons
const menuItems: MenuItem[] = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: BarChart3,
    description: 'System overview and metrics'
  },
  { 
    href: '/admin/businesses', 
    label: 'Businesses', 
    icon: Building2,
    description: 'Manage all business accounts'
  },
  { 
    href: '/admin/customers', 
    label: 'Customers', 
    icon: Users,
    description: 'Monitor customer activity'
  },
  { 
    href: '/admin/cards', 
    label: 'Cards', 
    icon: CreditCard,
    description: 'Manage stamp and membership cards'
  },
  { 
    href: '/admin/alerts', 
    label: 'Alerts', 
    icon: AlertTriangle,
    description: 'System alerts and monitoring'
  },
  { 
    href: '/admin/support', 
    label: 'Support', 
    icon: MessageSquare,
    description: 'Customer support tools'
  },
  { 
    href: '/admin/dev-tools', 
    label: 'Developer Tools', 
    icon: Settings,
    description: 'Development and testing tools'
  }
]

// Modern Navigation Item Component
function NavItem({ item, collapsed, isActive, index }: { 
  item: MenuItem
  collapsed: boolean
  isActive: boolean
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.3,
        ease: designTokens.animation.easing.out
      }}
      className="relative"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Link
          prefetch={false}
          href={item.href}
          className={`
            flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
            ${isActive 
              ? 'bg-accent/20 text-foreground border-l-4 border-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
            }
          `}
        >
          <motion.div
            animate={{ rotate: isHovered ? 5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </motion.div>
          
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-tight">
                  {item.description}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Active indicator */}
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full"
            />
          )}
        </Link>
      </motion.div>
      
      {/* Tooltip for collapsed state */}
      {collapsed && isHovered && (
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.9 }}
          className="absolute left-16 top-1/2 transform -translate-y-1/2 z-50"
          style={{ boxShadow: designTokens.shadows.xl }}
        >
          <div className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap border border-slate-600">
            <div className="font-medium">{item.label}</div>
            <div className="text-xs text-slate-300 mt-1">{item.description}</div>
            {/* Tooltip arrow */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-600 rotate-45" />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Main Modern Sidebar Component
export function ModernSidebar({ className = '' }: ModernSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ width: 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ 
        duration: 0.3, 
        ease: designTokens.animation.easing.inOut 
      }}
      className={`
        relative min-h-screen border-r border-border/50 ${className}
        bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
      `}
    >
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}
        aria-hidden
      />
      
      {/* Header Section */}
      <motion.div className="relative z-10 p-6 border-b border-slate-700/50">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-white font-bold text-lg">R</span>
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    RewardJar
                  </h2>
                  <div className="text-xs text-slate-400 mt-0.5">Admin Panel</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <motion.div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white font-bold text-lg">R</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Navigation Section */}
      <nav className="relative z-10 px-4 py-6 space-y-2">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={isActive}
              index={index}
            />
          )
        })}
      </nav>
      
      {/* Collapse Toggle Button */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center border border-slate-600 transition-colors duration-200 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ boxShadow: designTokens.shadows.md }}
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft className="w-3 h-3 text-slate-300" />
        </motion.div>
      </motion.button>
      
      {/* Bottom Gradient Fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #0f172a, transparent)'
        }}
      />
    </motion.aside>
  )
}

export default ModernSidebar