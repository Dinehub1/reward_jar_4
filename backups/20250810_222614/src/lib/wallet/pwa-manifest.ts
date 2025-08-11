export interface PwaIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

export function buildPwaManifest({ name, shortName, themeColor, backgroundColor, icons, scope, startUrl }: {
  name: string
  shortName: string
  themeColor: string
  backgroundColor: string
  icons: PwaIcon[]
  scope: string
  startUrl: string
}) {
  return {
    name,
    short_name: shortName,
    theme_color: themeColor,
    background_color: backgroundColor,
    display: 'standalone',
    scope,
    start_url: startUrl,
    icons,
  }
}

export const DEFAULT_PWA_ICONS: PwaIcon[] = [
  { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
  { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
]

