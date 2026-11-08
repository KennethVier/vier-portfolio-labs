import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'
import { selectClass } from './businessPresentation.js'

export function ProductForm({ addProduct, disabled, products = [] }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [openingStock, setOpeningStock] = useState('0')
  const [poolId, setPoolId] = useState('')
  const [poolName, setPoolName] = useState('')
  const pools = [...new Map(products.map((product) => [product.inventoryPoolId, product])).values()]
  const action = useBusinessAction()

  async function submit(event) {
    event.preventDefault()
    if (await action.run(() => addProduct({ name, pricePesos: price,
      openingStock: poolId ? 0 : openingStock.trim() === '' ? NaN : Number(openingStock),
      inventoryPoolId: poolId || undefined, inventoryPoolName: poolName.trim() || undefined }), 'Product saved.')) {
      setName('')
      setPrice('')
      setOpeningStock('0')
      setPoolId('')
      setPoolName('')
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-heading text-lg font-semibold">Add Product</h2>
      <form onSubmit={submit}>
        <fieldset disabled={disabled || action.saving} className="space-y-3">
          <Input label="Product name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Unit price (PHP)" required inputMode="decimal" placeholder="350.00" value={price} onChange={(e) => setPrice(e.target.value)} />
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
