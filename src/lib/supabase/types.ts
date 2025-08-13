/**
 * Supabase Database Types for RewardJar 4.0
 * 
 * Comprehensive type definitions for all database tables and relationships.
 * These types ensure type safety across the entire application.
 */

// Stamp Card Configuration Types
export interface StampConfig {
  manualStampOnly: boolean
  minSpendAmount: number
  billProofRequired: boolean
  maxStampsPerDay: number
  duplicateVisitBuffer: '12h' | '1d' | 'none'
}

// Design Configuration Types (NEW - Phase 1)
export interface DesignConfig {
  // Icon System
  iconStyle: 'emoji' | 'custom' | 'category'
  gridLayout?: { columns: number; rows: number }
  
  // Progress & UI
  progressStyle?: 'bar' | 'circular' | 'elegant' | 'shopping'
  brandLevel: 'minimal' | 'moderate' | 'premium' | 'luxury' | 'energetic' | 'elegant' | 'modern'
  
  // Countdown Features
  countdownSettings: {
    showExpiry?: boolean
    showSessionsLeft?: boolean
    showUsesLeft?: boolean
    urgencyThreshold?: number // days before expiry to show urgency
  }
  
  // Platform-specific overrides
  platformOverrides?: {
    apple?: Partial<DesignConfig>
    google?: Partial<DesignConfig>
    pwa?: Partial<DesignConfig>
  }
}

// Card Form Data Types (Canonical Schema)
export interface CardFormData {
  // Primary fields
  cardName: string
  businessId: string
  businessName: string
  reward: string
  rewardDescription: string // NEW: Required detailed reward description
  stampsRequired: number
  cardColor: string
  iconEmoji: string
  customIconUrl?: string // NEW: Custom uploaded icon URL
  customIconPublicUrl?: string // NEW: Public URL for display
  barcodeType: 'PDF417' | 'QR_CODE'
  cardExpiryDays: number
  rewardExpiryDays: number
  
  // Stamp logic
  stampConfig: StampConfig
  
  // Design configuration (NEW - Phase 1)
  designConfig: DesignConfig
  
  // Information fields
  cardDescription: string
  howToEarnStamp: string
  rewardDetails: string
  earnedStampMessage: string
  earnedRewardMessage: string
}

// Wallet Type Definitions
export type WalletType = 'apple' | 'google' | 'pwa'

// Card Creation Status
export type CardCreationStatus = 'draft' | 'active' | 'inactive'

export interface Database {
  public: {
    Tables: {
      // User Management
      users: {
        Row: {
          id: string
          email: string
          role_id: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role_id: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role_id?: number
          created_at?: string
        }
      }
      
      // Role definitions
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      
      // Business Management
      businesses: {
        Row: {
          id: string
          name: string
          description: string | null
          contact_email: string | null
          owner_id: string
          status: string
          is_flagged: boolean | null
          admin_notes: string | null
          card_requested: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          contact_email?: string | null
          owner_id: string
          status?: string
          is_flagged?: boolean | null
          admin_notes?: string | null
          card_requested?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          contact_email?: string | null
          owner_id?: string
          status?: string
          is_flagged?: boolean | null
          admin_notes?: string | null
          card_requested?: boolean | null
          created_at?: string
        }
      }
      
      // Customer Management
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          created_at?: string
        }
      }
      
