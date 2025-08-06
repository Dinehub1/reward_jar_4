// Legacy skeleton component - use ModernSkeleton for new implementations
import { cn } from "@/lib/utils"

// Re-export modern components for backward compatibility
export { 
  ModernSkeleton as Skeleton,
  ModernTableSkeleton as TableSkeleton, 
  ModernCardSkeleton as CardSkeleton,
  StaggeredSkeleton,
  ShimmerLoader
} from "@/components/modern/ui/ModernSkeleton"

// Legacy skeleton function for backward compatibility
function LegacySkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Keep original exports for backward compatibility
export { LegacySkeleton } 