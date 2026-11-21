# Business V2 Phase 1 development runbook

The isolated iPad demo baseline is `test/pesopilot-ipad-preview` at `ca3767d`. The repository default is `master`. The Phase 1 feature branch targets the demo branch for review. Its Vercel feature-branch deployment rule is disabled. Use a separate browser profile and synthetic stock for development.

## Development architecture

The existing `pesopilot-business` Dexie database owns the local POS transaction. Dexie Cloud handles OTP, session restoration, realm membership, and synchronization of a narrow stock projection in a separate Dexie database. A login or logout cannot erase the original ledger. The dedicated database has one application realm, `rlm-pesopilot-business-dev`, plus the provider's internal realms. An Admin chooses a local product in **Shared stock** to publish its ID, name, selling price in centavos and current quantity. Members can read that snapshot. POS sales still commit locally during an outage. The addon retries pending cloud changes on reconnect. Full stock and sale replication is a Phase 2 gate.

Supabase Free project `zamlyidelptkxouikwcj` in Singapore stores recovery data. Business browsers receive no Supabase key and have no database privileges. There is no alternate writable POS backend. The original staging-only Auth tables were retired after confirming they were empty. The retired Staff Edge Function returns 410 behind JWT verification. New Supabase staging Auth users are blocked.

| Operation | Admin | Staff |
| --- | --- | --- |
| View local catalog and stock, record POS sales at displayed prices | Yes | Yes |
| View receipts | All local history | Own V2 local receipts |
| Inventory, prices, audit, analytics, backup/export | Yes | No |
| Publish shared stock, invite or remove Staff | Yes | No |
| Read shared stock | Yes | Yes |
| Write recovery data from browser | No | No |

Dexie realm membership grants read access to shared objects. The Staff role has no realm mutation permissions. Keep costs, sales analytics and private receipts out of this realm's shared stock table. An Admin has realm management permission. Routes, menus, sale controls and cached membership implement UI restrictions. Dexie Cloud enforces permissions on synchronized changes. Offline membership can remain stale until reconnect. A browser operator with filesystem or developer-tools access can inspect or alter local IndexedDB. Use trusted devices and browser profiles. Account disabling removes realm membership on sync. Existing local receipts carry an account-derived request-key prefix. Legacy receipts have no reliable actor identity and stay in Admin history.

## Owner setup on Windows

Use the existing verified **development** database and its original operator directory. Keep the owner key there. The following commands assume the Phase 1 branch has been checked out, and start in the repository root.

```powershell
$app = (Resolve-Path .\apps\pesopilot-web).Path
Set-Location (Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev')
node "$app\cloud\bootstrap-dev.mjs" (Read-Host 'Verified first Admin email')
npx --yes dexie-cloud@3.0.7 import business-bootstrap.local.json
npx --yes dexie-cloud@3.0.7 whitelist http://localhost:5173
Set-Location $app
npm ci
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm run dev -- --port 5173 --strictPort
```

The generator checks the configured development URL and refuses to overwrite an existing import file. Review the generated JSON before importing. In Dexie Cloud Manager use the verified-email identity strategy, OTP, and restricted onboarding. Ensure the first Admin identity is registered with the development database before using the login-only UI. If the database's admission policy requires pre-approved users, approve an invited Staff email there before first login. Database ownership and an application's Admin membership are separate.

Open `http://localhost:5173/business`, sign in with the verified developer email and enter the code directly in Dexie's dialog. Subsequent sign-ins use fresh email codes, including account recovery via the verified mailbox. Use **Users** to invite a real authorized Staff tester. Accept the invitation using a separate browser profile. A public URL alone cannot import a schema, grant membership or whitelist an origin.

## Hosted acceptance

1. Sign in as Admin, create synthetic local stock and publish a shared snapshot. Wait for the sync status to reach in-sync.
2. Sign in as invited Staff in a second profile. Confirm the snapshot arrives. Confirm Admin URLs redirect to POS and a direct Staff-authenticated Dexie update to the Admin-owned snapshot or membership table is rejected on sync. Reload both clients and verify the Admin-owned values remain.
3. Disconnect the Staff device with a restored session and record a local sale. Check My sales, local stock deduction and prior set/solo semantics. Reconnect and check sync status. Phase 1 intentionally publishes only explicitly selected stock snapshots.
4. Remove Staff while online. Confirm subsequent realm pulls lose shared access. Check logout and restoration after a browser restart in each profile.
5. With a read-only service credential, run the one-record recovery check below against the synchronized synthetic stock ID. Check the staging observation and retry once.

