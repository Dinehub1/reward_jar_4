import { buildAppleBarcode } from '@/lib/wallet/apple-helpers'

describe('buildAppleBarcode', () => {
  it('produces barcodes array with expected fields', () => {
    const out = buildAppleBarcode('1234', { altTextPrefix: 'Card ID' }) as any
    expect(Array.isArray(out.barcodes)).toBe(true)
    expect(out.barcodes[0]).toMatchObject({
      message: '1234',
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
      altText: 'Card ID: 1234'
    })
  })
})

