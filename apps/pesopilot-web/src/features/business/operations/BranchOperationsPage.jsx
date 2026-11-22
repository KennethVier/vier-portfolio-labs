import { prepareLegacyImport, importLegacy } from './legacyMigration.js'
import { exportBranchBackup, downloadBranchBackup } from './branchBackup.js'
import { useWorkspaceRoute } from '../hooks/useWorkspaceRoute.js'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { BusinessPosPage } from '../pages/BusinessDashboardPage.jsx'
import { SalesHistory } from '../components/SalesHistory.jsx'
import { DailyAuditReport } from '../components/DailyAuditReport.jsx'
import { ProductForm } from '../components/ProductForm.jsx'
import { peso, selectClass } from '../components/businessPresentation.js'
import {
  buildDailyAudit,
  getManilaDate,
} from '../services/dailyAuditService.js'
import { parsePriceCentavos } from '../services/businessService.js'
import { businessRepository } from '../repositories/businessRepository.js'
import { db } from '../cloud/client.ts'
import { useBranchWorkspace } from './useBranchWorkspace.js'
import {
  assignStaff,
  createBranch,
  publishCatalog,
} from './branchAdministration.js'

export function BranchOperationsPage({ screen = 'home' }) {
  useWorkspaceRoute('business')
  const work = useBranchWorkspace()
  const [date, setDate] = useState(getManilaDate())
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [migration, setMigration] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const branchKey = useRef(crypto.randomUUID())
  const stockKey = useRef(crypto.randomUUID())
  const admin = work.profile.role === 'admin'
  const branches = work.overviews ?? []
  const selected = branches.filter(
    (row) => !work.branchId || row.branch.id === work.branchId,
  )
  const branchNames = new Map(
    branches.map((row) => [row.branch.id, row.branch.name]),
  )
  const reports = useMemo(
    () =>
      selected.map((row) => {
        try {
          return {
            id: row.branch.id,
            name: row.branch.name,
            report: buildDailyAudit(date, row, { allowNegativeStock: true }),
          }
        } catch {
          return {
            id: row.branch.id,
            name: row.branch.name,
            error:
              'Audit cannot reconcile this ledger. Review stock conflicts and movement history.',
          }
        }
      }),
    [selected, date],
  )
  async function run(action, message, after) {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      after?.()
      setNotice(message)
    } catch (failure) {
      setError(
        failure.message ||
          'Operation failed. Retry without changing the request.',
      )
    } finally {
      setBusy(false)
    }
  }
  function stock(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    run(
      () =>
        work.service.adjustStock({
          ...values,
          quantity: Number(values.quantity),
          requestKey: stockKey.current,
        }),
      'Stock operation recorded on this device. Check synchronization status for cloud confirmation.',
      () => {
        form.reset()
        stockKey.current = crypto.randomUUID()
      },
    )
  }
  const status = (
    <div className="space-y-2">
      <p role="status">
        Cloud synchronization: {work.sync.phase}. Local operations await a
        completed push before another client can see them.
      </p>
      {work.sync.phase === 'error' && (
        <p role="alert">
          Cloud synchronization failed. Local records remain on this device;
          inspect access/schema and retry.
        </p>
      )}
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => run(work.refresh, 'Cloud pull completed.')}
      >
        Synchronize / retry
      </Button>
      {(work.error || error) && <p role="alert">{work.error || error}</p>}
      {notice && <p role="status">{notice}</p>}
      {work.conflicts.length > 0 && (
        <p role="alert">
          Stock conflict:{' '}
          {work.conflicts
            .map((pool) => pool.name + ' (' + pool.stockQuantity + ')')
            .join(', ')}
          . Sales remain recorded. Reconcile the physical count with a reasoned
          adjustment.
        </p>
      )}
    </div>
  )
  const invitations = work.invites.filter((invite) =>
    (work.registry ?? []).some((branch) => branch.id === invite.realmId),
  )
  const noAssignment = !admin && (work.branches.length !== 1 || !work.branchId)
  if (screen === 'home' && !admin && !noAssignment && !work.error)
    return (
      <BusinessPosPage workspace={work} operational headerStatus={status} />
    )
  const titles = {
    home: 'Business Overview',
    stock: admin ? 'Inventory Overview' : 'Branch Inventory',
    sales: admin ? 'All Sales' : 'Branch Sales',
    analytics: admin ? 'Analytics' : 'Branch Analytics',
    audit: admin ? 'Daily Audits' : 'Daily Audit',
    products: 'Products',
    branches: 'Branches and Users',
  }
  return (
    <BusinessShell>
      <h1 className="font-heading text-3xl">{titles[screen]}</h1>
      {status}
      {invitations.map((invite) => (
        <Button
          key={invite.realmId}
          disabled={busy}
          onClick={() =>
            run(
              () => invite.accept(),
              'Branch invitation accepted. Synchronize to load access.',
            )
          }
        >
          Accept branch invitation: {invite.realmId}
        </Button>
      ))}
      {work.isLoading ? (
        <p role="status">Loading authorized branch records…</p>
      ) : null}
      {noAssignment ? (
        <p>
          Ask Admin to assign exactly one branch, then accept its invitation and
          synchronize. Branch operations stay unavailable until access is
          verified.
        </p>
      ) : null}
      {admin && !['home', 'products', 'branches'].includes(screen) && (
        <label>
          Branch
          <select
            className={selectClass}
            value={work.branchId}
            onChange={(event) => work.setBranchId(event.target.value)}
          >
            <option value="">All authorized branches</option>
            {work.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!noAssignment && !work.error && (
        <>
          {screen === 'home' && admin && (
            <>
              <p>
                Authorized branch records synchronized into this client. Pending
                changes may still be on other offline devices.
              </p>
              {branches.length ? (
                branches.map((row) => {
                  const today = row.sales.filter(
                    (sale) =>
                      getManilaDate(new Date(sale.confirmedAt)) === date,
                  )
                  const conflicts = row.conflicts.length
                  return (
                    <section
                      key={row.branch.id}
                      className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 space-y-2"
                    >
                      <h2 className="font-heading text-xl">
                        {row.branch.name}
                      </h2>
                      <p>
                        Sales today:{' '}
                        {peso(
                          today.reduce(
                            (sum, sale) => sum + sale.totalCentavos,
                            0,
                          ),
                        )}{' '}
                        · {today.length} transactions
                      </p>
                      <p>
                        Stock pools: {row.pools.length} · Low/empty stock:{' '}
                        {
                          row.pools.filter((pool) => pool.stockQuantity <= 2)
                            .length
                        }
                      </p>
                      <p>
                        {conflicts
                          ? conflicts +
                            ' stock conflicts require reconciliation.'
                          : 'No negative stock balances in this client.'}
                      </p>
                      <p>
                        Staff memberships:{' '}
                        {
                          work.members.filter(
                            (m) =>
                              m.realmId === row.branch.id &&
                              m.roles?.join() === 'staff' &&
                              m.accepted &&
                              !m.rejected,
                          ).length
                        }
                      </p>
                    </section>
                  )
                })
              ) : (
                <p>
                  No authorized operational branches yet. Create a branch and
                  assign Staff in Branches and Users.
                </p>
              )}
              <p>
                Consolidated recorded sales today:{' '}
                {peso(
                  branches
                    .flatMap((row) => row.sales)
                    .filter(
                      (sale) =>
                        getManilaDate(new Date(sale.confirmedAt)) === date,
                    )
                    .reduce((sum, sale) => sum + sale.totalCentavos, 0),
                )}
              </p>
              <p>
                Audits are computed from the recorded ledger. No separate
                submitted-audit status is claimed.
              </p>
            </>
          )}
          {screen === 'stock' && (
            <>
              {selected.map((row) => (
                <section key={row.branch.id} className="space-y-2">
                  <h2 className="text-xl">{row.branch.name}</h2>
                  <ul>
                    {row.products.map((product) => (
                      <li key={product.id}>
                        {product.name} · {product.stockQuantity} available ·{' '}
                        {peso(product.unitPriceCentavos)}
                      </li>
                    ))}
                  </ul>
                  {row.conflicts.length > 0 && (
                    <p role="alert">Negative stock requires reconciliation.</p>
                  )}
                </section>
              ))}
              {!admin && (
                <form
                  onSubmit={stock}
                  className="rounded-lg bg-surface-container-lowest p-4 space-y-3"
                >
                  <fieldset
                    disabled={busy || work.isLoading}
                    className="space-y-3"
                  >
                    <legend className="font-semibold">
                      Receive or adjust branch stock
                    </legend>
                    <label>
                      Product
                      <select name="productId" className={selectClass} required>
                        <option value="">Select product</option>
                        {work.products
                          .filter((p) => p.catalog?.type !== 'Set')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} · {p.stockQuantity} available
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Operation
                      <select name="direction" className={selectClass}>
                        <option value="add">Receive / add stock</option>
                        <option value="remove">Remove stock</option>
                      </select>
                    </label>
                    <Input
                      label="Quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      step="1"
                      required
                    />
                    <Input
                      label="Reason"
                      name="reason"
                      maxLength={240}
                      required
                    />
                    <Button type="submit">
                      {busy ? 'Recording…' : 'Record stock operation'}
                    </Button>
                  </fieldset>
                </form>
              )}
            </>
          )}
          {['sales', 'analytics'].includes(screen) &&
            selected.map((row) => (
              <section key={row.branch.id}>
                <h2 className="text-xl">{row.branch.name}</h2>
                <SalesHistory
                  sales={row.sales.map((sale) => ({
                    ...sale,
                    items: row.items.filter((item) => item.saleId === sale.id),
                  }))}
                />
              </section>
            ))}
          {screen === 'audit' && (
            <>
              <Input
                label="Audit date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              {reports.map((row) => (
                <section key={row.id}>
                  <h2 className="text-xl">{row.name}</h2>
                  {row.error ? (
                    <p role="alert">{row.error}</p>
                  ) : (
                    <>
                      {row.report.groups.some(
                        (group) => group.remainingQuantity < 0,
                      ) && (
                        <p role="alert">
                          This audit includes negative stock. Retained sales
                          require physical-count reconciliation.
                        </p>
                      )}
                      <DailyAuditReport report={row.report} />
                    </>
                  )}
                </section>
              ))}
            </>
          )}
        </>
      )}
      {screen === 'products' && admin && (
        <>
          <p>
            Shared catalog and prices. New products start with zero stock;
            assigned Staff records physical receipts in Branch Inventory.
          </p>
          <ProductForm
            catalogOnly
            products={work.catalog}
            disabled={busy}
            addProduct={work.service.addProduct}
          />
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run(
                async () =>
                  publishCatalog(
                    db,
                    work.profile.id,
                    await businessRepository.listProducts(),
                  ),
                'Catalog definitions published. No stock quantities were imported.',
              )
            }
          >
            Publish this device’s legacy catalog definitions
          </Button>
          <p>
            Existing legacy sales, quantities and photos remain in the original
            device database. This action adds only catalog definitions with
            stable pool IDs.
          </p>
          <ul className="space-y-3">
            {work.catalog.map((product) => (
              <li key={product.id}>
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const price = new FormData(event.currentTarget).get('price')
                    run(
                      () =>
                        work.repo.setPrice(
                          product.id,
                          parsePriceCentavos(price),
                        ),
                      'Catalog price saved locally; check synchronization.',
                    )
                  }}
                >
                  <span>
                    {product.name} · {peso(product.unitPriceCentavos)}
                  </span>
                  <Input
                    label="New price (PHP)"
                    name="price"
                    inputMode="decimal"
                    required
                  />
                  <Button type="submit" disabled={busy}>
                    Update price
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
      {screen === 'branches' && admin && (
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run(
                async () =>
                  downloadBranchBackup(
                    await exportBranchBackup(db, work.profile.id),
                  ),
                'Authorized branch backup downloaded. Store it privately; it is separate from the legacy device backup.',
              )
            }
          >
            Download branch operations backup
          </Button>
          <p>
            Branch records in this client:{' '}
            {(
              new TextEncoder().encode(
                JSON.stringify({ catalog: work.catalog, branches }),
              ).length / 1024
            ).toFixed(1)}{' '}
            KiB estimated. Check actual database quota in Dexie Cloud Manager.
          </p>
          <Link
            className="inline-flex min-h-11 items-center underline"
            to="/business/users"
          >
            Manage business users and registration
          </Link>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const name = new FormData(form).get('name')
              run(
                () =>
                  createBranch(db, work.profile.id, name, branchKey.current),
                'Branch synchronized.',
                () => {
                  form.reset()
                  branchKey.current = crypto.randomUUID()
                },
              )
            }}
          >
            <Input
              label="New branch name"
              name="name"
              maxLength={80}
              required
            />
            <Button disabled={busy} type="submit">
              Create branch
            </Button>
          </form>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const value = Object.fromEntries(new FormData(form))
              run(
                () =>
                  assignStaff(db, work.profile.id, value.branch, value.email),
                'Branch invitation synchronized. Staff must accept it.',
                () => form.reset(),
              )
            }}
          >
            <label>
              Assign branch
              <select name="branch" className={selectClass} required>
                <option value="">Choose branch</option>
                {work.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Existing registered Staff email"
              name="email"
              type="email"
              required
            />
            <Button disabled={busy} type="submit">
              Assign Staff
            </Button>
          </form>
          <details className="space-y-3">
            <summary className="cursor-pointer py-3">
              Legacy default-branch migration · optional development import
            </summary>
            <p>
              Export the original Business backup first. Stop legacy selling and
              all branch devices during migration. This additive import requires
              an empty selected branch and a backup no larger than 1 MiB; it
              never clears the original device data.
            </p>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                const value = new FormData(event.currentTarget)
                const file = value.get('backup')
                run(async () => {
                  const backup = JSON.parse(await file.text())
                  const branchId = value.get('branch')
                  const plan = prepareLegacyImport(backup, branchId)
                  setMigration({ backup, branchId, counts: plan.counts })
                  setConfirmed(false)
                }, 'Dry run validated. Review counts, branch and backup before importing.')
              }}
            >
              <label>
                Default branch
                <select name="branch" className={selectClass} required>
                  <option value="">Choose empty branch</option>
                  {work.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Original Business backup (JSON)"
                name="backup"
                type="file"
                accept="application/json,.json"
                required
              />
              <Button type="submit" disabled={busy}>
                Validate migration dry run
              </Button>
            </form>
            {migration && (
              <section className="space-y-3">
                <p>
                  Target: {branchNames.get(migration.branchId)} · Products:{' '}
                  {migration.counts.products} · Sales: {migration.counts.sales}{' '}
                  · Movements: {migration.counts.movements}
                </p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  I saved the backup, stopped legacy/branch selling and verified
                  the selected branch.
                </label>
                <Button
                  disabled={busy || !confirmed}
                  onClick={() =>
                    run(
                      () =>
                        importLegacy(
                          db,
                          work.profile.id,
                          migration.backup,
                          migration.branchId,
                          confirmed,
                        ),
                      'Legacy import recorded locally; verify synchronization and counts before selling.',
                      () => {
                        setMigration(null)
                        setConfirmed(false)
                      },
                    )
                  }
                >
                  Import validated legacy ledger
                </Button>
              </section>
            )}
          </details>
          <ul>
            {work.members
              .filter((m) => branchNames.has(m.realmId))
              .map((m) => (
                <li key={m.id}>
                  {m.email ?? m.userId} · {branchNames.get(m.realmId)} ·{' '}
                  {m.roles?.join()} ·{' '}
                  {m.accepted && !m.rejected
                    ? 'Accepted membership'
                    : 'Invitation pending'}
                </li>
              ))}
          </ul>
        </>
      )}
    </BusinessShell>
  )
}
