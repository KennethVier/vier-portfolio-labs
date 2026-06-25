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
Phase 5  ✅
Phase 6  ✅
Phase 7  ⬜
Phase 8  ⬜
Phase 9  ⬜
Phase 10 ✅
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

Status: ✅

Goal:

Implement salary-based budgeting.

---

## Features

[x] Create cutoff

[x] Edit cutoff

[x] Delete cutoff

[x] Detect active cutoff

[x] Assign expenses to cutoff

[] Assign income to cutoff

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
Corrected salary cutoff semantics from manual/payroll-style date periods to salary-funded spending cycles.
Semi-monthly and Monthly now generate start/end dates from payday rules.
Semi-monthly supports user-defined Payday 1 and Payday 2.
Monthly supports one user-defined payday.
Custom remains manual.
Weekly and Irregular are removed from new cutoff creation and cannot be re-saved after edit.
```

---

## Blockers

```txt
None for the implemented Phase 3 salary cutoff setup scope.
```

---

## Warnings

```txt
Assign income to cutoff is now handled by Phase 3.5 Income Tracking. Assign savings to cutoff and cutoff summaries remain deferred to Savings/Cashflow/Dashboard phases.
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

Status: ✅

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

Status: 🟨

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

Status: ✅

Goal:

Savings management.

---

## Database

[x] Savings repository integration

[x] Salary cutoff integration

---

## UI

[x] SavingsPage

[x] SavingsForm

[x] SavingsList

[x] SavingsCard

[x] SavingsFilters

---

## Features

[x] Create savings

[x] Edit savings

[x] Delete savings

[x] View savings

[x] Search savings

[x] Filter savings

[x] Assign savings to cutoff

---

## Validation

[x] Amount validation

[x] Type validation

[x] Date validation

---

## Out of Scope

[ ] Dashboard integration

[ ] Savings goals

[ ] Investment tracking

---

## Testing

[x] Savings CRUD

[x] Validation tests

[x] Repository integration tests

[x] Search tests

[x] Filter tests

---

## Actions Taken

```txt
Implemented Phase 5 savings tracking in apps/pesopilot-web/src/features/savings.
Added savings form, filters, list, mobile cards, hook, service, constants, and Zod schema.
Integrated savings and salary cutoff repositories through savingsService only.
Kept Investment as a savings source/type label only, with no investment tracking or calculations.
```

---

## Blockers

```txt
None for the implemented Phase 5 savings tracking scope.
```

---

## Warnings

```txt
Dashboard, cashflow calculations, reports, charts, AI, forecasting, budget shock, savings goals, investment tracking, portfolio tracking, returns, asset classes, and investment calculations remain deferred or out of scope.
```

---

## Testing Status

```txt
npm run test passed.
npm run lint passed.
npm run build passed.
```

---

# Phase 6 — Cashflow Tracking

Status: ✅

Goal:

Track available cash.

---

## Calculations

[x] Available Cash

[ ] Daily Burn Rate

[ ] Safe Daily Spend

[x] Remaining Cash

[x] Total Income

[x] Total Expenses

[x] Total Savings

[x] Expense Rate

[x] Savings Rate

[x] Income Variance

---

## Testing

[x] Cashflow calculations

[x] Edge cases

[x] Current cutoff tests

[x] Data integrity tests

---

## Actions Taken

```txt
Implemented Phase 6 read-only cashflow engine in apps/pesopilot-web/src/features/cashflow.
Added cashflow model, constants, service, hook, and development verification page.
Calculated actual income from income records and did not persist cashflow snapshots.
Reused cutoffService.findCurrentCutoff for active/date-range cutoff detection.
```

---

## Blockers

```txt
None for the implemented Phase 6 read-only cashflow engine scope.
```

---

## Warnings

```txt
Daily Burn Rate and Safe Daily Spend remain unchecked because they belong to forecasting/cashflow projection, not this read-only current-state engine.
Dashboard, charts, reports, AI, forecasting, budget shock, backend APIs, new stores, new repositories, and persisted cashflow snapshots remain out of scope.
```

---

## Testing Status

```txt
npm run test passed.
npm run lint passed.
npm run build passed.
```

---

# UI/UX Modernization Phase

Status: ✅

Purpose:

Align all existing pages with the approved Stitch Dashboard design language before Dashboard implementation.

---

