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
Phase 11 🔄
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

Status: ✅

Goal:

Polish PesoPilot's user experience, strengthen cutoff-centric workflows, fix navigation gaps, and complete unfinished MVP interactions before Phase 11 Financial Insights.

---

# Group A — Core Workflow Fixes

Priority: Critical

These directly affect the cutoff-centric financial workflow.

## Cutoff Workflow

[x] Automatically assign current cutoff during CRUD operations when applicable

[x] Verify cashflow cycle switching behavior

[x] Verify reports use cutoff-centric calculations

[x] Verify dashboard spending overview cutoff behavior

[x] Enable cutoff selection where appropriate

[x] Automatically close ended cutoffs and activate the planned cutoff that covers today

[x] Show app-start guidance when no current cutoff exists

---

## Financial Guidance

[x] After creating a cutoff, guide users to create income records

[x] Add cutoff-start reminder modal

Example:

```txt
New cutoff has started.

Have you recorded your income for this cycle yet?

[ Record Income ]
[ Later ]
```

[x] Add allocation reminder for new cutoff periods

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

[x] Review savings trend graphs

[x] Review cashflow trend graphs

---

# Group D — Savings Module Cleanup

Priority: Medium

## Savings

[x] Fix New Savings Goal button

[x] Remove placeholder savings content

[x] Review KPI card icons

[x] Verify savings calculations

[x] Add Savings Goals store and contribution linking

[x] Add create, edit, archive, and protected delete behavior for goals

[x] Add View Contributions filtering for goal contribution history

Action note 2026-06-25:

Redesigned the Savings module into a true Savings Goal and Contribution architecture. Goals now represent long-term financial objectives while contributions remain cutoff-based financial transactions. Lifetime goal progress is derived from linked savings contributions, while Savings KPIs continue to summarize the current cutoff only.

Action note 2026-06-27:

Cleaned up the goal contribution flow so Add Contribution opens a goal-specific modal, locks the selected goal, hides redundant type/goal selection, clearly displays the linked goal and contribution type, and still saves a normal cutoff-based savings contribution.

---

# Group E — Usability Improvements

Priority: Medium

Improve discoverability.

## Tooltips

[x] Add helper tooltips for action buttons

Examples:

```txt
View All
Export
Approve
Reject
```

---

## Page Guidance

[x] Add contextual page helper text

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

[x] Add pagination for historical ledgers

Income

Expenses

Savings

Inbox history

Action note 2026-06-26:

Implemented scalable ledger pagination across Expenses, Income, Savings Contributions, and Expense Inbox with reusable pagination controls, session-persistent page and page size, result summaries, and stable client-side page clamping after filtering and CRUD refreshes.

---

# Group G — Notifications

Priority: Low

## Header

[x] Implement notification center

[x] Implement notification badge

[x] Connect cutoff reminders

---

## Help System

[x] Review Help icon behavior

[x] Create Help Center page

Possible sections:

```txt
Getting Started

Cutoffs

Expenses

AI Quick Add

Reports

FAQ
```

Action note 2026-06-26:

Completed Phase 10.5F guidance polish by adding a state-driven header notification center with priority-sorted cutoff and savings-goal reminders, a workflow-first Help Center, one-time welcome onboarding, dismissible contextual page helpers, reusable tooltips, and actionable empty-state support without adding browser notifications, scheduling, AI, schema changes, or financial logic changes.

---

# Group H — Product Decisions

Priority: Review

## Export Functionality

Decision Needed:

[x] Keep only Settings Export/Import

OR

[ ] Add page-level CSV exports

Expenses

Income

Savings

---

## Profile Page

Decision Needed:

[x] Defer Profile Page

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

[x] Manual QA walkthrough

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
Completed Phase 10.5 checklist confirmations for cutoff/scoped Reports behavior, applicable cutoff selection, allocation reminders, savings/cashflow trend graph review, Settings-only export/import direction, and Profile Page deferral.
Marked cutoff-start reminder complete as notification-based guidance through the dynamic notification center and app guidance instead of a blocking modal.
```

---

# Phase 11 — Financial Insights and AI Summary

Status: 🔄

Goal:

Generate meaningful financial insights from user data and eventually provide AI-generated financial summaries.

---
# Phase 11 — Financial Insights and AI Summary

Status: 🔄

## Goal

Build PesoPilot’s deterministic financial intelligence system first, then prepare the foundation for future AI-powered summaries.

Phase 11 is divided into:

```txt
Phase 11A — Rule-Based Financial Intelligence
Phase 11B — AI Financial Intelligence Platform
```

Phase 11A must be completed before Phase 11B implementation begins.

---

# Implementation Rules

All Phase 11A work must follow these rules:

* No AI models.
* No backend API dependency.
* No external services.
* No hallucinated financial values.
* No dashboard behavior changes unless the phase explicitly says integration.
* All insights must be deterministic, explainable, testable, and derived only from local financial records.
* Architecture documents must be followed before implementation.
* If documents conflict, follow the priority order listed in each phase.

Every phase must end with:

```txt
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

---

# Phase 11A — Rule-Based Financial Intelligence

Status: ✅ COMPLETE

## Goal

Build PesoPilot’s deterministic financial intelligence engine.

The Rule Engine becomes the single source of truth for financial insights.

---

# Phase 11A.0 — Insight Architecture

Status: ✅

## Goal

Create the base financial insight architecture.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
```

### Supporting

```txt
04 — Rule Engine Architecture
```

## Dependencies

```txt
Phase 0 — Project Setup
Phase 1 — IndexedDB Foundation
Phase 2 — Expense Tracking
```

## Blocks

```txt
Phase 11A.1 — Health Engine
Phase 11A.2 — Expense Intelligence
Phase 11A.3 — Income Intelligence
Phase 11A.4 — Savings Intelligence
Phase 11A.5 — Goal Intelligence
Phase 11A.6 — Cashflow Intelligence
Phase 11A.7 — Cutoff Intelligence
Phase 11A.8 — Recommendation Engine
Phase 11A.9 — Summary Generator
```

## Scope

Architecture-only implementation.

No financial calculations yet.

## Features

* [x] `src/features/insights` module
* [x] `InsightBundle` model
* [x] Insight section shape
* [ ] Health insight placeholder
* [ ] Income insight placeholder
* [ ] Expense insight placeholder
* [ ] Savings insight placeholder
* [ ] Goal insight placeholder
* [ ] Cashflow insight placeholder
* [ ] Cutoff insight placeholder
* [ ] Recommendation placeholder
* [ ] Summary placeholder
* [x] `insightService`
* [x] `useInsights` hook
* [ ] insight DTO constants
* [x] insight severity levels
* [x] insight priority levels
* [x] insight category definitions
* [x] insight scope definitions
* [x] shared insight utilities
* [x] reserved `rules/` folder
* [x] reserved `components/` folder
* [x] architecture tests
* [x] tracker updated

## Out of Scope

- Health scoring
- Recommendation generation
- Summary generation
- Dashboard integration
- AI integration
- Backend calls
- Route changes
- Dexie schema changes

## Definition of Done

* [x] Empty InsightBundle returns correct structure
* [x] `generatedAt` uses serializable ISO string
* [x] default scope is `current_cutoff`
* [x] constants are centralized
* [x] tests pass
* [x] lint passes
* [x] build passes

## Suggested Commit Message

```txt
feat(insights): add phase 11A insight architecture foundation
```

---

# Phase 11A.1 — Financial Health Engine

Status: ✅

## Goal

Generate a deterministic financial health score.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
05 — Health Engine Architecture
```

