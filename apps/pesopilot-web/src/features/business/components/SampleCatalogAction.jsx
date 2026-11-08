import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { BusinessDialog } from './BusinessDialog.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'

export function SampleCatalogAction({ loadSampleCatalog, disabled, onLoaded }) {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const action = useBusinessAction()
  if (!import.meta.env.DEV) return null

  async function load() {
    if (await action.run(async () => {
      await loadSampleCatalog(confirmed)
      setOpen(false)
      setConfirmed(false)
      onLoaded?.()
    }, 'Sample catalog ready. Existing records and fictional remaining stock were preserved.')) setOpen(false)
  }

  return <div className="sample-catalog-action">
    <Button variant="secondary" disabled={disabled || action.saving} onClick={() => { setConfirmed(false); setOpen(true) }}>Load Sample Catalog</Button>
    {action.notice ? <p role="status" className="mt-2 max-w-sm text-xs text-secondary">{action.notice}</p> : null}
    {open ? <BusinessDialog title="Load sample catalog?" canClose={!action.saving} onClose={() => setOpen(false)}>
      <div className="space-y-5">
        <p>This inserts 52 sample variants across all seven categories, each with <strong>20 fictional stock units</strong>. Every scent and Solo/Set option has independent stock. Set provisionally consumes one unit.</p>
        <p className="text-sm text-content-muted">Existing products and transactions stay intact. Repeating this action skips existing samples and never replenishes their stock. Test sales appear as Sample in Daily Audit and Sales History.</p>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-tertiary-fixed p-4 text-sm text-on-tertiary-fixed"><input type="checkbox" checked={confirmed} disabled={action.saving} onChange={(event) => setConfirmed(event.target.checked)} />I understand this stock is fictional and is for testing only.</label>
        <Button className="w-full" disabled={!confirmed || action.saving} onClick={load}>{action.saving ? 'Loading samples…' : 'Confirm Load Sample Catalog'}</Button>
        {action.error ? <p role="alert" className="text-error">{action.error}</p> : null}
      </div>
    </BusinessDialog> : null}
  </div>
}
