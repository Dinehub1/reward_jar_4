# Card & Wallet Audit

## 1. Overview

This audit covers all files involved in card creation and wallet delivery across Apple Wallet (PKPass), Google Wallet, and the PWA wallet experience. It identifies duplication, conflicting implementations, UI/render divergences, and data mapping inconsistencies. Concrete remediation steps and tests are provided to unify behavior and visuals across screens and platforms.

## 2. Files found (grouped)

### APIs (server routes)

- Apple Wallet
  - `src/app/api/wallet/apple/[customerCardId]/route.ts`
    - Fetches unified customer card → builds base pass via `buildApplePassJson` → adds barcode and metadata → generates PKPass with manifest/signature
    - Key logic:
      - Builder invocation 159–207
      - PKPass generation/signature 530–760
      - Debug/validation return 215–233
  - `src/app/api/wallet/apple/updates/route.ts`
    - Update service for pass refresh; uses `buildApplePass` and returns updated pass JSON
    - Key logic 101–156
  - `src/app/api/wallet/apple/membership/[customerCardId]/route.ts`
    - Membership-specific Apple Wallet flow using `buildApplePass`; returns HTML preview (and links out). Multiple computed fields for membership.
    - Types/shape: 28–84; handler: 94–120; HTML builder: 244–420

- Google Wallet
  - `src/app/api/wallet/google/[customerCardId]/route.ts`
    - Uses `buildGoogleIds`, `createLoyaltyObject`, `createSaveToWalletJwt`, `buildSaveUrl`; returns Add to Google Wallet HTML
    - Key logic 68–96; object/JWT 73–85; HTML 98–179
  - `src/app/api/wallet/google/class/route.ts`
    - Creates dynamic loyalty class; signs service account JWT; calls Google API
    - Key logic: class def 25–45; JWT 74–85; token exchange 86–102; POST 103–111
  - `src/app/api/wallet/google/membership/[customerCardId]/route.ts` (present)

- PWA Wallet
  - `src/app/api/wallet/pwa/[customerCardId]/route.ts`
    - Fetches stamp/membership data; builds HTML via `buildPwaHtml`; includes QR
    - Key logic: 115–140; GET 1–158; POST 160–220+
  - `src/app/api/wallet/pwa/[customerCardId]/manifest/route.ts`
    - Dynamic manifest (`application/manifest+json`) for stamp/PWA wallet
  - `src/app/api/wallet/pwa/membership/[customerCardId]/route.ts`
    - Membership PWA HTML with offline hints and install prompt
  - `src/app/api/wallet/pwa/membership/[customerCardId]/manifest/route.ts`
    - Membership-specific manifest (returns `application/manifest+json`)

- Wallet updates and provisioning
  - `src/app/api/wallet/process-updates/route.ts`
    - Queue processor with per-platform handlers: `processAppleWalletUpdate`, `processGoogleWalletUpdate`, `processPWAWalletUpdate`
  - `src/app/api/admin/wallet-provision/route.ts`
    - Admin provisioning stub for apple/google/pwa (mocked)
  - Present (not expanded): `src/app/api/wallet/mark-session/[customerCardId]/...`, `src/app/api/wallet/update-queue/[customerCardId]/...`, `src/app/api/wallet/test-update/[customerCardId]/...`

### Builders / Generators

- `src/lib/wallet/builders/apple-pass-builder.ts`
  - `convertHexToRgbColor`, `buildApplePassJson`, `buildApplePass`
  - Sets `formatVersion: 1`, `passTypeIdentifier`/`teamIdentifier` from env; constructs `storeCard` fields
- `src/lib/wallet/builders/google-pass-builder.ts`
  - `buildGoogleIds`, `createLoyaltyObject`, `createSaveToWalletJwt`, `buildSaveUrl`
  - Forces barcode `type: 'QR_CODE'`; signs JWT with service account key
- `src/lib/wallet/builders/pwa-pass-builder.ts`
  - `buildPwaHtml` (HTML generator consumed by PWA route)

### Templates / Static JSON / Assets

- `public/*.pkpass` test/reference artifacts — removed in this pass; `.gitignore` protects against re-commit.
- `public/sw.js` (PWA service worker)
- `public/icons/*`
- `dist/ios_production_fix.js` (script used during Apple pass troubleshooting)

### Preview components

- Unified/modern
  - `src/components/unified/CardLivePreview.tsx` (camelCase props; internal platform toggle)
  - `src/components/modern/wallet/WalletPassFrame.tsx` (unified frame, stamp grid, and shared `QRCodeDisplay`)
  - `src/components/modern/preview/WebFrame.tsx`, `AndroidFrame.tsx`, `iPhone15Frame.tsx` (device frames)
  - `src/components/shared/QRCodeDisplay.tsx` (shared QR generator)

