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

// Wallet Components (Legacy - Use CardLivePreview for new implementations)
// export { WalletPreviewCard } from './wallet/WalletPreviewCard'
// export { WalletPreviewContainer } from './wallet/WalletPreviewContainer'
export type { WalletCardData } from './wallet/WalletPassFrame'

// Re-export for convenience
export * from './ui/ModernSkeleton'
export * from './ui/ModernButton'
export * from './layout/PageTransition'
export * from './preview/iPhone15Frame'
export * from './preview/AndroidFrame'
export * from './preview/WebFrame'
// export * from './wallet/AppleWalletView'
// export * from './wallet/GoogleWalletView'
// export * from './wallet/WebPassView'
// export * from './wallet/WalletPreviewContainer'