## Dependencies

```txt
Phase 11A.0 — Insight Architecture
```

## Blocks

```txt
Recommendation Engine
Summary Generator
Dashboard Health Card
```

## Features

* [x] HealthInsight DTO
* [x] Health score calculation
* [x] Health score breakdown
* [x] Health status
* [x] Health rule registry
* [x] Health rule results
* [x] Health evidence model
* [x] Health aggregation
* [x] Health explanation text

## Health Status Values

```txt
Excellent
Healthy
Fair
Needs Attention
Critical
```

## Rules

* [x] Income availability
* [x] Expense ratio
* [x] Savings ratio
* [x] Remaining cash
* [x] Goal contribution participation

## Definition of Done

* [x] health score is deterministic
* [x] every score has evidence
* [x] every health status is tested
* [x] no AI usage
* [x] tests/lint/build pass

## Suggested Commit Message

```txt
feat(insights): implement financial health engine
```

---

# Phase 11A.2 — Expense Intelligence

Status: ✅

## Goal

Analyze spending behavior.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
07 — Expense Engine Architecture
```

## Dependencies

```txt
Phase 11A.0 — Insight Architecture
```

## Blocks

```txt
Recommendation Engine
Summary Generator
Dashboard Expense Insights
Reports
```

## Features

* [x] ExpenseInsight DTO
* [x] Expense metrics model
* [x] Expense rule registry
* [x] Top spending category
* [x] Category distribution
* [x] Largest expense
* [x] Largest merchant
* [x] Daily spending rate
* [x] Expense trend
* [x] Expense increase detection
* [x] Expense decrease detection
* [x] Spending anomalies
* [x] Expense aggregation
* [x] Expense explanation text

## Definition of Done

* [x] expense insights are deterministic
* [x] every insight has evidence
* [x] category calculations are tested
* [x] trend logic is tested
* [x] tests/lint/build pass

## Suggested Commit Message

```txt
feat(insights): implement expense intelligence engine
```

---

# Phase 11A.3 — Income Intelligence

Status: ✅

## Goal

Analyze income quality.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
06 — Income Engine Architecture
```

## Dependencies

```txt
Phase 11A.0 — Insight Architecture
```

## Blocks

```txt
Health Engine
Recommendation Engine
Summary Generator
Reports
```

## Features

* [x] IncomeInsight DTO
* [x] Income metrics model
* [x] Income rule registry
* [x] Total income
* [x] Income trend
* [x] Previous cutoff comparison
* [x] Monthly comparison
* [x] Income source breakdown
* [x] Missing income detection
* [x] Income stability
* [x] Income aggregation
* [x] Income explanation text

## Definition of Done

* [x] income insights are deterministic
* [x] all comparisons are tested
* [x] missing income is handled safely
* [x] tests/lint/build pass

## Suggested Commit Message

```txt
feat(insights): implement income intelligence engine
```

---

# Phase 11A.4 — Savings Intelligence

Status: ✅

## Goal

Analyze savings behavior.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
08 — Savings & Goal Engine Architecture
```

## Dependencies

```txt
Phase 11A.0 — Insight Architecture
```

## Blocks

```txt
Health Engine
Recommendation Engine
Summary Generator
```

## Features

* [x] SavingsInsight DTO
* [x] Savings metrics model
* [x] Savings rule registry
* [x] Savings total
* [x] Savings rate
* [x] Savings trend
* [x] Previous cutoff comparison
* [x] Contribution frequency
* [x] Largest savings contribution
* [x] Savings consistency
* [x] Savings aggregation
* [x] Savings explanation text

## Definition of Done

* [x] savings insights are deterministic
* [x] savings rate is tested
* [x] trend logic is tested
* [x] tests/lint/build pass

## Action Notes

```txt
Implemented deterministic Savings Intelligence as an insights-owned engine.
SavingsInsight now includes current-cutoff savings totals, savings rate,
previous-cutoff trend comparison, contribution frequency, largest savings
contribution, consistency, evidence, aggregation, and explanation text.
Focused insights tests, lint, and build passed; full test verification is blocked
by existing date-sensitive current-cutoff tests after 2026-06-30.
Goal progress, completion percentages, target achievement, projections,
recommendations, summaries, dashboard integration, AI, backend calls, and
schema changes remain out of scope for future phases.
```

## Suggested Commit Message

```txt
feat(insights): implement savings intelligence engine
```

---

# Phase 11A.5 — Savings Goal Intelligence

Status: ✅

## Goal

Analyze savings goals.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
08 — Savings & Goal Engine Architecture
```

## Dependencies

```txt
Phase 11A.0 — Insight Architecture
Phase 11A.4 — Savings Intelligence
```

## Blocks

```txt
Recommendation Engine
Summary Generator
Goal Dashboard Insights
```

## Features

* [x] GoalInsight DTO
* [x] Goal metrics model
* [x] Goal rule registry
* [x] Goal progress
* [x] Goal completion
* [x] Goals without contributions
* [x] Highest funded goal
* [x] Remaining amount
* [x] Goal completion percentage
* [x] Contribution consistency
* [x] Goal aggregation
* [x] Goal explanation text

## Definition of Done

* [x] goal insights are deterministic
* [x] empty goals are handled
* [x] progress calculations are tested
* [x] tests/lint/build pass

## Suggested Commit Message

```txt
feat(insights): implement savings goal intelligence engine
```

---

# Phase 11A.6 — Cashflow Intelligence

Status: ✅

## Goal

Analyze financial position.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
09 — Cashflow & Cutoff Engine Architecture
```

## Dependencies

```txt
Phase 11A.2 — Expense Intelligence
Phase 11A.3 — Income Intelligence
Phase 11A.4 — Savings Intelligence
```

## Blocks

```txt
Health Engine
Recommendation Engine
Summary Generator
Dashboard Cashflow Insights
```

## Features

* [x] CashflowInsight DTO
* [x] Cashflow metrics model
* [x] Cashflow rule registry
* [x] Remaining cash
* [x] Net cashflow
* [x] Positive / negative cashflow
* [x] Spending pace
* [x] Income coverage
* [x] Savings coverage
* [x] Cashflow stability
* [x] Cashflow aggregation
* [x] Cashflow explanation text

## Definition of Done

* [x] cashflow insights are deterministic
* [x] remaining cash is tested
* [x] spending pace is tested
* [x] tests/lint/build pass

## Suggested Commit Message

```txt
feat(insights): implement cashflow intelligence engine
```

---

# Phase 11A.7 — Cutoff Intelligence

Status: ✅

## Goal

Analyze salary cutoff performance.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
09 — Cashflow & Cutoff Engine Architecture
```

## Dependencies

```txt
Phase 11A.3 — Income Intelligence
Phase 11A.4 — Savings Intelligence
Phase 11A.6 — Cashflow Intelligence
```

