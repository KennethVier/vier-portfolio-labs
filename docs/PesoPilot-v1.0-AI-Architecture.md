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

Local Runtime Mode (Implemented in Phase 11B.3)

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
* Enforces that `conversationContext` is either null or a valid conversation context, and `memoryContext` is strictly `null`.

Failed validation throws an explicit error and aborts build.

## Conversation and Memory Placeholders

`conversationContext` is owned by Phase 11B.2 (Conversation Engine), and `memoryContext` is reserved for Phase 11B.5 (Memory Service). In Phase 11B.1, both fields were required to be null. In Phase 11B.2, `conversationContext` is accepted and validated as untrusted conversational context, while `memoryContext` remains strictly null.

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

# 12.2 — Conversation Engine Architecture

Version: 1.0.0
Phase: Phase 11B.2

## Purpose

The Conversation Engine manages conversational state and continuity for PesoPilot. It sits between user conversational turns and the Prompt Builder, maintaining ephemeral session state, message history, topic tracking, and clarification requirements.

The pipeline flow is:

```txt
User Message
     ↓
Conversation Engine
     ↓
Conversation State (Session, Messages, Topic, Clarification)
     ↓
Conversation Context Builder
     ↓
conversationContext
     ↓
Prompt Builder (selectPromptContext)
     ↓
PromptPackage
```

Core Rule:

```txt
AI explains.
PesoPilot decides.
```

## Authority Boundary

The Conversation Engine:

MAY:
* Maintain in-memory conversational session lifecycle;
* Track conversation topic across 10 allowed domains;
* Model clarification requirements when structured intent is ambiguous or context is missing;
* Record user and assistant dialogue messages in chronological order;
* Extract and bound conversation context into a minimized, prompt-facing DTO;
* Perform pure validation of conversation structures.

MUST NOT:
* Calculate financial metrics or evaluate financial rules;
* Alter or reorder deterministic recommendations;
* Execute LLM or provider requests;
* Persist conversations to IndexedDB, Dexie, or backend storage (deferred to Phase 11B.5);
* Implement long-term memory, cross-session recall, or vector search;
* Automatically classify topics or generate clarification prose using heuristic NLP or LLMs.

## Determinism & Clock Policy

All Conversation Engine transformations are strictly deterministic. The engine does NOT call:
* `new Date()`
* `Date.now()`
* `crypto.randomUUID()`
* `Math.random()`

All timestamps (`createdAt`, `updatedAt`, `startedAt`, `endedAt`) and IDs (`conversationId`, `messageId`) are caller-supplied valid ISO-8601 UTC strings. Identical inputs yield identical serialized outputs.

## Conversation DTO

The Conversation aggregate represents the in-memory state of an active dialogue turn:

```javascript
{
  version: '1.0.0',
  conversationId: 'conv_123',
  session: {
    status: 'active',
    startedAt: '2026-10-04T12:00:00.000Z',
    endedAt: null,
  },
  messages: [],
  topicState: {
    current: 'general',
    previous: null,
    updatedAt: '2026-10-04T12:00:00.000Z',
  },
  clarificationState: {
    required: false,
    reason: null,
    missingFields: [],
  },
  createdAt: '2026-10-04T12:00:00.000Z',
  updatedAt: '2026-10-04T12:00:00.000Z',
}
```

* `conversationId`: The single aggregate and current-session identity.
* Ephemeral: State is in-memory only; no persistence in Phase 11B.2.
* Immutability: Conversation state and transitions return frozen objects (`Object.freeze`).

## Session Model

Lifecycle metadata for conversational engagement:
* Status: `active` or `closed` (`SESSION_STATUSES`).
* Invariant: `active` sessions require `endedAt === null`; `closed` sessions require caller-supplied `endedAt`.
* Scope: Contains no financial data, model parameters, or API credentials.

## Message Model

Canonical message item:
* Allowed roles: Strictly `'user'` and `'assistant'` (`MESSAGE_ROLES`). `'system'`, `'developer'`, `'tool'`, and `'function'` roles are strictly forbidden.
* Character bound: Maximum 4,000 characters per message (`MAX_MESSAGE_CHARACTERS = 4000`).
* Content preservation: Validates `content.trim().length > 0` but preserves original untrimmed `content`.
* Sequence: Strictly increasing 1-indexed integers (1, 2, 3...) guaranteeing deterministic order.

## Topic Model

Deterministic state tracking across 10 allowed domains (`CONVERSATION_TOPICS`):
1. `general`
2. `summary`
3. `recommendations`
4. `health`
5. `income`
6. `expenses`
7. `savings`
8. `goals`
9. `cashflow`
10. `cutoff`

The engine does not guess or infer topics via NLP or keyword matching; topic is explicitly caller-supplied. If intent is unresolvable, clarification state is used rather than an imaginary topic.

## Clarification Model

Deterministic state modeling for missing context or ambiguous caller intent:
* Canonical schema: `{ required: boolean, reason: string | null, missingFields: string[] }`.
* Allowed reasons: `missing_financial_context`, `ambiguous_intent`, `unsupported_topic` (`CLARIFICATION_REASONS`).
* No silent repair: `required: false` strictly forbids non-null reason or non-empty `missingFields`.
* No prose generation: The manager models state only; generating clarification dialogue is caller/UI responsibility.

## Conversation Context & Minimization

Prompt-facing DTO built by `buildConversationContext`:

```javascript
{
  version: '1.0.0',
  topic: {
    current: 'expenses',
  },
  clarification: {
    required: false,
    reason: null,
    missingFields: [],
  },
  recentMessages: [
    {
      role: 'user',
      content: 'Why did my expenses increase this cutoff?',
    },
    {
      role: 'assistant',
      content: 'Your food spending increased by 20%.',
    },
  ],
}
```

* Data Minimization: Strips `conversationId`, `sessionId`, timestamps, message IDs, sequence numbers, and previous topics.
* Bounded History: Retains strictly the **last 10 messages** (`MAX_RECENT_MESSAGES = 10`) in chronological order.
* Size Bound: 10 messages × 4,000 source characters bounds raw conversational content to at most 40,000 source characters.

## Structural Trust Separation in Prompt Builder

To defend against prompt injection and prevent untrusted user dialogue from impersonating deterministic financial facts:
1. `promptComposer.js` outputs two structurally distinct sections in `userPrompt`:
   * `DETERMINISTIC_FINANCIAL_CONTEXT_JSON:` containing financial summary, recommendations, and domain insights.
   * `UNTRUSTED_CONVERSATION_CONTEXT_JSON:` containing minimized conversation context.
2. `memoryContext` is explicitly excluded from `DETERMINISTIC_FINANCIAL_CONTEXT_JSON`.
3. If `conversationContext` is null, the untrusted section is omitted entirely.
4. User messages can never override system instructions, safety policy, financial calculations, or recommendation rankings.

## Memory Boundary

* `conversationContext` = current-session conversational continuity.
* `memoryContext` = strictly `null` in Phase 11B.2.
* Memory persistence, cross-session recall, IndexedDB storage, vector search, and ranking are deferred to Phase 11B.5 (Memory Service).

## Security & Privacy Limitations (OWASP Baseline)

* **What 11B.2 Does**: Enforces structural trust separation, disallows system roles, bounds message count (10) and character length (4,000), and excludes raw financial records.
* **What 11B.2 Does NOT Do**: Does NOT perform prompt injection detection, jailbreak classification, PII redaction, or response moderation. User messages may contain sensitive personal data; sanitization belongs to Guardrails (Phase 11B.6).

## Explicit Non-Goals

Phase 11B.2 explicitly excludes:
* LLM or provider invocations (Ollama, OpenAI, Gemini, Claude);
* AI Gateway execution or orchestration workflows;
* Long-term memory or IndexedDB persistence;
* Guardrails runtime engine or jailbreak detection;
* Spring Boot AI REST API, SSE, WebSockets, or streaming;
* AI Chat UI components;
* Modifying deterministic finance engines or database schemas.

---

# 12.3 — Ollama Integration Architecture

Version: 1.0.0
Phase: Phase 11B.3

## Purpose

The Ollama Integration Architecture defines the provider transport boundary between PesoPilot's Prompt Builder and the local Ollama LLM runtime. It isolates vendor-specific HTTP communication behind the stable LLM Adapter Interface and Provider Registry abstractions.

The pipeline flow is:

