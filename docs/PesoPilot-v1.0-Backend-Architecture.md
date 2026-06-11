# Backend Architecture

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md
* 01-product.md
* 02-roadmap.md
* 03-domain-and-database.md

---

# Purpose

This document defines the official backend architecture for PesoPilot v1.0.

The backend exists to support:

* AI Processing
* Expense Parsing
* Financial Insights
* Cashflow Forecasting
* Budget Shock Analysis
* Local Lifestyle Categorization
* Email Services (Future)
* OCR Services (Future)

The backend is NOT the source of truth for financial records.

Financial records remain stored locally in IndexedDB.

---

# Backend Philosophy

PesoPilot follows a:

```txt
Local First
Offline First
Frontend-Owned Data
Backend-Assisted Intelligence
```

architecture.

The backend should enhance the user experience but should never become a dependency for core financial tracking.

---

# Technology Stack

Language:

```txt
Java 21
```

Framework:

```txt
Spring Boot 4
```

Build Tool:

```txt
Maven
```

Architecture:

```txt
MVC
+
Service Layer
+
Strategy Pattern
+
Adapter Pattern
+
Repository Pattern
+
Chain of Responsibility
```

---

# Backend Responsibilities

Allowed:

```txt
AI Summaries
AI Forecasts
AI Categorization
Expense Parsing
Risk Analysis
Email Processing
OCR Processing
```

Not Allowed:

```txt
Primary Financial Storage
Expense Ownership
Income Ownership
Savings Ownership
```

Those belong to IndexedDB.

---

# Backend Package Structure

```txt
com.vier.pesopilot

├── config/
│
├── common/
│   ├── dto/
│   ├── exception/
│   ├── response/
│   └── util/
│
├── health/
│
├── ai/
│
├── categorization/
│
├── forecasting/
│
├── summary/
│
├── budgetshock/
│
├── expenseparser/
│
├── email/
│
├── receipt/
│
├── importexport/
│
└── security/
```

---

# Package Responsibilities

## config/

Application configuration.

Examples:

```txt
CorsConfig
JacksonConfig
AsyncConfig
```

---

## common/

Shared reusable infrastructure.

Examples:

```txt
ApiResponse
Exceptions
DTOs
Utilities
```

Nothing feature-specific should live here.

---

## health/

Health monitoring endpoints.

Examples:

```txt
HealthController
HealthService
```

Used by:

```txt
Frontend
Render
Monitoring Systems
```

---

## ai/

Shared AI infrastructure.

Examples:

```txt
AIClient
AIProvider
PromptBuilder
AIResponseParser
```

Responsible only for communicating with AI systems.

---

## categorization/

Local lifestyle categorization.

Examples:

```txt
CategorizationController
CategorizationService
MerchantRuleMatcher
```

---

## forecasting/

Cashflow forecasting.

Examples:

```txt
ForecastController
ForecastService
ForecastStrategy
```

---

## summary/

AI-generated summaries.

Examples:

```txt
SummaryController
SummaryService
SummaryPromptBuilder
```

---

## budgetshock/

Budget shock analysis.

Examples:

```txt
BudgetShockController
BudgetShockService
RiskCalculator
```

---

## expenseparser/

Manual AI expense parsing.

Examples:

```txt
ExpenseParserController
ExpenseParserService
ParsingChain
```

---

## email/

Future email reminder system.

Excluded from MVP implementation.

Package may exist but remain unused.

---

## receipt/

Future OCR and receipt verification.

Excluded from MVP implementation.

---

## importexport/

Future backup and restore support.

Excluded from MVP implementation.

---

## security/

Security configuration.

Examples:

```txt
SecurityConfig
RateLimitConfig
```

---

# Architectural Flow

Backend requests must follow:

```txt
Controller
↓
Service
↓
Strategy / Adapter / Chain
↓
Provider
↓
DTO
```

Controllers should never directly call providers.

---

# Controller Layer

Purpose:

Receive HTTP requests.

Responsibilities:

* Input validation
* DTO mapping
* Service invocation
* Response creation

Controllers must not:

* Execute business logic
* Perform calculations
* Build AI prompts
* Call providers directly

---

# Service Layer

Purpose:

Business logic.

Responsibilities:

* Workflows
* Validation orchestration
* Risk calculations
* Summary orchestration
* Forecast orchestration

Examples:

```txt
ForecastService
SummaryService
ExpenseParserService
BudgetShockService
```

