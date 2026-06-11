# AI Architecture

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md
* 01-product.md
* 02-roadmap.md
* 03-domain-and-database.md
* 05-backend-architecture.md

---

# Purpose

This document defines the official AI architecture for PesoPilot v1.0.

The AI system exists to help users:

* Understand spending
* Understand cashflow
* Categorize expenses
* Detect financial risks
* Forecast outcomes
* Generate insights

The AI system does NOT exist to make financial decisions on behalf of the user.

---

# AI Philosophy

PesoPilot follows:

```txt
AI as Advisor
```

not

```txt
AI as Decision Maker
```

The user remains in control.

AI may:

* Suggest
* Recommend
* Summarize
* Categorize
* Forecast

AI may not:

* Spend money
* Approve expenses
* Delete records
* Modify records automatically
* Mark payments as complete

---

# AI Authority Rules

All AI outputs are considered:

```txt
Suggestions
```

until approved by the user.

No AI-generated result may permanently alter financial records without explicit user action.

---

# AI Architecture Overview

```txt
User
 ↓
Frontend
 ↓
AI Service
 ↓
AI Strategy
 ↓
AI Adapter
 ↓
AI Provider
```

Example:

```txt
Expense Input
 ↓
ExpenseParserService
 ↓
AI Strategy
 ↓
Gemini Adapter
 ↓
Gemini
```

---

# AI Modes

PesoPilot supports three AI modes.

---

## Mode 1 — Rules Only

Default MVP Mode

No LLM required.

Uses:

* Merchant rules
* Category rules
* Budget rules
* Forecast formulas

Advantages:

```txt
Fast
Private
Offline
Free
Predictable
```

Disadvantages:

```txt
Limited flexibility
```

---

## Mode 2 — Local AI

Future Mode

Runs locally.

Examples:

```txt
Gemma
Qwen
DeepSeek
Llama
```

Through:

```txt
Ollama
```

Advantages:

```txt
Private
Offline
No API Cost
```

Disadvantages:

```txt
Higher hardware requirements
```

---

## Mode 3 — Cloud AI

Optional

Requires:

```txt
User Consent
```

Examples:

```txt
OpenAI
Gemini
Claude
```

Advantages:

```txt
Better reasoning
Better summaries
Better categorization
```

Disadvantages:

```txt
Internet required
Potential privacy concerns
API cost
```

---

# AI Consent Model

Cloud AI is:

```txt
Disabled by default
```

Before enabling:

User must acknowledge:

```txt
Financial data may be transmitted
to the selected AI provider.
```

Consent must be stored in:

```txt
settings.cloudAiConsent
```

from:

```txt
03-domain-and-database.md
```

---

# AI Feature Authority

Approved MVP AI features:

```txt
Expense Parsing
Local Categorization
AI Summary
Cashflow Forecast
Budget Shock Warning
```

No additional AI features are allowed in MVP.

---

# AI Feature 1

Expense Parsing

Phase:

```txt
Phase 9
```

Purpose:

Convert natural language into draft expenses.

Example Input:

```txt
Jollibee 250 lunch
```

Expected Output:

```json
{
  "merchant":"Jollibee",
  "amount":250,
  "category":"Food"
}
```

Important:

Output is NOT saved.

Output becomes:

```txt
detected_expenses
```

User must review and approve.

---

# Expense Parsing Pipeline

```txt
Raw Text
 ↓
Amount Detection
 ↓
Merchant Detection
 ↓
Category Detection
 ↓
Confidence Score
 ↓
Detected Expense
```

---

# AI Feature 2

Local Lifestyle Categorization

Phase:

```txt
Phase 10
```

Purpose:

Improve categorization accuracy.

Examples:

```txt
Jollibee → Food
Meralco → Utilities
Shopee → Shopping
GCash Cash In → Transfer
```

Primary source:

```txt
merchant_rules
```

Store from:

```txt
03-domain-and-database.md
```

---

# Categorization Priority

The system must attempt categorization in this order:

```txt
Merchant Rules
 ↓
Keyword Rules
 ↓
AI Provider
 ↓
Uncategorized
```

This minimizes AI cost.

---

# AI Feature 3

Monthly/Cutoff Summary

Phase:

```txt
Phase 11
```

Purpose:

Generate observations.

Examples:

```txt
Food spending increased by 18%.

Transportation spending remains stable.

Entertainment spending decreased.
```

---

# Summary Generation Inputs

Required:

```txt
Income
Expenses
Savings
Current Cutoff
Categories
```

