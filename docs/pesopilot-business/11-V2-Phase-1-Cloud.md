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

The browser deliberately uses OTP with login-only intent. Dexie rejects an unknown application user before the client reads realm membership. The original bootstrap only imported realm data. A verified database owner or an imported member may therefore still receive “This user is not registered.” An incomplete realm import can independently deny Business access after authentication.

In Dexie Cloud Manager confirm this development database uses the **Email** identity strategy, email OTP and restricted user admission. Stop if it uses another identity strategy. Do not switch the strategy on an established database. Run these commands with Node 24 in PowerShell from a checkout of the updated Phase 1 branch:

```powershell
$app = (Resolve-Path .\apps\pesopilot-web).Path
$operator = Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev'
$ownerEmail = Read-Host 'Verified development owner email'
& "$app\cloud\setup-first-admin.ps1" -Email $ownerEmail -OperatorDirectory $operator

Push-Location $operator
try {
    npx.cmd --yes dexie-cloud@3.0.7 whitelist http://localhost:5173
    if ($LASTEXITCODE -ne 0) { throw 'Development origin configuration failed.' }
} finally { Pop-Location }

Set-Location $app
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
$env:VITE_BUSINESS_DEXIE_URL = 'https://z5jxogiwe.dexie.cloud'
npm.cmd run dev -- --port 5173 --strictPort
```

The setup script checks the URL from the operator directory, exchanges the local CLI credential at the fixed development endpoint, and checks the exact application user, realm and stable membership ID before writing. It registers a missing user through the supported POST /users API with a development evaluation license. Existing users keep their license and evaluation time. An incompatible identity, inactive license or conflicting realm owner/member stops the procedure. A partial import generates a fresh temporary manifest for the missing records and uses the official CLI import. A successful rerun performs reads only against the user and realm data. The previous local JSON manifest is ignored. Registration and import are separate provider operations, so repeat the same command after a partial failure. Run one owner bootstrap at a time.

Use the same command with `-VerifyOnly` for read-only diagnostics. It reports whether the application user already exists, the realm owner matches, and the Admin membership is accepted. A 401/403 requires checking the existing local operator authorization. Do not share the local key, access tokens or email codes. Under restricted admission, an invited Staff tester also needs an approved application user via the database manager. Assign only Staff membership for that person.

Open `http://localhost:5173/business` in a separate development browser profile, enter the verified owner email and finish OTP in Dexie's dialog. Confirm **Users** is accessible. A successful bootstrap read-back proves the three provider records exist; it does not prove live OTP or server enforcement.

Provider references: [Dexie application-user management](https://dexie.org/docs/cloud/rest-api#users-endpoint), [identity strategies](https://dexie.org/docs/cloud/authentication), [realm access control](https://dexie.org/docs/cloud/access-control).

## Controlled development Admin transfer

The approved primary application Admin is now `pesopilotbusiness@gmail.com`. The existing developer application user and accepted Admin membership remain available until the business account completes live verification. Use the dedicated transfer command after the original bootstrap has succeeded. The original first-Admin command deliberately continues to reject conflicting owners. After transfer, use the transfer verifier for the business identity.

From the updated feature worktree in Windows PowerShell:

```powershell
$app = Join-Path (git rev-parse --show-toplevel) 'apps\pesopilot-web'
$operator = Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev'
& "$app\cloud\transfer-admin.ps1" -Mode transfer -OperatorDirectory $operator
& "$app\cloud\transfer-admin.ps1" -Mode verify -OperatorDirectory $operator
```

The operator script uses only the existing development CLI credential locally. It validates the original developer user and Admin membership, then registers the business application user with an evaluation license if missing. It preserves an existing active license. It creates the business account's accepted Admin membership under a separate stable ID, reads it back, and only then replaces the existing realm object with a copy whose owner is the business email. It checks realm metadata and both memberships afterward. Run one transfer at a time and pause other membership changes during execution. The REST API offers object replacement rather than a compare-and-swap transaction, so a concurrent operator must coordinate with this procedure.

If a step fails, already completed steps persist. Re-run the same transfer command after addressing the diagnostic. A user or membership created before failure is reused, and an already transferred owner is verified without another write. Unexpected owners, conflicting memberships and inactive users require inspection. No automatic license reset or deletion occurs.

To return application realm ownership to the developer account:

```powershell
& "$app\cloud\transfer-admin.ps1" -Mode rollback -OperatorDirectory $operator
```

Rollback retains both users, both Admin memberships, all stock snapshots and current realm metadata. It restores only the realm owner after confirming developer Admin access. A repeated rollback is safe. Run transfer again when ready to retry. Keep developer Admin access until business OTP, session restoration and authorized stock/user operations pass in a separate browser profile. Removing developer access is a later explicit action.

This transfer changes the application's shared realm `owner` property. It does not transfer the Dexie Cloud database creator, API clients or management authorization. Neither stock object owners nor private realms are rewritten. Realm ownership gives access to manage realm objects, while the accepted membership supplies visibility. The Supabase recovery configuration is outside this operation.

These local script read-backs cannot establish that OTP was completed. Live acceptance still requires the business email to sign in, reach Users, publish a synthetic snapshot, restore a session, and retain access after the developer signs out. Verify Staff rejection and revocation separately before closing Phase 1.

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

## Initial authorization synchronization

A fresh OTP session previously queried local realm and membership records immediately. A fresh cloud cache could therefore deny access before the addon downloaded those records. The account observer now waits for a completed pull with `purpose: 'pull', wait: true` on an online session before observing membership. Logout or an account switch cancels the old observer so a delayed pull cannot restore the previous account. Subsequent membership changes remain reactive.

The gate displays Synchronizing Business access while waiting. Failed pulls show a synchronization error with Retry access check and Sign out. A completed pull with no visible authorized realm produces access denied. An inactive or expired license has its own explanation. A restored offline session can use its existing synchronized membership; a cache without membership requires a connection. No tables are cleared or upgraded.

For live diagnosis, expand Access diagnostics on a blocked screen. Check userId against `pesopilotbusiness@gmail.com`, the actual license status, realm ID, visible realm owner, accepted membership count and role list. These values come from the current session and its local synchronized scope. They contain no tokens. Use the owner-side `transfer-admin.ps1 -Mode verify` to independently verify the application users, realm owner and both Admin memberships in the hosted database. A missing realm after a successful pull indicates a visibility or identity issue requiring owner inspection.

The screenshot alone does not expose the authenticated user ID, license or server membership. Hosted business OTP was reported successful by the user, while authorization is still pending. After updating, reload the development app with its existing browser profile, sign in, wait for the initial pull, and confirm Admin navigation and an authorized synthetic stock operation. If it fails, report the Access diagnostics and whether it shows a sync error or access denied. Retain both Admin memberships throughout acceptance.
