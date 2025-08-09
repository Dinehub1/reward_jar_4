### WALLET JSON AUDIT

This document catalogs wallet-related JSON files and dynamic JSON generators, detects duplicates, and maps where they are used in the card creation process (Apple Wallet, Google Wallet, and PWA).

---

## 1) Located wallet JSON files

Static JSON files found in the repo matching the requested keys/patterns:

- Apple Wallet (PKPass) JSONs:
  - `/Users/dev/Documents/Reward jar 4.0/rewardjar_4.0/dist/pass.json`
  - `/Users/dev/Documents/Reward jar 4.0/rewardjar_4.0/dist/ios_production_build/pass.json`
  - PKPass manifest JSONs (note: these are the PKPass SHA-1 file hash manifests, not PWA manifests):
    - `/Users/dev/Documents/Reward jar 4.0/rewardjar_4.0/dist/manifest.json`
    - `/Users/dev/Documents/Reward jar 4.0/rewardjar_4.0/dist/ios_production_build/manifest.json`

- PWA Manifest (served dynamically as JSON; no static file checked into repo):
  - Route: `/Users/dev/Documents/Reward jar 4.0/rewardjar_4.0/src/app/api/wallet/pwa/membership/[customerCardId]/manifest/route.ts`

- Google Wallet: no static `.json` templates checked in; JSON payloads are constructed dynamically in API routes.

Common directories checked: `dist/`, `public/`, `src/app/api/wallet/*`, and related `templates/` or `cards/` folders. No additional wallet-related `.json` templates were found outside the above.

---

## 2) Duplicate/near-duplicate detection — Resolved

- Apple Wallet `pass.json` duplicates:
  - `dist/pass.json` and `dist/ios_production_build/pass.json` were identical build artifacts and have been removed.
  - Centralization completed: Apple pass JSON is now composed via a shared builder utility used at runtime.

- Apple Wallet `manifest.json` duplicates:
  - `dist/manifest.json` and `dist/ios_production_build/manifest.json` were PKPass hash manifests and have been removed. These are generated at runtime and should not be committed.

- Google Wallet JSON:
  - No duplicate `.json` templates exist; JSON is composed dynamically in code.

Resolution: Removed duplicated artifacts and enforced programmatic generation. `dist/` is now git-ignored to prevent re-commits.

---

## 3) Usage mapping in card creation

Where Apple, Google, and PWA JSON is produced/used during card creation:

- Apple Wallet (dynamic `pass.json` generation)
  - Dynamic issuance (loyalty/membership auto-detected):
    - `src/app/api/wallet/apple/[customerCardId]/route.ts`
      - Constructs `passData` including `formatVersion`, `passTypeIdentifier`, and `storeCard` fields, then embeds into a `.pkpass` ZIP.
      - Also generates a PKPass `manifest.json` and `signature` at runtime before returning the `.pkpass` response.
  - Membership-specific issuance page (HTML with wallet links and generation logic):
    - `src/app/api/wallet/apple/membership/[customerCardId]/route.ts` (also constructs Apple pass content dynamically; not using static JSON files)
  - Wallet updates service (Apple Wallet web service URL target):
    - `src/app/api/wallet/apple/updates/route.ts`

- Google Wallet (dynamic JSON objects)
  - Dynamic issuance per card:
    - `src/app/api/wallet/google/[customerCardId]/route.ts`
      - Builds a `loyaltyObject` JSON and issues a JWT Save URL page; no static `.json` files used.
  - Class creation (admin/test tooling):
    - `src/app/api/wallet/google/class/route.ts`
      - Builds a `loyaltyClass` JSON body and calls Google Wallet API; again, no static `.json` file.

- PWA (dynamic manifest and PWA wallet page)
  - PWA wallet page for membership cards:
    - `src/app/api/wallet/pwa/membership/[customerCardId]/route.ts` (HTML UI; links to manifest and Apple/Google options)
  - PWA manifest (returned as JSON):
    - `src/app/api/wallet/pwa/membership/[customerCardId]/manifest/route.ts` (returns `Content-Type: application/manifest+json`)

