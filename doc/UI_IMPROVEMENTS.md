### UI and Analytics Improvements — RewardJar 4.0

This plan focuses on navigation clarity, analytics that drive business outcomes, new decision-support tools, better visualization UX, and design consistency across the admin experience.

### 1) UI Navigation Improvements

- Simplify admin IA (Information Architecture)
  - Consolidate dev/test areas under a single `Admin → Dev Tools` hub; hide in production via env flag.
  - Group operational pages: Businesses, Customers, Cards, Support under one “Operations” section; keep Analytics as a first-class menu.
  - Reduce nested routes where not necessary; ensure every page has clear “Back” affordances and breadcrumbs.

- Standardize page headers and actions
  - Use consistent header stack: Title, subtitle, primary action on the right (e.g., Create New Card) across all admin pages.
  - Keep filter/search bars directly under the header; move secondary actions (export, bulk ops) into an actions row.

- Improve cards navigation
  - Use a single creation entry: `/admin/cards/new?mode=quick|advanced` (already aligned) and provide contextual links from lists.
  - Within details pages, expose tabs for Overview, Customers, Rewards, Wallet, Activity to reduce page hopping.

### 2) Top Analytics & Business Performance

- High-value KPIs for admins (dashboard summary)
  - Top-performing businesses by: revenue (if available), visits (customer_cards activity), reward redemptions.
  - Engagement: active customers, weekly new customers, repeat rate, churn risk.
  - Card performance: join rate, average stamps/session usage to completion, redemption rate, time-to-reward.

- Business-level drill-down (per business)
  - Revenue and transactions (if not present, add `transactions` table; see Data Model note below).
  - Customer visits and reward redemptions timeline (7/30/90-day views).
  - Card funnel: joins → progress → redemptions; membership utilization (sessions used vs total).

- Transaction records breakdown
  - By business, by card, and by day/week: gross, discounts, net, average order value.
  - If transactions not yet modeled, introduce `transactions(id, business_id, customer_id, amount_cents, created_at)` plus optional `line_items` later.

- Trends and anomalies
  - Baselines: moving averages for visits and revenue; flag deviations >2σ.
  - Cohort views: by join week/month; retention and redemption curves.
  - Seasonality markers: weekday vs weekend, holiday spikes.

### 3) New Tools & Features Needed

- Decision dashboards
  - “Top Businesses” leaderboard with filters (time range, region, category) and drill-through to business details.
  - “Card Funnel” dashboard comparing stamp vs membership performance; template-level breakdowns.
  - “Redemptions & Liability” dashboard for pending rewards (unredeemed value proxy) and expected future liability.

- Alerts and anomaly detection
  - Threshold-based alerts (e.g., visits ↓ >30% WoW, redemptions spike >2σ) via Slack/email (hooks exist in alerts APIs).
  - Daily/weekly digest to owners: top cards, at-risk trends, recommended changes.

- Operational tools
  - Bulk actions: pause/activate cards, targeted customer re-engagement (email export), template A/B suggestions.
  - Data export (CSV/JSON) with consistent schemas; respect role and RLS.

### 4) UI/UX Enhancements for Analytics

- Visualization & filtering
  - Time-range pickers (7/30/90 days, custom); preset comparisons (WoW, MoM).
  - Segmentation filters: business, card type, template, customer cohort.
  - Charts: area/line for trends, bar for leaderboards, funnel for card journey, scatter for anomalies; always include sparklines in tables.

- Drill-down patterns
  - Click any KPI to see contributing records (e.g., list of transactions or customer events) with breadcrumbs back.
  - Keep table columns consistent: date, entity (business/card/customer), metric, delta vs baseline; allow column toggles.

- Real-time updates (where meaningful)
  - Use SWR revalidation and light polling for dashboards; push updates from admin notifications for critical metrics.
  - Badge-level counters on sidebar for pending support items and alerts.

### 5) Overall Design Consistency

- Components & styles
  - Use `CardLivePreview` as the only production preview; keep legacy previews dev-only.
  - Use shared `QRCodeDisplay` for QR; remove page-local renderers.
  - Standardize headers: `text-3xl font-bold` titles; `text-muted-foreground` for subtitles.
  - Apply consistent spacing (8px base), button variants, badge styles, and empty states.

- Patterns & responses
  - API envelope `{ success, data, error, meta }` everywhere (including analytics/health) to simplify client code.
  - CamelCase JSON at the API boundary; map DB snake_case in routes.

---

Implementation notes

- Routes
  - Continue consolidating under `GET /api/admin/dashboard?section=...` and `GET /api/analytics` for richer metrics; add `?timeRange=` and `?groupBy=` (business|card|template) with a consistent envelope.
  - Add anomaly endpoint `GET /api/analytics/anomalies?metric=visits|redemptions&window=30d` for flagged outliers.

- Data model
  - If revenue tracking is required, introduce `transactions` and compute derived metrics server-side; index by `business_id`, `created_at`.
  - Reuse `customer_cards` for engagement; ensure joins to `stamp_cards`/`membership_cards` and `businesses` are covered by indexes used in analytics queries.

- UI
  - Create `src/app/admin/analytics/page.tsx` with tabs: Overview, Businesses, Cards, Anomalies; use SWR hooks and lazy-load charts.
  - Split `src/app/admin/debug/page.tsx` into dynamic tabs for performance.

- Performance & DX
  - Lazy-load charting libs; memoize heavy tables; ensure envelope and types for analytics; add tests for envelope shape and mapper parity.

References
- @ADMIN_SYSTEM_AUDIT_REPORT.md
- @ROUTES.md
- @debug.md
- @MODERN_ADMIN_UI_PLAN.md
- @SMART_CARD_CREATION_GUIDE.md
- @SOFTWARE_IMPROVEMENTS.md
- @SCHEMA.md
- @WALLET_CHAIN_COMPLETION_SUMMARY.md

