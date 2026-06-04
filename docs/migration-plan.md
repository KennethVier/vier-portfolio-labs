# Migration Plan

This document defines the phased migration from the current project collection into a PostgreSQL-first microservices portfolio platform.

## Migration Principles

- Work by phase; do not refactor everything at once.
- PostgreSQL is the target database standard.
- MySQL remains only as a temporary source for the legacy `portfolio/` backend.
- Keep existing apps working while services are extracted.
- Do not delete legacy code until replacement services are verified.
- Use an API Gateway as the long-term frontend-facing backend entrypoint.

## Phase 1: Document And Freeze Current State

Status: complete.

Deliverables:

- `docs/service-map.md`
- `docs/database-map.md`
- `docs/migration-plan.md`

Acceptance criteria:

- Current frontend/backend connections are documented.
- Current database usage is documented.
- Target service ownership is documented.
- No runtime behavior changes are made.

## Phase 2: PostgreSQL Infrastructure Standard

Goal: create the local PostgreSQL foundation before extracting services.

Planned work:

- Add local PostgreSQL infrastructure under `infrastructure/`.
- Define `.env.example` files for service database connections.
- Create standard database names such as `auth_db`, `todo_db`, and `yomira_document_db`.
- Add local development documentation.

Acceptance criteria:

- PostgreSQL can run locally.
- New services have clear database connection patterns.
- MySQL is explicitly marked as legacy-only.

## Phase 3: Folder Architecture Reorganization

Status: complete.

Goal: organize the project into platform-level folders without changing behavior.

Target structure:

```text
PORTFOLIO_OVERALL/
  apps/
  services/
  infrastructure/
  docs/
```

Planned moves:

```text
Moved as planned into `apps/` and `services/`.
```

Acceptance criteria:

- Projects are organized by role.
- Apps and services still build/run from their new locations.
- Documentation reflects the new paths.

## Phase 4: API Gateway Foundation

Status: complete.

Goal: introduce one public API surface for frontend apps.

Target gateway routes:

```text
/api/auth/**          -> auth-service
/api/todos/**         -> todo-service
/api/documents/**     -> yomira-document-service
/api/quizzes/**       -> yomira-quiz-service
/api/notifications/** -> notification-service
```

Acceptance criteria:

- services/api-gateway exists.
- Gateway routes auth, Todo, documents, and quizzes to existing services.
- CORS is centralized in the gateway.
- Todo routes to the extracted todo-service.

## Phase 5: Todo Service Extraction To PostgreSQL

Status: complete.

Goal: extract the Todo domain from the legacy MySQL monolith.

Source:

```text
services/legacy-portfolio-monolith/
```

Target:

```text
services/todo-service/
```

Planned work:

- Created `services/todo-service` with the Todo controller/service/repository/model/DTO/mapper logic.
- Configured `todo-service` for PostgreSQL `todo_db`.
- Standardized route to `/api/todos`.
- Updated `todo-web` to call gateway `/api/todos`.
- Data migration from MySQL remains optional and separate if old production data is needed.

Acceptance criteria:

- Todo app works through `todo-service` and PostgreSQL.
- Todo no longer depends on MySQL.
- Task behavior remains intact.

## Phase 6: Notification Service Extraction

Status: complete.

Goal: separate reminder/email responsibility from Todo task ownership.

Target:

```text
services/notification-service/
```

Acceptance criteria:

- services/notification-service owns scheduling, email sending, and notification logs.
- services/todo-service owns task data.
- Notification service reads task state through `todo-service` HTTP APIs, not direct table sharing.

## Phase 7: Auth Standardization

Status: complete.

Goal: make `Authentication-Service` the official platform auth service.

Planned work:

- Standardized PostgreSQL config around `AUTH_DB_URL`.
- Updated auth-web to use gateway `/api/auth/**`.
- Kept JWT and Google OAuth support.
- Made CORS and OAuth success redirect env-driven.
- Duplicate auth/user logic in the legacy monolith remains for a later cleanup phase.

Acceptance criteria:

- Register/login are configured through gateway `/api/auth/**`.
- `auth-service` is the long-term platform identity service.
- Todo still uses email-only registration until a later auth migration decision.

## Phase 8: Yomira Gateway Integration

Status: complete.

Goal: keep Yomira service boundaries while standardizing platform routing.

Planned work:

- Routed documents through `/api/documents/**`.
- Routed quizzes through `/api/quizzes/**`.
- Replaced hardcoded Railway URLs with env-driven gateway URL.

Acceptance criteria:

- Yomira frontend builds with gateway-backed API clients.
- Local and deployed endpoints are environment-driven.

## Phase 9: Legacy Monolith Reduction

Status: complete.

Goal: eliminate active dependency on the old `portfolio/` monolith and MySQL.

Completed work:

- Audited the legacy monolith and documented remaining domains in `docs/legacy-monolith-audit.md`.
- Marked the legacy monolith as archive/reference code.
- Retired active navigation to old Thymeleaf portfolio pages.
- Confirmed MySQL is not part of the active Docker Compose runtime.
- Left employee management and shop/items for an explicit extract/archive decision.

Acceptance criteria:

- No active app depends on the legacy monolith.
- No active service depends on MySQL.
- Legacy folder remains for reference until employee/shop and asset/data decisions are complete.

## Phase 10: Portfolio-Ready Polish

Goal: make the architecture understandable and impressive as a portfolio system.

Planned work:

- Add architecture diagrams.
- Add service READMEs.
- Add local development docs.
- Add deployment notes.
- Update main portfolio project links.

Acceptance criteria:

- The platform can be explained clearly to reviewers or recruiters.
- Local setup and service ownership are documented.

## Shop Ecommerce Prototype

Status: complete.

Completed work:

- Modernized `apps/shop-web` into a portfolio-ready ecommerce prototype.
- Added search, filters, sorting, product detail, improved cart, checkout confirmation, and admin product management.
- Extracted shop/items from the legacy monolith into `services/shop-service` using PostgreSQL `shop_db`.
- Routed `/api/items/**` through the API Gateway to `shop-service`.

## Shop Checkout And Inventory

Status: complete.

Completed work:

- Checkout now creates backend orders through `POST /api/orders`.
- `shop-service` validates stock and decrements product inventory when orders are created.
- Order confirmation reads the backend order response.
- Profile shows recent backend order history.

## Shop Admin Protection

Status: complete.

Completed work:

- Removed Admin from the public storefront navigation.
- Added `/admin` passcode gate for prototype admin access.
- Protected `/admin/products` behind the local admin gate.
- Improved admin product manager with image preview, product search/filter, lock admin action, and delete confirmation.
