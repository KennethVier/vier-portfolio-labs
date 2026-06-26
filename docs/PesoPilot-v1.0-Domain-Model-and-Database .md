# Domain Model and Database Authority

Version: 1.0

Derived From:

* 00-source-of-truth.md

Authority Level:

Database Authority

---

# Purpose

This document defines:

* Domain entities
* Business relationships
* Dexie stores
* Columns
* Indexes

This is the authoritative database design for MVP phases 0–13.

---

# Store: categories

Purpose:

Defines financial categories.

Fields:

```txt
id
name
type
icon
color
isSystem
createdAt
updatedAt
```

Indexes:

```txt
id
type
name
```

Examples:

```txt
Food
Transport
Bills
Shopping
Entertainment
```

---

# Store: income

Purpose:

Tracks money entering the user's control.

Fields:

```txt
id
amount
source
date
cutoffId
note
createdAt
updatedAt
```

Indexes:

```txt
id
cutoffId
date
```

---

# Store: expenses

Purpose:

Tracks money leaving the user's control.

Fields:

```txt
id
amount
merchant
categoryId
paymentMethod
date
cutoffId
emotionTag
note
source
createdAt
updatedAt
```

Indexes:

```txt
id
categoryId
cutoffId
merchant
date
```

---

# Store: savings

Purpose:

Tracks savings contribution transactions.

Fields:

```txt
id
amount
source
date
cutoffId
goalId
note
createdAt
updatedAt
```

Indexes:

```txt
id
cutoffId
goalId
date
```

---

# Store: savings_goals

Purpose:

Tracks lifetime savings objectives. Progress is derived from linked savings contributions and is not stored directly.

Fields:

```txt
id
name
targetAmount
targetDate
priority
status
note
createdAt
updatedAt
```

Indexes:

```txt
id
status
priority
targetDate
```

---

# Store: salary_cutoffs

Purpose:

Represents budgeting periods.

Fields:

```txt
id
name
type
startDate
endDate
expectedIncome
status
createdAt
updatedAt
```

Note:

```txt
Actual income is derived from Income Tracking records linked by cutoffId and should not be stored directly on salary cutoff entities.
```

Indexes:

```txt
id
type
startDate
endDate
status
```

---

# Store: budgets

Purpose:

Stores category budgets.

Fields:

```txt
id
cutoffId
categoryId
plannedAmount
spentAmountSnapshot
status
createdAt
updatedAt
```

Indexes:

```txt
id
cutoffId
categoryId
status
```

---

# Store: detected_expenses

Purpose:

Expense Review Inbox.

Fields:

```txt
id
rawText
amount
merchant
suggestedCategoryId
suggestedPaymentMethod
confidence
source
status
reviewedAt
createdAt
updatedAt
```

Indexes:

```txt
id
status
merchant
source
```

---

# Store: merchant_rules

Purpose:

Local merchant categorization.

Fields:

```txt
id
keyword
categoryId
paymentMethod
confidence
createdBy
createdAt
updatedAt
```

Indexes:

```txt
id
keyword
categoryId
```

---

# Store: ai_insights

Purpose:

Stores generated insights.

Fields:

```txt
id
type
cutoffId
title
content
severity
generatedFrom
createdAt
```

Indexes:

```txt
id
type
cutoffId
severity
```

---

# Store: cashflow_snapshots

Purpose:

Stores calculated cashflow states.

Fields:

```txt
id
cutoffId
totalIncome
totalExpenses
totalSavings
availableCash
dailyBurnRate
safeDailySpend
projectedRemaining
createdAt
```

Indexes:

```txt
id
cutoffId
createdAt
```

---

# Store: budget_shock_alerts

Purpose:

Stores financial risk alerts.

Fields:

```txt
id
cutoffId
level
message
causeCategoryId
projectedDeficit
recommendedAction
status
createdAt
resolvedAt
```

Indexes:

```txt
id
cutoffId
level
status
```

---

# Store: settings

Purpose:

Application preferences.

Fields:

```txt
id
currency
locale
aiMode
salaryMode
theme
cloudAiConsent
createdAt
updatedAt
```

Indexes:

```txt
id
```

---

# Official MVP Dexie Schema

```javascript
db.version(1).stores({
  categories: "id, name, type",
  income: "++id, cutoffId, date",
  expenses: "++id, cutoffId, categoryId, merchant, date",
  savings: "++id, cutoffId, goalId, date",
  savings_goals: "++id, status, priority, targetDate",
  salary_cutoffs: "++id, type, startDate, endDate",
  budgets: "++id, cutoffId, categoryId",
  detected_expenses: "++id, status, merchant",
  merchant_rules: "++id, keyword, categoryId",
  ai_insights: "++id, type, cutoffId",
  cashflow_snapshots: "++id, cutoffId",
  budget_shock_alerts: "++id, cutoffId, level",
  settings: "id"
});
```

---

# Entity Relationships

```txt
SalaryCutoff
├── Income
├── Expense
├── Savings
├── Budget
├── CashflowSnapshot
└── BudgetShockAlert
```

```txt
Category
└── Expense
```

```txt
SavingsGoal
└── Savings
```

```txt
ExpenseReview
└── Expense
```

```txt
MerchantRule
└── ExpenseReview
```

```txt
FinancialInsight
└── SalaryCutoff
```
