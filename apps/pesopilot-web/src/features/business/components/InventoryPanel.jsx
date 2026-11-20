import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'
import { selectClass } from './businessPresentation.js'

export function InventoryPanel({ products, adjustStock, setUnitCost, disabled, children }) {
  const [costProductId, setCostProductId] = useState('')
  const [cost, setCost] = useState('')
  const costAction = useBusinessAction()
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [direction, setDirection] = useState('add')
  const [reason, setReason] = useState('')
  const action = useBusinessAction()
  const pools = [...new Map(products.map(item => [item.inventoryPoolId, item])).values()]
  const product = products.find((item) => item.id === productId)

  async function submit(event) {
    event.preventDefault()
    if (await action.run(() => adjustStock({ productId, quantity: Number(quantity), direction, reason }),
      'Stock adjusted. Quantity and reason recorded in internal history.')) {
      setReason('')
      setQuantity('1')
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-heading text-lg font-semibold">Stock on hand · {pools.reduce((sum, item) => sum + item.stockQuantity, 0)} units</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...pools].sort((a, b) => a.stockQuantity - b.stockQuantity).map(item => <div key={item.id} className="rounded-lg border border-outline-variant p-3">
          <p className="business-product-name font-semibold">{item.inventoryPoolName}{item.catalog?.type === 'Set' ? ' (legacy stock)' : ''}</p>
          <p className={item.stockQuantity === 0 ? 'text-error' : ''}>{item.stockQuantity === 0 ? 'Out of stock' : item.stockQuantity + ' available'}</p>
        </div>)}
      </div>
      {children}
      <details className="mt-5"><summary className="cursor-pointer font-semibold">Set unit costs</summary>
        <p className="my-2 text-sm">Enter what you paid per piece. This applies to future sales. Leave blank if unknown.</p>
        <form onSubmit={event => {
          event.preventDefault()
          costAction.run(() => setUnitCost(costProductId, cost), 'Unit cost saved.')
        }}>
          <fieldset disabled={disabled || costAction.saving} className="grid items-end gap-3 sm:grid-cols-3">
            <label>Product<select required className={selectClass} value={costProductId} onChange={event => {
              const id = event.target.value
              const cents = products.find(item => item.id === id)?.unitCostCentavos
              setCostProductId(id)
              setCost(cents === undefined ? '' : (cents / 100).toFixed(2))
            }}>
              <option value="">Select product</option>
              {products.filter(item => item.catalog?.type !== 'Set').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select></label>
            <Input label="Purchase cost per piece (₱)" inputMode="decimal" value={cost} onChange={event => setCost(event.target.value)} />
            <Button type="submit" disabled={!costProductId}>Save unit cost</Button>
          </fieldset>
        </form>
        {costAction.error && <p role="alert">{costAction.error}</p>}
        {costAction.notice && <p role="status">{costAction.notice}</p>}
      </details>
      <details className="mt-5"><summary className="cursor-pointer font-semibold">Correct stock</summary>
      <form onSubmit={submit}>
        <fieldset disabled={disabled || action.saving || products.length === 0} className="grid items-end gap-3 sm:grid-cols-2">
          <label className="text-sm">Product to adjust
            <select required className={selectClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product</option>
              {products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.stockQuantity} available</option>)}
            </select>
          </label>
          <label className="text-sm">Adjustment direction
            <select className={selectClass} value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="add">Add stock</option><option value="remove">Remove stock</option>
            </select>
          </label>
          <Input label="Adjustment quantity" required type="number" min="1" step="1" max={direction === 'remove' ? product?.stockQuantity : undefined} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input label="Adjustment reason" required maxLength={240} placeholder="e.g. Received delivery or damaged units" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button type="submit" disabled={!productId}>{action.saving ? 'Saving…' : 'Record Stock Adjustment'}</Button>
        </fieldset>
      </form>
      {action.error ? <p role="alert" className="mt-3 text-sm text-error">{action.error}</p> : null}
      {action.notice ? <p role="status" className="mt-3 text-sm text-secondary">{action.notice}</p> : null}
      </details>
    </Card>
  )
}
