# Service Map

This document records the current `PORTFOLIO_OVERALL` structure after Phase 9 legacy monolith reduction.

## Current Platform Layout

```text
PORTFOLIO_OVERALL/
  apps/
    main-portfolio/
    todo-web/
    yomira-web/
    auth-web/
    shop-web/
    peopleops-web/
    stridemate-web/

  services/
    api-gateway/
    todo-service/
    notification-service/
    shop-service/
    employee-service/
    legacy-portfolio-monolith/
    auth-service/
    yomira-document-service/
    yomira-quiz-service/

  infrastructure/
  docs/
```

## Current Projects

| Current Path | Current Role | Runtime/Stack | Current Backend Connection | Future Status |
| --- | --- | --- | --- | --- |
| `apps/main-portfolio/` | Main public portfolio frontend | React, Vite, Tailwind | Static/project links only from current scan | Official portfolio shell |
| `apps/todo-web/` | Todo app frontend | React, Vite, React Bootstrap | Calls gateway `http://localhost:8080/api/todos` | Uses extracted `todo-service` |
| `apps/yomira-web/` | Yomira frontend | React, Vite | Calls gateway `/api/documents` and `/api/quizzes` | Standardized in Phase 8 |
| `apps/auth-web/` | Auth demo/frontend | React, Vite | Calls gateway `http://localhost:8080/api/auth` | Standardized in Phase 7 |
| `apps/shop-web/` | Ecommerce prototype frontend | React, Vite, React Bootstrap | Calls gateway `http://localhost:8080/api/items` | Modernized and connected to `shop-service` |
| `apps/peopleops-web/` | PeopleOps internal dashboard prototype | React, Vite | Calls gateway `http://localhost:8080/api/peopleops` | New portfolio-grade operations dashboard |
| `apps/stridemate-web/` | StrideMate AI running coach | React, Vite, browser OCR | Calls gateway `http://localhost:8080/api/running` | AI-assisted 4-week running plans and workout feedback |
| `services/api-gateway/` | Frontend-facing API gateway | Spring Boot, Spring Cloud Gateway | Routes `/api/**` to services | Routes Todo to extracted service |
| `services/todo-service/` | Todo backend | Spring Boot, PostgreSQL | Exposes `/api/todos/**`, port `8084` | Extracted in Phase 5 |
| `services/notification-service/` | Todo notification backend | Spring Boot, PostgreSQL, SMTP | Exposes `/api/notifications/**`, port `8085` | Extracted in Phase 6 |
| `services/shop-service/` | Ecommerce catalog backend | Spring Boot, PostgreSQL | Exposes `/api/items/**`, port `8086` | Extracted from legacy shop/items |
| `services/employee-service/` | PeopleOps backend | Spring Boot, PostgreSQL | Exposes `/api/peopleops/**`, port `8087` | New dashboard service replacing old CRUD concept |
| `services/running-coach-service/` | StrideMate backend | Spring Boot, PostgreSQL, Ollama Cloud | Exposes `/api/running/**`, port `8088` | Owns runner profiles, training plans, logs, and coach insights |
| `services/legacy-portfolio-monolith/` | Archived legacy monolith | Spring Boot, Thymeleaf, MySQL | No active gateway/runtime dependency | Reference only; employee/shop decisions remain |
| `services/auth-service/` | Platform auth backend | Spring Boot, JWT, Google OAuth, PostgreSQL | Exposes `/auth/**`, port `8083` behind gateway `/api/auth/**` | Standardized in Phase 7 |
| `services/yomira-document-service/` | Yomira document backend | Spring Boot, PostgreSQL | Exposes `/api/document/**`, gateway `/api/documents/**` | Integrated in Phase 8 |
| `services/yomira-quiz-service/` | Yomira AI quiz backend | Spring Boot, Ollama API | Exposes `/api/quiz/**`, gateway `/api/quizzes/**` | Integrated in Phase 8 |

## Confirmed Current Connections

### Todo Project

```text
apps/todo-web
  -> http://localhost:8080/api/todos through api-gateway
  -> services/todo-service/src/main/java/.../TaskController.java
```

Current Todo backend route:

```text
/api/todos
```

### Authentication Project

```text
apps/auth-web
  -> http://localhost:8080/api/auth through api-gateway
  -> services/auth-service
```

Future gateway route:

```text
/api/auth/**
```

### Yomira Project

```text
apps/yomira-web
  -> services/yomira-document-service
  -> services/yomira-quiz-service
```

Future gateway routes:

```text
/api/documents/**
/api/quizzes/**
```

## Legacy Monolith Domains

The `services/legacy-portfolio-monolith/` backend is now treated as archived reference code. It still contains domains that should not return to the active runtime as one service.

| Legacy Domain | Current Evidence | Future Service |
| --- | --- | --- |
| Notifications | scheduler/email service files and mail dependency | extracted to `notification-service` |
| Auth/users/roles | `AuthController`, `UserController`, `User`, `Role`, security config | replaced by `auth-service` for active platform auth |
| Employee management | `EmployeeController`, employee service/repository/model | replaced by `employee-service` PeopleOps prototype |
| Shop/items | `ShopController`, item service/repository/model | extracted to `shop-service`; legacy remains reference only |
| Old portfolio pages | Thymeleaf templates and static files | retire in favor of `apps/main-portfolio` |

## Phase Status

- Phase 1: complete.
- Phase 2: complete.
- Phase 3: complete.
- Phase 4: complete.
- Phase 5: complete.
- Phase 6: complete.
- Phase 7: complete.
- Phase 8: complete.
- Phase 9: complete.

The legacy monolith is retained as archive/reference code only. Shop/items now has an extracted service; employee management has been replaced by the new PeopleOps dashboard in `employee-service` and `apps/peopleops-web`.


