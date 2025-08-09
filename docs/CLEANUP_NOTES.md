### Repo Cleanup Notes

Date: current workspace run

- QR code consolidation
  - Added `src/components/shared/QRCodeDisplay.tsx` and refactored usages in `src/app/admin/cards/page.tsx` and `src/components/modern/wallet/WalletPassFrame.tsx` to import this shared component.

- PKPass artifacts removal
  - Removed `dist/working.pkpass` and `public/working.pkpass`.
  - Appended `*.pkpass` to `.gitignore`.

- JSX and TS fixes
  - Escaped JSX entities across pages (debug-maps, admin dev-tools, onboarding, join, admin businesses, admin layout client).
  - Converted `require('crypto')` to `import crypto from 'crypto'` in Google wallet route.
  - Fixed `PageTransition` easing typing and added missing `React` imports where required.
  - Corrected device frame shadows to use `designTokens.wallet.shadows.device`.
  - Removed invalid fields from `src/lib/card-mappers.ts` to align with `CardLivePreviewData`.

- Dead export cleanup
  - Removed legacy wallet re-exports from `src/components/modern/index.ts`.

- Any type hardening
  - Replaced broad `any` in several hotspots with safer checks or `unknown`-based narrowing, and added targeted fixes in admin debug/test pages.

Verification
- Ran `pnpm lint --fix` and `npx tsc --noEmit`. Outstanding warnings remain primarily in dev/test/admin demo files; targeted cleanup is ongoing as needed.