```txt
Deterministic Financial Intelligence
        ↓
Prompt Builder
        ↓
PromptPackage
        ↓
ProviderRequest
        ↓
Provider Registry
        ↓
LLM Adapter (Ollama)
        ↓
Locality Preflight (POST /api/show)
        ↓
POST /api/generate (stream: false)
        ↓
ProviderResponse + ProviderDiagnostics
```

Core Rule:

```txt
AI explains.
PesoPilot decides.
```

## Authority Boundary

The Provider Layer:

MAY:
* Validate ProviderRequest, ProviderResponse, and ProviderDiagnostics contracts;
* Verify model execution locality via prompt-free preflight requests;
* Serialize approved PromptPackage contents into Ollama `/api/generate` payloads;
* Transmit requests to validated loopback endpoints;
* Normalize raw provider completion data into canonical ProviderResponse and ProviderDiagnostics DTOs;
* Emit sanitized ProviderError instances on transport or validation failures.

MUST NOT:
* Calculate financial truth or modify financial metrics;
* Generate, alter, or reorder deterministic recommendations;
* Reinterpret InsightBundle, RecommendationBundle, or FinancialSummary;
* Persist financial records or dialogue history;
* Perform retry, fallback, provider switching, or workflow orchestration (owned by Phase 11B.4);
* Implement streaming, SSE, or token buffering (owned by Phase 11B.8);
* Implement guardrail policy moderation or prompt injection classification (owned by Phase 11B.6).

## Determinism & Request Integrity

* Creating a ProviderRequest from identical PromptPackage and model configurations produces identical serialized DTOs.
* ProviderRequest contains no random UUIDs, request IDs, or timestamps.
* Downstream transport configurations (such as baseUrl or transport timeouts) remain isolated in ProviderConfig and are never mixed into ProviderRequest.

## LLM Adapter Contract

All LLM adapters implement the minimal enforceable contract:

```javascript
{
  id: 'ollama',
  locality: 'local',
  generate(providerRequest, providerConfig) -> Promise<ProviderResponse>
}
```

Enforced at registration via `assertAdapterContract(adapter)`:
* `adapter` must be an object.
* `id` must be a non-empty string.
* `locality` must be `'local'` or `'cloud'`.
* `generate` must be an asynchronous function.

## Provider Registry

An immutable, static registry managing available adapters:
* `getProviderAdapter(providerId)`: Resolves adapter by ID; throws `ProviderError('UNKNOWN_PROVIDER')` for unknown IDs. No silent fallback.
* `getProviderDescriptor(providerId)`: Returns frozen `{ id, locality, status: 'active' }`.
* `listProviderDescriptors()`: Lists all registered descriptors.
* Initial registered provider: strictly `ollama`. No cloud providers (OpenAI, Gemini, Claude are excluded in Phase 11B.3).

## Data Contracts (DTOs)

### ProviderRequest
* `version`: `'1.0.0'`
* `providerId`: `'ollama'`
* `model`: Single required source of truth (caller-supplied non-empty string).
* `prompt.system`: Mapped directly from `PromptPackage.systemPrompt`.
* `prompt.user`: Mapped directly from `PromptPackage.userPrompt`.
* `generation.stream`: Strictly `false`.

### ProviderResponse
* `version`: `'1.0.0'`
* `providerId`: `'ollama'`
* `model`: Model name returned by provider.
* `content`: Non-empty completion string.
* `finishReason`: Canonical `done_reason` from Ollama, or `null`. Does NOT synthesize or default to `'stop'`.
* `diagnostics`: Associated `ProviderDiagnostics` DTO.
* Strictly excludes: `thinking`, raw HTTP bodies, context token arrays, PromptPackage, or financial records.

### ProviderDiagnostics
* `version`: `'1.0.0'`
* `providerId`: `'ollama'`
* `model`: Model identifier.
* `totalDurationNs`: Ollama `total_duration` (explicit nanosecond unit).
* `loadDurationNs`: Ollama `load_duration` (explicit nanosecond unit).
* `promptEvalCount`: Ollama `prompt_eval_count` (tokens).
* `evalCount`: Ollama `eval_count` (tokens).
* Contains safe operational metrics only. Excludes prompt text, conversation text, financial context, and error states.

## Transport & Egress Security

### Loopback-Only Policy
* `baseUrl` is validated using standard `URL` parsing.
* Protocol must be strictly `http:`.
* Hostname must be strictly loopback: `127.0.0.1`, `localhost`, `::1`, or `[::1]`.
* Rejects remote domains, public IPs, private LAN addresses, credentials, queries, fragments, or path components with `INSECURE_ENDPOINT_REJECTED`.

### Critical Locality Verification: Loopback != Guaranteed Local Inference
* A loopback URL alone does not guarantee local model inference because modern Ollama can proxy cloud/remote models through the local daemon when signed in.
* **Pre-flight Locality Check**: Before transmitting any financial prompt data, the adapter executes `POST /api/show` with payload `{ model }`.
* The pre-flight request contains ONLY the model identifier; zero prompt or financial text is transmitted.
* If `remote_host` or `remote_model` is present in the response, execution is immediately aborted with `ProviderError('REMOTE_MODEL_REJECTED')`.
* If locality cannot be determined safely, it is rejected with `ProviderError('UNKNOWN_LOCALITY_REJECTED')`.
* PesoPilot determines Ollama execution locality using explicit `remote_host` / `remote_model` metadata, not model naming conventions or weight formats.
* `OLLAMA_NO_CLOUD=1` is recommended defense-in-depth, but programmatic verification remains the application security authority.

### Browser Transport & Redirect Security
* Standardized on browser-native `fetch` with `redirect: 'error'`.
* Any HTTP 3xx redirect to an external host is rejected immediately as a network error, preventing redirect-based prompt exfiltration.
* Low-level socket ceiling enforced via `AbortSignal.timeout(transportTimeoutMs)`.

### CORS & Browser Local Network Caveats
* Local development origins (`http://localhost:<port>`, `http://127.0.0.1:<port>`) are permitted by Ollama's default configuration.
* Hosted frontend deployments require Ollama to be started with explicit trusted origins: `OLLAMA_ORIGINS="https://trusted.pesopilot.domain"`. Wildcard origins (`*`) are strictly discouraged.
* Browser Private Network Access (PNA) restrictions may require user permission to access loopback from secure contexts.

## Error Handling & Privacy

* Failures throw typed `ProviderError` instances with standardized codes:
  * `INVALID_REQUEST`
  * `UNKNOWN_PROVIDER`
  * `INVALID_PROVIDER_CONFIG`
  * `INSECURE_ENDPOINT_REJECTED`
  * `PROVIDER_UNAVAILABLE`
  * `TRANSPORT_TIMEOUT`
  * `MODEL_NOT_FOUND`
  * `REMOTE_MODEL_REJECTED`
  * `UNKNOWN_LOCALITY_REJECTED`
  * `PROVIDER_REJECTED_REQUEST`
  * `INVALID_PROVIDER_RESPONSE`
  * `TRANSPORT_ERROR`
* `ProviderError` exposes only safe, sanitized metadata (`code`, `providerId`, `model`, `status`, `message`).
* Raw request payloads, response bodies, `PromptPackage` strings, and financial context are NEVER stored in error objects or logged to console.
* HTTP 404 is mapped to `MODEL_NOT_FOUND` only when Ollama's error message specifically indicates missing model weights; otherwise mapped to generic `PROVIDER_REJECTED_REQUEST`.

---

# 12.4 — AI Orchestration Engine Architecture

Version: 1.0.0
Phase: Phase 11B.4

## Purpose

The AI Orchestration Engine coordinates deterministic financial intelligence, workflow templates, Prompt Builder (Phase 11B.1), Conversation Context (Phase 11B.2), and the Provider Layer / Ollama (Phase 11B.3) under strict timeout, bounded retry, and privacy-safe diagnostic policies.

Core Rule:

```txt
AI explains.
PesoPilot decides.
```

## Pipeline Flow

```txt
InsightBundle
RecommendationBundle
FinancialSummary
ConversationContext?
        ↓
AI Orchestrator (aiOrchestrator.executeWorkflow)
        ↓
Workflow Template (workflowTemplates)
        ↓
Prompt Builder (promptBuilder.build)
        ↓
PromptPackage
        ↓
ProviderRequest (providerLayer.createProviderRequest)
        ↓
Provider Registry (providerLayer.getProvider)
        ↓
LLM Adapter (ollamaAdapter)
        ↓
Timeout + Retry Policy (timeoutManager + retryManager)
        ↓
Ollama Runtime (POST /api/show + POST /api/generate)
        ↓
ProviderResponse
        ↓
Workflow Result ({ workflow, response })
```

