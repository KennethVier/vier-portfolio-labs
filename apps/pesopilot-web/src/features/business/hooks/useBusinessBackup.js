import { useRef, useState } from 'react'
import { businessBackupService } from '../services/businessBackupService.js'
import { BUSINESS_BACKUP_MAX_BYTES } from '../services/businessBackupValidation.js'

export function useBusinessBackup(refresh) {
  const [plan, setPlan] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const locked = useRef(false)

  async function run(operation) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try { await operation() } catch (failure) {
      // Do not render parser/schema details or imported financial payloads.
      setError(failure.message?.startsWith('Business data changed') ? failure.message :
        'Business backup operation failed. Check the file and local storage, then retry. No partial replacement was saved.')
    } finally { locked.current = false; setBusy(false) }
  }

  function exportBackup() {
    return run(async () => {
      const text = await businessBackupService.exportText()
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `pesopilot-business-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      try { anchor.click() } finally {
        anchor.remove()
        // Let the browser begin its download before releasing the object URL.
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      setNotice('Business backup download started. Keep the file in a private, safe location.')
    })
  }

  function selectFile(file) {
    return run(async () => {
      setPlan(null)
      setConfirmed(false)
      if (!file) return
      if (file.size > BUSINESS_BACKUP_MAX_BYTES || !file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Invalid file')
      }
      setPlan(await businessBackupService.prepareRestore(await file.text()))
      setNotice('Backup validated. Review the record counts before confirming replacement.')
    })
  }

  function restoreBackup() {
    if (!plan || !confirmed) return
    return run(async () => {
      await businessBackupService.restore(plan, confirmed)
      setPlan(null)
      setConfirmed(false)
      setNotice('Business records replaced successfully. Personal Finance records were not included.')
      // A refresh failure must not report an already committed restore as failed.
      try { await refresh() } catch { setError('Restore succeeded, but the display could not refresh. Reload the page.') }
    })
  }

  return { plan, confirmed, setConfirmed, busy, error, notice, exportBackup, selectFile, restoreBackup,
    cancel: () => { if (!locked.current) { setPlan(null); setConfirmed(false); setNotice('') } } }
}
