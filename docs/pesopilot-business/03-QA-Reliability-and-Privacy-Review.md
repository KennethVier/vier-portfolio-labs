# Business Mode Batch 4: independent QA and release assessment

Date: 2026-11-08, Asia/Manila. Proposed v1.1 only. **Not production-ready or approved for deployment.**

## Scope and authority

Reviewed the cumulative foundation, workflows and daily-audit implementation from PRs #4-#6, including routing, workspace preferences, products, adjustments, owner confirmation, shared inventory, three manual payment labels, idempotency, historical reports, v1/v2 migration, Personal isolation and Personal backup contracts. Read the Business proposal/tracker/audit architecture and approved v1.0 source, frontend architecture, security/privacy, testing and UI v2 authority before changes. The v1.0 Source of Truth, Personal schema and Personal business logic remain unchanged.

Created `feature/pesopilot-business-qa` in `.worktrees/pesopilot-business-qa` from freshly fetched `origin/feature/pesopilot-business-daily-audit` (`1aa904f2d2a0b49f3e361818b0547e1abb31eb86`). PR #6 was verified open and targeting `feature/pesopilot-business-workflows`; #5 targets foundation, #4 targets `pesopilot-dev`. Original uncommitted Insights/Personal work was preserved. No changes to those PRs or merges. No deployment command was run, but the existing Vercel Git integration automatically published a preview after the required QA push; see the deployment exception below.

## Findings and changes

| Finding | Outcome |
| --- | --- |
| Prior-day movements contributed deltas to opening stock without checking their before/after chain or reconciling prior sales | Fixed. Audit validates preceding movement chains, supported types/reasons, product/pool links, quantities/amounts, and sale timestamps before calculating opening inventory. Same-day shifted timestamps are also rejected. |
| Business records had no backup path; Personal export reads only its 13 approved stores | Implemented an independent six-store Business JSON download and validated, owner-confirmed atomic replacement. See [format and recovery](04-Business-Backup-and-Restore.md). |
| Restore could otherwise overwrite a sale made after owner review | Replacement compares the reviewed current snapshot under the same read/write transaction lock. A changed dataset rejects the entire replacement and requires a new review. |
| Current retry key is held only in the live form | Added an operational warning to inspect history after page closure. No claim of durable request recovery. Closing/reloading the form loses the key; manually re-entering a sale creates a different request. |
| CI filtered only PRs targeting `pesopilot-dev` | Added exact stacked base branches and a workflow-file path filter. Retained test/lint/build and scoped app paths; Node 24, lockfile `npm ci`, current release SHA pins, read-only token and no persisted checkout credentials. |
| Dependency scan found 12 affected packages (6 moderate, 4 high, 2 critical) | Applied compatible lockfile patches for Happy DOM, follow-redirects and selector-parser. Final scan: 9 (5 moderate, 2 high, 2 critical), exit 1. Major upgrades require a separate compatibility review. See [dependency findings](05-Dependency-Security-Review.md). |

Existing service validation, safe integer-centavo calculations, owner confirmation, unique request-key index, all-store sale transaction, price/name snapshots and combined shared-pool stock checks were retained. No evidence justified rewriting them. Repository construction now accepts a database instance so tests can exercise genuinely separate IndexedDB connections using the production transaction code. Default application wiring is unchanged.

## Automated evidence

Windows, Node `v24.16.0`, locked npm dependencies; commands run in `apps/pesopilot-web` (`npm.cmd` is the Windows executable for the requested npm commands).

