import { useState } from 'react'
import { Input } from '@/components/ui/Input.jsx'
import { CatalogProductEditor } from './CatalogProductEditor.jsx'

export function ProductPricing({ work, ...controls }) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const products = work.catalog.filter(({ name, catalog }) =>
    [name, catalog?.category, catalog?.scent, catalog?.size, catalog?.type]
      .filter(Boolean).join(' ').toLowerCase().includes(query),
  )
  return (
    <section className="space-y-4" aria-label="Catalog pricing">
      <p>Changes apply to future sales. Set prices are per piece in a five-piece selection. Completed receipts keep their original prices and costs.</p>
      {!controls.online && <p role="status">You can draft changes offline. Reconnect to check the latest pricing and save.</p>}
      <Input label="Find products" type="search" value={search}
        onChange={(event) => setSearch(event.target.value)} />
      {products.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((product) => <CatalogProductEditor key={product.id} product={product} work={work} {...controls} />)}
        </div>
      ) : !work.isLoading && <p>{query ? 'No products match your search.' : 'Add a product to manage its pricing.'}</p>}
    </section>
  )
}
