import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { useBusinessAccess } from '../cloud/access.js'
import { db } from '../cloud/client.ts'
import { exportBranchBackup, downloadBranchBackup } from './branchBackup.js'

export function BranchBackupPanel() {
  const access = useBusinessAccess()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  if (access?.profile.role !== 'admin') return null
  return (
    <section className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="font-heading text-xl">Operational branch backup</h2>
      <p>
        Export authorized branch records currently in this client. Synchronize
        first to include other devices. This export is separate from the legacy
        device backup below; it contains private business records and has no
        automatic restore.
      </p>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setMessage('')
          try {
            downloadBranchBackup(
              await exportBranchBackup(db, access.profile.id),
            )
            setMessage('Operational backup downloaded. Keep it private.')
          } catch {
            setMessage(
              'Could not export the authorized branch records. Check access and storage.',
            )
          } finally {
            setBusy(false)
          }
        }}
      >
        Download operational branch backup
      </Button>
      {message && <p role="status">{message}</p>}
    </section>
  )
}
