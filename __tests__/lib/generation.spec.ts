import { mapQuickToAdvancedPayload, generateCardContent } from '@/lib/generation'

describe('generation helpers', () => {
  it('maps quick to advanced payload shape', () => {
    const payload = mapQuickToAdvancedPayload({
      cardName: 'Coffee Card',
      businessId: 'biz_1',
      reward: 'Free coffee',
      rewardDescription: 'After 10 stamps',
      stampsRequired: 10,
      cardColor: '#8B4513',
      iconEmoji: '☕',
      barcodeType: 'QR_CODE',
      cardExpiryDays: 60,
      rewardExpiryDays: 15,
      stampConfig: { manualStampOnly: true },
      cardDescription: 'Collect stamps to get rewards',
      howToEarnStamp: 'Buy anything',
      rewardDetails: '1 free drink',
      earnedStampMessage: 'Nice!',
      earnedRewardMessage: 'Enjoy!'
    }) as any

    expect(payload.card_name).toBe('Coffee Card')
    expect(payload.stamps_required).toBe(10)
    expect(payload.card_color).toBe('#8B4513')
    expect(payload.icon_emoji).toBe('☕')
    expect(payload.barcode_type).toBe('QR_CODE')
  })

  it('generateCardContent returns preview-friendly fields', () => {
    const template = {
      cardColor: '#8B4513',
      iconEmoji: '☕',
      stampsRequired: 10,
      reward: 'Free coffee',
      rewardDescription: 'After 10',
      cardDescription: 'Collect stamps',
      howToEarnStamp: 'Buy',
      rewardDetails: 'Drink',
      stampConfig: { manualStampOnly: true }
    }
    const out = generateCardContent('Cafe', template)
    expect(out.stampsRequired).toBe(10)
    expect(out.cardColor).toBe('#8B4513')
    expect(out.iconEmoji).toBe('☕')
  })
})