# Phase 7 — Reports and Graphs

Status: ✅

Goal:

Visual reporting and historical financial analysis.

---

## Reports

[x] Category Breakdown

[x] Expense Trend

[x] Income vs Expense

[x] Savings Trend

[x] Cashflow Trend

[x] Cutoff Comparison

---

## Charts

[x] Recharts integration

[x] Responsive charts

[x] Empty states

[x] Loading states

[x] Tooltip formatting

[x] PHP currency formatting

---

## Testing

[x] Report calculation tests

[x] Chart data transformation tests

[x] Empty state tests

---

# Phase 8 — Expense Review Inbox

Status: ✅

Goal:

Review detected expenses before they become official expenses.

---

## Features

[x] Inbox page

[x] View detected expense

[x] Review expense

[x] Approve expense

[x] Reject expense

[x] Edit before approval

[x] Convert approved item into expense record

---

## Testing

[x] Approval flow

[x] Rejection flow

[x] Edit before approval flow

[x] Approved expense persistence test

# Phase 8.5 — MVP Stabilization and Manual QA

Status: ✅

Goal:

Validate all completed MVP flows before AI, forecasting, and advanced automation phases.

This phase focuses on stability, correctness, usability, and data integrity.

---

## Pages

### Core Modules

[x] Dashboard

[x] Expenses

[x] Income

[x] Savings

[x] Salary Cutoff

[x] Cashflow

[x] Reports

[x] Expense Inbox

[x] Settings

---

## Manual Testing

### CRUD

[x] Create flow

[x] Edit flow

[x] Delete flow

### Search & Filters

[x] Search

[x] Filters

[x] Filter reset

[x] Combined filters

### States

[x] Empty states

[x] Error states

[x] Loading states

### Layout & Responsiveness

[x] Mobile responsiveness

[x] Tablet responsiveness

[x] Desktop responsiveness

[x] Table overflow handling

[x] Sidebar navigation

[x] Header search behavior

### UI Components

[x] Modal behavior

[x] Popover behavior

[x] KPI cards

[x] Charts

[x] Tables

[x] Forms

---

## Critical Flows

### Expenses

[x] Create expense

[x] Edit expense

[x] Delete expense

[x] Create expense with cutoff

### Income

[x] Create income

[x] Edit income

[x] Delete income

[x] Create income with cutoff

### Savings

[x] Create savings

[x] Edit savings

[x] Delete savings

[x] Create savings with cutoff

### Salary Cutoff

[x] Create monthly cutoff

[x] Create semi-monthly cutoff

[x] Create custom cutoff

[x] Edit cutoff

[x] Delete cutoff

[x] Current cutoff detection

[x] Generated cycle correctness

### Cashflow

[x] Cashflow reflects expenses

[x] Cashflow reflects income

[x] Cashflow reflects savings

[x] Cashflow reflects cutoffs

### Dashboard

[x] Dashboard reflects expenses

[x] Dashboard reflects income

[x] Dashboard reflects savings

[x] Dashboard reflects cashflow

### Reports

[x] Reports reflect expenses

[x] Reports reflect income

[x] Reports reflect savings

[x] Reports reflect cutoff data

### Expense Inbox

[x] Approve creates expense

[x] Reject does not create expense

[x] Edit before approval

[x] Approved record cannot be approved twice

[x] Preview panel accuracy

---

## Data Integrity

[x] No duplicate expense after inbox approval

[x] Approved inbox item cannot be approved twice

[x] Rejected inbox item does not affect expenses

[x] Deleted cutoff fallback displays safely

[x] Legacy cutoff types do not crash

[x] Monthly generated dates are correct

[x] Semi-monthly generated dates are correct

[x] Dashboard totals match raw records

[x] Report totals match raw records

[x] Cashflow totals match raw records

---

## Browser & Storage Testing

[x] IndexedDB persistence after refresh

[x] Hard refresh keeps data

[x] Browser close and reopen keeps data

[x] Clear IndexedDB shows proper empty states

[x] App works with no seed data

[x] App works with realistic multi-month data

---

## Dev QA Tools

[x] Development-only Dev Tools route

[x] Development-only sidebar item

[x] Basic QA dataset seeding

[x] Large multi-month QA dataset seeding

[x] Expense Inbox QA item seeding

[x] QA_SEED-only clear behavior

[x] Dev QA seed utility tests

