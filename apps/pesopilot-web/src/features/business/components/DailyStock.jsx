import { stockPresets } from '../services/stockPresets.js'
import { findDuplicateProduct } from '../constants/productCatalog.js'
import { useState } from 'react'
import { Card } from '@/components/ui/Card.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'

export function DailyStock({ products, receiveStock, disabled }) {
  const [amounts, setAmounts] = useState({})
  const action = useBusinessAction()
  const groups = [...new Map(products.map(product => [product.inventoryPoolId, product])).values()]
  const [search, setSearch] = useState('')
  for (const preset of stockPresets) {
    if (!findDuplicateProduct(products, preset)) groups.push({
      id: 'preset:' + preset.name, presetName: preset.name, inventoryPoolName: preset.name, stockQuantity: 0,
    })
  }
  const visible = groups.filter(product => product.inventoryPoolName.toLowerCase().includes(search.trim().toLowerCase()))
  const entries = groups.filter(product => amounts[product.id]).map(product => ({
    productId: product.id, presetName: product.presetName, quantity: Number(amounts[product.id]),
  }))

  async function save(event) {
    event.preventDefault()
    if (await action.run(() => receiveStock(entries), 'Stock received and recorded.')) setAmounts({})
  }


  return <Card className="p-5">
    <h2 className="font-heading text-xl">Receive daily stock</h2>
    <p className="my-2 text-sm text-content-muted">Yesterday’s balance carries forward. Enter only deliveries received today. Listed products are ready to receive. Shared stock appears once.</p>
    <Input label="Find stock" type="search" placeholder="Product or scent" value={search} onChange={event => setSearch(event.target.value)} />
    <form onSubmit={save}><fieldset disabled={disabled || action.saving} className="space-y-3">
      <div className="my-3 grid max-h-72 overflow-y-auto gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(product => <Input key={product.id} label={product.inventoryPoolName + ' · ' + product.stockQuantity + ' on hand'}
          type="number" inputMode="numeric" min="1" step="1" placeholder="Units received" value={amounts[product.id] ?? ''}
          onChange={event => setAmounts({ ...amounts, [product.id]: event.target.value })} />)}
      </div>
      <Button type="submit" disabled={!entries.length}>Save received stock</Button>
    </fieldset></form>
    {action.error && <p role="alert">{action.error}</p>}
    {action.notice && <p role="status">{action.notice}</p>}
  </Card>
}
