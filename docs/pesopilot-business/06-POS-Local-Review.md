# Business POS redesign — local review

Date: 2026-11-08 (Asia/Manila). Manual visual/tablet acceptance pending. No release milestone is marked complete.

Branch: `feature/pesopilot-business-pos-redesign`.

Fetched base: `origin/feature/pesopilot-business-dependency-hardening`, commit `e89ffd6`.

Worktree: `C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-pos-redesign`.

## Run this checkout

```powershell
Set-Location 'C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-pos-redesign\apps\pesopilot-web'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/business` yourself. `npm ci` has already installed this worktree's dependencies. Node 24 is required by the existing package configuration. The strict port prevents accidentally starting a second origin if another checkout is using 5173; stop that development server first.

## Try one recording

1. Click **Load Sample Catalog**, read the fictional-stock notice, select the confirmation checkbox, then confirm loading.
2. The POS switches explicitly to **Sample Catalog**. The seven exact categories contain 52 variants represented by nine product/family cards. Every variant starts with 20 fictional units. Repeating the action never replenishes stock, duplicates products, or replaces existing history.
3. Tap **Hallelujah Rub**, select **Lavender**, **Set**, quantity **2**, and **GCash**. The unit price is ₱150 and the total is ₱300.
4. Tap **Record Sale**, review the product/variant, quantity, method and total, then choose **Owner: Confirm Completed Sale**. Only confirmation writes the sale. The modal closes and that variant has 18 fictional units left; other variants retain their quantities.
5. Open **Daily Audit** and **Sales History**. The recording is labeled Sample and uses the original price/name snapshots. Sample rows are included in their totals and are explicitly labeled. Their stock is independent from actual inventory.
6. **Inventory** retains product entry, explicit stock receiving/adjustments, group selection and stock listings. Optional category/family/scent/type/size fields let real variants appear together without automatically sharing stock. Give each real product its full variant name for readable historical snapshots.
7. **Settings / Backup** retains the existing validated Business-only download and confirmed restore. New exports use format 2 and accept old format 1 backups. No store or index migration is needed.

No shopping cart, checkout, payment processing, customer records, backend, or Personal Finance feature change was introduced. Cash, GCash and Coop Pay remain manually recorded labels. Set still provisionally consumes one stock unit per recorded quantity; samples deliberately have independent stock for every scent and price option. Existing explicitly shared real inventory groups continue using the established atomic repository behavior.

## Automated validation

Commands run in the app directory with Windows `npm.cmd`:

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 413 packages installed; lockfile unchanged |
| `npm run test` | PASS — 112 files, 1,210 tests |
| `npm run lint` | PASS — no errors or warnings |
| `npm run build` | PASS — local production bundle only |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

The suite adds 29 cases beyond the 1,181-test base. It covers explicit sample confirmation, exact catalog names/prices, category/search/source switching, opening/closing/focus behavior, scents/Solo/Set/sizes, quantity validation, all three payment labels, owner confirmation, duplicate taps, uncertain-result same-key retries, stale stock and price, independent sample quantities, audit/history integration, atomic/idempotent/concurrent seeding, collision rollback, development-only loading, actual/sample separation, metadata/legacy-backup round trips, malformed metadata rejection, Business navigation and unchanged Personal regressions.

Tests use Vitest with happy-dom and fake-indexeddb locally; they are not browser/tablet QA. Initial sandbox test/build attempts could not read an ancestor directory used by esbuild; successful runs used approved local execution outside that sandbox. The initial audit attempt could not reach the registry; the network-enabled retry passed. Vite reports the existing two upstream Zod purity-comment warnings and completes successfully. No warnings were suppressed and no dependencies changed.

## Changed-surface review

Scoped OWASP Top 10:2025 and applicable ASVS 5.0 review considered validation/import bounds, React escaping, transaction rollback, idempotency, snapshot integrity, data separation and dependency supply chain. No new HTML execution, secrets, authentication boundary, external data transfer, or unsafe parsing was introduced. No findings were identified in that scoped review; this is not a compliance certification.

The device-local, unauthenticated storage model and plaintext backup behavior are unchanged. Browser download/recovery, real iPad sizing, keyboard/screen-reader operation and physical stock rules still require manual acceptance. No browser or browser automation was opened. No push, PR change, preview-branch modification or deployment was performed. Existing PRs #4–#8, `master`, `pesopilot-dev`, the approved v1.0 authority, and `test/pesopilot-ipad-preview` are untouched.
