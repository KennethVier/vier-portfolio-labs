# PesoPilot v1.0 Development Tracker

Version: 1.0

Status: Active

Purpose:

Track implementation progress for PesoPilot MVP.

This document serves as the project's operational execution board.

Derived From:

* 00-source-of-truth.md
* 02-roadmap.md

---

## Roadmap Adjustment Notice

The original MVP roadmap did not include a dedicated Income Tracking phase and placed Dashboard immediately after Salary Cutoff Mode.

After completing Phase 0 through Phase 3, the implementation order was reviewed and adjusted to better align with the application's data dependencies and long-term architecture.

### Reason

The Dashboard depends on complete financial data.

While Expense Tracking and Salary Cutoff Mode are already implemented, Dashboard metrics would still be incomplete without:

* Income Tracking
* Savings Tracking
* Cashflow calculations

Building the Dashboard before these foundations would result in incomplete business logic, duplicated work, and future refactoring.

To maintain a clean architecture and reduce rework, additional foundation phases are introduced before Dashboard implementation.

### Updated Implementation Order

* Phase 3.5 — Income Tracking
* Phase 5 — Savings Tracking
* Phase 6 — Cashflow Engine
* Phase 4 — Dashboard

### Dependency Flow

Expense Tracking
↓
Salary Cutoff Mode
↓
Income Tracking
↓
Savings Tracking
↓
Cashflow Engine
↓
Dashboard

### Notes

* This adjustment does not expand MVP scope.
* This adjustment only changes implementation order.
* Dashboard remains part of the MVP.
* Dashboard implementation is intentionally delayed until sufficient financial data exists to support meaningful calculations and insights.
* Existing completed phases remain unchanged.
* Future roadmap phases may continue after Dashboard as originally planned.

---

# Overall MVP Progress

```txt
Phase 0  ⬜
Phase 1  ✅
Phase 2  ✅
Phase 3  🔄
Phase 3.5 🔄
Phase 4  ⬜
Phase 5  ⬜
Phase 6  ⬜
Phase 7  ⬜
Phase 8  ⬜
Phase 9  ⬜
Phase 10 ⬜
Phase 11 ⬜
Phase 12 ⬜
Phase 13 ⬜
```

Legend:

```txt
⬜ Not Started
🔄 In Progress
⏸ Blocked
✅ Complete
```

---

# Phase Template

Copy this structure for every phase.

```txt
Phase Status:

Start Date:
Target Date:
Actual Completion Date:

Current Focus:

Tasks:
[ ]
[ ]
[ ]

Actions Taken:

Blockers:

Warnings:

Technical Debt:

Testing Status:

Documentation Updated:

Phase Completion Notes:

Next Phase:
```

---

# Phase 0 — Project Setup

Status: ✅

Goal:

Establish the foundation of the application.

---

## Frontend Setup

### Project Initialization

[x] Create React Vite project

[x] Configure folder structure

[x] Configure aliases

[x] Configure environment variables

[x] Configure ESLint

[x] Configure Prettier

[x] Configure .editorconfig

---

### Tailwind Setup

[x] Install Tailwind

[x] Configure design tokens

[x] Map Stitch colors

[x] Map typography tokens

[x] Create global theme

[x] Configure responsive breakpoints

---

### Routing

[x] Install React Router

[x] Create router structure

[ ] Configure route guards (future-ready)

[x] Create AppLayout

---

### Core Components

[x] Button

[x] Input

[x] Card

[x] Badge

[x] Modal

[x] DataGrid

[x] LoadingState

[x] EmptyState

[x] ErrorState

---

### State Management

[x] Install Zustand

[x] Create UI store

[x] Create settings store

---

### Dexie Foundation

[x] Install Dexie

[x] Create schema.js

[x] Create dexie.js

[x] Create migrations.js

[x] Verify local persistence

---

## Backend Setup

### Spring Boot

[x] Create project

[x] Java 21

[x] Maven

[x] Package structure

