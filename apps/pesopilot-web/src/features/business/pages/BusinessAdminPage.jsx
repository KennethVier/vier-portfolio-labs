import { ProductPhotoManager } from '../components/ProductPhotoManager.jsx'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { WorkspaceStatus } from '../components/WorkspaceStatus.jsx'
import { ProductForm } from '../components/ProductForm.jsx'
import { InventoryPanel } from '../components/InventoryPanel.jsx'
import { SalesHistory } from '../components/SalesHistory.jsx'
import { BusinessBackupPanel } from '../components/BusinessBackupPanel.jsx'
import { SampleCatalogAction } from '../components/SampleCatalogAction.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { dateTime } from '../components/businessPresentation.js'
import { useBusinessWorkspace } from '../hooks/useBusinessWorkspace.js'
import { useWorkspaceRoute } from '../hooks/useWorkspaceRoute.js'

const headings = {
  inventory: ['Inventory', 'Manage products, receive stock, and record adjustments.'],
  history: ['Sales History', 'Review completed sales using their original snapshots.'],
  settings: ['Settings / Backup', 'Keep your Business records safe on this device.'],
}

export function BusinessAdminPage({ screen }) {
  useWorkspaceRoute('business')
  const workspace = useBusinessWorkspace()
  const disabled = workspace.isLoading || Boolean(workspace.error)
  const actualProducts = workspace.products.filter((product) => !product.catalog?.sampleKey)
  return <BusinessShell>
    <div><h1 className="font-heading text-3xl font-semibold">{headings[screen][0]}</h1><p className="mt-2 text-content-muted">{headings[screen][1]}</p></div>
    <WorkspaceStatus workspace={workspace} />
    {screen === 'inventory' ? <>
      <p className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-sm text-content-muted">Sample products are labeled below; their stock is fictional. Each sample variant has independent stock. Actual products can share stock only when you explicitly select an existing group.</p>
      <ProductForm products={actualProducts} addProduct={workspace.addProduct} disabled={disabled} />
      <ProductPhotoManager products={workspace.products} photos={workspace.photos} uploadPhoto={workspace.uploadPhoto} removePhoto={workspace.removePhoto} disabled={disabled} />
      <InventoryPanel products={workspace.products} adjustStock={workspace.adjustStock} disabled={disabled} />
    </> : null}
    {screen === 'history' && !disabled ? <><p className="text-sm text-content-muted">Sample recordings are labeled “Sample” and are included in history and audit totals. They are demonstration data.</p><SalesHistory sales={workspace.sales} /></> : null}
    {screen === 'settings' ? <>
      <Card className="space-y-3 p-5"><h2 className="font-heading text-xl font-semibold">Device & data</h2><p className="text-sm text-content-muted">Business data stays in this browser profile and can be erased. Local data and this URL alone do not provide secure account access. There is no authentication or device sync.</p><p className="text-sm text-content-muted">Cash, GCash and Coop Pay are manually recorded payment methods. No external payment settlement is verified.</p></Card>
      <BusinessBackupPanel refresh={workspace.refresh} disabled={workspace.isLoading} />
      <SampleCatalogAction loadSampleCatalog={workspace.loadSampleCatalog} disabled={disabled} />
      <Card className="p-5"><h2 className="font-heading text-lg font-semibold">Internal Activity History</h2><p className="mb-3 text-sm text-content-muted">Recent 15 events; not a tamper-proof audit log.</p>
        {!disabled ? workspace.events.length ? <ul className="divide-y divide-outline-variant">{workspace.events.slice(0, 15).map((event) => <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{event.type.replaceAll('_', ' ')}{event.payload.poolNameSnapshot ? ` · ${event.payload.poolNameSnapshot}` : ''}{event.type === 'stock_adjustment' ? ` · ${event.payload.delta} · ${event.payload.reason}` : ''}</span><time dateTime={event.occurredAt}>{dateTime(event.occurredAt)}</time></li>)}</ul> : <p className="text-sm text-content-muted">No recorded activity.</p> : null}
      </Card>
    </> : null}
  </BusinessShell>
}
