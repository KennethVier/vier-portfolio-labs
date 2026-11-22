import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { peso } from '../components/businessPresentation.js'
import { parsePriceCentavos } from '../services/businessService.js'
export function CatalogProductEditor({ product, work, busy, run }) {
  const [price, setPrice] = useState(
    (product.unitPriceCentavos / 100).toFixed(2),
  )
  const [cost, setCost] = useState(
    product.unitCostCentavos === undefined
      ? ''
      : (product.unitCostCentavos / 100).toFixed(2),
  )
  return (
    <details className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <summary className="cursor-pointer min-h-11 font-semibold">
        {product.name} · {peso(product.unitPriceCentavos)} · Edit price and
        purchase cost
      </summary>
      <p className="my-3 text-sm">
        Changes apply to future sales. Existing receipts keep their original
        prices and costs. Leave purchase cost blank when unknown.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            run(
              () => work.repo.setPrice(product.id, parsePriceCentavos(price)),
              'Catalog price saved. Existing sales unchanged.',
            )
          }}
          className="space-y-3"
        >
          <Input
            label="Selling price per piece (PHP)"
            value={price}
            inputMode="decimal"
            required
            onChange={(event) => setPrice(event.target.value)}
          />
          <Button disabled={busy} type="submit">
            Save price
          </Button>
        </form>
        {product.catalog?.type !== 'Set' && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              run(
                () => work.service.setUnitCost(product.id, cost),
                'Purchase cost saved for future sales.',
              )
            }}
            className="space-y-3"
          >
            <Input
              label="Purchase cost per piece (₱)"
              value={cost}
              inputMode="decimal"
              onChange={(event) => setCost(event.target.value)}
            />
            <Button disabled={busy} type="submit">
              Save unit cost
            </Button>
          </form>
        )}
      </div>
    </details>
  )
}
