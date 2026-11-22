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
      <h2 className="font-heading text-xl">Business backup</h2>
      <p>
        Save a private copy of the products, branches and transactions available
        on this device. Connect and receive updates first to include other
        devices’ latest work. Keep this file safe; restoring requires owner
        review.
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
        Download backup
      </Button>
      {message && <p role="status">{message}</p>}
    </section>
  )
}
