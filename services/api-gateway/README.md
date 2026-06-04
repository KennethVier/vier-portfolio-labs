# API Gateway

Spring Cloud Gateway service for the portfolio microservices platform.

## Local Port

```text
8080
```

## Current Phase 4 Routes

```text
/api/auth/**      -> auth-service http://localhost:8083/auth/**
/api/todos/**     -> todo-service http://localhost:8084/api/todos/**
/api/notifications/** -> notification-service http://localhost:8085/api/notifications/**
/api/documents/** -> yomira-document-service http://localhost:8081/api/document/**
/api/quizzes/**   -> yomira-quiz-service http://localhost:8082/api/quiz/**
```

Todo routes to the extracted todo-service from Phase 5.

## Environment Variables

```text
SERVER_PORT=8080
AUTH_SERVICE_URL=http://localhost:8083
TODO_SERVICE_URL=http://localhost:8084
DOCUMENT_SERVICE_URL=http://localhost:8081
QUIZ_SERVICE_URL=http://localhost:8082
NOTIFICATION_SERVICE_URL=http://localhost:8085
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*
```

## Health Check

```text
GET /actuator/health
```

## Route Info

```text
GET /api/gateway/routes
```