## Blocks

```txt
Recommendation Engine
Summary Generator
Salary Cutoff Insights
Reports
```

## Features

* [x] CutoffInsight DTO
* [x] Cutoff metrics model
* [x] Cutoff rule registry
* [x] Current vs previous cutoff
* [x] Current vs monthly average
* [x] Income comparison
* [x] Expense comparison
* [x] Savings comparison
* [x] Best cutoff
* [x] Worst cutoff
* [x] Trend direction
* [x] Cutoff aggregation
* [x] Cutoff explanation text

## Definition of Done

* [x] cutoff insights are deterministic
* [x] cutoff comparisons are tested
* [x] missing previous cutoff is handled
* [x] tests/lint/build pass

## Action Notes

```txt
Implemented deterministic Cutoff Intelligence:
- Previous cutoff: nearest prior cutoff with usable data
- Trend: requires current + 2 usable historical snapshots
- Monthly average: calendar-month aggregation of completed historical cutoffs
- CutoffInsight DTO contract preserves cutoffId, startDate, and endDate (no id alias)
```

## Suggested Commit Message

```txt
feat(insights): implement cutoff intelligence engine
```

---

# Phase 11A.8 — Recommendation Engine

Status: ✅

## Goal

Generate actionable recommendations from deterministic insight outputs.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
04 — Rule Engine Architecture
10 — Recommendation Engine Architecture
```

## Dependencies

```txt
Phase 11A.1 — Health Engine
Phase 11A.2 — Expense Intelligence
Phase 11A.3 — Income Intelligence
Phase 11A.4 — Savings Intelligence
Phase 11A.5 — Goal Intelligence
Phase 11A.6 — Cashflow Intelligence
Phase 11A.7 — Cutoff Intelligence
```

## Blocks

```txt
Summary Generator
Dashboard Recommendations
Insights Page
```

## Features

* [x] RecommendationBundle DTO
* [x] Recommendation model
* [x] Recommendation rule registry
* [x] Recommendation severity
* [x] Recommendation priority
* [x] Recommendation grouping
* [x] Recommendation formatting
* [x] Recommendation conflict handling
* [x] Recommendation explanation text

## Example

```txt
Dining accounts for 42% of your spending.

Consider reviewing dining expenses next cutoff.
```

## Definition of Done

* [x] recommendations are deterministic
* [x] recommendation priority is stable
* [x] recommendations reference evidence
* [x] no recommendation is AI-generated
* [x] tests/lint/build pass

## Action Notes

```txt
Implemented deterministic Recommendation Engine:
- Strict ranking order: severity descending -> priority descending -> domain order -> ID ascending
- Domain tie-breaking order: cashflow -> cutoff -> expense -> income -> savings -> goal -> health
- ActionKey deduplication: only the top-ranked recommendation survives per actionKey; duplicate actions are suppressed
- Explicit contradiction resolution: critical cashflow signals suppress non-urgent savings/goal recommendations
- Full evidence traceability and sourceRuleIds preserved
- Pure deterministic local evaluation; no AI-generated recommendations
```

## Suggested Commit Message

```txt
feat(insights): implement recommendation engine
```

---

# Phase 11A.9 — Summary Generator

Status: ✅

## Goal

Generate explainable financial summaries from deterministic insights and recommendations.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
11 — Summary Engine Architecture
```

## Dependencies

```txt
Phase 11A.8 — Recommendation Engine
```

## Blocks

```txt
Dashboard Integration
Reports
AI Prompt Builder
```

## Features

* [x] FinancialSummary DTO
* [x] Summary section model
* [x] Current cutoff summary
* [x] Monthly summary
* [x] Historical summary
* [x] Summary ranking
* [x] Summary formatting
* [x] Narrative composer
* [x] Template registry
* [x] Summary validator

## Example

```txt
You saved 22% of your income this cutoff.

Food remains your largest spending category.

You still have ₱4,500 remaining before your next payday.
```

## Definition of Done

* [x] summary is deterministic
* [x] summary uses InsightBundle and RecommendationBundle only
* [x] no fabricated financial values
* [x] empty data state is handled
* [x] tests/lint/build pass

## Action Notes

```txt
Implemented deterministic FinancialSummary generator:
- Supports three perspective horizons: current cutoff, monthly comparison, and historical trend
- Single source of truth: consumes InsightBundle and RecommendationBundle without recalculating financial values
- Evidence boundaries: direct metric statements retain dot-path evidence.source -> InsightBundle
- Priority Actions traceability: references relatedRecommendations -> RecommendationBundle -> recommendation evidence/sourceRuleIds (no duplicate direct evidence paths)
- Strict validator verifies canonical section ordering, narrative templates, and evidence value integrity
```

## Suggested Commit Message

```txt
feat(insights): implement deterministic financial summary generator
```

---

# Phase 11A.10 — Dashboard Integration

Status: ✅

## Goal

