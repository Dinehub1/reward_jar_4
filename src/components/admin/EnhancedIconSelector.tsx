'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Smile, 
  Upload, 
  Grid3X3, 
  Coffee, 
  UtensilsCrossed, 
  Dumbbell, 
  Sparkles, 
  ShoppingBag,
  Car,
  Briefcase,
  Heart,
  Home,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconUpload } from './IconUpload'
import { cn } from '@/lib/utils'

interface EnhancedIconSelectorProps {
  selectedIcon: string
  onIconSelect: (icon: string, isCustom?: boolean, customUrl?: string) => void
  currentCustomIcon?: string
  className?: string
}

// Emoji icons organized by category
const EMOJI_CATEGORIES = {
  food_beverage: {
    name: 'Food & Beverage',
    icon: Coffee,
    emojis: ['☕', '🧋', '🍵', '🥤', '🍺', '🍷', '🥂', '🍞', '🥐', '🧇', '🥞', '🍳', '🥓', '🍔', '🍟', '🌭', '🍕', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍤', '🍙', '🍘', '🍱', '🍧', '🍨', '🍰', '🧁', '🍪', '🍫', '🍬', '🍭']
  },
  fitness: {
    name: 'Fitness & Gym',
    icon: Dumbbell,
    emojis: ['🏋️', '🤸', '🧘', '🏃', '🚴', '🏊', '⛹️', '🏀', '⚽', '🎾', '🏐', '🏈', '⚾', '🥎', '🎱', '🏓', '🏸', '🥊', '🥋', '🤺', '⛷️', '🏂', '🤿', '🏄', '🚣', '⛵', '🏇']
  },
  beauty_wellness: {
    name: 'Beauty & Wellness',
    icon: Sparkles,
    emojis: ['💅', '💄', '💋', '👄', '💆', '💇', '🧖', '🧴', '🪒', '✂️', '💎', '💍', '👑', '🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🍃', '✨', '⭐', '🌟', '💫', '🔮', '🪬']
  },
  retail: {
    name: 'Retail & Shopping',
    icon: ShoppingBag,
    emojis: ['🛍️', '👗', '👚', '👖', '👔', '👕', '👘', '👙', '👠', '👡', '👢', '👞', '👟', '🧳', '👜', '👛', '🎒', '👝', '💼', '🛒', '💳', '💰', '💸', '🏪', '🏬', '🏢', '🎁']
  },
  automotive: {
    name: 'Automotive',
    icon: Car,
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🏍️', '🛵', '🚲', '🛴', '🛞', '⛽', '🔧', '🔨', '⚙️', '🛠️', '🚧', '⚠️']
  },
  business: {
    name: 'Business & Professional',
    icon: Briefcase,
    emojis: ['💼', '🏢', '🏦', '🏪', '🏬', '🏭', '🏛️', '💻', '⌨️', '🖥️', '📱', '☎️', '📞', '📠', '📧', '📨', '📩', '📤', '📥', '📮', '📪', '📫', '📬', '📭', '📦', '📋', '📊', '📈', '📉', '💹', '💱', '💲']
  },
  health: {
    name: 'Health & Medical',
    icon: Heart,
    emojis: ['❤️', '💊', '💉', '🩺', '🩹', '🧬', '🔬', '⚕️', '🏥', '🚑', '🦷', '👓', '🕶️', '🧪', '⚗️', '🧯', '📊', '📋', '🩻', '🫀', '🧠', '👁️', '🦴', '🩸']
  },
  home_services: {
    name: 'Home & Services',
    icon: Home,
    emojis: ['🏠', '🏡', '🏘️', '🏗️', '🔨', '🔧', '🪚', '🔩', '⚙️', '🛠️', '🪛', '🔌', '💡', '🕯️', '🪟', '🚪', '🛏️', '🛋️', '🪑', '🚿', '🛁', '🚽', '🧹', '🧽', '🧴', '🧯', '🔥']
  }
}

// Category-based icon sets
const CATEGORY_ICONS = {
  food_beverage: [
    { icon: '🍽️', name: 'Restaurant' },
    { icon: '☕', name: 'Coffee' },
    { icon: '🍕', name: 'Pizza' },
    { icon: '🍔', name: 'Burger' },
    { icon: '🍜', name: 'Noodles' },
    { icon: '🍰', name: 'Bakery' },
    { icon: '🍺', name: 'Bar' },
    { icon: '🧋', name: 'Bubble Tea' }
  ],
  fitness: [
    { icon: '🏋️', name: 'Gym' },
    { icon: '🧘', name: 'Yoga' },
    { icon: '🏃', name: 'Running' },
    { icon: '🚴', name: 'Cycling' },
    { icon: '🏊', name: 'Swimming' },
    { icon: '⚽', name: 'Sports' },
    { icon: '🥊', name: 'Boxing' },
    { icon: '🤸', name: 'Fitness' }
  ],
  beauty_wellness: [
    { icon: '💅', name: 'Nail Salon' },
    { icon: '💇', name: 'Hair Salon' },
    { icon: '💆', name: 'Spa' },
    { icon: '✂️', name: 'Barber' },
    { icon: '💄', name: 'Makeup' },
    { icon: '🧖', name: 'Beauty' },
    { icon: '🌸', name: 'Wellness' },
    { icon: '✨', name: 'Treatments' }
  ],
  retail: [
    { icon: '🛍️', name: 'Shopping' },
    { icon: '👗', name: 'Fashion' },
    { icon: '👟', name: 'Shoes' },
    { icon: '👜', name: 'Accessories' },
    { icon: '💍', name: 'Jewelry' },
    { icon: '🎁', name: 'Gifts' },
    { icon: '📱', name: 'Electronics' },
    { icon: '🏪', name: 'Store' }
  ]
}

export function EnhancedIconSelector({ 
  selectedIcon, 
  onIconSelect, 
  currentCustomIcon,
  className 
}: EnhancedIconSelectorProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'category' | 'custom'>('emoji')
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('food_beverage')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter emojis based on search
  const filteredEmojis = searchQuery 
    ? EMOJI_CATEGORIES[selectedCategory].emojis.filter(emoji => 
        // Simple search - you could enhance this with emoji names/descriptions
        emoji.includes(searchQuery)
      )
    : EMOJI_CATEGORIES[selectedCategory].emojis

  const handleCustomIconUpload = (iconUrl: string, publicUrl: string) => {
    onIconSelect(iconUrl, true, publicUrl)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emoji" className="flex items-center gap-2">
            <Smile className="h-4 w-4" />
            Emoji
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Category
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emoji" className="space-y-4">
          {/* Category Selection */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => {
              const IconComponent = category.icon
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key as keyof typeof EMOJI_CATEGORIES)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {category.name}
                </Button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
            <AnimatePresence>
              {filteredEmojis.map((emoji, index) => (
                <motion.button
                  key={`${emoji}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onIconSelect(emoji)}
                  className={cn(
                    'aspect-square flex items-center justify-center text-2xl rounded-lg transition-all hover:bg-gray-100',
                    selectedIcon === emoji && 'bg-blue-100 ring-2 ring-blue-500'
                  )}
                >
                  {emoji}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="text-sm text-gray-600">
            Choose from curated icons for different business types
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(CATEGORY_ICONS).map(([category, icons]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 capitalize">
                  {category.replace('_', ' ')}
                </h4>
                <div className="grid grid-cols-4 gap-1">
                  {icons.map((iconData) => (
                    <button
                      key={iconData.name}
                      onClick={() => onIconSelect(iconData.icon)}
                      className={cn(
                        'aspect-square flex items-center justify-center text-lg rounded-lg transition-all hover:bg-gray-100',
                        selectedIcon === iconData.icon && 'bg-blue-100 ring-2 ring-blue-500'
                      )}
                      title={iconData.name}
                    >
                      {iconData.icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="text-sm text-gray-600">
            Upload your own custom icon for a unique brand experience
          </div>
          
          <IconUpload
            onIconUploaded={handleCustomIconUpload}
            currentIcon={currentCustomIcon}
            bucketName="card-icons"
            path="business-icons"
          />
        </TabsContent>
      </Tabs>

      {/* Current Selection Preview */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-2xl">
          {currentCustomIcon && selectedIcon === currentCustomIcon ? (
            <img src={currentCustomIcon} alt="Custom icon" className="w-full h-full object-cover rounded-lg" />
          ) : (
            selectedIcon
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Selected Icon</p>
          <p className="text-xs text-gray-500">
            {currentCustomIcon && selectedIcon === currentCustomIcon ? 'Custom Upload' : 'Emoji/Category'}
          </p>
        </div>
      </div>
    </div>
  )
}