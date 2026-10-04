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

# 12.1 — Prompt Builder Architecture

Version: 1.0.0
Phase: Phase 11B.1

## Purpose

The Prompt Builder forms the boundary between PesoPilot's deterministic intelligence pipeline and the downstream AI explanation platform. It prepares structured, safety-governed, provider-independent prompt packages by selecting, minimizing, and serializing deterministic financial outputs.

The pipeline principle is:

```txt
Financial Records
       ↓
Deterministic Engines
       ↓
InsightBundle
       ↓
RecommendationBundle
       ↓
FinancialSummary
       ↓
Prompt Builder
       ↓
PromptPackage
       ↓
Future AI Provider
```

Core Rule:

```txt
AI explains.
PesoPilot decides.
```

## Authority Boundary

The Prompt Builder:

MAY:
* Select deterministic context from authoritative sources;
* Minimize context to aggregate metrics and active recommendations;
* Serialize deterministic context without altering financial truth;
* Add task instructions;
* Add immutable safety constraints;
* Compose provider-independent system and user prompts.

MUST NOT:
* Calculate or recompute financial truth;
* Recalculate totals, averages, percentages, or health scores;
* Generate recommendations;
* Reorder or filter recommendations beyond deterministic conflict outputs;
* Modify InsightBundle, RecommendationBundle, or FinancialSummary;
* Query the database or local storage;
* Call an AI provider or execute network requests.

## Deterministic Source Hierarchy

The Prompt Builder consumes three separate deterministic inputs, each authoritative for its own domain:

1. `InsightBundle` — Authoritative source for deterministic financial metrics across seven domains:
   * `health`
   * `income`
   * `expenses`
   * `savings`
   * `goals`
   * `cashflow`
   * `cutoff`
2. `RecommendationBundle` — Authoritative source for deterministic recommendation rankings and content. The Prompt Builder strictly ignores `insightBundle.recommendations` to prevent conflicting or stale recommendation representations.
3. `FinancialSummary` — Authoritative source for deterministic narrative sections and paragraphs. The Prompt Builder strictly ignores `insightBundle.summary`.

## Context Minimization

To preserve privacy and prevent hallucination, the Prompt Builder minimizes context before prompt composition:

* Excludes raw transactions, raw records, merchant-level history, and notes.
* Excludes domain-level diagnostics and rule breakdowns.
* Excludes domain-level evidence arrays and individual goal arrays.
* Income excludes `sourceBreakdown` and `primarySource`.
* Expenses excludes `largestExpense`, `largestMerchant`, `anomalies`, and `categoryDistribution`.
* Savings excludes `largestSavingsContribution`.
* Goals excludes `highestFundedGoal`, `goalsWithoutContributions`, and individual `goals`.
* Cutoff excludes `bestCutoff` and `worstCutoff`.
* Suppressed recommendations and group definitions in `RecommendationBundle` are omitted; only surviving ranked recommendations are included.
* FinancialSummary omits paragraph `variables`, `templateId`, and `evidence`, retaining only section structure, narrative text, and relationship keys (`relatedInsights`, `relatedRecommendations`).
* If a domain insight is missing or null in the source, it remains `null` in context. The Prompt Builder never fabricates placeholder values or defaults.

## PromptPackage Contract

The Prompt Builder outputs an immutable, deterministic `PromptPackage` conforming to version `1.0.0`:

```javascript
{
  version: '1.0.0',

  template: {
    id: 'financial-summary-explanation',
    version: '1.0.0',
  },

  task: 'financial-summary-explanation',

  systemPrompt: '',

  userPrompt: '',

  context: {
    version: '1.0.0',
    scope: '',
    sourceTimestamps: {
      insights: null,
      recommendations: null,
      summary: null,
    },
    financialSummary: {},
    recommendations: [],
    insights: {
      health: null,
      income: null,
      expenses: null,
      savings: null,
      goals: null,
      cashflow: null,
      cutoff: null,
    },
    conversationContext: null,
    memoryContext: null,
  },

  metadata: {
    language: 'en',
    contextVersion: '1.0.0',
    safetyVersion: '1.0.0',
  },
}
```