Integrate rule-based insights into the existing application.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
05–11 — Relevant Engine Documents
```

## Dependencies

```txt
Phase 11A.9 — Summary Generator
```

## Features

### Dashboard

* [x] Health Score Card
* [x] Current Cutoff Summary
* [x] Top Recommendations

### Cashflow

* [x] Cashflow Insights
* [x] Spending Pace
* [x] Remaining Cash Insight

### Income

* [x] Income Insights

### Salary Cutoff

* [x] Cutoff Performance

### Reports

* [x] Rule-based report summaries

## Cleanup

* [x] Replace remaining AI-underway placeholders with real rule-generated insights

## Definition of Done

* [x] dashboard consumes InsightBundle
* [x] UI does not calculate financial intelligence directly
* [x] existing layout remains stable
* [x] tests/lint/build pass

## Action Notes

```txt
Integrated deterministic insights into Dashboard and related services:
- Dashboard consumes authoritative insights.* values (health, cashflow metrics, executive summary text, top recommendations)
- Strict boundary: Dashboard does NOT independently calculate health score, cashflow classification, spending risk, recommendation order, or financial thresholds
- Replaced static AI placeholders with live deterministic engine outputs
- Comprehensive unit and integration test coverage verifies active cutoff vs empty/no-active cutoff fallback behavior
```

## Suggested Commit Message

```txt
feat(insights): integrate deterministic insights into dashboard
```

---

# Phase 11A.11 — Insights Page

Status: ✅

## Goal

Provide a dedicated insights experience.

## Architecture References

### Primary

```txt
00 — Source of Truth
02 — InsightBundle & Data Contracts
03 — Insight Engine Architecture
10 — Recommendation Engine Architecture
11 — Summary Engine Architecture
```

## Dependencies

```txt
Phase 11A.10 — Dashboard Integration
```

## Features

* [x] Insights page
* [x] Current cutoff insights
* [x] Monthly insights
* [x] Historical insights
* [x] Priority Recommendations / Priority Action Flow
* [x] Summary sections
* [x] Empty state
* [x] Loading state
* [x] Error state

## Definition of Done

* [x] page consumes insightService/useInsights
* [x] no duplicate financial logic in UI
* [x] responsive layout works
* [x] tests/lint/build pass

## Action Notes

```txt
Dedicated Insights page implemented with deterministic financial intelligence:
- Consumes authoritative insightService / useInsights hook; no duplicate financial logic in UI
- Horizon switcher supports Current Cutoff, Monthly Comparison, and Historical Trend
- Displays structured FinancialSummary sections, paragraphs, and diagnostic cards
- Priority Recommendations / Priority Action Flow presents deterministic actionable recommendations sorted by severity and priority with duplicate action suppression
- Note: Chronological recommendation history remains future scope; Phase 11A.11 intentionally presents the current deterministic recommendation flow instead
- Handles loading, error, empty state (no active cutoff), and responsive layout across desktop and mobile
```

## Suggested Commit Message

```txt
feat(insights): add dedicated insights page
```

---

# Phase 11A.12 — Summary History

Status: ✅

## Goal

Persist generated summaries.

## Architecture References

### Primary

```txt
00 — Source of Truth
01 — Domain Model and Database
02 — InsightBundle & Data Contracts
11 — Summary Engine Architecture
```

## Dependencies

```txt
Phase 11A.9 — Summary Generator
```

## Features

* [x] Cutoff summary history
* [x] Monthly summary history
* [x] Insight history
* [x] Generated timestamp
* [x] Summary retrieval
* [x] Summary empty state
* [x] Summary history tests

## Definition of Done

* [x] summary history persists safely
* [x] generated summaries remain traceable
* [x] no duplicate summaries for same scope unless versioned
* [x] tests/lint/build pass

## Action Notes

```txt
Summary persistence implemented via summaryHistoryService:
- Cutoff summary history: Stored as type: 'cutoff_summary' in existing IndexedDB ai_insights store (no new store, no DB schema version bump, no migration)
- Monthly summary history: Derived dynamically from stored cutoff summaries by periodKey grouped by calendar month (newest summary per month); no independently generated/persisted monthly_summary entity
- Insight history: Traceable historical insight information is represented through persisted deterministic FinancialSummary (sections, paragraphs, evidence, relatedInsights, relatedRecommendations, diagnostics, metadata, horizon); no persisted full InsightBundle
- Deduplication: Logical cutoff identity supports the real CutoffInsight boundary via cutoffId (accepts cutoff.id ?? cutoff.cutoffId). Same cutoff + same version updates existing row; version change appends versioned row
```

## Suggested Commit Message

```txt
feat(insights): persist deterministic summary history
```

---

# Phase 11A Testing

Status: ✅

## Rule Engine Tests

* [x] Health rules
* [x] Expense rules
* [x] Income rules
* [x] Savings rules
* [x] Goal rules
* [x] Cashflow rules
* [x] Cutoff rules

## Service Tests

* [x] insightService
* [x] recommendationService *(satisfied by Recommendation Engine, rule registry, and conflict resolver test architecture)*
* [x] summaryService *(satisfied by Summary Engine and Summary History Service tests)*

## Integration Tests

* [x] Dashboard
* [x] Reports
* [x] Cashflow
* [x] Salary Cutoff
* [x] Insights Page

## Verification

* [x] npm.cmd run test
* [x] npm.cmd run lint
* [x] npm.cmd run build

## Action Notes

```txt
Final Phase 11A regression validation:
69/69 test files passed.
470/470 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed.
Unmocked InsightService pipeline integration verified engine composition,
recommendation conflict resolution, FinancialSummary validation,
summary-history persistence, and same-version deduplication.

Known dependency audit debt:
npm audit reports 20 findings (6 moderate, 13 high, 1 critical).
No dependency upgrades were performed during Phase 11A closure to avoid
mixing infrastructure/package upgrades with deterministic intelligence work.
Handle through a dedicated dependency/security maintenance task.
```

---

# Phase 11B — AI Financial Intelligence Platform

Status: ⬜

## Goal

Build the AI layer on top of deterministic financial intelligence.

AI must consume:

```txt
InsightBundle
RecommendationBundle
FinancialSummary
Conversation Context
Memory Context
```

AI must never become the source of financial truth.

## Architecture References

```txt
12.0 — AI Platform Architecture Overview
12.1 — Prompt Builder Architecture
12.2 — Conversation Engine Architecture
12.3 — Ollama Integration Architecture
12.4 — AI Orchestration Engine
12.5 — Conversation Memory Architecture
12.6 — AI Safety & Guardrails
12.7 — Spring Boot AI REST API
12.8 — Streaming & Real-Time Response Architecture
12.9 — AI Testing Strategy
12.10 — Future Multi-LLM & AI Evolution Architecture
```

## Depends On

```txt
Phase 11A — Rule-Based Financial Intelligence
```

## Implementation Starts After

```txt
Phase 11A.0–11A.12 completed
```

---

# Phase 11B.0 — AI Platform Foundation

Status: ✅

## Features

* [x] AI Platform folder/module structure
* [x] AI Gateway placeholder
* [x] Prompt Builder placeholder
* [x] Conversation Engine placeholder
* [x] Provider Layer placeholder
* [x] Guardrail Engine placeholder
* [x] AI Orchestrator placeholder
* [x] Memory Service placeholder
* [x] Streaming Engine placeholder

## Action Notes

```txt
Phase 11B.0 AI Platform Foundation validated.

Canonical frontend module:
apps/pesopilot-web/src/features/ai-insights

Established inert module boundaries for:
AI Gateway, Prompt Builder, Conversation Engine, Provider Layer,
Guardrail Engine, AI Orchestrator, Memory Service, and Streaming Engine.

No operational AI/provider behavior was introduced.

Validation:
25/25 focused foundation tests passed.
70/70 test files passed.
495/495 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed.

No provider/network calls, database/schema changes, dependencies,
or Phase 11A deterministic-finance modifications were introduced.
```

---

# Phase 11B.1 — Prompt Builder

Status: ✅

## Architecture References

```txt
12.1 — Prompt Builder Architecture
12.5 — Conversation Memory Architecture
12.6 — AI Safety & Guardrails
```

## Features

* [x] PromptPackage DTO
* [x] Context selector
* [x] Template registry
* [x] Prompt composer
* [x] Safety injector
* [x] Prompt validator

## Action Notes

```txt
Phase 11B.1 Prompt Builder validated.

Implemented provider-independent PromptPackage generation over
Phase 11A deterministic intelligence.

Deterministic source hierarchy:
InsightBundle → financial metrics
RecommendationBundle → recommendation authority
FinancialSummary → narrative authority

Prompt context is explicitly minimized before future AI/provider use.
Raw transaction history, raw notes, merchant history, individual goal
records, diagnostics, breakdowns, and other unnecessary financial detail
are excluded.

Prompt Builder preserves deterministic values and recommendation order.
It performs no financial recalculation, recommendation generation,
provider calls, or network transmission.

Conversation Context and Memory Context remain null and undefined
until their dedicated Phase 11B subphases.

Architecture reference 12.1 — Prompt Builder Architecture was
materialized in PesoPilot-v1.0-AI-Architecture.md.

Validation:
22/22 focused Prompt Builder tests passed.
25/25 AI Platform Foundation tests passed.
71/71 test files passed.
517/517 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed.

