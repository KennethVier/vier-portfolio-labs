# Local Development

This document describes the Phase 2 PostgreSQL local infrastructure standard.

## Phase 2 Scope

Phase 2 adds local database infrastructure only. It does not extract services, move folders, or change application runtime code.

Created infrastructure:

```text
infrastructure/
  docker-compose.yml
  env/
    postgres.env.example
    pgadmin.env.example
  database/
    init/
      01-create-service-databases.sql
```

## PostgreSQL Standard

PostgreSQL is the target database for all active microservices.

Local development uses one PostgreSQL container with multiple service-owned databases:

```text
auth_db
todo_db
notification_db
portfolio_db
yomira_document_db
employee_db
shop_db
```

The quiz service does not get a database yet because no persistence requirement has been confirmed.

## First-Time Setup

From the `PORTFOLIO_OVERALL/infrastructure` folder:

```bash
cp env/postgres.env.example env/postgres.env
cp env/pgadmin.env.example env/pgadmin.env
```

On Windows PowerShell:

```powershell
Copy-Item env/postgres.env.example env/postgres.env
Copy-Item env/pgadmin.env.example env/pgadmin.env
```

Then edit the copied `.env` files if you want different local credentials.

## Start PostgreSQL

From `PORTFOLIO_OVERALL/infrastructure`:

```bash
docker compose up -d postgres
```

Optional pgAdmin:

```bash
docker compose up -d pgadmin
```

pgAdmin local URL:

```text
http://localhost:5050
```

PostgreSQL local connection:

```text
Host: localhost
Port: 5432
User: portfolio_admin
Password: portfolio_admin_password
Default DB: portfolio_platform
```

Inside Docker network, services should use:

```text
Host: postgres
Port: 5432
```

## Service Database Targets

| Future Service | Database |
| --- | --- |
| auth-service | auth_db |
| todo-service | todo_db |
| notification-service | notification_db |
| portfolio-service | portfolio_db |
| yomira-document-service | yomira_document_db |
| employee-service | employee_db |
| shop-service | shop_db |

## Important Docker Volume Note

The init SQL script runs only when the PostgreSQL data volume is created for the first time.

If the volume already exists and you add/change databases later, run SQL manually or recreate the volume intentionally. Do not delete volumes casually if you already have data you care about.

## MySQL Status

MySQL is deprecated in the target architecture. It may stay temporarily only as a legacy source for the current `portfolio/` monolith until domains are migrated to PostgreSQL-backed services.

## API Gateway Local Setup

Phase 4 adds `services/api-gateway` as the public API entrypoint.

Gateway default port:

```text
8080
```

Todo now runs through `services/todo-service` on `8084`; the gateway owns public API port `8080`.

Gateway environment template:

```text
infrastructure/env/api-gateway.env.example
```

Gateway verification endpoints:

```text
GET http://localhost:8080/actuator/health
GET http://localhost:8080/api/gateway/routes
```

## Todo Service Local Setup

Phase 5 adds `services/todo-service` on port `8084`.

Environment template:

```text
infrastructure/env/todo-service.env.example
```

For direct local Java execution, use:

```text
TODO_DB_URL=jdbc:postgresql://localhost:5432/todo_db
```

For Docker Compose execution, use the Docker network host:

```text
TODO_DB_URL=jdbc:postgresql://postgres:5432/todo_db
```

Todo health check:

```text
GET http://localhost:8084/actuator/health
```

Gateway Todo route:

```text
http://localhost:8080/api/todos
```


## Notification Service Local Setup

Phase 6 adds `services/notification-service` on port `8085`.

Environment template:

```text
infrastructure/env/notification-service.env.example
```

Email sending is disabled by default:

```text
NOTIFICATION_EMAIL_ENABLED=false
```

Set it to `true` and provide SMTP variables when you are ready to send real email.

Notification endpoints:

```text
POST http://localhost:8085/api/notifications/check-deadlines
GET  http://localhost:8085/api/notifications/logs
GET  http://localhost:8085/actuator/health
```

