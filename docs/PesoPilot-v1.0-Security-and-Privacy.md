# Security and Privacy

Version: 1.0

Status: Approved Draft

Derived From:

* 00-source-of-truth.md

---

# Purpose

PesoPilot's primary security goal is:

```txt
Protect User Financial Data
```

---

# Privacy Philosophy

PesoPilot follows:

```txt
Privacy First
Local First
```

The application is designed so users maintain ownership of their financial data.

---

# Data Ownership

Users own:

```txt
Expenses
Income
Savings
Budgets
Insights
```

The application never claims ownership of user financial information.

---

# No Account Model

PesoPilot MVP requires:

```txt
No Account
No Login
No Registration
```

Benefits:

```txt
Less Friction
Higher Privacy
Lower Risk
```

---

# Storage Model

Primary Storage:

```txt
IndexedDB
```

via:

```txt
Dexie.js
```

The browser stores data locally.

---

# Backend Data Rules

The backend must never become the primary financial database.

Backend may process:

```txt
Forecast Requests
Summary Requests
Categorization Requests
```

Backend must not permanently store:

```txt
Expense History
Income History
Savings History
```

---

# Cloud AI Privacy

Cloud AI is:

```txt
Disabled By Default
```

Users must explicitly enable it.

---

# Cloud AI Consent

Before enabling cloud AI:

User must acknowledge:

```txt
Selected financial information
may be transmitted to the chosen AI provider.
```

Consent stored in:

```txt
settings.cloudAiConsent
```

---

# Data Minimization

Only send information required for a task.

Example:

Summary Generation:

Send:

```txt
Category Totals
Income Totals
Savings Totals
```

Avoid:

```txt
Entire Financial History
```

when unnecessary.

---

# Logging Policy

Never log:

```txt
Expense Notes
Income Notes
Savings Notes
Raw Financial History
```

Allowed logs:

```txt
Execution Time
Provider Name
Success/Failure
```

---

# Environment Variables

Secrets must never be hardcoded.

Use:

```txt
.env
```

Examples:

```txt
OPENAI_API_KEY
GEMINI_API_KEY
CLAUDE_API_KEY
SMTP_PASSWORD
```

---

# Input Validation

All inputs must be validated.

Frontend:

```txt
React Hook Form
Zod
```

Backend:

```txt
Jakarta Validation
```

---

# Future Security Features

Not MVP:

```txt
Encryption
Biometrics
PIN Lock
Secure Backup
```

Future phases only.

---

# Security Success Criteria

Users should be able to confidently say:

```txt
My financial data stays under my control.
```
