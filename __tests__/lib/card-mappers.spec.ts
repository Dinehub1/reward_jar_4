import { mapAdminCardFormToPreview } from '@/lib/card-mappers'

describe('card-mappers', () => {
  it('maps admin form to preview consistently', () => {
    const preview = mapAdminCardFormToPreview({
      cardName: 'Cafe Card',
      businessName: 'Coffee Co',
      stampsRequired: 10,
      cardColor: '#8B4513',
      iconEmoji: '☕',
      reward: 'Free coffee',
      rewardDescription: 'One free',
      cardDescription: 'Collect stamps',
    })
    expect(preview.cardType).toBe('stamp')
    expect(preview.cardName).toBe('Cafe Card')
    expect(preview.stampsRequired).toBe(10)
  })
})

