'use client'

import { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, ShieldCheck, ShieldAlert, Users, Settings, Eye, QrCode } from 'lucide-react'

interface ManagerPermissions {
  add_stamps: boolean
  redeem_rewards: boolean
  view_analytics: boolean
  generate_qr: boolean
  view_customer_data: boolean
}

interface ManagerModeToggleProps {
  userId: string
  businessId?: string
  onToggle: (isManagerMode: boolean, permissions: ManagerPermissions) => void
  className?: string
}

interface PermissionDisplay {
  key: keyof ManagerPermissions
  label: string
  description: string
  icon: React.ReactNode
  restrictedFeatures: string[]
}

const permissionDisplayConfig: PermissionDisplay[] = [
  {
    key: 'add_stamps',
    label: 'Add Stamps',
    description: 'Add stamps with bill amount tracking',
    icon: <QrCode className="w-4 h-4" />,
          restrictedFeatures: ['Cannot create new cards', 'Cannot modify card templates']
  },
  {
    key: 'redeem_rewards',
    label: 'Redeem Rewards', 
    description: 'Process customer reward redemptions',
    icon: <Shield className="w-4 h-4" />,
    restrictedFeatures: ['Cannot modify reward structures', 'Cannot delete redemption history']
  },
  {
    key: 'view_analytics',
    label: 'View Analytics',
    description: 'Access customer and card analytics',
    icon: <Eye className="w-4 h-4" />,
    restrictedFeatures: ['Cannot access financial analytics', 'Cannot view revenue data']
  },
  {
    key: 'generate_qr',
    label: 'Generate QR Codes',
    description: 'Create QR codes for locations',
    icon: <QrCode className="w-4 h-4" />,
    restrictedFeatures: ['Cannot modify QR code settings', 'Cannot delete existing codes']
  },
  {
    key: 'view_customer_data',
    label: 'View Customer Data',
    description: 'Access customer card details',
    icon: <Users className="w-4 h-4" />,
    restrictedFeatures: ['Cannot delete customer data', 'Cannot export customer lists']
  }
]

export default function ManagerModeToggle({ 
  userId, 
  businessId, 
  onToggle, 
  className = '' 
}: ManagerModeToggleProps) {
  const [isManagerMode, setIsManagerMode] = useState(false)
  const [permissions, setPermissions] = useState<ManagerPermissions>({
    add_stamps: false,
    redeem_rewards: false,
    view_analytics: false,
    generate_qr: false,
    view_customer_data: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPermissionsDetail, setShowPermissionsDetail] = useState(false)

  // Fetch manager permissions from database
  const fetchManagerPermissions = useCallback(async () => {
    if (!userId || !businessId) {
      console.warn('Missing userId or businessId for manager permissions fetch')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual MCP integration
      // const mcpResponse = await fetch('/mcp/query', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     table: 'manager_permissions',
      //     query: 'SELECT permissions FROM manager_permissions WHERE user_id = $1 AND business_id = $2',
      //     params: [userId, businessId]
      //   })
      // })

      // if (!mcpResponse.ok) {
      //   throw new Error('Failed to fetch manager permissions')
      // }

      // const result = await mcpResponse.json()
      // const userPermissions = result.data?.[0]?.permissions || []

      // Mock permissions based on documentation (would come from MCP query in production)
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      
      const mockPermissions: ManagerPermissions = {
        add_stamps: true,
        redeem_rewards: true,
        view_analytics: true,
        generate_qr: true,
        view_customer_data: true
      }

      setPermissions(mockPermissions)
      
      // If user has any permissions, they can use manager mode
      const hasPermissions = Object.values(mockPermissions).some(permission => permission)
      if (!hasPermissions) {
        setError('No manager permissions found for this user')
      }

    } catch (error) {
      console.error('Error fetching manager permissions:', error)
      setError('Failed to load manager permissions')
    } finally {
      setIsLoading(false)
    }
  }, [userId, businessId])

  useEffect(() => {
    fetchManagerPermissions()
  }, [fetchManagerPermissions])

  const handleToggle = (checked: boolean) => {
    setIsManagerMode(checked)
    onToggle(checked, permissions)
    
    // Show permissions detail when enabling manager mode
    if (checked) {
      setShowPermissionsDetail(true)
      // Auto-hide after 5 seconds
      setTimeout(() => setShowPermissionsDetail(false), 5000)
    } else {
      setShowPermissionsDetail(false)
    }
  }

  const getPermissionCount = () => {
    return Object.values(permissions).filter(Boolean).length
  }

  const getPermissionStatus = () => {
    const count = getPermissionCount()
    if (count === 0) return { label: 'No Permissions', color: 'bg-red-100 text-red-800', icon: <ShieldAlert className="w-3 h-3" /> }
    if (count <= 2) return { label: 'Limited Access', color: 'bg-yellow-100 text-yellow-800', icon: <Shield className="w-3 h-3" /> }
    return { label: 'Full Manager Access', color: 'bg-green-100 text-green-800', icon: <ShieldCheck className="w-3 h-3" /> }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-10 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Loading permissions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  const permissionStatus = getPermissionStatus()

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Manager Mode</span>
          </div>
          
          <Badge 
            variant="secondary" 
            className={`text-xs ${permissionStatus.color} border-0`}
          >
            <span className="flex items-center space-x-1">
              {permissionStatus.icon}
              <span>{permissionStatus.label}</span>
            </span>
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={isManagerMode}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-green-600"
            disabled={getPermissionCount() === 0}
          />
          
          <button
            onClick={() => setShowPermissionsDetail(!showPermissionsDetail)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="View permissions details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      {isManagerMode && (
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 font-medium">Manager mode active</span>
          <span className="text-gray-500">({getPermissionCount()} permissions enabled)</span>
        </div>
      )}

      {/* Permissions Detail Panel */}
      {showPermissionsDetail && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Manager Permissions</h4>
                <button
                  onClick={() => setShowPermissionsDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Allowed Permissions */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-green-800">Allowed Actions</h5>
                <div className="grid grid-cols-1 gap-2">
                  {permissionDisplayConfig.map((config) => {
                    const isAllowed = permissions[config.key]
                    return (
                      <div
                        key={config.key}
                        className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                          isAllowed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span className={isAllowed ? 'text-green-600' : 'text-gray-400'}>
                          {config.icon}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium">{config.label}</span>
                            {isAllowed && (
                              <ShieldCheck className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs opacity-75">{config.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Restrictions */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-red-800">Restrictions</h5>
                <div className="space-y-1">
                  <div className="text-xs text-red-700 bg-red-100 p-2 rounded-lg">
                    <ul className="space-y-1">
                      <li>• Cannot create new cards</li>
                      <li>• Cannot modify business profile</li>
                      <li>• Cannot access financial analytics (revenue data)</li>
                      <li>• Cannot delete customer data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-xs text-gray-600 border-t border-green-200 pt-2">
                <p>All manager actions are logged for business owner review.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 