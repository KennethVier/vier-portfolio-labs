# API Contracts

This document records the Phase 4 API Gateway contract for the portfolio microservices platform.

## Public Gateway Base URL

Local development gateway URL:

```text
http://localhost:8080
```

Frontend apps should eventually use:

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

## Phase 4 Routes

| Public Route | Gateway Target | Notes |
| --- | --- | --- |
| `/api/auth/**` | `auth-service` at `http://localhost:8083/auth/**` | Standardized in Phase 7 |
| `/api/auth/oauth2/**` | `auth-service` at `http://localhost:8083/oauth2/**` | Google OAuth route compatibility |
| `/api/todos` | `todo-service` at `http://localhost:8084/api/todos` | Extracted in Phase 5 |
| `/api/todos/**` | `todo-service` at `http://localhost:8084/api/todos/**` | Extracted in Phase 5 |
| `/api/notifications/**` | `notification-service` at `http://localhost:8085/api/notifications/**` | Extracted in Phase 6 |
| `/api/items/**` | `shop-service` at `http://localhost:8086/api/items/**` | Ecommerce catalog extracted from legacy monolith |
| `/api/orders/**` | `shop-service` at `http://localhost:8086/api/orders/**` | Ecommerce order persistence prototype |
| `/api/running/**` | `running-coach-service` at `http://localhost:8088/api/running/**` | StrideMate runner coaching, plan, log, and insight APIs |
| `/api/documents/**` | `yomira-document-service` at `http://localhost:8081/api/document/**` | Integrated in Phase 8 |
| `/api/quizzes/**` | `yomira-quiz-service` at `http://localhost:8082/api/quiz/**` | Integrated in Phase 8 |

## Gateway Health And Info

```text
GET /actuator/health
GET /api/gateway/routes
```

## Phase 5 Boundary

Todo now routes through `todo-service`. Notification extraction, auth standardization, and legacy monolith cleanup are still future phases.
## PeopleOps API

Gateway base URL:

```text
http://localhost:8080/api/peopleops
```

Direct service base URL:

```text
http://localhost:8087/api/peopleops
```

Core routes:

```text
GET  /dashboard
GET  /employees
GET  /employees/{id}
POST /employees
PUT  /employees/{id}
GET  /employees/{id}/onboarding
GET  /employees/{id}/activity
GET  /departments
POST /departments
PUT  /departments/{id}
GET  /onboarding
PUT  /onboarding/{id}
GET  /leave-requests
POST /leave-requests
PUT  /leave-requests/{id}/review
GET  /leave-requests/{id}/comments
POST /leave-requests/{id}/comments
GET  /activity
GET  /team
```

Frontend v1 uses a demo role switcher for visible actions. Backend role enforcement is intentionally deferred for future auth-service JWT integration.
Phase 19 additions:

```text
GET  /activity?entityType=&actorName=&keyword=&fromDate=&toDate=
GET  /team
GET  /leave-requests/{id}/comments
POST /leave-requests/{id}/comments
```

Leave request comment request:

```json
{
  "authorName": "PeopleOps Admin",
  "authorRole": "Admin",
  "message": "Please confirm coverage before approval."
}
```

CSV export is frontend-only in `apps/peopleops-web` for Employee Directory and Leave Requests. No backend export endpoint is used in v1.


## StrideMate Running Coach API

Base URL through gateway:

```text
http://localhost:8080/api/running
```

Core routes:

```text
POST /profiles
GET /profiles/by-email?email=
POST /plans/generate
GET /plans/current?email=
GET /dashboard?email=
GET /sessions/{id}
POST /sessions/{id}/logs
POST /coach/adjust-next-session?email=
GET /insights?email=
```

Workout logs may use `source` values `MANUAL` or `SCREENSHOT_OCR`. Screenshot OCR is frontend-only in v1; raw images are not sent to Ollama Cloud.