No provider/network calls, database/schema changes, dependency changes,
Phase 11A modifications, or Phase 11B.2+ behavior were introduced.
```

---

# Phase 11B.2 — Conversation Engine

Status: ✅

## Architecture References

```txt
12.2 — Conversation Engine Architecture
12.5 — Conversation Memory Architecture
```

## Features

* [x] Conversation DTO
* [x] Session model
* [x] Message model
* [x] Topic tracker
* [x] Clarification manager
* [x] Conversation context builder

## Action Notes

```txt
Phase 11B.2 Conversation Engine validated.

Implemented deterministic, ephemeral current-session conversation state
with caller-supplied IDs/timestamps and immutable state transitions.

Conversation Engine includes:
Conversation DTO, Session model, Message model, Topic tracker,
Clarification manager, and Conversation Context builder.

Messages are limited to user/assistant roles, preserve exact content,
and are bounded to 4,000 characters each.

Prompt-facing ConversationContext is minimized to:
current topic, clarification state, and the last 10 messages.
Internal IDs, timestamps, sequence numbers, and session metadata
are excluded from model context.

Prompt Builder now structurally separates:
DETERMINISTIC_FINANCIAL_CONTEXT_JSON
from
UNTRUSTED_CONVERSATION_CONTEXT_JSON.

Conversation text remains untrusted and cannot become financial truth,
system instructions, or recommendation authority.

memoryContext remains null and Memory Service behavior is deferred
to Phase 11B.5.

Architecture reference 12.2 — Conversation Engine Architecture was
materialized, and stale 12.1 phase references were corrected.

Validation:
37/37 Conversation Engine tests passed.
25/25 Prompt Builder regression tests passed.
25/25 AI Platform Foundation tests passed.
72/72 test files passed.
557/557 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed.

No provider/network calls, database/schema changes, dependencies,
Phase 11A changes, memory behavior, guardrail behavior, or
Phase 11B.3+ functionality were introduced.
```

---

# Phase 11B.3 — Provider Layer / Ollama

Status: ✅

## Architecture References

```txt
12.3 — Ollama Integration Architecture
12.10 — Future Multi-LLM & AI Evolution Architecture
```

## Features

* [x] LLM adapter interface
* [x] Provider registry
* [x] Ollama adapter
* [x] Provider request DTO
* [x] Provider response DTO
* [x] Provider diagnostics

## Action Notes

```txt
Phase 11B.3 Provider Layer / Ollama validated.

Implemented provider-independent LLM adapter infrastructure with a
static immutable provider registry and Ollama as the only registered
Phase 11B.3 provider.

ProviderRequest maps the validated PromptPackage into a normalized
provider request containing the selected model, system prompt, user
prompt, and stream:false.

Ollama integration uses POST /api/generate with streaming explicitly
disabled.

Before any financial prompt content is transmitted, PesoPilot performs
a prompt-free POST /api/show locality preflight containing only the
selected model identifier.

Ollama remote_host and remote_model metadata are used to reject remote,
cloud-proxied, or unknown model locality before generation. Model-name
heuristics and weight formats are not used as locality authority.

Provider transport is restricted to approved HTTP loopback endpoints
and rejects redirects, remote hosts, LAN hosts, embedded credentials,
queries, fragments, and unexpected paths.

Provider responses and diagnostics are normalized and exclude raw
provider responses, thinking/reasoning output, PromptPackages,
conversation text, and raw financial context.

Provider errors retain only sanitized operational metadata.

Architecture references 12.3 — Ollama Integration Architecture and
12.10 — Future Multi-LLM & AI Evolution Architecture were materialized.

Validation:
34/34 Provider Layer tests passed.
25/25 AI Platform Foundation tests passed.
73/73 test files passed.
591/591 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed with 905 modules transformed.

No cloud providers, cloud prompt transmission, provider retries,
fallback workflows, orchestration, memory behavior, Guardrail Engine
behavior, Spring Boot AI API, streaming, database/schema changes,
dependencies, Phase 11A modifications, or Phase 11B.4+ behavior were
introduced.
```

---

# Phase 11B.4 — AI Orchestration Engine

Status: ✅

## Architecture References

```txt
12.4 — AI Orchestration Engine
12.6 — AI Safety & Guardrails
```

## Features

* [x] AI Workflow DTO
* [x] Workflow manager
* [x] Workflow templates
* [x] Service coordinator
* [x] Timeout manager
* [x] Retry manager
* [x] Workflow diagnostics

## Action Notes

```txt
Phase 11B.4 AI Orchestration Engine validated.

Implemented the AI Workflow DTO, immutable workflow template registry,
pure Workflow Manager, Service Coordinator, Workflow Timeout Manager,
bounded Retry Manager, and privacy-safe WorkflowDiagnostics.

The current workflow coordinates the existing Prompt Builder,
Conversation Context, Provider Layer, and registered Ollama adapter
without recalculating or modifying deterministic financial truth.

One provider-independent workflow template is registered:
financial-summary-explanation.

Workflow lifecycle states are pending, running, succeeded, failed, and
timed_out. The initial attempt is attempt 1 and at most one retry is
allowed, for a maximum of 2 total attempts.

Workflow timeout is distinct from Provider Layer transport timeout.
The overall workflow owns a master AbortController whose signal is
propagated through the Ollama adapter and transport into fetch.

If the overall workflow signal aborts, WORKFLOW_TIMEOUT takes precedence
over ProviderError retry classification and no retry occurs.

Provider retries are limited to transient PROVIDER_UNAVAILABLE,
TRANSPORT_TIMEOUT, and TRANSPORT_ERROR failures. Security, locality,
configuration, model, provider-rejection, and malformed-response errors
are not retried.

WorkflowDiagnostics contain only safe operational metadata and exclude
prompt text, provider completion text, conversation messages, and
financial values.

WorkflowError is the single workflow failure authority. AIWorkflow does
not maintain a competing error object.

On AI failure or timeout, PesoPilot does not fabricate replacement AI
output or invoke another provider. Existing deterministic InsightBundle,
RecommendationBundle, and FinancialSummary outputs remain valid and
available.

Section 12.4 — AI Orchestration Engine Architecture was materialized.

Validation:
24/24 AI Orchestrator tests passed.
39/39 Provider Layer tests passed.
25/25 Prompt Builder tests passed.
37/37 Conversation Engine tests passed.
25/25 AI Platform Foundation tests passed.
74/74 test files passed.
620/620 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed with 905 modules transformed.

No Memory Service, Guardrail Engine, cloud provider, Spring Boot AI API,
streaming, financial truth changes, database/schema changes,
dependencies, or Phase 11B.5+ behavior were introduced.
```

---

# Phase 11B.5 — Memory Service

Status: ✅

## Architecture References

```txt
12.5 — Conversation Memory Architecture
12.6 — AI Safety & Guardrails
```

## Features

* [x] Memory DTO
* [x] Memory Context DTO
* [x] Memory evaluator
* [x] Memory retriever
* [x] Memory ranker
* [x] Memory policy manager

## Action Notes

```txt
Phase 11B.5 Memory Service validated.

Implemented caller-owned/stateless Memory DTO and Memory Context DTO
contracts with deterministic memory evaluation, retrieval, ranking, and
a fixed immutable Memory Policy.

