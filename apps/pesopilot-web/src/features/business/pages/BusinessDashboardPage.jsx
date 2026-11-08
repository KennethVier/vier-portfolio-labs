import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { BusinessIcon } from '../components/BusinessIcon.jsx'
import { RecordSaleModal } from '../components/RecordSaleModal.jsx'
import { SampleCatalogAction } from '../components/SampleCatalogAction.jsx'
import { WorkspaceStatus } from '../components/WorkspaceStatus.jsx'
import { peso } from '../components/businessPresentation.js'
import { useBusinessWorkspace } from '../hooks/useBusinessWorkspace.js'
import { useWorkspaceRoute } from '../hooks/useWorkspaceRoute.js'
import { posCatalogService } from '../services/posCatalogService.js'
import { CATALOG_CATEGORIES } from '../constants/catalogMetadata.js'

const categoryTones = ['bg-primary-fixed text-primary', 'bg-secondary-fixed text-on-secondary-fixed', 'bg-tertiary-fixed text-on-tertiary-fixed', 'bg-surface-container-high text-primary']

export function BusinessDashboardPage() {
  useWorkspaceRoute('business')
  const workspace = useBusinessWorkspace()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Products')
  const [sampleChoice, setSampleChoice] = useState(null)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const { products, isLoading, error } = workspace
  const hasActual = products.some((product) => !product.catalog?.sampleKey)
  const hasSample = products.some((product) => product.catalog?.sampleKey)
  const sample = sampleChoice ?? (!hasActual && hasSample)
  const visibleProducts = products.filter((product) => Boolean(product.catalog?.sampleKey) === sample)
  const availableCategories = [...new Set(visibleProducts.map((product) => product.catalog?.category ?? 'Other Products'))]
  const categories = ['All Products', ...CATALOG_CATEGORIES.filter((item) => availableCategories.includes(item)), ...availableCategories.filter((item) => !CATALOG_CATEGORIES.includes(item))]
  const families = posCatalogService.families(products, { search, category, sample })
  const disabled = isLoading || Boolean(error)

  return <BusinessShell>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Point of sale</p><h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Record Sales</h1><p className="mt-2 text-base text-content-muted">Select a product to record a sale.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        {hasSample ? <div aria-label="Catalog source" className="flex rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
          {[false, true].map((value) => <Button key={String(value)} variant={sample === value ? 'primary' : 'ghost'} aria-pressed={sample === value} onClick={() => { setSampleChoice(value); setCategory('All Products'); setSearch('') }}>{value ? 'Sample Catalog' : 'Actual Inventory'}</Button>)}
        </div> : null}
        <SampleCatalogAction loadSampleCatalog={workspace.loadSampleCatalog} disabled={disabled} onLoaded={() => { setSampleChoice(true); setCategory('All Products'); setSearch('') }} />
      </div>
    </div>
    {sample ? <div className="rounded-lg border border-tertiary bg-tertiary-fixed p-4 text-sm text-on-tertiary-fixed"><strong>Sample catalog · fictional stock.</strong> Test recordings appear as Sample in audit and history. These quantities are separate from actual inventory.</div> : null}
    {notice ? <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary bg-surface-container-lowest p-4 text-secondary"><p>{notice}</p><Button variant="ghost" onClick={() => setNotice('')}>Dismiss</Button></div> : null}
    <WorkspaceStatus workspace={workspace} />
    <section aria-label="Product catalog" className="space-y-5">
      <div className="relative max-w-xl"><Input label="Search products" type="search" placeholder="Search a product, scent, or size…" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-12 pl-11" /><span className="pointer-events-none absolute bottom-3.5 left-3 text-content-muted"><BusinessIcon name="search" /></span></div>
      <div aria-label="Product categories" className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => <Button key={item} className="shrink-0 rounded-lg px-4" variant={category === item ? 'primary' : 'secondary'} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</Button>)}
      </div>
      {!disabled ? <>
        <div className="flex items-center justify-between text-sm text-content-muted"><h2 className="font-heading text-lg font-semibold text-content">{category}</h2><span>{families.length} product{families.length === 1 ? '' : 's'}</span></div>
        {families.length ? <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {families.map((family) => {
            const prices = family.products.map((product) => product.unitPriceCentavos)
            const min = Math.min(...prices)
            const max = Math.max(...prices)
            const scents = new Set(family.products.map((product) => product.catalog?.scent).filter(Boolean)).size
            const inStock = family.products.some((product) => product.stockQuantity > 0)
            const tone = categoryTones[Math.max(0, CATALOG_CATEGORIES.indexOf(family.category)) % categoryTones.length]
            return <button key={family.id} data-product-card aria-label={`Record sale: ${family.name}`} disabled={!inStock} onClick={() => { setSelected(family); setNotice('') }} className="group flex min-h-64 flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-left transition-colors hover:border-primary hover:bg-surface-container-low focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">
              <div className="mb-5 flex w-full items-start justify-between gap-2"><span className={`flex h-14 w-14 items-center justify-center rounded-xl ${tone}`}><BusinessIcon name={family.category === 'Shawls' ? 'shawl' : family.category === 'Magic Pillows' ? 'pillow' : 'bottle'} className="h-8 w-8" /></span><span className={`rounded-md px-2 py-1 text-xs font-semibold ${inStock ? 'bg-surface-container-low text-secondary' : 'bg-error-container text-error'}`}>{inStock ? family.products.length === 1 ? `${family.products[0].stockQuantity} available` : 'In stock' : 'Out of stock'}</span></div>
              <span className="text-xs text-content-muted">{family.category}</span>
              <span className="mt-1 font-heading text-xl font-semibold">{family.name}</span>
              <span className="mt-2 font-mono text-lg font-semibold text-primary">{peso(min)}{max !== min ? ` – ${peso(max)}` : ''}</span>
              <span className="mt-2 text-sm text-content-muted">{scents ? `${scents} scents available` : family.products.length > 1 ? `${family.products.length} sizes available` : 'Single product'}</span>
              <span className="mt-auto flex w-full items-center justify-between border-t border-outline-variant pt-4 text-sm font-semibold text-primary"><span className="pt-3">Tap to record sale</span><span aria-hidden="true" className="pt-3">↗</span></span>
            </button>
          })}
        </div> : <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center"><BusinessIcon className="mx-auto mb-4 h-10 w-10 text-primary" name="inventory" /><h3 className="font-heading text-xl font-semibold">{visibleProducts.length ? 'No matching products' : 'No products yet'}</h3><p className="mx-auto mt-2 max-w-md text-content-muted">{visibleProducts.length ? 'Try a different search or category.' : 'Add your products in Inventory, or explicitly load the sample catalog to try a recording.'}</p>{visibleProducts.length ? <Button className="mt-5" variant="secondary" onClick={() => { setSearch(''); setCategory('All Products') }}>Clear filters</Button> : <Link to="/business/inventory" className="mt-5 inline-flex min-h-11 items-center rounded bg-primary px-5 font-semibold text-white">Open Inventory</Link>}</div>}
      </> : null}
    </section>
    {selected ? <RecordSaleModal family={selected} products={products} completeSale={workspace.completeSale} disabled={disabled} onClose={() => setSelected(null)} onRecorded={(message) => { setSelected(null); setNotice(message) }} /> : null}
  </BusinessShell>
}
