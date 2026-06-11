# Coding Standards

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md
* 04-frontend-architecture.md
* 05-backend-architecture.md

---

# Purpose

This document defines coding standards for PesoPilot.

Goals:

* Consistency
* Maintainability
* Readability
* Testability
* Scalability

All contributors and AI coding agents must follow these standards.

---

# Engineering Principles

The project follows:

```txt
SOLID
DRY
KISS
YAGNI
```

---

# General Rules

Code should be:

```txt
Readable
Predictable
Testable
Maintainable
```

Prefer:

```txt
Simple Code
```

over

```txt
Clever Code
```

---

# Naming Conventions

Names should reveal intent.

Good:

```txt
calculateAvailableCash
findCurrentCutoff
generateMonthlySummary
```

Bad:

```txt
calc()
process()
run()
```

---

# File Naming

Frontend:

```txt
ExpenseForm.jsx
ExpenseList.jsx
useExpenses.js
expenseRepository.js
```

Backend:

```txt
ExpenseParserService.java
ForecastController.java
BudgetShockStrategy.java
```

---

# Function Rules

Functions should:

```txt
Do One Thing
```

Prefer:

```js
calculateAvailableCash()
```

over:

```js
processFinancialData()
```

that does many unrelated tasks.

---

# Frontend Rules

Components must:

* Render UI
* Receive props
* Trigger actions

Components must not:

* Query Dexie
* Call APIs
* Perform financial calculations

---

# Hook Rules

Hooks may:

* Manage state
* Load data
* Call services

Hooks should not:

* Duplicate service logic

---

# Service Rules

Services own business logic.

Examples:

```txt
cashflowService
budgetShockService
cutoffService
```

Financial calculations belong here.

---

# Repository Rules

Repositories own persistence.

Repositories may:

* Query Dexie
* Save data
* Delete data

Repositories may not:

* Format UI
* Calculate metrics
* Generate summaries

---

# State Management Rules

Use Zustand only for:

```txt
UI State
Filters
Selections
Preferences
```

Do not store financial records exclusively in Zustand.

Financial records belong in IndexedDB.

---

# Backend Rules

Controllers:

```txt
Validate
Call Service
Return Response
```

Controllers must not contain business logic.

---

# DTO Rules

All API communication must use DTOs.

Never expose internal models directly.

---

# Exception Rules

Never swallow exceptions.

Handle errors intentionally.

Every exception should:

```txt
Be Logged
Be Traceable
Be Actionable
```

---

# Logging Rules

Log:

```txt
Execution Time
Failures
Warnings
```

Do Not Log:

```txt
Expense Notes
Income Notes
Financial Histories
Sensitive Data
```

---

# Testing Rules

New business logic requires tests.

Critical calculations require tests before merge.

---

# Comment Rules

Write comments for:

* Why something exists
* Non-obvious business rules

Avoid comments that explain obvious code.

Bad:

```js
// increment i
i++;
```

Good:

```js
// Prevent cutoff overlap when creating schedules
```

---

# Refactoring Rules

Refactor when:

* Duplication appears
* Complexity increases
* Responsibilities blur

Do not prematurely abstract.

---

# AI Coding Agent Rules

AI-generated code must:

* Follow architecture
* Follow naming conventions
* Follow repository pattern
* Follow design system

AI-generated code must never bypass architecture layers.

---

# Success Criteria

A new developer should understand a feature within minutes.

Code should be easy to modify without fear of breaking unrelated areas.
