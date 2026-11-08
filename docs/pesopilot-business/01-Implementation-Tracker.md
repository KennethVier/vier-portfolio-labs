# Business Mode v1.1 — Implementation Tracker

Status: ISOLATED FEATURE BRANCH. Not part of v1.0 release approval.

| Milestone | Status | Acceptance |
| --- | --- | --- |
| B0 Proposal, scope, and boundaries | Complete (provisional) | New v1.1 proposal; v1.0 authority untouched |
| B1 Workspace choice and distinct business route | Batch 2 implemented; review pending | First use, existing personal users, direct routes and bidirectional switching covered by tests; no business cutoff requirement |
| B2 Local product/stock foundation | Batch 2 implemented; review pending | Validated products; explicit signed adjustments with required reasons; nonnegative stock; retained movement/event history |
| B3 Manual Cash/GCash/Coop Pay completed sale | Batch 3 implemented; review pending | Explicit owner confirmation, atomic shared-pool writes, snapshots, duplicate/retry handling and read-only sales history |
| B4 Client-format audit | Batch 3 implemented; user validation pending | November 6 sample reconciles; Manila dates, shared stock and payment breakdown implemented; Reload Qty and cash reconciliation questions remain open |
| B5 Integration/security/offline QA | Automated checks passed; manual/security gates pending | Batch 3: 1,122 tests pass; lint/build pass; browser access blocked; backup/access/privacy decisions outstanding |
| B6 Merge/deploy | Not authorized | Separate approved PR and smoke test |

Implementation notes: B1/B2/B3 are staged on a dedicated branch. The Business route includes initial product entry, stock receiving, single-product completed-sale UI, business summary, and internal event preview. Code is provisional until repository test/QA gates pass. No claim of a production-ready private URL, payment processing, or client audit export.

## Business Mode Batch 5 — Dependency security hardening

Date: 2026-11-08, Asia/Manila. **Local dependency gates passed; draft review and existing pilot acceptance gates remain open.** This does not mark Business Mode or any milestone complete.

