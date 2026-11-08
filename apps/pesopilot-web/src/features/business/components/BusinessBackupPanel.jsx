import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { useBusinessBackup } from '../hooks/useBusinessBackup.js'

export function BusinessBackupPanel({ refresh, disabled }) {
  const backup = useBusinessBackup(refresh)
  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-heading text-lg font-semibold">Business Backup &amp; Restore</h2>
      <p className="text-sm text-content-muted">
        Download Business records and product photos before clearing browser storage and after each selling day.
        Personal backups do not include Business records. Files are unencrypted and contain sensitive sales data;
        keep them private. Files stay on this device unless you share them yourself.
      </p>
      <Button variant="secondary" onClick={backup.exportBackup} disabled={disabled || backup.busy}>Download Business Backup</Button>
      <label className="block text-sm font-medium">
        Business backup JSON (maximum 10 MiB)
        <input className="mt-1 block w-full" type="file" accept=".json,application/json" disabled={disabled || backup.busy}
          onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; backup.selectFile(file) }} />
      </label>
      {backup.plan ? <section aria-label="Review Business restore" className="space-y-3 rounded border border-outline-variant p-3">
        <p>This replaces every Business record in this browser profile. Newer sales will be lost. Nothing is merged.
          Download the current backup first, resolve any uncertain sales, and stop sales in other tabs.</p>
        {backup.plan.backup.version < 3 ? <p className="rounded-lg bg-tertiary-fixed p-3 text-sm">This older backup contains no photos. Replacing records also removes all current product photos.</p> : null}
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(backup.plan.backup.stores).map(([name, rows]) => <div key={name}>
            <dt>{name}</dt><dd className="font-mono">{rows.length}</dd>
          </div>)}
        </dl>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={backup.confirmed} disabled={backup.busy}
            onChange={(event) => backup.setConfirmed(event.target.checked)} />
          I am the owner and confirm replacing all Business records with this backup.
        </label>
        <div className="flex flex-wrap gap-3">
          <Button onClick={backup.restoreBackup} disabled={disabled || backup.busy || !backup.confirmed}>Replace Business Records</Button>
          <Button variant="secondary" onClick={backup.cancel} disabled={backup.busy}>Cancel Restore</Button>
        </div>
      </section> : null}
      {backup.busy ? <p role="status">Processing local Business backup…</p> : null}
      {backup.error ? <p role="alert" className="text-sm text-error">{backup.error}</p> : null}
      {backup.notice ? <p role="status" className="text-sm">{backup.notice}</p> : null}
    </Card>
  )
}
