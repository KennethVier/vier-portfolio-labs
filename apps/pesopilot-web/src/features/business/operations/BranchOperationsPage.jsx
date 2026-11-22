import { BusinessSetup } from './BusinessSetup.jsx'
import { BusinessSyncStatus } from './BusinessSyncStatus.jsx'
import { useBusinessOnline } from './useBusinessOnline.js'
import { AdminProducts } from './AdminProducts.jsx'
import { StaffInventory } from './StaffInventory.jsx'
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
import { peso, selectClass } from '../components/businessPresentation.js'
import {
  buildDailyAudit,
  getManilaDate,
} from '../services/dailyAuditService.js'
import { db } from '../cloud/client.ts'
import { useBranchWorkspace } from './useBranchWorkspace.js'
import { assignStaff, createBranch } from './branchAdministration.js'

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
  const online = useBusinessOnline()
  const [assignmentBranch, setAssignmentBranch] = useState('')
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
  const status = (
    <>
      <BusinessSyncStatus
        phase={work.sync.phase}
        online={online}
        busy={busy}
        retry={() => run(work.refresh, 'Latest updates received.')}
        problem={
          work.error
            ? 'Business records could not be loaded. Try again or ask the owner for help.'
            : error
        }
        notice={notice}
      />
      {work.conflicts.length > 0 && (
        <p role="alert">
          Stock needs review:{' '}
          {work.conflicts
            .map((pool) => pool.name + ' (' + pool.stockQuantity + ')')
            .join(', ')}
          . Check the physical count and record an adjustment with a reason.
        </p>
      )}
    </>
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
    home: admin ? 'Business Overview' : 'Your branch',
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
      {screen === 'home' && admin && <BusinessSetup work={work} />}
      {status}
      {invitations.map((invite) => (
        <Button
          key={invite.realmId}
          disabled={busy}
          onClick={() =>
            run(async () => {
              await invite.accept()
              await work.refresh()
            }, 'Branch joined. Your products and stock are ready to load.')
          }
        >
          Join{' '}
          {(work.registry ?? []).find((branch) => branch.id === invite.realmId)
            ?.name || 'your branch'}
        </Button>
      ))}
      {work.isLoading ? <p role="status">Loading branch records…</p> : null}
      {noAssignment && !work.isLoading ? (
        <p>
          Ask the owner to assign you to one branch in Branches and Users. Then
          accept the branch invitation here. Products and stock will appear
          after your access is confirmed.
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
            <option value="">All branches</option>
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
                View sales and stock across your branches. Updates from offline
                devices appear when they reconnect.
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
                  No branches yet. Create a branch, then assign Staff in
                  Branches and Users.
                </p>
              )}
              <p>
                Total recorded sales today:{' '}
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
                Open Daily Audits to check each branch’s recorded stock and
                sales.
              </p>
            </>
          )}
          {screen === 'stock' && (
            <>
              {admin &&
                selected.map((row) => (
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
                      <p role="alert">
                        Negative stock requires reconciliation.
                      </p>
                    )}
                  </section>
                ))}
              {!admin && <StaffInventory work={work} />}
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
        <AdminProducts work={work} busy={busy} run={run} online={online} />
      )}
      {screen === 'branches' && admin && (
        <>
          <p>
            Create the branch location, invite Staff, then assign them to that
            branch. Staff receives physical stock in Branch Inventory before
            selling.
          </p>
          <section
            id="add-branch"
            className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4"
          >
            <h2 className="font-heading text-xl">1. Create a branch</h2>
            <p className="text-sm">
              Add a selling location. Next, choose the Staff who will operate it
              below.
            </p>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                const form = event.currentTarget
                const name = new FormData(form).get('name')
                run(
                  async () => {
                    const id = await createBranch(
                      db,
                      work.profile.id,
                      name,
                      branchKey.current,
                    )
                    setAssignmentBranch(id)
                  },
                  'Branch created. Next: assign Staff to it below.',
                  () => {
                    form.reset()
                    branchKey.current = crypto.randomUUID()
                  },
                )
              }}
            >
              <Input
                label="Branch name"
                name="name"
                placeholder="For example: Main store"
                maxLength={80}
                required
              />
              <Button
                disabled={
                  busy || !online || work.isLoading || Boolean(work.error)
                }
                type="submit"
              >
                Create branch
              </Button>
            </form>
            {!online && <p>Reconnect to create branches or assign Staff.</p>}
          </section>
          <section
            id="assign-staff"
            className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4"
          >
            <h2 className="font-heading text-xl">2. Assign Staff</h2>
            <p className="text-sm">
              First invite Staff in Users. The owner completes private account
              setup, then Staff signs in and accepts the business invitation.
              Assign their branch here next.
            </p>
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-primary underline"
              to="/business/users"
            >
              Open Users
            </Link>
            {!work.branches.length ? (
              <p>Create a branch above before assigning Staff.</p>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = event.currentTarget
                  const value = Object.fromEntries(new FormData(form))
                  run(
                    () =>
                      assignStaff(
                        db,
                        work.profile.id,
                        value.branch,
                        value.email,
                      ),
                    'Branch invitation sent. Ask Staff to accept it, then receive physical stock in Branch Inventory.',
                    () => form.reset(),
                  )
                }}
              >
                <label className="block">
                  Branch
                  <select
                    name="branch"
                    className={selectClass}
                    required
                    value={assignmentBranch}
                    onChange={(event) =>
                      setAssignmentBranch(event.target.value)
                    }
                  >
                    <option value="">Choose branch</option>
                    {work.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Input label="Staff email" name="email" type="email" required />
                <Button
                  disabled={
                    busy || !online || work.isLoading || Boolean(work.error)
                  }
                  type="submit"
                >
                  Assign Staff
                </Button>
              </form>
            )}
            <p className="text-sm">
              Staff accepts a separate branch invitation. Adding products gives
              them product choices; receiving stock makes those units available
              in POS.
            </p>
            <ul>
              {work.members
                .filter((member) => branchNames.has(member.realmId))
                .map((member) => (
                  <li key={member.id}>
                    {member.email ?? member.userId} ·{' '}
                    {branchNames.get(member.realmId)} ·{' '}
                    {member.accepted && !member.rejected
                      ? 'Invitation accepted'
                      : 'Invitation pending'}
                  </li>
                ))}
            </ul>
          </section>
          <details className="space-y-3 rounded-lg border border-outline-variant p-4">
            <summary className="cursor-pointer min-h-11 font-semibold">
              Advanced setup and backups
            </summary>
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
            <details className="space-y-3">
              <summary className="cursor-pointer py-3">
                Legacy default-branch migration · optional development import
              </summary>
              <p>
                Export the original Business backup first. Stop legacy selling
                and all branch devices during migration. This additive import
                requires an empty selected branch and a backup no larger than 1
                MiB; it never clears the original device data.
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
                    {migration.counts.products} · Sales:{' '}
                    {migration.counts.sales} · Movements:{' '}
                    {migration.counts.movements}
                  </p>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(event) => setConfirmed(event.target.checked)}
                    />
                    I saved the backup, stopped legacy/branch selling and
                    verified the selected branch.
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
          </details>
        </>
      )}
    </BusinessShell>
  )
}