## Authority Boundary

The AI Orchestrator:

MAY:
* Coordinate approved services (Prompt Builder, Conversation Context, Provider Layer);
* Select approved workflow templates from the immutable template registry;
* Enforce workflow execution deadlines via master `AbortController`;
* Propagate cancellation signals to active provider transport requests;
* Apply bounded, deterministic retry policy (maximum 2 attempts, zero jitter);
* Collect privacy-safe workflow diagnostics (operational timing, status, error code);
* Return normalized workflow results `{ workflow, response }` on success;
* Throw typed `WorkflowError` with attached safe diagnostics on failure.

MUST NOT:
* Calculate financial truth or modify deterministic metrics;
* Generate, alter, or reorder deterministic recommendations;
* Reinterpret InsightBundle, RecommendationBundle, or FinancialSummary;
* Fabricate synthetic AI fallback text upon workflow failure;
* Persist financial records or dialogue history;
* Perform automatic provider switching or fallback LLM invocation;
* Implement guardrail moderation, PII scanning, or jailbreak classification (owned by Phase 11B.6);
* Implement long-term memory, cross-session recall, or vector search (owned by Phase 11B.5).

## AI Workflow DTO & Lifecycle State Transitions

The `AIWorkflow` DTO represents orchestration lifecycle metadata only. It strictly excludes prompt strings, provider requests/responses, conversation history, and financial metrics.

```javascript
{
  version: '1.0.0',
  workflowId: 'wf-123',
  template: {
    id: 'financial-summary-explanation',
    version: '1.0.0',
  },
  task: 'financial-summary-explanation',
  provider: {
    id: 'ollama',
    model: 'llama3.2',
  },
  status: 'pending', // 'pending' | 'running' | 'succeeded' | 'failed' | 'timed_out'
  attempt: 0,        // 0 (pending), 1 (initial attempt), 2 (single retry)
  startedAt: null,   // ISO string timestamp
  completedAt: null, // ISO string timestamp
  diagnostics: null, // WorkflowDiagnostics DTO or null
}
```

### Allowed Lifecycle Transitions

```txt
pending → running
running → running (attempt increment from 1 to 2)
running → succeeded
running → failed
running → timed_out
```

All other transitions (e.g. `succeeded` → `running`, `failed` → `succeeded`, `timed_out` → `running`) are strictly rejected with `WorkflowError('INVALID_WORKFLOW_STATE')`.

## Workflow Template Registry

An immutable, provider-independent registry in `workflowTemplates.js`:
* `financial-summary-explanation`: Initial template mapping orchestration task to Prompt Builder template ID.
* Templates contain zero provider names, models, loopback URLs, timeouts, or credentials.
* Unknown template IDs throw `WorkflowError('UNKNOWN_WORKFLOW_TEMPLATE')`.

## Workflow Manager & Service Coordinator Separation

* **Workflow Manager (`workflowManager.js`)**: Pure synchronous state and lifecycle manager. Implements state transitions, validates DTO shapes, and increments attempts. Contains no network, timers, or retry logic.
* **Service Coordinator (`serviceCoordinator.js`)**: Coordinates external dependencies, enforces deadlines, manages retry loops, invokes Prompt Builder, and interacts with Provider Layer.

## Timeout Manager & Abort Propagation

* **Two Timeout Tiers**:
  * Low-level socket transport ceiling (`transportTimeoutMs`, default 30,000ms, owned by Phase 11B.3).
  * Overall workflow execution deadline (`workflowTimeoutMs`, default 45,000ms, owned by Phase 11B.4).
* **Abort Signal Propagation**:
  1. `TimeoutManager` creates a master `AbortController`.
  2. If deadline expires, `controller.abort()` fires.
  3. `providerConfig.signal` propagates the abort signal to `ollamaAdapter` and `defaultFetchTransport`.
  4. Native `fetch` receives the signal and aborts the active browser HTTP request.

When the overall workflow deadline expires, PesoPilot aborts the active provider HTTP request through the propagated AbortSignal.

The orchestrator does not begin another attempt until the aborted provider invocation has rejected through the Provider Layer.

This prevents PesoPilot from intentionally overlapping workflow attempts or accepting stale results after the workflow deadline.

PesoPilot does not claim a hardware-level guarantee that Ollama model or GPU execution has stopped at the exact instant the browser request is aborted.

## Retry Policy & ProviderError Retryability Matrix

* **Attempt Limit**: Maximum 2 attempts (1 initial + at most 1 retry).
* **Retry Delay**: Fixed 0ms for MVP (deterministic, zero jitter).
* **Error Retryability Matrix**:

| Provider Error Code | Retryable? | Rationale |
| :--- | :---: | :--- |
| `INVALID_REQUEST` | NO | Request schema violation. Identical payload will fail again. |
| `UNKNOWN_PROVIDER` | NO | Configuration error; provider ID not registered. |
| `INVALID_PROVIDER_CONFIG` | NO | Invalid URL or configuration parameters. |
| `INSECURE_ENDPOINT_REJECTED` | NO | Security policy violation; non-loopback host rejected. |
| `MODEL_NOT_FOUND` | NO | Missing model weights in Ollama daemon. |
| `REMOTE_MODEL_REJECTED` | NO | Security policy violation; model hosted remotely. |
| `UNKNOWN_LOCALITY_REJECTED` | NO | Security policy violation; locality unverified. |
| `INVALID_PROVIDER_RESPONSE` | NO | Malformed response structure from provider. |
| `PROVIDER_REJECTED_REQUEST` | NO | Provider application error (HTTP 4xx/5xx). |
| `PROVIDER_UNAVAILABLE` | YES | Transient network or daemon startup issue. |
| `TRANSPORT_TIMEOUT` | YES | Transient transport socket timeout on individual attempt. |
| `TRANSPORT_ERROR` | YES | Transient socket/network-level exception. |

### Abort Error Precedence

Workflow timeout has precedence over retry classification.
No retry occurs after the master workflow signal has aborted.

If the master workflow `AbortSignal` is aborted, the failure is unconditionally classified as `WORKFLOW_TIMEOUT` and NO retry is scheduled, even if the underlying transport raised `TRANSPORT_TIMEOUT`.

### Deadline Clamping

Before each attempt:
```javascript
remainingMs = deadlineMs - clock.nowMs()
attemptTransportTimeoutMs = Math.min(configuredTransportTimeoutMs, remainingMs)
```
If `remainingMs <= 0`, no attempt begins and the workflow terminates as `WORKFLOW_TIMEOUT`.

## Workflow Diagnostics & Error Privacy

* `WorkflowDiagnostics` DTO contains safe operational primitives only: `workflowId`, `templateId`, `providerId`, `model`, `status`, `attempts` (1 or 2), `durationMs` (non-negative integer), and `finalErrorCode` (string or null).
* `WorkflowError` exposes safe metadata (`code`, `workflowId`, `templateId`, `providerId`, `model`, `diagnostics`, `workflow`, and sanitized `message`). It retains no raw `cause` objects, prompts, completions, or financial metrics.

## Graceful Degradation to Deterministic Intelligence

If the AI workflow fails or times out, PesoPilot does not fabricate an AI replacement response and does not invoke another provider.

The deterministic InsightBundle, RecommendationBundle, and FinancialSummary produced by Phase 11A remain valid and available to the caller/UI.

Therefore AI failure does not make PesoPilot's deterministic financial intelligence unavailable.

Phase 11B.4 does not implement a separate fallback engine or fallback provider.

When a workflow fails or times out:
* The orchestrator throws typed `WorkflowError` with diagnostics and terminal workflow state attached.
* The orchestrator does NOT fabricate replacement AI text or invoke secondary providers.
* Phase 11A deterministic financial intelligence (`FinancialSummary`, `RecommendationBundle`, `InsightBundle`) remains intact and unmodified.
* The application continues displaying deterministic financial intelligence without degradation of core financial features.

## Memory & Guardrail Boundaries

* `memoryContext` is coordinated by the AI Orchestrator and formatted into `UNTRUSTED_MEMORY_CONTEXT_JSON` by the Prompt Builder (Phase 11B.5).
* Guardrails (prompt injection defense, PII scanning, moderation) remain pass-through boundaries (Phase 11B.6).

