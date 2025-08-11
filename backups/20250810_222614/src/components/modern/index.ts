// Modern UI Components - Phase 4 Implementation
// Enhanced components with animations, micro-interactions, and modern design patterns

// UI Components
export { 
  ModernSkeleton, 
  StaggeredSkeleton, 
  ModernTableSkeleton, 
  ModernCardSkeleton, 
  ShimmerLoader 
} from './ui/ModernSkeleton'

export { 
  ModernButton, 
  LoadingButton, 
  IconButton, 
  FloatingActionButton, 
  modernButtonVariants 
} from './ui/ModernButton'

// Layout Components
export { 
  PageTransition, 
  StaggeredPageTransition, 
  SlideTransition, 
  ScaleTransition,
  LoadingTransition 
} from './layout/PageTransition'

// Preview Components (Device Frames)
export { 
  IPhone15Frame, 
  InteractiveIPhone15Frame 
} from './preview/iPhone15Frame'

export { AndroidFrame } from './preview/AndroidFrame'
export { WebFrame } from './preview/WebFrame'

// Wallet Components (Unified Pass Views)
export type { WalletCardData } from './wallet/WalletPassFrame'

// Re-export for convenience
export * from './ui/ModernSkeleton'
export * from './ui/ModernButton'
export * from './layout/PageTransition'
export * from './preview/iPhone15Frame'
export * from './preview/AndroidFrame'
export * from './preview/WebFrame'
// Legacy wallet preview re-exports removed; use unified preview instead
// Legacy wallet preview components removed; use `components/unified/CardLivePreview` instead.