# Vier Portfolio Labs

A full-stack portfolio monorepo for Kenneth Cerrado's branded project suite. This repository contains the public portfolio, polished frontend demos, Spring Boot microservices, shared local infrastructure, and documentation for running the system locally.

## Projects

| Project | Frontend | Backend | Description |
| --- | --- | --- | --- |
| Main Portfolio | `apps/main-portfolio` | - | Public portfolio showcase for the Vier project ecosystem. |
| Authly | `apps/auth-web` | `services/auth-service` | Authentication demo with email/password and OAuth-oriented flow. |
| TodoFlow | `apps/todo-web` | `services/todo-service`, `services/notification-service` | Backend-first todo dashboard with email reminder support. |
| Vier Shop | `apps/shop-web` | `services/shop-service` | Portfolio ecommerce prototype with catalog, cart, checkout, orders, and admin products. |
| PeopleOps | `apps/peopleops-web` | `services/employee-service` | Internal operations dashboard for employees, departments, onboarding, requests, teams, and audit activity. |
| Yomira | `apps/yomira-web` | `services/yomira-document-service`, `services/yomira-quiz-service` | Read-and-reflect learning app for PDF understanding and quiz generation. |
| StrideMate | `apps/stridemate-web` | `services/running-coach-service` | AI-powered running coach with profile onboarding, 4-week training plans, OCR-assisted workout logs, and coach insights. |

## Architecture

```text
apps/                  React/Vite frontends
services/              Spring Boot backend services
docs/                  service maps, API notes, database notes, migration docs
infrastructure/        local Docker, PostgreSQL init scripts, ignored env files
```

The system is designed as a microservices-style portfolio platform:

- Frontends are deployable independently, for example as separate Vercel projects.
- Backend services are deployable independently, for example on Railway, Render, Fly.io, or a VPS.
- `services/api-gateway` routes API traffic during local development.
- PostgreSQL is the shared local database engine, with separate databases per service.

## Local Development

Install dependencies per frontend app:

```powershell
npm --prefix apps/main-portfolio install
npm --prefix apps/shop-web install
npm --prefix apps/peopleops-web install
npm --prefix apps/stridemate-web install
```

Run a frontend:

```powershell
npm --prefix apps/main-portfolio run dev
```

Run a backend service with the Maven wrapper:

```powershell
services\auth-service\mvnw.cmd -f services\running-coach-service\pom.xml spring-boot:run
```

Run StrideMate tests:

```powershell
services\auth-service\mvnw.cmd -f services\running-coach-service\pom.xml test
npm --prefix apps\stridemate-web run test
npm --prefix apps\stridemate-web run lint
npm --prefix apps\stridemate-web run build
```

More detailed setup notes live in `docs/local-development.md`.

## Secrets And Environment Variables

Real secrets are intentionally not committed.

Ignored local env location:

```text
infrastructure/env/
```

Use local env files or deployment platform secrets for values like:

- database URLs and passwords
- JWT secrets
- SMTP credentials
- `OLLAMA_API_KEY`
- third-party API keys

Frontend apps should only receive public configuration, such as API base URLs. AI keys and backend credentials must stay in backend service environments.

## Deployment Notes

This repo can be used as a monorepo on Vercel. Create one Vercel project per frontend and set the root directory:

```text
apps/main-portfolio
apps/shop-web
apps/peopleops-web
apps/stridemate-web
apps/auth-web
apps/todo-web
apps/yomira-web
```

For Vite apps:

```text
Build command: npm run build
Output directory: dist
```

Backends should be deployed separately from the frontends and configured with their own environment variables.

## Branding

The project suite uses the Vier brand system: a personal, consistent visual identity across the portfolio and each application. Individual apps inherit the Vier mark language while keeping their own product personality, such as PeopleOps for calm operations, Yomira for reading/reflection, Vier Shop for ecommerce, and StrideMate for motion coaching.

## Status

This is a portfolio prototype platform, not a production SaaS system. The apps are built to demonstrate architecture, UI design, backend integration, workflow thinking, and practical full-stack engineering.