## Recovery and migration

The versioned migration `supabase/migrations/202611210002_recovery.sql` creates a private recovery schema for categories, pools, products, sales, sale items, movements, events and catalog observations. Future marketplace order linkage belongs in a later migration. Only the server role can call the recovery RPC. Acknowledged duplicate observations are deduplicated by source ID and content. Observations are samples, not an ordered stock ledger. Repeated returns to a previous quantity cannot be replayed as distinct events.

The server-side smoke script performs a fixed-origin Dexie REST read of a single catalog row. It validates the realm, ID and fields before calling the staging RPC. For local operator use, inject a short-lived Dexie token with ACCESS_DB and GLOBAL_READ on this dev database and a staging Supabase server key via a secret manager into the process environment. Run `node scripts/cloud/recover-stock.mjs <shared-product-id>` from the app. Environment names are `DEXIE_READ_TOKEN` and `SUPABASE_SERVER_KEY`. Neither belongs in Vite. Schedule no worker in Phase 1. For Phase 2, treat webhooks as asynchronous change notifications, reread trusted source data using server credentials, and design durable retries and reconciliation before enabling them.

Before any future import, stop selling on the source device, export a complete Business backup from Settings, and retain the original file separately. Run `npm run migration:dry-run -- <backup.json>`. It opens a disposable PostgreSQL-compatible database, applies the migration, invokes the existing backup validator, inserts normalized rows in dependency order, and compares counts. Invalid duplicates, relationships or stock history abort the transaction. A failure requires correcting the source or selecting another verified backup, then starting a new dry run. No production import or destructive restore command is included.

| IndexedDB source | Recovery mapping |
| --- | --- |
| products, inventoryPools | Stable IDs and pool references. Category comes from catalog metadata. Price remains integer centavos. Original product JSON retains family, size, scent and set type. |
| sales | Original sale ID, unique request key, payment, confirmation time and total. Unknown actors remain unassigned. |
| saleItems | Original numeric line ID, sale/product/pool links, quantity and full line snapshot including sale format. |
| inventoryMovements, auditEvents | Numeric IDs, links and original payloads. |
| productPhotos | Retained in the original backup. Excluded from Phase 1 cloud and reported separately. |

Dexie Cloud does not provide a collision-free mapping for independent devices' existing auto-incremented line, event and movement IDs. Keep the v3 stores intact. Define stable device-qualified IDs, references, data ownership and legacy reconciliation before enabling ledger sync.

## Quotas and operations

Dexie Free includes three production seats, 10 concurrent clients and 100 MB total storage split into 25 MB object data and 75 MB blobs, with 1,000 blob writes/month. The Free pricing page lists 50 syncs per five minutes per user. Shared stock displays a UTF-8 payload estimate and flags 20 MB. It excludes server overhead and other tables. Check actual account usage in Dexie Cloud Manager. Supabase Free includes 500 MB database per project, 1 GB file storage and 5 GB egress. Free projects may pause after inactivity. Run `scripts/cloud/quota.sql` in the staging SQL Editor to measure the entire PostgreSQL database and flag 80% usage. The provider dashboards remain authoritative for billed usage.

Sources: [Dexie pricing](https://dexie.org/pricing), [access control](https://dexie.org/docs/cloud/access-control), [CLI](https://dexie.org/docs/cloud/cli), [REST](https://dexie.org/docs/cloud/rest-api), [webhooks](https://dexie.org/docs/cloud/web-hooks), [Supabase pricing](https://supabase.com/pricing).

## Verification and Phase 2 gates

Hosted development checks confirmed Dexie OTP enabled, anonymous membership GET rejected with 401, and Supabase RPC privileges denied to both browser roles. Two service-role calls in a rolled-back staging transaction produced one observation. Staging used 11,703,987 bytes (2.34% of the 500 MB allowance). Automated tests cover routing, membership, addon configuration, Staff controls, the one-way HTTP contract, database privileges and migration of a nonempty set-format fixture alongside existing business regressions. The CLI dry run also completed for an empty backup. Live OTP, owner import, cross-device role enforcement, offline/reconnect behavior on a physical iPad and authenticated end-to-end recovery remain acceptance checks.

Before Phase 2, complete hosted acceptance, reconcile a representative non-production backup and agree conflict rules for shared pools and sets. Define stable IDs and idempotency across devices, authorize actor attribution, restrict financial records, establish replication checkpoints, updates and tombstones, then test quota exhaustion, restore drills and recovery lag. Continue recording locally through provider outages. Promotion and production cutover require separate approval.
