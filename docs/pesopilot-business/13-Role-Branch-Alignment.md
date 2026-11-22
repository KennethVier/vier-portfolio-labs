# Role and branch operational alignment — Issue #11

Status: development implementation on `feature/pesopilot-business-v2-role-branch-alignment`, stacked on Phase 1 PR #10 at `8e45c6f`. Owner approval in Issue #11 supersedes the earlier deferral of operational alignment. No production cutover. One business, multiple branches, exactly Admin/Staff.

## Domain decision before implementation

The existing repository atomically writes products/pools, sales, item snapshots, movements and audit events. Its quantity cache is safe on one local database, but sharing mutable balances would risk lost updates between disconnected clients. Keep its original database and backup format intact. Reuse its accounting planner and service validation for a separate operational cloud ledger.

Add three tables to the existing cloud cache/database: `branchCatalog` (global product definitions, stable IDs/pool references, no spendable quantities), `businessBranches` (Admin-controlled registry in the business realm; operational records live in the corresponding branch realm), and `branchTransactions` (one atomic record per receipt/adjustment/sale/import containing attributed line/movement/audit snapshots). A branch's canonical identifier is its Dexie `realmId`. Do not trust a free-form branch field to select authority. Each Staff's branch is resolved from exactly one accepted membership in an Admin-controlled branch realm. Multiple Staff may share a branch. Admin sees only branch realms it owns or has accepted Admin access to; branch creation shares oversight with existing business Admins through invitations.

The global Staff role remains read-only in the business realm. Only branch membership receives direct `add: ['branchTransactions']` permission. Catalog, branch metadata and memberships remain Admin-managed. The original implementation requested `owner: null`, but the pinned addon replaces it with creator ownership. The compatibility correction below preserves existing ownership on reads and explicitly assigns new operational records to the branch business owner. Existing creator-owned records retain their permissions; do not claim blanket server-side update/delete denial for those historical records. Dexie validates realm access and table write permissions server-side. Client attribution and semantic quantities are application checks, not arbitrary server validators; an authorized malicious branch writer can manufacture an event or deliberately request ownership on creation under Dexie's add model. This MVP is not a tamper-proof financial ledger. Server proof must include denial outside assigned realms and on Admin-only records; do not claim client tests prove live policy enforcement.

## Accounting and conflict rules

Stable event IDs derive from branch, actor and durable request key. Items/movements/events have stable subordinate IDs. The entire event commits in one IndexedDB transaction; Dexie Cloud provides transport, queueing and atomic synchronization, with no custom sync worker/backend. Retry compares the operation's business payload and returns the existing result; different payload under the same key is rejected. Receiving/adjusting stock requires a reason and validates stock pools/quantities. Sales reuse existing validation/planning, including pooled variants, agreed-price snapshots, set lines and Cash/GCash/Coop Pay.

Inventory is the sum of committed movement deltas, not the last client's balance. Reports flatten those same events into the existing audit/sales formats. On a deterministic projection, before/after values are rebuilt from deltas rather than trusting device-specific cached balances. Concurrent disconnected sales can exceed stock: retain both sales, expose the negative pool/conflict, block further sales and report an audit reconciliation warning. Resolve with a reasoned physical-count adjustment; never silently delete a sale, clamp stock or overwrite a balance. Pending/rejected provider sync is visible and local success is not described as cloud confirmation.

## Migration and rollback policy

No automatic migration from `catalogStock`. A reference snapshot is never a receipt. Admin can explicitly publish local catalog definitions without quantities, or create zero-stock shared products. Staff receives physical stock into the branch ledger.

Legacy import is a separate explicit operation with a mandatory selected default branch and backup. Dry-run reads the full existing ledger, validates the existing audit chain, excludes no sales silently, reports original counts/IDs/quantities and rejects ambiguous sample/mixed data. The import envelope preserves original source records and IDs, with namespaced stable event ID and explicit legacy attribution. It does not alter the legacy database. Repeating identical import is a no-op; a different source under the same migration ID is rejected. Once imported, do not continue operating the legacy copy as a second authority. Rollback before acceptance means stop the alignment client, retain all exported evidence and resume the untouched legacy app; after new branch operations, reconcile/export those records before choosing any cutover. No automated deletion, reverse-import or destructive rollback is authorized.

## Validation order