---

### Infrastructure

[x] ApiResponse

[x] GlobalExceptionHandler

[x] Validation

[x] CORS

[x] Health endpoint

---

## Documentation

[x] Verify docs folder

[x] Create ADR workflow

[x] Initialize tracker

---

## Testing

[x] Frontend test setup

[x] Backend test setup

---

## Actions Taken

```txt
Created apps/pesopilot-web foundation scaffold.
Created services/pesopilot-service foundation scaffold.
Added Phase 0 routing placeholders, layout shell, theme tokens, Zustand scaffolds, Dexie schema, Axios health client, ApiResponse, global exception handling, CORS, validation dependency, and health endpoint.
```

---

## Blockers

```txt
None.
```

---

## Warnings

```txt
Route guards remain unchecked because authentication and authorization are outside MVP scope.
```

---

## Technical Debt

```txt
None recorded for Phase 0 scaffold.
```

---

## Testing Status

```txt
Frontend npm install completed.
Frontend npm run build passed.
Frontend npm run lint passed.
Backend mvn test passed.
Vite dev server verified at http://127.0.0.1:5173.
npm audit reported 5 dependency vulnerabilities from installed packages.
```

---

## Phase Completion Notes

```txt
Phase 0 foundation scaffold implemented only. No Phase 1 business persistence, CRUD, expenses, income, savings, reports, or AI behavior was started.
```

---

## Next Phase

```txt
Phase 1 - IndexedDB Foundation
```

---

# Phase 1 — IndexedDB Foundation

Status: ✅

Goal:

Implement local persistence layer.

---

## Database

[x] Implement all approved stores

[x] Verify schema

[x] Verify indexes

[x] Verify migrations

---

## Repositories

[x] categoryRepository

[x] incomeRepository

[x] expenseRepository

[x] savingsRepository

[x] salaryCutoffRepository

[x] budgetRepository

[x] detectedExpenseRepository

[x] merchantRuleRepository

[x] aiInsightRepository

[x] cashflowSnapshotRepository

[x] budgetShockAlertRepository

[x] settingsRepository

---

## Seed Data

[x] Default Categories

[x] Default Merchant Rules

[x] Default Settings

---

## Testing

[x] Repository CRUD tests

[x] Indexed query tests

[x] Migration tests

---

## Actions Taken

```txt
Implemented Dexie Phase 1 repository layer under src/lib/db/repositories.
Added idempotent seed data for default categories, merchant rules, and settings.
Added development-only database utilities in src/lib/db/devTools.js.
Kept migrations.js reserved for future schema migration helpers only.
```

---

## Blockers

```txt
None.
```

---

## Warnings

```txt
npm audit continues to report 5 dependency vulnerabilities from installed packages.
```

---

## Technical Debt

```txt
None recorded for Phase 1 foundation.
```

---

## Testing Status

```txt
npm run test passed.
npm run lint passed.
npm run build passed.
```

---

## Completion Notes

```txt
Phase 1 IndexedDB foundation is complete. No Phase 2 UI or expense tracking workflow was implemented.
```

---

# Phase 2 — Expense Tracking

Status: ✅

Goal:

Implement complete expense management.

---

## Database

[x] Expense repository integration

[x] Category integration

---

## UI

[x] ExpensesPage

[x] ExpenseForm

[x] ExpenseList

[x] ExpenseCard

[x] ExpenseFilters

---

## Features

[x] Create Expense

[x] Edit Expense

[x] Delete Expense

[x] View Expenses

[x] Search Expenses

[x] Filter Expenses

---

## Validation

[x] Amount validation

[x] Category validation

[x] Date validation

---

## Testing

[x] Expense CRUD tests

[x] Validation tests

[x] Repository tests

---

## Actions Taken

```txt
Implemented Phase 2 expense management in apps/pesopilot-web/src/features/expenses.
Added expense form, list, mobile cards, filters, hook, service, constants, and Zod schema.
Integrated expense and category repositories through expenseService only.
Added schema and service tests for validation, CRUD, category loading, filters, and invalid persistence prevention.
```