Input data must be aggregated first.

Raw financial history should not be sent unnecessarily.

---

# Summary Output Types

Approved:

```txt
Observation
Recommendation
Trend
Warning
```

Not approved:

```txt
Investment Advice
Loan Advice
Tax Advice
```

---

# AI Feature 4

Cashflow Forecast

Phase:

```txt
Phase 12
```

Purpose:

Predict financial outcomes.

Examples:

```txt
Available Cash

Safe Daily Spend

Projected Remaining Cash

Potential Deficit
```

---

# Forecast Inputs

Required:

```txt
Income
Expenses
Savings
Current Date
Cutoff End Date
```

---

# Forecast Calculations

Forecast must remain deterministic.

Primary forecast logic belongs in:

```txt
cashflowService
forecastService
```

AI may enhance explanations.

AI must not replace calculations.

---

# Example Forecast

Input:

```txt
Income: 15000

Expenses: 7000

Savings: 2000

Days Remaining: 10
```

Output:

```txt
Available Cash: 6000

Safe Daily Spend: 600

Projected Remaining: 1200
```

---

# AI Feature 5

Budget Shock Warning

Phase:

```txt
Phase 13
```

Purpose:

Detect overspending risk.

---

# Approved Risk Levels

```txt
Green
Yellow
Orange
Red
```

Definitions:

Green:

```txt
Healthy
```

Yellow:

```txt
Monitor Spending
```

Orange:

```txt
Likely Overspending
```

Red:

```txt
Projected Deficit
```

---

# Budget Shock Inputs

Required:

```txt
Current Cashflow
Daily Burn Rate
Remaining Days
Cutoff End Date
```

---

# Budget Shock Output

Example:

```txt
Risk Level: Orange

Reason:
Food spending increased 35%.

Recommendation:
Reduce discretionary spending
by ₱1,500 before next cutoff.
```

---

# AI Providers

Supported:

```txt
OpenAI
Gemini
Claude
Ollama
```

Access must occur through:

```txt
Strategy
 ↓
Adapter
 ↓
Provider
```

Never call providers directly.

---

# Strategy Pattern

Purpose:

Allow provider switching.

Example:

```txt
AIProviderStrategy
 ├─ OpenAIStrategy
 ├─ GeminiStrategy
 ├─ ClaudeStrategy
 └─ LocalAIStrategy
```

---

# Adapter Pattern

Purpose:

Normalize provider APIs.

Example:

```txt
GeminiAdapter
ClaudeAdapter
OpenAIAdapter
OllamaAdapter
```

Output must be standardized before entering application logic.

---

# Prompt Engineering Rules

Prompts must:

* Be deterministic
* Avoid ambiguity
* Avoid requesting financial advice
* Focus on observations

Prompts should ask for:

```txt
Summary
Categorization
Forecast Explanation
Risk Explanation
```

Prompts must not ask for:

```txt
Investment Advice
Tax Advice
Legal Advice
Loan Recommendations
```

---

# AI Data Sharing Rules

Only share data required for the task.

Example:

For summary generation:

Send:

```txt
Category Totals
Income Total
Savings Total
```

Avoid sending:

```txt
Full historical records
Entire financial history
```

Unless absolutely necessary.

---

# AI Logging Rules

Never log:

```txt
Expense Notes
Expense Descriptions
Income Notes
Savings Notes
Raw Financial History
```

Logs may contain:

```txt
Provider Name
Execution Time
Success/Failure
```

---

# Error Handling

If AI fails:

Fallback to:

```txt
Rules Only Mode
```

The application must remain functional.

AI features must degrade gracefully.

---

# Future AI Features

Not part of MVP:

```txt
Financial Health Score
Financial Coach
Spending Personality
Goal Protection
Payback Verification
Receipt OCR Intelligence
```

These belong to future versions.

---

# MVP AI Success Metrics

Expense Categorization:

```txt
85%+
```

Forecast Accuracy:

```txt
80%+
```

Budget Shock Detection:

```txt
80%+
```

Summary Quality:

```txt
Actionable and understandable
```

---

# AI Anti-Patterns

Avoid:

```txt
Auto Approvals
Auto Deletions
Auto Modifications
Hidden AI Actions
Provider Lock-In
```

AI should remain:

```txt
Transparent
Explainable
Optional
User Controlled
```

---

# Approval Rule

This document is approved only if it remains aligned with:

* 00-source-of-truth.md
* 03-domain-and-database.md
* 05-backend-architecture.md

Any AI implementation that conflicts with those documents must be corrected.
