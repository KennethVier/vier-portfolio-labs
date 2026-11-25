import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'
import { peso } from './businessPresentation.js'

const amount = (centavos) => centavos === undefined ? '' : (centavos / 100).toFixed(2)

function PricingCard({ product, updatePricing, disabled }) {
  const [draft, setDraft] = useState(null)
  const action = useBusinessAction()
  const { unitPriceCentavos, unitCostCentavos, catalog } = product
  const isSet = catalog?.type === 'Set'

  async function save(event) {
    event.preventDefault()
    const { expected, price, cost } = draft
    if (await action.run(
      () => updatePricing(product.id, expected, { price, cost: isSet ? undefined : cost }),
      'Pricing saved on this device.',
    )) setDraft(null)
  }

  return (
    <article className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <h2 className="business-product-name break-words font-semibold">{product.name}</h2>
      <p className="text-sm text-content-muted">
        {[catalog?.category ?? 'Other product', catalog?.scent, catalog?.size, catalog?.type].filter(Boolean).join(' · ')}
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt>Selling price per piece</dt><dd className="business-amount font-semibold">{peso(unitPriceCentavos)}</dd></div>
        <div><dt>Purchase cost per piece</dt><dd className="font-semibold">
          {isSet ? 'From selected pieces' : unitCostCentavos === undefined ? 'Unknown' : peso(unitCostCentavos)}
        </dd></div>
      </dl>
      {draft ? (
        <form onSubmit={save}>
          <fieldset disabled={action.saving || disabled} className="space-y-3">
            <Input label="Selling price per piece (PHP)" required className="min-h-11" inputMode="decimal"
              value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
            {!isSet && <Input label="Purchase cost per piece (PHP)" className="min-h-11" inputMode="decimal"
              placeholder="Leave blank if unknown" value={draft.cost}
              onChange={(event) => setDraft({ ...draft, cost: event.target.value })} />}
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{action.saving ? 'Saving…' : 'Save'}</Button>
              <Button type="button" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            </div>
            {action.error && <p role="alert" className="text-sm text-error">{action.error}</p>}
          </fieldset>
        </form>
      ) : (
        <Button type="button" variant="secondary" disabled={disabled} onClick={() => setDraft({
          price: amount(unitPriceCentavos),
          cost: amount(unitCostCentavos),
          expected: { unitPriceCentavos, unitCostCentavos },
        })}>Edit pricing</Button>
      )}
      {!draft && action.notice && <p role="status" className="text-sm">{action.notice}</p>}
    </article>
  )
}

export function ProductPricing({ products, updatePricing, disabled }) {
  const [search, setSearch] = useState('')
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const matches = products.filter(({ name, catalog }) => {
    const fields = [name, catalog?.category ?? 'Other product', catalog?.scent, catalog?.size, catalog?.type]
      .filter(Boolean).join(' ').toLowerCase()
    return terms.every((term) => fields.includes(term))
  })
  return (
    <section aria-label="Product pricing" className="space-y-4">
      <p className="text-sm text-content-muted">Changes apply to future sales. Set prices are per piece for a five-piece selection.</p>
      <Input label="Find products" type="search" value={search}
        onChange={(event) => setSearch(event.target.value)} />
      {matches.length ? <div className="grid gap-4 md:grid-cols-2">
        {matches.map((product) => <PricingCard key={product.id} product={product} updatePricing={updatePricing} disabled={disabled} />)}
      </div> : <p>{products.length ? 'No products match your search.' : 'Add a product in Inventory to manage its pricing.'}</p>}
    </section>
  )
}
