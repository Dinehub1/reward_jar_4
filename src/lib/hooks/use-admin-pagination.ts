'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePagination, useCursorPagination, type PaginationConfig } from './use-pagination'

export interface AdminPaginationOptions extends PaginationConfig {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  searchColumn?: string
  searchTerm?: string
  cacheKey?: string
}

export interface AdminPaginationReturn<T> {
  data: T[]
  pagination: ReturnType<typeof usePagination>
  refresh: () => void
  search: (term: string) => void
  filter: (filters: Record<string, any>) => void
  isLoading: boolean
  error: string | null
}

/**
 * Optimized pagination hook for admin dashboard data
 * 
 * Features:
 * - Automatic Supabase integration
 * - Search and filtering
 * - Performance optimizations
 * - Caching for better UX
 * - RLS-compliant queries
 */
export function useAdminPagination<T = any>(
  options: AdminPaginationOptions
): AdminPaginationReturn<T> {
  const {
    table,
    select = '*',
    filters: initialFilters = {},
    orderBy = { column: 'created_at', ascending: false },
    searchColumn,
    searchTerm: initialSearchTerm = '',
    cacheKey,
    ...paginationConfig
  } = options

  const [data, setData] = useState<T[]>([])
  const [filters, setFilters] = useState(initialFilters)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pagination = usePagination(paginationConfig)
  const supabase = createClient()
  
  // Cache for performance
  const cacheRef = useRef<Map<string, { data: T[]; count: number; timestamp: number }>>(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  const buildCacheKey = useCallback(() => {
    const filterStr = JSON.stringify(filters)
    const searchStr = searchTerm ? `search:${searchTerm}` : ''
    const orderStr = `${orderBy.column}:${orderBy.ascending ? 'asc' : 'desc'}`
    return `${cacheKey || table}:${pagination.currentPage}:${pagination.pageSize}:${filterStr}:${searchStr}:${orderStr}`
  }, [table, cacheKey, pagination.currentPage, pagination.pageSize, filters, searchTerm, orderBy])

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check cache first
      const key = buildCacheKey()
      const cached = cacheRef.current.get(key)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setData(cached.data)
        pagination.setTotalItems(cached.count)
        setIsLoading(false)
        return
      }

      const { from, to } = pagination.getRange()

      // Build query
      let query = supabase
        .from(table)
        .select(select, { count: 'exact' })
        .order(orderBy.column, { ascending: orderBy.ascending })
        .range(from, to)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'object' && value.operator && value.value) {
            // Support for complex filters like { operator: 'gte', value: 100 }
            switch (value.operator) {
              case 'gte':
                query = query.gte(key, value.value)
                break
              case 'lte':
                query = query.lte(key, value.value)
                break
              case 'gt':
                query = query.gt(key, value.value)
                break
              case 'lt':
                query = query.lt(key, value.value)
                break
              case 'like':
                query = query.like(key, `%${value.value}%`)
                break
              case 'ilike':
                query = query.ilike(key, `%${value.value}%`)
                break
              default:
                query = query.eq(key, value.value)
            }
          } else {
            query = query.eq(key, value)
          }
        }
      })

      // Apply search
      if (searchTerm && searchColumn) {
        query = query.ilike(searchColumn, `%${searchTerm}%`)
      }

      const { data: result, count, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      // Cache the result
      cacheRef.current.set(key, {
        data: result || [],
        count: count || 0,
        timestamp: Date.now()
      })

      // Cleanup old cache entries
      if (cacheRef.current.size > 50) {
        const entries = Array.from(cacheRef.current.entries())
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        entries.slice(0, 25).forEach(([key]) => cacheRef.current.delete(key))
      }

      setData(result || [])
      pagination.setTotalItems(count || 0)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
      console.error('Admin pagination error:', {
        error: err,
        table,
        filters,
        searchTerm,
        orderBy
      })
      // Set empty data on error to prevent undefined access
      setData([])
      pagination.setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }, [
    table,
    select,
    filters,
    searchTerm,
    searchColumn,
    orderBy,
    pagination,
    supabase,
    buildCacheKey
  ])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    cacheRef.current.clear()
    fetchData()
  }, [fetchData])

  const search = useCallback((term: string) => {
    setSearchTerm(term)
    pagination.goToPage(1) // Reset to first page on search
  }, [pagination])

  const filter = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    pagination.goToPage(1) // Reset to first page on filter change
  }, [pagination])

  return {
    data,
    pagination,
    refresh,
    search,
    filter,
    isLoading,
    error
  }
}

/**
 * Cursor-based pagination for large admin datasets
 */
export function useAdminCursorPagination<T extends { id: string | number }>(
  options: AdminPaginationOptions
) {
  const {
    table,
    select = '*',
    filters = {},
    orderBy = { column: 'id', ascending: false },
    searchColumn,
    searchTerm = '',
    ...paginationConfig
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTermState, setSearchTermState] = useState(searchTerm)
  const [filtersState, setFiltersState] = useState(filters)

  const cursorPagination = useCursorPagination<T>(paginationConfig)
  const supabase = createClient()

  const fetchData = useCallback(async (cursor?: string | number) => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from(table)
        .select(select)
        .order(orderBy.column, { ascending: orderBy.ascending })
        .limit(cursorPagination.pageSize)

      // Apply cursor
      if (cursor) {
        if (orderBy.ascending) {
          query = query.gt(orderBy.column, cursor)
        } else {
          query = query.lt(orderBy.column, cursor)
        }
      }

      // Apply filters
      Object.entries(filtersState).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(key, value)
        }
      })

      // Apply search
      if (searchTermState && searchColumn) {
        query = query.ilike(searchColumn, `%${searchTermState}%`)
      }

      const { data: result, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      cursorPagination.setItems(result || [])
      cursorPagination.setHasMore((result?.length || 0) === cursorPagination.pageSize)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
      cursorPagination.setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [
    table,
    select,
    orderBy,
    cursorPagination,
    supabase,
    filtersState,
    searchTermState,
    searchColumn
  ])

  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [])

  // Handle cursor navigation
  useEffect(() => {
    if (cursorPagination.currentCursor !== null) {
      fetchData(cursorPagination.currentCursor)
    }
  }, [cursorPagination.currentCursor, fetchData])

  const search = useCallback((term: string) => {
    setSearchTermState(term)
    cursorPagination.reset()
  }, [cursorPagination])

  const filter = useCallback((newFilters: Record<string, any>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    cursorPagination.reset()
  }, [cursorPagination])

  return {
    ...cursorPagination,
    isLoading,
    error,
    search,
    filter,
    refresh: () => {
      cursorPagination.reset()
      fetchData()
    }
  }
}

export default useAdminPagination