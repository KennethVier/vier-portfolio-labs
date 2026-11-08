import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { InventoryPanel } from '../components/InventoryPanel.jsx'
import { ProductForm } from '../components/ProductForm.jsx'
import { SaleForm } from '../components/SaleForm.jsx'
import { SalesHistory } from '../components/SalesHistory.jsx'
import { dateTime, peso } from '../components/businessPresentation.js'
import { useBusinessWorkspace } from '../hooks/useBusinessWorkspace.js'
import { useWorkspaceRoute } from '../hooks/useWorkspaceRoute.js'

export function BusinessDashboardPage() {
  const navigate = useNavigate()
  useWorkspaceRoute('business')
  const workspace = useBusinessWorkspace()
  const { products, sales, events, summary, isLoading, error } = workspace
  const disabled = isLoading || Boolean(error)

  return (
    <div className="min-h-screen bg-surface text-content">
      <header className="border-b border-outline-variant bg-surface-container-lowest p-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">PesoPilot</p>
            <h1 className="font-heading text-2xl font-semibold">Business Workspace</h1>
            <p className="text-sm text-content-muted">Local inventory and manual sales</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Switch to Personal</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
        <p className="rounded border border-outline-variant bg-surface-container-low p-3 text-sm text-content-muted">
          v1.1 prototype: data stays in this browser profile and can be erased. Local data and this URL alone do not provide secure account access.
          There is no authentication or device sync. Coop is a manually recorded payment method, not proof of external payment settlement.
        </p>
        {isLoading ? <p role="status">Loading local business data…</p> : null}
        {error ? <div role="alert" className="space-y-2 text-error">
          <p>Unable to refresh business data: {error}. Displayed records may be stale.</p>
          <Button variant="secondary" onClick={workspace.refresh}>Retry Loading</Button>
        </div> : null}
        {!error && !isLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Recorded sales', peso(summary.totalCentavos)],
            ['Cash sales', peso(summary.cashCentavos)],
            ['Coop sales (manual)', peso(summary.coopCentavos)],
            ['Products', products.length],
          ].map(([label, value]) => <Card key={label} className="p-5">
            <p className="text-xs uppercase text-content-muted">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-primary">{value}</p>
          </Card>)}
        </div> : null}
        <div className="grid gap-5 lg:grid-cols-2">
          <ProductForm addProduct={workspace.addProduct} disabled={disabled} />
          <SaleForm products={products} completeSale={workspace.completeSale} disabled={disabled} />
        </div>
        <InventoryPanel products={products} adjustStock={workspace.adjustStock} disabled={disabled} />
        {!error && !isLoading ? <SalesHistory sales={sales} /> : null}
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold">Internal Activity History</h2>
          <p className="mb-3 text-sm text-content-muted">Recent 15 events. Full records stay in local storage. Client audit report: BLOCKED — waiting for sample. This is not a tamper-proof audit log.</p>
          {!error && !isLoading ? events.length === 0 ? <p className="text-sm text-content-muted">No recorded activity.</p> : (
            <ul className="divide-y divide-outline-variant">{events.slice(0, 15).map((event) => (
              <li key={event.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span>{event.type.replaceAll('_', ' ')}
                  {event.type === 'stock_adjustment' ? ` · ${event.payload.delta > 0 ? '+' : ''}${event.payload.delta} · ${event.payload.beforeQuantity} → ${event.payload.afterQuantity} · ${event.payload.reason}` : ''}
                </span>
                <time dateTime={event.occurredAt} className="text-content-muted">{dateTime(event.occurredAt)}</time>
              </li>
            ))}</ul>
          ) : null}
        </Card>
      </main>
    </div>
  )
}
