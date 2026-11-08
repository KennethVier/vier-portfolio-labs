# Guided Inventory product creation — local review

Date: 2026-11-08, Asia/Manila. Implemented locally on `feature/pesopilot-business-royal-theme`, continuing from `d82f9e9`. Client acceptance and the separate client-ready sample cleanup remain pending.

Worktree: `C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-royal-theme`.

## Operator workflow

1. Open **Inventory → Add Product** and choose **Product Category**. Initially this is the only field.
2. Choose the shawl, scent, Solo/Set or pillow size shown for that category. Catalog prices fill automatically and are read-only. **Other product** exposes a custom name and unit price instead.
3. Enter **Opening Stock Quantity**, initially zero. Each newly created item gets separate stock by default. Receiving later deliveries and signed adjustments remain in the existing Inventory workflow.
4. Review the generated item name, category, price and stock summary, then press **Save Product**. No catalog entry or stock is inserted until this action. Repeated clicks are locked.
5. Photos remain optional and separate from creation. A link points to **Product photos** immediately below the form; save confirmation also directs the operator there. Existing photo display, family ownership and persistence are retained.

The old “POS category & variant options (optional)” section and editable family/metadata fields are removed. Royal colors, ivory panels, Cinzel branding, Plus Jakarta Sans functional typography, responsive columns and touch targets are retained. The POS is not redesigned.

## Catalog and persistence boundaries

`productCreationService` derives names and explicit metadata from fixed, validated choices. It reuses the existing centavo parser and strict `catalogMetadataSchema`. The seven known categories generate the supplied 52 saleable options and exact prices; custom products keep their original metadata-free contract. Pillow selection labels display ×, while saved sizes retain the existing `16x16`/`17x24`/`18x28`/`20x30` identifiers so photo/POS family and backup behavior remain compatible. No product-name splitting is used to derive metadata.

Duplicate checking compares explicit category/family/scent/type/size coordinates where present, with normalized complete names for custom/legacy items. Actual and Sample are separate contexts. Within Actual inventory, changing the display name, price or selected stock group does not bypass a matching variant's duplicate check. Existing arbitrary families without option coordinates retain differently named items; no missing dimensions are invented. Existing duplicates are not rewritten, merged or deleted, and valid old backups remain restorable.

The form explains duplicates before save. The repository repeats the check inside the same Dexie write transaction, before inserting any product, independent pool, opening movement or event. This prevents two connections from adding the same item concurrently without requiring new persisted fields or indexes.

**Advanced · Shared stock** is collapsed initially. Only an explicit selection shares an existing actual group. The UI filters malformed, inconsistent and Sample groups. The repository verifies the selected pool exists, has members and a safe nonnegative current quantity, agrees with cached member quantities and remains in the same Actual/Sample context. It reads the current quantity under the write lock. Shared creation sends zero opening stock and creates no additional quantity or movement; the summary explains this. A stale/unavailable selection blocks saving. Existing receiving, consumption and transaction rules are unchanged.

Business Dexie schema **3** and backup format **3** are unchanged. No service for sales, audit formulas, date handling, photo persistence or Personal Finance was changed. The only `businessService` change exports its existing price parser for reuse. There are no dependency, lockfile, backend or migration changes. No application/sample records were inserted by the agent; automated fixtures use fake-indexeddb.

## Validation

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 413 packages |
| `npm run test` | PASS — 117 files, 1,329 tests |
| `npm run lint` | PASS — no warnings/errors |
| `npm run build` | PASS — local production bundle |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

82 new tests cover every supplied catalog option and exact generated metadata/prices, custom products, incomplete selections, zero stock, explicit save, duplicate clicks and variants, concurrent duplicate writes, independent quantities/photo-family identity, advanced sharing, current shared quantity, missing/invalid groups, source isolation, errors and unchanged backup/Personal behavior. Existing full inventory/sale/audit/photo regressions pass; two existing UI workflows now use the guided form. The build retains the two upstream Zod purity-comment warnings.

The first `npm ci` attempt encountered a locked esbuild executable from the already running server in this worktree. Only that verified Vite/esbuild pair was stopped; reinstall passed and the same hidden local server was restored on `127.0.0.1:5173`. A plain HTTP check of `/business/inventory` returned 200. No browser, browser automation or computer-use tools were used; this HTTP response does not establish visual or iPad acceptance.

Scoped OWASP Top 10:2025/applicable ASVS 5.0 review checked fixed-option validation, numeric bounds, React escaping, duplicate write serialization, verified shared-stock selection, atomic rollback, Actual/Sample separation and Personal isolation. No findings were identified; this is not a compliance claim. React review checked pure derived previews, minimal draft state, semantic labels, stable keys and explicit event-driven writes.

## Manual review

The existing local server has been restored. Open `http://127.0.0.1:5173/business/inventory` manually. To start it later, use Node 24 and PowerShell:

```powershell
Set-Location 'C:\Users\Kenneth\Projects\PORTFOLIO_OVERALL\.worktrees\pesopilot-business-royal-theme\apps\pesopilot-web'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Do not start another server while port 5173 is in use. Retain the same browser profile/host/port to access the same local records. Review all eight categories, both iPad orientations, zero stock and duplicate warnings, the Advanced explanation and photo link. Record a sale only after confirming the displayed stock/prices. No push, merge or deployment was performed. Existing unrelated work is preserved.
