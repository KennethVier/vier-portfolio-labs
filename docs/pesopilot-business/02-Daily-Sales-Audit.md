# Daily Sales Audit — proposed v1.1 architecture

Status: Batch 3 implemented; review and user validation pending. This document does not change the v1.0 Source of Truth.

## Flow and persistence

`BusinessAuditPage → DailyAuditReport / useDailyAudit → dailyAuditService → businessRepository → pesopilot-business`

The report reads products, inventory pools, confirmed sales, sale-item snapshots and inventory movements within one read-only Dexie transaction. It never edits sales or writes derived report totals. React handles display and date selection; the deterministic service owns calculations and history checks.

Business database version 2 adds `inventoryPools` and pool-reference indexes. Each existing product receives its own pool with its saved quantity. Existing Cash/Coop sales, request keys, centavo amounts, item names/prices, movement IDs/deltas and internal events are preserved; additive pool metadata identifies historical consumption. Dexie's upgrade transaction makes the migration atomic. Personal's database and 13 approved stores are untouched.

For new products, a pool name defaults to the product name. New variants can join an existing pool but cannot introduce another opening quantity. They retain their own prices. Manual adjustments to any variant affect the whole pool. `inventoryPools.stockQuantity` is authoritative; product quantities are synchronized caches used by the existing product interface. No reassignment/merge of already-saved independent products is implemented.

All confirmed sales validate payment, owner confirmation, unique products, quantities, reviewed prices and the combined demand per pool. One inventory unit per variant sale is an explicit provisional rule, even for “Set”. There are no bundle multipliers. One read-write transaction records sale, item and pool/name/price/consumption snapshots, pool/cache changes, inventory movements and the internal event. Failures abort all writes. Committed request keys return the original result only for the same request. No payment gateway or settlement verification occurs.

## Daily projection

The selected date uses Asia/Manila midnight inclusive through the following midnight exclusive. Stored ISO instants are compared numerically; the device timezone does not determine grouping. Monetary values and sums use safe integer centavos; invalid/overflowed data fails closed.

For each inventory pool:

- Opening = sum of movement deltas before the selected day.
- Additions = positive opening_stock, stock_received (legacy) and stock_adjustment deltas during the day.
- Available = opening + additions.
- Sold consumption = negative sale movements during the day, matched to the confirmed sale's items and original confirmation date.
- Non-sale removals = negative stock adjustments during the day.
- Remaining = available − sold consumption − non-sale removals.

“Starting / Reload Qty” displays available quantity and identifies opening/additions separately. This is provisional pending the client's definition of Reload Qty. Manual removals appear explicitly outside the 11 required columns as well as alongside affected group remaining stock.

For each product/name/price snapshot row, Cash, GCash and Coop quantity/centavos are summed separately from sale items. Total Sold is their combined quantity. Sale totals and movement/item quantities must reconcile before a report is returned. Unknown payment/movement types, missing links and inconsistent totals produce an error instead of plausible financial zeroes.

Stock appears once on each pool heading; variants show their original prices and sales beneath it. Footer stock sums pools once. Different sale-time prices/names on the same day have separate rows. Current product names/prices/stock do not rewrite recorded sales. New unsold products use creation snapshots. For migrated unsold products, historical prices were not recorded: show unavailable, and label names as captured at migration rather than claiming a recovered historical catalog.

The November 6, 2026 fixture is stored in `dailyAuditService.test.js` and enters products, shared variants and confirmed Cash/Coop sales through the real services. It calculates 405 available, 79 sold, 326 remaining and ₱14,084 overall, with Cash ₱7,741 / Coop ₱6,343. GCash is zero only because that sample has no separate GCash sales column; another fixture exercises all three payment methods.

## Open client decisions and operating limits

Confirm Reload Qty, one-unit Solo/Set consumption, Coop settlement semantics and whether any future prices/group transfers need additional history. The separate ₱7,718 cash panel sums Onhand Cash, JRIDE, GRAB and two GCASH PAY entries; it does not reconcile to ₱7,741 Cash Sales without further explanation. Do not classify these entries as expenses, receipts or GCash sales. Detailed cash reconciliation waits for clarification.

This is browser-local, erasable, unauthenticated data; the route is not private and events are not tamper-proof. No backup, sync, export, accounting, staff or payment integration is added. Existing single-product POS UI and live-form retry retention remain unchanged. Reports scan history; actual browser mobile/keyboard/offline/reload/multi-tab QA and a separately approved privacy/access/backup design remain release gates. See the tracker for executed checks and failures of browser-tool availability.
