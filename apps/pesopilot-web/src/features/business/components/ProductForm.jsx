import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'

export function ProductForm({ addProduct, disabled }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [openingStock, setOpeningStock] = useState('0')
  const action = useBusinessAction()

  async function submit(event) {
    event.preventDefault()
    if (await action.run(() => addProduct({ name, pricePesos: price,
      openingStock: openingStock.trim() === '' ? NaN : Number(openingStock) }), 'Product saved.')) {
      setName('')
      setPrice('')
      setOpeningStock('0')
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-heading text-lg font-semibold">Add Product</h2>
      <form onSubmit={submit}>
        <fieldset disabled={disabled || action.saving} className="space-y-3">
          <Input label="Product name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Unit price (PHP)" required inputMode="decimal" placeholder="350.00" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input label="Opening quantity" required type="number" min="0" step="1" value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} />
          <p className="text-sm text-content-muted">Whole units only. Opening stock is recorded in the internal history.</p>
          <Button type="submit">{action.saving ? 'Saving…' : 'Save Product'}</Button>
        </fieldset>
      </form>
      {action.error ? <p role="alert" className="mt-3 text-sm text-error">{action.error}</p> : null}
      {action.notice ? <p role="status" className="mt-3 text-sm text-secondary">{action.notice}</p> : null}
    </Card>
  )
}
