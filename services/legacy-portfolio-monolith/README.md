# Legacy Portfolio Monolith

This service is archived legacy code from the original portfolio backend. It is no longer part of the active microservices runtime.

## Current Status

- Not included in `infrastructure/docker-compose.yml`.
- Still configured for MySQL in `src/main/resources/application.properties`.
- Retained as a migration/reference source for old employee, shop/items, Todo, auth, and Thymeleaf portfolio code.

## Replacement Services

| Legacy Responsibility | Active Replacement |
| --- | --- |
| Todo tasks | `services/todo-service` |
| Todo reminders/email | `services/notification-service` |
| Platform auth | `services/auth-service` |
| Portfolio frontend | `apps/main-portfolio` |

## Remaining Decisions

Employee management and shop/items are not active in the new platform yet. They should either be extracted into standalone PostgreSQL-backed services or archived permanently.

See `docs/legacy-monolith-audit.md` for the Phase 9 audit.