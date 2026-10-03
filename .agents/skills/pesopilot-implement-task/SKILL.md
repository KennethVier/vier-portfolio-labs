---
name: pesopilot-implement-task
description: PesoPilot implementation-only workflow. Execute an approved ChatGPT-reviewed plan directly with exact path scope, Ponytail-style reuse, Caveman-style low ceremony, modern React coding standards, no tests by default, and OWASP-aligned security/user-validation handoff.
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

## React Frontend Standard — Modern React / AI-Assisted Coding

For React work, repository reality and the approved plan outrank generic style advice. When they do not decide an issue, follow current official React principles: pure rendering, minimal state, Effects only for external synchronization, immutable inputs, and behavior-oriented component boundaries.

Do not "modernize" unrelated code just because a newer React pattern exists. Do not introduce APIs, compiler assumptions, framework features, or React-version-specific behavior that the installed PesoPilot toolchain does not already support unless explicitly approved.

### Components and Rendering

- Use function components and Hooks; preserve existing project conventions before introducing a new component pattern.
- Components and custom Hooks must be pure during render: no network calls, persistence writes, global mutation, timers, random IDs, `Date.now()`, or other side effects in render.
- Never mutate props, Hook arguments, Zustand state objects, InsightBundle objects, financial DTOs, or other non-local inputs. Produce new values instead.
- Keep components focused on presentation and interaction. Deterministic finance calculations, financial classification, recommendations, and narrative generation belong in their existing engines/services, not JSX.
- Prefer composition and small local helpers over giant conditional components, but do not split a component solely to satisfy an arbitrary line-count rule.
- Use stable domain IDs for list keys. Do not use array indexes as keys when items can be inserted, removed, filtered, or reordered.
- Render deterministic values. Do not create unstable keys or output with `Math.random()`, timestamps, or generated IDs during render.

### Hooks and Effects

- Follow the Rules of Hooks: call Hooks only at component/custom-Hook top level, never conditionally, in loops, or in nested callbacks.
- Treat `useEffect` as an escape hatch for synchronizing React with an external system such as browser APIs, subscriptions, timers, or imperative third-party code.
- Do not use Effects to derive display data from props/state. Compute derived values during render or in the existing deterministic service/selector layer.
- Do not use Effects merely to react to a user event when the logic belongs in that event handler.
- Avoid Effect chains that copy state into more state. Prefer one source of truth and derive downstream values.
- When an Effect performs asynchronous work, handle cleanup/staleness so an older response cannot overwrite newer state.
- Keep dependency arrays truthful. Do not suppress Hook dependency lint rules to force behavior unless the approved task documents why.

### State Ownership

- Keep state minimal. Do not store values that can be derived from existing props, state, selectors, or deterministic DTOs.
- Avoid contradictory, duplicated, or deeply nested state when a simpler normalized representation is sufficient.
- Keep transient UI state local to the component when it is not shared.
- Use Zustand only for genuinely shared application/feature state and follow the existing store API. Prefer narrow selectors when the existing store supports them rather than subscribing a component to unrelated state.
- Keep IndexedDB/Dexie persistence behind the existing service/repository boundaries. React components must not become an alternate persistence or finance-calculation layer.
- Do not mirror persisted DTOs into separate component state unless an explicit editable draft/snapshot is required.

### Data and Business Logic Boundaries

- UI consumes authoritative service/engine outputs; it does not recompute financial intelligence for convenience.
- Never duplicate formulas for balances, remaining cash, rates, health scores, trends, recommendations, summary rankings, or cutoff logic inside React components.
- If a UI needs a view model, derive it from existing deterministic outputs without changing financial meaning.
- Preserve explicit loading, empty, error, and no-data semantics. Do not convert missing financial data into plausible-looking zeroes or default positive/negative conclusions.
- User-triggered mutations belong in explicit event/action flows, not hidden render/Effect behavior.

### Memoization and Performance

- Do not cargo-cult `useMemo`, `useCallback`, or `React.memo`.
- Add memoization only for a demonstrated expensive computation, a required referential-stability contract, or an existing project pattern where it prevents meaningful rerenders.
- Prefer fixing state ownership, Effect misuse, or overly broad subscriptions before adding memoization.
- Do not assume React Compiler is configured. Do not add compiler directives or compiler-specific patterns unless the repository already uses them or the approved plan explicitly adds them.
- Avoid premature code-splitting or dependency changes in a feature task unless performance work is explicitly in scope.

### Forms and User Input

- Reuse the project's existing form and validation patterns before introducing new ones.
- Use semantic form controls and keep controlled/uncontrolled ownership consistent within a field.
- Validate user input at the appropriate boundary; client validation improves UX but must not be treated as a security boundary for future server-backed flows.
- Do not duplicate validation rules across component state, schemas, and services unless each layer has a distinct responsibility.

### Accessibility and UX Correctness

- Prefer semantic HTML first: `button` for actions, links for navigation, labels for form controls, headings in logical order.
- Preserve keyboard operation and visible focus for interactive controls.
- Use ARIA only when native semantics are insufficient; do not add decorative ARIA that conflicts with native behavior.
- Provide meaningful accessible names/alt text when the touched UI requires them.
- Preserve existing loading, empty, error, disabled, and success states when changing a flow.

### React Security

- Treat external/user-derived strings as untrusted display data. Rely on normal React escaping.
- Do not use `dangerouslySetInnerHTML`, raw HTML injection, `eval`, `Function`, or executable string templates unless an explicitly approved design has a reviewed sanitization boundary.
- Do not place secrets, tokens, financial records, or sensitive payloads in console logs or rendered debug output.
- Do not trust client-side route guards or hidden UI as authorization; future server-backed authorization must remain server-enforced.

### AI Coding Guardrails

When acting as an implementation agent:

- Existing project conventions beat fashionable rewrites.
- Prefer local reasoning: a reviewer should understand a component/Hook without tracing speculative abstractions across the app.
- Do not create generic hooks, wrappers, contexts, adapters, component systems, or "future-proof" layers unless the current task has at least one concrete use that existing patterns cannot serve cleanly.
- Do not rename/restructure files merely to match a preferred React architecture if current architecture is coherent.
- Do not upgrade React, Vite, Zustand, Dexie, routing, form, styling, or testing dependencies as part of an unrelated feature task.
- If the approved plan conflicts with React correctness, stop and report the concrete contradiction instead of silently redesigning the task.

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
