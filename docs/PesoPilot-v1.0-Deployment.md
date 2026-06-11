# Deployment

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md
* 04-frontend-architecture.md
* 05-backend-architecture.md

---

# Purpose

This document defines how PesoPilot should be deployed during MVP development and production.

---

# Deployment Philosophy

Frontend:

```txt
Primary Application
```

Backend:

```txt
Supporting Service
```

The application should continue functioning even if backend AI services are unavailable.

---

# Environments

Supported:

```txt
Local
Development
Production
```

---

# Local Development

Frontend:

```bash
npm install
npm run dev
```

Expected:

```txt
http://localhost:5173
```

---

Backend:

```bash
mvn spring-boot:run
```

Expected:

```txt
http://localhost:8080
```

---

# Frontend Deployment

Platform:

```txt
Vercel
```

Responsibilities:

```txt
React Application
Static Assets
```

---

# Backend Deployment

Platform:

```txt
Render
```

Responsibilities:

```txt
AI Services
Forecast Services
Summary Services
Categorization Services
```

---

# Environment Variables

Frontend:

```txt
VITE_API_BASE_URL
```

---

Backend:

```txt
FRONTEND_ORIGIN

AI_PROVIDER

OPENAI_API_KEY
GEMINI_API_KEY
CLAUDE_API_KEY

OLLAMA_URL

SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
```

Only configure variables that are actively used.

---

# CORS

Backend must allow:

```txt
Frontend Origin
```

Example:

```txt
https://pesopilot.vercel.app
```

---

# Health Endpoint

Required:

```txt
GET /api/health
```

Used by:

```txt
Frontend
Render
Monitoring
```

Response:

```json
{
  "success": true,
  "message": "UP"
}
```

---

# Build Requirements

Frontend Build:

```bash
npm run build
```

Must complete without warnings or errors.

---

Backend Build:

```bash
mvn clean package
```

Must complete successfully.

---

# Production Checklist

Frontend:

```txt
✓ Build succeeds
✓ Environment variables configured
✓ Routing works
✓ Error states tested
✓ Dashboard loads
```

Backend:

```txt
✓ Build succeeds
✓ Health endpoint works
✓ Validation works
✓ Exception handling works
✓ AI services tested
```

---

# Monitoring

Track:

```txt
Availability
Response Time
Error Rate
```

Do not track:

```txt
Financial Records
Expense History
Income History
Savings History
```

---

# Backup Strategy

MVP:

```txt
Manual Export
Future Phase
```

Not implemented during MVP.

---

# MVP Deployment Success

Deployment is considered successful when:

```txt
Frontend available on Vercel

Backend available on Render

Health endpoint operational

Dashboard operational

AI features functional

Offline mode functional
```
