# Notification Service

PostgreSQL-backed email notification service extracted in Phase 6.

## Local Port

```text
8085
```

## Behavior

The scheduler preserves the legacy Todo notification behavior:

- Send a reminder when an open task is due in 1 day.
- Send a reminder when an open task is due in 1 hour.
- Send a deadline-passed email when an open task reaches its deadline.

The service calls `todo-service` over HTTP and stores notification logs in `notification_db`.

Email sending is disabled by default for privacy. Set `NOTIFICATION_EMAIL_ENABLED=true` and provide SMTP environment variables to send real email.

## API

```text
POST /api/notifications/check-deadlines
GET  /api/notifications/logs
GET  /actuator/health
```