## Explicit Non-Goals

Phase 11B.4 explicitly excludes:
* Long-term conversation memory or vector search (Phase 11B.5);
* Guardrail engine runtime or jailbreak classification (Phase 11B.6);
* Spring Boot AI REST API controllers (Phase 11B.7);
* Streaming, SSE, or WebSocket transports (Phase 11B.8);
* AI evaluation testing harness (Phase 11B.9);
* Cloud LLM provider execution (OpenAI, Gemini, Claude);
* Modifying deterministic finance engines or database schemas.

---

# 12.5 — Conversation Memory Architecture

Version: 1.0.0
Phase: Phase 11B.5

## Purpose & Core Philosophy

The Memory Service manages curated, qualitative personalization context across AI workflows.

Core Rules:

```txt
AI explains.
PesoPilot decides.
```

And:

```txt
Memory is curated contextual knowledge,
not conversation history
and not financial truth.
```

Conversation Engine (Phase 11B.2) owns active dialogue, recent message history, turn sequencing, and clarification states. The Memory Service owns curated, cross-workflow qualitative preferences and confirmed user context. Memory never stores complete conversation transcripts.

## Authority Boundary: Contextual Knowledge vs. Financial Truth

Memory is strictly qualitative personalization context (e.g., communication style, coaching preference, confirmed user context).

Memory MUST NOT become authoritative for:
* Account balances or remaining cash;
* Income, expense, or savings totals;
* Cutoff calculations, budgets, or goal progress;
* Health scores or financial shock risk levels;
* Deterministic recommendation ranking or financial summaries;
* Transaction history.

If memory content contradicts deterministic financial artifacts (`InsightBundle`, `RecommendationBundle`, `FinancialSummary`), the deterministic financial artifacts remain strictly authoritative.

## Persistence Boundary: Caller-Owned / Stateless Memory State

Phase 11B.5 defines caller-owned curated memory state and workflow-specific Memory Context. Persistence is not implemented in this phase.

* **No new Dexie stores**: The authoritative 13-store database schema (`docs/PesoPilot-v1.0-Domain-Model-and-Database .md`) is unchanged.
* **No database migrations or schema version bumps**: `db.version(1)` is strictly preserved.
* **No store repurposing**: Neither `ai_insights` nor `settings` are repurposed for conversational memory.
* **No Memory Repository**: Memory state is owned by the caller (application state, UI feature store, or orchestration caller) and passed as an immutable `MemoryDTO`.
* **No durable persistence claims**: Phase 11B.5 implements memory evaluation, retrieval, ranking, and context injection contracts; it does not persist memories across browser sessions or sync them across devices.

## Domain Model & Data Contracts

### 1. Memory DTO
Represents the caller-supplied collection of curated qualitative records:

```javascript
{
  version: '1.0.0',
  records: [
    {
      memoryId: 'mem-1728000000000-a1b2c3d4',
      type: 'communication_preference',
      content: 'User prefers concise cutoff explanations.',
      topics: ['general', 'cutoff'],
      workflowTypes: ['financial-summary-explanation'],
      importance: 'medium',
      source: {
        type: 'user',
        referenceId: null,
      },
      createdAt: '2026-10-05T00:00:00.000Z',
    },
  ],
}
```

* Duplicate `memoryId` entries are strictly rejected (no silent deduplication during DTO creation).
* All records and array fields are deep/shallow frozen upon creation.
* Prohibited fields: `confidence`, `status`, `expiresAt`, `updatedAt`, `lastUsed`, `usageFrequency`, `collectionId`, `knowledgeProfile`, `embedding`, and `vector` are excluded from the MVP MemoryRecord.

### 2. Allowed Memory Types
Whitelisted MVP types:
* `communication_preference`: Tone, brevity, and presentation preferences (e.g., bulleted summaries).
* `coaching_preference`: Guidance style and motivation focus (e.g., prioritize debt elimination).
* `user_preference`: User-stated lifestyle habits or preferences.

Broad categories (e.g., `financial_fact`, `financial_goal`, `financial_behavior`, `confirmed_context`) are strictly excluded to prevent competing financial authority.

### 3. Explicit Candidate Contract & User Confirmation
Memory Evaluator requires a structured candidate with explicit confirmation:

```javascript
{
  type: 'communication_preference',
  content: 'User prefers bulleted summaries.',
  topics: ['general'],
  workflowTypes: ['financial-summary-explanation'],
  explicitlyConfirmed: true, // Strictly required
  importance: 'medium',      // 'high' | 'medium' | 'low'
  source: {
    type: 'user',            // Strictly required
    referenceId: null,
  },
}
```

Assistant-authored text, provider completions, and unconfirmed dialogue are never automatically promoted into memory.

## Evaluation & Policy Management

* **Memory Evaluator (`memoryEvaluator.js`)**: Pure, deterministic evaluator. Enforces structural and policy validity: object shape, allowed memory type, user source, explicit confirmation (`true`), content length (`1 <= length <= 300`), allowed topics (from Conversation Engine topic taxonomy), and allowed workflow type (`financial-summary-explanation`).
* **Fixed Memory Policy (`memoryPolicy.js`)**: Immutable policy definition (`DEFAULT_MEMORY_POLICY`). Enforces maximum content length (300), maximum retrieved items (5), and maximum total context characters (1500). Runtime policy overrides that bypass approved limits are prohibited.
* **No Semantic NLP Detection**: The Evaluator does not parse free text with heuristic regexes or keyword matching to detect financial claims. Semantic safety analysis is deferred to Guardrails (Phase 11B.6).

## Deterministic Retrieval & Ranking Pipeline

1. **Retrieval (`memoryRetriever.js`)**:
   - Query: `{ workflowType: string, topic?: string }`.
   - Records must match the query `workflowType`.
   - Topic matching: If `query.topic === 'general'`, only records explicitly assigned to `general` match. If `query.topic !== 'general'`, records matching `query.topic` OR `general` match. Unrelated topics are excluded.
2. **Ranking (`memoryRanker.js`)**:
   - Deterministic 4-tier sort:
     1. Exact topic match ranks before `general` (when `query.topic !== 'general'`);
     2. Importance: `high` > `medium` > `low`;
     3. Recency: `createdAt` descending (newest first);
     4. Final tie-break: `memoryId` ascending (lexicographical).
3. **Memory Context Construction (`memoryContext.js`)**:
   - Caps item count at 5 (`maxRetrievedItems`).
   - Caps individual item content at 300 chars (`maxContentLength`).
   - Caps total item content characters at 1500 chars (`maxTotalContextChars`). Excludes whole lower-ranked items once the ceiling is reached (no silent truncation).
   - Deduplicates identical `memoryId`s and exact normalized content (`trim()`, lowercase, exact equality), preserving the highest-ranked item.
   - Minimizes output to `{ version: '1.0.0', items: [{ type, content }] }`. Internal IDs, timestamps, sources, and importance are never exposed to the LLM.
   - Returns `null` when no relevant memories match.

## Prompt Builder Integration & Trust Separation

* **Prompt Builder Input**: Accepts optional `memoryContext = null`.
* **Validation Before Minimization**: `buildPromptPackage` validates `memoryContext` via `validateMemoryContext` before cloning in `contextSelector.js`. Malformed context fails immediately with descriptive errors.
* **Structural Trust Separation**:
  - `DETERMINISTIC_FINANCIAL_CONTEXT_JSON`: Strictly financial data only. Conversation and memory contexts are stripped before serialization.
  - `UNTRUSTED_CONVERSATION_CONTEXT_JSON`: Active dialogue context (if present).
  - `UNTRUSTED_MEMORY_CONTEXT_JSON`: Curated memory context (if present).
* **Memory Absence**: If `memoryContext` is `null` or empty, `UNTRUSTED_MEMORY_CONTEXT_JSON` is completely omitted, maintaining 100% backward compatibility with Phase 11B.4 prompts.

## AI Orchestration Integration

* **Service Coordinator**: Injects default `memoryService`.
* **Public Input**: Accepts canonical `memoryState?: MemoryDTO | null`. Aliases (`memory`, `memoryDto`, `memories`) are rejected with `WorkflowError('INVALID_ORCHESTRATION_INPUT')`.
* **Retrieval Flow**: If `memoryState` is provided, coordinator queries `retrieveContext({ memoryDto, query: { workflowType: template.id, topic } })` before invoking Prompt Builder.
* **Invalid Memory State**: Fails explicitly with typed `WorkflowError` if supplied `memoryState` is malformed.
* **Separation of Promotion and Retrieval**: `executeWorkflow()` only retrieves from caller-supplied memory state. Workflow execution never automatically writes, promotes, or updates memories.

