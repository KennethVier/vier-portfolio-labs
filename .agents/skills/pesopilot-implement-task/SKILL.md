---
name: pesopilot-implement-task
description: PesoPilot implementation-only workflow. Execute an approved ChatGPT-reviewed plan directly with exact path scope, Ponytail-style reuse, Caveman-style low ceremony, no tests by default, and OWASP-aligned security/user-validation handoff.
---

# Implement an Approved PesoPilot Task

## Goal

Execute an already-reviewed PesoPilot implementation plan with the smallest correct change set and minimal token/tool usage.

ChatGPT owns planning and plan review. Antigravity owns implementation. Do not re-plan an approved plan unless repository reality exposes a concrete contradiction, blocker, or security-sensitive ambiguity.

## Approved Plan Rules

Treat the approved plan as controlling. If the instruction says `APPROVED WITH MINIMAL CHANGES`, apply only the listed corrections and keep the rest of the approved plan unchanged.

Respect three path groups from the approved prompt:

- `ALLOWED EDIT PATHS`: files/directories that may be created or modified.
- `REFERENCE ONLY`: files that may be read but not modified.
- `DO NOT TOUCH`: explicit exclusions.

If implementation genuinely requires a file outside `ALLOWED EDIT PATHS`, stop and report the exact additional path and reason. Do not silently expand scope.

## Execution

1. Read the approved implementation prompt and referenced plan.
2. Read only the exact reference/target files needed for the task.
3. Reuse existing PesoPilot models, services, rule-engine patterns, helpers, and data contracts before writing new abstractions.
4. Implement the smallest complete change inside the allowed edit scope.
5. Add or modify focused behavior-oriented tests only when they materially support new/changed behavior.
6. Do not run tests or broad validation by default.
7. Perform a concise changed-surface secure-code review using OWASP Top 10:2025 and applicable OWASP ASVS 5.0 controls.
8. Return exact commands for user validation, including focused tests and a non-mutating vulnerability/dependency scan.

## Ponytail Principle — Reuse First

Prefer, in order:

1. no change if behavior already exists;
2. an existing PesoPilot pattern/service/helper;
3. existing React/Vite/JavaScript capabilities and installed dependencies;
4. the smallest new code needed now;
5. a new abstraction only when current requirements require it;
6. a new dependency only when explicitly approved and unavoidable.

Do not refactor adjacent code, generalize for hypothetical features, add speculative extension points, or touch unrelated portfolio projects.

## Caveman Principle — Low Ceremony

Use the shortest safe path from approved plan to working code.

Do not perform broad repository reconnaissance, inspect unrelated history/branches/PRs, spawn subagents, load unrelated docs, narrate routine work, or re-plan already-approved decisions.

Expand context only for a concrete blocker, contradiction, dependency, architecture boundary, or security concern.

## PesoPilot Boundaries

- Active development branch: `pesopilot-dev`.
- `master` remains the frozen deployed snapshot unless the user explicitly authorizes release work.
- Keep changes under `apps/pesopilot-web` and explicitly approved PesoPilot docs/agent files unless the task says otherwise.
- Do not deploy or trigger unrelated portfolio services.
- Deterministic finance services/engines remain the source of financial truth.
- AI/LLM code must not invent balances or replace deterministic financial calculations.
- Do not add tables, dependencies, backend APIs, infrastructure, or later-phase behavior unless explicitly approved.

## Test / Command Policy — User Runs Validation

Default: run **no tests and no validation commands**.

Antigravity may run one narrowly targeted test only when **both** are true:

1. the test/test method/file was created or modified by the current implementation; and
2. the approved implementation prompt explicitly authorizes Antigravity to run that changed test.

When authorized, use the narrowest practical target: exact changed test method first, otherwise the changed test file/class.

Never run by default:

- unchanged/existing tests;
- full test suites;
- broad npm test commands;
- lint, build, typecheck, formatting;
- `npm audit`, dependency scanners, or penetration tests;
- Docker/Testcontainers/database startup;
- application/server startup;
- browser/E2E tests;
- deployment commands;
- broad Maven lifecycle commands.

Put all required commands in `USER VALIDATION` or `SECURITY VALIDATION` for the user to run.

## Security Review — OWASP Baseline

Every implementation must receive a concise review of only the changed surface using OWASP Top 10:2025 as the risk-awareness baseline and OWASP ASVS 5.0 where applicable.

Consider, when relevant:

- access control/authentication boundaries;
- input validation, injection, unsafe parsing, and untrusted data flow;
- secrets/tokens and sensitive financial or personal data exposure;
- security configuration;
- dependency/supply-chain changes;
- integrity/trust boundaries;
- logging/error leakage and fail-safe handling.

For LLM/agent work also review prompt/data boundaries, untrusted model output, excessive agency, sensitive-information exposure, and AI supply-chain concerns.

Do not claim OWASP compliance from a code review or dependency scanner alone.

Normally report this command for PesoPilot frontend dependency review:

```powershell
npm audit --audit-level=high
```

Do not run `npm audit fix` automatically.

## Implementation Report

Return only a concise handoff:

```text
IMPLEMENTED — USER VALIDATION REQUIRED

Changed:
- <concise behavior/files>

Agent-run tests:
- none
```

If an explicitly authorized changed test was run:

```text
Agent-run tests:
- <exact new/modified test target> — PASS/FAIL
```

Then:

```text
SECURITY REVIEW
- OWASP references: Top 10:2025 + applicable ASVS 5.0 controls
- Changed-surface findings: <none identified | concise findings>
- Security-sensitive boundaries checked: <concise list>

SECURITY VALIDATION
- <exact non-mutating vulnerability/dependency scan command>

USER VALIDATION
- <exact focused test command(s)>
- <lint/build command(s) when appropriate>
- <manual validation flow when appropriate>
```

Do not mark a tracker task complete. ChatGPT/user validation owns completion decisions.

## Stop Conditions

Stop instead of improvising when:

- a required edit falls outside approved paths;
- the plan conflicts with repository reality;
- implementation needs an unapproved architecture/schema/dependency/backend/deployment decision;
- a security-sensitive boundary is ambiguous;
- required credentials are missing;
- the task would silently enter a later tracker phase.

Use:

```text
BLOCKED

Issue:
<concise blocker>

Need:
<exact decision or additional path approval required>
```
