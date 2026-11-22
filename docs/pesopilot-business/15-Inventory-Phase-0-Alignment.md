# Inventory: exact Phase 0 receiving and automatic catalog setup

Approved direction: [owner PR #12 requirements](https://github.com/KennethVier/vier-portfolio-labs/pull/12#issuecomment-7080906528), followed by the owner's explicit correction to preserve `test/pesopilot-ipad-preview` receiving UI/UX. The previous overlapping Staff forms and plain-text Admin list are superseded. Phase 0 remains binding; this is still the existing development alignment workstream, not production cutover.

## Staff: original components, assigned-branch service

`StaffInventory` composes **the original `InventoryPanel` with `DailyStock` as its child**, matching Phase 0. It does not implement an individual-product receiving form. The original stock-on-hand cards, product-group dropdown, search, current-stock labels, independent quantities, responsive grid, fonts/classes and touch interactions remain. Receive stock is expanded by default as the primary function. Correct stock retains its original secondary disclosure, product/direction/quantity/reason controls; Staff cannot edit global purchase costs.

Operational adaptations only:

- Receipts use approved shared catalog definitions after normal synchronization, never unconfigured preset creation by Staff. New definitions do not create physical stock.
- Quantities persist across groups and searches. Blank means no receipt. Shared physical pools appear once, as in Phase 0; duplicate pool receipts are also rejected at the repository boundary.
- Add a reason, review all selected products/quantities plus branch, then confirm once. The existing branch service writes one atomic envelope with a stable request key, actor and branch. An aborted attempt preserves entries/key for retry. Another branch cannot be selected in the Staff form.
- Correct stock requires its own confirmation and stable key. It remains subordinate to grouped receiving and does not invoke a legacy-device write.
- Morning reminders defer while an operational draft/review is active, so they cannot interrupt entering a delivery or correction. Existing sale modal receiving/tawad/sets/payment/confirmation/toast flows remain unchanged.
- The delivery notice says it is saved **on this device**. Actual cloud synchronization status is separate; an unsuccessful push is never described as successful sharing.

## Admin: one-time default product setup, no import prerequisite

The owner has now explicitly authorized automatic initialization of the approved Phase 0 standard definitions for **this existing development business only**. This supersedes the previous requirement to manually preview/add standard choices during initial setup. Optional existing-device product import remains an explicit action; it is not executed by default setup.

`useCatalogInitialization` waits for a readable workspace and a successful authenticated cloud pull before treating a missing local catalog as missing business definitions. Only the canonical business owner with Admin authorization can initialize. Staff never runs initialization. Offline first load shows a connect-once status and preserves cached operations. A secondary Admin sees an owner-setup message instead of attempting privileged writes.

`initializeStandardCatalog` is restricted to `https://z5jxogiwe.dexie.cloud` and the existing business realm. It uses the original `stockPresets`/metadata authority. In one Dexie transaction it:

1. Checks authorization and existing initialization metadata.
2. Matches existing products by their approved coordinates, detects duplicate/colliding definitions and stops for owner review instead of overwriting them.
3. Adds only missing standard definitions with deterministic scalar-prefixed IDs. Existing custom IDs, names, prices, purchase costs, photos, custom products and pool references are retained. New Set price options reuse the corresponding Solo pool.
4. Stores a version-1 setup marker as **additional metadata on a real catalog definition**. No pseudo-product, extra cloud table, realm-owner change or second database authority is introduced. Existing fields on that anchor are unchanged.

New definition `stockQuantity: 0` is catalog compatibility metadata, not a physical inventory receipt/balance. No branch transaction, stock movement, sale or audit is created. All current branch balances/history remain unchanged. Existing definitions are not rewritten to zero.

The marker is shared through Dexie Cloud. Subsequent logins/clients read it and do not seed again. A partially received marked catalog requests updates instead of creating defaults again. Deterministic IDs/insert-only writes prevent replacement of competing saved definitions; a same-cache concurrent-connection test verifies transaction serialization. Actual separate-device/provider concurrency is still a live gate. Failed local transactions roll back completely. A cloud outage leaves durable local writes queued through the existing addon; no custom sync/failover engine is added. Future default-catalog changes require a deliberately reviewed version, not repeated version-1 seeding.

No management credential, OTP, application-user/seat operation, Supabase modification, production URL, destructive migration or local legacy inventory import is involved. Startup after updating is authorized to add these missing development definitions automatically; **no owner shell schema/import command is needed**.

## Admin Inventory Overview

The former plain list is replaced by a searchable/filterable table with Category, Product, Scent/Size/Option, Branch, Available units, Selling price and Stock status.

Rows come from existing **authorized branch-ledger projections**. One row represents one physical pool in one branch. Shared Solo/Set options show their actual prices together without doubling physical units or totals. Separate branches remain separate. Price-only Set pools with zero stock are omitted; a nonzero legacy Set-only pool is retained and marked for review. Missing balances display an em dash / Unavailable, not a fabricated zero. Negative balances remain visible as Needs review.

Branch, category, stock-status and free-text filters are available. Categories/products/variants are sorted; headers use accessible scopes and a caption. The table has a keyboard-focusable horizontal-scroll region on iPad/narrow screens; filters use the existing responsive grid and touch controls. The existing connection/read status remains above it, distinguishing delayed/unavailable records from real zero stock.

## Regression and parity evidence

- Frozen test-only `Phase0DailyStock` and `Phase0InventoryPanel` fixtures are copied from authoritative preview commit `ca3767d19c0b31c2ebf3fbec0062632d6291a7f2`, changing only import paths/export names. They are not shipped through application routes.
- `receivingParity.test.jsx` compares the real Staff composition with those reference components: card/count heading, dropdown classes/options, search label, quantity grid/classes/labels/min/step and correction disclosure. It also exercises multi-group unequal quantities, review-before-write, branch/reason display, preserved failed attempt and stable double-click/retry handling.
- Initialization tests cover missing-only setup, unchanged customized IDs/names/prices/costs/photos, duplicate conflicts, wrong roles/database, atomic rollback/retry, one-time marker, partial pull, newly received Staff catalog and concurrent connections. Hook tests require a completed pull, block offline/Staff seeding and skip subsequent login writes.
- Table tests verify per-branch pool deduplication, actual Solo/Set prices, zero/unavailable/negative states, accessible headers, totals, filters and horizontal-scroll structure.
- Original POS, service/repository accounting and branch receive ten → sell two → eight regressions run with the full suite. Tests targeting the deleted V2 form now target the authoritative receiving/correction controls.

**Evidence limit:** reference DOM/layout-class parity is automated, not a pixel screenshot or physical iPad pass. The browser's previous local-preview connection/policy block remains; no workaround or new visual pass is claimed. Owner desktop/iPad and authenticated cloud acceptance must still be recorded before closing PR #12 or Phase 1.

## Exact PowerShell update and owner acceptance

Stop Vite (Ctrl+C). Node 24 required. Use the existing checkout; change `$repo` only if it lives elsewhere. This updates code; opening the approved development app as the business owner triggers the missing-definition setup described above. Do not clear IndexedDB or run any schema/legacy import.

```powershell
$repo = Join-Path $env:USERPROFILE 'Projects\pesopilot-role-branch-alignment'
$branch = 'feature/pesopilot-business-v2-role-branch-alignment'
Set-Location -LiteralPath $repo
if ((git branch --show-current) -ne $branch) { throw 'Select the existing alignment checkout.' }
if (git status --porcelain) { throw 'Save local changes before updating.' }
git pull --ff-only origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Git update failed.' }
Set-Location '.\apps\pesopilot-web'
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
Remove-Item Env:VITE_BUSINESS_OWNER_MAINTENANCE -ErrorAction SilentlyContinue
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run dev -- --force --port 5173 --strictPort
```

1. In the existing owner profile open `http://localhost:5173/business/products`. Let initial access/pull complete. Confirm approved standard choices are present without publishing/importing; custom names/prices/costs/photos remain. If setup reports a conflict, stop for owner review; never delete duplicates to force setup. Verify existing branch quantities and transaction counts are unchanged.
2. Wait for an actual successful cloud push, then pull in an assigned Staff browser. Verify products appear automatically. Staff must not see product/cost/price editing or another branch's records. On another owner login, verify no duplicate definitions/stock appear.
3. In Staff Branch Inventory compare against Phase 0: stock cards, Receive stock group dropdown, search and quantity grid. Enter different quantities in two groups, switch/search/back and verify drafts persist. Add a reason; review branch/items; confirm once. Correct stock must be a separate secondary disclosure with a reason and explicit confirmation.
4. Use synthetic development stock for ten Lavender Inhaler units → two Cash units sold → eight remaining / PHP 198. Verify same movement, sale and daily audit in another Admin browser after successful synchronization. Retain original sale-modal/tawad/Set/GCash/Coop behavior and test offline reload/reconnect without duplicate receipt/sale.
5. On Admin Inventory Overview test branch/category/status/search, zero versus unavailable data, per-scent price and shared-pool labels. Solo/Set must not double the totals. Verify independent Branch B and actual server denial of unauthorized writes.
6. Review desktop and iPad portrait/landscape with keyboard open: dropdown/search/quantity controls should match Phase 0, and the table scrolls within its own region. Verify focus/confirmation, draft persistence, stock-correction separation and safe-area access. Record physical/browser results separately from repository tests.

From the app folder in another terminal: `npm.cmd test -- --maxWorkers=4`, `npm.cmd run lint`, `npm.cmd run typecheck`, and configured `npm.cmd run build`. Keep PR #12 and PR #10 draft/open; no merge, deployment, production mutation or phase closure.

Repository verification: **150 files / 1,460 tests passed** in the full regression suite; lint, cloud type checking and configured production build passed. Twelve new regressions cover catalog initialization/pull behavior, the reference receiving composition, unequal multi-group retry and the Admin table. Original branch ten → two → eight and Phase 0 sale/payment/tawad/Set tests pass. This is not authenticated hosted or physical-device acceptance.