## Security & Guardrail Boundary (Phase 11B.6 Handoff)

* **Structural Validation Only**: Phase 11B.5 validates DTO schemas and deterministic policy boundaries.
* **Untrusted Memory Warning**: Phase 11B.5 provides structural trust separation and bounded context. It does NOT provide prompt injection detection, PII scanning, memory security classification, or content moderation. Those controls belong exclusively to Phase 11B.6 (Guardrail Engine).

## Explicit Non-Goals

Phase 11B.5 explicitly excludes:
* Persistent Dexie stores, IndexedDB schemas, or database migrations;
* Memory Repository or Knowledge Repository abstractions;
* LLM-driven memory extraction or keyword NLP heuristic parsing;
* Semantic conflict detection in free text;
* PII classification, jailbreak detection, or prompt injection scanning (Phase 11B.6);
* Vector embeddings, vector databases, or semantic search;
* Memory decay, adaptive confidence models, or knowledge graphs;
* Streaming or WebSocket transports (Phase 11B.8);
* Cloud LLM providers (OpenAI, Gemini, Claude);
* Modifying deterministic finance engines or financial calculations.

---

# 12.6 — AI Safety & Guardrails Architecture

Version: 1.0.0
Phase: 11B.6

## Guardrail Philosophy & Core Principle

```text
AI explains.
PesoPilot decides.
```

* **Deterministic Application-Policy Enforcement**: Guardrails provide deterministic application-level policy enforcement at runtime.
* **Separation of Concerns**: Guardrails do NOT calculate finance, construct prompts, manage conversation history, manage memory state, execute providers, or generate recommendations.
* **Complement to Safety Injector**: The existing `safetyInjector.js` provides behavioral instructions inside the LLM prompt. The Guardrail Engine provides actual deterministic runtime boundary enforcement before and after model invocation.

## Decision Model

The Guardrail Engine enforces a strict, fail-closed binary decision model:

```javascript
{
  version: '1.0.0',
  stage: 'input', // 'input' | 'memory' | 'prompt' | 'provider' | 'response' | 'financial_guidance'
  decision: 'allow', // 'allow' | 'reject'
  primaryCode: null, // null on allow; GuardrailErrorCode on reject
  reasonCodes: [], // string[] (defensively copied and frozen)
  reasons: [],     // string[] (defensively copied and frozen)
}
```

* **Binary Decisions Only**: Every check returns strictly `allow` or `reject`.
* **No Ambiguous States**: `rewrite`, `sanitize`, `warn`, `manual_review`, and `escalate` are explicitly excluded from this phase.
* **Deep Immutability**: All decisions and nested arrays are defensively copied and recursively frozen (`Object.freeze`).

## Exact Orchestration Lifecycle & Stage Ordering

The Guardrail Engine integrates into the AI Orchestration Engine (`serviceCoordinator.js`) in an exact deterministic order:

```text
 1. Existing structural orchestration input validation (DTO shape)
 2. Guardrail Input validation (validateInput)
 3. Resolve workflow template
 4. Resolve provider metadata
 5. Create and start workflow
 6. Retrieve MemoryContext
 7. Guardrail Memory validation (validateMemory, if non-null)
 8. Prompt Builder execution
 9. Existing PromptPackage structural validation
10. Guardrail Prompt validation (validatePrompt)
11. ProviderRequest creation
12. Guardrail Provider validation (validateProvider)
13. Provider execution (LLM Adapter call)
14. Existing ProviderResponse structural validation
15. Guardrail Response validation (validateResponse)
16. Financial Guidance validation (validateFinancialGuidance)
17. Complete workflow execution
18. Return existing { workflow, response } contract
```

Input Guardrail validation runs before workflow record creation where practical. Public inputs failing allowlists are rejected immediately without creating an orphaned workflow record.

## The Seven Guardrail Subsystems

### 1. Input Guardrail (`inputGuardrail.js`)
* **Strict Public Control Allowlists**: Only approved top-level fields are permitted (`templateId`, `insightBundle`, `recommendationBundle`, `financialSummary`, `conversationContext`, `memoryState`, `provider`, `workflowId`).
* **Provider Control Allowlists**: Only `id`, `model`, and `config` are permitted for provider descriptor overrides; only `baseUrl` and `transportTimeoutMs` are permitted in `provider.config`.
* **No Caller Bypass/Control Injections**: Caller-supplied `signal`, `maxAttempts`, `retryDelayMs`, `workflowTimeoutMs`, and guardrail bypass flags are rejected with `INPUT_REJECTED` and reason `UNRECOGNIZED_CONTROL_FIELDS`.

### 2. Untrusted-Text Provenance & Threat Scanner (`untrustedTextExtractor.js`, `threatPatterns.js`)
* **Explicit Untrusted Provenance Paths**: Untrusted text scanning is strictly restricted to proven user-controlled sources:
  - `conversationContext.recentMessages[*].content`
  - `memoryContext.items[*].content`
  - `context.insights.expenses.topSpendingCategory` (explicit proven user category label)
* **Zero Recursive Scanning**: Platform-generated strings (e.g. `recommendation.title`, `financialSummary` sections and paragraphs, domain status strings) are deterministic platform outputs and are never recursively walked or treated as prompt injections.
* **High-Confidence Threat Scanner**: Scans untrusted text for:
  - Instruction override / prompt reset attempts;
  - System or developer prompt exfiltration attempts;
  - Guardrail bypass and restriction removal instructions;
  - Role impersonation and control override syntax;
  - Provider or configuration manipulation commands;
  - Credential and token disclosure requests.
* **Context-Aware Evaluation**: Requires contextual intent rather than naive keyword matching, distinguishing malicious control attempts from academic or explanatory mentions.

### 3. Memory Guardrail (`memoryGuardrail.js`)
* **Content Safety Enforcement**: Evaluates retrieved `MemoryContextDTO` records for prompt injection attempts, exfiltration attempts, and sensitive data/PII before Prompt Builder invocation.
* **Safe Null Bypass**: Safely skips validation if `memoryContext` is null.
* **Read-Only Operation**: Does not mutate, delete, or promote memory records.

### 4. Prompt Guardrail (`promptGuardrail.js`)
* **Canonical Safety Block Integrity**: Imports `getSafetyInstructions()` from `safetyInjector.js` and asserts that the system prompt contains the canonical block `MANDATORY SAFETY RULES:\n${getSafetyInstructions()}` verbatim. If missing or altered, rejects with `PROMPT_SYSTEM_INTEGRITY_VIOLATION`.
* **Task & Template Validation**: Ensures template ID matches whitelisted workflow templates.
* **Prompt Size Ceilings**: Enforces maximum system prompt (4,000 chars) and user prompt (16,000 chars) limits.
* **Untrusted Text Scan**: Scans all untrusted segments embedded in the prompt.

### 5. Provider Guardrail (`providerGuardrail.js`)
* **Browser-Phase Locality Policy**: Asserts provider is registered, provider ID is `ollama`, descriptor locality is `local`, and `stream` is `false`.
* **Cloud Rejection**: Descriptors with `cloud` locality are rejected immediately (`PROVIDER_CLOUD_LOCALITY_PROHIBITED`).
* **Locality Authority**: Descriptor locality check enforces client execution policy; physical model locality verification remains the sole authority of Provider Layer 11B.3 (`/api/show`).

### 6. Response Guardrail (`responseGuardrail.js`)
* **Post-Generation Publication Safety**: Executes immediately following `ProviderResponse` structural schema validation.
* **Size Enforcement**: Enforces maximum response length (8,000 chars).
* **System Prompt Disclosure Scanner**: Rejects responses that leak internal developer prompts, safety rules, or platform instructions.
* **Secret & Token Leakage**: Scans for accidental leakage of authorization tokens, API keys, or credentials.
* **Unsupported Action Claims**: Detects and rejects unauthorized claims that the AI performed financial mutations (e.g., "I transferred the money", "I deleted the expense", "I changed your budget") while preserving legitimate non-action explanations (e.g., "PesoPilot cannot transfer money").