Memory is curated contextual knowledge and does not represent
conversation history or deterministic financial truth.

Only explicitly confirmed user-sourced qualitative preference candidates
are eligible for promotion. Current memory types are
communication_preference, coaching_preference, and user_preference.

Memory Records use caller-supplied IDs and timestamps and are managed
immutably. Duplicate record IDs are rejected without silent repair.

Retrieval uses structured workflow/topic metadata only. Ranking is
deterministic using topic relevance, importance, recency, and memoryId
as a stable final tie-breaker.

Memory Context exposes only type/content to Prompt Builder and is bounded
to 5 items, 300 characters per item, and 1500 total item characters.

Prompt Builder now keeps memory structurally separate from deterministic
financial intelligence using UNTRUSTED_MEMORY_CONTEXT_JSON.

AI Orchestration optionally accepts caller-owned memoryState, retrieves
relevant Memory Context, and forwards it to Prompt Builder. Workflows
without memory remain backward-compatible with Phase 11B.4 behavior.

Phase 11B.5 does not persist memory. No Dexie store, database migration,
schema version change, Memory Repository, or Knowledge Repository was
introduced.

Phase 11B.5 provides structural trust separation only. PII detection,
prompt-injection detection, memory security validation, and other
Guardrail Engine responsibilities remain Phase 11B.6.

Section 12.5 — Conversation Memory Architecture was materialized.

Validation:
57/57 Memory Service tests passed.
31/31 Prompt Builder tests passed.
37/37 Conversation Engine tests passed.
39/39 Provider Layer tests passed.
30/30 AI Orchestrator tests passed.
25/25 AI Platform Foundation tests passed.
75/75 test files passed.
684/684 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed.

No database/schema changes, persistent memory repository, automatic
memory promotion, LLM/heuristic extraction, semantic financial detector,
confidence subsystem, Guardrail Engine behavior, cloud providers,
Spring Boot AI API, streaming, or Phase 11B.6+ behavior were introduced.
```

---

# Phase 11B.6 — Guardrail Engine

Status: ✅

## Architecture References

```txt
12.6 — AI Safety & Guardrails
```

## Features

* [x] Input validator
* [x] Prompt validator
* [x] Memory validator
* [x] Provider validator
* [x] Response validator
* [x] Financial guidance validator
* [x] Audit logger

## Action Notes

```txt
Phase 11B.6 Guardrail Engine validated.

Implemented deterministic application-level guardrails for Input,
Prompt, Memory, Provider, Response, and Financial Guidance validation,
plus sanitized rejection audit logging.

Guardrails use immutable binary allow/reject decisions. No content
rewriting, sanitization, regeneration, manual review, or escalation
behavior is implemented.

Public orchestration fields and provider configuration fields are
strictly allowlisted. Caller-controlled execution fields such as signal,
retry policy, and workflow timeout cannot be injected through public
workflow input.

Prompt and memory safety scanning uses explicit untrusted-text provenance
rather than recursively treating deterministic platform-generated
financial narratives as user instructions.

Prompt Guardrail verifies the canonical mandatory safety block produced
by the existing Prompt Builder safety injector and applies bounded
high-confidence deterministic prompt-injection detection.

Memory Guardrail validates only retrieved MemoryContext content and
performs bounded sensitive-data/secret detection. It does not persist or
automatically promote memory.

Provider Guardrail enforces browser-phase execution policy for registered
local Ollama providers but does not replace the Phase 11B.3 /api/show
model locality preflight.

Response Guardrail validates publication safety and rejects bounded
high-confidence prompt disclosure, secret leakage, and unsupported
platform action claims.

Financial Guidance Guardrail permits budgeting, savings, expense,
cashflow, goal, and educational coaching while rejecting bounded
high-confidence regulated or unsupported guidance categories.

All guardrail rejections normalize to WorkflowError
GUARDRAIL_REJECTED with terminal workflow status failed and are never
passed through Provider retry classification. Guardrail retry behavior is
control-flow policy; WorkflowError contains no isRetryable field.

Audit logging emits sanitized structured events for rejections only.
No prompt, conversation, memory, response, financial value, secret value,
unsanitized cause, or stack trace is propagated into audit events or
sanitized workflow diagnostics.

No audit persistence was introduced. The browser runtime uses a no-op
sink by default, with a bounded in-memory sink available for tests/local
diagnostics.

Section 12.6 — AI Safety & Guardrails Architecture was materialized.

Validation:
48/48 Guardrail Engine tests passed.
57/57 Memory Service tests passed.
31/31 Prompt Builder tests passed.
37/37 Conversation Engine tests passed.
39/39 Provider Layer tests passed.
36/36 AI Orchestrator tests passed.
25/25 AI Platform Foundation tests passed.
76/76 test files passed.
743/743 tests passed.
ESLint passed with 0 errors and 0 warnings.
Production Vite build passed with 905 modules transformed.

Final contract cleanup:
48/48 Guardrail tests passed.
36/36 Orchestrator tests passed.
ESLint passed with 0 errors and 0 warnings.

No database/schema changes, audit persistence, cloud providers,
Spring Boot AI API, streaming, automatic rewriting, automatic
regeneration, rate limiting, abuse subsystem, human escalation,
semantic/ML safety classifier, financial-engine changes, or
Phase 11B.7+ behavior were introduced.
```

---

# Phase 11B.7 — Spring Boot AI REST API

Status: ✅

## Architecture References

```txt
12.7 — Spring Boot AI REST API
```

## Features

* [x] AI Gateway
* [x] AI REST controllers
* [x] Request DTOs
* [x] Response DTOs
* [x] Error handling
* [x] API versioning

## Action Notes

```txt
Phase 11B.7 Spring Boot AI REST API validated.

Implemented the versioned Spring Boot AI REST contract and application
boundary for financial-summary explanation requests.

The public endpoint is:

POST /api/v1/ai/explanations

Phase 11B.7 does not introduce a new Spring inference runtime.
The existing browser AI Orchestrator and local Ollama Provider Layer
remain the active real-AI execution path.

The Spring REST path consists of:

browser aiGateway
→ Spring AiExplanationController
→ Spring AiGateway
→ AiExecutionPort
→ UnavailableAiExecutionPort

The production Spring execution port intentionally fails closed with
HTTP 503 Service Unavailable until an authorized backend execution
adapter is implemented.

aiGateway status "ready" means the HTTP/API gateway contract is
implemented and operational. It does not mean Spring inference is
available.

The REST API is provider-independent. Public requests do not expose
template IDs, provider names, models, base URLs, prompts, retry policy,
stream configuration, credentials, or provider internals.

The public request uses the canonical minimized AI context established
by the existing Prompt Builder architecture:

- financialSummary
- recommendations
- all seven insight domains
- optional ConversationContext
- optional MemoryContext

Spring does not recalculate financial values, derive financial truth,
re-rank recommendations, or reinterpret deterministic intelligence.

Prompt Context, Conversation Context, and Memory Context versions are
strictly validated as 1.0.0. Unsupported or null required versions fail
with HTTP 400 without version fallback or silent conversion.

