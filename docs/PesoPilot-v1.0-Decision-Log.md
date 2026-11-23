# Decision Log

Version: 1.0

Status: Active

Purpose:

Record important architectural and product decisions.

This prevents:

```txt
Why was this done?
Why was this table added?
Why are we using Dexie?
```

months later.

---

# ADR-001

Title:

Local First Architecture

Status:

Accepted

Decision:

Financial records are stored in IndexedDB using Dexie.js.

Reason:

* Privacy
* Offline support
* Simplicity
* No infrastructure cost

Consequences:

* Browser-owned storage
* Backend not source of truth

---

# ADR-002

Title:

No Account Model

Status:

Accepted

Decision:

MVP does not require accounts.

Reason:

* Reduced friction
* Better privacy
* Faster onboarding

Consequences:

* No multi-device sync
* No cloud persistence

---

# ADR-003

Title:

Feature-Based Frontend Architecture

Status:

Accepted

Decision:

Frontend organized by feature.

Reason:

* Scalability
* Maintainability
* Clear ownership

Consequences:

* More folders
* Better long-term organization

---

# ADR-004

Title:

Backend-Assisted Intelligence

Status:

Accepted

Decision:

Backend exists primarily for AI workflows.

Reason:

* Frontend owns financial records
* AI logic isolated

Consequences:

* Backend remains lightweight
* Easier future AI upgrades

---

# ADR-005

Title:

Repository Pattern

Status:

Accepted

Decision:

Persistence must go through repositories.

Reason:

* Testability
* Separation of concerns
* Future flexibility

Consequences:

* Slightly more code
* Cleaner architecture

---

# ADR-006

Title:

AI as Advisor

Status:

Accepted

Decision:

AI cannot modify financial records automatically.

Reason:

* Trust
* Transparency
* Safety

Consequences:

* User approval required
* Reduced automation risk

---

# ADR-007

Title:

Design Authority

Status:

Accepted

Decision:

design.md is the visual authority.

Reason:

* Consistency
* Prevent redesign drift

Consequences:

* UI changes require design review

---

# ADR-008

Title:

MVP Scope Freeze

Status:

Accepted

Decision:

Only phases 0–13 belong to MVP.

Reason:

* Prevent scope creep
* Faster delivery

Excluded:

```txt
Goals
Paybacks
Financial Coach
Health Score
Spending Personality
```

Consequences:

* Additional features delayed
* Cleaner MVP

---

# ADR-009

Title:

React + Spring Boot

Status:

Accepted

Decision:

Frontend uses React.

Backend uses Spring Boot.

Reason:

* Existing expertise
* Maintainability
* Hiring familiarity

---

# ADR-010

Title:

Stitch Design System

Status:

Accepted

Decision:

Use Stitch-generated design system.

Reason:

* Consistency
* Professional appearance
* Faster development

Consequences:

* New screens must follow existing patterns

---

# ADR-011

Title:
Use Spring Boot 4 for Backend Foundation

Status:
Accepted

Decision:
PesoPilot will use Spring Boot 4 with Java 21 for the backend service.

Reason:
PesoPilot is a new greenfield project, and Spring Boot 4 is the selected backend foundation moving forward.

Consequences:
The original documentation references Spring Boot 3 in some places and must be updated to Spring Boot 4 when touched. All backend implementation should follow Spring Boot 4 conventions.

---

# ADR-012

Title:
Actual Income Must Come From Income Records

Status:
Accepted

Decision:
Salary cutoffs will store expectedIncome only. Actual income will be derived from Income Tracking records linked by cutoffId.

Reason:
Storing actualIncome on salary_cutoffs while also storing income.amount creates duplicate sources of truth and can lead to inconsistent financial calculations.

Consequences:
Cashflow and Dashboard phases must calculate actual income by summing income records for a cutoff. Existing legacy actualIncome properties in local IndexedDB records are ignored.

---

# ADR-013

Title:
Budget Shock Risk Threshold Policy

Status:
Accepted

Decision:
Adopt explicit deterministic threshold boundaries and ordinal risk scoring for Phase 13 Budget Shock Warning:
1. Severity precedence is Red > Orange > Yellow > Green. The highest matching severity always wins.
2. Risk scoring is an ORDINAL score:
   - Green = 0
   - Yellow = 1
   - Orange = 2
   - Red = 3
   No 0–100 composite financial risk score or arbitrary weighted factors are used.
3. Red (Score: 3, Meaning: Projected Deficit / Budget Overage):
   Triggers when projectedDeficit > 0 OR projectedRemaining < 0 OR availableCash < 0 OR any valid category budget utilization > 100% (raw ratio > 1.00; exactly 100.00% is Orange, 100.01% is Red).
