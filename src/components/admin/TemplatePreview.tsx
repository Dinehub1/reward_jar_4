'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardLivePreview } from '@/components/unified/CardLivePreview'
import { IPhone15Frame } from '@/components/modern/preview/iPhone15Frame'
import { cn } from '@/lib/utils'

interface TemplatePreviewProps {
  template: {
    id: string
    name: string
    description: string
    industry: string
    variants: {
      stamp?: any
      membership?: any
    }
  }
  cardType: 'stamp' | 'membership'
  selected?: boolean
  onSelect?: () => void
  showPreview?: boolean
  className?: string
}

export function TemplatePreview({
  template,
  cardType,
  selected = false,
  onSelect,
  showPreview = true,
  className
}: TemplatePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'card' | 'device'>('card')
  const [showDetails, setShowDetails] = useState(false)

  const variant = template.variants[cardType]
  if (!variant) return null

  // Generate preview card data from template variant
  const previewCardData = useMemo(() => ({
    cardType,
    cardName: `${template.name} ${cardType === 'stamp' ? 'Card' : 'Membership'}`,
    businessName: `Sample ${template.name}`,
    businessLogoUrl: '',
    reward: variant.reward || 'Sample Reward',
    rewardDescription: variant.rewardDescription || 'Sample reward description',
    stampsRequired: variant.stampsRequired || 10,
    totalSessions: variant.totalSessions || 10,
    cardColor: variant.cardColor || '#8B4513',
    iconEmoji: variant.iconEmoji || '⭐',
    cardDescription: variant.cardDescription || 'Sample card description',
    howToEarnStamp: variant.howToEarnStamp || 'Sample earning instructions',
    rewardDetails: variant.rewardDetails || 'Sample reward details'
  }), [template, variant, cardType])

  return (
    <motion.div
      layout
      className={cn(
        'group relative overflow-hidden rounded-xl border-2 transition-all duration-200',
        selected 
          ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500/20' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {template.name}
              </h3>
              <Badge variant="outline" className="text-xs capitalize">
                {template.industry.replace('_', ' ')}
              </Badge>
              <Badge variant={cardType === 'stamp' ? 'default' : 'secondary'} className="text-xs">
                {cardType}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="text-lg">{variant.iconEmoji}</span>
                {variant.iconEmoji}
              </span>
              {cardType === 'stamp' && (
                <span>{variant.stampsRequired} stamps</span>
              )}
              {cardType === 'membership' && (
                <span>{variant.totalSessions} sessions</span>
              )}
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: variant.cardColor }} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showPreview && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-8 w-8 p-0"
                >
                  {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={previewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('card')}
                    className="h-6 px-2 text-xs"
                  >
                    <Monitor className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={previewMode === 'device' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('device')}
                    className="h-6 px-2 text-xs"
                  >
                    <Smartphone className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      {showPreview && showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-b border-gray-100"
        >
          <div className="p-4">
            {previewMode === 'device' ? (
              <div className="flex justify-center">
                <div className="scale-75 origin-center">
                  <IPhone15Frame
                    variant="natural"
                    interactive={false}
                    showReflection={false}
                  >
                    <div className="w-full h-full flex items-center justify-center pt-4">
                      <div className="scale-90">
                        <CardLivePreview
                          cardData={previewCardData}
                          defaultPlatform="apple"
                          showControls={false}
                          className="shadow-none"
                        />
                      </div>
                    </div>
                  </IPhone15Frame>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <CardLivePreview
                  cardData={previewCardData}
                  defaultPlatform="apple"
                  showControls={false}
                  className="max-w-sm"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Template Details */}
      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-4 bg-gray-50 text-sm"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Template Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• {variant.designConfig?.brandLevel || 'Standard'} branding</li>
                <li>• {variant.designConfig?.iconStyle || 'Emoji'} icon style</li>
                {variant.designConfig?.gridLayout && (
                  <li>• {variant.designConfig.gridLayout.columns}×{variant.designConfig.gridLayout.rows} grid</li>
                )}
                {variant.designConfig?.countdownSettings?.showExpiry && (
                  <li>• Expiry countdown</li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Business Type</h4>
              <p className="text-gray-600 capitalize mb-2">
                {template.industry.replace('_', ' ')}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {cardType === 'stamp' ? 'Loyalty Program' : 'Membership'}
                </Badge>
                {variant.stampConfig?.billProofRequired && (
                  <Badge variant="outline" className="text-xs">Bill Required</Badge>
                )}
                {variant.membershipMode && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {variant.membershipMode}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Selection Overlay */}
      {onSelect && (
        <button
          onClick={onSelect}
          className="absolute inset-0 w-full h-full bg-transparent hover:bg-blue-500/5 transition-colors"
        >
          <span className="sr-only">Select {template.name} template</span>
        </button>
      )}

      {/* Selection Indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <div className="w-3 h-3 bg-white rounded-full" />
        </motion.div>
      )}
    </motion.div>
  )
}

// Grid layout for multiple template previews
interface TemplatePreviewGridProps {
  templates: any[]
  cardType: 'stamp' | 'membership'
  selectedTemplate?: string
  onTemplateSelect?: (templateId: string) => void
  showPreviews?: boolean
  className?: string
}

export function TemplatePreviewGrid({
  templates,
  cardType,
  selectedTemplate,
  onTemplateSelect,
  showPreviews = true,
  className
}: TemplatePreviewGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4',
      className
    )}>
      {templates.map((template) => (
        <TemplatePreview
          key={template.id}
          template={template}
          cardType={cardType}
          selected={selectedTemplate === template.id}
          onSelect={() => onTemplateSelect?.(template.id)}
          showPreview={showPreviews}
        />
      ))}
    </div>
  )
}