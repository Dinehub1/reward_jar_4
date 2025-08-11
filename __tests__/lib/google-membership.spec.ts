import { createLoyaltyObject, buildGoogleIds } from '@/lib/wallet/builders/google-pass-builder'

describe('Google Wallet - membership counters', () => {
  it('uses sessions for membership label and counters', () => {
    const ids = buildGoogleIds('card_123', undefined, true)
    const obj = createLoyaltyObject({
      ids,
      current: 7,
      total: 20,
      objectDisplayId: 'card_123',
      label: 'Sessions',
    })

    expect(obj.loyaltyPoints.label).toBe('Sessions')
    expect(obj.loyaltyPoints.balance.string).toBe('7/20')
  })
})

