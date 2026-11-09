import { ProductVisual } from '../components/ProductVisual.jsx'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { BusinessIcon } from '../components/BusinessIcon.jsx'
import { RecordSaleModal } from '../components/RecordSaleModal.jsx'
import { WorkspaceStatus } from '../components/WorkspaceStatus.jsx'
import { peso } from '../components/businessPresentation.js'
import { useBusinessWorkspace } from '../hooks/useBusinessWorkspace.js'
import { useWorkspaceRoute } from '../hooks/useWorkspaceRoute.js'
import { posCatalogService } from '../services/posCatalogService.js'
import { CATALOG_CATEGORIES } from '../constants/catalogMetadata.js'

export function BusinessDashboardPage() {
  useWorkspaceRoute('business')
  const workspace = useBusinessWorkspace()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Products')
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const { products, isLoading, error } = workspace
  const availableCategories = [...new Set(products.map((product) => product.catalog?.category ?? 'Other Products'))]
  const categories = ['All Products', ...CATALOG_CATEGORIES.filter((item) => availableCategories.includes(item)), ...availableCategories.filter((item) => !CATALOG_CATEGORIES.includes(item))]
  const families = posCatalogService.families(products, { search, category })
  const disabled = isLoading || Boolean(error)

  return <BusinessShell>
    <div className="business-page-heading flex flex-wrap items-center justify-between gap-4">
      <div><p className="business-boutique-heading mb-2 text-xs uppercase text-primary">Point of sale</p><h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Record Sales</h1><p className="mt-2 text-base text-content-muted">Select a product to record a sale.</p></div>
    </div>
    {notice ? <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-secondary bg-surface-container-lowest p-4 text-secondary"><p>{notice}</p><Button variant="ghost" onClick={() => setNotice('')}>Dismiss</Button></div> : null}
    <WorkspaceStatus workspace={workspace} />
    <section aria-label="Product catalog" className="pos-catalog space-y-5">
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
            const stockedVariants = family.products.filter((product) => product.stockQuantity > 0).length
            return <button key={family.id} data-product-card aria-label={`Record sale: ${family.name}`} disabled={!inStock} onClick={() => { setSelected(family); setNotice('') }} className="product-card group">
              <ProductVisual family={family} photo={workspace.photos.find((photo) => photo.familyId === family.id)} />
              <div className="product-card-body">
              <span className={`stock-label ${inStock ? '' : 'stock-label-empty'}`}>{inStock ? family.products.length === 1 ? `${family.products[0].stockQuantity} available` : `${stockedVariants} of ${family.products.length} variants in stock` : 'Out of stock'}</span>
              <span className="text-xs text-content-muted">{family.category}</span>
              <span className="business-product-name product-card-title mt-1 font-heading text-xl">{family.name}</span>
              <span className="business-amount mt-2 text-lg text-primary">{peso(min)}{max !== min ? ` – ${peso(max)}` : ''}</span>
              <span className="mt-2 text-sm text-content-muted">{scents ? `${scents} scents · ${family.products.length} variants` : family.products.length > 1 ? `${family.products.length} sizes available` : 'Single product'}</span>
              <span className="mt-auto flex w-full items-center justify-between border-t border-outline-variant pt-4 text-sm font-semibold text-primary"><span className="pt-3">Tap to record sale</span><span aria-hidden="true" className="pt-3">↗</span></span>
              </div>
            </button>
          })}
        </div> : <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center"><BusinessIcon className="mx-auto mb-4 h-10 w-10 text-primary" name="inventory" /><h3 className="font-heading text-xl font-semibold">{products.length ? 'No matching products' : 'No products yet'}</h3><p className="mx-auto mt-2 max-w-md text-content-muted">{products.length ? 'Try a different search or category.' : 'Add your first product in Inventory to start recording sales.'}</p>{products.length ? <Button className="mt-5" variant="secondary" onClick={() => { setSearch(''); setCategory('All Products') }}>Clear filters</Button> : <Link to="/business/inventory" className="mt-5 inline-flex min-h-11 items-center rounded bg-primary px-5 font-semibold text-white">Open Inventory</Link>}</div>}
      </> : null}
    </section>
    {selected ? <RecordSaleModal photo={workspace.photos.find((photo) => photo.familyId === selected.id)} family={selected} products={products} completeSale={workspace.completeSale} disabled={disabled} onClose={() => setSelected(null)} onRecorded={(message) => { setSelected(null); setNotice(message) }} /> : null}
  </BusinessShell>
}
