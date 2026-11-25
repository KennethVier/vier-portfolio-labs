import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { peso } from '../components/businessPresentation.js'
import { parsePriceCentavos, parseCostCentavos } from '../services/businessService.js'

const amount = (value) => value == null ? '' : (value / 100).toFixed(2)

export function CatalogProductEditor({ product, work, busy, online, run }) {
  const [draft, setDraft] = useState(null)
  const { unitPriceCentavos, unitCostCentavos, catalog } = product
  const isSet = catalog?.type === 'Set'
  const changed = draft && (
    unitPriceCentavos !== draft.expected.unitPriceCentavos ||
    unitCostCentavos !== draft.expected.unitCostCentavos
  )

  return (
    <article className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <h2 className="break-words font-semibold">{product.name}</h2>
      <p className="text-sm text-content-muted">
        {[catalog?.category ?? 'Other product', catalog?.scent ?? catalog?.size, catalog?.type].filter(Boolean).join(' · ')}
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt>Selling price per piece</dt><dd className="font-semibold">{peso(unitPriceCentavos)}</dd></div>
        <div><dt>Purchase cost per piece</dt><dd className="font-semibold">
          {isSet ? 'From selected pieces' : unitCostCentavos == null ? 'Unknown' : peso(unitCostCentavos)}
        </dd></div>
      </dl>
      {draft ? (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault()
          if (busy || !online || changed) return
          run(async () => {
            const pricing = {
              unitPriceCentavos: parsePriceCentavos(draft.price),
              unitCostCentavos: isSet ? draft.expected.unitCostCentavos : parseCostCentavos(draft.cost),
            }
            await work.refresh()
            await work.repo.updatePricing(product.id, draft.expected, pricing)
          }, 'Pricing saved on this device. Check connection details for sync.', () => setDraft(null))
        }}>
          <Input label="Selling price per piece (PHP)" inputMode="decimal" className="min-h-11" required
            value={draft.price} disabled={busy}
            onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
          {!isSet && <Input label="Purchase cost per piece (PHP)" inputMode="decimal" className="min-h-11"
            value={draft.cost} disabled={busy}
            placeholder="Unknown"
            onChange={(event) => setDraft({ ...draft, cost: event.target.value })} />}
          {changed && <p role="alert">Pricing changed. Cancel and reopen to edit the latest amounts.</p>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !online || changed} type="submit">Save</Button>
            <Button disabled={busy} type="button" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button disabled={busy} type="button" variant="secondary" onClick={() => setDraft({
          price: amount(unitPriceCentavos),
          cost: amount(unitCostCentavos),
          expected: { unitPriceCentavos, unitCostCentavos },
        })}>Edit pricing</Button>
      )}
    </article>
  )
}
