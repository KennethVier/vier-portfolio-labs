# PesoPilot v1.0

# Source of Truth

Version: 1.0

Status: Active

Document Type: Project Constitution

Authority Level: Highest

---

# Purpose

This document serves as the single source of truth for PesoPilot v1.0.

All future documents, architecture decisions, database schemas, implementations, features, UI designs, and AI systems must derive from this document.

If conflicts exist between documents:

1. This document wins.
2. design.md governs visual decisions.
3. Derived documents must be updated to align with this document.

---

# Product Vision

PesoPilot is a privacy-first AI-powered financial management platform designed to help users understand, manage, protect, and improve their financial health.

Unlike traditional expense trackers that only record transactions, PesoPilot acts as a financial co-pilot that provides visibility, forecasting, budgeting assistance, and financial insights while keeping users fully in control of their data.

---

# Product Identity

PesoPilot is built on five pillars:

### Privacy First

User financial data belongs to the user.

### Local First

Financial records are stored locally.

### Offline First

Core functionality must work without internet access.

### AI as Advisor

AI provides recommendations, observations, forecasts, and insights.

AI does not make financial decisions.

### User Control

No AI-generated action may permanently modify financial records without user approval.

---

# Product Positioning

PesoPilot is:

* A personal finance tracker
* A budgeting platform
* A cashflow forecasting tool
* A financial coaching assistant

PesoPilot is not:

* A banking application
* A payment processor
* A lending platform
* A trading platform

---

# Core Differentiators

The following features define PesoPilot and distinguish it from generic finance trackers.

### Salary Cutoff Mode

Budgeting revolves around real salary schedules.

Examples:

* 15th / 30th
* 10th / 25th
* Weekly
* Monthly
* Custom

---

### Budget Shock Warning

The system warns users before overspending occurs.

---

### Expense Review Inbox

AI-detected expenses must be reviewed before becoming official records.

---

### Local Lifestyle Categorization

The application understands local merchants and local spending habits.

Examples:

* Jollibee
* GCash
* Maya
* Meralco
* Maynilad
* Shopee
* Jeepney
* Tricycle
* Sari-sari Store

---

### Financial Coaching

The system helps users make better financial decisions.

---

# Technology Authority

Frontend:

* React
* Vite
* Tailwind CSS
* Dexie.js
* IndexedDB

Backend:

* Java 21
* Spring Boot 4
* Maven

Deployment:

* Vercel
* Render

---

# Storage Authority

The primary storage mechanism is:

```txt
IndexedDB
```

using:

```txt
Dexie.js
```

The backend is not the source of truth for financial records.

The backend exists to support:

* AI Processing
* Forecasting
* Categorization
* Email Services
* Future OCR Services

---

# Design Authority

The following file governs visual design:

```txt
design.md
```

The Stitch-generated design system is considered authoritative.

When UI implementation conflicts with design.md:

```txt
design.md wins
```

The Stitch-generated screens are the initial visual reference implementation.

---

# Architecture Authority

The application must follow:

### Frontend

Feature-Based Architecture

Flow:

```txt
Page
↓
Component
↓
Hook
↓
Service
↓
Repository
↓
Dexie / API
```

### Backend

MVC

Service Layer

Strategy Pattern

Adapter Pattern

Repository Pattern

Chain of Responsibility

Flow:

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

---

# Engineering Mandate

The codebase must prioritize:

* Maintainability
* Scalability
* Reliability
* Security
* Performance
* Readability
* Testability

The project must avoid:

* Spaghetti code
* Tight coupling
* Duplicated business logic
* Business logic inside UI components
* Business logic inside controllers
* Direct persistence access from components

---

# MVP Authority

The official MVP includes only:

### Phase 0

Project Setup

### Phase 1

IndexedDB Foundation

### Phase 2

Expense Tracking

### Phase 3

Salary Cutoff Mode

### Phase 4

Dashboard

### Phase 5

Savings Tracking

### Phase 6

Cashflow Tracking

### Phase 7

Reports and Graphs

### Phase 8

Expense Review Inbox

### Phase 9

Manual AI Expense Input

### Phase 10

Local Lifestyle Categorization

### Phase 11

Monthly / Cutoff AI Summary

### Phase 12

Cashflow Forecast

### Phase 13

Budget Shock Warning

---

# Out of Scope for MVP

The following are explicitly excluded from MVP:

### Goals

Phase 14+

### Goal Protection

Phase 15+

### Financial Health Score

Phase 16+

### Financial Coach

Phase 17+

### Emotion-Based Spending

Phase 18+

### AI Spending Personality

Phase 19+

### Payback Tracker

Phase 20+

### Email Reminder System

Phase 21+

### Proof Verification

Phase 22+

### AI Payback Verification

Phase 23+

### Backup & Export

Phase 24+

### Security Hardening

Phase 25+

---

# Database Authority

The MVP database must only contain entities required for phases 0–13.

Approved MVP entities:

* Category
* Income
* Expense
* Savings
* SalaryCutoff
* Budget
* ExpenseReview
* MerchantRule
* FinancialInsight
* CashflowSnapshot
* BudgetShockAlert
* UserSettings

No additional entities may be introduced without updating this document.

---

# AI Authority

AI is allowed to:

* Categorize
* Forecast
* Summarize
* Classify
* Recommend

AI is NOT allowed to:

* Spend money
* Modify records automatically
* Approve expenses automatically
* Mark payments as settled
* Delete user records

User approval is always required.

---

# Offline First Principle

The application must remain usable without backend services.

Core functionality must continue operating using IndexedDB.

If AI services become unavailable:

The application must degrade gracefully.

---

# Success Metrics

The MVP is considered successful if it achieves:

### Performance

Dashboard load time:

```txt
< 2 seconds
```

Expense entry:

```txt
< 10 seconds
```

### Scale

Supports:

```txt
10,000+ expenses
```

without noticeable degradation.

### AI

Categorization accuracy:

```txt
85%+
```

Budget shock prediction accuracy:

```txt
80%+
```

### Reliability

Core features remain usable offline.

---

# Governance

This document is the highest authority within the project.

All future documents must derive from it.

Future documentation may expand details but may not contradict this document.

Changes to this document require a version increment.

Current Version:

```txt
PesoPilot v1.0
```