      // Stamp Card Templates (Canonical Schema)
      stamp_cards: {
        Row: {
          id: string
          business_id: string
          card_name: string
          reward: string
          reward_description: string
          stamps_required: number
          status: string
          card_color: string
          icon_emoji: string
          custom_icon_url: string | null // NEW: Custom icon storage URL
          custom_icon_public_url: string | null // NEW: Custom icon public URL
          barcode_type: 'PDF417' | 'QR_CODE'
          card_expiry_days: number
          reward_expiry_days: number
          stamp_config: StampConfig
          design_config: DesignConfig // NEW: Enhanced design configuration
          card_description: string
          how_to_earn_stamp: string
          reward_details: string
          earned_stamp_message: string
          earned_reward_message: string
          // Legacy fields removed - use current schema fields instead



          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          business_id: string
          card_name: string
          reward: string
          reward_description?: string
          stamps_required: number
          status?: string
          card_color?: string
          icon_emoji?: string
          custom_icon_url?: string | null // NEW: Custom icon storage URL
          custom_icon_public_url?: string | null // NEW: Custom icon public URL
          barcode_type?: 'PDF417' | 'QR_CODE'
          card_expiry_days?: number
          reward_expiry_days?: number
          stamp_config?: StampConfig
          design_config?: DesignConfig // NEW: Enhanced design configuration
          card_description?: string
          how_to_earn_stamp?: string
          reward_details?: string
          earned_stamp_message?: string
          earned_reward_message?: string
          // Legacy fields removed - use current schema fields instead



          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          card_name?: string
          reward?: string
          reward_description?: string
          stamps_required?: number
          status?: string
          card_color?: string
          icon_emoji?: string
          custom_icon_url?: string | null // NEW: Custom icon storage URL
          custom_icon_public_url?: string | null // NEW: Custom icon public URL
          barcode_type?: 'PDF417' | 'QR_CODE'
          card_expiry_days?: number
          reward_expiry_days?: number
          stamp_config?: StampConfig
          design_config?: DesignConfig // NEW: Enhanced design configuration
          card_description?: string
          how_to_earn_stamp?: string
          reward_details?: string
          earned_stamp_message?: string
          earned_reward_message?: string
          // Legacy fields removed - use current schema fields instead



          created_at?: string
          updated_at?: string
        }
      }
      
