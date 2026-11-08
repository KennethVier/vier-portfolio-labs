import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'
import { selectClass } from './businessPresentation.js'
import { CATALOG_CATEGORIES, SAMPLE_SCENTS } from '../constants/catalogMetadata.js'

export function ProductForm({ addProduct, disabled, products = [] }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [openingStock, setOpeningStock] = useState('0')
  const [poolId, setPoolId] = useState('')
  const [poolName, setPoolName] = useState('')
  const [category, setCategory] = useState('')
  const [family, setFamily] = useState('')
  const [scent, setScent] = useState('')
  const [type, setType] = useState('')
  const [size, setSize] = useState('')
  const pools = [...new Map(products.map((product) => [product.inventoryPoolId, product])).values()]
  const action = useBusinessAction()

  async function submit(event) {
    event.preventDefault()
    if (await action.run(() => addProduct({ name, pricePesos: price,
      openingStock: poolId ? 0 : openingStock.trim() === '' ? NaN : Number(openingStock),
      inventoryPoolId: poolId || undefined, inventoryPoolName: poolName.trim() || undefined,
      ...(category ? { catalog: { category, family: family.trim() || name.trim(),
        ...(scent ? { scent } : {}), ...(type ? { type } : {}), ...(size.trim() ? { size: size.trim() } : {}) } } : {}),
    }), 'Product saved.')) {
      setName('')
      setPrice('')
      setOpeningStock('0')
      setPoolId('')
      setPoolName('')
      setCategory('')
      setFamily('')
      setScent('')
      setType('')
      setSize('')
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-heading text-lg font-semibold">Add Product</h2>
      <form onSubmit={submit}>
        <fieldset disabled={disabled || action.saving} className="space-y-3">
          <Input label="Product name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Unit price (PHP)" required inputMode="decimal" placeholder="350.00" value={price} onChange={(e) => setPrice(e.target.value)} />
          <details className="rounded border border-outline-variant p-3">
            <summary className="flex cursor-pointer items-center text-sm font-semibold text-primary">POS category & variant options (optional)</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Category<select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Other Products / independent card</option>{CATALOG_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
              {category ? <>
                <Input label="Product family" maxLength={120} placeholder="e.g. Hallelujah Rub" value={family} onChange={(e) => setFamily(e.target.value)} />
                <label className="text-sm">Scent<select className={selectClass} value={scent} onChange={(e) => setScent(e.target.value)}><option value="">Not applicable</option>{SAMPLE_SCENTS.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="text-sm">Solo / Set<select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}><option value="">Not applicable</option><option>Solo</option><option>Set</option></select></label>
                <Input label="Size" maxLength={80} value={size} onChange={(e) => setSize(e.target.value)} />
                <p className="text-sm text-content-muted">Use the same family to group variants on the POS. Grouping cards does not combine stock. Include the variant in the product name for audit/history.</p>
              </> : null}
            </div>
          </details>
          <label className="block text-sm">Inventory pool
            <select className={selectClass} value={poolId} onChange={(e) => setPoolId(e.target.value)}>
              <option value="">New independent stock group</option>
              {pools.map((product) => <option key={product.inventoryPoolId} value={product.inventoryPoolId}>Share: {product.inventoryPoolName}</option>)}
            </select>
          </label>
          {!poolId ? <>
            <Input label="Stock group name (optional)" maxLength={120} placeholder="Defaults to product name" value={poolName} onChange={(e) => setPoolName(e.target.value)} />
            <Input label="Opening quantity" required type="number" min="0" step="1" value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} />
          </> : null}
          <p className="text-sm text-content-muted">Each variant sale consumes one inventory unit (provisional). Shared variants use existing stock; receive additional stock through Inventory.</p>
          <Button type="submit">{action.saving ? 'Saving…' : 'Save Product'}</Button>
        </fieldset>
      </form>
      {action.error ? <p role="alert" className="mt-3 text-sm text-error">{action.error}</p> : null}
      {action.notice ? <p role="status" className="mt-3 text-sm text-secondary">{action.notice}</p> : null}
    </Card>
  )
}
