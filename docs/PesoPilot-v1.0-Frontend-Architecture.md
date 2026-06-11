# Frontend Architecture

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md
* 01-product.md
* 02-roadmap.md
* 03-domain-and-database.md
* design.md

---

# Purpose

This document defines the official frontend architecture for PesoPilot v1.0.

The frontend is responsible for:

* User interface
* Local-first financial data management
* IndexedDB persistence through Dexie.js
* Dashboard and reports
* Salary cutoff workflows
* Expense review workflows
* Cashflow calculations
* Budget shock warnings
* Offline-first behavior
* Communication with the Spring Boot backend when needed

The frontend must remain maintainable, modular, testable, and aligned with the approved architecture.

---

# Core Frontend Rule

The frontend must follow this flow:

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

React components must not directly access Dexie, backend APIs, or complex business calculations.

---

# Frontend Tech Stack

Approved stack:

* React JS
* Vite
* JavaScript
* Tailwind CSS
* React Router
* Zustand or Context API
* Dexie.js
* IndexedDB
* Zod
* React Hook Form
* Recharts
* Axios

---

# Frontend Project Structure

```txt
frontend/src/
├── app/
│   ├── App.jsx
│   ├── router.jsx
│   └── providers.jsx
│
├── components/
│   ├── ui/
│   └── layout/
│
├── features/
│   ├── dashboard/
│   ├── expenses/
│   ├── salary-cutoff/
│   ├── savings/
│   ├── cashflow/
│   ├── reports/
│   ├── expense-inbox/
│   ├── budget-shock/
│   ├── ai-insights/
│   └── settings/
│
├── lib/
│   ├── api/
│   ├── db/
│   ├── backup/
│   ├── validation/
│   └── utils/
│
├── styles/
└── main.jsx
```

---

# Folder Responsibilities

## `app/`

The `app/` folder contains application-level setup.

Responsibilities:

* Root app component
* Router configuration
* Global providers
* App-level layout composition

Files:

```txt
app/
├── App.jsx
├── router.jsx
└── providers.jsx
```

Rules:

* Do not place feature logic here.
* Do not place Dexie queries here.
* Do not place business calculations here.

---

## `components/ui/`

Contains reusable UI primitives.

Examples:

```txt
Button.jsx
Card.jsx
Input.jsx
Badge.jsx
Modal.jsx
DataGrid.jsx
CurrencyText.jsx
```

Rules:

* Must be reusable across features.
* Must not contain business logic.
* Must follow `design.md`.
* Must use PesoPilot design tokens.
* Must not call APIs.
* Must not call Dexie.

Example:

```txt
Button = reusable primitive
ExpenseForm = feature component
```

---

## `components/layout/`

Contains layout-level components.

Examples:

```txt
AppLayout.jsx
Sidebar.jsx
Header.jsx
PageContainer.jsx
```

Responsibilities:

* Sidebar navigation
* Header layout
* Page shell
* Responsive layout behavior

Rules:

* May read route state.
* Must not contain financial logic.
* Must not access Dexie directly.

---

## `features/`

Each feature owns its own UI, hooks, services, schemas, and repository interactions.

Each feature should follow this structure when needed:

```txt
features/example-feature/
├── pages/
├── components/
├── hooks/
├── services/
├── repositories/
├── schemas/
├── constants/
└── utils/
```

Not every feature needs every folder immediately.

---

## `lib/`

Contains shared infrastructure.

```txt
lib/
├── api/
├── db/
├── backup/
├── validation/
└── utils/
```

Rules:

* Shared utilities only.
* No feature-specific UI.
* No page components.
* No unrelated business logic.

---

# Feature Folder Contract

Every feature must respect this structure.

## `pages/`

Route-level feature pages.

Example:

```txt
features/expenses/pages/ExpensesPage.jsx
```

Responsibilities:

* Compose feature components
* Load feature hooks
* Handle route-level layout

Should not:

* Perform calculations directly
* Access Dexie directly
* Call backend APIs directly

---

## `components/`

Feature-specific components.

Example:

```txt
features/expenses/components/ExpenseForm.jsx
features/expenses/components/ExpenseList.jsx
features/expenses/components/ExpenseCard.jsx
```

Responsibilities:

* Render UI
* Receive props
* Trigger callbacks

Should not:

* Query Dexie
* Contain financial formulas
* Know backend details

---

## `hooks/`

Feature orchestration.

Example:

```txt
features/expenses/hooks/useExpenses.js
```

Responsibilities:

* Load data
* Manage local UI state
* Call services/repositories
* Expose clean APIs to components

Example:

```js
const {
  expenses,
  isLoading,
  error,
  createExpense,
  updateExpense,
  deleteExpense
} = useExpenses();
```

---

## `services/`

Business logic and calculations.

Example:

```txt
features/cashflow/services/cashflowService.js
features/budget-shock/services/budgetShockService.js
```

Responsibilities:

* Financial calculations
* Data transformations
* Domain workflows
* Risk scoring
* Forecasting

Should not:

* Render UI
* Depend on React
* Directly mutate components

---

## `repositories/`

Persistence abstraction layer.

Example:

```txt
features/expenses/repositories/expenseRepository.js
```

Responsibilities:

* Dexie CRUD operations
* Indexed queries
* Data retrieval
* Persistence errors

Rules:

* Repositories are the only feature layer allowed to access Dexie.
* UI components must never call Dexie directly.
* Services may call repositories when needed.

---

## `schemas/`

Validation schemas.

Use Zod.

Example:

```txt
features/expenses/schemas/expenseSchema.js
```

Responsibilities:

* Validate forms
* Validate imported data
* Validate parsed AI results before saving

---

## `constants/`

Feature constants.

Examples:

```txt
PAYMENT_METHODS
EXPENSE_SOURCES
BUDGET_SHOCK_LEVELS
CUTOFF_TYPES
```

---

# Approved MVP Feature Folders

For v1.0, only these feature folders are approved:

```txt
features/
├── dashboard/
├── expenses/
├── salary-cutoff/
├── savings/
├── cashflow/
├── reports/
├── expense-inbox/
├── budget-shock/
├── ai-insights/
└── settings/
```

Do not create these folders in MVP v1 unless needed later:

```txt
goals/
payback/
payment-proof/
financial-health/
spending-personality/
```

Those belong to Phase 14+.

---

# Local Database Access

Dexie.js is the only approved IndexedDB wrapper.

Dexie setup belongs in:

```txt
lib/db/
├── dexie.js
├── schema.js
├── seed.js
├── migrations.js
└── repositories/
```

The official MVP stores are defined in `03-domain-and-database.md`.

Frontend must not introduce new stores without updating `00-source-of-truth.md` and `03-domain-and-database.md`.

---

# Repository Pattern

Repositories hide Dexie details from the rest of the app.

Approved repository examples:

```txt
categoryRepository.js
incomeRepository.js
expenseRepository.js
savingsRepository.js
salaryCutoffRepository.js
budgetRepository.js
detectedExpenseRepository.js
merchantRuleRepository.js
aiInsightRepository.js
cashflowSnapshotRepository.js
budgetShockAlertRepository.js
settingsRepository.js
```

Example repository shape:

```js
export const expenseRepository = {
  async create(expense) {},
  async update(id, changes) {},
  async remove(id) {},
  async findById(id) {},
  async findAll() {},
  async findByCutoff(cutoffId) {},
  async findByDateRange(startDate, endDate) {},
};
```

Repository rules:

* Return plain JavaScript objects.
* Do not return UI-specific structures.
* Do not format currency.
* Do not render messages.
* Do not call React hooks.
* Do not call backend APIs.

---

# Services Layer

Services hold business logic.

Examples:

```txt
cutoffService.js
cashflowService.js
budgetShockService.js
summaryPayloadService.js
expenseParserService.js
merchantCategorizationService.js
```

Service rules:

* Services may call repositories.
* Services may call API clients.
* Services must be testable without UI.
* Services should be pure when possible.
* Financial calculations should live here, not in components.

---

# Hooks Layer

Hooks connect UI to services.

Examples:

```txt
useExpenses.js
useCurrentCutoff.js
useDashboard.js
useSavings.js
useCashflow.js
useExpenseInbox.js
useBudgetShock.js
```

Hook responsibilities:

* Manage loading states
* Manage error states
* Call services and repositories
* Provide actions to components
* Trigger refreshes after mutations

Hook rules:

* Hooks may use React state.
* Hooks may use Zustand.
* Hooks should not contain raw formulas when those formulas belong in services.
* Hooks should not duplicate repository logic.

---

# State Management

Approved options:

* Zustand
* React Context for very small global state

Use Zustand for:

* UI preferences
* Sidebar state
* Current selected cutoff
* Temporary filters
* App-level non-persistent UI state

Do not use Zustand as the source of truth for financial records.

Financial records belong in:

```txt
IndexedDB
```

Zustand may cache or reference selected records, but must not replace Dexie persistence.

---

# Routing

Approved MVP routes:

```txt
/
 /dashboard
 /expenses
 /salary-cutoff
 /savings
 /cashflow
 /reports
 /expense-inbox
 /settings
```

Optional route redirect:

```txt
/ → /dashboard
```

Future routes after MVP:

```txt
/goals
/payback
/financial-health
```

---

# API Client Layer

Backend API access belongs in:

```txt
lib/api/
├── client.js
├── healthApi.js
├── aiApi.js
└── summaryApi.js
```

Rules:

* Components must not call Axios directly.
* Hooks may call API modules through services.
* API client must use environment variables.
* All API errors must be normalized.

Example:

```js
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
```

---

# Offline-First Frontend Behavior

Core features must work when backend is unavailable:

* Expenses
* Income
* Savings
* Salary Cutoff
* Dashboard
* Cashflow
* Reports
* Budget Shock Warning

AI-enhanced features must degrade gracefully.

Example:

If backend AI is unavailable:

```txt
Use rules-only parser
Use template-based summaries
Use local cashflow forecast logic
```

---

# Design System Rules

The UI must follow `design.md`.

Visual principles:

* Algorithmic Trust
* Corporate / Modern
* High-density layout
* Modern Excel influence
* Financial dashboard orientation

Typography:

* IBM Plex Sans for headings
* Inter for body text
* JetBrains Mono for currency, totals, timestamps, and numerical data

Color usage:

* Finance Blue for primary actions and active states
* Growth Green for positive financial indicators
* Orange for warning states
* Red for critical states

Rules:

* Do not introduce unrelated visual styles.
* Do not use playful/bubbly UI.
* Do not redesign Stitch screens without documented reason.
* Data tables must prioritize readability and density.
* Currency values must be right-aligned and monospaced.

---

# Form Handling

Use:

```txt
React Hook Form
+
Zod
```

Form responsibilities:

* Validate input
* Show field errors
* Prevent invalid persistence
* Normalize values before saving

Example validation rules:

Expense:

* amount is required
* amount must be greater than 0
* date is required
* categoryId is required
* source is required

Detected Expense:

* rawText is required when source is manual input
* confidence must be between 0 and 1
* status must be valid

---

# Error Handling

Frontend error types:

* Validation errors
* Repository errors
* API errors
* Unexpected UI errors

Required UI states:

* Loading
* Empty
* Error
* Success
* Pending review

Each feature should provide clear feedback.

Examples:

```txt
No expenses yet.
Unable to load expenses.
Expense saved.
Detected expense requires review.
```

---

# Performance Rules

The frontend must remain responsive with 10,000+ expenses.

Required practices:

* Use IndexedDB indexes
* Avoid loading all data unnecessarily
* Filter by cutoff/date where possible
* Memoize expensive dashboard calculations
* Paginate large lists
* Lazy-load heavy report pages
* Avoid recalculating charts on every render

Dashboard target:

```txt
< 2 seconds
```

Expense entry target:

```txt
< 10 seconds
```

---

# Accessibility Rules

Minimum requirements:

* Buttons must have readable labels
* Form inputs must have labels
* Colors must not be the only indicator of status
* Interactive elements must be keyboard accessible
* Tables must have readable headers
* Error messages must be visible and clear

---

# Feature-by-Feature Frontend Notes

## Dashboard

Folder:

```txt
features/dashboard/
```

Should compose:

* Cutoff summary
* Income summary
* Expense summary
* Savings summary
* Remaining cash
* Budget shock warning
* Insight preview
* Graph snippets

Do not calculate dashboard data inside the page component.

Use:

```txt
dashboardService.js
useDashboard.js
```

---

## Expenses

Folder:

```txt
features/expenses/
```

Should include:

* Expense form
* Expense list
* Expense filters
* Expense repository
* Expense schema

Must connect expenses to `cutoffId` when possible.

---

## Salary Cutoff

Folder:

```txt
features/salary-cutoff/
```

Should include:

* Cutoff setup
* Current cutoff detection
* Cutoff selector
* Cutoff calculations

Critical calculation:

```txt
Find active cutoff based on current date.
```

---

## Savings

Folder:

```txt
features/savings/
```

Should include:

* Savings form
* Savings list
* Savings totals
* Savings repository

Savings must be included in cashflow calculations.

---

## Cashflow

Folder:

```txt
features/cashflow/
```

Should calculate:

```txt
income - expenses - savings = availableCash
```

Also calculate:

* dailyBurnRate
* safeDailySpend
* projectedRemaining

---

## Reports

Folder:

```txt
features/reports/
```

Should include:

* Category report
* Daily spending report
* Cutoff trend
* Savings report
* Cashflow report

Charts must use local IndexedDB data.

---

## Expense Inbox

Folder:

```txt
features/expense-inbox/
```

Flow:

```txt
Detected → Review → Edit → Approve → Save
```

Detected expenses must never become real expenses without user review.

---

## Budget Shock

Folder:

```txt
features/budget-shock/
```

Should calculate:

* green
* yellow
* orange
* red

based on forecast risk.

Warnings must explain:

* level
* cause
* recommended action

---

## AI Insights

Folder:

```txt
features/ai-insights/
```

MVP may use template summaries first.

AI insight generation must use summarized financial data, not raw full history by default.

---

# Testing Expectations

Frontend test priorities:

* Repository tests
* Service tests
* Critical hooks
* Critical forms
* Dashboard calculations

Critical tests:

* Current cutoff detection
* Expense CRUD
* Savings CRUD
* Cashflow calculation
* Budget shock level calculation
* Detected expense approval flow

---

# Frontend Anti-Patterns

Avoid:

* Calling Dexie inside JSX components
* Calling Axios inside JSX components
* Putting calculations inside render blocks
* Duplicating business rules across features
* Creating feature-specific duplicate entities
* Storing persistent financial data only in Zustand
* Ignoring loading/error/empty states
* Hardcoding colors outside design tokens
* Creating new routes/features outside MVP scope

---

# Phase 0 Frontend Deliverables

Required in Phase 0:

* Vite React app
* Tailwind configured
* Design tokens mapped
* App router
* Layout shell
* Base UI components
* API client
* Health check integration
* Dexie foundation files
* Folder structure
* ESLint/Prettier

No business features should be implemented in Phase 0.

---

# Approval Rule

This document is approved only if it remains aligned with:

* 00-source-of-truth.md
* 03-domain-and-database.md
* design.md

Any frontend implementation that conflicts with those documents must be corrected.