### 7. Financial Guidance Guardrail (`financialGuidanceGuardrail.js`)
* **Permitted Financial Coaching**: Explicitly allows budget explanations, expense analyses, savings guidance, cashflow interpretations, goal coaching, financial education, and habit coaching.
* **High-Confidence Prohibited Categories**:
  - Direct buy/sell directives for securities, stocks, or cryptocurrencies;
  - Guaranteed investment returns;
  - Authoritative personalized tax or legal conclusions;
  - Specific loan or credit-product endorsements;
  - Guaranteed financial outcomes.

## Sensitive Data & PII Detection

The guardrail engine provides high-confidence deterministic detectors for sensitive data patterns:
* Email addresses;
* Phone-number-like identifiers;
* Payment card numbers (validated against the Luhn checksum algorithm);
* Bearer and Authorization tokens;
* API key and private key patterns;
* Secret and password assignment patterns.

**Financial Number Exemption**: Ordinary numeric amounts (e.g., salary = 49,000, grocery expense = 1,200, cash balance = 7,000) are recognized as legitimate domain figures and are never falsely classified as PII.

## Audit Logger Subsystem (`auditLogger.js`)

* **Event DTO**:
  ```javascript
  {
    version: '1.0.0',
    eventId: 'uuid',
    workflowId: 'wf-123' | null,
    stage: 'prompt',
    decision: 'reject',
    code: 'PROMPT_REJECTED',
    reasonCodes: ['PROMPT_SYSTEM_INTEGRITY_VIOLATION'],
    createdAt: '2026-10-05T00:00:00.000Z',
  }
  ```
* **Rejections Only**: Emits structured audit events strictly for rejections (`decision: 'reject'`). Successful validations do not produce audit records.
* **No Database Persistence**: Audit logging uses an injected sink (`() => {}` default). No Dexie stores, IndexedDB tables, or schema migrations are created.
* **In-Memory Diagnostic Sink**: `createInMemoryAuditSink({ maxEvents: 100 })` provides a bounded ring-buffer for test assertions and local debugging.
* **Sink Failure Isolation**: If an audit sink throws an exception, the rejection decision remains authoritative and immutable.

## Retry Boundary & Workflow Error Integration

* **Zero-Retry Policy**: Guardrail rejections are never retryable. Rejections are intercepted outside provider retry classification, normalized to `GUARDRAIL_REJECTED`, and terminate the workflow immediately without invoking the retry manager. Retry semantics are control-flow policy, not a `WorkflowError` field.
* **Interception Outside Provider Loop**: Post-generation guardrail rejections (`validateResponse` and `validateFinancialGuidance`) run strictly outside the provider retry loop. If a generated completion fails guardrail validation, the provider adapter is invoked exactly once, and no retry is attempted.
* **Workflow Error Normalization**: All guardrail rejections throw a `GuardrailError` which normalizes at the orchestration boundary to:
  - `WorkflowError.code = GUARDRAIL_REJECTED`
  - `workflow.status = 'failed'`
  - `workflow.finalErrorCode = 'GUARDRAIL_REJECTED'`

## Privacy Guarantees & Safe Metadata

* **Sanitized Messages & Metadata Only**: Guardrail errors use sanitized messages and safe metadata only.
* **Zero Retention**: Raw rejected prompt, conversation, memory, provider response, financial values, detected credential values, and unsanitized causes are never copied into `WorkflowError`, workflow diagnostics, `AuditEvent` payloads, or audit sink metadata.
* **Stack Trace Policy**: Internal JavaScript Error stack behavior is not part of the public guardrail contract. Stack traces are not propagated into sanitized cross-layer artifacts or audit events.
* **Safe Diagnostics**: Only safe metadata (workflow ID, stage name, primary error code, sanitized reason codes, and high-level safe descriptions) is propagated into diagnostics, errors, and audits.

## Residual Limitations & Bounded MVP Scope

* **Bounded Deterministic MVP**: Guardrails detect a limited, high-confidence subset of deterministic policy violations.
* **Explicit Residual Limitations**:
  - Does NOT claim complete prompt-injection or jailbreak prevention;
  - Does NOT claim complete PII detection;
  - Does NOT claim complete hallucination prevention;
  - Does NOT deterministically verify every model-generated number or sentence against source DTOs;
  - Does NOT claim perfect financial-advice classification or regulatory compliance certification.

## Explicit Non-Goals

Phase 11B.6 explicitly excludes:
* Rate limiters, abuse tracking, or throttling subsystems;
* Manual human review, escalation queues, or admin review dashboards;
* Dynamic remote policy loaders or administrative policy servers;
* LLM-as-a-judge classifiers, ML embeddings, or semantic injection detectors;
* Automatic prompt or response rewriting, or automatic regeneration after rejection;
* Cloud LLM providers (OpenAI, Gemini, Claude);
* Spring Boot AI Gateway or REST API additions;
* Streaming or WebSocket transports (Phase 11B.8);
* Persistent database storage, Dexie tables, or schema version bumps;
* Modifying deterministic finance engines or financial calculations.

---

# 12.7 — Spring Boot AI REST API Architecture

Version: 1.0.0
Phase: Phase 11B.7

## Purpose

The Spring Boot AI REST API establishes the external, provider-independent HTTP boundary and application contract for the PesoPilot AI Platform. It defines strongly typed, versioned request and response DTOs, coordinates validation and execution port dispatch through the Spring AI Gateway, and enforces fail-safe unavailable degradation in production without duplicating browser-owned AI execution engines into Java.

## Authoritative Execution Ownership

* **Separation of Contract Boundary vs. Real Inference Runtime**:
  * **Real AI Execution Runtime**: The client browser currently owns the active, operational execution pipeline (`aiOrchestrator` -> `guardrailEngine` -> `promptBuilder` -> `providerLayer` -> local `ollamaAdapter` at loopback).
  * **Spring AI REST API**: Acts as the versioned, provider-independent HTTP and application boundary for future backend execution capabilities.
  * **Production Spring Execution Capability**: Intentionally unavailable in Phase 11B.7. The production execution port (`UnavailableAiExecutionPort`) fails closed with `503 Service Unavailable`.
* **Zero Duplication / Zero Scope Drift**: Prompt construction (11B.1), conversation engine (11B.2), provider layer / Ollama integration (11B.3), workflow orchestration (11B.4), memory service (11B.5), and guardrail engine (11B.6) are NOT ported or duplicated into Java.
* **No Synthetic Responses**: The backend never returns fake AI text, synthetic placeholders, or echoes user context on failure.

## Ready Status Semantics

* `aiGateway.status = 'ready'` in the browser denotes strictly that:
  ```text
  ready = the HTTP/API gateway contract is implemented and operational
  ```
* It does **NOT** mean Spring backend inference is active or that Spring executes the LLM workflow. The gateway can successfully execute HTTP transport and correctly surface the server's 503 execution-unavailable response.

## Public Endpoint & API Versioning

* Canonical Route: `POST /api/v1/ai/explanations`
* Synchronous JSON only.
* Unversioned routes (`/api/ai/explanations`) and `/api/v2/...` routes return 404 Not Found.
* Constants centralized in `AiApiConstants`.

## Request Contract & Canonical AI Context

* Public request wrapper:
  ```java
  public record AiExplanationRequest(
      @NotNull @Valid AiPromptContextDto context
  ) {}
  ```
* **No Public Control Fields**: `templateId`, `providerId`, `provider`, `model`, `baseUrl`, `stream`, and credentials are strictly excluded from the public request. The Spring Gateway internally binds `WORKFLOW_TEMPLATE_ID = "financial-summary-explanation"`.
* **Canonical Minimized Context**: Directly reflects the established Phase 11B.1 context (`contextSelector.js`):
  * `version`, `scope`, `sourceTimestamps`
  * `financialSummary`: sections, paragraphs, horizon, metadata, state
  * `recommendations`: canonical fields (`id`, `domain`, `actionKey`, `title`, `explanation`, `severity`, `priority`, `rank`, `evidence`, `sourceRuleIds`)
  * `insights`: all seven established domains (`health`, `income`, `expenses`, `savings`, `goals`, `cashflow`, `cutoff`)
  * `conversationContext`: optional, bounded by 11B.2 rules (max 10 messages, max 4000 chars/message, allowed roles `user` and `assistant`, topic whitelist, clarification invariants)
  * `memoryContext`: optional, bounded by 11B.5 rules (max 5 items, max 300 chars/item, max 1500 TOTAL chars, allowed types `communication_preference`, `coaching_preference`, `user_preference`)
* **No Financial Recalculation**: Spring does not recalculate balances, health scores, or re-rank recommendations.

