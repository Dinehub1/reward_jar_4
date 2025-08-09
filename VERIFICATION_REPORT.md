### Verification Report — RewardJar 4.0 Improvements

This report validates the implementation status of the improvements described in `doc/SOFTWARE_IMPROVEMENTS.md` and documented canonical endpoints in `docs/ROUTES.md`.

### 1) Routes
- Admin dashboard unified endpoint
  - File: `src/app/api/admin/dashboard/route.ts`
  - Checks: role detection, `?section=` and `?details=` params, standard envelope
  - Result: PASS (role check, `section` supported, envelope used)

- Legacy dashboard routes (gated or deprecated)
  - Targets: `dashboard-unified`, `dashboard-metrics`, `dashboard-summary`, `dashboard-debug`
  - Expected: deprecation warning or gated by `DISABLE_LEGACY_ADMIN_ENDPOINTS`
  - Result: FAIL (legacy endpoints still active; gating not added)
  - Fix: Add env guard or redirect with deprecation headers in each legacy route under `src/app/api/admin/*`.

- Wallet routes use wallet-generation-service
  - Files: `src/app/api/wallet/google/[customerCardId]/route.ts`, `src/app/api/wallet/apple/[customerCardId]/route.ts`
  - Checks: call `buildUnifiedCardData()` and `signForPlatform()`; standard envelope
  - Result: PASS

- Wallet status endpoint
  - File: `src/app/api/wallet/status/[customerCardId]/route.ts`
  - Result: PASS

### 2) API Response Envelope
- Standard envelope `{ success, data, error, meta }` with `meta.requestId` and `meta.timestamp`
  - Updated routes using envelope: `admin/dashboard`, `wallet/google`, `wallet/apple`, `wallet/status`
  - Analytics/Health routes still use legacy shapes
  - Result: PARTIAL (new endpoints use envelope; analytics/health still legacy)
  - Fix: Apply `envelope()` in `src/app/api/analytics/route.ts` and `src/app/api/health/*` routes and ensure camelCase.

### 3) UI/UX Cleanup
- Legacy preview components (dev-only)
  - Files: `src/components/modern/wallet/WalletPreviewCard.tsx`, `WalletPreviewContainer.tsx`, `WalletTestDemo.tsx`, `StampCardDemo.tsx`
  - Check: Not used by production pages
  - Result: PASS (only referenced in dev/demo components)

- Admin pages use `CardLivePreview`
  - Files: `src/app/admin/cards/page.tsx`, `src/app/admin/cards/new/unified-page.tsx`, `src/app/admin/cards/new/advanced-page.tsx`, `src/components/admin/QuickStartCardWizard.tsx`
  - Result: PASS

- Shared QR component in use
  - File updated: `src/app/admin/cards/page.tsx` now imports `QRCodeDisplay` from shared module
  - Result: PASS (for this page). Broader project still uses shared QR; no other local QR generator detected.

- Split heavy debug page into dynamic tabs
  - File: `src/app/admin/debug/page.tsx`
  - Result: FAIL (still monolithic)
  - Fix: Factor heavy tabs into `src/app/admin/debug/tabs/*` and `next/dynamic` load per tab.

### 4) Duplication Removal
- Remove broken exports in modern index
  - File: `src/components/modern/index.ts`
  - Result: PASS (non-existent wallet views commented out)

- Duplicate QR code generation
  - Result: PASS for targeted page; shared `QRCodeDisplay` is used across preview components. No additional page-local generators found.

- Single-source mapping
  - UI preview mapping: `src/lib/card-mappers.ts`
  - Wallet payload mapping: `src/lib/wallet/unified-card-data.ts`
  - Result: PASS (admin pages use `card-mappers`; wallet routes use `unified-card-data` via service)

### 5) Performance
- Remove unused/broken production imports
  - Result: PASS (broken exports removed; dev-only previews contained)

- Lazy-load heavy imports
  - QR: shared component uses dynamic import of `qrcode` (OK)
  - Debug tabs: not code-split
  - Result: PARTIAL
  - Fix: Code-split `admin/debug` tabs using `next/dynamic`.

### 6) Developer Experience (DX)
- `docs/ROUTES.md` exists and matches canonical endpoints
  - File: `docs/ROUTES.md`
  - Result: PASS

- Tests
  - Envelope shape tests: MISSING
  - Mapper parity tests: MISSING
  - Import smoke test for modern index: MISSING
  - Result: FAIL
  - Fix: Add unit tests under `__tests__/api/admin/dashboard.spec.ts`, `__tests__/wallet/routes.spec.ts`, mapper tests, and simple import test for `src/components/modern/index.ts`.

- Lint/Type/Test/Playwright
  - Current: `pnpm lint` reports multiple warnings and some errors unrelated to the new changes; suite not green
  - Result: FAIL
  - Fix: Address specific eslint errors (prefer-const, no-unescaped-entities, jsx-a11y/alt-text) in flagged files; keep warnings as backlog where acceptable, ensure errors are resolved.

### Overall Completion
- Status: PARTIAL
- Estimated completion: ~55%

### Summary of Missing Items
- Route gating for legacy admin dashboard endpoints
- Standard envelope on analytics/health routes
- Split `src/app/admin/debug/page.tsx` into dynamic tabs
- Add unit tests for envelope, mappers, and import smoke tests
- Resolve remaining ESLint errors to achieve green checks

### Recommended Next Actions
1) Add env guard in legacy admin dashboard routes: return 404 or deprecation header when `DISABLE_LEGACY_ADMIN_ENDPOINTS=true`.
2) Wrap `analytics` and `health` responses with `envelope()` and ensure camelCase keys.
3) Code-split `admin/debug/page.tsx` into `debug/tabs/*` using `next/dynamic`.
4) Implement tests; run `pnpm lint && pnpm type-check && pnpm test && pnpm playwright test` until green.