1. Account menu and role navigation tests, then branch policy/schema preparation.
2. Real repository/service single-branch fixture: receive ten Lavender units, sell two, remaining eight, sale/audit/analytics agree, second client reads the same records.
3. Independent second-branch fixture and unauthorized scope tests, disconnected sales merge/duplicate detection/conflict visibility, migration of nonempty set/pool fixtures.
4. Full regression, lint, cloud type checking, build and owner-run authenticated browser/physical iPad acceptance. Keep PR #10 independent and open the stacked alignment PR as draft. No merge/deploy.

Official foundations: [Dexie access control](https://dexie.org/docs/cloud/access-control) and [atomic synchronization/consistency](https://dexie.org/docs/cloud/consistency). Branch realms provide provider-enforced partitions; Supabase stays the secondary recovery service. This slice does not implement marketplace/mobile, transfers, new roles or a second POS authority.

## Implemented scope and explicit limits

- `/business` renders Business Overview for Admin and operational POS for assigned Staff. Admin has Overview, All Sales, Analytics, Inventory Overview, Daily Audits, Products, Branches and Users, Settings / Backup. Staff has POS, Branch Inventory, Branch Sales, Daily Audit, Branch Analytics. Direct Admin routes are denied to Staff, including legacy tools. The legacy standalone components remain regression-tested, but authenticated Admin has no POS route/navigation.
- The account panel is navy/gold, narrower with email plus an inline role/Sign out row, an icon at mobile widths, 44px targets and disclosure keyboard/outside dismissal. It adds no header row.
- Alignment uses a separate **local IndexedDB cache base name** `pesopilot-business-operations-dev` (the addon appends its database ID). The original POS database `pesopilot-business` and Phase 1 cache base `pesopilot-business-cloud-dev` are untouched. It connects to the **same hosted database**, not a new cloud database. Existing users/licenses/ownership remain unchanged. First login in this cache uses the official OTP flow again; it does not register another application user.
- The three new synchronized tables require an additive sealed-schema import before launching this client. The schema tool checks primary keys, retains every hosted declaration, skips import when nothing is missing and verifies sealing/read-back. No roles or data are included in its manifest. The pinned Phase 1 wire-schema compatibility patch remains in use.
- Branch creation is restricted in the application to the current business realm owner. Existing accepted business Admins receive branch Admin invitations for oversight; each must accept before that branch appears as authorized. Branch assignment sends a separate Staff invitation and gives only branch-local direct add permission for the transaction table. Staff must already be a registered application user and accepted business Staff. Global Staff permissions stay unchanged/read-only. Neither Admin application user nor license is changed.
- The business realm contains the shared catalog and a canonical branch directory (IDs/names). Operational branch sales, stock and audits belong to branch realms and are not shared with other branches' Staff. React derives branch scope from accepted memberships; it does not accept an arbitrary branch field as authority.
- Admin views use actual authorized transaction projections. Consolidated Overview shows recorded daily sales, branch comparison, low/empty pools, accepted Staff membership counts and negative-stock exceptions. Audit status is computed reconciliation status, not a fabricated submitted checklist. All Sales/Analytics and audits are separated by authorized branch, with an optional branch selector.
- Catalog-only product creation starts at zero, with Admin price editing. An explicit legacy catalog publication preserves IDs/pool links, skips existing definitions without resetting edited prices and never copies quantities. Operational set sales use the selected catalog price; the existing legacy set/tawad behavior remains unchanged.
- Branch writes and offline queues use Dexie Cloud's own synchronization. Local commit and cloud completion are distinct. Negative stock remains visible on reconciliation, blocks new sales and can be corrected through a reasoned physical-count adjustment. The branch audit allows signed stock to report an oversell instead of hiding the recorded sale; legacy audit strictness is unchanged. Device timestamps determine report dates/order; clock errors must be investigated rather than silently rewritten.
- Removing a business Staff membership through Users also removes that Staff's canonical branch memberships in the same transaction. Rejected sync/revocation can roll back unauthorized queued writes under Dexie's consistency rules; record the error and reconcile affected operations. No claim of a tamper-proof ledger or guaranteed acceptance of revoked offline writes is made. Offline sign-out is blocked and online sign-out pushes first; never accept discarding unsynchronized changes in a provider dialog.
- The optional legacy migration supports **up to 1 MiB** as one atomic envelope into an **empty, quiescent branch**. Larger or active ledgers stop for a separately reviewed batched migration. It keeps original source records/IDs/photos in the envelope, namespaced line/movement identities in projections and explicit `legacy:unattributed` historical actors. Exactly one default branch is allowed for this legacy source. Repeated identical import is a no-op; changed input is rejected. No live legacy import was executed.
- Admin can download an operational branch export from Branches or Settings. It is a distinct format, includes only authorized records in this cache, contains private business data and is **not** a legacy restore file. Legacy backup/restore, sales archive and daily audits remain available separately. No automatic operational restore or production-grade recovery orchestration is implemented. Supabase staging/schema/RPC and its existing recovery architecture were not changed; automated offsite replication of the new branch envelopes still needs a reviewed extension and live recovery validation.

## Exact Windows PowerShell setup

Stop the old Vite process with Ctrl+C. Use a separate checkout of the **existing** alignment branch; this does not create another remote branch or change PR #10. Keep the same Chrome profiles and IndexedDB data.

```powershell
$branch = 'feature/pesopilot-business-v2-role-branch-alignment'
$repo = Join-Path $env:USERPROFILE 'Projects\pesopilot-role-branch-alignment'
if (-not (Test-Path -LiteralPath $repo)) {
    git clone --single-branch --branch $branch 'https://github.com/KennethVier/vier-portfolio-labs.git' $repo
    if ($LASTEXITCODE -ne 0) { throw 'Clone failed.' }
}
Set-Location -LiteralPath $repo
$changes = git status --porcelain
if ($LASTEXITCODE -ne 0) { throw 'This folder is not the expected Git checkout.' }
if ($changes) { throw 'Save local changes before updating this checkout.' }
git switch $branch
if ($LASTEXITCODE -ne 0) { throw 'Could not select the existing alignment branch.' }
git pull --ff-only origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Git update failed.' }
Set-Location '.\apps\pesopilot-web'
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Installation or pinned Dexie compatibility patch failed.' }

$operator = Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev'
& '.\cloud\setup-branch-schema.ps1' -OperatorDirectory $operator
if ($LASTEXITCODE -ne 0) { throw 'Hosted schema verification failed.' }

$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run dev -- --force --port 5173 --strictPort
```

Use Node 24 as required by the repository. The operator directory must already contain the owner's authenticated Dexie CLI configuration for this development database. If it is elsewhere, change only `$operator`. Do not paste its credentials or OTPs into chat. The script exports schema before/after into that directory and never prints the management credential. If import succeeds but verification fails, retain those exports and rerun the read-back procedure; do not delete tables or unseal. An existing successful migration is detected and the import is skipped. No production schema or provider user/license operation is performed.

For local regression in another PowerShell window, from the same app folder:

```powershell
npm.cmd test -- --maxWorkers=4
npm.cmd run lint
npm.cmd run typecheck
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run build
```

## Owner-run live acceptance (synthetic development data only)

1. Open `http://localhost:5173/business` as `pesopilotbusiness@gmail.com` in the Admin profile. Complete official OTP privately in the new cache. Verify Overview/default route, all owner links, compact Account, keyboard/Enter/Escape/outside dismissal and desktop/iPad/mobile layout. Confirm no POS nav/interface. A second business Admin must accept each branch invitation to gain oversight; neither Admin is removed.
2. In Branches and Users create **Branch A**. In Products create **Hallelujah Inhaler / Lavender** at zero stock, or explicitly publish existing local catalog definitions. Do not import a reference snapshot. In Users verify the existing registered Staff `kennethcerrado18@gmail.com` has accepted its business invitation; assign it to Branch A. Repeating Assign Staff must not create another invitation.
3. In a separate Staff profile/device sign in with that account, accept the **branch** invitation and synchronize. Staff should have exactly one branch. In Branch Inventory receive **10** Lavender units with reason `Synthetic acceptance receipt`. Wait for a successful authenticated push; record status only, not headers/tokens/payload exports.
4. Open Staff POS: verify **10 available** for Lavender. Review and confirm a **2-unit Cash sale**. Verify **8 remaining**, one receipt, correct branch/actor and PHP 198.00 in Branch Sales and Daily Audit. Reload; quantities and receipt must remain. Do not confuse local completion with a confirmed cloud push.
5. On another Admin client synchronize/pull. Verify the same Branch A sale, stock eight, cash amount, audit and attribution. The actual authenticated `/sync` responses must succeed. This is the live gate that fixture tests cannot replace.
6. Only after Branch A passes, create **Branch B**. Admin must see its independent zero stock/no sales while Branch A retains eight. Staff A must not get Branch B operations/records. Verify direct Admin routes are denied. Verify actual provider-side denial of writes outside assigned branch and on catalog/prices/users, and denial of update/delete for a newly created business-owned transaction. Historical creator-owned transactions retain their original ownership and require a separately reviewed policy before any ownership cleanup. A local addon/route denial alone is not evidence of a server request rejection; record that distinction. Use synthetic targets only.
7. On Staff A's test device go offline, sell **one** of the remaining eight, reload offline and confirm one queued sale/seven remaining. Reconnect/synchronize and verify Admin sees **two total sales**, three units sold, seven remaining and no duplicated movements after repeated pulls/reloads. Test another offline device competing for scarce stock separately; retain both sales and verify visible reconciliation exceptions. Do not silently erase a conflicting sale.
8. Test Staff removal only when ready: cancel once, then remove the disposable Staff membership, synchronize and verify business and branch access revocation on a fresh pull. Do not remove either Admin. Re-register/re-invite through the existing owner workflow if this Staff account is needed again. Check existing local sales/audits/photos and legacy backup/restore on a test copy; never restore over the owner's original records during acceptance.
9. Download the operational export and retain private counts/IDs for review. Perform owner license/seat audit via the existing Phase 1 operator command; branch memberships reuse the same application users and do not establish license billing state. Supabase/new-envelope recovery and physical-iPad offline acceptance remain independent gates.

## Verification record

Repository tests exercise real fake-indexedDB-backed repositories and the actual React hook/receipt/POS/audit flow, not just screenshot quantities. A second local connection checks Admin reads; a fixture-only simulated provider merge checks disconnected events and replay. This is not a live Dexie server test. Tests cover pooled variants/set snapshots, payment methods, retries, atomic failure, scope denial, revoked membership, branch B isolation, sealed schema preparation, nonempty default-branch import, unchanged legacy stores and private backup boundaries. The full suite also retains the existing Personal/Business tests.

Live acceptance is **not complete**. The agent has no owner-held Dexie management session or OTP-authenticated browser clients, so the additive hosted import and authenticated receiving/sale/pull/permission checks have not been executed here. A local Chromium launch was blocked by the execution environment's socket restrictions; no desktop/iPad screenshot or physical-device pass is claimed. Keep Issue #11, the alignment draft PR and Phase 1 PR #10 open. No production deployment, merge, account/ownership change, database reset or live record import was performed.

Final repository verification on 2026-11-22: `npm test -- --maxWorkers=4` **PASS — 137 files / 1,406 tests**; `npm run lint` **PASS**; `npm run typecheck` **PASS**; configured `npm run build` **PASS**. The browser socket restriction and missing owner-authenticated hosted verification remain as described above. Tests do not close the live acceptance gates.

## Admin onboarding and inventory UX follow-up — 2026-11-22

Implemented from the [owner's Issue #11 feedback](https://github.com/KennethVier/vier-portfolio-labs/issues/11#issuecomment-7073840338), on the same alignment branch and Draft PR #12. The owner reports that publishing existing products made them selectable by Staff; this is evidence of that product-list path, not completion of the live 10 → 2 → 8/provider-permission acceptance gates.

### Business workflow

1. **Business Overview → Business Setup:** a compact checklist derives progress from saved products, branch records, accepted Staff branch invitations and actual positive stock movements. It guides Products → Branches → Staff assignment → Staff receives opening stock. Pending invitations and reference snapshots do not mark those steps complete. Every authorized branch must have accepted Staff and recorded stock before those steps complete; selling the stock later does not reset the opening-stock step. The checklist collapses to “Setup saved” when complete. This describes saved state in this client; connection status separately indicates sharing. Loading/error states do not invent progress.
2. **Products → Add product:** create names/scents/sizes and prices directly in the business product list. No second publishing step is required for newly added products. Stock is received separately. Catalog-only forms omit irrelevant photo links and physical opening quantities. Existing saved products have concise expandable price editing, plus a next-step link to Branches and Users.
3. **Products → Import existing products from this device:** a clearly explained, expandable migration option for an owner who already entered products on this browser. It reads the original local catalog only when Preview is clicked. Review names, variants, prices, counts and conflicts; confirm before importing. The preview is read-only, and import never runs automatically or for Staff. Existing IDs/prices are kept, conflicts stop the operation, and changed source/shared definitions invalidate the preview. Import is transactional and retry-safe; a failed cloud push can leave zero-stock definitions saved locally, so review again and use the contextual retry action after reconnecting. No completion message appears until the push succeeds.
4. **Branches and Users:** grouped Create a branch and Assign Staff sections explain the next step. Creating a branch selects it for assignment. A business invitation alone does not register a restricted-admission application user: the owner still completes private account setup, Staff signs in/accepts business access, then Admin assigns a branch and Staff accepts that separate invitation. Privileged registration remains in the existing owner-operated workflow. Advanced migrations, provider quota information and backup tools are collapsed beneath normal setup.
5. **Staff → Branch Inventory:** an empty catalog explains that the owner must add products in Products; there is no useless blank selector. Missing assignment points the owner to Branches and Users. With products present, Staff searches by name/scent/variant/size, selects the exact item with its current branch quantity, chooses Receive stock or Remove stock, enters quantity/reason and reviews the change inline before confirming. Failed saves keep the selected product and entered values/request key. Success explains local save and links to POS; other devices see it after sharing completes.
6. **Connection feedback:** normal pages show brief business wording for pending/offline/failure states. Healthy operation does not present an always-visible manual synchronization button. Check for updates is under Connection details; errors expose a contextual Try again action. Offline stock/sales still use the existing durable branch ledger. Product import/branch administration require connection, while a product-import preview remains available offline.

Imports copy only explicit product-definition fields: names/prices/scents/variant/pool references and existing creation/cost metadata required by the domain. They do not import quantities, photos, sales, stock receipts or audit records, and do not overwrite stock already recorded in branches. No schema, realm, role, permission, ledger-accounting or production change was made in this follow-up.

### Update locally (no schema import needed for this UX update)

Stop Vite with Ctrl+C and run:

```powershell
Set-Location (Join-Path $env:USERPROFILE 'Projects\pesopilot-role-branch-alignment')
$branch = 'feature/pesopilot-business-v2-role-branch-alignment'
if ((git branch --show-current) -ne $branch) { throw 'Open the alignment branch checkout first.' }
if (git status --porcelain) { throw 'Save local changes before pulling.' }
git pull --ff-only origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Git update failed.' }
Set-Location '.\apps\pesopilot-web'
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Installation failed.' }
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run dev -- --force --port 5173 --strictPort
```

Existing development schema setup is still required for a brand-new installation, as documented above; do not repeat the schema import merely for this UI change. Keep existing browser data. No owner key or OTP is requested in chat.

### Focused acceptance and results

- **Admin:** check real checklist progress, Add product → next action, empty-product guidance, branch creation/assignment instructions and the collapsed advanced tools. Preview an existing local catalog without importing: verify counts, zero writes and an explicit confirmation. Repeat an already completed import: existing prices/quantities must remain. Offline preview must work while import is disabled. A conflicting or stale preview must stop without overwriting records.
- **Staff:** before catalog setup, see the helpful empty state. After adding/sharing products, search Lavender, receive ten with a reason, verify the inline confirmation, then check POS ten → sale two → eight and matching audit/Admin values. Try a failed save and confirm entries are retained. Recheck existing offline/reconnect and branch-isolation acceptance; their accounting and permission paths are unchanged.
- Executed: **138 files / 1,417 tests passed**, including **11 new onboarding tests**, the updated real React/IndexedDB receipt/POS/audit flow and existing business/Personal regressions. Lint, cloud TypeScript checking and configured production build passed. This supersedes the earlier repository test count, not the live acceptance status.
- No new signed-in browser screenshot, live provider authorization test or physical-iPad pass is claimed. Browser execution in this environment remains restricted as recorded above. Owner-side desktop/iPad review and the outstanding live acceptance gates remain open. No production deployment or merge occurred.

## Branch-record read blocker and verified retry — 2026-11-22

Investigation: [owner's PR #12 blocker report](https://github.com/KennethVier/vier-portfolio-labs/pull/12#issuecomment-7074171077). The owner's one read-only Chrome diagnostic showed database version **2**, cloud phase **in-sync**, the expected table/primary-key/index metadata, and successful authorization/catalog/membership/registry/transaction reads followed by **projection** failure for the first authorized branch. This rules out the branch name and missing indexes as the demonstrated failure stage. The redacted report does not expose individual stored ownership values.

### Reproduced implementation defect

`projectBranch()` in `08d68e9` rejected `entry.owner !== null` as a ledger-integrity violation. In the installed **dexie-cloud-addon 4.4.16**, `createImplicitPropSetterMiddleware()` uses `if (!obj.owner) obj.owner = currentUserId` on add/put. Therefore a normal app write requesting `owner: null` is persisted with a non-null creator ID. The official ownership model describes owner as access-control metadata and documents null as ownerless; the installed middleware's null treatment differs from that documented behavior. See [Dexie reserved ownership properties](https://dexie.org/docs/cloud/access-control#reserved-property-names).

A synthetic, network-free regression uses the **real installed addon**, the same v1/v2 application declarations and IndexedDB. Before correction it demonstrated the creator-ID transformation and the exact old projection exception. After correction the same persisted receipt projects ten units. This is stronger evidence than the previous plain-Dexie fixtures, which never ran the middleware and incorrectly retained null. The owner's report identifies the matching failing stage; actual signed-in page recovery still requires owner verification.

### Correction and preserved boundaries

- Treat legitimate null, omitted or string owner metadata as permission metadata, not a quantity/sale integrity invariant. Preserve existing stored owner fields. Branch scope, event identity, actor, date, duplicate-event, movement and sale accounting checks remain fail-closed. Invalid envelope fields produce static validation codes without exporting the record.
- Assign **new** operational transaction envelopes to the existing branch realm owner explicitly, with Staff still recorded as `actorId`. A truthy owner ID survives the pinned addon's defaulting logic and does not give Staff implicit creator ownership of new envelopes. New explicit legacy imports retain the importing Admin as object owner. This is not a realm/database ownership transfer, membership change or bulk ownership migration. Existing creator-owned records remain readable and retain their previous access metadata; this fix does not retroactively guarantee immutability for them.
- Do not reset, delete, reinterpret movements, manufacture empty stock, or rewrite existing transactions. The original POS database, both cloud caches, catalog, branch IDs, memberships and Supabase remain intact. No schema/index change, schema import or provider-key operation is required.

### Read/retry state and diagnostics

`readBranchWorkspace()` wraps the complete read workflow in named stages, including authorization subqueries, catalog, members, registry, transactions, projections and selected-branch repository reads. The same reader serves observation and explicit retry. Original exceptions are retained as causes in memory; exported diagnostics contain only safe error name/code/message, stage/branch ordinal, addon/database version, sync phase and known-table schema metadata. Unrecognized message text, raw records, record IDs, emails, credentials, tokens and stacks are not exported.

A successful cloud pull alone no longer resolves retry successfully. Retry must complete the local reader before showing **Business records reloaded**. Loading and failure suppress stale success notices and the “all changes shared” detail. A failed live query is re-observed after successful verified recovery; stale completions after view disposal are ignored. Concurrent refreshes share the same request. A cloud-only failure still reports failed updates but preserves independently verified cached records for offline operations. Permission/schema/ledger failures remain errors; Create Branch remains disabled until the full local read succeeds.

Detailed read diagnostics are inside a collapsed **Developer read diagnostics** panel for **development Admin sessions only**. Ordinary users see one consistent actionable state. If a different failure persists after updating, that panel's Download read diagnostic button exports the sanitized report; there is no need to inspect raw data, management keys or request headers.

### Exact PowerShell update and owner verification

Stop Vite with Ctrl+C. Keep all browser data and the same development database:

```powershell
Set-Location (Join-Path $env:USERPROFILE 'Projects\pesopilot-role-branch-alignment')
$branch = 'feature/pesopilot-business-v2-role-branch-alignment'
if ((git branch --show-current) -ne $branch) { throw 'Open the existing alignment checkout first.' }
if (git status --porcelain) { throw 'Save local changes before updating.' }
git pull --ff-only origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Git update failed.' }
Set-Location '.\apps\pesopilot-web'
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Installation failed.' }
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run dev -- --force --port 5173 --strictPort
```

No schema import is needed. Reload `http://localhost:5173/business/branches` as the business Admin. Verify the page finishes loading, no contradictory success/failure remains, and Create Branch becomes enabled for valid input. Check the branch selector first: **if Muntinlupa already exists, use that branch**. Otherwise create it once using the normal form and verify it appears. Do not delete an existing branch or repeat creation through a Console script.

Assign the existing registered Staff through the normal flow, accept the branch invitation if needed and perform synthetic ten-unit Lavender receipt → two-unit Cash sale → eight remaining on Staff, then verify the same records from the separate Admin client. Use the existing acceptance steps above for provider write denial and reconnect behavior. If an actual ledger-invariant failure remains, keep operations blocked and export the developer report rather than clearing data or importing schema.

### Executed evidence and remaining gate

**140 files / 1,427 tests passed**, including ten new regressions: the real-addon reproduction plus nine staged-reader/retry/privacy/cached-read tests. Coverage retains the full React/IndexedDB ten → two → eight flow, stable Muntinlupa branch creation, Staff isolation, original data/backup compatibility and rejected corrupt scope. The Muntinlupa fixture calls creation twice with one stable request key and verifies a single saved branch with correct realm ownership and Staff invitation; it does not create a hosted branch. Lint, cloud type checking and configured build passed.

No authenticated hosted Muntinlupa creation or separate-client acceptance was performed by the agent. Management credentials and authenticated Chrome sessions remain owner-controlled. Keep Draft PR #12, Phase 1 PR #10 and live acceptance open until the owner verifies the real page and branch flow. No production deployment, merge, account deletion, hosted schema mutation or data reset occurred.

## Persisted ledger ID round-trip blocker — 2026-11-22

The uploaded `pesopilot-workspace-read.json` and [PR #12 evidence](https://github.com/KennethVier/vier-portfolio-labs/pull/12#issuecomment-7074449631) identify **BRANCH_EVENT_ID** at projection, not an index, ownership or failed-pull check. This guard rejects missing/empty/non-string envelope IDs. The report intentionally omits the actual ID type/value; it cannot by itself prove the affected row's type.

### Reproduced cause and compatibility

The previous writer used `JSON.stringify([branch, actor, requestKey])` as a scalar ID. Installed addon **4.4.16**, `applyServerChanges()` → `keyDecoder`, parses keys beginning `[` and ending `]` into arrays and assigns that decoded key to the inbound `id` property. `encodeIdsForServer()` serializes array keys to the same server string. The application ID therefore collides with the addon's compound-key encoding. A first local write passes the string guard, then a pull/another client can persist an array that fails it. No missing schema or changed membership is needed.

`addonLedgerHarness.js` extracts and executes the actual installed encoder/receive functions at test runtime, with the real addon and synthetic IndexedDB. It does not implement a replacement decoder or network transport. Tests reproduce the array ID and matching array primary key, show the previous string predicate failing, and verify the corrected workspace reads without changing stored rows. The earlier real-addon fixture used `synthetic-receipt`, missing this receive-path behavior. The ownership correction fixed a separate demonstrated bug; plain Dexie fixtures and a plain string key were insufficient to catch this blocker.

- **New writes:** prefix the stable tuple with `evt:` so the addon retains a scalar string. Branch/actor/request idempotency remains stable.
- **Existing reads:** a pure adapter accepts only three nonempty string tuple parts matching the envelope branch and actor (legacy imports retain their fixed historical import identity). It projects the original JSON-string ID without writing a replacement. Nested sale/item/movement references, creator/owner metadata and raw backups stay unchanged. Other integrity/accounting checks remain active.
- **Retries:** atomically check the new prefixed key, original string key and decoded array key. Previously completed receipts, sales and imports are recognized; changed input is rejected.
- **Local aliases:** the old string and received array may coexist but encode to one server key. Only an identical pair differing solely in ID representation coalesces for reads/retry. Neither physical row is deleted. Divergent copies, malformed tuples, wrong scope or collisions between distinct prefixed/legacy server keys fail closed. No arbitrary string coercion, discarded events or substituted stock.
- **Preservation:** no schema/DB version change, data rewrite, reset, cloud import, account/license/membership/realm change, provider patch, Supabase change or production operation. Existing keys remain in place; physical key cleanup would require a separate reviewed migration.

### Backup and maintenance UI

Normal Branches and Users shows **Business backup → Download backup** with a short description. Settings retains backups. Legacy-ledger dry run/import and provider/quota details are removed from ordinary management screens. The separate business-friendly **product-definition import** in Products remains; it neither receives stock nor migrates sales.

The legacy cutover utility is isolated at `/business/maintenance`, with no normal navigation link. It requires Admin, **development mode**, and explicit `VITE_BUSINESS_OWNER_MAINTENANCE=true`. It is excluded from the production route/build and disabled by default. This repair does not authorize running an import.

**Preview only (no changes)** validates a private backup without writing. The separate **Confirm migration (writes records)** requires an explicit checkbox, empty/quiescent branch, backup up to 1 MiB and stopped selling devices. Changing the preview clears the old confirmation. No import runs on load or preview. Production migration requires separate approval. Back up both databases first; no destructive undo/restore is provided. On an uncertain outcome, stop and review records/backups; do not delete records as rollback. A separately approved development rehearsal can enable the flag in the owner-operated terminal and restart Vite; remove the flag and restart afterwards.

### Update and live verification — no schema repair command

Stop Vite with Ctrl+C. Use the existing checkout below; change only `$repo` if it is stored elsewhere. Requires Node 24. This updates code/dependencies without touching browser storage.

```powershell
$branch = 'feature/pesopilot-business-v2-role-branch-alignment'
$repo = Join-Path $env:USERPROFILE 'Projects\pesopilot-role-branch-alignment'
Set-Location -LiteralPath $repo
if ((git branch --show-current) -ne $branch) { throw 'Select the existing alignment checkout.' }
if (git status --porcelain) { throw 'Save local changes before pulling.' }
git pull --ff-only origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Git update failed.' }
Set-Location '.\apps\pesopilot-web'
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Install failed.' }
Remove-Item Env:VITE_BUSINESS_OWNER_MAINTENANCE -ErrorAction SilentlyContinue
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run dev -- --force --port 5173 --strictPort
```

1. In the **existing** Admin Chrome profile, reload `http://localhost:5173/business/branches` without clearing IndexedDB. Verify actual existing branch names, stock history and accepted assignments. Business records must load independently of cloud `in-sync`; Create Branch enables only after the complete reader succeeds. Check whether Muntinlupa already exists before creating it once. No branch is created by this repair.
2. If still blocked, expand **Developer read diagnostics**, click **Inspect ledger ID metadata**, then **Download read diagnostic**. Share only this generated JSON, never a backup or transaction/network dump. This single read-only procedure reports grouped ID/primary-key types, own-property/key equality, compatibility booleans, counts and branch ordinals. No IDs/emails/records/quantities/tokens are exported and no network/write is triggered. A shape outside the demonstrated tuple stays blocked for review.
3. Verify **Download backup** is available and normal management contains no technical migration controls. Retain backups privately. Reload/retry must not duplicate branches or transactions.
4. Complete the synthetic assigned-branch test: Staff receives 10 Lavender; POS shows 10; confirm a 2-unit Cash sale; POS/Sales/Daily Audit show 8/PHP 198.00. Verify successful authenticated pushes/pulls and identical records on a separate Admin browser. Only then validate independent Branch B. Use synthetic development records, preserving existing real stock/history.
5. Verify offline reload/reconnect without duplicate sales, direct provider denial outside the assigned branch/on Admin records, revocation and physical iPad behavior. Preserve both Admins and realm ownership. Keep PR #12, PR #10 and Phase 1 open until live acceptance passes.

From another PowerShell terminal in the app folder, run `npm.cmd test -- --maxWorkers=4`, `npm.cmd run lint`, `npm.cmd run typecheck`, and configured `npm.cmd run build`. Results are recorded in the PR update. The agent has no owner-authenticated browser here: recovery of the actual persisted row and two authenticated browser clients remains **unverified**. The report proves the failing guard/stage and pinned-addon tests prove the protocol collision; neither proves live success.

Repository verification for this correction: **142 test files / 1,435 tests passed**, including five pinned-addon ID/round-trip/retry/accounting checks, read-only metadata redaction, preserved legacy sale/import identity, normal Admin page recovery and maintenance preview/confirmation gating. Lint, cloud type checking and configured production build passed. The built assets contain no owner-maintenance page or migration-confirmation UI. These results do not close the live acceptance gates above.
