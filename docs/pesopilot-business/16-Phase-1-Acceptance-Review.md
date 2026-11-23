# PesoPilot Business V2 Phase 1 acceptance review

Updated on 2026-11-23, Asia/Manila. **Formal Phase 1 approval is pending.** The owner approved physical tablet/iPad use and offline reliability on the protected PR #12 preview. Hosted permission, revocation, recovery and account-usage gates still require operator evidence.

PASS identifies the specific evidence in the row. NOT VERIFIED means the evidence required for that criterion is missing. FAIL identifies an observed shortfall. A local test, earlier narrower owner report or provider configuration cannot substitute for an authenticated operation.

## Revisions and dependency

| Scope | Reviewed head | Verified base |
| --- | --- | --- |
| Phase 1, [Draft PR #10](https://github.com/KennethVier/vier-portfolio-labs/pull/10) | `8e45c6f2e2008aef497e3d6845f2238eab5bbf6e` | iPad preview `ca3767d19c0b31c2ebf3fbec0062632d6291a7f2` |
| Role & Branch Alignment, [Draft PR #12](https://github.com/KennethVier/vier-portfolio-labs/pull/12) | `7a1000b9b803c0260743a337b79fcacd1714c63f` | Exact PR #10 head above |

Both were open, draft, and reported mergeable at the original review. The revisions above are application evidence. The Nov 23 CI commits change workflow configuration only. Local Git confirmed both ancestry links and a clean diff check for each PR. PR #10 shares a reference stock snapshot. Each device's POS uses its original local ledger. PR #12 adds an operational branch ledger in the same development Dexie Cloud database with a separate local cache. The recovery script and staging migration are identical at both heads.

## Phase 1 checklist for PR #10

| Acceptance criterion | Result | Evidence or outstanding owner |
| --- | --- | --- |
| Dexie/Supabase development configuration, retained local POS, documented minimal recovery and later-phase scope | **PASS** | Reviewed runbook, fixed development targets, separate local stores and server-side recovery script. |
| Restricted OTP for the business Admin and a registered Staff account | **PASS** | Prior owner report confirms both sign-ins. Fresh session lifecycle evidence is tracked below. |
| Business Admin reaches dashboard and Users | **PASS** | Prior owner report and staff-management fixture tests. |
| Staff navigation, own-receipt filtering and direct Admin-route denial in the app | **PASS** | Exact-head route and receipt tests. |
| Fresh authenticated access, role routes and receipt readback on the current development build | **NOT VERIFIED** | Admin and Staff test operators. Confirm accepted invitation, roles, authorized pages and own synthetic receipt on separate profiles. |
| Initial pull and sync failure reporting | **PASS** | Addon schema compatibility, initial-pull and snapshot state tests passed on the PR head. |
| New Admin snapshot reaches Staff on a second authenticated device | **NOT VERIFIED** | Admin publishes a unique synthetic snapshot. Staff verifies its quantity and price after a successful pull. Confirm the reference snapshot leaves Staff POS inventory unchanged. |
| Dexie rejects unauthorized Staff changes to Admin-owned stock or membership | **NOT VERIFIED** | Development QA operator with a disposable Staff session and synthetic targets. Capture a provider rejection and unchanged Admin readback. Hidden UI and client-side blocks are separate evidence. The earlier anonymous 401 is recorded in the runbook. A fresh anonymous read attempt here timed out before any HTTP response. |
| Staff removal cancellation, confirmation, provider revocation and fresh pull | **NOT VERIFIED** | Admin and disposable Staff operator. Cancel once, confirm removal, verify successful push and subsequent loss of access. Retain both Admin memberships and application user records. |
| Sign out, online restart and session restoration | **NOT VERIFIED** | Admin and Staff operators. Test restart and sign out after sync has settled, and verify the original device ledger remains accessible to the authorized operator. |
| Local offline ledger, one stock deduction, Set/Solo history, audit, backup validation and migration dry-run compatibility | **PASS** | Exact-head fixtures exercise POS and backup behavior, including a nonempty Set-format recovery import fixture in disposable PostgreSQL. |
| iPad offline sale, persistence after reload, reconnect and no duplicate | **NOT VERIFIED** | Physical iPad operator. The PR #12 owner approval applies to the branch ledger on the tested preview. For this separate PR #10 local-ledger check, start in an authenticated loaded app with synthetic local stock, go offline, record one sale, verify one deduction and receipt, and check reload/restart and reconnect separately. |
| Account menu touch, keyboard and mobile/iPad behavior | **NOT VERIFIED** | Component tests passed. Owner confirms visual/touch behavior, navigation, Escape/focus return and outside dismissal on actual target devices. |
| Supabase staging is available and isolated | **PASS** | Management API returned ACTIVE_HEALTHY. Live SQL found eight recovery tables with RLS, zero Auth users, no recovery schema usage or RPC execution for anon/authenticated and RPC execution for service_role in the prior check. On Nov 23 a read-only staging query reconfirmed eight RLS tables, no client recovery schema or RPC grant, and zero observations. |
| Recovery RPC validates and deduplicates retries | **PASS** | Local schema and script contract tests passed. On live staging, two calls as service_role produced one matching synthetic observation. A forced subtransaction rollback removed it. Observation count remained zero. |
| Authenticated Dexie REST → Supabase RPC → staging read-back | **NOT VERIFIED** | Owner or designated recovery operator. Runtime has neither a Dexie read token nor a staging server key. Supabase management SQL verified the sink only. |
| Published Dexie Free plan limits and quota monitoring procedure | **PASS** | Provider pricing verified. The app's snapshot size estimate is distinct from actual hosted usage. |
| Actual Dexie plan, production seats, evaluation status and quota headroom | **NOT VERIFIED** | Dexie Cloud Manager owner. Run the read-only registry audit and verify actual allocation/usage in Manager. Roles and realm memberships do not determine seats. |
| Supabase staging database size against Free database allowance | **PASS** | Read-only staging SQL on Nov 23 returned 11,728,563 bytes, about 2.34% of the published 500 MB database allowance. File storage and egress were outside this SQL measurement. |
| Final exact-head repository regression, lint, types, build and dependency audit | **PASS** | PR #10 had 132 files / 1,386 passing tests. PR #12 had 150 files / 1,460. Both passed lint, cloud type checking and the development-configured production build on Node 24. On Nov 23 PR #12 initially had two failures under default parallelism (Phase 0 parity and Settings import). Both passed together in isolation (23 tests), and the complete rerun with two workers passed (1,460 tests). The identical app lockfiles had zero findings in the npm audit report. |
| Credential boundaries in source and compiled client | **PASS** | The staging recovery script uses server-only environment variables and fixed origins. No recovery credential identifiers or Supabase secret-key prefix found in either compiled browser bundle. Hosted Staff policy still requires direct provider verification. |
| PR stack and separation of scope | **PASS** | Both GitHub base references match Git ancestry. Phase 1 approval covers PR #10. Alignment and release approval are separate. |
| Automatic GitHub Business checks attached to these PR heads | **PASS** | Added both existing PR base branches and the typecheck step. GitHub started Business validation automatically for [PR #10](https://github.com/KennethVier/vier-portfolio-labs/actions/runs/45155305719) and [PR #12](https://github.com/KennethVier/vier-portfolio-labs/actions/runs/45155318418). Both jobs completed successfully, as did the [matrix-only follow-up](https://github.com/KennethVier/vier-portfolio-labs/actions/runs/45155570245). |

## Additional PR #12 alignment gates

| Acceptance criterion | Result | Evidence or outstanding owner |
| --- | --- | --- |
| Phase 0 sale UI restored, product catalog, grouped receiving and Admin Inventory Overview | **PASS** | Owner confirmed the Phase 0 POS, Staff Branch Inventory, catalog and sales on the protected physical tablet/iPad preview. React tests compare receiving controls for every product group with the Phase 0 reference and exercise sale, payment, Set, tawad, grouped receipt and inventory filtering. |
| Catalog initialization, custom fields preserved, stable IDs and no physical stock from definitions | **PASS** | Synthetic IndexedDB fixtures exercise first pull, one-time setup, concurrent connections, rollback, partial cache, retained prices/costs/photos and no receipt. |
| Actual owner startup/push and Staff catalog on a second authenticated device | **NOT VERIFIED** | Admin and Staff operators. Verify existing customization and unchanged stock/movement counts, observe authorized Staff receiving the catalog, and verify a later owner login adds no duplicates. |
| Admin/Staff branch invitations and live branch access | **NOT VERIFIED** | Admin and Staff operators. Check Staff sees one assigned branch and an authorized Admin sees the expected branches. A secondary Admin may need to accept branch Admin invitations. |
| Staff sale and cross-device Admin stock readback on the physical tablet/iPad | **PASS** | Owner observed 8 remaining on the Admin dashboard after the Staff sale. Repository tests cover the 10 → 2 → 8 fixture. The owner report establishes the stock readback. It does not separately document the payment, sale/audit and actor fields. See [owner evidence](https://github.com/KennethVier/vier-portfolio-labs/pull/12#issuecomment-7097236793). |
| Server branch isolation, global records read-only for Staff, protected transaction mutation denied | **NOT VERIFIED** | Development QA operator. Verify Staff A receives no Branch B ledger rows and provider rejects unauthorized writes and update/deletion of a new owner-owned envelope. Shared branch-directory visibility is expected. |
| Cascaded business and branch revocation, queued offline outcome | **NOT VERIFIED** | Admin and disposable Staff operator. Confirm fresh-pull denial and account for any rejected queued entries; retain original local data. |
| Physical tablet/iPad offline reliability in the exercised Staff workflow | **PASS** | Owner approved offline reliability on preview commit `7a1000b9`. Event-level evidence for exactly-once hosted replay, concurrent oversell, individual restart steps and cold launch is still unverified. See [owner evidence](https://github.com/KennethVier/vier-portfolio-labs/pull/12#issuecomment-7097236793). |
| Reference layout and actual desktop/iPad interaction | **NOT VERIFIED** | DOM/class parity passed. Owner validates portrait, landscape, touch, keyboard, correction disclosure and table scrolling on the target device. |
| Branch export, daily backups and preservation of prior device data | **PASS** | Synthetic export, scoped archive, migration and original backup tests passed. Actual device backup download and restore-on-copy are owner checks below. |

## Production readiness stays separate

| Release gate | Result | Owner |
| --- | --- | --- |
| Device backup download and legacy restore on an isolated test copy, with existing sales/audit/photos verified | **NOT VERIFIED** | Owner and device QA. Check a separate profile with a test copy. |
| Cold offline browser launch and iPad app-shell behavior | **NOT VERIFIED** | Device QA verifies suspended tabs, reload and cold launch independently of data persistence. Engineering review found no application-shell service worker registration or offline cache strategy in these heads. A durable IndexedDB sale can still exist when the browser cannot reload the page. |
| Operational branch-envelope offsite replication, distributed restore and reconciliation drill | **FAIL** | Engineering and recovery owner. The current Phase 1 staging contract handles a single reference-stock observation. A branch export exists, and the operational branch restore and offsite-replication extension are not implemented. This does not block Phase 1's narrower contract on its own. |
| Production credentials, migration/cutover, rollback, licensing and release sign-off | **NOT VERIFIED** | Business owner and release operator. Separate approval and rehearsal are required. |

## Controlled drill status, 2026-11-23

The owner authorized one disposable Staff identity and synthetic records in the existing development and staging services. The approval reserves hosted deletions and irreversible operations for separate approval. The current Remove Staff action calls `members.bulkDelete` for the selected Staff member and matching branch assignments. Separate approval has now been granted for the verified development business and branch membership rows of one newly created disposable Staff identity, subject to the preflight below. Do not delete the identity or test records as cleanup.

Four focused suites passed, 25 tests total. They covered the recovery client, Staff provisioning, Users removal confirmation, and the branch repository. A fresh read-only staging query returned zero recovery observations. The operator environment has no Dexie read token, Supabase server key or Dexie CLI development management registration. No authenticated negative authorization test, Staff provisioning, membership deletion, or recovery write was performed in this pass. The owner-approved physical device evidence and the 37-criterion totals are unchanged.

### Staff revocation preflight

Authorization received on 2026-11-23. Execution is **NOT VERIFIED**. This environment has no authenticated owner operator session or local Dexie development operator configuration. No identity was provisioned or verified and no hosted action was taken. There are no verified membership IDs, assigned branch or affected-record counts to report.

In the private operator session, refresh the development membership view. Record and report the disposable identity, its exact business and branch membership IDs, the assigned branch and total row count before proceeding. Verify that each matched row belongs to the new test identity and that no matching row is an existing Admin or active Staff membership. The removal code matches Staff branch assignments by user ID or normalized email, so review the entire matching set, including pending assignments. Stop if any row or branch is unexpected.

First complete the provider permission and branch-isolation checks using synthetic records. Cancel Remove Staff and confirm the account still has access after a pull. Recheck the removal set, then confirm the supported Remove Staff action only if the set matches the private report. Record successful sync, loss of access after fresh pull and denial from a new authenticated session. Verify the disposable user record, license and unrelated memberships are still present. Keep exact identity details in the private evidence and publish only sanitized results.

### Private recovery execution

Use one synthetic development `catalogStock` row in the business realm. Record its ID, quantity and price privately. In the existing private operator process with the scoped Dexie read token and the staging server key already injected, run from `apps/pesopilot-web`:

```powershell
$snapshotId = Read-Host 'Synthetic Dexie snapshot ID'
node .\scripts\cloud\recover-stock.mjs $snapshotId
if ($LASTEXITCODE -ne 0) { throw 'First staging copy failed' }
node .\scripts\cloud\recover-stock.mjs $snapshotId
if ($LASTEXITCODE -ne 0) { throw 'Second staging copy failed' }
```

Confirm the matching staging count is zero before the writes, one after each copy, and that the final quantity and price match the Dexie source. Share only outcome, counts and whether the fields matched. Keep credentials, raw responses and real customer data private.

## Owner evidence procedure

Use the relevant existing checkout and browser profile with Node 24. Verify the revision with `git rev-parse --short HEAD`. Run `npm.cmd ci` in `apps\pesopilot-web`, set `$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'` and use `npm.cmd run dev -- --port 5173 --strictPort` on the development machine. Use the existing reachable test origin for the iPad. The PR #10 snapshot and PR #12 branch transaction scenarios are separate tests.

1. **Admin and Staff:** use separate authenticated development clients. Record the current commit, time, role, synthetic fixture label, expected/observed amounts and success of both push and pull. Phase 1 uses one reference snapshot. Alignment uses a ten-unit receipt, two-unit sale and eight remaining, followed by independent Branch B and authenticated Admin readback.
2. **Development QA and Admin:** use a disposable, registered Staff invitation for permission and revocation tests. Verify UI denial separately from provider rejection. Use only provider-supported testing against reserved synthetic records and report the rejection status and unchanged readback. Before any hosted change, get explicit owner approval for one disposable Staff account, its test-only memberships and synthetic targets. Keep existing Admin and active Staff memberships. From Staff A verify the assigned branch as a positive control and that a known synthetic Branch B record is absent. Use a provider-supported test to confirm rejection against reserved synthetic catalog definitions, prices, cost and membership targets. Record a provider permission result and independent Admin readback. A local guard, missing record, or generic network failure does not count. Cancel removal once and confirm the disposable account still has access. Then remove only its test membership, confirm the Admin push, and verify loss of access on the existing Staff session after a pull and in a fresh profile. Account for queued entries before ending the test.
3. **iPad operator:** with the test site loaded and authorized, go offline, record one test sale, and verify a single local receipt and deduction. Check warm reload and cold reopen separately. If the page cannot load offline, reconnect at the same origin and inspect persistence. On PR #12 verify the same sale after multiple reconnect/pulls and run the isolated scarce-stock conflict case in the alignment runbook. On PR #10 verify the local sale remains on its own ledger.
4. **Recovery operator:** after explicit approval for synthetic development source and staging recovery writes and after the Phase 1 snapshot push succeeds, use the existing owner-side secret injection into a private process with a short-lived `DEXIE_READ_TOKEN` scoped to ACCESS_DB and GLOBAL_READ on the development source, and `SUPABASE_SERVER_KEY` for staging. From the app directory run `node scripts/cloud/recover-stock.mjs <synthetic-stock-id>` twice for the same unchanged snapshot. In the staging SQL Editor compare the exact source ID, quantity and price in `recovery.catalog_observations`. Expect one matching row after both calls. Close the operator process afterward. Share counts and pass/fail only.
5. **Dexie Cloud Manager owner:** from `apps\pesopilot-web`, run `& '.\cloud\staff-accounts.ps1' -Mode audit` or point `-OperatorDirectory` to the existing private configuration folder. Compare role holders' licenses and remaining evaluation days, production allocation, object/blob bytes, blob writes, connections and sync limits with Manager. Share aggregate usage and eligibility, with no OTPs, credentials, headers, raw traffic, personal records or backups.

Dexie Free lists 3 production seats, 10 simultaneous clients, 25 MB object and 75 MB blob storage, 1,000 blob writes per month and 50 sync requests per 5 minutes per user. Evaluation users are distinct from paid-seat allocation and can lose sync after up to 30 active evaluation days under the published policy. Use Manager values for this database. Pricing lists 50 sync requests per 5 minutes for Free. The API limits page lists 50 for evaluation and 200 for production users, so use 50 for Free capacity planning until Manager confirms which cap applies. Three permanent production identities would consume all three seats. Evaluation accounts do not establish permanent eligibility, and multiple devices or tabs can use separate connections. Photo-heavy catalogs and growing ledgers need actual object/blob measurements before a production fit decision. [Dexie pricing](https://dexie.org/pricing) · [Supabase pricing](https://supabase.com/pricing)

Runbooks: [Phase 1 cloud and recovery](11-V2-Phase-1-Cloud.md) · [Alignment live acceptance](13-Role-Branch-Alignment.md) · [Phase 0 parity](14-Phase-0-V2-Parity.md) · [Inventory and catalog](15-Inventory-Phase-0-Alignment.md).

Formal Phase 1 approval should follow closure of the PR #10 live gates with recorded evidence and review of the remote CI job conclusions. Evaluating those results does not approve PR #12 or production cutover.
