/**
 * Admin Real-Time Subscriptions
 * 
 * Provides real-time updates for admin dashboard using Supabase real-time
 * Automatically invalidates SWR caches when database changes occur
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { invalidateAdminDashboard, invalidateAdminSection } from './use-admin-cache-invalidation'

interface RealtimePayload {
  table: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  timestamp: string
  record_id: string
  data: any
}

/**
 * Hook for admin dashboard real-time updates
 * Subscribes to database changes and invalidates relevant caches
 */
export function useAdminRealtime() {
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) return

    // Setting up admin real-time subscriptions

    // Create channel for admin dashboard updates
    const channel = supabase.channel('admin-dashboard-realtime')

    // Subscribe to customer_cards changes (most critical for admin stats)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customer_cards'
      },
      (payload) => {
        // Customer cards change detected
        handleDatabaseChange('customer_cards', payload.eventType, payload.new || payload.old)
      }
    )

    // Subscribe to businesses changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'businesses'
      },
      (payload) => {
        // Businesses change detected
        handleDatabaseChange('businesses', payload.eventType, payload.new || payload.old)
      }
    )

    // Subscribe to customers changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customers'
      },
      (payload) => {
        // Customers change detected
        handleDatabaseChange('customers', payload.eventType, payload.new || payload.old)
      }
    )

    // Subscribe to stamp_cards changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stamp_cards'
      },
      (payload) => {
        // Stamp cards change detected
        handleDatabaseChange('stamp_cards', payload.eventType, payload.new || payload.old)
      }
    )

    // Subscribe to membership_cards changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'membership_cards'
      },
      (payload) => {
        // Membership cards change detected
        handleDatabaseChange('membership_cards', payload.eventType, payload.new || payload.old)
      }
    )

    // Subscribe to the channel
    channel.subscribe((status) => {
      // Admin real-time subscription status logged
      if (status === 'SUBSCRIBED') {
        // Admin real-time subscriptions active
        isSubscribedRef.current = true
      }
    })

    channelRef.current = channel

    // Cleanup function
    return () => {
      // Cleaning up admin real-time subscriptions
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      isSubscribedRef.current = false
    }
  }, [])

  /**
   * Handles database changes and triggers appropriate cache invalidations
   */
  const handleDatabaseChange = async (
    table: string, 
    eventType: string, 
    record: any
  ) => {

    // Add small delay to ensure database consistency
    setTimeout(async () => {
      try {
        switch (table) {
          case 'customer_cards':
            // Customer cards affect multiple sections
            await invalidateAdminSection('customers')
            await invalidateAdminSection('cards')
            await invalidateAdminDashboard()
            break

          case 'businesses':
            await invalidateAdminSection('businesses')
            await invalidateAdminDashboard()
            break

          case 'customers':
            await invalidateAdminSection('customers')
            await invalidateAdminDashboard()
            break

          case 'stamp_cards':
          case 'membership_cards':
            await invalidateAdminSection('businesses')
            await invalidateAdminSection('cards')
            await invalidateAdminDashboard()
            break

          default:
            // Fallback: invalidate everything
            await invalidateAdminDashboard()
        }

      } catch (error) {
      }
    }, 500) // 500ms delay for database consistency
  }

  return {
    isConnected: isSubscribedRef.current,
    channel: channelRef.current
  }
}

/**
 * Hook for listening to specific admin notifications
 * Uses pg_notify for custom business logic notifications
 */
export function useAdminNotifications() {
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {

    const channel = supabase.channel('admin-notifications')

    // Listen for custom admin dashboard notifications
    channel.on('broadcast', { event: 'admin_update' }, (payload) => {
      handleAdminNotification(payload.payload)
    })

    channel.subscribe((status) => {
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [])

  const handleAdminNotification = async (notification: any) => {
    const { type, data } = notification

    switch (type) {
      case 'business_activity':
        await invalidateAdminSection('customers')
        await invalidateAdminSection('cards')
        break

      case 'wallet_sync_complete':
        // Wallet sync completed, refresh relevant data
        await invalidateAdminDashboard()
        break

      case 'system_alert':
        // System alerts might affect health metrics
        await invalidateAdminDashboard()
        break

      default:
    }
  }

  /**
   * Send admin notification to other connected clients
   */
  const sendAdminNotification = async (type: string, data: any) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'admin_update',
        payload: { type, data, timestamp: new Date().toISOString() }
      })
    }
  }

  return {
    sendNotification: sendAdminNotification
  }
}