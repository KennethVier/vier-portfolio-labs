# Database Map

This document records current database usage and the PostgreSQL-first target state.

## Database Standard Decision

PostgreSQL is the only target database for the microservices platform.

Rules:

- New services use PostgreSQL.
- Extracted domains from the legacy monolith migrate to PostgreSQL.
- MySQL is deprecated and may only remain temporarily as a migration source.
- Services do not share tables directly.
- Cross-service access should happen through APIs, not database joins.

## Current Database Usage

| Project | Current Database Configuration | Status |
| --- | --- | --- |
| `services/legacy-portfolio-monolith/` | MySQL: `jdbc:mysql://localhost:3306/springreactconnection` | Archived legacy source; not active runtime |
| `services/todo-service/` | PostgreSQL: `todo_db` through `TODO_DB_URL` | Active Todo database owner |
| `services/notification-service/` | PostgreSQL: `notification_db` through `NOTIFICATION_DB_URL` | Active notification log owner |
| `services/auth-service/` | PostgreSQL: `auth_db` through `AUTH_DB_URL` | Active platform auth database owner |
| `services/shop-service/` | PostgreSQL: `shop_db` through `SHOP_DB_URL` | Active ecommerce catalog database owner |
| `services/running-coach-service/` | PostgreSQL: `running_coach_db` through `RUNNING_DB_URL` | Active StrideMate runner profile, plan, workout log, and insight owner |
| `services/employee-service/` | PostgreSQL: `employee_db` through `EMPLOYEE_DB_URL` | Active PeopleOps database owner |
| `services/yomira-document-service/` | PostgreSQL: `yomira_document_db` through `PG*` env vars | Active document database owner |
| `services/yomira-quiz-service/` | No database found in current config | No DB needed yet |
| `apps/todo-web/` | Frontend only; uses gateway API | No direct DB |
| `apps/main-portfolio/` | Frontend only/static project data | No direct DB |
| `apps/yomira-web/` | Frontend only | No direct DB |
| `apps/auth-web/` | Frontend only | No direct DB |
| `apps/peopleops-web/` | Frontend only | No direct DB |

## Target PostgreSQL Databases

| Future Service | Target Database | Notes |
| --- | --- | --- |
| `auth-service` | `auth_db` | Users, credentials, roles, OAuth user records |
| `todo-service` | `todo_db` | Tasks, task-user ownership, task status/dates |
| `notification-service` | `notification_db` | Notification preferences, delivery logs, retry state |
| `portfolio-service` | `portfolio_db` | Optional dynamic portfolio/project/contact data |
| `yomira-document-service` | `yomira_document_db` | Document metadata, extracted text, upload records |
| `yomira-quiz-service` | none initially, optional `yomira_quiz_db` later | Quiz persistence only if needed |
| `employee-service` | `employee_db` | PeopleOps employee, department, onboarding, leave, and activity data |
| `shop-service` | `shop_db` | Product catalog for ecommerce prototype |
| `running-coach-service` | `running_coach_db` | Runner profiles, training plans, sessions, workout logs, coach insights |

## MySQL Retirement Path

1. Keep `services/legacy-portfolio-monolith/` MySQL only if old data must be inspected or migrated.
2. Todo has been extracted into `todo-service` with PostgreSQL.
3. Migrate old Todo data from MySQL only if there is production data worth preserving.
4. Auth is replaced by `auth-service`; shop/items is replaced by `shop-service`; employee management is replaced by `employee-service` as the PeopleOps prototype.
5. Remove MySQL datasource configuration from active services.
6. Delete or move the old monolith only after employee/shop decisions and any asset/data migration are complete.