---

## UX Polish

[x] Buttons have clear labels

[x] Validation messages are readable

[x] Forms reset correctly after submit

[x] Modals close correctly

[x] Popovers position correctly

[x] Currency formatting is consistent

[x] Date formatting is consistent

[x] Charts render correctly with large datasets

[x] Charts render correctly with minimal datasets

[x] No visual overflow or clipping

---

## Verification

[x] npm.cmd run test

[x] npm.cmd run lint

[x] npm.cmd run build

---

## Known Issues Found

```txt
Manual Add Expense does not go to Expense Inbox by design; Expense Inbox is for detected/review records before they become official expenses.
Income, Expenses, and Savings KPI cards previously used filtered visible table records, which could be confused with Dashboard/Cashflow current-cutoff totals.
Salary Cutoff save errors appeared outside the modal, making overlap and validation failures easy to miss.
Salary Cutoff did not have a one-click next cutoff planning action for active monthly or semi-monthly cutoffs.
Small-screen layouts had no mobile sidebar navigation.
Salary Cutoff and Cashflow inherited a non-functional default header search.
Filter popovers were too large for small screens and felt more like panels than compact filter menus.
```

---

## Fixes Applied

```txt
Changed Expenses Total Expenses helper text to "Filtered View".
Aligned Income, Expenses, and Savings KPI cards to the salary-funded current cutoff cycle instead of filtered visible table records.
Added shared current-cutoff record filtering utility for KPI read models.
Added service-level current-cycle KPI summaries for Income, Expenses, and Savings using centralized cutoff detection.
Added inline Salary Cutoff modal save errors with clearer overlap guidance.
Added Create Next Cutoff action for active Monthly and Semi-monthly cutoffs using the selected cutoff endDate/payday fields, saved as Planned.
Added salary cutoff service tests for next monthly/semi-monthly cutoff generation, planned status, overlap rejection, and unsupported custom cutoff generation.
Removed duplicate page-level salary cutoff save error after modal close.
Aligned Expense Inbox filter trigger with the search input and converted it to a compact icon action.
Added mobile/tablet sidebar drawer navigation with overlay, close button, route-click close, and Escape close.
Changed header search to opt-in only so non-searchable pages do not show a misleading search bar.
Reduced shared filter popover width and converted Income, Savings, and Expense Inbox filters to compact responsive menus.
```

---

## Actions Taken

```txt
Added development-only /dev-tools page for local QA seed data.
Added basic and large QA dataset generation for salary cutoffs, expenses, income, savings, and expense inbox records.
Added QA_SEED marker-based clear behavior that preserves non-QA records.
Added tests for Dev QA seed utility generation and safe clearing.
Checked Expense Inbox service tests for approve/reject/edit/duplicate approval behavior.
Checked Dashboard service tests for current-cutoff calculations, recent transactions, spending overview, allocation matrix, and empty-state derivations.
Checked Cashflow service tests for current cutoff totals.
Checked Reports transform tests for expense/income/savings/cutoff report calculations.
Checked Salary Cutoff schema/service tests for cutoff creation, generation, active detection, assignment, and next cutoff generation.
Confirmed manual Add Expense remains an official expense flow and does not enter Expense Inbox by design.
Confirmed Income, Expenses, Savings, Dashboard, and Cashflow KPI surfaces are current-cutoff based.
Confirmed Income, Expense, and Savings tables remain historical/filterable ledger views.
Confirmed Dashboard reflects seeded current-cutoff data and manual expense changes in Remaining Cash.
Confirmed Cashflow values are working for current-cutoff records.
Confirmed Reports respond correctly with large seeded datasets.
Confirmed Salary Cutoff creation/generation works after moving validation errors into the modal.
Confirmed Savings flow is working.
Confirmed browser persistence after refresh and close/reopen.
Clarified that Phase 8.5 empty states cover no-record, no-current-cutoff, cleared IndexedDB, and no-seed data scenarios; kept those items unchecked until explicit manual verification.
Verified npm.cmd run test, npm.cmd run lint, and npm.cmd run build.
```
 
---

## Update Log

### 2026-06-20 — Cutoff-Centric KPI Alignment

