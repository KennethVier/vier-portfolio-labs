import { snapshots } from '../repositories/businessSnapshots.js'
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
      <p className="text-sm">
        When the owner workspace is open after 7 AM Philippine time, up to seven
        daily branch copies are saved on this device. They contain the records
        available here, including photos. Keep a downloaded copy separately.
      </p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            const rows = await snapshots.branchDaily
              .where('userId')
              .equals(access.profile.id)
              .sortBy('day')
            const latest = rows.at(-1)
            if (!latest) {
              setMessage(
                'No automatic branch backup yet. Open Overview after 7 AM, or download a backup now.',
              )
              return
            }
            downloadBranchBackup(latest.content)
            setMessage(
              'Automatic branch backup dated ' +
                latest.day +
                ' downloaded. Keep it private.',
            )
          } catch {
            setMessage(
              'Automatic backup could not be read. Download a current backup instead.',
            )
          } finally {
            setBusy(false)
          }
        }}
      >
        Download latest automatic branch backup
      </Button>
      {message && <p role="status">{message}</p>}
    </section>
  )
}
