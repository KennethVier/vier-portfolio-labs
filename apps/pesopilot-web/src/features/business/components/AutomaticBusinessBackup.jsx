import { useState } from 'react'
import { snapshots } from '../repositories/businessSnapshots.js'
import { Button } from '@/components/ui/Button.jsx'

export function AutomaticBusinessBackup() {
  const [status, setStatus] = useState('')
  async function downloadLatest() {
    try {
      const snapshot = await snapshots.daily.orderBy('day').last()
      if (!snapshot) { setStatus('No automatic backup yet.'); return }
      const url = URL.createObjectURL(new Blob([snapshot.content], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'pesopilot-business-' + snapshot.day + '.json'
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus('Backup dated ' + snapshot.day + '.')
    } catch {
      setStatus('Unable to read the automatic backup.')
    }
  }
  return <div className="space-y-2 rounded border border-outline-variant p-4">
    <p className="font-semibold">Automatic backups</p>
    <p className="text-sm">Business saves a copy on this device when open after 7 AM Philippine time. Up to seven daily copies are kept.</p>
    <Button variant="secondary" onClick={downloadLatest}>Download latest automatic backup</Button>
    {status && <p role="status">{status}</p>}
  </div>
}
