import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { businessRepository } from '../repositories/businessRepository.js'
import { peso } from '../components/businessPresentation.js'
import { useBusinessAccess } from './access.js'
import { db, realmId } from './client.ts'

export function SharedStockPage() {
  const admin = useBusinessAccess().profile.role === 'admin'
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [sync, setSync] = useState('initial')
  const [message, setMessage] = useState('')
  useEffect(() => {
    const sub = liveQuery(() => db.catalogStock.where('realmId').equals(realmId).toArray()).subscribe({
      next: setRows,
      error: () => setMessage('Could not read shared stock.'),
    })
    const status = db.cloud.syncState.subscribe((state) => setSync(state.phase))
    const local =
      admin &&
      liveQuery(() => businessRepository.listProducts()).subscribe({
        next: setProducts,
        error: () => setMessage('Could not read local stock.'),
      })
    return () => {
      sub.unsubscribe()
      status.unsubscribe()
      if (local) local.unsubscribe()
    }
  }, [admin])
  async function publish(event) {
    event.preventDefault()
    const id = new FormData(event.currentTarget).get('product')
    const product = products.find((p) => p.id === id)
    if (!admin || !product) return
    try {
      await db.catalogStock.put({
        id: product.id,
        realmId,
        name: product.name,
        quantity: product.stockQuantity,
        priceCentavos: product.unitPriceCentavos,
      })
      setMessage('Stock snapshot saved on this device. Dexie Cloud handles synchronization.')
    } catch {
      setMessage('Could not save the snapshot.')
    }
  }
  const estimatedBytes = new TextEncoder().encode(JSON.stringify(rows)).length
  return (
    <BusinessShell>
      <h1 className="font-heading text-3xl">Shared stock snapshots</h1>
      <p>Dexie Cloud sync status · {sync}</p>
      {admin && (
        <>
          <form onSubmit={publish} className="flex flex-wrap items-end gap-3">
            <label>
              Local development product
              <select required name="product" className="block rounded border p-2">
                <option value="">Select a product</option>
                {products
                  .filter((p) => !p.catalog?.sampleKey)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <Button type="submit">Share stock snapshot</Button>
          </form>
          <p>
            Shared catalog payload estimate · {(estimatedBytes / 1024).toFixed(1)} KiB. Check total usage
            in Dexie Cloud Manager.
          </p>
          {estimatedBytes >= 20000000 && (
            <p role="alert">Catalog payload exceeds 80% of the free object-storage allowance.</p>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
      {rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              {row.name} · {row.quantity} units · {peso(row.priceCentavos)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No shared snapshots yet.</p>
      )}
    </BusinessShell>
  )
}
