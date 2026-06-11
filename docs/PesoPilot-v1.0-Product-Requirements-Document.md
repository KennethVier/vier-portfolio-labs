# Product Requirements Document

## Product Name

PesoPilot

Version: 1.0

Derived From:

* 00-source-of-truth.md
* design.md

---

# Product Summary

PesoPilot is a privacy-first, local-first AI-powered financial management platform.

The application helps users:

* Track expenses
* Track income
* Track savings
* Manage salary cutoffs
* Understand cashflow
* Detect financial risks
* Receive AI-powered insights

while maintaining complete ownership of their financial data.

---

# Product Goals

The application should help users answer:

### Awareness

```txt
Where is my money going?
```

### Budgeting

```txt
Can I survive until my next salary?
```

### Forecasting

```txt
Am I likely to overspend?
```

### Insight

```txt
What spending habits are hurting me?
```

### Control

```txt
How can I improve my financial situation?
```

---

# Target Users

Primary:

* Salary earners
* Young professionals
* Budget-conscious individuals
* Privacy-conscious users

Secondary:

* Freelancers
* Students
* Small households

---

# Product Principles

## Privacy First

User financial data belongs to the user.

---

## Local First

Financial records are stored locally.

---

## Offline First

Core features must continue working without internet.

---

## AI as Advisor

AI provides:

* Suggestions
* Forecasts
* Summaries

AI never acts autonomously.

---

## User Control

Users approve all permanent financial records.

---

# Functional Requirements

## Expense Tracking

Users can:

* Create expenses
* Edit expenses
* Delete expenses
* Categorize expenses
* Assign payment methods
* Add notes

---

## Income Tracking

Users can:

* Record income
* Associate income with salary cutoffs
* View income history

---

## Savings Tracking

Users can:

* Record savings
* Track savings activity
* Include savings in cashflow calculations

---

## Salary Cutoff Management

Supported schedules:

* Semi-monthly
* Monthly
* Weekly
* Custom
* Irregular

---

## Dashboard

Dashboard must display:

* Income
* Expenses
* Savings
* Remaining Cash
* Budget Status
* AI Insights

---

## Reports

Reports must provide:

* Category Breakdown
* Spending Trends
* Cashflow Trends
* Budget Utilization

---

## Expense Review Inbox

Detected expenses must:

* Remain pending
* Be editable
* Require approval

before becoming official records.

---

## Local Lifestyle Categorization

The system should understand:

* Local merchants
* Local services
* Local transportation

without requiring AI.

---

## AI Summary

Generate:

* Monthly summaries
* Cutoff summaries
* Spending observations

---

## Cashflow Forecast

Estimate:

* Remaining cash
* Spending pace
* Risk level

---

## Budget Shock Warning

Detect:

* Unusual spending
* Overspending risks
* Budget exhaustion risks

---

# Non Functional Requirements

Performance:

* Dashboard < 2 seconds

Scale:

* 10,000+ expenses

Reliability:

* Offline operation

Security:

* No sensitive logs

Maintainability:

* Feature-based architecture

Privacy:

* Local-first storage
