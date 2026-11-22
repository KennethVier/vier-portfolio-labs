import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { ProductForm } from '../components/ProductForm.jsx'
import { peso } from '../components/businessPresentation.js'
import { parsePriceCentavos } from '../services/businessService.js'
import { businessRepository } from '../repositories/businessRepository.js'
import { db } from '../cloud/client.ts'
import { previewCatalogImport } from './catalogImport.js'
import { publishCatalog } from './branchAdministration.js'

export function AdminProducts({ work, busy, run, online }) {
  const migration = useRef(null)
  const lock = useRef(false)
  const [preview, setPreview] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  async function review() {
    if (lock.current) return
    lock.current = true
    setReviewing(true)
    setFailure('')
    setNotice('')
    setPreview(null)
    setConfirmed(false)
    try {
      setPreview(
        await previewCatalogImport(
          db,
          work.profile.id,
          await businessRepository.listProducts(),
        ),
      )
    } catch {
      setFailure(
        'Could not review products on this device. Check Admin access and try again. No products were imported.',
      )
    } finally {
      lock.current = false
      setReviewing(false)
    }
  }
  async function importProducts() {
    if (
      !preview ||
      !confirmed ||
      preview.conflicts ||
      !preview.added ||
      !online ||
      reviewing ||
      lock.current
    )
      return
    lock.current = true
    setReviewing(true)
    setFailure('')
    setNotice('')
    try {
      await publishCatalog(
        db,
        work.profile.id,
        await businessRepository.listProducts(),
        preview.snapshot,
      )
      setPreview(null)
      setConfirmed(false)
      setNotice(
        'Products imported and shared. Next: ask Staff to receive the physical units in Branch Inventory. Branch stock was not changed.',
      )
    } catch (error) {
      setFailure(
        error.message?.includes('Products changed')
          ? error.message
          : 'Import could not finish. Some products may be saved on this device. Reconnect, review again and retry; existing products will be kept.',
      )
      setConfirmed(false)
    } finally {
      lock.current = false
      setReviewing(false)
    }
  }
  if (work.isLoading) return <p role="status">Loading your products…</p>
  if (work.error)
    return (
      <p>
        Products could not be loaded. Try again above before making changes.
      </p>
    )
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
        <h2 className="font-heading text-xl">
          {work.catalog.length
            ? 'Manage your products'
            : 'Start with your products'}
        </h2>
        <p>
          Add the products and scents you sell, with their prices. They become
          choices for every branch. Staff records actual quantities in Branch
          Inventory.
        </p>
        {!work.catalog.length && (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#add-product"
              className="inline-flex min-h-11 items-center rounded bg-primary px-4 font-semibold text-white"
            >
              Add product
            </a>
            <Button
              variant="secondary"
              onClick={() => {
                migration.current.open = true
                migration.current.querySelector('summary').focus()
              }}
            >
              Import existing products from this device
            </Button>
          </div>
        )}
        <p className="text-sm">
          After a product is saved and shared, Staff selects its scent or size,
          receives stock with a reason, then sells from POS.
        </p>
        <Link
          className="inline-flex min-h-11 items-center font-semibold text-primary underline"
          to="/business/branches"
        >
          Next: set up branches and Staff
        </Link>
      </section>
      <section id="add-product" className="scroll-mt-4">
        <ProductForm
          catalogOnly
          products={work.catalog}
          disabled={busy || reviewing || work.isLoading || Boolean(work.error)}
          addProduct={work.service.addProduct}
        />
      </section>
      <details
        ref={migration}
        id="import-products"
        className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 space-y-3"
      >
        <summary className="cursor-pointer min-h-11 font-semibold">
          Import existing products from this device
        </summary>
        <p>
          Use this once if the owner already added products on this browser
          before branch setup. Review the list before importing.
        </p>
        <p className="text-sm">
          Imports names, prices, scents, sizes and shared-stock definitions. It
          does not import quantities, photos, sales or daily audits. New branch
          stock starts at zero; any stock already recorded in a branch stays
          unchanged.
        </p>
        <Button
          variant="secondary"
          disabled={busy || reviewing}
          onClick={review}
        >
          {reviewing ? 'Reviewing…' : 'Preview existing products'}
        </Button>
        {!online && (
          <p role="status">
            You can preview while offline. Reconnect before importing products.
          </p>
        )}
        {failure && (
          <>
            <p role="alert">{failure}</p>
            <Button
              variant="secondary"
              disabled={!online || reviewing || busy}
              onClick={() => run(work.refresh, 'Latest updates received.')}
            >
              Try sharing again
            </Button>
          </>
        )}
        {notice && <p role="status">{notice}</p>}
        {preview && (
          <section aria-label="Product import preview" className="space-y-3">
            <p>
              {preview.added} to add · {preview.existing} already in the product
              list · {preview.conflicts} need review
            </p>
            {preview.rows.length ? (
              <ul className="divide-y divide-outline-variant">
                {preview.rows.map((row, n) => (
                  <li key={n} className="py-2 text-sm">
                    <p className="font-semibold">
                      {row.product.name || 'Unnamed product'} ·{' '}
                      {Number.isSafeInteger(row.priceCentavos)
                        ? peso(row.priceCentavos)
                        : 'Price needs review'}
                    </p>
                    <p>
                      {[
                        row.product.catalog?.scent,
                        row.product.catalog?.type,
                        row.product.catalog?.size,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p>{row.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No existing products were found in this browser. Use Add product
                above.
              </p>
            )}
            {preview.conflicts > 0 && (
              <p role="alert">
                Review the marked products before importing. Nothing will be
                overwritten.
              </p>
            )}
            {preview.added > 0 && !preview.conflicts && (
              <>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  I reviewed these products. Import product details only;
                  receive stock separately in each branch.
                </label>
                <Button
                  disabled={!confirmed || !online || busy || reviewing}
                  onClick={importProducts}
                >
                  {reviewing
                    ? 'Importing…'
                    : `Import ${preview.added} product${preview.added === 1 ? '' : 's'}`}
                </Button>
              </>
            )}
            {!preview.added && preview.existing > 0 && !preview.conflicts && (
              <p>
                These products are already in the list. Saved prices and branch
                stock are preserved. Staff can receive units once the changes
                are shared.
              </p>
            )}
          </section>
        )}
      </details>
      {work.catalog.length > 0 && (
        <section aria-label="Saved products" className="space-y-3">
          <h2 className="font-heading text-xl">
            Product list · {work.catalog.length}
          </h2>
          <ul className="space-y-2">
            {work.catalog.map((product) => (
              <li key={product.id}>
                <details className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
                  <summary className="cursor-pointer min-h-11 font-semibold">
                    {product.name} · {peso(product.unitPriceCentavos)} · Edit
                    price
                  </summary>
                  <form
                    className="mt-3 flex flex-wrap items-end gap-3"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const price = new FormData(event.currentTarget).get(
                        'price',
                      )
                      run(
                        () =>
                          work.repo.setPrice(
                            product.id,
                            parsePriceCentavos(price),
                          ),
                        'Price saved on this device. Staff will see it when the changes are shared.',
                      )
                    }}
                  >
                    <Input
                      label="New price (PHP)"
                      name="price"
                      inputMode="decimal"
                      required
                    />
                    <Button disabled={busy} type="submit">
                      Save price
                    </Button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