| Check | Result |
| --- | --- |
| `npm ci` | Pass. A reinstall initially hit a Windows esbuild file lock while the QA server was running; stopping that server and retrying succeeded. |
| `npm run test` | Pass: 110 files, 1,163 tests. Includes 41 added Batch 4 cases, 122 cumulative Business cases. |
| `npm run lint` | Pass: zero errors/warnings after correcting an unescaped JSX apostrophe. |
| `npm run build` | Pass: 926 modules; local production output generated. |
| `npm audit --audit-level=high` | Fail, exit 1: 9 affected packages (2 critical, 2 high, 5 moderate). |
| Remote GitHub Actions | Pass: [run 42443263903](https://github.com/KennethVier/vier-portfolio-labs/actions/runs/42443263903) on draft PR #7, implementation commit `bdc71dd`. Linux / Node 24.22.2; npm ci, 110 files / 1,163 tests, lint and build all passed. Job duration 38 seconds. Logs inspected separately from local evidence. |

Added tests cover all-store backup round trips, all payment labels, original snapshots, shared pools, preserved Personal tables, malformed/version-mismatched/extra/missing datasets, duplicate IDs/keys/lines/events, orphan links, fractional amounts, inconsistent totals, stock chains, reasons, event payloads, bounded files/collections, explicit owner confirmation, cancellation, rapid duplicate restore clicks, post-commit refresh errors, stale restore review, final-write failure rollback, independent-connection idempotency/contention, and failed migration rollback/retry. A valid migrated v1 Cash/Coop fixture retains legacy event payloads and accepts a later GCash sale. Existing migration reopening, audit sample/Manila date boundaries, workflow/UI and workspace regressions also pass.

The initial new tests found a legitimate legacy payload detail (Dexie-generated movement IDs) and an ineffective failure-injection spy on transaction-local table instances. The validator preserves those IDs; the final rollback test uses a creating hook which actually aborts the transaction. No initial failing result is presented as a pass. Tests use fake-indexeddb and happy-dom, not a real browser. Existing non-failing React Router future notices and server-rendered `useLayoutEffect` notices remain.

## Browser and offline evidence

Started an actual local Vite server on `http://127.0.0.1:5184/`; server reported ready. Browser inventory returned **“The browser access host is unavailable”**. The native Windows fallback could read Chrome state, but its first attempted input stopped with **“could not determine the current browser URL on Windows with enough confidence to enforce policy.”** Stopped UI automation and shut down the QA server. No browser interaction with the local application succeeded; no browser QA is marked passed.

| Required real-browser scenarios | Status / available substitute evidence |
| --- | --- |
| Fresh Personal/Business onboarding; existing Personal bypass; direct `/business` and `/business/audit`; switching; back/forward | Unverified in browser; existing automated real-router/layout tests pass. |
| Create products/shared variants; stock additions/removals; invalid changes; shared remaining quantities | Unverified in browser; service, IndexedDB and DOM workflow tests pass. |
| Cash/GCash/Coop sales, displayed totals, insufficient stock, rapid confirmation, history | Unverified in browser; automated workflow/transaction tests pass. |
| Historical/rapidly changed dates, product groups, payment totals, empty/error states, inventory totals | Unverified in browser; deterministic sample, Manila boundary and stale-response tests pass. |
| Desktop/mobile rendering; keyboard/focus; native file chooser/download and form constraints | Unverified. Semantic controls/labels and existing responsive tokens inspected; simulated DOM confirmation tests pass. |
| Refresh persistence; tab duplication; simultaneous multi-tab sales | Unverified in browser. Two independent fake-indexeddb connections verify serialization/idempotency, but do not replace real browser process tests. |
| Offline operation after initial load | Unverified. Business services contain no network dependency; this alone is not browser evidence. |
| Reload/cold start while offline | Unverified and a release blocker. No service worker or explicit application-shell cache is configured. HTTP cache availability is not a guaranteed offline shell. |
| IndexedDB disabled, real storage quota/private mode errors, interruption during actual browser migration | Unverified. Injected transaction/migration failures pass automated rollback tests. |
| Business backup/restore in real browser | Unverified. Automated format, integrity, transaction and UI confirmation tests pass. |

## Security and privacy assessment

Reviewed against [OWASP Top 10:2025](https://top10.owasp.org/2025/) A01/A07 (access/authentication), A03 (dependencies), A05 (injection), A08 (data integrity), A09 (logging) and A10 (failure handling), with applicable [ASVS 5.0](https://asvs.owasp.org/downloads/) validation/business logic, file handling and data-protection principles. This is a scoped engineering review, not formal compliance, penetration testing or a security certification.

Business names, reasons and snapshots use ordinary React text escaping. No Business HTML evaluation, `dangerouslySetInnerHTML`, financial console logging, network calls or credentials were found. The backup boundary uses strict allowlisted schemas, bounded parsing, complete relationship/event reconciliation and atomic writes. Local events remain editable through developer tools and are not tamper-proof. A syntactically valid, internally consistent forged file cannot be authenticated by this unencrypted format. Backup UI errors do not display parser contents or imported payloads. Older Business write/load errors still display exception messages locally; they are not transmitted as telemetry.

`/business` separates application workflows and the database name. It provides **no authentication, authorization, private URL, or protection against another person using the same browser profile**. Personal and Business databases share the site's origin: same-origin injected code or a malicious extension with access could read both. This agrees with [OWASP browser-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#client-side-databases); local storage must not be treated as authenticated access.

A public static site does not by itself upload local IndexedDB records or expose those records to arbitrary visitors on other devices. However, each visitor can open the Business screen; anyone with the owner's profile, compromised scripts/extensions or stolen unlocked device may read/change the owner's data. A later domain/origin/profile change creates a different database view. Clearing site data, uninstalling a browser, device failure, storage eviction and private browsing can lose records. Backup downloads are plaintext and require private storage; no encryption or key/recovery model was introduced.

For a cost-conscious Philippine owner, a **controlled single-device pilot** can be considered only after the remaining gates: owner-controlled OS account and screen lock, dedicated browser profile, a stable HTTPS origin, no shared-device access, daily private Business backups stored separately from the device, and a demonstrated restore drill. Discuss the actual records' sensitivity and obtain explicit owner acceptance of local-only/erasable storage. Do not describe this as a private remote dashboard.

Genuinely private remote access requires a separately approved identity/session model and server-enforced access/authorization (or an authenticated access gateway protecting the complete app), threat model and recovery procedure. Protecting static access alone still does not synchronize or secure an already unlocked local database. Remote shared data would need an authorized storage/API design with per-owner authorization, protected backups and auditability. Those are future decisions; no auth, staff, remote database or sync was implemented.

Before any deployment: address/accept dependency findings through review, use HTTPS and a stable controlled origin, review CSP and security headers without weakening application behavior, avoid exposing Vite/Vitest development servers or source secrets, test the production build and storage failure behavior, prove browser/offline/backup recovery, and agree who can access the device and backup files. Deployment configuration was not changed in this batch.

Deployment exception: the required Git push triggered the repository's existing Vercel integration. Read-only inspection confirmed project `peso-pilot`, QA commit `bdc71dd`, Git source, preview deployment `dpl_56tqPEjEerhAmfzQsspoAFYXhroa`, state `READY`; logs show the actual QA build. No production promotion/deploy command or Vercel/Render configuration mutation occurred, but this automatic preview means the no-deployment instruction was not fully satisfied. Connected Vercel tools support cancellation only while a build is in progress; they do not expose deletion of the completed preview. Disable automatic previews for these branches and review/remove that generated preview separately. No customer browser records or backup files were uploaded by this work. This preview is not a release or validation gate.

## Release gates and client decisions

Keep this branch draft. Finish real-browser desktop/mobile/keyboard, tab contention, native backup/restore and offline/cold-reload QA in a supported environment. Resolve dependency majors, review this backup/access model and demonstrate recovery on a separate test profile. Then obtain client acceptance and a separate release decision. CI success alone cannot waive those gates.

Still unresolved: exact **Reload Qty** definition; whether Roll-On/Rub Solo and Set each consume one physical stock unit; meaning of the **PHP 7,718** cash reconciliation panel; whether **Coop Pay** settles immediately or is collected later. Current one-unit consumption and available-quantity wording remain provisional. No accounting or automatic reconciliation was inferred.
