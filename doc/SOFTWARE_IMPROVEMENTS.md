### Software Improvements Plan — RewardJar 4.0

This plan summarizes concrete, high‑impact improvements across routes, data flow, UX, duplication cleanup, performance, and developer experience. It references specific files and proposes safe, incremental edits aligned with the repository rules (Next.js 15 params, Supabase security patterns, RLS/RBAC, SWR data fetching consistency).

### 1) Simplified Routes

- **Unify admin dashboard APIs**
  - Current: `src/app/api/admin/dashboard-unified`, `dashboard-metrics`, `dashboard-summary`, `dashboard-debug`, plus a parallel consolidated `src/app/api/dashboard/route.ts`.
  - **Issue**: Overlapping endpoints increase maintenance and naming ambiguity.
  - **Proposal**: Standardize on a single endpoint: `GET /api/admin/dashboard` with `?section=` and `?details=` query params.
    - Keep role detection in one place and branch internally (admin vs business) as already modeled in `src/app/api/dashboard/route.ts`.
    - Deprecate: `dashboard-unified`, `dashboard-metrics`, `dashboard-summary`, `dashboard-debug` (keep behind a `DISABLE_LEGACY_ADMIN_ENDPOINTS` toggle for a release or two).

- **Unify wallet generation endpoints**
  - Current: `src/app/api/wallet/google/[customerCardId]/route.ts`, `src/app/api/wallet/apple/[customerCardId]/route.ts`, plus admin preview chain under `src/app/api/admin/wallet-chain/preview/route.ts`.
  - **Issue**: Platform-specific duplication and mixed response formats (HTML for Google save, JSON elsewhere).
  - **Proposal**:
    - Keep platform routes but move shared data assembly/signing into `src/lib/wallet/wallet-generation-service.ts` and `src/lib/wallet/unified-card-data.ts` exclusively.
    - Ensure consistent JSON responses for error/success; for Google’s Save URL, return `{ success: true, saveUrl, jwt }`. Serve the HTML handoff page via a separate `GET /api/wallet/google/save-page?token=...` if still needed.
    - Add `GET /api/wallet/status/[customerCardId]` for a lightweight check (uses `wallet-verification.ts`).

- **Gate dev/test utilities**
  - Current: Many dev/test routes under `src/app/api/admin/*` (e.g., `ui-test`, `test-data`, `test-cards`), and public test routes in `src/app/api/test/*`.
  - **Proposal**: Wrap exports with a production guard to 404 in prod builds, or add middleware to block non-admin or production access.

- **Card creation pages**
  - Current: `/admin/cards/new/page.tsx` dynamically loads `unified-page.tsx` which internally toggles quick/advanced; a large legacy `advanced-page.tsx` still exists.
  - **Proposal**: Keep a single canonical route `/admin/cards/new` and support `?mode=quick|advanced`. Move any remaining `AdvancedCardCreation` logic into internal modules used by `unified-page.tsx`, then deprecate the separate `advanced-page.tsx` file when feature parity is complete.

### 2) Improved Communication (Front‑end ↔ Back‑end)

- **Standardize API envelopes**
  - Adopt a single response shape across all routes: `{ success: boolean, data?: T, error?: string, meta?: { requestId, timestamp } }`.
  - Apply to: `src/app/api/admin/*`, `src/app/api/analytics/route.ts`, `src/app/api/wallet/*`, and health endpoints.

- **Consistent naming conventions**
  - Ensure API JSON is camelCase at the boundary even if DB uses snake_case. Normalize in API layer to avoid mixed `stamp_cards` vs `stampCards` in responses.

- **SWR hooks everywhere (no direct DB from client components)**
  - Current: `src/app/admin/cards/page.tsx` fetches from `/api/admin/dashboard-unified` directly via `fetch`, while the hooks system exists in `src/lib/hooks/use-admin-data.ts`.
  - Proposal: Migrate page-level data loads to the SWR hooks for consistency (caching, retry, error handling standardization).

- **Error handling**
  - Add `requestId` and `timestamp` to error responses. Log structured server errors (route, user role, params). Ensure wallet endpoints surface actionable errors (invalid PEM, missing env) via the standard envelope.

### 3) UI/UX Enhancements

- **Single preview system across the app**
  - Current: Unified preview lives in `src/components/unified/CardLivePreview.tsx`. Legacy previews exist: `src/components/modern/wallet/WalletPreviewCard.tsx`, `WalletPreviewContainer.tsx`, `WalletTestDemo.tsx`, `StampCardDemo.tsx`.
  - Proposal: Use only `CardLivePreview`. Mark legacy components as dev-only and exclude from production bundles or remove after migration.

- **Unify Quick vs Advanced flows**
  - Keep the 3‑step Quick Start inside `unified-page.tsx`. Import advanced sections as smaller subcomponents rather than a separate full page. Maintain live preview via shared mappers in `src/lib/card-mappers.ts`.

- **Shared QR code UI**
  - Current: `src/app/admin/cards/page.tsx` defines a local `QRCodeDisplay`. A shared implementation already exists in `src/components/modern/wallet/WalletPassFrame.tsx`.
  - Proposal: Import and reuse the shared `QRCodeDisplay` to remove duplication and ensure consistent sizing/styles across screens.

- **Large admin/debug screens**
  - `src/app/admin/debug/page.tsx` (~1300+ lines) should be split into tab-level dynamic modules to improve TTI and CPU usage. Use `next/dynamic` per tab and minimum skeletons to avoid UI flash.

