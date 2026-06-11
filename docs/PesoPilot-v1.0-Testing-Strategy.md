# Testing Strategy

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md
* 03-domain-and-database.md
* 04-frontend-architecture.md
* 05-backend-architecture.md

---

# Purpose

Testing exists to ensure that:

* Financial calculations are correct
* Data integrity is maintained
* User workflows remain stable
* Future features do not break existing functionality

Because PesoPilot manages financial information, correctness is more important than visual perfection.

---

# Testing Philosophy

Follow:

```txt
Test Business Logic First
```

Priority Order:

1. Business Rules
2. Repositories
3. Services
4. APIs
5. Components
6. Visual Behavior

---

# Testing Pyramid

```txt
            E2E
          /     \
    Integration
      /       \
   Unit Tests
```

Most tests should be unit tests.

---

# Frontend Testing

## Repository Tests

Required:

```txt
expenseRepository
incomeRepository
savingsRepository
salaryCutoffRepository
```

Verify:

* Create
* Update
* Delete
* Query
* Indexed searches

---

## Service Tests

Required:

```txt
cashflowService
budgetShockService
cutoffService
summaryPayloadService
```

Must verify calculations.

---

## Hook Tests

Required:

```txt
useExpenses
useDashboard
useCashflow
useCurrentCutoff
```

Verify:

* Loading states
* Error states
* Data refresh

---

## Component Tests

Focus on:

```txt
ExpenseForm
SavingsForm
DashboardCards
DataGrid
```

Verify:

* User interaction
* Validation
* Rendering

---

# Backend Testing

## Unit Tests

Highest priority.

Required:

```txt
ForecastService
BudgetShockService
ExpenseParserService
CategorizationService
SummaryService
```

---

## Integration Tests

Verify:

```txt
Controllers
Validation
DTO Mapping
ApiResponse
```

---

# Critical Business Rules

Must always have tests.

---

## Expense Creation

Verify:

```txt
Amount > 0
Category exists
Date valid
```

---

## Salary Cutoff Detection

Verify:

```txt
Current cutoff detection
Date boundary behavior
Custom cutoff support
```

---

## Cashflow Calculation

Formula:

```txt
Income
-
Expenses
-
Savings
=
Available Cash
```

Must be tested extensively.

---

## Budget Shock Calculation

Verify:

```txt
Green
Yellow
Orange
Red
```

trigger correctly.

---

## Forecast Calculations

Verify:

```txt
Daily Burn Rate
Safe Daily Spend
Projected Remaining
Projected Deficit
```

---

# Regression Testing

Required before:

```txt
Major Releases
Database Migrations
AI Changes
```

---

# Test Coverage Targets

Business Logic:

```txt
90%+
```

Repositories:

```txt
85%+
```

Controllers:

```txt
70%+
```

UI Components:

```txt
Selective
```

---

# MVP Success

The MVP is considered stable when:

* Critical business calculations pass
* Repository tests pass
* Dashboard calculations are verified
* Forecast calculations are verified
* Budget shock calculations are verified
