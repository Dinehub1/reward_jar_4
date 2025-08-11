import { buildApplePassJson } from '@/lib/wallet/builders/apple-pass-builder'

describe('Apple builder - membership fields from cardData', () => {
  it('reads membership fields from cardData', () => {
    const pass = buildApplePassJson({
      customerCardId: 'card_abc',
      isMembershipCard: true,
      cardData: {
        name: 'Gym',
        total_sessions: 24,
        cost: 150000,
        card_color: '#6366f1',
      } as any,
      businessData: { name: 'Biz', description: 'Desc' },
      derived: {
        progressLabel: 'Sessions Used',
        remainingLabel: 'Remaining',
        primaryValue: '3/24',
        progressPercent: 12.5,
        remainingCount: 21,
        isCompleted: false,
        isExpired: false,
        membershipCost: 150000,
        membershipTotalSessions: 24,
        membershipExpiryDate: null,
      },
    }) as any

    expect(pass.storeCard.auxiliaryFields.find((f: any) => f.key === 'cost').value).toContain('₩')
    expect(pass.storeCard.backFields.find((f: any) => f.key === 'description').value).toContain('24')
  })
})