Gateway route:

```text
http://localhost:8080/api/notifications
```

## Auth Service Local Setup

Phase 7 standardizes `services/auth-service` on port `8083` behind the API Gateway.

Environment template:

```text
infrastructure/env/auth-service.env.example
apps/auth-web/.env.example
```

Gateway route:

```text
http://localhost:8080/api/auth
```

Direct service route:

```text
http://localhost:8083/auth
```

OAuth uses environment-driven values for Google client credentials and frontend success redirect. Keep real secrets out of committed files.


## Yomira Local Setup

Phase 8 routes Yomira through the API Gateway.

Environment templates:

```text
apps/yomira-web/.env.example
infrastructure/env/yomira-document-service.env.example
infrastructure/env/yomira-quiz-service.env.example
```

Gateway routes:

```text
http://localhost:8080/api/documents
http://localhost:8080/api/quizzes
```

Direct service routes:

```text
http://localhost:8081/api/document
http://localhost:8082/api/quiz
```

Railway URLs should be deployment environment values, not hardcoded frontend source.

## Shop Service

Active local endpoint through the gateway:

```text
http://localhost:8080/api/items
```

Direct service endpoint:

```text
http://localhost:8086/api/items
```

The shop frontend is `apps/shop-web` and uses `VITE_API_BASE_URL=http://localhost:8080/api`.

Shop seed data:

`services/shop-service` automatically inserts a starter product catalog into `shop_db.items` only when the table is empty. Product image URLs point to `apps/shop-web/public/images` paths.

Shop order API:

```text
POST http://localhost:8086/api/orders
GET  http://localhost:8086/api/orders
GET  http://localhost:8086/api/orders/{id}
```

Gateway route support for `/api/orders/**` is active through `api-gateway` and points to `shop-service`.

Shop admin gate:

```text
http://localhost:5176/admin
```

Default prototype passcode:

```text
admin123
```

Override with `VITE_SHOP_ADMIN_PASSCODE` in `apps/shop-web/.env`. This is a local prototype gate, not production authentication.
## PeopleOps Service

Active local endpoint through the gateway:

```text
http://localhost:8080/api/peopleops
```

Direct service endpoint:

```text
http://localhost:8087/api/peopleops
```

Environment templates:

```text
apps/peopleops-web/.env.example
infrastructure/env/employee-service.env.example
```

Direct local Java execution:

```text
EMPLOYEE_DB_URL=jdbc:postgresql://localhost:5432/employee_db
```

Docker Compose execution:

```text
EMPLOYEE_DB_URL=jdbc:postgresql://postgres:5432/employee_db
```

PeopleOps seed data:

`services/employee-service` automatically seeds a realistic demo company when `employee_db` has no employees. Seed data includes departments, employees, onboarding tasks, leave requests, and activity log entries.

PeopleOps frontend:

```text
apps/peopleops-web
```

Frontend local default API:

```text
VITE_PEOPLEOPS_API_BASE_URL=http://localhost:8080/api/peopleops
```
PeopleOps Phase 19 prototype features:

```text
Team View: /team
Audit filters: /activity
Request comments: /requests
CSV export: Employee Directory and Leave Requests screens
```

Request comments are seeded automatically when `employee_db` is empty. If a prior local database exists with leave requests but no comments, `employee-service` backfills lightweight demo comments on startup.


## StrideMate Running Coach

Active local endpoint through the gateway:

```text
http://localhost:8080/api/running
```

Direct service endpoint:

```text
http://localhost:8088/api/running
```

Database:

```text
running_coach_db
```

Frontend app:

```text
apps/stridemate-web
```

Backend env example:

```text
infrastructure/env/running-coach-service.env.example
```

Frontend env example:

```text
apps/stridemate-web/.env.example
```

Set `OLLAMA_API_KEY` only in a local env file or deployment secret. If it is blank, the service uses deterministic fallback coaching so the prototype remains demoable.
