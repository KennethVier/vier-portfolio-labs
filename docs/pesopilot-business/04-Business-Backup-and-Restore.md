# Business-only backup format and recovery

## POS redesign compatibility (local review)

The POS redesign exports **format version 2**, with `databaseVersion: 2` and the same six Business stores. It accepts both existing format 1 backups and format 2 backups. No Personal stores, database indexes, or schema migration change. Older builds that only understand format 1 will reject new exports; use this redesign or a later compatible build to restore format 2.

Format 2 permits an optional, strict `products.catalog` object: required `category` (1–80 characters) and `family` (1–120), optional `scent`/`size` (1–80), `type` (`Solo` or `Set`), and a development sample key in the `pos-demo-v1-` namespace. Products without metadata stay independently selectable; metadata is never inferred by splitting names. Format 1 continues to reject this new field. Unknown metadata fields and invalid values are rejected before writes.

Sample keys must be unique and match both the product ID and its independent inventory group ID. Actual and sample products cannot share stock, including through restore. Samples retain their remaining fictional quantities on round trip and are skipped by repeated sample loading. Their sale-time product snapshots are prefixed `Sample ·`; existing historical snapshots are not rewritten. Existing validation limits, reconciliation, owner confirmation, stale-review detection and atomic replacement continue to apply.

The format 1 description below documents compatibility with existing backups.

Batch 4, proposed v1.1. Implemented and automated tests passed; real-browser download/file chooser/recovery validation and owner acceptance remain pending.

## Owner procedure

1. Open Business Workspace and choose **Download Business Backup**. Confirm the file actually downloaded. Do this after each selling day and before clearing site data, changing devices/origins or restoring anything.
2. Keep dated files in a private location separate from the operating device. Files contain unencrypted financial information. This application sends no backup file to a server; sharing or copying it is the owner's responsibility.
3. To recover, stop sales/stock changes in all tabs and resolve any uncertain sale in Sales History. Download the current dataset first if it is readable.
4. Choose the Business JSON file, review counts, check the owner confirmation and choose **Replace Business Records**. The replacement removes all current Business history; it does not merge. Personal records and preferences are outside this operation.
5. Verify products, shared stock, all payment totals, sale history and historical audits after success. Retain the original file. A display refresh failure after commit is reported separately from restore success.

Never restore a stale backup to resume selling without reconciling real physical stock and sales since that backup. Old request keys absent from a restored dataset cannot deduplicate transactions recorded after the backup. Same-key retries only deduplicate against records still present in the current local database. Do not manually repeat an uncertain transaction just because a page was reloaded.

## Version 1 envelope

```json
{
  "app": "PesoPilot Business",
  "version": 1,
  "databaseVersion": 2,
  "exportedAt": "2026-11-08T00:00:00.000Z",
  "stores": {
    "products": [],
    "inventoryPools": [],
    "sales": [],
    "saleItems": [],
    "inventoryMovements": [],
    "auditEvents": []
  }
}
```

The illustration is a valid empty backup. Nonempty entries are complete stored records, including numeric IDs for auto-increment tables, request keys, original sale prices/names, stock snapshots, pool links, required adjustment reasons and internal event payloads. The authoritative field schema is `businessBackupValidation.js`. Current pools/products use v2 records; migrated v1 event payloads may omit pool references and consumption fields, and are preserved as originally recorded. Raw v1 database dumps and Personal `app: "PesoPilot"` files are not Business backups.

All six stores are mandatory, including empty arrays. Unknown fields/stores, incompatible app/format/schema versions and malformed records are rejected. No silent selective import, repairs, conversions, ledger merging, encryption or cloud upload is provided. Stored names may contain HTML-like text but are displayed through React escaping, never evaluated.

Files must have `.json` extension and be at most 10 MiB (also enforced on generated exports). Each store supports at most 100,000 entries; the preflight additionally bounds total traversal to 250,000 values, depth to 12 and nested collections to 1,000 entries. These conservative limits can reject a large legitimate history; do not split or edit ledgers to work around them. Agree a reviewed format/scale change instead. Preflight bounds run before Zod's collection parser to reduce resource-exhaustion exposure, and malformed records fail individually rather than accumulating errors for every stored row. This mitigates this import surface; it is not a claim that the installed Zod advisory is fixed.

## Integrity and atomicity

The service obtains one read-only transaction snapshot of exactly the six Business tables. Export validates that snapshot before generating a download. Import validates a copied object before any write: safe integer amounts/quantities, positive prices/lines, unique primary IDs/request keys, valid payment types/timestamps, complete product/pool and sale/item/movement links, one line/movement per product per sale, exact amount sums, movement before/delta/after chains, final pool quantities and matching cached product quantities. Each sale requires exactly one matching completion event, each non-sale movement its matching event, and event snapshots must agree with the recorded history. Legacy stock receiving events are supported without inventing reasons that were never stored.

Movement IDs preserve transaction order even when device clock readings repeat. Movements must not precede product/pool creation or cross Philippine calendar days backward within a pool: those histories cannot reliably reconstruct historical stock. A clock error causing such a history is refused, not silently repaired. The format cannot prove provenance or detect a consistently forged replacement. It has no signature, password, encryption or remote authority. Browser tools can edit local data.

Preparation also captures the **current local** six-store snapshot for owner review. On confirmation, the repository opens one read/write Dexie transaction spanning all six tables, compares that current snapshot, then clears and bulk-adds the validated backup. A sale or adjustment committed by another connection before that transaction acquires its lock causes rejection with no changes. A concurrent write queued after replacement can still run afterward; close other tabs and stop selling during restore. There is no cross-device lock.

Any clear/write error aborts the entire transaction, including all earlier clears/writes. Duplicate UI clicks are locked immediately. Current schema v2 is retained; no destructive schema migration was added. An aborted restore leaves original records intact. Power-loss durability is subject to browser/OS IndexedDB guarantees, not a promise of crash-proof disk storage. A failed or corrupt backup is refused; retain it for diagnosis without overwriting the working database.

Automated tests prove rollback on a late event-store failure, stale-review rejection, no Personal mutations, preserved IDs/relationships and a subsequent auto-incremented movement. An actual browser recovery drill on a fresh test profile remains a release gate.
