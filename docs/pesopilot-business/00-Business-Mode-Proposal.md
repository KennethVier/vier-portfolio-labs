# PesoPilot Business Mode — v1.1 Proposal

Status: PROPOSED / isolated development only
Created: 2026-11-08
Target: Future PesoPilot v1.1, **not** the v1.0 MVP release or Batch 2.

## Outcome

Provide a lightweight, single-device mini POS for an owner who sells physical products (e.g., pillows). Business Mode is separate from Personal Finance and must not require salary cutoffs.

## Confirmed requirements

- First-use workspace choice: Personal Finance or Business.
- Existing personal records and flows continue without migration.
- Business workspace: dashboard, products and shared stock groups, manual sale entry, Cash / GCash / Coop Pay payment selection, internal inventory/transaction history, and a daily sales audit at `/business/audit`.
- Confirmed sales reduce stock and record a transaction atomically.
- Data remains local-first, offline-capable, and segregated from the personal finance Dexie database.
- Do not add cloud services, accounting, invoicing, AI features, staff accounts, or supplier workflows for this MVP.

## Boundaries and assumptions

1. "Coop" is currently only a **manual payment label**. Do not claim external settlement, process a payment, or create receivables until the client explains Coop payment confirmation.
2. Only owner-confirmed successful sales update stock. Pending orders and refunds are outside this initial slice.
3. Price is stored in integer Philippine centavos to avoid floating-point rounding.
4. Business inventory is in a separate IndexedDB database. None of the 13 approved personal MVP stores are changed.
5. Local storage on a browser profile is **not access control**. A /business URL is not private by itself, there is no device sync, and browser data can be erased. Client production containing sensitive records requires separate security/backup/privacy acceptance.
6. The November 6, 2026 client sample now defines the daily product audit columns and test fixture. Opening stock and additions are reconstructed from inventory movements; sales use immutable line snapshots. “Reload Qty” and cash reconciliation remain provisional/unresolved. Exports are not included. Event entries are not tamper-proof. See [Daily Sales Audit architecture](02-Daily-Sales-Audit.md).
7. The business feature does not automatically post sales to personal Income or Cashflow.
8. The existing v1.0 Source of Truth remains authoritative for the v1.0 release. This proposal requires separate v1.1 approval before merging into a release branch.

## Initial entities (provisional v1.1 business domain)

- Product: id, name, unitPriceCentavos, inventoryPoolId, inventoryUnitsPerSale (currently 1), creation name/price snapshots, createdAt. Cached stockQuantity mirrors the authoritative pool.
- InventoryPool: id, name, stockQuantity, createdAt. Multiple saleable products/variants may consume one pool; independent products retain separate pools.
- Sale: id, requestKey, paymentMethod, totalCentavos, confirmedAt.
- SaleItem: saleId, productId, productNameSnapshot, inventoryPoolId, poolNameSnapshot, inventoryUnitsPerSale, quantity, unitPriceCentavos, lineTotalCentavos.
- InventoryMovement: productId, inventoryPoolId, poolNameSnapshot, saleId (optional), type, delta, beforeQuantity, afterQuantity, occurredAt.
- AuditEvent: saleId (optional), type, payload, occurredAt. This is an internal minimal history, not the client's final audit format.

## Transaction invariants

- Refuse negative stock, unknown product, invalid quantities and amounts.
- Reject duplicate products within a sale request.
- Use one Dexie transaction to write sale, item snapshots, inventory changes, and the internal event.
- Apply an indexed, unique request key for retry/idempotency.
- Preserve historic sale snapshots even if future product prices change.
- Validate combined quantities across variants sharing a pool and deduct their stock atomically. One unit per variant sale is provisional, including variants named “Set”; no bundle multiplier is inferred.
- Do not silently delete or overwrite an approved sale or internal event.

## Release gates

B0 proposal -> B1 business routing/onboarding -> B2 inventory -> B3 transaction safety -> B4 client audit adapter -> B5 QA/security/backup review -> B6 explicit release approval.

Merge gate: existing Personal tests, new Business tests, static checks/build, offline QA, and the privacy/access model must be reviewed independently. Do not merge into main or deploy as part of Batch 2.

## Client questions to resolve when the audit sample arrives

- Confirm whether “Reload Qty” means opening quantity plus intraday additions, and whether each Solo/Set sale consumes exactly one shared inventory unit.
- Explain the separate ₱7,718 cash panel and its Onhand Cash, JRIDE, GRAB and GCASH PAY entries. It is not the sample's ₱7,741 Cash Sales and is not automatically classified.
- Is Coop paid immediately, deducted from a cooperative balance, or collected later?
- Does the client need multiple staff, devices, secure remote access, data export, or a backup/restore procedure?
- Are order cancellation, exchanges, returns, and stock corrections in scope?
