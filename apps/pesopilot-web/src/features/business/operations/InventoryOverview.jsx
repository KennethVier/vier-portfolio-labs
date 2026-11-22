import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input.jsx'
import { peso, selectClass } from '../components/businessPresentation.js'
import { inventoryOverviewRows } from './inventoryOverview.js'
export function InventoryOverview({
  overviews,
  branchId,
  setBranchId,
  loading = false,
}) {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState(''),
    [status, setStatus] = useState('')
  const all = useMemo(() => inventoryOverviewRows(overviews), [overviews])
  const categories = [...new Set(all.flatMap((row) => row.categories))].sort()
  const search = query.trim().toLowerCase()
  const rows = all.filter(
    (row) =>
      (!branchId || row.branchId === branchId) &&
      (!category || row.categories.includes(category)) &&
      (!status || row.status === status) &&
      [
        row.branch,
        ...row.categories,
        ...row.names,
        ...row.variants,
        ...row.products.map((product) => product.name),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search),
  )
  return (
    <section className="space-y-4" aria-label="Branch stock overview">
      <p className="text-sm">
        One row per physical stock group in each branch. Solo/Set options
        sharing stock are counted once. Offline devices appear after their
        updates arrive.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Search inventory"
          type="search"
          placeholder="Product, scent, size or branch"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label>
          Branch
          <select
            className={selectClass + ' min-h-11'}
            value={branchId}
            disabled={loading}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">All branches</option>
            {overviews.map((view) => (
              <option key={view.branch.id} value={view.branch.id}>
                {view.branch.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            className={selectClass + ' min-h-11'}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Stock status
          <select
            className={selectClass + ' min-h-11'}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All stock</option>
            {[
              'Available',
              'Low stock',
              'Out of stock',
              'Needs review',
              'Unavailable',
            ].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <p role="status">Loading branch stock…</p>
      ) : (
        <>
          <p role="status">
            {rows.length} stock groups ·{' '}
            {rows.reduce((sum, row) => sum + (row.available ?? 0), 0)} recorded
            units
            {rows.some((row) => row.available === null)
              ? ' · Some balances unavailable'
              : ''}
          </p>
          <div
            className="max-w-full overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest"
            role="region"
            aria-label="Inventory table — scroll horizontally on smaller screens"
            tabIndex={0}
          >
            <table className="w-full min-w-[56rem] text-left text-sm">
              <caption className="sr-only">
                Authorized branch physical inventory; shared pools counted once
              </caption>
              <thead>
                <tr>
                  {[
                    'Category',
                    'Product',
                    'Scent / size / option',
                    'Branch',
                    'Available units',
                    'Selling price',
                    'Stock status',
                  ].map((name) => (
                    <th
                      key={name}
                      scope="col"
                      className="border-b border-outline-variant px-4 py-3"
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-outline-variant align-top last:border-0"
                  >
                    <td className="px-4 py-3">{row.categories.join(' / ')}</td>
                    <th scope="row" className="px-4 py-3">
                      <span className="business-product-name">
                        {row.names.join(' / ')}
                      </span>
                      {row.shared && (
                        <span className="mt-1 block text-xs font-normal text-content-muted">
                          Shared stock · {row.products.length} price/variant
                          options
                        </span>
                      )}
                    </th>
                    <td className="px-4 py-3">{row.variants.join(' / ')}</td>
                    <td className="px-4 py-3">{row.branch}</td>
                    <td className="business-amount px-4 py-3">
                      {row.available ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {[
                        ...new Set(
                          row.products.map(
                            (product) =>
                              (product.catalog?.type ?? 'Unit') +
                              ': ' +
                              peso(product.unitPriceCentavos),
                          ),
                        ),
                      ].map((price) => (
                        <p key={price}>{price}</p>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          ['Needs review', 'Out of stock'].includes(row.status)
                            ? 'font-semibold text-error'
                            : 'font-semibold'
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <p>
              {all.length
                ? 'No stock groups match these filters.'
                : 'No branch inventory is available yet. Create a branch and assign Staff; physical stock starts at zero.'}
            </p>
          )}
        </>
      )}
    </section>
  )
}
