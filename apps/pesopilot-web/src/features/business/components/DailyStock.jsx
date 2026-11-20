import { useState } from 'react'
import { Card } from '@/components/ui/Card.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'

export function DailyStock({ products, receiveStock, disabled }) {
  const [amounts, setAmounts] = useState({})
  const action = useBusinessAction()
  const groups = [...new Map(products.map(product => [product.inventoryPoolId, product])).values()]
  const entries = groups.filter(product => amounts[product.id]).map(product => ({
    productId: product.id, quantity: Number(amounts[product.id]),
  }))

  async function save(event) {
    event.preventDefault()
    if (await action.run(() => receiveStock(entries), 'Stock received and recorded.')) setAmounts({})
  }

  if (!groups.length) return null
  return <Card className="p-5">
    <h2 className="font-heading text-xl">Receive daily stock</h2>
    <p className="my-2 text-sm text-content-muted">Yesterday’s balance carries forward. Enter only deliveries received today. Shared stock appears once.</p>
    <form onSubmit={save}><fieldset disabled={disabled || action.saving} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(product => <Input key={product.id} label={product.inventoryPoolName + ' · ' + product.stockQuantity + ' on hand'}
          type="number" inputMode="numeric" min="1" step="1" placeholder="Units received" value={amounts[product.id] ?? ''}
          onChange={event => setAmounts({ ...amounts, [product.id]: event.target.value })} />)}
      </div>
      <Button type="submit" disabled={!entries.length}>Save received stock</Button>
    </fieldset></form>
    {action.error && <p role="alert">{action.error}</p>}
    {action.notice && <p role="status">{action.notice}</p>}
  </Card>
}
