import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'
import { peso, selectClass } from './businessPresentation.js'

export function InventoryPanel({ products, adjustStock, disabled }) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [direction, setDirection] = useState('add')
  const [reason, setReason] = useState('')
  const action = useBusinessAction()
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
      <h2 className="mb-3 font-heading text-lg font-semibold">Inventory</h2>
      {products.length === 0 ? <p className="text-sm text-content-muted">No products yet. Add a product with its price and opening quantity.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Products, unit prices and available stock</caption>
            <thead><tr className="border-b border-outline-variant">
              {['Product', 'Unit price', 'Available quantity', 'Status'].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}
            </tr></thead>
            <tbody>{products.map((item) => (
              <tr key={item.id} className="border-b border-outline-variant">
                <th scope="row" className="p-2 font-medium">{item.name}</th>
                <td className="p-2 font-mono">{peso(item.unitPriceCentavos)}</td>
                <td className="p-2 font-mono">{item.stockQuantity}</td>
                <td className={`p-2 ${item.stockQuantity === 0 ? 'text-error' : 'text-secondary'}`}>
                  {item.stockQuantity === 0 ? 'Out of stock' : 'In stock'}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <h3 className="mb-2 mt-5 font-semibold">Manual stock adjustment</h3>
      <p className="mb-3 text-sm text-content-muted">Add received stock or remove damaged/miscounted units. Every adjustment requires a reason.</p>
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
    </Card>
  )
}
