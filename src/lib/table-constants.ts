// Shared with both server code (catalog-admin.ts) and client code
// (admin/products/page.client.tsx) — deliberately has no "server-only"
// import so it's safe to pull into a client bundle.
//
// 7, not 6 — the homepage hero's desktop table scene has room for a 7th
// cutout (3-top/4-bottom zigzag; see TABLE_CUTOUT_SLOTS in
// home-hero-flythrough.tsx). The mobile grid still caps at 6 (its 3x2
// layout has no clean spot for a 7th), so whichever product lands 7th in
// the table order (see TableOrderEditor) simply won't render on phones —
// TableOrderEditor labels that slot so it's not a silent mobile gap.
export const MAX_TABLE_PRODUCTS = 7;
