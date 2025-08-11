export type CardType = 'stamp' | 'membership'

// Canonical authoring payload used by Template Versions (camelCase)
export interface AuthoringPayload {
  cardName: string
  businessId: string
  businessName?: string
  businessLogoUrl?: string
  type: CardType

  // visual
  cardColor: string
  iconEmoji: string
  backgroundImageUrl?: string

  // stamp config
  stampsRequired?: number
  reward?: string
  rewardDescription?: string

  // info (back of card)
  cardDescription?: string
  howToEarnStamp?: string
  rewardDetails?: string
}

export interface CardTemplate {
  id: string
  business_id: string
  name: string
  type: CardType
  schema_version: number
  created_by?: string
  created_at?: string
}

export interface CardTemplateVersion {
  id: string
  template_id: string
  version: number
  ui_payload: AuthoringPayload
  pass_payload?: any
  is_published: boolean
  created_at?: string
}