```txt
Aligned PesoPilot KPI behavior with the salary-funded cutoff model.
Income, Expenses, and Savings KPI cards now use current-cutoff records only.
Search, filters, and table contents no longer affect KPI totals.
Records contribute to KPI calculations only when cutoffId exists and matches the current cutoff id.
Null cutoffId records, orphaned/deleted cutoff references, and historical cutoff records are excluded from KPI totals.
Added shared currentCutoffFilters utility and tests.
Added current-cycle KPI summary methods in incomeService, expenseService, and savingsService.
Kept current cutoff lookup centralized in service-level read models through cutoffService.findCurrentCutoff().
Preserved historical ledger behavior for Income, Expenses, and Savings tables.
Verified npm.cmd run test, npm.cmd run lint, and npm.cmd run build.
```

---

## Final QA Verdict

```txt
In progress. Confirmed core MVP flows, current-cutoff financial surfaces, reports with large seed data, expense inbox review behavior, Dev QA tools, browser persistence, and selected UX polish. Remaining unchecked items still need explicit manual confirmation before closing Phase 8.5.
```

---

# Phase 9 — Manual AI Expense Input

Status: Complete

Goal:

Natural language expense parsing into Expense Review Inbox.

Implementation Status:

```txt
Complete. Local deterministic parser, editable preview, Expense Inbox submission, route/sidebar entry, and tests are implemented.
```

---

## Parser Layer

[x] Expense parser interface

[x] Parser DTOs

[x] Parsing service

[x] Amount extraction

[x] Merchant extraction

[x] Date extraction

[x] Payment method/source extraction

[x] Category guess

[x] Confidence score

[x] Raw input preservation

---

## Frontend

[x] Parser input form

[x] Example prompts

[x] Parsed result preview

[x] Edit parsed result before submit

[x] Submit parsed result to Expense Inbox

---

## Inbox Integration

[x] Create detected expense record

[x] Mark source as `manual_ai_input`

[x] Preserve original raw text

[x] Route approved parsed record through existing Expense Inbox approval flow

---

## Testing

[x] Parse amount

[x] Parse merchant

[x] Parse exact dates

[x] Parse relative dates like today/yesterday

[x] Parse payment method/source

[x] Handle unknown or incomplete input

[x] Create inbox record from parsed result

[x] Approved parsed expense becomes official expense

---

## Actions Taken

```txt
Implemented manual natural language expense parsing with editable preview and Expense Inbox submission.
Parsed records do not create official expenses until approved through the existing inbox workflow.
Added /manual-ai-expense route and AI Expense Input sidebar entry.
Added deterministic local parser for amount, merchant, date, payment method, category guess, confidence, warnings, and raw text preservation.
Added detected-expense source/display label manual_ai_input without adding it as an official Expense source or payment method.
Added parser and inbox integration tests.
```

---

## Warnings

```txt
Phase 9 does not create official expenses directly.
Parsed expenses must go through Expense Inbox review before approval.
No AI summary, forecasting, budget shock engine, OCR, SMS parsing, or email parsing is part of this phase.
manual_ai_input is a detected-expense source/display label only.
```

---

# Phase 10 - Local Lifestyle Categorization

Status: Complete

Goal:

Automatically categorize expenses using merchant recognition and user-defined merchant rules.

---

## Merchant Rules

[x] Merchant rule model

[x] Create merchant rule

[x] Edit merchant rule

[x] Delete merchant rule

[x] Merchant rule management UI

---

## Rule Matching Engine

[x] Exact merchant matching

[x] Contains merchant matching

[x] Case-insensitive matching

[x] Trim/normalize merchant names

[x] Rule priority handling

[x] Fallback category behavior

---

## Auto Categorization

[x] Auto assign category from merchant rule

[x] Auto assign category during AI Expense Input

[x] Auto assign category during Expense Inbox review

[ ] Auto assign category during manual expense creation

[x] Display categorization source

---

## Default Philippine Merchant Library

Pre-seed common merchant mappings using existing category ids only.

### Dining

[x] Jollibee
[x] McDonalds
[x] KFC
[x] Chowking
[x] Mang Inasal
[x] Starbucks
[x] Coffee Bean
[x] Dunkin

### Groceries

[x] Puregold
[x] SM Supermarket
[x] Robinsons Supermarket
[x] Landmark
[x] WalterMart
[x] Dali
[x] S&R

### Transportation

[x] Grab
[x] JoyRide
[x] Angkas
[x] Move It
[x] Lalamove

### Bills