Rules:

* Services may call strategies.
* Services may call adapters.
* Services may call providers.
* Services must remain testable.

---

# DTO Layer

All communication must use DTOs.

Never expose internal objects.

Examples:

```txt
ForecastRequest
ForecastResponse

SummaryRequest
SummaryResponse

ExpenseParseRequest
ExpenseParseResponse
```

Benefits:

```txt
Stable Contracts
Versioning
Validation
Security
```

---

# Response Standard

All endpoints must return:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Using:

```txt
ApiResponse<T>
```

Example:

```java
public record ApiResponse<T>(
    boolean success,
    String message,
    T data
) {}
```

---

# Exception Handling

Global exception handling is mandatory.

Required exceptions:

```txt
ValidationException
BusinessException
ForecastException
AIException
UnexpectedException
```

All exceptions must be converted into:

```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

---

# Validation

Use:

```txt
Jakarta Validation
```

Examples:

```java
@NotNull
@NotBlank
@Positive
```

Validation must occur at DTO level.

---

# Repository Pattern

MVP backend may not require database repositories.

However the architecture should remain repository-ready.

Future examples:

```txt
PromptRepository
MerchantRuleRepository
ForecastHistoryRepository
```

Current MVP should avoid unnecessary persistence.

---

# Strategy Pattern

Required for:

## Forecasting

```txt
BasicForecastStrategy
AdvancedForecastStrategy
```

---

## Categorization

```txt
RuleBasedCategorizationStrategy
AIBasedCategorizationStrategy
```

---

## AI Providers

```txt
OpenAIStrategy
GeminiStrategy
ClaudeStrategy
LocalAIStrategy
```

Benefits:

```txt
Provider Agnostic
Easy Swapping
Easy Testing
```

---

# Adapter Pattern

Required for external systems.

Examples:

```txt
OpenAIAdapter
GeminiAdapter
ClaudeAdapter
OllamaAdapter
```

Purpose:

Normalize external provider differences.

---

# Chain of Responsibility

Required for expense parsing.

Flow:

```txt
Raw Input
↓
Amount Detection
↓
Merchant Detection
↓
Category Detection
↓
Confidence Scoring
↓
Response
```

Example:

Input:

```txt
Jollibee 250 lunch
```

Output:

```json
{
  "merchant":"Jollibee",
  "amount":250,
  "category":"Food",
  "confidence":0.95
}
```

---

# AI Provider Layer

Purpose:

Communicate with:

```txt
OpenAI
Gemini
Claude
Ollama
```

Rules:

* Providers must not be called directly.
* Providers must be accessed through adapters and services.

---

# API Modules

Approved MVP APIs:

## Health API

```txt
GET /api/health
```

---

## Expense Parsing API

```txt
POST /api/expense-parser
```

---

## Categorization API

```txt
POST /api/categorization
```

---

## Summary API

```txt
POST /api/summary
```

---

## Forecast API

```txt
POST /api/forecast
```

---

## Budget Shock API

```txt
POST /api/budget-shock
```

No additional APIs should be added without updating the source of truth.

---

# Security Rules

Backend must:

* Validate all inputs
* Sanitize AI prompts
* Rate-limit AI endpoints
* Use environment variables
* Never expose secrets

Backend must not:

* Log financial details
* Log raw expense histories
* Log savings data
* Log AI payloads containing sensitive information

---

# Configuration

Environment variables:

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

Only load variables that are actually used.

---

# Testing Requirements

Critical test areas:

```txt
ForecastService
BudgetShockService
ExpenseParserService
CategorizationService
SummaryService
```

Target:

```txt
90%+ Business Logic Coverage
```

Controllers require integration testing.

---

# MVP Boundaries

The backend must remain lightweight.

The following are intentionally excluded from MVP:

```txt
Authentication
Authorization
Accounts
Cloud Financial Storage
User Profiles
Payments
Bank Integrations
```

These belong to future versions.

---

# Phase 0 Backend Deliverables

Required:

* Spring Boot Application
* Package Structure
* Health Endpoint
* Global Exception Handler
* ApiResponse Wrapper
* Validation Setup
* CORS Configuration

Not Required:

* AI Integration
* Email Services
* OCR Services

Those begin in later phases.

---

# Approval Rule

This document is approved only if it remains aligned with:

* 00-source-of-truth.md
* 03-domain-and-database.md

Any backend implementation that conflicts with those documents must be corrected.