Determinism Requirement:
The `PromptPackage` contains no newly generated timestamps. Identical deterministic source inputs produce identical serialized outputs.

Provider Independence:
No provider-specific fields (e.g., `model`, `temperature`, `maxTokens`, `stream`, `apiKey`, `endpoint`) exist on `PromptPackage`. Those belong to downstream provider adapters.

## Template Registry

The template registry manages approved prompt task templates. The registry is frozen and immutable.
* Initial template: `financial-summary-explanation` (version `1.0.0`, task `financial-summary-explanation`).
* Purpose: Explain the supplied deterministic financial position in clear language without altering financial truth.
* Strict resolution: `getPromptTemplate(templateId)` retrieves templates and throws explicitly on unknown IDs. No silent fallback is permitted.
* Template instructions remain provider-agnostic and explicitly forbid financial calculations or inventing missing information.

## Safety Injection

Prompt safety instructions are injected via `injectSafetyInstructions`. Policy version: `1.0.0`.
The safety policy enforces eight immutable system rules:
1. Treat supplied PesoPilot deterministic context as the financial source of truth.
2. Do not recalculate totals, percentages, forecasts, health scores, risk levels, spending pace, cashflow, or recommendation rankings.
3. Do not invent financial facts, transactions, balances, goals, categories, income, expenses, savings, or recommendations.
4. Do not override, reorder, replace, or contradict deterministic recommendations.
5. If required information is unavailable, state that the available context is insufficient.
6. Do not claim to spend money, approve expenses, modify records, delete records, mark payments complete, or perform financial actions.
7. Do not provide investment advice, tax advice, legal advice, or loan recommendations.
8. Explain and contextualize. Do not become the financial decision engine.

No user-controlled string may override or displace these rules.

## Prompt Composition

The prompt composer generates:
* `systemPrompt`: Base PesoPilot role definition (narrow financial explanation assistant) combined with injected safety policy.
* `userPrompt`: Template task instructions followed by `DETERMINISTIC_CONTEXT_JSON:` containing formatted context JSON.

Serialization preserves raw values, negative signs, and recommendation ordering without rounding or formatting transformations.

## Prompt Validation

The validator `validatePromptPackage(promptPackage)` enforces package integrity:
* Verifies `version === '1.0.0'`.
* Verifies known template ID and version.
* Verifies non-empty system and user prompts.
* Verifies metadata (`language === 'en'`, `contextVersion === '1.0.0'`, `safetyVersion === '1.0.0'`).
* Verifies context structure, including the 7 insight domain keys and recommendation array.
* Enforces that `conversationContext` and `memoryContext` are strictly `null`.

Failed validation throws an explicit error and aborts build.

## Conversation and Memory Placeholders

`conversationContext` and `memoryContext` are reserved for future phases (Phase 11B.3 and Phase 11B.4). During Phase 11B.1, both fields MUST remain `null`. Validation explicitly rejects packages with non-null values for these fields.

## Explicit Non-Goals

Phase 11B.1 explicitly excludes:
* Calling any AI model or provider (local or cloud);
* Network requests or HTTP/SSE/WebSocket communication;
* Database writes or IndexedDB schema alterations;
* Conversation management, chat sessions, or message history;
* Memory retrieval, vector search, or persistence;
* Guardrail engine runtime checks, jailbreak detection, or response filtering;
* Financial calculations or recommendation generation;
* Cloud AI consent enforcement (evaluated at the provider gateway boundary before transmission).

---

# Approval Rule

This document is approved only if it remains aligned with:

* 00-source-of-truth.md
* 03-domain-and-database.md
* 05-backend-architecture.md

Any AI implementation that conflicts with those documents must be corrected.

