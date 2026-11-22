import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { selectClass } from '../components/businessPresentation.js'
import { db } from '../cloud/client.ts'
import { useBranchWorkspace } from './useBranchWorkspace.js'
import { prepareLegacyImport, importLegacy } from './legacyMigration.js'
import { ownerMaintenanceAllowed } from './ownerMaintenance.js'

export function OwnerMaintenancePage() {
  const work = useBranchWorkspace()
  const [migration, setMigration] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const branchNames = new Map(work.branches.map((b) => [b.id, b.name]))
  if (!ownerMaintenanceAllowed(work.profile))
    return <p>Maintenance is unavailable.</p>
  async function run(action, success, after) {
    setBusy(true)
    setMessage('')
    try {
      await action()
      after?.()
      setMessage(success)
    } catch {
      setMessage(
        'Maintenance could not complete. No automatic repair was attempted. Review the backup and branch before retrying.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <BusinessShell>
      <h1 className="font-heading text-3xl">Owner development maintenance</h1>
      <p>
        Development only. Preview is read-only. Confirmation writes a one-time
        ledger import. Back up both databases first. Stop all selling devices.
        Production cutover requires separate approval. An imported ledger cannot
        be undone from this page; do not delete records as rollback.
      </p>
      {work.error || work.isLoading ? (
        <p role="alert">Load and verify branch records before maintenance.</p>
      ) : (
        <>
          <details className="space-y-3">
            <summary className="cursor-pointer py-3">
              Move data from the old PesoPilot (one-time setup)
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
                setMigration(null)
                setConfirmed(false)
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
                Preview only (no changes)
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
                  Confirm migration (writes records)
                </Button>
              </section>
            )}
          </details>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </BusinessShell>
  )
}