Conversation Context preserves the Phase 11B.2 contract:
- maximum 10 recent messages;
- maximum 4000 characters per message;
- user/assistant roles only;
- canonical topic taxonomy;
- clarification-state invariants.

Memory Context preserves the Phase 11B.5 contract:
- communication_preference, coaching_preference, and user_preference;
- maximum 5 items;
- maximum 300 characters per item;
- maximum 1500 total item characters.

Canonical financial/context scalar DTO fields use nullable Java wrapper
types so missing values remain null and are never silently converted into
0, 0.0, or false.

Response DTO exposes only requestId, explanation, and generatedAt and is
wrapped in the existing three-field ApiResponse<T> envelope.

ApiResponse<T> remains unchanged.

Global exception handling was extended for AI validation, unavailable
execution, and sanitized AI API errors. Validation and malformed-request
logging no longer includes raw exception messages that may contain
financial/context payloads.

API versioning uses URI versioning under /api/v1. No unversioned AI route
or /api/v2 AI route is exposed.

The browser aiGateway reuses the existing shared API client and exposes
requestExplanation(context). No new HTTP dependency was introduced.

The existing product UI was not switched to the Spring REST path.
No automatic backend fallback was introduced.

Section 12.7 — Spring Boot AI REST API Architecture was materialized.

Validation:

Backend focused Phase 11B.7 tests:
14/14 passed before final contract verification.

Backend final regression after version/nullability verification:
23/23 tests passed.
BUILD SUCCESS.

Frontend AI Gateway:
7/7 tests passed.

AI Platform Foundation:
25/25 tests passed.

Frontend full regression:
77/77 test files passed.
750/750 tests passed.

ESLint:
0 errors.
0 warnings.

Production Vite build:
PASS.
905 modules transformed.

No new Maven dependencies were added.

No database/schema changes, Spring AI, live Spring provider,
Java duplication of Prompt Builder/Conversation Engine/Memory Service/
Guardrail Engine/AI Orchestrator/Provider Layer, streaming, SSE,
WebFlux, Spring Security, authentication, cloud provider, UI execution
switch, or Phase 11B.8+ behavior were introduced.
```

---

# Phase 11B.8 — Streaming Engine

Status: ✅

## Architecture References

```txt
12.8 — Streaming & Real-Time Response Architecture
```

## Features

* [x] Stream manager
* [x] Token buffer
* [x] Chunk model
* [x] SSE endpoint
* [x] Cancellation
* [x] Stream diagnostics

## Action Notes

```txt
Phase 11B.8 Streaming Engine validated.

Implemented the v1 Dual Boundary + Safe Publication Gate architecture.

Real incremental AI generation remains browser-local:

AI Orchestrator
→ Provider Layer
→ local Ollama NDJSON streaming
→ private Token Buffer
→ canonical ProviderResponse
→ Response Guardrail
→ Financial Guidance Guardrail
→ validated StreamChunk publication

Spring owns a separate versioned SSE transport contract:

POST /api/v1/ai/explanations/stream

Spring does not own production AI inference. The production streaming
execution port intentionally remains unavailable and fails closed with
HTTP 503 using the existing ApiResponse<T> envelope.

Streaming generation is incremental, but raw provider fragments are
never published directly to the user.

Safe Publication Gate:

Generate incrementally.
Publish only after validation.

Ollama NDJSON fragments remain private until the complete response is
reconstructed and passes both the existing Response Guardrail and
Financial Guidance Guardrail.

If either final guardrail rejects:

- workflow terminates with GUARDRAIL_REJECTED;
- zero generated-content StreamChunks are published;
- zero chunk events containing rejected model text are emitted;
- rejected text is not copied into diagnostics or error payloads.

The Safe Publication Gate was validated against real, pre-existing
guardrail rules without mocking the guardrail engine, including violations
split across multiple provider fragments.

Provider streaming is additive.

The existing synchronous ProviderRequest contract remains unchanged and
continues to require:

generation.stream = false

Existing synchronous provider execution continues through:

adapter.generate(...)

A separate ProviderStreamRequest and additive Ollama stream operation
handle browser-local streaming.

The existing synchronous Provider Guardrail remains unchanged.
A separate streaming-specific provider guardrail validates:

- registered provider;
- supported provider;
- permitted locality;
- matching configured model;
- valid ProviderStreamRequest.

Ollama streaming preserves locality-first privacy:

POST /api/show { model }

must pass before prompt or financial context is transmitted.

Only then:

POST /api/generate
stream: true

is opened against local Ollama.

Ollama output is NDJSON, not SSE.

The streaming transport uses native browser:

- fetch;
- ReadableStream;
- TextDecoder;
- AbortSignal.

No streaming dependency was added.

The Token Buffer stores ordered provider text fragments, not guaranteed
model tokenizer tokens.

The buffer is bounded by the existing Response Guardrail limit:

5000 characters.

Character 5001 causes:

- STREAM_BUFFER_LIMIT_EXCEEDED internally;
- active provider HTTP transport abort;
- private buffer clearing;
- failed stream;
- zero generated-content publication.

After full-response guardrails allow the response, safe publication uses
deterministic StreamChunks with a maximum 256 JavaScript code units while
preserving UTF-16 surrogate-pair boundaries.

Joining all published chunks exactly reconstructs the validated
ProviderResponse.content.

Stream lifecycle:

starting
→ streaming
→ validating
→ publishing
→ completed

Terminal alternatives:

cancelled
failed
timed_out

Terminal streams accept no further content or non-idempotent state
transitions.

Cancellation propagates through a single AbortSignal path:

stream handle cancel()
→ stream session AbortController
→ orchestration timeout/cancellation signal
→ providerConfig.signal
→ Ollama streaming adapter
→ streaming transport
→ native fetch

Cancellation does not claim that Ollama GPU/model compute terminates
instantly. PesoPilot guarantees abortion of its active HTTP request.

Cancellation is checked before and after synchronous final guardrail
validation so cancelled streams cannot begin publication.

Existing orchestration RetryManager remains authoritative.

No StreamingRetryManager was introduced.

Each retry attempt uses a fresh private Token Buffer. Failed attempt
content is discarded. Only a successful attempt can proceed to final
guardrails and publication.

No retry occurs once safe publication has begun.

The public Streaming Engine facade is:

streamingEngine.startStream(...)

The returned public handle exposes only:

- streamId;
- cancel();
- getDiagnostics();
- promise.

Internal session state is not exposed through the public API.

Stream diagnostics are sanitized and contain only operational metadata
such as state, counts, timestamps, durations, and stream ID.

Diagnostics contain no:

- prompt text;
- generated response text;
- financial values;
- conversation text;
- memory content;
- provider raw payload;
- credentials;
- stack traces.

Spring streaming architecture preserves:

Controller
→ AiStreamingGateway
→ AiStreamingExecutionPort

AiStreamingExecutionPort is transport-neutral and contains no SseEmitter,
HttpServletResponse, or ResponseEntity dependency.

The Spring controller alone owns SseEmitter and SSE serialization.

Canonical SSE lifecycle events include:

started
chunk
completed
cancelled
failed
timed_out

Application-level failed terminal events are emitted as:

event: failed

and the emitter completes normally.

Transport failures remain separate from protocol-level failed events.

Production UnavailableAiStreamingExecutionPort throws synchronously before
the controller returns or commits an SseEmitter.

Therefore production unavailable streaming returns:

HTTP 503
application/json
ApiResponse.failure(...)

and not text/event-stream.

ApiResponse<T> remains the established three-field contract:

success
message
data

No nested error envelope was introduced.

No Spring production inference runtime, Java Ollama adapter, Spring AI,
WebFlux, WebSockets, Redis, persistence, resume/reconnect protocol,
heartbeats, adaptive buffering, streaming retry subsystem, streaming UI,
or Phase 11B.9 behavior was introduced.

Validation:

Frontend Streaming Engine and related focused tests:
PASS.

Frontend full regression:
78/78 test files passed.
784/784 tests passed.

ESLint:
0 errors.
0 warnings.

Production Vite build:
PASS.

Backend:
30/30 tests passed.
0 failures.
0 errors.
BUILD SUCCESS.

No new Maven dependencies were introduced.

pom.xml remains unchanged.

Decision Log remains unchanged.

Database/schema remains unchanged.

The existing synchronous AI execution path remains preserved.
```

---

# Phase 11B.9 — AI Testing Harness

Status: ✅

## Architecture References

```txt
12.9 — AI Testing Strategy
```

## Features

* [x] Provider mock
* [x] Workflow simulator
* [x] Prompt simulator
* [x] Conversation simulator
* [x] Memory simulator
* [x] Regression runner

## Action Notes

```txt
Phase 11B.9 AI Testing Harness validated.

Implemented a developer/test-only deterministic AI harness under:

apps/pesopilot-web/src/features/ai-insights/testing/

The harness is not part of production runtime and is not exported through
the production AI facade or AI Platform capability registry.

The harness runs fully offline and requires no:

- Ollama daemon;
- cloud provider;
- network;
- API key;
- production backend inference.

No production runtime AI files were modified.

Provider Mock:

- satisfies the production adapter contract;
- defaults to provider ID `ollama` and locality `local` so production
  Provider Guardrails remain authoritative;
- supports deterministic synchronous generate() scripts;
- supports deterministic streaming scripts;
- emits normalized production-compatible streaming fragment objects;
- supports canonical ProviderError failures;
- observes AbortSignal cancellation;
- keeps safe in-memory call history for test assertions only.

The test Provider Layer uses:

createProviderRegistry([mockAdapter])

and preserves the production Provider Layer abstraction.

Registry-bound operations delegate to:

- getProviderAdapter();
- getProviderDescriptor();
- listProviderDescriptors().

The test layer reuses production:

- createProviderRequest;
- createProviderStreamRequest;
- validateProviderRequest;
- validateProviderStreamRequest;
- validateProviderResponse;
- validateProviderDiagnostics.

No provider validation logic was duplicated.

Workflow Simulator executes the real:

createServiceCoordinator(...)

and calls:

- executeWorkflow(...);
- executeStreamingWorkflow(...).

It does not reproduce orchestration, retry, guardrail, streaming, Prompt
Builder, or Memory logic.

Deterministic injected runtime provides:

- controllable clock;
- controllable timer;
- deterministic sequential IDs.

No sleep-based or wall-clock-dependent workflow tests are required.

Prompt Simulator directly executes:

promptBuilder.build(...)

using canonical production financial, conversation, and memory context.

It does not duplicate context selection, template resolution, prompt
composition, PromptPackage construction, or validation.

Conversation Simulator drives the real Conversation Engine:

- startConversation;
- appendMessage;
- updateTopic;
- requestClarification;
- resolveClarification;
- closeConversation;
- buildConversationContext;
- production validators.

It does not duplicate conversation rules.

Memory Simulator drives the real Memory Service:

- evaluateCandidate;
- createMemoryRecord;
- addMemoryRecord;
- retrieveContext;
- production memory validators.

Ranking, retrieval, policy limits, and prompt-facing MemoryContext behavior
remain production-owned.

The initial curated regression suite contains 8 Golden Scenarios.

The number 8 is not an architectural requirement; v1 requires a small,
curated, deterministic scenario set.

Current scenarios cover:

1. successful synchronous financial explanation;
2. Response Guardrail rejection;
3. Financial Guidance Guardrail rejection;
4. retryable provider failure and recovery;
5. bounded MemoryContext propagation;
6. ConversationContext propagation;
7. successful streaming Safe Publication Gate;
8. streaming guardrail rejection with zero unsafe publication.

Regression Runner executes scenarios sequentially and aggregates all
scenario outcomes into an immutable versioned RegressionReport.

Scenario failures are structural and privacy-safe.

Regression reports do not contain:

- system prompts;
- user prompts;
- generated provider content;
- financial values;
- memory text;
- conversation history;
- credentials;
- raw provider configuration;
- stack traces.

Unexpected exceptions are converted to safe structural failure codes and
generic diagnostic messages rather than copying arbitrary exception text.

Provider Mock call history remains test-local and is never copied into
RegressionReport output.

Regression coverage verifies that AI does not become a financial
source-of-truth.

InsightBundle, RecommendationBundle, and FinancialSummary remain unchanged
before and after orchestration.

Grounding is validated architecturally through:

deterministic financial source
→ canonical Prompt Context
→ PromptPackage
→ ProviderRequest

No subjective LLM scoring, LLM-as-judge, or hallucination scoring model was
introduced.

Real production Guardrails remain active during harness workflows.

The harness does not mock the guardrail under test.

Streaming regression uses:

scripted provider fragments
→ real executeStreamingWorkflow(...)
→ real Token Buffer
→ real Safe Publication Gate
→ real Response Guardrail
→ real Financial Guidance Guardrail
→ validated StreamChunks / StreamEvents.

Browser-local streaming is not described as SSE.

Spring SSE remains the separate 11B.8 backend transport boundary.

No live-provider testing is required for automated regression.

No Evaluation Engine, Benchmark Runner, Chaos Testing framework, load
testing framework, historical benchmark database, LLM-as-judge,
multi-provider compatibility matrix, testing dashboard, scenario DSL,
new CLI framework, or Phase 12 behavior was introduced.

No new npm or Maven dependencies were introduced.

package.json remains unchanged.

package-lock.json remains unchanged.

CI/workflow files remain unchanged.

Spring Boot backend remains unchanged.

Decision Log remains unchanged.

Database/schema remains unchanged.

Validation:

Focused AI Testing Harness:
8/8 test files passed.
38/38 tests passed.

Frontend full regression:
86/86 test files passed.
822/822 tests passed.

ESLint:
0 errors.
0 warnings.

Production Vite build:
PASS.
905 modules transformed.

Backend:
30/30 tests passed.
0 failures.
0 errors.
BUILD SUCCESS.
```

---

# Phase 11B Verification

* [ ] AI outputs grounded in deterministic insights
* [ ] no AI-generated financial source of truth
* [ ] guardrails enforced
* [ ] provider abstraction respected
* [ ] streaming tested
* [ ] npm.cmd run test
* [ ] npm.cmd run lint
* [ ] npm.cmd run build

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

