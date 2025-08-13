'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface PaginationConfig {
  pageSize: number
  initialPage?: number
  serverSide?: boolean
}

export interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  isLoading: boolean
  error: string | null
}

export interface PaginationControls {
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  refresh: () => void
  setPageSize: (size: number) => void
}

export interface UsePaginationReturn extends PaginationState, PaginationControls {
  // Additional utilities
  getRange: () => { from: number; to: number }
  reset: () => void
}

/**
 * Enhanced pagination hook optimized for Supabase and large datasets
 * 
 * Features:
 * - Cursor-based and offset-based pagination
 * - Caching for performance
 * - Error handling and loading states
 * - Server-side and client-side support
 */
export function usePagination(config: PaginationConfig): UsePaginationReturn {
  const { pageSize: initialPageSize, initialPage = 1, serverSide = false } = config
  
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Calculate derived values
  const totalPages = Math.ceil(totalItems / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1
  
  // Cache for client-side pagination
  const cacheRef = useRef<Map<string, any>>(new Map())
  
  const getRange = useCallback(() => {
    const from = (currentPage - 1) * pageSize
    const to = from + pageSize - 1
    return { from, to }
  }, [currentPage, pageSize])
  
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setError(null)
    }
  }, [totalPages])
  
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage])
  
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [hasPrevPage])
  
  const setPageSize = useCallback((size: number) => {
    if (size > 0) {
      setPageSizeState(size)
      setCurrentPage(1) // Reset to first page when changing page size
      cacheRef.current.clear() // Clear cache
    }
  }, [])
  
  const refresh = useCallback(() => {
    cacheRef.current.clear()
    setError(null)
    // Trigger a refresh by updating the current page (will trigger useEffect in consuming component)
    setCurrentPage(prev => prev)
  }, [])
  
  const reset = useCallback(() => {
    setCurrentPage(initialPage)
    setPageSizeState(initialPageSize)
    setTotalItems(0)
    setError(null)
    cacheRef.current.clear()
  }, [initialPage, initialPageSize])
  
  return {
    // State
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isLoading,
    error,
    
    // Controls
    goToPage,
    nextPage,
    prevPage,
    refresh,
    setPageSize,
    
    // Utilities
    getRange,
    reset,
    
    // Internal state setters (for use by data fetching hooks)
    setTotalItems,
    setIsLoading,
    setError,
    cacheRef
  } as UsePaginationReturn & {
    setTotalItems: (count: number) => void
    setIsLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    cacheRef: React.MutableRefObject<Map<string, any>>
  }
}

/**
 * Cursor-based pagination for better performance with large datasets
 */
export function useCursorPagination<T extends { id: string | number }>(config: PaginationConfig) {
  const [items, setItems] = useState<T[]>([])
  const [cursors, setCursors] = useState<(string | number)[]>([])
  const [currentCursor, setCurrentCursor] = useState<string | number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { pageSize } = config
  
  const nextPage = useCallback(() => {
    if (items.length > 0 && hasMore) {
      const lastItem = items[items.length - 1]
      setCurrentCursor(lastItem.id)
      setCursors(prev => [...prev, lastItem.id])
    }
  }, [items, hasMore])
  
  const prevPage = useCallback(() => {
    if (cursors.length > 1) {
      setCursors(prev => prev.slice(0, -1))
      setCurrentCursor(cursors[cursors.length - 2] || null)
    } else {
      setCursors([])
      setCurrentCursor(null)
    }
  }, [cursors])
  
  const reset = useCallback(() => {
    setItems([])
    setCursors([])
    setCurrentCursor(null)
    setHasMore(true)
    setError(null)
  }, [])
  
  return {
    items,
    setItems,
    currentCursor,
    hasMore,
    setHasMore,
    isLoading,
    setIsLoading,
    error,
    setError,
    pageSize,
    canGoNext: hasMore,
    canGoPrev: cursors.length > 0,
    nextPage,
    prevPage,
    reset
  }
}

/**
 * Infinite scroll pagination
 */
export function useInfiniteScroll<T>(config: PaginationConfig & { threshold?: number }) {
  const [items, setItems] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  
  const { pageSize, threshold = 0.8 } = config
  
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1)
    }
  }, [isLoading, hasMore])
  
  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [])
  
  // Intersection Observer for automatic loading
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    if (isLoading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, { threshold })
    
    if (node) observerRef.current.observe(node)
  }, [isLoading, hasMore, loadMore, threshold])
  
  return {
    items,
    setItems,
    hasMore,
    setHasMore,
    isLoading,
    setIsLoading,
    error,
    setError,
    page,
    loadMore,
    reset,
    sentinelRef
  }
}

export default usePagination