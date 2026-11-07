# VISUAL QA — compare by screenshot, not vibes

## Shared visual baseline
- `references/shared-design/kasir-login-design-system.png`: shared login shell/theme style.
- `references/shared-design/kasir-dashboard-design-system.png`: sidebar, header, surfaces, lavender gradient, rounded corners, action buttons.
- `references/shared-design/kasir-product-card-style.png`: visual product thumbnail styles and filters only; do not duplicate cashier cart behavior.
- `references/shared-design/kasir-po-table-style.png`: table/filter row styling only; Admin actions differ.
- `references/admin-approved/`: **empty until user approves admin screens**. Do not claim pixel-perfect Admin UI without approved Admin screenshots.

## Required screenshot captures
- viewport 1536x1024: admin login, dashboard, frame master, lens master, stock, goods receipt, stock request, distribution read-only, PO list/detail, stock mutations.
- 390x844: admin dashboard, master product, stock, goods receipt.
- 375x812: stock request and PO detail.

## Review steps
1. Desktop first: use same shell geometry, typography, accents, cards and paddings as cashier refs.
2. Verify one clear purpose per screen. Dashboard minimal; no analytics bloat.
3. Verify functional elements and correct role label/nav.
4. Measure spacing, compare actual vs screenshot, identify worst visual disparities.
5. Fix, recapture, log actual file path and remaining gaps.
6. For new Admin designs, request visual approval and save images in `references/admin-approved/` to become specific baselines.
7. Test responsive: no page-wide horizontal overflow; drawers and tables stay usable.

## Success criteria
- Shared shell and style match Kasir screenshots closely.
- Admin workflows match PRD and all role boundaries intact.
- Actual screenshot + test report exist for each reviewed page.
- No unvalidated assertions of pixel-perfect match to a nonexistent Admin reference.
