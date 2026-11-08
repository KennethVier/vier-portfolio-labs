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
