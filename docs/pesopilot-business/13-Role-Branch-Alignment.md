# Role and branch operational alignment — Issue #11

Status: development implementation on `feature/pesopilot-business-v2-role-branch-alignment`, stacked on Phase 1 PR #10 at `8e45c6f`. Owner approval in Issue #11 supersedes the earlier deferral of operational alignment. No production cutover. One business, multiple branches, exactly Admin/Staff.

## Domain decision before implementation

The existing repository atomically writes products/pools, sales, item snapshots, movements and audit events. Its quantity cache is safe on one local database, but sharing mutable balances would risk lost updates between disconnected clients. Keep its original database and backup format intact. Reuse its accounting planner and service validation for a separate operational cloud ledger.

Add three tables to the existing cloud cache/database: `branchCatalog` (global product definitions, stable IDs/pool references, no spendable quantities), `businessBranches` (Admin-controlled registry in the business realm; operational records live in the corresponding branch realm), and `branchTransactions` (one atomic record per receipt/adjustment/sale/import containing attributed line/movement/audit snapshots). A branch's canonical identifier is its Dexie `realmId`. Do not trust a free-form branch field to select authority. Each Staff's branch is resolved from exactly one accepted membership in an Admin-controlled branch realm. Multiple Staff may share a branch. Admin sees only branch realms it owns or has accepted Admin access to; branch creation shares oversight with existing business Admins through invitations.

The global Staff role remains read-only in the business realm. Only branch membership receives direct `add: ['branchTransactions']` permission. Catalog, branch metadata and memberships remain Admin-managed. Operational records are created with `owner: null`, so ordinary app writes cannot update/delete them through implicit creator ownership. Dexie validates realm access and table write permissions server-side. Client attribution and semantic quantities are application checks, not arbitrary server validators; an authorized malicious branch writer can manufacture an event or deliberately request ownership on creation under Dexie's add model. This MVP is not a tamper-proof financial ledger. Server proof must include denial outside assigned realms and on Admin-only records; do not claim client tests prove live policy enforcement.

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
6. Only after Branch A passes, create **Branch B**. Admin must see its independent zero stock/no sales while Branch A retains eight. Staff A must not get Branch B operations/records. Verify direct Admin routes are denied. Verify actual provider-side denial of writes outside assigned branch and on catalog/prices/users, and denial of update/delete for an owner-null transaction. A local addon/route denial alone is not evidence of a server request rejection; record that distinction. Use synthetic targets only.
7. On Staff A's test device go offline, sell **one** of the remaining eight, reload offline and confirm one queued sale/seven remaining. Reconnect/synchronize and verify Admin sees **two total sales**, three units sold, seven remaining and no duplicated movements after repeated pulls/reloads. Test another offline device competing for scarce stock separately; retain both sales and verify visible reconciliation exceptions. Do not silently erase a conflicting sale.
8. Test Staff removal only when ready: cancel once, then remove the disposable Staff membership, synchronize and verify business and branch access revocation on a fresh pull. Do not remove either Admin. Re-register/re-invite through the existing owner workflow if this Staff account is needed again. Check existing local sales/audits/photos and legacy backup/restore on a test copy; never restore over the owner's original records during acceptance.
9. Download the operational export and retain private counts/IDs for review. Perform owner license/seat audit via the existing Phase 1 operator command; branch memberships reuse the same application users and do not establish license billing state. Supabase/new-envelope recovery and physical-iPad offline acceptance remain independent gates.

## Verification record

Repository tests exercise real fake-indexedDB-backed repositories and the actual React hook/receipt/POS/audit flow, not just screenshot quantities. A second local connection checks Admin reads; a fixture-only simulated provider merge checks disconnected events and replay. This is not a live Dexie server test. Tests cover pooled variants/set snapshots, payment methods, retries, atomic failure, scope denial, revoked membership, branch B isolation, sealed schema preparation, nonempty default-branch import, unchanged legacy stores and private backup boundaries. The full suite also retains the existing Personal/Business tests.

Live acceptance is **not complete**. The agent has no owner-held Dexie management session or OTP-authenticated browser clients, so the additive hosted import and authenticated receiving/sale/pull/permission checks have not been executed here. A local Chromium launch was blocked by the execution environment's socket restrictions; no desktop/iPad screenshot or physical-device pass is claimed. Keep Issue #11, the alignment draft PR and Phase 1 PR #10 open. No production deployment, merge, account/ownership change, database reset or live record import was performed.

Final repository verification on 2026-11-22: `npm test -- --maxWorkers=4` **PASS — 137 files / 1,406 tests**; `npm run lint` **PASS**; `npm run typecheck` **PASS**; configured `npm run build` **PASS**. The browser socket restriction and missing owner-authenticated hosted verification remain as described above. Tests do not close the live acceptance gates.
