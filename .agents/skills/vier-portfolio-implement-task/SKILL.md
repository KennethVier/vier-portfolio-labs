---
name: vier-portfolio-implement-task
description: Default implementation-only workflow for Vier Portfolio Labs. Execute an approved implementation prompt directly with minimal context, Ponytail-style laziness, Caveman-style low ceremony, no broad reconnaissance, changed-test-only execution when eligible, OWASP-aligned security review, and a terse user-validation handoff.
---

# Implement a Vier Portfolio Labs Task

## Goal

Implement the requested change correctly with the smallest sufficient context, change set, command usage, and response output.

If the user or ChatGPT has already supplied a detailed implementation prompt/packet, treat it as the working plan and execute it directly. Do not re-plan or redesign it unless repository reality exposes a concrete contradiction, blocker, or significant unresolved decision.

This repository is a portfolio monorepo. Frontends live under `apps/`, backend services under `services/`, shared local infrastructure under `infrastructure/`, and project documentation under `docs/`. Scope work to the exact app/service named by the task.

## Execution

1. Read the approved implementation prompt/packet.
2. Identify the exact target app/service and affected files.
3. Read only the files needed to implement the requested behavior safely.
4. Preserve existing architecture, API contracts, deployment boundaries, and visual identity unless the task explicitly changes them.
5. Implement the smallest complete change.
6. Add/update focused behavior-oriented tests only when they materially support the change.
7. Run only an eligible test created or modified by this implementation, following the command policy below.
8. Perform a concise secure-code review of the changed surface against the relevant OWASP Top 10:2025 risks and applicable OWASP ASVS 5.0 controls.
9. Return a terse implementation report with exact user/CI validation commands and at least one exact project-appropriate vulnerability-scan command.

Do not invoke a separate planning, broad review, or broad validation workflow during ordinary implementation.

## Approved Prompt Is Controlling

Do not silently change:

- requested product behavior;
- target project/app/service;
- API contracts between frontend and backend;
- deployment topology or provider choice;
- authentication/security behavior;
- persistence model;
- demo-mode semantics;
- dependencies/infrastructure;
- unrelated portfolio projects.

If the approved prompt conflicts with repository reality, stop and report the contradiction instead of inventing a new design.

## Ponytail Principle — Laziness Ladder

Prefer the least work that is still correct, in this order:

1. make no change if the requested behavior already exists;
2. reuse an existing project pattern/component/service/helper;
3. use capabilities already provided by React/Vite, Java/Spring, CSS, or an existing dependency;
4. write the smallest new code required for the current task;
5. introduce a new abstraction only when current requirements create real pressure for it;
6. introduce a new dependency only when the task cannot be implemented correctly without it.

Do not:

- refactor adjacent code merely because it could be cleaner;
- generalize for hypothetical future features;
- create extension points before current requirements need them;
- introduce interfaces/components/helpers with no current reuse or boundary value;
- redesign an app while fixing one workflow;
- touch sibling portfolio apps/services unless the task actually crosses that boundary.

## Caveman Principle — Low Ceremony

Use the shortest safe path from task to working change.

Do not:

- perform broad repository reconnaissance;
- inspect Git HEAD/history/branches/remotes/PR metadata for ceremony;
- enumerate skills, agents, or subagents;
- spawn subagents by default;
- load unrelated documentation “just in case”;
- narrate routine file reads, searches, reasoning, or progress;
- generate long implementation essays;
- rerun context discovery already established in the current task.

Single-agent execution is the default.

Expand context only when a concrete blocker, ambiguity, dependency, failing eligible test, architecture question, or security requirement demands it.

## Monorepo Scope Rules

- `apps/<project>` owns that project's React/Vite frontend.
- `services/<service>` owns that backend service.
- Keep changes inside the named project boundary whenever possible.
- Do not modify `main-portfolio`, another showcase app, or another backend merely because they share the repository.
- Preserve existing independent deployment behavior for Vercel frontends and Render/other backend services.
- Keep secrets and credentials out of source code; use environment configuration.
- Do not replace working backend behavior with fake/demo behavior unless the task explicitly requests demo fallback.
- Do not break existing labeled demo fallback while implementing live backend behavior unless the prompt explicitly removes it.

## Frontend Implementation Rules

For React/Vite work:

- reuse existing components/state before introducing new state machinery;
- keep state ownership as local as practical;
- do not introduce Redux or another state library for a local workflow unless explicitly required;
- preserve responsive behavior across desktop, tablet, and mobile;
- prefer existing design tokens/classes/styles over creating a parallel design system;
- keep user actions explicit and unambiguous;
- do not hide backend failures behind fake success states.

## Backend Implementation Rules

For Spring Boot work:

- preserve current service boundaries;
- keep controllers thin and business behavior in the appropriate service/domain layer already used by that project;
- preserve existing DTO/API shapes unless the task requires a compatible extension;
- use environment variables for external URLs, database credentials, API keys, and deployment-specific values;
- do not add infrastructure, persistence tables, or external services unless current behavior genuinely requires them;
- bounded retries must remain bounded; never introduce infinite retry loops;
- fail clearly rather than silently fabricating successful backend behavior.