## Response Contract & Envelope Compatibility

* Preserves the global 3-field `ApiResponse<T>` envelope:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "requestId": "UUID",
      "explanation": "Explanation text...",
      "generatedAt": "ISO-8601 timestamp"
    }
  }
  ```
* `AiExplanationResponse` contains `requestId`, `explanation`, and `generatedAt`.
* Redundant `version` and provider/diagnostic internals are excluded.

## Error Handling, Status Mapping, and Privacy

* Exception Hierarchy:
  * `AiApiException` (root runtime exception) -> 500 Internal Server Error
  * `AiValidationException` -> 400 Bad Request
  * `AiExecutionUnavailableException` -> 503 Service Unavailable
* Global Exception Handler:
  * Sanitized logging for validation and deserialization errors to prevent leaking raw user context or rejected JSON fragments.
  * Zero prompt, financial, or sensitive data in client error responses or logs.

## Frontend AI Gateway Role

* `aiGateway.js` uses shared `apiClient` (`src/lib/api/client.js`).
* Exposes `requestExplanation(context)`.
* Does not replace `aiOrchestrator` -> local Ollama in UI components.
* Normalizes API errors via `normalizeApiError`.

## Explicit Non-Goals

* No live Spring AI inference runtime or Java Ollama adapter;
* No Java reimplementation of PromptBuilder, ConversationEngine, MemoryService, GuardrailEngine, or AI Orchestrator;
* No streaming, SSE, WebFlux, or WebSockets (owned by Phase 11B.8);
* No Spring Security, OAuth2, or JWT integration;
* No database persistence, repositories, or Dexie modifications;
* No product UI routing switch or automatic remote fallback.

---

# 12.8 — Streaming & Real-Time Response Architecture

Version: 1.0.0
Phase: Phase 11B.8

## Core Principle

```text
AI explains.
PesoPilot decides.
```

Streaming changes delivery semantics only. It does not weaken financial authority, guardrail safety, or architectural boundaries.

## 1. Dual Boundary Architecture

PesoPilot enforces a strict Dual Boundary model for AI streaming:

1. **Browser-Local AI Runtime**: Real incremental generation is executed entirely within the client browser via local Ollama HTTP NDJSON transport. No user financial data or prompts are transmitted over external networks or to the Spring backend during generation.
2. **Spring SSE Transport Contract**: Spring Boot owns the versioned HTTP Server-Sent Events (SSE) contract (`POST /api/v1/ai/explanations/stream`). It defines transport semantics, event serialization, and connection lifecycle callbacks. In Phase 11B.8, Spring has no production inference runtime; its production execution port (`UnavailableAiStreamingExecutionPort`) immediately fails closed with `503 Service Unavailable`.

## 2. Safe Publication Gate (Non-Negotiable)

To maintain absolute financial safety, raw model fragments from Ollama are strictly private:

```text
Ollama NDJSON fragments
  ↓
Private TokenBuffer (max 5,000 chars)
  ↓
Complete ProviderResponse Reconstruction
  ↓
Response Guardrail (validateResponse)
  ↓
Financial Guidance Guardrail (validateFinancialGuidance)
  ↓
