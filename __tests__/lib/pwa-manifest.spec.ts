import { buildPwaManifest, DEFAULT_PWA_ICONS } from '@/lib/wallet/pwa-manifest'

describe('buildPwaManifest', () => {
  it('returns correct shape', () => {
    const manifest = buildPwaManifest({
      name: 'Test App',
      shortName: 'Test',
      themeColor: '#000000',
      backgroundColor: '#ffffff',
      scope: '/scope/',
      startUrl: '/scope/start',
      icons: DEFAULT_PWA_ICONS,
    })
    expect(manifest.name).toBe('Test App')
    expect(manifest.short_name).toBe('Test')
    expect(manifest.theme_color).toBe('#000000')
    expect(manifest.background_color).toBe('#ffffff')
    expect(manifest.display).toBe('standalone')
    expect(manifest.scope).toBe('/scope/')
    expect(manifest.start_url).toBe('/scope/start')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)
  })
})