## Command Policy — Default Is Run Nothing

Do not run commands unless permitted below or the current user explicitly authorizes the exact command.

### Permitted by default

Only a test/test method/file that was **created or modified by the current implementation** may be run.

Use the narrowest practical target:

1. exact changed test method;
2. changed test class/file when method-level targeting is unavailable or impractical.

The test must be cheap/local.

A vulnerability/dependency scan is **not auto-run by default** because it can be network-dependent, slow, noisy, or require tooling that is not installed. It is mandatory to include the exact non-mutating scan command in the implementation report so the user or CI can run it deliberately.

### Not permitted by default

Do not run:

- unchanged/existing tests merely because production code changed;
- full frontend/backend test suites;
- Maven `verify`, `package`, or broad lifecycle commands;
- broad npm test commands;
- build, lint, typecheck, formatting, or validation scripts;
- Docker/Docker Compose/Testcontainers;
- database/container startup;
- application/server startup;
- Playwright/browser/E2E journeys;
- deployment commands;
- Git diff/status/check/stat/history commands solely for routine validation;
- broad security scanners or penetration tests unless explicitly authorized;
- any other broad command not explicitly authorized.

Put required broad checks in `USER VALIDATION` and security checks in `SECURITY VALIDATION`.

## Security / Safety — OWASP Baseline

Every implementation must receive a concise changed-surface security review. Use **OWASP Top 10:2025** as the primary risk-awareness baseline and **OWASP ASVS 5.0** as the verification-oriented reference where applicable.

Review only risks relevant to the changed surface; do not manufacture findings merely to fill every category. At minimum consider:

- access-control and authorization boundary changes;
- authentication/session behavior when touched;
- input validation, injection, unsafe parsing, and untrusted data flow;
- secrets, credentials, tokens, and sensitive financial/personal data exposure;
- security configuration and environment-dependent behavior;
- dependency/supply-chain impact when dependencies or build configuration change;
- cryptographic use when touched;
- integrity/trust boundaries, including imported/generated data;
- logging/error handling that could leak sensitive data or hide failures;
- exceptional-condition handling and fail-safe behavior.

Additional rules:

- Never commit secrets, passwords, tokens, API keys, or private connection strings.
- Preserve existing auth and authorization boundaries.
- Security-sensitive uncertainty fails closed.
- Do not weaken tests or validation behavior to make a change appear successful.
- Do not commit, push, deploy, or create/update a PR unless the current user instruction explicitly authorizes publication/deployment.
- Do not claim that a dependency scanner or any single tool proves full OWASP Top 10 compliance.
- When the task touches LLM/AI/agent behavior, also call out prompt/data-boundary, untrusted-output, excessive-agency, sensitive-information, and supply-chain concerns relevant to the AI surface.

### Vulnerability-scan command selection

Choose the narrowest correct command for the project and report it under `SECURITY VALIDATION`.

For npm/React/Vite projects, normally use:

```bash
npm audit --audit-level=high
```

For Maven/Spring Boot projects with a Maven wrapper, normally use an OWASP Dependency-Check invocation such as:

```bash
./mvnw org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7
```

On Windows PowerShell, use the repository's Windows wrapper when present:

```powershell
.\mvnw.cmd org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7
```

If the project already has an established security scanner/script, prefer that instead of introducing another tool. Never run an autofix command such as `npm audit fix` as part of validation.

## Communication Policy — Quiet by Default

Do not narrate implementation progress.

Speak before completion only when:

1. a real blocker prevents implementation;
2. the approved prompt conflicts with repository reality;
3. a significant unresolved decision requires user input;
4. an eligible changed test fails and materially affects the implementation.

When blocked, use:

```text
BLOCKED

Issue:
<concise factual blocker>

Need:
<exact decision/input required>
```

## Implementation Report

Keep the final response terse:

```text
IMPLEMENTED — USER VALIDATION REQUIRED

Changed:
- <concise behavior/files>

Agent-run tests:
- <exact changed test — PASS/FAIL>
```

If none were eligible:

```text
Agent-run tests:
- none
```

Then include:

```text
SECURITY REVIEW
- OWASP references: Top 10:2025 + applicable ASVS 5.0 controls
- Changed-surface findings: <none identified | concise findings>
- Security-sensitive boundaries checked: <concise list>

SECURITY VALIDATION
- <exact non-mutating vulnerability/dependency scan command>

USER VALIDATION
- <exact command or manual flow>
- <exact command or manual flow>
```

Optionally add one short `Notes:` line for a material caveat or blocker.

Do not claim broad validation, OWASP compliance, production readiness, or completion merely because one changed test or dependency scan passed.

## Stop Conditions

Stop instead of improvising when:

- the task would require changing an unrelated app/service;
- implementation requires a significant new architecture or infrastructure decision not present in the prompt;
- a security-sensitive boundary cannot be resolved safely;
- required credentials/secrets are missing and cannot be safely substituted;
- the requested behavior contradicts an established API/deployment contract and no compatible change is clear;
- the task cannot be completed correctly within the requested scope.
