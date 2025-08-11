'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { WalletCardData } from '@/components/modern/wallet/WalletPassFrame'

// Extended card form data interface
export interface CardFormData {
  // Step 1: Card Details
  cardName: string
  businessId: string
  businessName: string
  businessLogoUrl?: string
  reward: string
  rewardDescription: string
  stampsRequired: number
  cardExpiryDays: number
  rewardExpiryDays: number
  
  // Step 2: Design
  cardColor: string
  iconEmoji: string
  barcodeType: 'QR_CODE' | 'PDF417'
  
  // Step 3: Stamp Rules
  stampConfig: {
    manualStampOnly: boolean
    minSpendAmount: number
    billProofRequired: boolean
    maxStampsPerDay: number
    duplicateVisitBuffer: '12h' | '1d' | 'none'
  }
  
  // Step 4: Information
  cardDescription: string
  howToEarnStamp: string
  rewardDetails: string
  earnedStampMessage: string
  earnedRewardMessage: string
}

// Preview state interface
export interface PreviewState {
  activeView: 'apple' | 'google' | 'pwa'
  showBackPage: boolean
  demoFilledStamps: number
  screenshotMode: boolean
  isDarkMode: boolean
}

// Validation error interface
export interface ValidationError {
  field: string
  message: string
}

// Context state interface
interface CardCreationState {
  cardData: CardFormData
  previewState: PreviewState
  currentStep: number
  errors: ValidationError[]
  isLoading: boolean
  isSaving: boolean
}

// Action types
type CardCreationAction =
  | { type: 'UPDATE_CARD_DATA'; payload: Partial<CardFormData> }
  | { type: 'UPDATE_PREVIEW_STATE'; payload: Partial<PreviewState> }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_ERRORS'; payload: ValidationError[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'RESET_STATE' }
  | { type: 'APPLY_TEMPLATE'; payload: Partial<CardFormData> }

// Context interface
interface CardCreationContextValue {
  state: CardCreationState
  actions: {
    updateCardData: (data: Partial<CardFormData>) => void
    updatePreviewState: (preview: Partial<PreviewState>) => void
    setCurrentStep: (step: number) => void
    setErrors: (errors: ValidationError[]) => void
    setLoading: (loading: boolean) => void
    setSaving: (saving: boolean) => void
    resetState: () => void
    applyTemplate: (template: Partial<CardFormData>) => void
    getWalletCardData: () => WalletCardData
    validateStep: (step: number) => boolean
  }
}

// Initial state
const initialState: CardCreationState = {
  cardData: {
    cardName: '',
    businessId: '',
    businessName: '',
    businessLogoUrl: '',
    reward: '',
    rewardDescription: '',
    stampsRequired: 10,
    cardExpiryDays: 60,
    rewardExpiryDays: 15,
    cardColor: '#8B4513',
    iconEmoji: '☕',
    barcodeType: 'QR_CODE',
    stampConfig: {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '12h'
    },
    cardDescription: 'Collect stamps to get rewards',
    howToEarnStamp: 'Buy anything to get a stamp',
    rewardDetails: '',
    earnedStampMessage: 'Just [#] more stamps to get your reward!',
    earnedRewardMessage: 'Reward is earned and waiting for you!'
  },
  previewState: {
    activeView: 'apple',
    showBackPage: false,
    demoFilledStamps: 3,
    screenshotMode: false,
    isDarkMode: false
  },
  currentStep: 0,
  errors: [],
  isLoading: false,
  isSaving: false
}

// Reducer
const cardCreationReducer = (state: CardCreationState, action: CardCreationAction): CardCreationState => {
  switch (action.type) {
    case 'UPDATE_CARD_DATA':
      return {
        ...state,
        cardData: {
          ...state.cardData,
          ...action.payload
        }
      }
    
    case 'UPDATE_PREVIEW_STATE':
      return {
        ...state,
        previewState: {
          ...state.previewState,
          ...action.payload
        }
      }
    
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload
      }
    
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload
      }
    
    case 'RESET_STATE':
      return initialState
    
    case 'APPLY_TEMPLATE':
      return {
        ...state,
        cardData: {
          ...state.cardData,
          ...action.payload
        },
        // Reset demo stamps when template changes
        previewState: {
          ...state.previewState,
          demoFilledStamps: Math.max(1, Math.floor((action.payload.stampsRequired || state.cardData.stampsRequired) * 0.4))
        }
      }
    
    default:
      return state
  }
}

// Create context
const CardCreationContext = createContext<CardCreationContextValue | null>(null)

