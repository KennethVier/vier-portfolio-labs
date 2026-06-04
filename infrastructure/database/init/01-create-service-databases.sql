-- PostgreSQL local development bootstrap for the portfolio microservices platform.
-- This script runs only when the postgres Docker volume is first initialized.

CREATE DATABASE auth_db;
CREATE DATABASE todo_db;
CREATE DATABASE notification_db;
CREATE DATABASE portfolio_db;
CREATE DATABASE yomira_document_db;
CREATE DATABASE employee_db;
CREATE DATABASE shop_db;
CREATE DATABASE running_coach_db;

-- yomira_quiz_db is intentionally omitted for now because the quiz service
-- currently has no confirmed persistence requirement.

