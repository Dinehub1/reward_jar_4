'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  isLoading?: boolean
  showPageSizeSelector?: boolean
  showRefresh?: boolean
  showPageInfo?: boolean
  showQuickJump?: boolean
  pageSizeOptions?: number[]
  maxVisiblePages?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRefresh?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  isLoading = false,
  showPageSizeSelector = true,
  showRefresh = true,
  showPageInfo = true,
  showQuickJump = false,
  pageSizeOptions = [10, 25, 50, 100],
  maxVisiblePages = 7,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  className,
  size = 'md'
}: PaginationControlsProps) {
  
  // Calculate visible page numbers
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    const pages = []
    
    // Add first page if not in range
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('ellipsis-start')
      }
    }

    // Add visible range
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add last page if not in range
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis-end')
      }
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  const sizeClasses = {
    sm: {
      button: 'h-8 px-2 text-xs',
      text: 'text-xs',
      select: 'h-8 text-xs'
    },
    md: {
      button: 'h-9 px-3 text-sm',
      text: 'text-sm',
      select: 'h-9 text-sm'
    },
    lg: {
      button: 'h-10 px-4 text-base',
      text: 'text-base',
      select: 'h-10 text-base'
    }
  }

  const styles = sizeClasses[size]

  const formatItemsRange = () => {
    if (totalItems === 0) return '0 items'
    
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)
    
    return `${start.toLocaleString()}-${end.toLocaleString()} of ${totalItems.toLocaleString()}`
  }

  return (
    <div className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
      className
    )}>
      {/* Left side - Page info and controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        {showPageInfo && (
          <div className={cn('text-gray-600', styles.text)}>
            {formatItemsRange()}
          </div>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className={cn('text-gray-600', styles.text)}>Show:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger className={cn('w-20', styles.select)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showRefresh && onRefresh && (
          <Button
            variant="outline"
            size={size}
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(styles.button, 'gap-2')}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        )}
      </div>

      {/* Right side - Pagination controls */}
      <nav role="navigation" aria-label="Pagination" className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size={size}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          className={styles.button}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size={size}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={styles.button}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          <AnimatePresence mode="wait">
            {visiblePages.map((page, index) => {
              if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                return (
                  <motion.div
                    key={`ellipsis-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center w-9 h-9"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </motion.div>
                )
              }

              const pageNumber = page as number
              const isCurrentPage = pageNumber === currentPage

              return (
                <motion.div
                  key={pageNumber}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant={isCurrentPage ? "default" : "outline"}
                    size={size}
                    onClick={() => onPageChange(pageNumber)}
                    disabled={isLoading}
                    className={cn(
                      styles.button,
                      isCurrentPage && 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                    aria-label={isCurrentPage ? `Current page ${pageNumber}` : `Go to page ${pageNumber}`}
                    aria-current={isCurrentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </Button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size={size}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={styles.button}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size={size}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className={styles.button}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  )
}

// Compact version for mobile or limited space
export function CompactPaginationControls({
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
  className
}: Pick<PaginationControlsProps, 'currentPage' | 'totalPages' | 'isLoading' | 'onPageChange' | 'className'>) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded text-sm">
        <span className="font-medium">{currentPage}</span>
        <span className="text-gray-500">of</span>
        <span className="font-medium">{totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default PaginationControls