- Build-only Apple Wallet tooling (not used at runtime):
  - `dist/ios_production_fix.js` – Generates `ios_production_build/pass.json`, PKPass `manifest.json`, signs, and outputs `ios_production.pkpass` (then copies to `public/`). These artifacts are not imported by the API routes.

Notes on UI entry points related to wallet flows:
- Admin test tooling references:
  - `src/app/admin/test-cards/page.tsx` includes endpoints for Apple/Google/PWA tests.
- Join/Download flows:
  - Customer and PWA routes provide links to `/api/wallet/apple/[customerCardId]`, `/api/wallet/google/[customerCardId]`, and PWA membership pages that include manifest links.

---

## 4) Consolidation status

- Build artifacts cleanup:
  - Removed `dist/pass.json`, `dist/ios_production_build/pass.json`, `dist/manifest.json`, and `dist/ios_production_build/manifest.json`.
  - Added `/dist/` to `.gitignore`.

- Centralized Apple pass JSON construction:
  - `src/lib/wallet/builders/apple-pass-builder.ts` is the single source of truth.
  - Both Apple routes now use the builder:
    - `src/app/api/wallet/apple/[customerCardId]/route.ts`
    - `src/app/api/wallet/apple/membership/[customerCardId]/route.ts`
  - All Apple passes now come from one source.

- Clarify PWA vs PKPass manifests:
  - PKPass `manifest.json` (SHA-1 map) differs from the PWA manifest (web app manifest). Keep naming clear in docs and code comments to prevent confusion.

---

## 5) Quick references (citations)

Apple dynamic pass.json creation and inclusion:

```120:220:src/app/api/wallet/apple/[customerCardId]/route.ts
// ... preamble omitted ...
// Generate Apple Wallet pass JSON
const passData = {
  formatVersion: 1,
  passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
  serialNumber: customerCardId,
  teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
  organizationName: "RewardJar",
  description: `${cardData.name} - ${businessData.name}`,
  logoText: "RewardJar",
  backgroundColor: cardData.card_color ? hexToRgb(cardData.card_color) : (isMembershipCard ? "rgb(99, 102, 241)" : "rgb(16, 185, 129)"),
  // ... storeCard fields ...
}
```

PKPass manifest generation and packaging:

```636:659:src/app/api/wallet/apple/[customerCardId]/route.ts
// Create pass.json
console.log('Generated pass.json:', passJson.length, 'bytes')
'pass.json': sha1Hash(Buffer.from(passJson, 'utf8'))
archive.append(passJson, { name: 'pass.json' })
// ... manifest.json generation and signature append a few lines below ...
```

PWA manifest (dynamic):

```1:49:src/app/api/wallet/pwa/membership/[customerCardId]/manifest/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  const { customerCardId } = await params
  const manifest = {
    name: "Gym Membership - RewardJar",
    short_name: "Membership",
    // ...
    start_url: `/api/wallet/pwa/membership/${customerCardId}`,
    display: "standalone",
    // ... icons ...
  }
  return NextResponse.json(manifest, { headers: { 'Content-Type': 'application/manifest+json' } })
}
```

Google Wallet object (dynamic):

```67:106:src/app/api/wallet/google/[customerCardId]/route.ts
// Use existing approved class
const issuerID = process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
const classId = `${issuerID}.loyalty.rewardjar_v3`
const objectId = `${classId}.${customerCardId.replace(/-/g, '')}`

// Create minimal loyalty object
const loyaltyObject = {
  id: objectId,
  classId: classId,
  state: 'ACTIVE',
  loyaltyPoints: { /* ... */ },
  barcode: { type: 'QR_CODE', value: customerCard.id }
}
```

---

## 6) Summary — After remediation

- Apple Wallet `pass.json` build artifacts removed; dynamic generation remains the source of truth.
- `/dist/` is ignored by git to prevent accidental commits of build outputs.
- Apple pass JSON building centralized in a reusable utility and applied to `apple/[customerCardId]`.
- PWA manifest and Google Wallet continue to be dynamically generated (no static templates).