// Provider component
export const CardCreationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cardCreationReducer, initialState)

  // Actions
  const updateCardData = useCallback((data: Partial<CardFormData>) => {
    dispatch({ type: 'UPDATE_CARD_DATA', payload: data })
  }, [])

  const updatePreviewState = useCallback((preview: Partial<PreviewState>) => {
    dispatch({ type: 'UPDATE_PREVIEW_STATE', payload: preview })
  }, [])

  const setCurrentStep = useCallback((step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step })
  }, [])

  const setErrors = useCallback((errors: ValidationError[]) => {
    dispatch({ type: 'SET_ERRORS', payload: errors })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setSaving = useCallback((saving: boolean) => {
    dispatch({ type: 'SET_SAVING', payload: saving })
  }, [])

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
  }, [])

  const applyTemplate = useCallback((template: Partial<CardFormData>) => {
    dispatch({ type: 'APPLY_TEMPLATE', payload: template })
  }, [])

  // Transform CardFormData to WalletCardData
  const getWalletCardData = useCallback((): WalletCardData => {
    const { cardData } = state
    return {
      businessName: cardData.businessName,
      cardName: cardData.cardName,
      businessLogoUrl: cardData.businessLogoUrl,
      cardColor: cardData.cardColor,
      iconEmoji: cardData.iconEmoji,
      stampsRequired: cardData.stampsRequired,
      reward: cardData.reward,
      rewardDescription: cardData.rewardDescription,
      cardDescription: cardData.cardDescription,
      howToEarnStamp: cardData.howToEarnStamp,
      rewardDetails: cardData.rewardDetails
    }
  }, [state])

  // Validation function
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: ValidationError[] = []
    const { cardData } = state
    
    switch (step) {
      case 0: // Card Details
        if (!cardData.cardName.trim()) {
          newErrors.push({ field: 'cardName', message: 'Card name is required' })
        }
        if (!cardData.businessId) {
          newErrors.push({ field: 'businessId', message: 'Please select a business' })
        }
        if (!cardData.reward.trim()) {
          newErrors.push({ field: 'reward', message: 'Reward is required' })
        }
        if (!cardData.rewardDescription.trim()) {
          newErrors.push({ field: 'rewardDescription', message: 'Reward description is required' })
        }
        if (cardData.stampsRequired < 1 || cardData.stampsRequired > 20) {
          newErrors.push({ field: 'stampsRequired', message: 'Stamps required must be between 1 and 20' })
        }
        break
      
      case 1: // Design
        if (!cardData.cardColor) {
          newErrors.push({ field: 'cardColor', message: 'Please select a card color' })
        }
        if (!cardData.iconEmoji) {
          newErrors.push({ field: 'iconEmoji', message: 'Please select an emoji' })
        }
        break
      
      case 2: // Stamp Rules
        if (cardData.stampConfig.minSpendAmount < 0) {
          newErrors.push({ field: 'minSpendAmount', message: 'Minimum spend amount cannot be negative' })
        }
        if (cardData.stampConfig.maxStampsPerDay < 1) {
          newErrors.push({ field: 'maxStampsPerDay', message: 'Max stamps per day must be at least 1' })
        }
        break
      
      case 3: // Information
        if (!cardData.cardDescription.trim()) {
          newErrors.push({ field: 'cardDescription', message: 'Card description is required' })
        }
        if (!cardData.howToEarnStamp.trim()) {
          newErrors.push({ field: 'howToEarnStamp', message: 'How to earn stamp instructions are required' })
        }
        break
    }
    
    dispatch({ type: 'SET_ERRORS', payload: newErrors })
    return newErrors.length === 0
  }, [state])

  const contextValue: CardCreationContextValue = {
    state,
    actions: {
      updateCardData,
      updatePreviewState,
      setCurrentStep,
      setErrors,
      setLoading,
      setSaving,
      resetState,
      applyTemplate,
      getWalletCardData,
      validateStep
    }
  }

  return (
    <CardCreationContext.Provider value={contextValue}>
      {children}
    </CardCreationContext.Provider>
  )
}

// Hook to use the context
export const useCardCreation = (): CardCreationContextValue => {
  const context = useContext(CardCreationContext)
  if (!context) {
    throw new Error('useCardCreation must be used within a CardCreationProvider')
  }
  return context
}

// Selectors for easier state access
export const useCardData = () => {
  const { state } = useCardCreation()
  return state.cardData
}

export const usePreviewState = () => {
  const { state } = useCardCreation()
  return state.previewState
}

export const useValidationErrors = () => {
  const { state } = useCardCreation()
  return state.errors
}

export const useCurrentStep = () => {
  const { state } = useCardCreation()
  return state.currentStep
}

export const useLoadingState = () => {
  const { state } = useCardCreation()
  return {
    isLoading: state.isLoading,
    isSaving: state.isSaving
  }
}