      // Membership Card Templates
      membership_cards: {
        Row: {
          id: string
          business_id: string
          name: string
          membership_type: string
          membership_mode: string // 'sessions' | 'discount'
          total_sessions: number
          cost: number
          duration_days: number | null
          discount_type: string | null // 'percent' | 'amount'
          discount_value: number | null
          min_spend_cents: number | null
          stackable: boolean | null
          max_uses_per_day: number | null
          max_uses_per_week: number | null
          validity_windows: any | null
          eligible_categories: string[] | null
          eligible_skus: string[] | null
          design_config: DesignConfig // NEW: Enhanced design configuration
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          membership_type?: string
          membership_mode?: string // 'sessions' | 'discount'
          total_sessions: number
          cost: number
          duration_days?: number | null
          discount_type?: string | null
          discount_value?: number | null
          min_spend_cents?: number | null
          stackable?: boolean | null
          max_uses_per_day?: number | null
          max_uses_per_week?: number | null
          validity_windows?: any | null
          eligible_categories?: string[] | null
          eligible_skus?: string[] | null
          design_config?: DesignConfig // NEW: Enhanced design configuration
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          membership_type?: string
          membership_mode?: string // 'sessions' | 'discount'
          total_sessions?: number
          cost?: number
          duration_days?: number | null
          discount_type?: string | null
          discount_value?: number | null
          min_spend_cents?: number | null
          stackable?: boolean | null
          max_uses_per_day?: number | null
          max_uses_per_week?: number | null
          validity_windows?: any | null
          eligible_categories?: string[] | null
          eligible_skus?: string[] | null
          design_config?: DesignConfig // NEW: Enhanced design configuration
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Customer Cards (Unified for both stamp and membership cards)
      customer_cards: {
        Row: {
          id: string
          customer_id: string
          // Card Type References (exactly one must be set)
          stamp_card_id: string | null
          membership_card_id: string | null
          // Stamp Card Fields
          current_stamps: number | null
          // Membership Card Fields
          sessions_used: number | null
          expiry_date: string | null
          // Wallet Integration
          wallet_type: string | null
          wallet_pass_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          stamp_card_id?: string | null
          membership_card_id?: string | null
          current_stamps?: number | null
          sessions_used?: number | null
          expiry_date?: string | null
          wallet_type?: string | null
          wallet_pass_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          stamp_card_id?: string | null
          membership_card_id?: string | null
          current_stamps?: number | null
          sessions_used?: number | null
          expiry_date?: string | null
          wallet_type?: string | null
          wallet_pass_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Session Usage Tracking
      session_usage: {
        Row: {
          id: string
          customer_card_id: string
          business_id: string
          marked_by: string | null
          session_date: string
          usage_type: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_card_id: string
          business_id: string
          marked_by?: string | null
          session_date?: string
          usage_type?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_card_id?: string
          business_id?: string
          marked_by?: string | null
          session_date?: string
          usage_type?: string
          notes?: string | null
          created_at?: string
        }
      }
      
      // Wallet Update Queue
      wallet_update_queue: {
        Row: {
          id: string
          customer_card_id: string
          update_type: string
          metadata: Record<string, any> | null
          processed: boolean
          processed_at: string | null
          failed: boolean
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_card_id: string
          update_type: string
          metadata?: Record<string, any> | null
          processed?: boolean
          processed_at?: string | null
          failed?: boolean
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_card_id?: string
          update_type?: string
          metadata?: Record<string, any> | null
          processed?: boolean
          processed_at?: string | null
          failed?: boolean
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Legacy Tables (maintained for compatibility)
      stamps: {
        Row: {
          id: string
          customer_id: string
          stamp_card_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          stamp_card_id: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          stamp_card_id?: string
          created_at?: string
        }
      }
      
      rewards: {
        Row: {
          id: string
          customer_id: string
          stamp_card_id: string
          redeemed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          stamp_card_id: string
          redeemed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          stamp_card_id?: string
          redeemed_at?: string | null
          created_at?: string
        }
      }
    }
    
    Views: {
      // Add any database views here
    }
    
    Functions: {
      // Database functions
      mark_session_usage: {
        Args: {
          p_customer_card_id: string
          p_business_id: string
          p_marked_by?: string
          p_usage_type?: string
          p_notes?: string
        }
        Returns: Record<string, any>
      }
    }
    
    Enums: {
      // Database enums
      user_role: 'admin' | 'business' | 'customer'
      card_status: 'active' | 'inactive'
      wallet_type: 'apple' | 'google' | 'pwa'
      usage_type: 'session' | 'stamp'
      update_type: 'stamp_update' | 'reward_complete' | 'card_update' | 'session_update' | 'membership_update'
    }
  }
}

// Convenience type aliases for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for easier importing
export type User = Tables<'users'>
export type Business = Tables<'businesses'>
export type Customer = Tables<'customers'>
export type StampCard = Tables<'stamp_cards'>
export type MembershipCard = Tables<'membership_cards'>
export type CustomerCard = Tables<'customer_cards'>
export type SessionUsage = Tables<'session_usage'>
export type WalletUpdateQueue = Tables<'wallet_update_queue'>

// Extended types with relationships
export interface BusinessWithDetails extends Business {
  users?: User
  stamp_cards?: StampCard[]
  membership_cards?: MembershipCard[]
  customer_cards?: CustomerCard[]
}

export interface CustomerCardWithDetails extends CustomerCard {
  customer?: Customer
  stamp_card?: StampCard
  membership_card?: MembershipCard
  business?: Business
}

export interface StampCardWithDetails extends StampCard {
  business?: Business
  customer_cards?: CustomerCard[]
}

export interface MembershipCardWithDetails extends MembershipCard {
  business?: Business
  customer_cards?: CustomerCard[]
}

// Admin dashboard types
export interface AdminStats {
  totalBusinesses: number
  totalCustomers: number
  totalCards: number
  totalStampCards: number
  totalMembershipCards: number
  flaggedBusinesses: number
  recentActivity: number
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  hasMore: boolean
}

// Wallet types
export interface WalletData {
  id: string
  type: 'stamp' | 'membership'
  name: string
  description: string
  progress: {
    current: number
    total: number
    percentage: number
  }
  business: {
    name: string
    contact: string
  }
  wallet_type: 'apple' | 'google' | 'pwa'
  qr_code?: string
}

// Form types for components
export interface StampCardForm {
  name: string
  total_stamps: number
  reward_description: string
  business_id: string
}

export interface MembershipCardForm {
  name: string
  membership_type: string
  total_sessions: number
  cost: number
  duration_days: number
  business_id: string
}

export interface BusinessForm {
  name: string
  description: string
  contact_email: string
}

export interface CustomerForm {
  name: string
  email: string
}

// Error types
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

export default Database