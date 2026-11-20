import { CATALOG_CATEGORIES } from '../constants/catalogMetadata.js'
import { stockPresets } from '../services/stockPresets.js'
import { findDuplicateProduct } from '../constants/productCatalog.js'
import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'

export function DailyStock({ products, receiveStock, disabled }) {
  const [amounts, setAmounts] = useState({})
  const action = useBusinessAction()
  const groups = [...new Map(products.filter(product => product.catalog?.type !== 'Set').map(product => [product.inventoryPoolId, product])).values()]
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState('')
  for (const preset of stockPresets) {
    if (preset.catalog.type !== 'Set' && !findDuplicateProduct(products, preset)) groups.push({
      catalog: preset.catalog, id: 'preset:' + preset.name, presetName: preset.name, name: preset.name, inventoryPoolName: preset.name, stockQuantity: 0,
    })
  }
  const families = new Map(CATALOG_CATEGORIES.map(name => [name, []]))
  for (const product of groups) {
    const name = product.catalog?.category ?? 'Custom products'
    if (!families.has(name)) families.set(name, [])
    families.get(name).push(product)
  }
  const query = search.trim().toLowerCase()
  const matchingFamilies = [...families].map(([name, rows]) => [name, rows.filter(product =>
    name.toLowerCase().includes(query) || product.inventoryPoolName.toLowerCase().includes(query))])
    .filter(([, rows]) => rows.length > 0)
  const currentFamily = matchingFamilies.find(([name]) => name === family) ?? matchingFamilies[0]
  const entries = groups.filter(product => amounts[product.id]).map(product => ({
    productId: product.id, presetName: product.presetName, quantity: Number(amounts[product.id]),
  }))

  async function save(event) {
    event.preventDefault()
    if (await action.run(() => {
      if (entries.some(({ quantity }) => !Number.isSafeInteger(quantity) || quantity < 1)) {
        throw new Error('Enter a positive whole number for each quantity.')
      }
      return receiveStock(entries)
    }, 'Stock received and recorded.')) setAmounts({})
  }


  return <details className="mt-5"><summary className="cursor-pointer font-semibold">Receive stock</summary>
    <p className="my-2 text-sm text-content-muted">Enter units received for each item in the delivery.</p>
    <Input label="Find stock" type="search" placeholder="Product or scent" value={search} onChange={event => setSearch(event.target.value)} />
    <form onSubmit={save}><fieldset disabled={disabled || action.saving} className="space-y-3">
      {currentFamily ? <>
        <label className="mt-3 block text-sm font-semibold">Product group
          <select className="mt-1 block w-full rounded border border-outline-variant p-2 sm:w-auto"
            value={currentFamily[0]} onChange={event => setFamily(event.target.value)}>
            {matchingFamilies.map(([name, rows]) => {
              const pending = rows.filter(product => amounts[product.id]).length
              return <option key={name} value={name}>{name}{pending ? ' · ' + pending + ' entered' : ''}</option>
            })}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currentFamily[1].map(product => {
            const variant = product.catalog?.scent && product.inventoryPoolName === product.name
              ? product.catalog.scent : product.catalog?.size ?? product.inventoryPoolName
            return <Input key={product.id} label={variant + ' · ' + product.stockQuantity + ' on hand'}
              type="number" inputMode="numeric" min="1" step="1" placeholder="Units received" value={amounts[product.id] ?? ''}
              onChange={event => setAmounts({ ...amounts, [product.id]: event.target.value })} />
          })}
        </div>
      </> : <p className="my-3 text-sm">No matching products.</p>}
      <Button type="submit" disabled={!entries.length}>{action.saving ? 'Saving…' : 'Save received stock' + (entries.length ? ' (' + entries.length + ')' : '')}</Button>
    </fieldset></form>
    {action.error && <p role="alert">{action.error}</p>}
    {action.notice && <p role="status">{action.notice}</p>}
  </details>
}