[x] Meralco
[x] Maynilad
[x] PLDT
[x] Globe
[x] Smart
[x] Converge
[x] Manila Water

### Shopping

[x] Shopee
[x] Lazada
[x] TikTok Shop
[x] SM Store
[x] Uniqlo
[x] Watsons

---

## User Learning Rules

[x] Remember user category corrections

Example:

Merchant:
Starbucks

User changes:
Food -> Shopping

Create or update rule:

Starbucks -> Shopping

Future entries automatically use the saved rule.

---

## Inbox Integration

[x] Suggested category appears in parsed preview

[x] Suggested category appears in Expense Inbox

[x] User may override category before approval

[x] Approved category correction updates merchant rule

---

## Settings Integration

[x] Merchant Rules advanced settings access

[ ] Lifestyle Mode awareness

Note:

```txt
Phase 10 seeds the Philippine merchant library locally. Runtime Lifestyle Mode branching remains deferred because Phase 10 should not add international rule behavior.
```

---

## Testing

[x] Rule accuracy

[x] Exact match

[x] Contains match

[x] Case-insensitive match

[x] User override handling

[x] Merchant learning behavior

[x] Unknown merchant handling

[x] Fallback category behavior

[x] Inbox categorization

[x] Manual AI expense categorization

[ ] Manual expense categorization

---

## Verification

[x] npm.cmd run test

[x] npm.cmd run lint

[x] npm.cmd run build

---

## Actions Taken

```txt
Implemented local merchant-rule categorization using the existing merchant_rules store.
Added merchant rule matcher with exact, contains, case-insensitive, normalized matching and priority tie-breaking.
Added Merchant Rules management page and /merchant-rules route.
Moved Merchant Rules access out of the main sidebar and into Settings as an advanced categorization area.
Added idempotent default Philippine merchant mappings using existing category ids only.
Integrated merchant rules into Manual AI Expense Input category suggestions and preview category source display.
Preserved categorySource and merchantRuleId as detected-expense metadata only.
Added Expense Inbox category source display and user correction learning through Remember this merchant category.
Kept official Expense records unchanged and did not add external AI, backend calls, new stores, or Dexie schema/index changes.
Deferred manual ExpenseForm merchant suggestions and runtime international Lifestyle Mode branching.
```

---

# Phase 10.5 — UX and Workflow Hardening

Status: ⬜

Goal:

Polish PesoPilot's user experience, strengthen cutoff-centric workflows, fix navigation gaps, and complete unfinished MVP interactions before Phase 11 Financial Insights.

---

# Group A — Core Workflow Fixes

Priority: Critical

These directly affect the cutoff-centric financial workflow.

## Cutoff Workflow

[x] Automatically assign current cutoff during CRUD operations when applicable

[x] Verify cashflow cycle switching behavior

[ ] Verify reports use cutoff-centric calculations

[x] Verify dashboard spending overview cutoff behavior

[ ] Enable cutoff selection where appropriate

[x] Automatically close ended cutoffs and activate the planned cutoff that covers today

[x] Show app-start guidance when no current cutoff exists

---

## Financial Guidance

[x] After creating a cutoff, guide users to create income records

[ ] Add cutoff-start reminder modal

Example:

```txt
New cutoff has started.

Have you recorded your income for this cycle yet?

[ Record Income ]
[ Later ]
```

[ ] Add allocation reminder for new cutoff periods

[x] Prepare cutoff workflow reminder service for no-income and no-savings current-cycle checks

Example:

```txt
Consider allocating part of your income to savings before spending.
```

---

# Group B — Navigation and Quick Actions

Priority: High

Reduce navigation friction.

## AI Expense Input Integration

[x] Remove AI Expense Input from sidebar

[x] Add AI Quick Add entry inside Expenses page

Example:

```txt
+ Add Expense ▼

• Manual Expense
• AI Quick Add
```

[x] Preserve existing AI Expense Input functionality

---

## Dashboard Quick Actions

[x] Add Quick Actions section

Actions:

```txt
+ Expense
✨ AI Quick Add
+ Income
+ Savings
```

[x] Add navigation shortcuts

---

## Missing Navigation Actions

[x] Cashflow View All

[x] Dashboard Recent Transactions View All

[x] Dashboard Allocation Matrix View All

Action note 2026-06-23:

Improved primary navigation by removing AI Expense Input from the sidebar, adding AI Quick Add access through the Expenses and Dashboard modal flows, adding Dashboard Quick Actions, and wiring View All navigation actions to existing report destinations.

Action note 2026-06-25:

Hardened cutoff-centric workflows by auto-selecting the current cutoff for new manual expense, income, and savings records, adding post-cutoff creation income guidance, preparing no-income/no-savings reminder detection with per-cutoff dismissal support, and replacing misleading Dashboard/Cashflow disabled selectors with static current-cycle context.

Action note 2026-06-25:

Added cutoff lifecycle synchronization using existing statuses: ended planned/active cutoffs are closed, a planned cutoff covering today is promoted to active, future active cutoffs are demoted to planned, and the app shows a startup guidance modal when no cutoff covers the current date.

---

# Group C — Reporting Improvements

Priority: High

Improve usability and data presentation.

## Reports

[x] Remove "Local IndexedDB" wording

[x] Add cutoff selector

[x] Allow report generation by cutoff

[x] Verify all graphs respond to selected cutoff

---

## Graph Enhancements

[x] Improve single-point graph rendering

Action note 2026-06-25:

Refined Reports by removing misleading local-storage copy, adding session-persistent report scope filtering for All Data / Current Cutoff / Specific Cutoff, preserving useful cutoff comparison context with highlighted rows, and improving single-point savings/cashflow line chart rendering.

Current issue:

```txt
One record
↓
Only a dot
```

Desired:

```txt
Line starts from zero
↓
Visible trend
```

[ ] Review savings trend graphs

[ ] Review cashflow trend graphs

---

# Group D — Savings Module Cleanup

Priority: Medium

## Savings

[ ] Fix New Savings Goal button

[ ] Remove placeholder savings content

[ ] Review KPI card icons

[ ] Verify savings calculations

---

# Group E — Usability Improvements

Priority: Medium

Improve discoverability.

## Tooltips

[ ] Add helper tooltips for action buttons

Examples:

```txt
View All
Export
Approve
Reject
```

---

## Page Guidance

[ ] Add contextual page helper text

Dashboard:

* explain cutoff overview

Expenses:

* explain current cutoff tracking

Reports:

* explain historical analysis

---

# Group F — Ledger Scalability

Priority: Medium

## Pagination

[ ] Add pagination for historical ledgers

Income

Expenses

Savings

Inbox history

---

# Group G — Notifications

Priority: Low

## Header

[ ] Implement notification center

[ ] Implement notification badge

[ ] Connect cutoff reminders

---

## Help System

[ ] Review Help icon behavior

[ ] Create Help Center page

Possible sections:

```txt
Getting Started

Cutoffs

Expenses

AI Quick Add

Reports

FAQ
```

---

# Group H — Product Decisions

Priority: Review

## Export Functionality

Decision Needed:

[ ] Keep only Settings Export/Import

OR

[ ] Add page-level CSV exports

Expenses

Income

Savings

---

## Profile Page

Decision Needed:

[ ] Defer Profile Page

Reason:

Settings already covers:

* Currency
* Theme
* Lifestyle Mode
* Preferences

No account/authentication exists yet.

---

# Verification

[x] npm.cmd run test

[x] npm.cmd run lint

[x] npm.cmd run build

[ ] Manual QA walkthrough

Dashboard

Expenses

Income

Savings

Salary Cutoff

Cashflow

Reports

Expense Inbox

Settings

---

## Actions Taken

```txt
Implemented Phase 10.5A Navigation and Quick Actions.
Removed AI Expense Input from primary sidebar navigation while preserving /manual-ai-expense.
Added AI Quick Add modal access inside the Expenses page using the existing Manual AI parser and inbox submission flow.
Added Dashboard Quick Actions for Expense, AI Quick Add modal access, Income, Savings, and Review Inbox.
Wired Dashboard and Cashflow View All actions to Reports.
Disabled deferred page-level CSV export placeholders on Expenses and Income.
No parser, approval workflow, repository, schema, cashflow, reports, cutoff, or settings import/export logic was changed.
Implemented Phase 10.5B Cutoff Workflow Hardening.
Added service-level current-cutoff defaults for new manual expenses, income, and savings while preserving explicit user-selected cutoff ids.
Added create-form current-cutoff preselection helper text for Expenses, Income, and Savings.
Added post-cutoff creation guidance that sends users to Income without forcing the action.
Prepared cutoff workflow reminder detection for missing income and missing savings, with localStorage dismissal keys per cutoff.
Removed misleading disabled Dashboard spending and Cashflow period selectors in favor of current-cycle labels.
Deferred the Header notification popover to Phase 10.5F to avoid broad layout/service coupling.
```