---

## Blockers

```txt
None.
```

---

## Completion Notes

```txt
Phase 2 Expense Tracking is complete, including deferred Search Expenses. No Phase 3 salary cutoff setup, dashboard logic, reports, savings, income, AI, or backend work was started.
```

---

# Phase 3 — Salary Cutoff Mode

Status: 🔄

Goal:

Implement salary-based budgeting.

---

## Features

[x] Create cutoff

[x] Edit cutoff

[x] Delete cutoff

[x] Detect active cutoff

[x] Assign expenses to cutoff

[ ] Assign income to cutoff

[ ] Assign savings to cutoff

---

## Calculations

[x] Current cutoff detection

[x] Date overlap prevention

[ ] Cutoff summaries

---

## Testing

[x] Active cutoff tests

[x] Edge case date tests

[x] Overlap tests

---

## Actions Taken

```txt
Implemented Phase 3 salary cutoff setup in apps/pesopilot-web/src/features/salary-cutoff.
Added cutoff form, list, mobile cards, status badge, hook, service, constants, and Zod schema.
Integrated salary cutoff and expense repositories through cutoffService only.
Added manual assignment of unlinked expenses to a selected cutoff by date range.
```

---

## Blockers

```txt
None for the implemented Phase 3 salary cutoff setup scope.
```

---

## Warnings

```txt
Assign income to cutoff, assign savings to cutoff, and cutoff summaries remain unchecked because income, savings, dashboard, and calculation workflows are outside the approved Phase 3 implementation plan.
```

---

## Testing Status

```txt
npm run test passed.
npm run lint passed.
npm run build passed.
```

---

# Phase 3.5 — Income Tracking

Status: 🔄

Goal:

Implement complete income management and establish the second half of the financial equation before Dashboard implementation.

Reason:

Although the original roadmap places Dashboard as Phase 4, implementation experience showed that Dashboard calculations would be incomplete without Income Tracking.

Phase 3.5 is therefore introduced as a dependency phase before Dashboard.

---

## Database

[x] Income repository integration

[x] Salary cutoff integration

---

## UI

[x] IncomePage

[x] IncomeForm

[x] IncomeList

[x] IncomeCard

[x] IncomeFilters

---

## Features

[x] Create Income

[x] Edit Income

[x] Delete Income

[x] View Income

[x] Search Income

[x] Filter Income

[x] Assign Income to Cutoff

---

## Validation

[x] Amount validation

[x] Source validation

[x] Date validation

---

## Testing

[x] Income CRUD tests

[x] Validation tests

[x] Repository integration tests

[x] Search tests

[x] Filter tests

---

## Actions Taken

```txt
Implemented Phase 3.5 income tracking in apps/pesopilot-web/src/features/income.
Added income form, filters, list, mobile cards, hook, service, constants, and Zod schema.
Integrated income and salary cutoff repositories through incomeService only.
Added /income route and Income sidebar navigation entry.
```

---

## Blockers

```txt
None for the implemented Phase 3.5 income tracking scope.
```

---

## Warnings

```txt
Dashboard, savings, cashflow, reports, AI, forecasting, and budget shock remain deferred.
```

---

## Testing Status

```txt
npm run test passed.
npm run lint passed.
npm run build passed.
```

---

# Phase 4 — Dashboard

Status: ⬜

Goal:

Financial visibility.

---

## Dashboard Cards

[ ] Income

[ ] Expenses

[ ] Savings

[ ] Remaining Cash

[ ] Budget Status

---

## Dashboard Sections

[ ] Current Cutoff

[ ] Insight Preview

[ ] Budget Shock Preview

---

## Testing

[ ] Dashboard calculations

[ ] Empty state tests

---

# Phase 5 — Savings Tracking

Status: ⬜

Goal:

Savings management.

---

## Features

