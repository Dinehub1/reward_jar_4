import { z } from 'zod'

export const AuthoringSchema = z.object({
  cardName: z.string().min(1, 'Card name is required'),
  businessId: z.string().uuid('Business ID must be a UUID'),
  businessName: z.string().optional(),
  businessLogoUrl: z.string().url('Logo must be a valid URL').optional().or(z.literal('')),
  type: z.enum(['stamp', 'membership']),

  cardColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a hex like #AABBCC'),
  iconEmoji: z.string().min(1, 'Emoji is required'),
  backgroundImageUrl: z.string().url('Background must be a valid URL').optional().or(z.literal('')),

  stampsRequired: z.number().int().min(1).max(20).optional(),
  reward: z.string().optional(),
  rewardDescription: z.string().max(60, 'Keep reward description concise (<= 60 chars)').optional(),

  cardDescription: z.string().max(120).optional(),
  howToEarnStamp: z.string().max(120).optional(),
  rewardDetails: z.string().max(200).optional(),
})

export type AuthoringInput = z.infer<typeof AuthoringSchema>

