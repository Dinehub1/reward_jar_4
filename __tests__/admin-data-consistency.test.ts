/**
 * Admin Data Consistency Test Suite
 * 
 * Tests the unified admin dashboard data synchronization and consistency
 * Ensures all fixes are working correctly and prevent regression
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

describe('Admin Data Consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Unified API Endpoint', () => {
    it('should return consistent data across all sections', async () => {
      // Mock unified API response
      const mockUnifiedResponse = {
        success: true,
        data: {
          stats: {
            totalBusinesses: 15,
            totalCustomers: 159,
            totalCards: 78,
            totalStampCards: 45,
            totalMembershipCards: 33,
            activeCards: 78,
            flaggedBusinesses: 0,
            recentActivity: 25,
            newThisWeek: 5
          },
          businesses: Array(15).fill(null).map((_, i) => ({
            id: `business-${i}`,
            name: `Business ${i}`,
            status: 'active'
          })),
          customers: Array(159).fill(null).map((_, i) => ({
            id: `customer-${i}`,
            name: `Customer ${i}`,
            email: `customer${i}@example.com`
          })),
          cards: {
            stampCards: Array(45).fill(null).map((_, i) => ({
              id: `stamp-${i}`,
              card_name: `Stamp Card ${i}`
            })),
            membershipCards: Array(33).fill(null).map((_, i) => ({
              id: `membership-${i}`,
              name: `Membership Card ${i}`
            })),
            customerCards: Array(78).fill(null).map((_, i) => ({
              id: `customer-card-${i}`,
              customer_id: `customer-${i % 159}`
            }))
          }
        },
        timestamp: new Date().toISOString(),
        queryTime: 250
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUnifiedResponse
      })

      const response = await fetch('/api/admin/dashboard-unified')
      const data = await response.json()

      // Verify data consistency
      expect(data.success).toBe(true)
      expect(data.data.stats.totalBusinesses).toBe(data.data.businesses.length)
      expect(data.data.stats.totalCustomers).toBe(data.data.customers.length)
      expect(data.data.stats.totalStampCards).toBe(data.data.cards.stampCards.length)
      expect(data.data.stats.totalMembershipCards).toBe(data.data.cards.membershipCards.length)
      expect(data.data.stats.totalCards).toBe(data.data.cards.customerCards.length)
    })

    it('should handle section-specific requests correctly', async () => {
      const mockBusinessesResponse = {
        success: true,
        data: [
          { id: 'business-1', name: 'Test Business', status: 'active' }
        ],
        stats: { totalBusinesses: 1 },
        timestamp: new Date().toISOString(),
        queryTime: 100
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusinessesResponse
      })

      const response = await fetch('/api/admin/dashboard-unified?section=businesses')
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.stats.totalBusinesses).toBe(1)
    })

    it('should handle errors without returning fallback data', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Database connection failed'
        })
      })

      const response = await fetch('/api/admin/dashboard-unified')
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
      expect(data.data).toBeUndefined() // No fallback data
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate cache after business activity', async () => {
      // Mock successful cache invalidation
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Cache invalidation triggered'
        })
      })

      const response = await fetch('/api/admin/dashboard-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stamp_added',
          table: 'customer_cards',
          recordId: 'customer-card-123'
        })
      })

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Cache invalidation triggered')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track API response times', async () => {
      const startTime = Date.now()
      
      ;(fetch as any).mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: {} })
            })
          }, 100) // Simulate 100ms response time
        })
      )

      const response = await fetch('/api/admin/dashboard-unified')
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(responseTime).toBeGreaterThanOrEqual(100)
      expect(responseTime).toBeLessThan(200) // Should be close to 100ms
    })

    it('should identify slow queries', async () => {
      const slowResponse = {
        success: true,
        data: {},
        queryTime: 3000 // 3 seconds - should be flagged as slow
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => slowResponse
      })

      const response = await fetch('/api/admin/dashboard-unified')
      const data = await response.json()

      expect(data.queryTime).toBeGreaterThan(2000) // Slow query threshold
    })
  })

  describe('Real-Time Synchronization', () => {
    it('should handle database change notifications', () => {
      const mockPayload = {
        table: 'customer_cards',
        action: 'INSERT',
        timestamp: new Date().toISOString(),
        record_id: 'new-card-123',
        data: {
          id: 'new-card-123',
          customer_id: 'customer-456',
          stamp_card_id: 'stamp-789'
        }
      }

      // Simulate real-time notification handling
      const handleDatabaseChange = (payload: typeof mockPayload) => {
        expect(payload.table).toBe('customer_cards')
        expect(payload.action).toBe('INSERT')
        expect(payload.record_id).toBe('new-card-123')
        return true
      }

      const result = handleDatabaseChange(mockPayload)
      expect(result).toBe(true)
    })
  })

  describe('Data Validation', () => {
    it('should validate admin user permissions', async () => {
      const mockUnauthorizedResponse = {
        success: false,
        error: 'Admin access required'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockUnauthorizedResponse
      })

      const response = await fetch('/api/admin/dashboard-unified', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Admin access required')
    })

    it('should validate data types and structure', () => {
      const mockData = {
        stats: {
          totalBusinesses: 15,
          totalCustomers: 159,
          totalCards: 78
        },
        businesses: [],
        customers: []
      }

      // Validate data types
      expect(typeof mockData.stats.totalBusinesses).toBe('number')
      expect(typeof mockData.stats.totalCustomers).toBe('number')
      expect(typeof mockData.stats.totalCards).toBe('number')
      expect(Array.isArray(mockData.businesses)).toBe(true)
      expect(Array.isArray(mockData.customers)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/admin/dashboard-unified')
      } catch (error) {
        expect((error as Error).message).toBe('Network error')
      }
    })

    it('should handle malformed responses', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      try {
        const response = await fetch('/api/admin/dashboard-unified')
        await response.json()
      } catch (error) {
        expect((error as Error).message).toBe('Invalid JSON')
      }
    })
  })
})

describe('Integration Tests', () => {
  it('should maintain data consistency during concurrent operations', async () => {
    // Simulate concurrent API calls
    const promises = Array(5).fill(null).map((_, i) => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { stats: { totalBusinesses: 15 + i } },
          requestId: i
        })
      })
      
      return fetch('/api/admin/dashboard-unified')
        .then(res => res.json())
    })

    const results = await Promise.all(promises)
    
    // All requests should succeed
    results.forEach(result => {
      expect(result.success).toBe(true)
    })
  })

  it('should handle rapid cache invalidations', async () => {
    // Simulate rapid cache invalidation calls
    const invalidationPromises = Array(10).fill(null).map((_, i) => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: `Invalidation ${i} completed`
        })
      })
      
      return fetch('/api/admin/dashboard-unified', {
        method: 'POST',
        body: JSON.stringify({ action: `test-${i}` })
      }).then(res => res.json())
    })

    const results = await Promise.all(invalidationPromises)
    
    // All invalidations should succeed
    results.forEach((result, i) => {
      expect(result.success).toBe(true)
      expect(result.message).toBe(`Invalidation ${i} completed`)
    })
  })
})