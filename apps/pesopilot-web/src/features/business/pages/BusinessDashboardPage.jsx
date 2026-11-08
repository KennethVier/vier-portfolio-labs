import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { useBusinessWorkspace } from '../hooks/useBusinessWorkspace.js'
import { setActiveWorkspace } from '../services/workspacePreference.js'

const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
const peso = (centavos) => currency.format((centavos ?? 0) / 100)
const inputClass = 'mt-1 w-full rounded border border-outline-variant bg-surface p-2 text-sm'
const panelClass = 'rounded border border-outline-variant bg-surface-container-lowest p-5'

export function BusinessDashboardPage() {
  const navigate = useNavigate()
  const { products, sales, events, isLoading, error, addProduct, receiveStock, completeSale } =
    useBusinessWorkspace()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [openingStock, setOpeningStock] = useState('0')
  const [restockId, setRestockId] = useState('')
  const [restockQty, setRestockQty] = useState('1')
  const [saleId, setSaleId] = useState('')
  const [saleQty, setSaleQty] = useState('1')
  const [method, setMethod] = useState('cash')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const saleKey = useRef(null)

  const total = sales.reduce((sum, sale) => sum + sale.totalCentavos, 0)
  const cash = sales.filter((sale) => sale.paymentMethod === 'cash')
    .reduce((sum, sale) => sum + sale.totalCentavos, 0)

  async function act(operation, message) {
    setSaving(true)
    setActionError('')
    setNotice('')
    try {
      await operation()
      setNotice(message)
      return true
    } catch (failure) {
      setActionError(failure.message || 'Unable to save')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function createProduct(event) {
    event.preventDefault()
    if (await act(() => addProduct({
      name, pricePesos: price, openingStock: Number(openingStock),
    }), 'Product saved')) {
      setName('')
      setPrice('')
      setOpeningStock('0')
    }
  }

  async function addStock(event) {
    event.preventDefault()
    if (await act(() => receiveStock({
      productId: restockId, quantity: Number(restockQty),
    }), 'Inventory updated')) {
      setRestockQty('1')
    }
  }

  async function saveSale(event) {
    event.preventDefault()
    if (!saleKey.current) saleKey.current = globalThis.crypto.randomUUID()
    if (await act(() => completeSale({
      requestKey: saleKey.current,
      paymentMethod: method,
      items: [{ productId: saleId, quantity: Number(saleQty) }],
    }), 'Sale recorded; inventory and internal history updated')) {
      saleKey.current = null
      setSaleQty('1')
    }
  }

  function toPersonal() {
    setActiveWorkspace('personal')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-surface text-content">
      <header className="border-b border-outline-variant bg-surface-container-lowest p-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">PesoPilot</p>
            <h1 className="font-heading text-2xl font-semibold">Business Workspace</h1>
            <p className="text-sm text-content-muted">Local inventory and manual sales</p>
          </div>
          <Button variant="secondary" onClick={toPersonal}>Switch to Personal</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
        <p className="rounded border border-outline-variant bg-surface-container-low p-3 text-sm text-content-muted">
          v1.1 prototype: data stays in this browser. This URL is not access-protected.
          Coop is a manual payment label, not external settlement.
        </p>
        {isLoading ? <p>Loading local business data…</p> : null}
        {error ? <p role="alert" className="text-error">{error}</p> : null}
        {actionError ? <p role="alert" className="text-error">{actionError}</p> : null}
        {notice ? <p role="status" className="text-secondary">{notice}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Recorded sales', peso(total)],
            ['Cash sales', peso(cash)],
            ['Coop sales', peso(total - cash)],
            ['Products', products.length],
          ].map(([label, value]) => (
            <div key={label} className={panelClass}>
              <p className="text-xs uppercase text-content-muted">{label}</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-primary">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={panelClass}>
            <h2 className="mb-3 font-heading text-lg font-semibold">Add Product</h2>
            <form onSubmit={createProduct} className="space-y-3">
              <label className="block text-sm">Product name
                <input required maxLength={120} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block text-sm">Unit price (₱)
                <input required inputMode="decimal" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label className="block text-sm">Opening quantity
                <input required type="number" min="0" step="1" className={inputClass} value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} />
              </label>
              <Button type="submit" disabled={saving}>Save Product</Button>
            </form>
          </section>
          <section className={panelClass}>
            <h2 className="mb-1 font-heading text-lg font-semibold">Complete Sale</h2>
            <p className="mb-3 text-sm text-content-muted">Only confirm after verifying payment.</p>
            <form onSubmit={saveSale} className="space-y-3">
              <label className="block text-sm">Product
                <select required className={inputClass} value={saleId} onChange={(e) => setSaleId(e.target.value)}>
                  <option value="">Select product</option>
                  {products.filter((p) => p.stockQuantity > 0).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {peso(p.unitPriceCentavos)} · {p.stockQuantity} available
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">Quantity
                <input required type="number" min="1" step="1" className={inputClass} value={saleQty} onChange={(e) => setSaleQty(e.target.value)} />
              </label>
              <label className="block text-sm">Payment
                <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="cash">Cash</option><option value="coop">Coop</option>
                </select>
              </label>
              <Button type="submit" disabled={saving || !saleId}>Confirm Completed Sale</Button>
            </form>
          </section>
        </div>
        <section className={panelClass}>
          <h2 className="mb-3 font-heading text-lg font-semibold">Inventory</h2>
          {products.length === 0 ? <p className="text-sm text-content-muted">No products yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-outline-variant"><th className="p-2">Product</th><th className="p-2">Price</th><th className="p-2">Stock</th></tr></thead>
                <tbody>{products.map((p) => (
                  <tr key={p.id} className="border-b border-outline-variant">
                    <td className="p-2">{p.name}</td><td className="p-2">{peso(p.unitPriceCentavos)}</td><td className="p-2">{p.stockQuantity}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <form onSubmit={addStock} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-44 flex-1 text-sm">Product to restock
              <select required className={inputClass} value={restockId} onChange={(e) => setRestockId(e.target.value)}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="text-sm">Quantity
              <input required type="number" min="1" step="1" className={inputClass} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
            </label>
            <Button type="submit" disabled={saving || !restockId}>Receive Stock</Button>
          </form>
        </section>
        <section className={panelClass}>
          <h2 className="font-heading text-lg font-semibold">Internal Activity History</h2>
          <p className="mb-3 text-sm text-content-muted">Client audit report format is still pending.</p>
          {events.length === 0 ? <p className="text-sm text-content-muted">No recorded activity.</p> : (
            <ul className="divide-y divide-outline-variant">
              {events.slice(0, 15).map((event) => (
                <li key={event.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span>{event.type.replaceAll('_', ' ')}</span>
                  <span className="text-content-muted">{new Date(event.occurredAt).toLocaleString('en-PH')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