4. Orange (Score: 2, Meaning: Likely Overspending):
   Evaluated only if not Red. Triggers when remainingDays > 0 AND safeDailySpend > 0 AND dailyBurnRate > safeDailySpend, OR any valid category budget utilization >= 80% AND <= 100%.
5. Yellow (Score: 1, Meaning: Monitor Spending):
   Evaluated only if not Red or Orange. Triggers when remainingDays > 0 AND safeDailySpend > 0 AND (dailyBurnRate / safeDailySpend) > 0.90 AND (dailyBurnRate / safeDailySpend) <= 1.00, OR any valid category budget utilization >= 70% AND < 80%.
6. Green (Score: 0, Meaning: Healthy):
   Evaluated when no Red, Orange, or Yellow rule matches.
7. Active alerts are persisted in budget_shock_alerts strictly for Orange and Red (one active alert per cutoff, updated/resolved deterministically; Green and Yellow remain purely computed UI states).

Reason:
Authoritative v1 documentation defined qualitative risk levels (Green: Healthy, Yellow: Monitor Spending, Orange: Likely Overspending, Red: Projected Deficit) and design system 80% budget cues, but did not define all quantitative boundaries or risk scoring mechanics. The 90% burn pressure and 70% category utilization watch thresholds provide a 10-point early warning buffer prior to primary overspending.

Consequences:
Budget Shock calculations are pure, deterministic, and local-first. Phase 12 ForecastResult is consumed directly without math duplication. Category budgets are optional; risk evaluates gracefully when no category budgets exist.

---

# Future Decision Template

Copy for future decisions:

```md
# ADR-XXX

Title:

Status:

Accepted / Rejected / Superseded

Decision:

Reason:

Consequences:
```

---

# Governance Rule

Every major architectural change must be recorded here.

Examples:

```txt
Database Changes
AI Changes
Deployment Changes
Architecture Changes
```

If a change is not recorded:

It should be assumed unofficial.

## Business V2 ADR — one realm and a server-only recovery copy

Accepted for isolated Business V2 development. Use Dexie Cloud Free for authentication, membership and primary synchronization. Keep the existing v3 POS database intact while testing a shared stock projection in a separate addon-enabled cache. Supabase Free receives server-validated recovery observations. Full ledger sync and recovery orchestration belong to Phase 2. See the [Business V2 Phase 1 runbook](pesopilot-business/11-V2-Phase-1-Cloud.md).

## Business V2 ADR — branch operations and two role workspaces

Accepted product direction, 2026-11-22 (Asia/Manila), per the [owner's PR #10 review](https://github.com/KennethVier/vier-portfolio-labs/pull/10#issuecomment-7073020171). One business has multiple branch stock locations and exactly Admin/Staff roles. Admin supervises all branches from Business Overview; Staff operates one assigned branch's POS, receipts/adjustments, sales, daily audit and analytics. Catalog/price management stays Admin-only. Several Staff may share a branch.

Phase 2 separates the global catalog from branch balances/movements, attributes records to stable branch/actor identities and enforces scoping through Dexie-supported server authorization. Preserve offline atomic/idempotent sales, historical data and pool/set semantics; add visible conflict reconciliation and a tested legacy default-branch migration with backup/rollback. Supabase remains secondary recovery. Current shared snapshots are reference projections and must not be copied into POS as operational stock.

Phase 1 implements only the compact account disclosure and clearer snapshot/sync UI, preserving its existing navigation and data sources. The expanded workspaces, operational ledger and branch policies remain Phase 2 work, gated on Phase 1 live acceptance and review. Any destructive migration needs separate owner approval. See [approved requirements and acceptance](pesopilot-business/12-V2-Phase-2-Branch-Requirements.md).

## Business V2 ADR — immediate isolated operational branch slice

Accepted 2026-11-22 via [Issue #11](https://github.com/KennethVier/vier-portfolio-labs/issues/11). The owner now authorizes role/branch alignment before marketplace/mobile, separately from Phase 1 PR #10. Use Dexie branch realms with a canonical business branch directory, business-wide Admin-owned catalog and atomic branch transaction envelopes. Derive stock/audit/sales from attributed movement deltas; do not copy reference snapshot quantities. Reuse the established sale planner and service validation. Keep two roles, direct branch-only Staff add permission, provider-side access enforcement and explicit conflict visibility for disconnected oversell.

Use a separate development IndexedDB operations cache against the same hosted Dexie database, preserving the Phase 1 cache and original local POS ledger. Legacy migration is optional, non-destructive, backed up and default-branch explicit; the first atomic slice stops on large/active or ambiguous source data. The existing Supabase recovery architecture remains secondary, with new-envelope replication/recovery requiring a reviewed extension. No custom transport, new authentication system, automatic failover, production change or completion claim is introduced. See [decisions, implementation and live acceptance](pesopilot-business/13-Role-Branch-Alignment.md).
