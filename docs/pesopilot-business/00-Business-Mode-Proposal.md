# PesoPilot Business Mode — v1.1 Proposal

Status: PROPOSED / isolated development only
Created: 2026-11-08
Target: Future PesoPilot v1.1, **not** the v1.0 MVP release or Batch 2.

## Outcome

Provide a lightweight, single-device mini POS for an owner who sells physical products (e.g., pillows). Business Mode is separate from Personal Finance and must not require salary cutoffs.

## Confirmed requirements

- First-use workspace choice: Personal Finance or Business.
- Existing personal records and flows continue without migration.
- Business workspace: dashboard, products and stock, manual sale entry, Cash or Coop payment selection, an internal inventory/transaction history.
- Confirmed sales reduce stock and record a transaction atomically.
- Data remains local-first, offline-capable, and segregated from the personal finance Dexie database.
- Do not add cloud services, accounting, invoicing, AI features, staff accounts, or supplier workflows for this MVP.

## Boundaries and assumptions

1. "Coop" is currently only a **manual payment label**. Do not claim external settlement, process a payment, or create receivables until the client explains Coop payment confirmation.
2. Only owner-confirmed successful sales update stock. Pending orders and refunds are outside this initial slice.
3. Price is stored in integer Philippine centavos to avoid floating-point rounding.
4. Business inventory is in a separate IndexedDB database. None of the 13 approved personal MVP stores are changed.
5. Local storage on a browser profile is **not access control**. A /business URL is not private by itself, there is no device sync, and browser data can be erased. Client production containing sensitive records requires separate security/backup/privacy acceptance.
6. An internal event ledger can be built now. The **client audit report schema, columns, exports, reconciliation rules, and period filters are not established** until the client provides the sample. Event entries are not tamper-proof.
7. The business feature does not automatically post sales to personal Income or Cashflow.
8. The existing v1.0 Source of Truth remains authoritative for the v1.0 release. This proposal requires separate v1.1 approval before merging into a release branch.

## Initial entities (provisional v1.1 business domain)

- Product: id, name, unitPriceCentavos, stockQuantity, createdAt.
- Sale: id, requestKey, paymentMethod, totalCentavos, confirmedAt.
- SaleItem: saleId, productId, productNameSnapshot, quantity, unitPriceCentavos, lineTotalCentavos.
- InventoryMovement: productId, saleId (optional), type, delta, beforeQuantity, afterQuantity, occurredAt.
- AuditEvent: saleId (optional), type, payload, occurredAt. This is an internal minimal history, not the client's final audit format.

## Transaction invariants

- Refuse negative stock, unknown product, invalid quantities and amounts.
- Reject duplicate products within a sale request.
- Use one Dexie transaction to write sale, item snapshots, inventory changes, and the internal event.
- Apply an indexed, unique request key for retry/idempotency.
- Preserve historic sale snapshots even if future product prices change.
- Do not silently delete or overwrite an approved sale or internal event.

## Release gates

B0 proposal -> B1 business routing/onboarding -> B2 inventory -> B3 transaction safety -> B4 client audit adapter -> B5 QA/security/backup review -> B6 explicit release approval.

Merge gate: existing Personal tests, new Business tests, static checks/build, offline QA, and the privacy/access model must be reviewed independently. Do not merge into main or deploy as part of Batch 2.

## Client questions to resolve when the audit sample arrives

- Which fields/columns and grouping are required? Sales per day, stock movement, cash reconciliation, or all three?
- Is Coop paid immediately, deducted from a cooperative balance, or collected later?
- Does the client need multiple staff, devices, secure remote access, data export, or a backup/restore procedure?
- Are order cancellation, exchanges, returns, and stock corrections in scope?