---

# Phase 11 — Financial Insights and AI Summary

Status: ⬜

Goal:

Generate meaningful financial insights from user data and eventually provide AI-generated financial summaries.

---

# Phase 11A — Rule-Based Financial Insights

Status: ⬜

Goal:

Generate accurate, deterministic, and testable financial insights using business rules.

---

## Insight Engine

[ ] Financial insight service

[ ] Insight generation engine

[ ] Insight prioritization

[ ] Insight severity levels

[ ] Insight DTOs

---

## Income Insights

[ ] Total income analysis

[ ] Income trend detection

[ ] Income growth/decline comparison

[ ] Income source breakdown

---

## Expense Insights

[ ] Top spending categories

[ ] Largest expense detection

[ ] Category trend comparison

[ ] Spending increase detection

[ ] Spending decrease detection

[ ] Spending distribution analysis

---

## Savings Insights

[ ] Savings rate calculation

[ ] Savings trend comparison

[ ] Savings growth detection

[ ] Savings contribution analysis

---

## Cashflow Insights

[ ] Remaining cash analysis

[ ] Cashflow stability analysis

[ ] Current cutoff spending pace

[ ] Current cutoff utilization analysis

---

## Cutoff Comparisons

[ ] Current vs Previous Cutoff

[ ] Current vs Monthly Average

[ ] Spending trend analysis

[ ] Savings trend analysis

[ ] Income trend analysis

---

## Financial Health

[ ] Financial health score

[ ] Financial health explanation

[ ] Health status levels

```txt
Excellent
Good
Fair
Needs Attention
```

---

## Rule-Based Summary Generation

Generate factual and explainable insights.

Examples:

```txt
You saved 22% of your income this cutoff.

Dining expenses increased by 15% compared to the previous cutoff.

Groceries remain your largest spending category.

You still have ₱4,500 remaining before your next payday.
```

[ ] Summary builder

[ ] Insight ranking

[ ] Insight grouping

[ ] Insight formatting

---

## Dashboard Integration

[ ] Dashboard Insight Card

[ ] AI Financial Coach uses generated insights

[ ] Current Cutoff Summary Card

---

## Insight Page

[ ] Insight page

[ ] Current cutoff insights

[ ] Monthly insights

[ ] Historical insights

[ ] Insight timeline

---

## Summary History

[ ] Save generated summaries

[ ] Cutoff summary history

[ ] Monthly summary history

---

## Testing

[ ] Income insight tests

[ ] Expense insight tests

[ ] Savings insight tests

[ ] Cashflow insight tests

[ ] Health score tests

[ ] Cutoff comparison tests

[ ] Summary generation tests

---

## Verification

[ ] npm.cmd run test

[ ] npm.cmd run lint

[ ] npm.cmd run build

---

# Phase 11B — AI Narrative Layer

Status: ⬜

Goal:

Convert rule-based insights into natural-language financial summaries.

---

## Backend

[ ] Spring Boot AI module

[ ] Summary API

[ ] Summary DTOs

[ ] Prompt templates

[ ] Ollama integration

---

## Narrative Generation

[ ] Current cutoff narrative

[ ] Monthly narrative

[ ] Financial health narrative

[ ] Savings narrative

[ ] Spending narrative

---

## AI Summary Types

[ ] Short summary

[ ] Detailed summary

[ ] Dashboard summary

[ ] Monthly review summary

---

## Fallback Behavior

[ ] Fallback to rule-based summary when AI unavailable

[ ] AI failure handling

[ ] Timeout handling

---

## Frontend

[ ] AI Summary Card

[ ] AI Summary Page Section

[ ] Regenerate Summary Action

[ ] Summary Loading State

---

## Testing

[ ] API tests

[ ] Prompt generation tests

[ ] AI fallback tests

[ ] Narrative rendering tests

---

## Verification

[ ] npm.cmd run test

[ ] npm.cmd run lint

[ ] npm.cmd run build

---

## Actions Taken

```txt
Pending.
```

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

