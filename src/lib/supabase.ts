import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase client for browser usage
export const createClient = () => createClientComponentClient()

// Database types (simplified for now, can be auto-generated later)
export interface Database {
  public: {
    Tables: {
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
      businesses: {
        Row: {
          id: string
          name: string
          description: string | null
          contact_email: string | null
          owner_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          contact_email?: string | null
          owner_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          contact_email?: string | null
          owner_id?: string
          status?: string
          created_at?: string
        }
      }
      stamp_cards: {
        Row: {
          id: string
          business_id: string
          name: string
          total_stamps: number
          reward_description: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          total_stamps: number
          reward_description: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          total_stamps?: number
          reward_description?: string
          status?: string
          created_at?: string
        }
      }
      customer_cards: {
        Row: {
          id: string
          customer_id: string
          stamp_card_id: string
          current_stamps: number
          wallet_type: string | null
          wallet_pass_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          stamp_card_id: string
          current_stamps?: number
          wallet_type?: string | null
          wallet_pass_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          stamp_card_id?: string
          current_stamps?: number
          wallet_type?: string | null
          wallet_pass_id?: string | null
          created_at?: string
        }
      }
    }
  }
} 