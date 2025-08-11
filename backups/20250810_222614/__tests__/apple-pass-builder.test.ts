import { buildApplePass } from '@/lib/wallet/builders/apple-pass-builder'

describe('Apple Pass Builder', () => {
  test('builds loyalty (stamp) pass with expected fields', () => {
    const pass = buildApplePass(
      {
        name: 'Coffee Card',
        total_stamps: 10,
        reward_description: 'Free Coffee',
        card_color: '#10b981',
      },
      { name: 'Cafe', description: 'Best coffee' },
      'card-1234',
      {
        type: 'stamp',
        derived: {
          progressLabel: 'Stamps Collected',
          remainingLabel: 'Remaining',
          primaryValue: '3/10',
          progressPercent: 30,
          remainingCount: 7,
          isCompleted: false,
        },
      }
    ) as any

    expect(pass.formatVersion).toBe(1)
    expect(pass.passTypeIdentifier).toBeDefined()
    expect(pass.serialNumber).toBe('card-1234')
    expect(pass.storeCard.primaryFields[0].label).toBe('Stamps Collected')
    expect(pass.storeCard.secondaryFields[0].label).toBe('Progress')
    expect(pass.storeCard.headerFields[0].label).toBe('Stamp Card')
  })

  test('builds membership pass with expected fields', () => {
    const pass = buildApplePass(
      {
        name: 'Gym Membership',
        total_sessions: 20,
        cost: 15000,
      },
      { name: 'Premium Fitness Gym' },
      'member-5678',
      {
        type: 'membership',
        derived: {
          progressLabel: 'Sessions Used',
          remainingLabel: 'Remaining',
          primaryValue: '5/20',
          progressPercent: 25,
          remainingCount: 15,
          isCompleted: false,
          membershipCost: 15000,
          membershipTotalSessions: 20,
        },
      }
    ) as any

    expect(pass.formatVersion).toBe(1)
    expect(pass.passTypeIdentifier).toBeDefined()
    expect(pass.serialNumber).toBe('member-5678')
    expect(pass.storeCard.primaryFields[0].label).toBe('Sessions Used')
    expect(pass.storeCard.headerFields[0].label).toBe('Membership')
    expect(pass.barcodes?.[0].message).toContain('gym:member-5678')
  })
})

