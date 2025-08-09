# Card & Wallet Cleanup Summary

## What changed
- Unified preview rendering via `src/components/shared/CardPresentational.tsx` and `src/components/unified/CardLivePreview.tsx`.
- Centralized Apple helpers in `src/lib/wallet/apple-helpers.ts`:
  - `buildAppleBarcode()`, `getAppleWebServiceUrl()`, `generatePKPass()`
- Standardized PWA manifest with `src/lib/wallet/pwa-manifest.ts`; both stamp and membership routes use it.
- QuickStart mapping now uses `src/lib/generation.ts` to produce the same payload as Advanced.
- Removed checked-in `*.pkpass` artifacts and ensured ignore rules.

## Where to update going forward
- Previews: edit `CardPresentational.tsx` for visual changes; it propagates to admin cards, sandbox, and QuickStart.
- Apple pass: fields/URLs/barcode via `apple-helpers.ts` and `apple-pass-builder.ts` only.
- Google wallet: use `google-pass-builder.ts` for IDs, objects, JWTs; avoid inline duplication.
- PWA: update `pwa-manifest.ts` to change theme/icons/scope; update `pwa-pass-builder.ts` for HTML.

## Test plan
- Unit
  - `buildPwaManifest` shape
  - `buildAppleBarcode` outputs `barcodes` array
  - `mapQuickToAdvancedPayload` matches API schema
  - `generateCardContent` returns expected fields
- E2E/manual
  - Admin cards/sandbox/quickstart all render identical previews for the same data
  - Apple add: barcode + colors match preview
  - Google add: QR and loyalty points reflect preview
  - PWA install: icons and theme consistent across stamp/membership

## QA checklist
- Color, emoji, progress bars identical across screens
- Apple and Google routes return consistent payloads for the same card
- PWA manifest returns same icons/scope across routes
