# Business V2 Phase 2 — approved branch direction

Approved product direction, 2026-11-22 (Asia/Manila), from the [owner's PR #10 review comment](https://github.com/KennethVier/vier-portfolio-labs/pull/10#issuecomment-7073020171). This document is the implementation handoff, not evidence that Phase 2 functionality exists. Phase 1 remains open for live acceptance; PR #10 remains draft.

## Roles and navigation

One business has multiple branches/stock locations. Keep exactly two roles, `admin` and `staff`. Each Staff account has one assigned branch for the MVP; several Staff can share a branch. Admin oversees every branch. Retain both current Admin accounts during Phase 1.

| Capability | Admin target | Staff target |
| --- | --- | --- |
| Landing screen | Business Overview: consolidated daily sales, branch comparison, low stock, audit exceptions | Branch POS |
| Sales and analytics | All Sales and business/branch analytics | My Branch Sales and Branch Analytics |
| Stock | All Branch Stock; controlled corrections with audit history | Branch Inventory / Receive Stock; reasoned receipts and adjustments |
| Audits | Daily Audits across branches | Assigned branch Daily Audit |
| Catalog and prices | Products, scents, variants, sets and selling prices | Read approved catalog/prices |
| Administration | Branches, Users, Settings / Backup | No Admin pages or Admin-only cloud operations |

Phase 2 removes the operational POS entry from Admin navigation while preserving historical sales and controlled correction workflows. Phase 1 navigation stays as implemented: Admin retains existing local tools; Staff retains POS, My sales and Shared stock preview. Expanded Staff inventory/audit/analytics pages require the branch authorization and ledger work below before exposure.

## Data and authorization contract

- Separate the global product catalog from branch stock balances and movements. Preserve variant, set-composition, sale-price snapshots and inventory-pool consumption semantics.
- Sales, sale items, stock movements and audit events carry stable `branchId` and `actorId`. A Staff account can operate only its assigned branch. Admin can inspect all branches. Branch assignment must be enforced on the server, not accepted from an unchecked form field.
- Evaluate Dexie-supported branch realms or equivalent server authorization in a reviewed development proof before selecting the policy. A business is not the same thing as a synchronization realm: additional branch realms must still represent one business. Do not assume React filters protect other branches' data.
- The current `catalogStock` reference projection in `pesopilot-business-cloud-dev` does not supply operational quantities to the separate `businessRepository` POS ledger. A nine-unit shared snapshot alongside zero local sellable units is consistent with Phase 1. Do not copy snapshots into POS or treat them as stock receipts.
- Keep atomic offline sales, request idempotency and movement/audit history. Stock receipt/adjustment requires a reason and attributed event. Disconnected concurrent sales can oversell; show reconciliation/conflict exceptions rather than silently replacing balances. Define tested accounting and reconciliation before making a synchronized ledger authoritative.
- Dexie Cloud remains primary synchronization/authentication. Supabase remains a server-only complementary recovery/integration service. No second writable POS authority, automatic provider failover, duplicate authentication or custom synchronization engine.

## Small implementation milestones after Phase 1 acceptance

1. **Policy and migration proof:** model branch/actor identifiers and assignments; test server-denied cross-branch reads/writes and Admin-only operations. Prepare an explicit default-branch mapping for legacy records, backup, dry run, read-back and rollback. Preserve IDs, sales, quantities, audits, sets/pools and local database compatibility. Any destructive migration requires separate owner approval; none is authorized here.
2. **Operational stock and sales:** introduce tested branch receipts/adjustments and branch-scoped atomic sale/movement synchronization through Dexie Cloud, preserving idempotency and offline behavior. Validate stale/concurrent-device reconciliation and recovery observations before enabling it for existing data.
3. **Role workspaces:** build Business Overview/all-branch supervision and assigned-branch POS, inventory, sales, audit and analytics. Keep catalog/price editing Admin-only and expose synchronization/conflict status.
4. **Separate-device acceptance:** run the scenario below, verify legacy data and backup/rollback, then review before deployment. Requirements are ready for milestone design; implementation starts only after Phase 1 live acceptance and review.

Defer branch transfers, procurement, multi-business tenancy, marketplace stock automation and a configurable role builder. Production-grade replication, reconciliation and recovery belong to Phase 2 and require their own reviewed implementation; the Phase 1 recovery foundation alone is not a recovery guarantee.

## Required Phase 2 acceptance

Use Admin and Staff on separate development devices. Staff receives 10 units in Branch A; Branch POS shows 10. Sell two; POS shows eight. Branch audit and analytics reflect the sale with correct actor, branch and amounts; Admin sees Branch A's eight units and attributed sale. A second branch remains independent. Verify an offline sale reconciles without duplicates or silent stock loss, concurrent overselling is visible, and the server denies Staff access to other branches and Admin-only operations. Confirm original records and pool/set semantics remain intact.

Phase 1 live gates are tracked in the [Phase 1 runbook](11-V2-Phase-1-Cloud.md#current-acceptance-record-and-account-dropdown). Approval of this direction does not close either phase or authorize production changes.