Deterministic Chunk Publication (StreamChunks <= 256 chars)
```

* **Core Rule**: Generate incrementally. Publish only after validation.
* Raw text fragments are accumulated in a private `TokenBuffer` and are NEVER published directly to the user or UI.
* If either post-generation guardrail (`Response Guardrail` or `Financial Guidance Guardrail`) rejects the accumulated response, exactly **zero generated-content chunks** are published.
* Rejections trigger standard audit logging (`auditLogger.logRejection`) and transition the workflow to `GUARDRAIL_REJECTED`. No partial text or rejected content is ever surfaced in error payloads.

## 3. Strict 5,000-Character Response Ceiling

Accumulated generated content is strictly bounded by existing policy authority:

```text
DEFAULT_GUARDRAIL_POLICY.maxResponseLength = 5000 characters
```

At character 5,001:
* The active provider HTTP transport is immediately aborted via `AbortController`.
* The private buffer is discarded.
* The stream fails closed with `STREAM_BUFFER_LIMIT_EXCEEDED`.
* Exactly zero generated content is published.

## 4. Separation of Protocols: NDJSON != SSE

* **Ollama Transport**: Ollama responds with newline-delimited JSON (`application/x-ndjson`), NOT SSE. The browser runtime consumes NDJSON incrementally via native `ReadableStream`, `TextDecoder` (with streaming multibyte support across network packets), and `AbortSignal`.
* **Spring Transport**: Spring produces standard Server-Sent Events (`text/event-stream`).

## 5. Streaming-Specific Provider Guardrail

The synchronous provider guardrail (`validateProvider`) strictly enforces `generation.stream === false` to preserve 11B.6 synchronous workflows.

Phase 11B.8 introduces an additive streaming validator (`validateStreamingProvider`) that:
* Validates non-null `ProviderStreamRequest`;
* Verifies registered provider descriptor;
* Enforces local provider locality;
* Enforces model matching;
* Does NOT require `generation.stream === false` because `ProviderStreamRequest` inherently establishes streaming intent.

## 6. Deterministic Chunk Model & Surrogate Safety

Once both post-generation guardrails approve the response:
* `ProviderResponse.content` is split into deterministic `StreamChunk` events.
* Maximum chunk length: 256 UTF-16 code units.
* **Surrogate Pair Protection**: If a 256-character split falls between a UTF-16 surrogate pair (e.g. multi-byte emojis or currency symbols), the chunk boundary is automatically retracted by one code unit to keep the surrogate pair intact.
* Chunk sequence numbers are strictly sequential (`1..N`), contiguous, and content-specific.
* Joining all published chunks strictly equals the validated response text without normalization, trimming, or whitespace alteration.

## 7. Stream Lifecycle & Event Model

The Stream Manager enforces a deterministic lifecycle:

```text
starting → streaming → validating → publishing → completed
```

Terminal alternatives:
* Any active state → `cancelled` (idempotent cancellation)
* Active state before completion → `failed` (sanitized failure event)
* Active state before completion → `timed_out` (workflow deadline expired)

Canonical Stream Events:
* `started`, `chunk`, `completed`, `cancelled`, `failed`, `timed_out`
* Event sequence numbers increment monotonically (`1..M`) across external events, distinct from chunk sequence numbers.

## 8. Cancellation Semantics

Cancellation uses the stream session's `AbortController`:
* **Pre-provider / Locality preflight (`/api/show`)**: Aborts HTTP transport; provider never generates.
* **During generation (`/api/generate`)**: Aborts HTTP fetch immediately, clears private buffer, publishes zero chunks.
* **Before / during validation**: Guardrail functions are synchronous. Cancellation is checked immediately before validation and again before publication. If cancelled, zero chunks are emitted.
* **During publication**: Cancellation is checked between chunk emissions. If a consumer callback calls `cancel()`, subsequent chunk emissions halt immediately.
* **Post-completion**: Calling `cancel()` on a completed stream is a safe, idempotent no-op.

## 9. Retry Integration

Streaming reuses the existing `retryManager` policy without duplicating retry logic:
* Each attempt receives a fresh private `TokenBuffer`.
* On retryable provider failure (e.g., transient daemon connectivity), the failed attempt buffer is cleared and the attempt counter increments.
* Because no chunks are published before safety approval, retries cannot duplicate visible text.
* Once the stream enters `publishing`, no further retries are permitted; any publication failure is terminal.
* The overall workflow maintains a single stable `streamId` across retry attempts.

## 10. Sanitized Diagnostics & Privacy

Stream diagnostics expose execution metadata without content leakage:
* Fields: `streamId`, `state`, `providerFragmentsReceived`, `chunksPublished`, `charactersGenerated`, `charactersPublished`, `startedAt`, `providerCompletedAt`, `publicationStartedAt`, `completedAt`, `durationMs`.
* Strictly excluded: prompts, generated text, conversation history, memory items, financial values, raw provider JSON, credentials, stack traces.
* Provider fragments are termed "fragments", never tokenizer "tokens".

## 11. Backend Transport-Neutral Architecture

* **Layering**:
  ```text
  AiStreamingExplanationController
    ↓
  AiStreamingGateway (DefaultAiStreamingGateway)
    ↓
  AiStreamingExecutionPort (transport-neutral)
  ```
* **Transport-Neutral Execution Port**:
  ```java
  public interface AiStreamingExecutionPort {
      AiStreamingExecutionHandle start(
          AiExecutionCommand command,
          Consumer<AiStreamEventDto> eventConsumer
      );
  }
  ```
  The execution port does not import `SseEmitter`, `HttpServletResponse`, or Spring MVC classes.
* **Controller Ownership**: `AiStreamingExplanationController` manages the `SseEmitter`, timeout, error/completion callbacks, and translates application `AiStreamEventDto` events to SSE event payloads.
* **Production Unavailable Execution**: `UnavailableAiStreamingExecutionPort` immediately throws `AiExecutionUnavailableException`, yielding a 503 JSON `ApiResponse` through `GlobalExceptionHandler`.
* **Zero Persistence**: Stream events, tokens, and diagnostics are ephemeral; no database or Dexie persistence is introduced.

---

# 12.9 — AI Testing Strategy

Version: 1.0.0  
Phase: 11B.9 Implementation  

## Developer & Test-Only Boundary

The AI Testing Harness is strictly developer and test infrastructure. It is not part of the production AI runtime, product capabilities, or user interface.
* **Location**: All testing infrastructure resides under `apps/pesopilot-web/src/features/ai-insights/testing/`.
* **Export Isolation**: Harness utilities and simulators are exported exclusively via `features/ai-insights/testing/index.js`.
* **Facade Protection**: The production public entrypoint (`features/ai-insights/index.js`) and `aiPlatformFoundation` do NOT export or reference testing modules. Production code must never import from `/testing/`.

## Offline Deterministic Execution

The test harness guarantees complete determinism and zero network dependencies:
* **No Live AI / No Network**: No calls to live Ollama instances, cloud APIs, network sockets, or `fetch()`.
* **Deterministic Runtime**: All time, random IDs, and execution timers are decoupled from wall-clock time and system entropy via `createDeterministicRuntime({ now, idGenerator, timer })`.
* **Controllable Fake Timers**: Timeouts and delayed cancellations are driven through deterministic clock advancement (`advanceTime(ms)`), never real sleep or polling loops.

## Provider Mock & Test Provider Layer

To thoroughly verify orchestration without live model daemons, the harness introduces a scripted, production-compliant provider mock and registry-backed layer:
* **Production Adapter Contract**: `createProviderMock` implements the canonical `LLMAdapter` interface (`id`, `locality`, `generate(...)`, and optional `stream(...)`).
* **Provider Identity & Policy Conformity**: Mock adapters default to `{ id: 'ollama', locality: 'local' }`. Production guardrail policies and provider rules remain authoritative and are never weakened or bypassed for tests.
* **Canonical Responses**: Scripted completions return real `ProviderResponse` and `ProviderDiagnostics` instances using production constructors.
* **Request Immutability**: All incoming `ProviderRequest`, `ProviderStreamRequest`, and `providerConfig` objects are verified to be immutable and unmutated during execution.
* **Safe Call History**: An in-memory, test-local call log captures invocations, requests, and abort statuses for assertions without recording credentials or persisting state.
* **AbortSignal Compliance**: Both sync generation and streaming iterables observe `providerConfig.signal` and abort deterministically upon cancellation.
* **Test Provider Layer Wrapper**: `createMockProviderLayer(mockAdapter)` registers the mock adapter inside a real `ProviderRegistry` and preserves all production validation functions (`createProviderRequest`, `createProviderStreamRequest`, `validateProviderRequest`, `validateProviderStreamRequest`, `validateProviderResponse`, `validateProviderDiagnostics`). The Service Coordinator always receives a fully compliant `providerLayer`.

## Workflow, Prompt, Conversation & Memory Simulators

Simulators drive real production modules rather than reimplementing business logic:
* **Workflow Simulator (`createWorkflowSimulator`)**: Executes real `createServiceCoordinator` and `executeStreamingWorkflow`. Verifies end-to-end orchestration, retry loops, timeout handling, and guardrail enforcement through the real production coordination path.
* **Prompt Simulator (`createPromptSimulator`)**: Drives the real `promptBuilder.build(...)`. Confirms context selection, template resolution, and `PromptPackage` creation without duplicating prompt composition logic.
* **Conversation Simulator (`createConversationSimulator`)**: Translates test operation scripts (`message`, `topic`, `clarification`, `resolveClarification`) directly into calls on the real `conversationEngine`. Validates message bounds, role policies, and canonical `ConversationContext` generation.
* **Memory Simulator (`createMemorySimulator`)**: Exercises real `memoryService` candidate evaluation, record creation, ranking, and bounded context retrieval using production `MEMORY_TYPES` and policies.

## Synthetic Fixtures & Curated Golden Scenarios

* **Synthetic Fixtures**: Test fixtures (`syntheticFixtures.js`) generate clearly synthetic, fictitious financial summaries, recommendations, insight bundles, conversation messages, and memory records. Real user transactions, salaries, and sensitive data are forbidden.
* **Curated Golden Scenarios**: Scenarios (`goldenScenarios.js`) define an immutable, declarative suite covering key architectural invariants:
  1. Successful synchronous financial explanation workflow.
  2. Response Guardrail rejection (action claim detection).
  3. Financial Guidance Guardrail rejection (guaranteed return detection).
  4. Retryable provider failure leading to successful recovery.
  5. Memory retrieval resulting in a bounded prompt context.
  6. Conversation context propagation into the prompt package.
  7. Successful streaming workflow through the Safe Publication Gate.
  8. Streaming safety rejection when provider fragments trigger guardrails.
* **Contract Clarity**: The scenario suite is a curated set of high-value deterministic invariants; scenario count is an implementation detail and not an architectural contract.

## Regression Runner & Privacy-Safe Reporting

* **Sequential Execution**: `runRegressionSuite` executes scenarios sequentially in frozen order to guarantee predictable diagnostics, clock consistency, and deterministic test outcomes.
* **Aggregation**: The runner continues on scenario failures, collecting all invariant diagnostics in an immutable `RegressionReport`.
* **Privacy & Diagnostics Sanitization**: Regression reports record only structural metadata (scenario ID, invariant ID, failure code, message). Raw prompts, system instructions, generated text, conversation history, memory content, financial numbers, credentials, and stack traces are strictly excluded.

## Financial Source-of-Truth Invariants

A primary invariant verified by the test harness is that AI workflows are strictly non-authoritative:
* Deterministic financial inputs (`InsightBundle`, `RecommendationBundle`, `FinancialSummary`) are deep-frozen or verified before and after workflow execution.
* AI orchestration cannot modify, overwrite, or re-calculate underlying financial balances, spending calculations, or transaction history.

## Limitations & Non-Goals

The v1 AI Testing Harness explicitly avoids:
* Evaluation engines, semantic benchmark scoring, or LLM-as-judge frameworks.
* Chaos testing, performance/load testing frameworks, or latency benchmarking.
* Historical replay databases or telemetry tracking.
* Live provider integration requirements in CI/CD.
* Multi-cloud compatibility matrices or Phase 12 forecasting.

---

# 12.10 — Future Multi-LLM & AI Evolution Architecture

Version: 1.0.0
Phase: Cross-Phase Architecture Direction

## Contract Stability & Provider Isolation

* All future LLM providers (e.g. OpenAI, Gemini, Claude, enterprise gateways) must implement the same stable `LLMAdapter` contract (`id`, `locality`, `generate`).
* Provider resolution remains centralized in the `ProviderRegistry`. Business logic in `PromptBuilder`, `ConversationEngine`, and financial engines remains 100% provider-agnostic.
* Provider-specific mapping, serialization, and vendor idiosyncrasies remain strictly encapsulated inside individual adapter implementations.

## Locality Classification & Cloud Consent Boundary

* Providers are strictly classified by `locality`:
  * `'local'`: Local daemon runtimes (e.g. Ollama on loopback with verified local models). Requires NO `cloudAiConsent`.
  * `'cloud'`: Remote cloud APIs requiring external internet transmission. Strictly requires explicit `settings.cloudAiConsent: true`.
* Cloud provider execution and API secret management belong to the Spring Boot AI Gateway (Phase 11B.7) and AI Orchestrator (Phase 11B.4). No cloud credentials or cloud network calls are permitted in the client browser.

---

# Approval Rule

This document is approved only if it remains aligned with:

* 00-source-of-truth.md
* 03-domain-and-database.md
* 05-backend-architecture.md

Any AI implementation that conflicts with those documents must be corrected.