- Inline/duplicated previews
  - `src/app/admin/cards/page.tsx` → `EnhancedLivePreview` with `AppleWalletView`/`GoogleWalletView`/`PWACardView` inline implementations (37–282, and further)
  - `src/app/admin/sandbox/page.tsx` → local `WalletPreview` and grid of previews (1–85; usages 429–452)
  - `src/app/admin/cards/new/page.tsx` → `LivePreview` uses `CardLivePreview` with camelCase payload (301–347)

### Pages & flows (QuickStart / Advanced / Customer join)

- Admin creation: `src/app/admin/cards/new/page.tsx` (Quick Start)
- Admin listing/details: `src/app/admin/cards/page.tsx`
- Admin sandbox: `src/app/admin/sandbox/page.tsx`
- Customer join: `src/app/join/[cardId]/page.tsx`

### Mapping utilities

- `src/lib/utils/field-mapping.ts` (canonical vs legacy mapping; snake_case and camelCase reconciliation)
- `src/lib/card-mappers.ts` (maps admin form shape → `CardLivePreviewData`)

### Tests & dev tools

- Unit: `__tests__/apple-pass-builder.test.ts`
- E2E: `__tests__/e2e/card-join-flow.spec.ts`
- Dev logs: `wallet-errors.log`, `wallet-combined.log`

## 3. Duplicate / Conflicting Items (detailed)

1) Apple Wallet: barcode, URLs, and update shapes diverge
- Files
  - `src/app/api/wallet/apple/[customerCardId]/route.ts` 187–207 (single `barcode`, `webServiceURL` uses `rewardjar.xyz`); 530–760 (PKPass gen)
  - `src/app/api/wallet/apple/updates/route.ts` 128–156 (`barcodes` array + `barcode`); 144 (`webServiceURL` uses `rewardjar.com`)
- Issue
  - Different URL bases (`rewardjar.xyz` vs `rewardjar.com`).
  - Update route includes both `barcodes` array and `barcode`; main route has only `barcode`.
  - Barcode fields are added inline in routes rather than via a shared helper, risking drift.
- Why it’s a problem
  - Passes from main route vs updates can serialize differently; Apple may reject or render differently.
- Example
```159:207:src/app/api/wallet/apple/[customerCardId]/route.ts
// buildApplePassJson(...) then inline barcode/webServiceURL/authenticationToken are added here
```
```128:146:src/app/api/wallet/apple/updates/route.ts
barcodes: [{ message: serialNumber, format: 'PKBarcodeFormatQR', ... }],
barcode:   { message: serialNumber, format: 'PKBarcodeFormatQR', ... },
webServiceURL: `${process.env.BASE_URL || 'https://rewardjar.com'}/api/wallet/apple/updates`,
```

2) Preview duplication and inconsistent render logic
- Files
  - `src/components/unified/CardLivePreview.tsx` (single component with camelCase props)
  - `src/components/modern/wallet/WalletPassFrame.tsx` (unified frame + shared QR)
  - `src/app/admin/cards/page.tsx` → inline Apple/Google/PWA preview components (EnhancedLivePreview)
  - `src/app/admin/sandbox/page.tsx` → `WalletPreview` with own look and behavior
- Issue
  - Three disjoint preview implementations; different gradients, typography, stamp grids, and QR sizing.
  - Mix of snake_case vs camelCase fields in admin pages, bypassing mappers.
- Why it’s a problem
  - “Looks different in screen A vs screen B” regressions; harder to evolve design in one place.
- Example
```78:140:src/app/admin/cards/page.tsx
// AppleWalletView with custom grid, gradients, QR sizing (inline)
```
```142:187:src/app/admin/cards/page.tsx
// GoogleWalletView with separate markup and styles
```
```189:269:src/app/admin/cards/page.tsx
// PWACardView diverging styles and progress
```

3) Data mapping inconsistency across UI and payloads
- Files
  - `src/lib/utils/field-mapping.ts` (canonical mapping)
  - `src/lib/card-mappers.ts` (preview mappers)
  - Admin pages using direct DB fields: `src/app/admin/cards/page.tsx` (uses `card_color`, `icon_emoji`, `reward_description`) vs Quick Start `CardLivePreview` expects camelCase
- Issue
  - Mixed casing and field names: `card_color` vs `cardColor`, `icon_emoji` vs `iconEmoji`, `total_stamps`/`stamps_required`.
  - Some pages build preview data inline instead of using `card-mappers.ts`.
- Why it’s a problem
  - Preview can differ from final payload; transformations can be missed, causing UI parity issues.
- Example
```72:89:src/components/unified/CardLivePreview.tsx
// Expects camelCase: cardColor, iconEmoji, stampsRequired
```
```47:106:src/app/admin/cards/page.tsx
// Uses snake_case directly: card_color, icon_emoji, reward_description
```

4) PWA manifest duplication and header handling — RESOLVED
- Unified via `src/lib/wallet/pwa-manifest.ts` and imported by both manifest routes. Identical icons, scope, display, and headers; only names/URLs differ by type.

5) Checked-in PKPass artifacts
- Files
  - `public/*.pkpass`
