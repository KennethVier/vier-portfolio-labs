# Royal boutique typography refinement

Date: 2026-11-08, Asia/Manila. Continued on `feature/pesopilot-business-royal-theme` from `4912401`; no new branch was created.

## Changes

- Cinzel is a visual approximation of the described Kingdomson royal aesthetic, not an identification or reconstruction of its exact logo lettering. Only the PesoPilot Business wordmark (700, 0.015em letter spacing) and decorative POS eyebrow (600, 0.04em) select it.
- Plus Jakarta Sans remains the functional family: headings 800; product names 700; prices and transaction totals 800; buttons/navigation 700; body 500 and helper text 400. This includes product-card/modal titles, photo-manager labels, inventory, sales history and audit monetary values. Numeric text uses tabular figures and no longer selects the monospace family in Business Mode.
- `business.css` defines reusable scoped font/weight tokens and `business-wordmark`, `business-boutique-heading`, `business-product-name` and `business-amount` classes. Personal Finance typography and shared UI components are untouched.
- One Latin, normal-style variable WOFF2 file per family avoids separate static-weight imports. The Cinzel asset is 25,904 bytes, from pinned `@fontsource-variable/cinzel@5.3.0`, with the exact OFL notice/license and SHA-256 recorded under `public/fonts/business`. CSS selects Cinzel 600–700 and Plus Jakarta Sans 400–800. No added npm dependency, manifest/lockfile change, remote font stylesheet or runtime Google Fonts request.
- Existing colors, card structure, layout classes, photos, modals, navigation, data stores, transactions and audit calculations are preserved. JSX changes only assign typography classes or wrap text in spans; no behavior changes.

## Validation

- `npm run test`: PASS — 115 files, 1,247 tests.
- `npm run lint`: PASS — no warnings/errors.
- `npm run build`: PASS. The same two existing upstream Zod comment warnings remain.
- Built Cinzel checksum matches the source asset; its license is included in `dist/fonts/business`.

No new tests were added for this typography-only change. Scoped OWASP Top 10:2025/applicable ASVS 5.0 review found no new injection, network, persistence or authorization surface. Text remains React-escaped and the pinned font is served locally with its license. No findings identified; this is not a compliance claim.

No browser, browser automation, push, merge, deployment or external design research was used. Real iPad font rendering and wrapping remain manual acceptance work; existing responsive layout and touch sizes are unchanged. Unrelated uncommitted work is preserved.

## Manual review in PowerShell

```powershell
Set-Location 'C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-royal-theme\apps\pesopilot-web'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Stop any server already using 5173, then open `http://127.0.0.1:5173/business` manually in the same browser profile/origin as before. Review the wordmark, POS eyebrow, product names, prices, sale confirmation totals, inventory and audit/history text in iPad landscape and portrait. Functional UI must remain Plus Jakarta Sans; Cinzel must remain decorative only.

Repeat checks from the same directory with `npm.cmd run test`, `npm.cmd run lint`, and `npm.cmd run build`. Optional non-mutating dependency validation: `npm.cmd audit --audit-level=high`; not rerun for this change because no dependencies changed.