- **State/validation feedback**
  - Ensure all forms use consistent error banners, field-level validation cues, and minimum loading times for auth-dependent screens. The `AdminLayoutClient` and `useAdminAuth` patterns are solid—replicate across new flows.

### 4) Duplicate or Broken Touchpoints

- **Legacy preview components**
  - Files: `src/components/modern/wallet/WalletPreviewCard.tsx`, `WalletPreviewContainer.tsx`, `WalletTestDemo.tsx`, `StampCardDemo.tsx`.
  - Action: Keep for dev demos only, or remove after confirming no production usage. Update any remaining imports to `CardLivePreview`.

- **Broken exports in modern index**
  - File: `src/components/modern/index.ts` exports `AppleWalletView`, `GoogleWalletView`, `WebPassView` despite no corresponding files. Remove lines 51–53 to avoid dead exports and accidental imports.

- **Mapping duplication**
  - `src/lib/wallet/unified-card-data.ts` (wallet generation) vs `src/lib/card-mappers.ts` (UI preview + form mapping). Keep this separation but ensure all preview needs go through `card-mappers.ts`, and all wallet generation goes through `unified-card-data.ts`. Add tests for parity in common fields (name, color, emoji, reward/session semantics).

- **Duplicate QR code codepaths**
  - Replace page-local QR generators with the shared `QRCodeDisplay` component.

### 5) Performance Improvements

- **Tree‑shaking and bundle hygiene**
  - Remove unused exports in `src/components/modern/index.ts` and legacy wallet preview components from production exports. This reduces bundle size and avoids importing dead code.

- **Code‑splitting**
  - Already using dynamic import for `unified-page.tsx`. Extend the pattern to heavy tabs in `admin/debug/page.tsx` and any large wizard steps. Defer animation libraries on first paint where possible.

- **Caching and data loading**
  - Ensure SWR settings from `use-admin-data.ts` are consistently used. Favor parallel fetches in API routes (already present in unified dashboard route) and ensure indexes exist for frequent filters (stamp/membership card joins). Consider adding ETag/Cache-Control for public, non-sensitive assets used in previews.

- **QR generation**
  - Consolidate on one QR implementation (`QRCodeDisplay`) to avoid multiple copies of `qrcode` in the bundle. If necessary, lazy-load the QR library only when a QR is visible.

### 6) Developer Experience

- **Folder and naming hygiene**
  - Collapse admin dashboard APIs into a single `dashboard` folder. Document sections (`businesses`, `customers`, `cards`, `stats`) in a short route README.
  - Keep platform-specific wallet routes, but centralize logic in `wallet-generation-service.ts` and `unified-card-data.ts`.

- **Types and contracts**
  - Continue strict typing of SWR hooks and API envelopes. Provide Zod schemas or TS types for request bodies to `/api/admin/cards` (creation/update) and wallet routes.

- **Security and env validation**
  - Current usage is compliant: no `createAdminClient()` in client components. Keep `validateServerEnvironment()` in early boot and expand wallet env checks (already in `startup-validation.ts`).

- **Tests and CI**
  - Add tests covering:
    - Route param unwrapping (Next.js 15) for any new dynamic routes
    - API envelope conformance (success/error shapes)
    - Card preview mapping parity between `card-mappers.ts` and DB rows
    - Absence of broken exports (import smoke tests for `src/components/modern/index.ts`)

### Actionable Checklist (Status)

- **Routes**
  - [x] Create `src/app/api/admin/dashboard/route.ts` that merges logic from `dashboard-unified` and replaces metrics/summary/debug via `?section=`
  - [ ] Add deprecation warnings and a `DISABLE_LEGACY_ADMIN_ENDPOINTS` kill switch
  - [ ] Normalize all responses to `{ success, data, error, meta }`

- **Wallet**
  - [x] Move platform-specific assembly/signing into `wallet-generation-service.ts` helpers
  - [x] Ensure `google` and `apple` routes return consistent JSON
  - [x] Add `/api/wallet/status/[customerCardId]`

- **UI/UX**
  - [x] Replace local QR code in `src/app/admin/cards/page.tsx` with shared `QRCodeDisplay`
  - [ ] Migrate any usage of `WalletPreviewCard`/`WalletPreviewContainer` to `CardLivePreview`
  - [ ] Split `src/app/admin/debug/page.tsx` into dynamic subroutes or dynamic tabs

- **Duplication/Broken Exports**
  - [x] Remove dead exports in `src/components/modern/index.ts` (AppleWalletView/GoogleWalletView/WebPassView)
  - [ ] Keep legacy wallet preview components dev-only or remove after migration

- **DX**
  - [x] Add a short `docs/ROUTES.md` describing canonical endpoints and sections
  - [ ] Add unit tests for API envelope shape and mapper parity

### Notes on Compliance with Repo Rules

- **Supabase security**: Admin clients remain server-only (`src/lib/supabase/admin-client.ts`). Client components rely on SWR hooks and public APIs.
- **Next.js 15 params**: Continue typing `params` as `Promise<...>` and use `use(params)` in client components or `await params` in server components.
- **Schema consistency**: Maintain `customer_cards` as the join point; utilities should infer the active card type (stamp vs membership) and set only the appropriate foreign key.
- **Shared component sync**: `CardLivePreview` is the single preview source. Keep shared theme in `src/lib/cardDesignTheme.ts`.

---

This plan favors consolidation, consistency, and a clear separation between dev utilities and production features. It reduces surface area, improves performance, and makes the system easier to reason about and extend.

