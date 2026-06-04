# Legacy Monolith Audit

Phase 9 marks `services/legacy-portfolio-monolith/` as archived legacy code, not part of the active microservices runtime.

## Decision

The active portfolio platform now runs through the API Gateway and extracted services. The legacy monolith should stay available as a reference while any remaining domains are either extracted into independent services or intentionally archived.

## Active Runtime Status

| Area | Active Owner | Legacy Status |
| --- | --- | --- |
| Todo tasks | `services/todo-service` | Extracted from monolith |
| Todo notifications | `services/notification-service` | Extracted from monolith |
| Platform auth | `services/auth-service` | Legacy auth/users replaced for platform use |
| Yomira documents | `services/yomira-document-service` | Separate service |
| Yomira quizzes | `services/yomira-quiz-service` | Separate service |
| Main portfolio UI | `apps/main-portfolio` | Thymeleaf pages retired from active runtime |
| Employee management | none active | Replaced by new `employee-service` PeopleOps prototype |
| Shop/items | `services/shop-service` | Extracted; legacy code is reference only |

## Legacy Code Inventory

| Domain | Evidence | Phase 9 Action |
| --- | --- | --- |
| Todo | `TaskController`, `TaskService`, `Task`, `UserTask` | Superseded by `services/todo-service`; keep only as migration reference |
| Notifications | `TaskScheduler`, `EmailService` files | Superseded by `services/notification-service`; keep only as behavior reference |
| Auth/users/roles | `AuthController`, `UserController`, `User`, `Role`, `SecurityConfig` | Superseded by `services/auth-service` for platform identity |
| Employee management | `EmployeeController`, employee service/repository/model | Not active; decide extract or archive later |
| Shop/items | `ShopController`, item service/repository/model | Superseded by `services/shop-service`; keep only as migration reference |
| Portfolio pages | Thymeleaf templates and static assets | Retired in favor of `apps/main-portfolio` |

## Active Dependency Check

The Phase 9 scan found no active app route that must call `services/legacy-portfolio-monolith`. The old Todo login button was changed from the monolith `/portfolio` page to an environment-driven portfolio URL.

```text
VITE_PORTFOLIO_URL=http://localhost:5173
```

The active Docker Compose runtime does not include the legacy monolith or MySQL.

## Do Not Delete Yet

Do not delete the legacy folder until these decisions are made:

- Employee management is now represented by the standalone `employee-service` PeopleOps prototype.
- Shop/items has become standalone `shop-service`; migrate old MySQL data only if needed.
- Is any old MySQL data worth migrating into PostgreSQL?
- Are any images/assets in the legacy static portfolio still needed by `apps/main-portfolio`?

## Retirement Criteria

The monolith can be removed or moved to a separate archive only after:

- Employee domain is explicitly extracted or abandoned.
- Any useful static assets are copied into the active frontend.
- No frontend, gateway route, Docker service, or documentation describes it as active.
- MySQL is no longer needed for local development or data recovery.