- Issue
  - Multiple pkpass files are checked in; likely outdated, increase repo size, and can mislead tests.
- Why it’s a problem
  - Developers may reference stale artifacts; increases maintenance and adds confusion.

6) Apple pass webServiceURL construction divergence — RESOLVED
- Standardized with `getAppleWebServiceUrl()` in `src/lib/wallet/apple-helpers.ts` and applied in both routes.

## 4. Recommendations (numbered; quick wins first)

1) P0: Consolidate preview rendering
- Replace inline previews in `src/app/admin/cards/page.tsx` and `src/app/admin/sandbox/page.tsx` to use `WalletPassFrame` + a single presentational card view that consumes `CardLivePreviewData`.
- Use `src/lib/card-mappers.ts` to produce preview data consistently.
- Risk: visual; requires QA across screens.

2) P0: Standardize Apple barcode and webServiceURL — DONE
- Introduce `buildAppleBarcode(passId: string, opts)` helper and a `getAppleWebServiceUrl()` utility; use in both Apple routes.
- Ensure one of `barcodes` vs `barcode` is used consistently (Apple recommends `barcodes`).
- Risk: moderate; requires testing of Apple pass acceptance and updates.

3) P1: Enforce canonical field mapping at UI boundaries
- Use `normalizeCardData` and `createDatabasePayload` from `field-mapping.ts` at admin save and preview mapping sites; ensure previews always receive unified camelCase via a single mapper.
- Replace inline mapping in `admin/cards/page.tsx` with `mapAdminCardFormToPreview`.
- Risk: low; safe refactor.

4) P1: Unify PWA manifest generation — DONE
- Extract a shared `buildPwaManifest({name, short_name, ...})` used by both stamp and membership manifest routes; align icons, scope, and headers.
- Risk: low.

5) P2: Remove checked-in PKPass artifacts
- Delete `public/*.pkpass` or move under `doc/examples/` with README clarifying they’re reference only; ensure not bundled in production.
- Risk: low.

6) P2: Google IDs and class consistency
- Keep `buildGoogleIds` as the single source; ensure membership route (if any) reuses it and `createLoyaltyObject`.
- Risk: low.

7) P3: Centralize Apple PKPass signing
- If updates route needs to return a signed pass, export and reuse `generatePKPass` from Apple main route in a shared module.
- Risk: medium; cross-module refactor.

## 5. Tests to run after fixes (E2E & unit)

- Commands
  - `pnpm -s lint && pnpm -s type-check && pnpm -s test`
  - `pnpm -s playwright test`

- Unit
  - Apple builder: ensure `formatVersion === 1`, `passTypeIdentifier` present
  - Google builder: `createSaveToWalletJwt` signs correctly; `buildGoogleIds` matches expected class/object IDs
  - Mapping: `normalizeCardData` and preview mappers produce consistent shapes

- E2E/manual
  - Quick Start preview → create card → compare payload with advanced/admin payload (no casing drift)
  - Join page → Apple add → verify pass fields (primary/secondary/auxiliary) match preview labels and values
  - Google Save URL → inspect JWT payload parity (points/current/total label matches preview)
  - PWA manifest → install prompt and icons consistent for both stamp and membership flows

## 6. TODO / PR Checklist

- [ ] Replace `EnhancedLivePreview` and `AdminSandbox` previews with `WalletPassFrame` + single presentational component
- [ ] Add `buildAppleBarcode` and `getAppleWebServiceUrl` utilities; use in both Apple routes
- [ ] Switch Apple routes to a single `barcodes` array (deprecate singular `barcode` if needed)
- [ ] Replace inline data mapping in admin pages with `mapAdminCardFormToPreview`
- [ ] Create `buildPwaManifest` and use in both manifest routes
- [ ] Remove/move `public/*.pkpass` and add README
- [ ] Add/extend unit tests for builders and mappers
- [ ] Run full E2E validating parity across previews and passes

---

Appendix: Selected code references

```159:207:src/app/api/wallet/apple/[customerCardId]/route.ts
// Generate Apple Wallet pass JSON via centralized builder, then barcode/webServiceURL added inline
```

```530:585:src/app/api/wallet/apple/[customerCardId]/route.ts
// PKPass archive creation: pass.json, manifest.json, signature, icons
```

```101:126:src/app/api/wallet/apple/updates/route.ts
// buildApplePass wrapper with derived fields for updates
```

```68:90:src/app/api/wallet/google/[customerCardId]/route.ts
const ids = buildGoogleIds(customerCardId)
const loyaltyObject = createLoyaltyObject({ ids, current, total, ... })
const jwt = createSaveToWalletJwt(loyaltyObject)
const saveUrl = buildSaveUrl(jwt)
```

```1:48:src/lib/utils/field-mapping.ts
// Canonical vs legacy mapping; snake_case and camelCase reconciliation
```

```31:69:src/components/unified/CardLivePreview.tsx
// camelCase props for preview: cardColor, iconEmoji, stampsRequired, reward
```
