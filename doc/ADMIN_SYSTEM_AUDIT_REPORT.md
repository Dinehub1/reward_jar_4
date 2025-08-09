### ADMIN SYSTEM AUDIT REPORT — Aug 2025

#### Completed in this pass
- Security and compliance
  - Verified no `createAdminClient()` usage in client components; usage confined to API routes and MCP scripts. ✅
  - `.pkpass` artifacts removed from `public/`; `*.pkpass` ignored by `.gitignore`. ✅

- Duplication and consolidation
  - Removed unused wrapper `src/components/unified/CardLivePreviewInFrame.tsx`. ✅
  - Added shared fetch utility `src/lib/admin-fetch.ts`; integrated into `src/lib/admin-data-service.ts` and `src/lib/hooks/use-admin-data.ts`. ✅
  - Centralized Google Wallet building with `src/lib/wallet/builders/google-pass-builder.ts`; route refactored. ✅
  - Centralized PWA wallet HTML with `src/lib/wallet/builders/pwa-pass-builder.ts`; route refactored. ✅

- UI and performance
  - Migrated key `<img>` usages to `next/image` (QR component, live preview, logo upload, admin business header, admin card selector). ✅
  - Remaining two live-preview images keep explicit width/height pending domain allowlist.

#### In progress / next actions
- Cleanup lint hotspots: unused imports/vars, `react-hooks/exhaustive-deps`, and broad `any` types across admin/dev tools, analytics, hooks, and loaders.
- Decide fate of `src/lib/card-mappers.ts` (unused): wire into preview pipeline or remove.
- Optional: convert remaining dynamic `<img>` to `next/image` once domains are configured.

#### Notes
- Type-check baseline is green (`tsc --noEmit`).
- ESLint still reports warnings in admin/dev/test areas; targeted cleanup planned.