[ ] Create savings

[ ] Edit savings

[ ] Delete savings

[ ] Savings history

[ ] Dashboard integration

---

## Testing

[ ] Savings CRUD

[ ] Savings calculations

---

# Phase 6 — Cashflow Tracking

Status: ⬜

Goal:

Track available cash.

---

## Calculations

[ ] Available Cash

[ ] Daily Burn Rate

[ ] Safe Daily Spend

[ ] Remaining Cash

---

## Testing

[ ] Cashflow calculations

[ ] Edge cases

---

# Phase 7 — Reports and Graphs

Status: ⬜

Goal:

Visual reporting.

---

## Reports

[ ] Category Breakdown

[ ] Expense Trend

[ ] Savings Trend

[ ] Cashflow Trend

---

## Charts

[ ] Recharts integration

[ ] Responsive charts

---

# Phase 8 — Expense Review Inbox

Status: ⬜

Goal:

Review detected expenses.

---

## Features

[ ] Inbox page

[ ] Review expense

[ ] Approve expense

[ ] Reject expense

[ ] Edit before approval

---

## Testing

[ ] Approval flow

[ ] Rejection flow

---

# Phase 9 — Manual AI Expense Input

Status: ⬜

Goal:

Natural language expense parsing.

---

## Backend

[ ] ExpenseParser API

[ ] DTOs

[ ] Parsing service

---

## Frontend

[ ] Parser form

[ ] Result preview

[ ] Inbox integration

---

# Phase 10 — Local Lifestyle Categorization

Status: ⬜

Goal:

Merchant-based categorization.

---

## Features

[ ] Merchant rules

[ ] Rule matching

[ ] Auto categorization

---

## Testing

[ ] Rule accuracy

[ ] Unknown merchant handling

---

# Phase 11 — Monthly/Cutoff AI Summary

Status: ⬜

Goal:

Generate insights.

---

## Backend

[ ] Summary service

[ ] Summary API

---

## Frontend

[ ] Insight cards

[ ] Insight page

---

# Phase 12 — Cashflow Forecast

Status: ⬜

Goal:

Predict future cashflow.

---

## Features

[ ] Forecast engine

[ ] Forecast UI

[ ] Forecast explanation

---

## Testing

[ ] Forecast accuracy

[ ] Edge cases

---

# Phase 13 — Budget Shock Warning

Status: ⬜

Goal:

Prevent overspending.

---

## Features

[ ] Risk engine

[ ] Risk scoring

[ ] Alerts

[ ] Recommendations

---

## Risk Levels

[ ] Green

[ ] Yellow

[ ] Orange

[ ] Red

---

## Testing

[ ] Threshold tests

[ ] Alert generation

---

# MVP Release Checklist

Before MVP Release:

[ ] All phases complete

[ ] Documentation updated

[ ] No critical bugs

[ ] Dashboard < 2 seconds

[ ] Cashflow verified

[ ] Forecast verified

[ ] Budget shock verified

[ ] Offline mode verified

[ ] Build passes

[ ] Deployment verified

---

## Future Enhancement — Recurring Salary Profiles

Status: ⬜ Future

Description:

Users should eventually be able to define a reusable salary profile instead of manually creating every salary cutoff period.

Users define:

- Salary Mode
- Pay Schedule
- Payday

Expected behavior:

- PesoPilot automatically generates future cutoff periods.
- Expenses can be assigned to generated cutoff periods.
- Users can still manually adjust generated cutoffs when needed.

Reason:

The current MVP supports manual salary cutoff periods. This future enhancement improves long-term usability by reducing repetitive monthly setup.

Not part of MVP v1:

- Do not implement during Phase 3.
- Do not add new database tables yet.
- Do not modify current salary cutoff behavior yet.

---

# MVP Retrospective

Lessons Learned:

```txt
```

What Went Well:

```txt
```

What Needs Improvement:

```txt
```

Next Major Version:

```txt
PesoPilot v1.1
```
