# Business Mode v1.1 — Implementation Tracker

Status: ISOLATED FEATURE BRANCH. Not part of v1.0 release approval.

| Milestone | Status | Acceptance |
| --- | --- | --- |
| B0 Proposal, scope, and boundaries | Complete (provisional) | New v1.1 proposal; v1.0 authority untouched |
| B1 Workspace choice and distinct business route | Batch 2 implemented; review pending | First use, existing personal users, direct routes and bidirectional switching covered by tests; no business cutoff requirement |
| B2 Local product/stock foundation | Batch 2 implemented; review pending | Validated products; explicit signed adjustments with required reasons; nonnegative stock; retained movement/event history |
| B3 Manual Cash/Coop completed sale | Batch 2 implemented; review pending | Review total, explicit owner confirmation, atomic writes, immutable snapshots, duplicate/retry handling and read-only sales history |
| B4 Client-format audit | **BLOCKED — waiting for sample** | Sample mapping, test fixtures and reconciliation remain undefined; no report/export implemented |
| B5 Integration/security/offline QA | Automated checks passed; manual/security gates pending | 1,107 tests pass; lint/build pass; browser access blocked; backup/access/privacy decisions outstanding |
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
