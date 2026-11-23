# V2 Phase 0 baseline and branch parity audit

**Current inventory follow-up:** [Exact original receiving composition, authorized one-time default catalog and Admin stock table](15-Inventory-Phase-0-Alignment.md) supersedes the earlier overlapping forms/manual-standard-setup descriptions below. Phase 0 remains the reference; original device import is still explicit.

Owner authority: [PR #12 clarification, 2026-11-22](https://github.com/KennethVier/vier-portfolio-labs/pull/12#issuecomment-7074689081). Phase 0 is the approved V2 baseline, not a disposable prototype. The current role/branch work extends it. This decision supersedes any earlier wording suggesting the original operator experience may be discarded as legacy.

Reference: `test/pesopilot-ipad-preview` at **ca3767d19c0b31c2ebf3fbec0062632d6291a7f2**. Before this correction, alignment HEAD was `0b7adf7456b3320232bb80ebf13539a17af5f249`. Git ancestry confirms the preview is already an ancestor: this was a wiring/capability regression, not a missing merge. Original components, service contracts, local data and tests remain present.

## Audit method and findings

Compared the original branch's Business components, hooks, services/repositories and QA/runbooks with alignment, including actual route/component callers. Checked which implementation each role reaches rather than treating retained source files as operational parity. The original `RecordSaleModal`, cards, dialogs, stock controls, photos, costs, sales history and audit renderers were the acceptance reference.

Confirmed gaps before this correction:

- `RecordSaleModal.canManage` hid both tawad and receiving from Staff. Admin no longer uses the operational POS, so those cashier controls became unreachable.
- `useBranchWorkspace` supplied `photos: []` and a rejecting `receiveStock` stub. The modal could not read synchronized catalog media or receive through its assigned branch.
- Admin Products had price editing but no operational photo/cost editor. The planner could snapshot a known cost, but normal owners could not enter it; unknown historical costs correctly remained unknown.
- The branch catalog contained only explicitly created/imported definitions. Phase 0's familiar standard choices were absent until setup, and the guided operational form did not expose Set price definitions.
- Morning reminders and seven-day automatic backups still targeted the original device ledger. Branch audit lacked the original explicit refresh action.

## Feature-parity matrix

“Repository verified” means automated interactions/accounting passed; it does **not** mean physical iPad or authenticated cloud acceptance. No row authorizes intentional removal of an approved feature.

| Phase 0 feature / original UI | V2 equivalent and role | Result and evidence |
| --- | --- | --- |
| Royal navy/gold, ivory cards, Cinzel/Jakarta, self-hosted fonts | Same stylesheet and original components; both roles | Retained. No Business CSS redesign in this correction. Physical visual review pending. |
| Product cards and family photo | Same `BusinessPosPage` / `ProductVisual`; Staff | Restored synchronized photos; React card/modal photo assertions. |
| Search, category chips, family grouping, stock labels | Same POS catalog service/components; Staff | Retained original tests plus operational interaction coverage. No reference-snapshot quantities. |
| Familiar 52 shawl/scent/Solo/Set/pillow choices | Admin → Products → More product choices → Review standard product choices | Explicit preview/add; preserves existing IDs/prices/stock, receives no units. Catalog regression verifies 52 definitions and idempotency. Staff cannot create global SKUs implicitly. |
| Guided/custom Add Product | Same `ProductForm`; Admin | Retained; operational form adds explicit Solo/Set choice, zero physical opening stock. React creation regression. |
| Scent / size / variant selection | Original modal and metadata; Staff | Retained; original variant tests and new branch Solo/Set interactions. |
| Solo / Set | Original modal; Admin defines Set per-piece price, Staff selects it | Restored normal setup. New Set definitions reuse the corresponding Solo physical pool; no invented Set stock. Existing definitions are not rewritten. |
| Five pieces per Set, repeated/mixed scents | Original set-content controls; Staff | React mix of two Lavender / zero Negative Ion / other scents; per-scent deductions and five-piece total verified. |
| Quantity input and +/− controls | Original touch controls; Staff | Retained and exercised in operational test. |
| Optional tawad / agreed unit price | Original input restored for operational Staff | Positive price, required explanation when different from catalog basis, review before write; list/basis/actual price and actor retained. Tests cover Solo and Set overrides. |
| Cash / GCash / Coop Pay | Original payment controls / More payment methods; Staff | All three verified through Staff interactions; manual payment labels retained. |
| Review, Back to Edit, confirm before deducting | Original `BusinessDialog` / sale hook; Staff | Review is read-only; current catalog/pool revalidated at atomic confirmation. Stale Set-price rejection tested. |
| Duplicate click / uncertain-result retry protection | Original UI lock plus branch request identity | Double clicks, injected aborted write/retry, historical key aliases and replay tests pass. No second deduction. |
| Transient success feedback | Original three-second sale toast; Staff | Retained and tested to disappear without blocking next sale. |
| Sold-out → receive stock shortcut | Original modal; assigned Staff branch service | Restored multi-scent selection, quantity and shared-pool deduplication; adds receipt reason/review/confirmation. No legacy writes. |
| Grouped delivery receiving | Original `DailyStock` component in Branch Inventory; Staff | Operational mode shows only approved definitions, captures reason, reviews delivery and appends one atomic envelope. React grouped receipt and rollback/idempotency tests. |
| Reasoned single-item receipt/removal | Branch Inventory controls; Staff | Retained same branch accounting/service; existing regression and original correction rules pass. |
| Shared stock pools / variants | Existing pool IDs and movement planner | Retained, receipt aliases cannot double-add one pool; combined sales consume shared units once. |
| Morning low-stock reminder after 7 AM PH | Same reminder using assigned branch source; Staff | Restored; branch/user-scoped dismissal, no read from old POS DB, Branch Inventory shortcut tested. |
| Optional product photos, replace/remove, compressed JPEG/PNG/WebP input ≤2 MiB | Same photo manager/processing; Admin Products | Restored operational persistence and Staff display. Validated bounded family photo in existing catalog; no new cloud table or automatic photo import. Real-addon transport test. |
| Purchase cost per physical piece | Admin product editor; Staff reads branch reports | Restored. Zero/unknown allowed; future sales snapshot cost; no historical backfill. Admin-only repository checks tested. |
| COGS / gross profit and missing-cost notice | Same sales/audit renderers on branch records | Restored known future costs. Set test: 5 × ₱70 cost = ₱350 COGS; sale ₱600 → ₱250 gross profit. Unknown historical units stay marked missing. |
| Catalog price management | Admin product list, searchable by name/scent/size/type | Explicit price/cost editor. Staff tawad changes only its sale, never the catalog. Historical snapshots survive catalog edits. |
| Sales Day/Week/Month/Year/all-time, most units, payment and Set labels | Same `SalesHistory` with branch items | Retained. Staff sees its branch; Admin reads authorized branches; original CSV/filter tests plus operational analytics assertions pass. |
| Daily product audit / PH dates / CSV | Same accounting/audit renderer; both roles scoped appropriately | Retained; explicit Refresh audit restored; branch receiving/sale/profit reconciliation covered. |
| Owner supervision instead of cashier | Overview / all-branch Sales / Analytics / Inventory / Audits / Products / Branches / Settings | Approved role adaptation, not deletion of cashier features. Admin POS absent; Staff owns POS. |
| Offline atomic stock/sales/audit | Same Dexie service/planner on branch envelopes | Retained. Batch receipt/sale is one durable transaction, stable prefixed key with legacy compatibility; existing reconnect/oversell regressions pass. Hosted replay still a live gate. |
| Manual backup | Plain Download backup for authorized branch data; original device backup retained | Includes original stored envelopes, catalog/photos; no silent conversion or restore. Staff has no owner Settings permission. |
| Seven local daily copies after 7 AM | Owner workspace creates operational archive; old archive retained | Restored in additive local snapshot DB v2 `branchDaily`, separate from original `daily`. Seven-copy retention touches archive copies only. Upgrade/retention/privacy test passes. |
| Original device full backup validation / restore | Retained original Settings archive tools; Admin | Preserved for original ledger. **Operational branch restore is not implemented**: separate non-destructive migration/recovery review required. No blanket parity claim. |
| Personal Finance / old POS isolation | Original databases and routes retained | Full existing regression suite passes; no database clearing/rekeying, record rewrite or live import. |
| Server realm/table restrictions | Existing Dexie Cloud business/branch permissions | Unchanged. Staff may append assigned-branch transactions, not edit global catalog/prices/costs/photos or other branches. Live provider-denial checks remain pending. |
| Supabase recovery service | Existing server-only secondary recovery | Unchanged; this correction adds no duplicate writable authority or automatic failover. New-envelope production recovery remains separate work. |

Tests referenced: `components/businessWorkflow.test.jsx`, `components/ProductForm.test.jsx`, `components/ProductPhotoManager.test.jsx`, `services/*test.js`, and `operations/{phase0Parity,catalogParity,automaticBranchBackup,morningBranchCheck,branchRepository,branchWorkflow,ledgerIdentity,workspaceRead}.test.*`. The original tests are run alongside new tests.

## Explicit differences and owner review

These are visible adaptations/gaps, not approval to remove baseline features. The owner must review intentional differences before accepting PR #12; unresolved items stay open.

1. **Role assignment:** owner-level product creation, standard catalog setup, photo/cost/price editing and backup are Admin-only; Staff retains all cashier capabilities. A Staff receipt cannot implicitly create a global product. Admin explicitly previews/adds standard definitions or imports reviewed existing definitions. This follows the approved role model.
2. **Receiving:** the original selected-scents/units UX is retained. Operational receipts additionally require a reason and an explicit review/confirmation, commit all selected pools atomically, and use the assigned branch. Set is a selling-price option for Solo pieces, not a receipt of five units into a separate pool. No branch can be chosen in a Staff payload.
3. **Tawad policy:** Staff may record any positive agreed price as in Phase 0, with a reason when it differs from the approved Solo/Set basis. No new arbitrary ceiling, discount approval role or second authentication is introduced. New sale snapshots retain global list price, Set/Solo price basis, actual accepted price, reason, branch and operator. The old `ownerConfirmed` request field remains for contract compatibility; the operational dialog accurately asks the operator to confirm. Reason/price validation is an application accounting guard, **not a claim of server-side field-level policy**. Dexie still enforces realm/table authorization; a tamper-proof financial policy service is not introduced.
4. **Set prices:** the normal default remains ₱150 per piece / five pieces per set, but the operational modal uses the Admin's actual Set catalog rate rather than a hardcoded rate. Stale review is rejected. Sale lines keep their Solo product/pool and Set format/price option. Existing historical Set labels and unknown legacy format inference remain unchanged.
5. **Costs/media:** purchase cost uses Phase 0's entered per-product cost for future sales; it is not weighted-average/FIFO procurement accounting. Missing historical costs remain unknown. Existing local photos are preserved but not silently published: Admin uploads/replaces a selected file deliberately; original photos remain in the original backups. Global photos use one existing family definition as an anchor; deterministic read choice handles multiple anchors without automatic data deletion. Concurrent editing remains provider field conflict behavior, not custom reconciliation.
6. **Backups/recovery:** operational export and seven local daily copies now exist separately from original device backups. The first daily copy covers records currently available on that owner device, not proof of full hosted recovery. Download after final synchronization too. Restoring a distributed branch ledger needs reviewed idempotency/scope/conflict handling; this PR never restores/imports automatically. Original backup/restore remains available for its original database. Production cutover and any destructive migration require separate explicit approval.
7. **Acceptance limitations:** UI classes, modal behavior, safe-area/scroll/focus handling and original component tests are retained. The local Vite preview started on 127.0.0.1; the cloud browser could not reach it and then blocked inspection by policy. Temporary synthetic preview files/server were removed/stopped. No screenshot/desktop/iPad visual pass or live authenticated sync is claimed. Owner iPad review, actual two-client propagation and server denial remain required.

No intentional feature removal is authorized by this document. New feature removal requires a specific owner review decision recorded in PR #12. Do not mark parity, Phase 1 or PR #12 complete while the above gates remain unresolved.

## Owner walkthrough / local verification

Stop Vite with Ctrl+C. Use the existing checkout; change `$repo` only if it is elsewhere. Node 24 required. No schema import/management key is needed; new catalog/receipt fields use existing synchronized tables. Only the separate local backup archive upgrades additively from v1 to v2; original `daily` copies and POS IndexedDB stores remain intact.

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
if ($LASTEXITCODE -ne 0) { throw 'Dependency install failed.' }
Remove-Item Env:VITE_BUSINESS_OWNER_MAINTENANCE -ErrorAction SilentlyContinue
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run dev -- --force --port 5173 --strictPort
```

Use the same browser origin/profile; never clear IndexedDB. Work only with synthetic development stock, preserving existing branches/accounts/catalog. Existing first-branch load and authenticated `/sync` success remain prerequisite live checks from the [branch runbook](13-Role-Branch-Alignment.md).

1. **Admin setup:** inspect existing definitions before adding anything. Products → More product choices → Review standard product choices shows what is missing/already present; only confirm desired reviewed definitions. This adds no stock. Alternatively Add Product for one explicit item; Solo precedes its Set price option. Standard preview never inserts records. No ledger migration is involved.
2. In the product list search for the desired scent. Enter a known purchase cost for future sales only; verify unknown historical sale costs are not replaced. Upload a private test photo for the family; confirm Staff receives it after actual synchronization. Replace/remove explicitly and check quantities/history stay unchanged.
3. **Staff receiving:** sign in to the assigned branch. Open a product card → Receive stock (or Add stock first), select scents/quantity and reason, review then confirm. Alternatively Branch Inventory → Receive multiple scents or products accepts differing quantities. Before confirmation, stock must be unchanged. Try an interrupted/failed attempt and retry the same request; do not recreate it blindly.
4. **Core canonical gate:** receive 10 synthetic Inhaler Lavender, confirm 2 Cash units, verify eight remaining / PHP 198 in branch sales/audit. On another Admin client verify the same real record after successful authenticated push/pull. Branch B stays independent.
5. **Full Phase 0 flow:** for a Rub/Roll with Solo and Set definitions, receive physical Solo pieces. Test scent choices, quantity buttons, a five-piece mixed Set, optional tawad plus reason, GCash and Coop Pay, Back to Edit, explicit confirmation, one deduction on retry and the three-second toast. An example 5-piece sale at ₱120 with known ₱70 costs reports ₱600 revenue, ₱350 COGS, ₱250 gross profit. Verify original list/basis/accepted prices and actor in transaction details. Change catalog price/cost later and confirm old receipt snapshots stay unchanged.
6. Test offline sale, offline reload and reconnect without duplicate receipts/movements. Verify other-branch inventory unchanged. Confirm the server rejects Staff catalog/price/cost/photo and other-branch writes; a UI-hidden control alone is insufficient evidence.
7. **Admin supervision:** Overview and all-branch reports show actual authorized branch records. No normal POS interface. Test report periods, Set labels, CSV, refresh and missing-cost notice. Download a current private backup and latest automatic branch copy; original backup archive stays separate. Do not restore either over current records as a test.
8. **Visual acceptance:** compare the Phase 0 cards/modals and current Staff POS at desktop, iPad landscape 1024 and portrait 768 widths, with keyboard open, safe-area scrolling, photo aspect, focus/Escape/outside handling, plus/minus touch targets, payment controls and transient feedback. No redesign sign-off is assumed.

Regression commands from the app folder in another PowerShell terminal:

```powershell
npm.cmd test -- --maxWorkers=4
npm.cmd run lint
npm.cmd run typecheck
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run build
```

Keep the existing alignment branch and Draft PR #12 stacked on Phase 1 PR #10. No new branch, merge, production deployment, live data import, account/realm change or Phase 2 start is part of this correction.

## Repository verification record

2026-11-22: **146 files / 1,448 tests passed** in the full regression suite. Lint, cloud type checking and configured production build passed. Thirteen new tests cover Staff modal flows, mixed Set/tawad/payment/retry/toast behavior, grouped receipts, Admin cost/price/photos and Set creation, atomic receiving and scope, real-addon catalog media transport, standard catalog setup, unchanged historical costs, separate seven-copy archive upgrade and the branch morning reminder. The deterministic reminder-clock test was also rerun after pinning its date. These are repository results; visual/iPad and actual authenticated cloud acceptance remain open.
