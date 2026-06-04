# Todo Service

PostgreSQL-backed Todo microservice extracted from the legacy portfolio monolith in Phase 5.

## Local Port

```text
8084
```

## API

```text
GET    /api/todos/tasks?email={email}
GET    /api/todos/{idTask}
POST   /api/todos/register?email={email}
POST   /api/todos
PUT    /api/todos/{idTask}
PUT    /api/todos/tasks/batch-update
DELETE /api/todos/{idTask}
```

## Environment Variables

```text
SERVER_PORT=8084
TODO_DB_URL=jdbc:postgresql://localhost:5432/todo_db
TODO_DB_USER=portfolio_admin
TODO_DB_PASSWORD=portfolio_admin_password
TODO_JPA_DDL_AUTO=update
```