Branch: `feature/pesopilot-business-dependency-hardening`, isolated worktree `.worktrees/pesopilot-business-dependency-hardening`, based on freshly fetched parent `feature/pesopilot-business-qa` at `91cb900a18a4a09bbdb693715405bdc961e0e606` (draft PR #7). Existing uncommitted Personal/Insights work in the original checkout is preserved. PRs #4–#7 remain unmerged. No Source of Truth, database schema, finance calculations, payment semantics or production release change.

### Verified versions and advisory results

Read the complete [Batch 4 security report](05-Dependency-Security-Review.md). Reinstalled its exact lockfile before modifications: **110 files / 1,163 tests passed**. Fresh npm advisory output reproduced **9 affected packages: 2 critical, 2 high, 5 moderate**. Counts are affected packages, including inherited findings, not independently exploitable issues.

| Dependency | Before (installed) | After (installed) | Decision / advisory outcome |
| --- | --- | --- | --- |
| Vitest | 2.1.9 | 5.1.0 | Reviewed v3/v4/v5 migration guides; patched UI/API and mock infrastructure. Node 24 satisfies its engine and Vite peer requirements. |
| tinypool | 1.1.1 | Removed | Vitest 5 no longer depends on it; both worker prototype-pollution/RCE findings leave the graph. No transitive override. |
| Vite | 5.4.21 | 7.3.7 | Chose the patched Vite 7 line rather than Vite 8's additional Rolldown/Oxc migration. Audit reports no finding for the resolved version. |
| esbuild | 0.21.5 | 0.28.2 | Resolved normally through Vite; development-server cross-origin finding removed. |
| vite-node | 2.1.9 | Removed | Replaced upstream by Vitest's Vite module runner. |
| @vitest/mocker | 2.1.9 | 5.1.0 | Version matched to Vitest; both traversal and manual mock-registration findings removed. |
| @vitejs/plugin-react | 4.7.0 | 4.7.0 | Existing peer range explicitly includes Vite 7; no unnecessary plugin major migration. Latest registry release checked: 6.2.1 requires Vite 8. |
| Zod | 3.25.76 | 4.6.7 | Patched collection-exhaustion advisory requires >=4.6.6; migrated actual imports to Zod 4, with no `zod/v3` compatibility escape. |
| @hookform/resolvers | 5.4.0 | 5.4.0 | Installed resolver already imports `zod/v4/core` and handles Zod 4 errors. Its React Hook Form peer requirement is satisfied. Latest 7.0.3 checked; an unrelated resolver major is unnecessary. |
| React Router DOM / React Router | 6.30.6 / 6.30.6 | 7.18.5 / 7.18.5 | Patched open-redirect and manual SSR hydration findings (fix >=7.18.0); retained supported DOM re-exports to avoid a broad import rewrite. |
| Dexie | 4.4.3 | 4.4.3 | Persistence implementation and schemas unchanged; full transaction/migration/restore regressions pass. |

Registry metadata checked for current stable releases, engines and peer compatibility (including Vite 8.3.6, Vitest 5.1.0, Zod 4.6.7 and Router DOM 7.18.5). Direct upgraded dependencies are exact-pinned and the lockfile is committed. No `npm audit fix`, force upgrades, overrides, exclusions or severity waivers were used. Final clean-install audit: **0 critical / 0 high / 0 moderate / 0 low / 0 info; exit 0**.

### Incremental changes and regression evidence

1. Development-only commit `5091457`: Vite/Vitest and their resolved build/test dependencies. All original 1,163 tests and local build passed before runtime changes. Explicit build targets retain Vite 5's `es2020`, Edge 88, Firefox 78, Chrome 87 and Safari 14 targets. `clearMocks: false` retains the prior mock lifecycle under Vitest 5; test isolation remains enabled. Declared Node `^24.0.0`, matching existing CI and Vercel settings.
2. Zod commit `2a0b935`: replaced removed `errorMap`, `invalid_type_error` and `required_error` options with `error` in Income, Savings, Savings Goals and Salary Cutoff. Kept preprocessing, defaults, transforms, numeric constraints and backup bounds. Baseline passed after migration; then **1,177 tests** passed with added resolver/backup cases, and lint passed.
3. Router commit `2f273ca`: upgraded both packages through the DOM dependency. Reviewed transition/lazy loading, splat matching, hydration, fetchers, form methods and action revalidation. App lazy components already live at module scope; no splat routes, fetchers, Router actions or SSR hydration require migration. **1,181 tests** passed with added route cases. Existing first-use choice, existing-user bypass, direct URLs, both workspace switches and history checks remain intact.
4. App-only Vercel branch suppression and Business CI now include PRs targeting `feature/pesopilot-business-qa` and the high-severity audit gate. Existing action SHA pins and unrelated frontend CI are unchanged.

**18 new behavior regressions:** 13 parameterized resolver cases cover custom field errors for blank/missing/unknown enums, invalid cutoff money and payday order, and parsed values across all six Personal form schemas (coercion, nulls, defaults, numeric IDs and custom cutoff transforms). One backup case rejects string/unsafe/fractional numbers and invalid/local-only datetimes without changing any Business store. Four actual-router cases cover Business-to-Personal lazy Expenses/Income/Savings transitions, preserved Personal records, onboarding bypass, deep-link search/hash and audit history back/forward without starting Personal cutoff flows. New tests initially needed test-selector corrections to match the actual Personal page titles; no application behavior was changed to satisfy them.

The retained suite covers Business backup round trips for all six stores, original sales snapshots, legacy migration event payloads, invalid relationships/centavos, bounded imports, owner confirmation, stale-review detection and failed-write rollback. It also covers shared-pool stock contention, independent-connection idempotency, Cash/GCash/Coop Pay, Manila dates, historical opening balances and unchanged Personal stores. This is automated regression evidence, not real-browser acceptance.

### Final local gates

Run from this worktree's `apps/pesopilot-web` with `npm.cmd` on Windows (same npm scripts), Node **24.16.0**, npm **11.13.0**:

| Required command | Actual final result |
| --- | --- |
| `npm ci` | PASS, exit 0 — 413 packages installed, 414 audited, zero vulnerabilities |
| `npm run test` | PASS, exit 0 — 111 files / 1,181 tests, zero failures |
| `npm run lint` | PASS, exit 0 — zero errors/warnings |
| `npm run build` | PASS, exit 0 — 961 modules; local production bundle only |
| `npm audit --audit-level=high` | PASS, exit 0 — zero vulnerabilities across all severities |

Build emits two upstream Zod comments that Rollup interprets as misplaced purity annotations; Rollup removes those comments and completes the build. No warnings are suppressed. Initial sandbox attempts could not read esbuild's ancestor directory or reach the advisory endpoint; successful validation used approved execution outside that sandbox. The initial failure is not the reported baseline or final result.

### Preview prevention verified before push

Read-only connected Vercel inspection identified only the intended `peso-pilot` project, `prj_WQ0CZVLzyFRhCZ6ESe2CsNagTmxC`, on team `team_nYsAJXDT0WV1eRA1oZ8qSSFx`. Native browser inspection of that project's settings confirmed repository `KennethVier/vier-portfolio-labs`, root **`apps/pesopilot-web`**, Vite, Node **24.x**, and production branch **`master`**. No dashboard setting was changed.

Added to that root's `vercel.json`:

```json
"git": {
  "deploymentEnabled": {
    "feature/pesopilot-business-*": false
  }
}
```

Vercel's [supported Git configuration](https://vercel.com/docs/project-configuration/git-configuration) documents minimatch patterns, unspecified branches defaulting to enabled, and true-rule precedence. There is no conflicting true rule. Validated every configured property (`git`, `ignoreCommand`, `rewrites`, `$schema`) against its definition in the fetched [official schema](https://openapi.vercel.sh/vercel.json) using existing Ajv. The complete upstream schema mixes draft-04 metadata with newer numeric exclusive-minimum syntax in unrelated function-trigger definitions, so property validation was isolated instead of claiming whole-schema meta-validation. Existing minimatch verified the new branch plus QA/foundation/workflows/daily-audit as **disabled**, and `master`, `pesopilot-dev`, `feature/unrelated` as **enabled**. The original ignored-build command and SPA rewrite are preserved; no root-wide disable, production workflow or unrelated app/project was changed. This is pre-push configuration verification, not a test deployment.

Suppression applies to commits containing this configuration. Existing PR branches still need this control before their next app push; do not push those older branches assuming this branch has changed them. Existing READY Batch 4 preview is not removed by disabling future Git deployments. Manual CLI deploys/hooks are separate mechanisms and remain unauthorized.

### Remaining risks and review status

No unresolved dependency advisory remains in the final npm audit; no risk acceptance/waiver is requested. Scoped OWASP Top 10:2025 and applicable ASVS 5.0 review covered supply-chain resolution, strict validation/error propagation, backup bounds, transaction integrity and deployment configuration. No new HTML execution, secret access, financial logging, external backup transfer or persistence mutation path was added; this is not a compliance certification or guarantee against unknown vulnerabilities.

Existing release gates remain: real-browser/mobile/keyboard and native recovery testing, offline cold reload, actual storage failure/multi-tab behavior, local-only unauthenticated access and plaintext backups, owner/client acceptance of provisional inventory/payment/audit semantics. These are not waived by passing automated gates. PRs #4–#7 remain unmerged; no deployment/promotion is authorized.

Remote publication verified: [draft PR #8](https://github.com/KennethVier/vier-portfolio-labs/pull/8) targets `feature/pesopilot-business-qa`; implementation/configuration head `b919448d0c3c85ea664d9f297539c65918483f78`. [GitHub Actions run 42445051058](https://github.com/KennethVier/vier-portfolio-labs/actions/runs/42445051058) **PASS** on Linux, Node **24.22.2**, npm **11.19.1**. Read job logs: `npm ci`, **111 files / 1,181 tests**, lint, build (**961 modules**) and `npm audit --audit-level=high` all passed; both install audit and final audit report **zero vulnerabilities**. Repeated read-only Vercel checks after push/PR creation and CI completion returned **zero deployments** for both the exact commit and the new branch. Preview suppression therefore also has post-push evidence; no test preview was created. The following evidence-only tracker commit does not change app/configuration behavior; its final CI result is reported with the PR handoff.

Primary migration references: [Vite 6](https://v6.vite.dev/guide/migration), [Vite 7](https://v7.vite.dev/guide/migration), [Vitest 3](https://v3.vitest.dev/guide/migration), [Vitest 4](https://v4.vitest.dev/guide/migration), [Vitest 5](https://vitest.dev/guide/migration/), [Zod 4](https://zod.dev/v4/changelog), [Router v6-to-v7](https://github.com/remix-run/react-router/blob/react-router%407.18.5/docs/upgrading/v6.md). Advisory URLs and original reachability assessments remain in the unchanged [Batch 4 report](05-Dependency-Security-Review.md), superseded by the resolved versions and audit results above.

## Business Mode Batch 4 — Independent QA, reliability, security and backup

Date: 2026-11-08, Asia/Manila. Implementation and local automated validation performed; **browser/security/client acceptance gates remain open**. This section does not mark Business Mode complete or production-ready. Earlier batch notes below describe their historical state; this section supersedes their backup/CI status.

Branch: `feature/pesopilot-business-qa`, isolated worktree `.worktrees/pesopilot-business-qa`, based on freshly fetched Batch 3 remote head `1aa904f2d2a0b49f3e361818b0547e1abb31eb86`. Verified PR #6 still targets Batch 2 workflows. Original uncommitted work and PRs #4-#6 preserved. v1.0 Source of Truth and Personal schema/logic unchanged. [Draft PR #7](https://github.com/KennethVier/vier-portfolio-labs/pull/7) targets Batch 3. No merge or deployment command was run; the existing Vercel Git integration nevertheless auto-published a preview on push (exception documented below).

Audit scope: cumulative foundation/onboarding/navigation, inventory and shared pools, owner-confirmed Cash/GCash/Coop POS, idempotency and transaction failures, historical audit/Manila boundaries, v1-to-v2 migration, Personal isolation, backup contracts, dependencies and privacy/access. Full findings, automated evidence and browser matrix: [Batch 4 review](03-QA-Reliability-and-Privacy-Review.md).

Fixes: audit now rejects corrupt prior-day stock chains/sales before using their opening balances, plus wrong same-day movement timestamps. Added Business-only validated JSON download/atomic replacement with explicit owner review, all-history reconciliation, bounded import, late-write rollback and stale-review protection against other connections. Existing retry limits are now disclosed beside POS. CI targets exact Business stack bases and relevant paths, uses current action SHA pins, Node 24, locked installation and all existing required validation commands. Compatible dependency patches reduced affected packages from 12 to 9.

Tests added: 41 risk-driven cases covering malformed/incompatible backups, relationships/events/centavos, full rollback, confirmation/cancellation/duplicate clicks, Personal preservation, independent-connection idempotency/shared-stock contention, stale restore review, interrupted migration/reopening, valid legacy event payloads with new GCash, and corrupt historical opening balances. Existing full Personal/Business regressions retained.

| Validation | Actual result |
| --- | --- |
| `npm ci` | PASS after stopping the local QA server to release Windows esbuild file lock |
| `npm run test` | PASS — 110 files, 1,163 tests; 122 cumulative Business tests |
| `npm run lint` | PASS — 0 errors/warnings |
| `npm run build` | PASS — 926 modules, local production output |
| `npm audit --audit-level=high` | FAIL, exit 1 — 2 critical, 2 high, 5 moderate (9 affected packages) |
| GitHub Actions on QA draft PR | PASS — [run 42443263903](https://github.com/KennethVier/vier-portfolio-labs/actions/runs/42443263903), `pull_request` for #7 / `bdc71dd`; Node 24.22.2, npm ci, 110 files / 1,163 tests, lint and build all passed in 38 seconds |
| Real browser QA | BLOCKED — browser host unavailable; Windows fallback stopped input because the browser URL could not be verified for policy enforcement |

Business backup status: **implemented, automated validation passed; real-browser recovery/owner acceptance pending**. It covers exactly products, pools, sales, items, movements and internal events; Personal backup is independent. Restore validates before writes, never merges ledgers, requires owner confirmation and aborts on changed current records or any failed write. Plaintext files are private owner-managed artifacts, with no upload or encryption. See [format, limits and recovery procedure](04-Business-Backup-and-Restore.md).

Dependency/security status: compatible patch updates for Happy DOM 21.0.4, follow-redirects 1.16.2 and selector-parser 6.1.5. Remaining Vite, Vitest/worker, router and Zod findings require reviewed major upgrades. [Dependency table](05-Dependency-Security-Review.md) records severity, direct/transitive relation, fixes and reachability qualifications. Scoped OWASP Top 10:2025/ASVS 5.0 review found no Business HTML evaluation, credentials, financial logging or external backup transmission. This is not formal security compliance.

Privacy/release blockers: `/business` is unauthenticated, browser-profile-local and erasable; it is not a private remote dashboard. Require an owner-controlled device/profile, stable HTTPS origin, daily private backups and a demonstrated restore before considering a controlled pilot. Complete real-browser mobile/keyboard/native forms, refresh persistence, duplicated/concurrent tabs, actual storage errors and backup/recovery checks. Offline execution after load and **offline shell reload** remain separately unverified; there is no service worker/cache strategy guaranteeing cold reload. Resolve dependency findings and agree the access/privacy model before release. No auth, staff accounts, remote database or sync added.

Client decisions remain unresolved: exact Reload Qty meaning; one-unit consumption for Roll-On/Rub Solo and Set; meaning of the PHP 7,718 cash panel; immediate versus deferred Coop Pay settlement. No answers or automatic reconciliation were invented.

Deployment exception: after the required branch push, the pre-existing Vercel Git integration automatically created preview `dpl_56tqPEjEerhAmfzQsspoAFYXhroa` for `bdc71dd` (project `peso-pilot`, `source: git`, `READY`, preview target). Build logs confirm cloning that QA commit and running a build. No deploy/promotion command or production configuration change was made, but the no-deployment requirement was not fully met by the existing integration. Connected tools cannot delete a completed deployment (only cancel in-progress builds). Disable automatic previews for isolated Business branches before further implementation pushes and review/remove this preview through Vercel. Do not interpret it as an approved release or QA acceptance. The subsequent evidence-only commit changes docs, so the existing app-directory ignore command should skip another app build; this is checked separately after push.

Next release-readiness action: review the failed dependency gate, finish the browser/offline and recovery matrix in a working environment, obtain client acceptance of the provisional inventory/payment semantics and privacy/backup model, then make a separate pilot/release decision. Keep all stacked PRs unmerged.

## Business Mode Batch 2 — Inventory & Sales Workflow Hardening

Date: 2026-11-08 (Asia/Manila).

Branch: `feature/pesopilot-business-workflows`, created in an isolated worktree from latest fetched `origin/feature/pesopilot-business-foundation` at `32cf005`. Unrelated uncommitted Personal/Insights work in the original worktree was preserved. Separate draft PR targets the foundation branch. PR #4 and the v1.0 Source of Truth are unchanged. No merge or deployment is authorized.

### Implemented behavior

- Product creation validates trimmed names (1–120 characters), positive PHP prices with at most two decimal places, safe integer centavos, and nonnegative whole opening quantities. Inventory shows unit price, available quantity and explicit in-stock/out-of-stock status. No product or history deletion controls were added.
- Manual stock adjustments support add/remove, positive whole quantities and a trimmed required reason (1–240 characters). Product quantity, signed movement with before/after quantities and reason, and internal event are written atomically. Negative stock and integer overflow are rejected. Opening stock and existing historical movements remain intact; no schema migration is needed.
- Single-product sales display unit price, quantity and calculated total before a separate owner confirmation. Only Cash and Coop are accepted. Coop remains a manually recorded payment method, **not proof of external settlement**. No gateway or receivables were added.
- Confirmed sales retain the existing atomic Dexie transaction across product stock, sale, item snapshots, inventory movements and internal events. The reviewed price is checked again inside the transaction. Insufficient stock, stale prices and failed writes leave no partial sale. Repeated clicks are locked immediately; retries reuse the request key for an uncertain result, and a committed key cannot be reused for a different payment/item request.
- A failed transaction refreshes stock and permits editing the failed attempt. A read/refresh error after a successful write is displayed separately and does not report the sale as failed or offer to record it again. Loading errors have an explicit retry action and do not show misleading zero totals or empty sales history.
- Sales history reads stored sale-item snapshots, newest first, with date, original product name, quantity, original unit price, total, payment method and expandable read-only transaction details. Later product metadata changes do not rewrite original sale records. Internal activity remains separate from sales history and from the blocked client audit report.
- Root routing honors the workspace preference before mounting the Personal layout. Direct Personal/Business URLs and browser back/forward navigation update the preference. New users get a workspace choice; existing welcome flags or Personal records bypass repeat onboarding. Visiting Business and returning to Personal does not reopen onboarding. Business has no salary-cutoff lifecycle requirement.
- UI components were split into product, inventory, sale and sales-history responsibilities, using existing Button/Input/Card components and design tokens. Hooks handle form locks, confirmation and refresh state; services own validation/calculations; repositories own Dexie operations.
- Business records remain in `pesopilot-business`; the existing 13-store `pesopilot` schema is unchanged. An onboarding-only repository check reads Personal record presence. Business product/stock/sale operations do not write Personal records or post sales as Personal Income/Cashflow.

### Validation results

Commands run in `apps/pesopilot-web` using `npm.cmd` on Windows (equivalent to the requested npm scripts):

| Check | Final result |
| --- | --- |
| `npm run test` | **PASS — 103 files, 1,107 tests, 0 failures** |
| Business-specific tests within the full suite | **PASS — 5 files, 66 tests** |
| `npm run lint` | **PASS — 0 errors, 0 warnings** |
| `npm run build` | **PASS — 917 modules transformed; production bundle generated locally** |

Coverage includes product validation, required adjustment reasons, signed stock movements, adjustment rollback, insufficient stock, concurrent sales for the last units, duplicate and changed-key requests, Cash/Coop handling, owner confirmation, final-event failure rollback and retry, stale reviewed prices, immutable history snapshots, an uncertain post-commit result, post-commit refresh failure, stale-stock editing, first-use choices, direct URLs, back/forward navigation and bidirectional switching. A database integration test compares every Personal store before/after Business operations. The existing Personal Finance regression suite also passes.

Test output includes React Router future-flag notices and existing server-rendered `useLayoutEffect` notices; these are non-failing test warnings. Initial new UI tests required corrections to await React/IndexedDB completion; the final full suite has no failures. Dependencies and lockfile were not changed.

### Browser QA and remaining gates

Browser QA was attempted against a local Vite server. The browser access host was unavailable; the native Windows fallback stopped because it could not verify the browser URL sufficiently to enforce its policy. No manual browser scenario is claimed as verified.

Still unverified in a real browser: first-use Personal/Business selection, native form validation, keyboard/focus behavior, desktop/mobile layout, product creation and signed stock adjustments, Cash/Coop review/confirmation and rapid clicks, history details, reload persistence, offline operation, multiple-tab contention, direct URLs and back/forward navigation. Automated UI/IndexedDB tests cover the core interactions, but do not replace those browser checks.

Changed-surface security review considered OWASP Top 10:2025 and applicable ASVS 5.0 input-validation, integrity and access-control boundaries. User text uses React escaping; business inputs are validated before writes; transactions preserve ledger integrity; no dependencies, backend, credentials or external payment calls were introduced. This is a scoped code review, not an OWASP compliance or production security validation. Optional non-mutating dependency review remains `npm audit --audit-level=high` (not run in this batch).

Known limitations and remaining work:

- **No authentication or secure remote account access.** Browser-local data and a URL alone are not access control; the UI states this clearly. Local records/events are editable through browser tooling and are not tamper-proof.
- Data is single-browser, can be erased, and has no device sync or Business backup/restore workflow. Existing Personal backup/export does not include the separate Business database. Offline hard-reload/app-shell availability and actual browser storage failures remain unverified.
- Request-key retention for uncertain sale results is scoped to the live form. Do not interpret reopening/reloading a form as durable recovery of an in-flight request. Verify sales history before manually recreating an uncertain transaction after closing the page.
- Sales history currently loads all local sales/items; inventory and history are appropriate for a single small business. Cross-tab writes are serialized by Dexie; the UI refreshes after local operations and on window focus, rather than continuously subscribing to other tabs.
- The existing Business GitHub workflow filters PRs targeting `pesopilot-dev`, so this draft PR targeting the foundation relies on the recorded local checks unless CI filters are separately extended.
- Refunds/cancellations, staff, accounting, cloud services, payment processing, AI, and changes to v1.0 release scope remain outside this batch.
- Client-specific audit reporting remains **BLOCKED — waiting for sample**. No schema, columns, reconciliation assumptions or exports were invented.

Next recommended batch: complete real-browser/mobile/offline/multi-tab QA and agree Business backup/access/privacy requirements. Implement the client audit adapter only after the sample and acceptance rules arrive; obtain separate release approval before merging or deploying.

## Business Mode Batch 3 — Daily Sales Audit and Payment Methods

Date: 2026-11-08 (Asia/Manila). Implemented; **user validation and acceptance pending**, not marked complete.

Branch: `feature/pesopilot-business-daily-audit`, based on fetched `origin/feature/pesopilot-business-workflows` at `8ac2e6b` (Batch 2 draft PR #5). Work is isolated in `.worktrees/pesopilot-business-daily-audit`; original `pesopilot-dev` and its uncommitted Insights work are preserved. PR #4, Personal's 13 stores, v1.0 authority, master and deployment configuration are unchanged. The separate draft PR targets the workflows branch; no merge or deployment is authorized.

### Implemented surface

- Cash / GCash / Coop Pay are accepted and displayed distinctly in POS review, completed sale snapshots, history, dashboard and daily audit. All remain owner-confirmed manual labels, with no gateway or settlement verification.
- `/business/audit` has a Philippine date selector, loading/error/retry and empty states, daily summary, and the client's 11 columns in a horizontally scrollable table. Each stock group owns one inventory row with variants beneath it. Row totals and sales amounts cannot be edited. Focus refresh and stale-response protection prevent an older date's request from replacing the selected report.
- A deterministic audit service reads one consistent read-only Dexie snapshot, groups days by Asia/Manila, and sums integer-centavo sale-item amounts. Variant rows use saved sale names/prices; different historical names/prices produce distinct rows. Stock comes from movement history, never today's product quantity.
- Stock totals distinguish opening quantity, same-day opening/receiving/additions, sales consumption and non-sale removals. Legacy foundation `stock_received` events are supported. Remaining = opening + additions − sales consumption − non-sale removals. The UI exposes removals explicitly rather than disguising them as sales.
- Business DB v2 adds `inventoryPools`. Its transaction-backed upgrade creates one independent pool per saved product, retains stock and original sale/item/movement/event records, and adds pool references without changing monetary amounts or Personal data. No existing stocks are merged automatically. No new dependencies or lockfile changes.
- New variants can select an existing pool with zero new opening stock; owners receive additional inventory through a reasoned stock adjustment. Different prices remain independent. Combined variant requests are validated before commit, each sale consumes one unit per variant (provisional), and pool/cache/movement/sale/item/event writes roll back together. Existing request-key idempotency remains intact.

### Validation evidence

Run from `apps/pesopilot-web` with `npm.cmd` on Windows:

| Command | Actual result |
| --- | --- |
| `npm run test` | PASS — 106 files, 1,122 tests, zero failures |
| `npm run lint` | PASS — zero errors / warnings |
| `npm run build` | PASS — 921 modules transformed |

Business coverage: 8 files / 81 tests, including the full sample calculated from real transactions (405 available, 48 Cash units / ₱7,741, 31 Coop units / ₱6,343, zero GCash, 79 sold, 326 remaining, ₱14,084 overall). Roll-On and Rub remaining stocks are 73 and 68. A separate fixture verifies GCash; other coverage includes restocks/removals, independent/shared stock, combined insufficient stock, competing variants, rollback, duplicates, changed prices, Manila midnight boundaries, old/new asynchronous date responses, read errors, no-sales days, real v1 upgrade/reopen, route isolation, and unchanged Personal stores.

The final review identified historical `stock_received` events from the foundation; the audit recognizes them and the saved-v1 migration fixture includes an intraday receipt. Tests were rerun after this correction. Existing non-failing React Router future-flag and server-rendered useLayoutEffect notices remain. No test pass is claimed for browser scenarios.

Browser QA availability was checked. The browser access host was unavailable; native fallback timed out waiting for app approval. Browser QA could not proceed. Desktop/mobile layout, native keyboard/date controls, offline/reload and actual multi-tab contention still need real-browser verification.

### Security review and remaining limitations

Changed-surface review used OWASP Top 10:2025 and applicable ASVS 5.0 control areas: input validation, output encoding, transaction/data integrity, access control, configuration and error handling. No additional changed-surface vulnerability was identified in the code review. React escapes names/reasons; services validate quantities/payment/centavos; shared writes are transactional; the audit uses a read-only consistent snapshot and refuses inconsistent sale/movement totals; report failures show a generic error. No secrets, financial debug logs, new dependencies or external payment calls were introduced. This is not an OWASP compliance certification. Dependency scan was not run; user command: `npm audit --audit-level=high` (no automatic fix).

- Existing legacy sales retain original item snapshots. Legacy unsold historical prices were never recorded and cannot be reconstructed: those prices are explicitly unavailable, and names are labeled as captured at migration. New unsold products use creation snapshots. There is no catalog price-change/history editor in this batch.
- Existing independent products cannot yet be reassigned/merged into one pool. Create variants under the correct pool; any future regrouping needs its own historical-stock transfer design. The POS UI remains single-product per sale; the transaction service supports multi-item/shared-pool requests.
- “Reload Qty” provisionally means opening + applicable additions; confirm with the client. One stock unit per Solo/Set sale also needs confirmation. No bundle multipliers are inferred.
- The ₱7,718 panel (₱6,570 Onhand Cash + ₱150 JRIDE + ₱300 GRAB + ₱599 GCASH PAY + ₱99 GCASH PAY) has unresolved meaning. It is separate from ₱7,741 Cash Sales. No automatic expense/receipt/GCash classification or reconciliation is implemented.
- No authentication, private URL guarantee, tamper-proof ledger, Business backup/restore, cloud sync, exports, refunds, payroll, tax, suppliers, staff, accounting or AI. Audit reads currently scan local history; large-history optimization remains future work. The earlier uncertain-request and browser storage limitations still apply.
- Existing CI filters do not cover PRs targeting the workflows feature branch; recorded local checks are not a claim of remote CI success. No deployment was run.

Next batch: client confirmation of Reload Qty, consumption and reconciliation semantics; then real-browser/mobile/offline/multi-tab QA and separately approved Business access/privacy/backup planning. Detailed cash reconciliation waits for clarified financial meanings. User/ChatGPT owns acceptance and completion status.

### Follow-up prompt comparison — 2026-11-08

Compared the revised “Daily Sales Audit & Three Payment Methods” prompt with the implemented Batch 3 branch. The verified parent remains `feature/pesopilot-business-workflows` at `8ac2e6b4b7455396c15b36702745d6dd958deeb5`; [draft PR #6](https://github.com/KennethVier/vier-portfolio-labs/pull/6) targets that branch. PRs #4 and #5 are unchanged.

The revised prompt adds no missing financial or persistence behavior: three manual MOPs, the selected Manila-date audit, exact transaction-built sample, separate GCash fixture, signed adjustments, historical snapshots, shared-pool multi-item validation, rollback/idempotency, saved-record migration, Personal isolation and Batch 2 regressions are already implemented and covered. Reconciliation remains deferred, with no invented classifications or formulas.

Applied presentation/documentation differences:

- Aligned the table wording to “Reload / Available Quantity” and expanded payment quantity headings. The complete supported columns are: Price (PHP), Item, Reload / Available Quantity, Cash Payment Quantity, Cash Sales (PHP), GCash Payment Quantity, GCash Sales (PHP), Coop Payment Quantity, Coop Sales (PHP), Total Sold, Remaining Stock.
- Changed “Stock added today” to “Stock added on selected date” so historical reports describe their selected day accurately; simplified the available-inventory summary label.
- Used “Coop Pay” consistently in the dashboard and identified all three manual payment labels in POS/dashboard settlement notices.
- No calculation, schema, transaction, dependency or Personal Finance change was required. Existing provisional Reload Qty/consumption assumptions and access/privacy/backup/browser QA gates remain. No acceptance status is marked complete.
- Follow-up validation executed: `npm run test` PASS (106 files / 1,122 tests, zero failures), `npm run lint` PASS (zero errors / warnings), `npm run build` PASS (921 modules). Existing non-failing React Router/useLayoutEffect notices remain. Real-browser scenarios remain unverified; the earlier browser-host/native-approval blocker was not retested for these copy changes.
- Follow-up changed-surface security review considered OWASP Top 10:2025 and applicable ASVS 5.0 output-encoding/integrity controls. Text changes preserve React escaping and introduce no persistence, authorization or dependency change; no new finding identified. Dependency scan remains unrun (`npm audit --audit-level=high`).
