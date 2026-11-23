import { Input } from '@/components/ui/Input.jsx'
import { standardCatalogDefinitions } from './standardCatalog.js'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { ProductForm } from '../components/ProductForm.jsx'
import { peso } from '../components/businessPresentation.js'
import { CatalogProductEditor } from './CatalogProductEditor.jsx'
import { ProductPhotoManager } from '../components/ProductPhotoManager.jsx'
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
  const [search, setSearch] = useState('')
  async function review(kind = 'device') {
    if (lock.current) return
    lock.current = true
    setReviewing(true)
    setFailure('')
    setNotice('')
    setPreview(null)
    setConfirmed(false)
    try {
      const products =
        kind === 'standard'
          ? standardCatalogDefinitions(work.catalog)
          : await businessRepository.listProducts()
      setPreview({
        ...(await previewCatalogImport(db, work.profile.id, products)),
        kind,
      })
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
        preview.kind === 'standard'
          ? preview.source
          : await businessRepository.listProducts(),
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
      {work.catalogSetup && work.catalogSetup.phase !== 'ready' && (
        <section
          role="status"
          className="rounded-lg border border-outline-variant p-4 space-y-2"
        >
          <p>
            {
              {
                checking: 'Preparing your standard product choices…',
                connection:
                  'Products could not be checked for updates. Existing products are unchanged. Reconnect and try again.',
                offline:
                  'Connect once so the owner can finish product setup. Existing products remain available offline.',
                owner:
                  'The business owner needs to sign in once to finish standard product setup.',
                waiting:
                  'Product setup is already recorded. Receive the remaining product updates before continuing.',
                review:
                  'Product setup needs owner review. Existing products are preserved; no conflicting definition was replaced.',
              }[work.catalogSetup.phase]
            }
          </p>
          {work.catalogSetup.issues?.length > 0 && (
            <ul className="list-disc pl-5">
              {work.catalogSetup.issues.map((name) => (
                <li key={name}>{name}: duplicate definitions need review.</li>
              ))}
            </ul>
          )}
          {['offline', 'waiting', 'review', 'connection'].includes(
            work.catalogSetup.phase,
          ) && (
            <Button
              variant="secondary"
              disabled={!online}
              onClick={work.catalogSetup.retry}
            >
              Check product setup again
            </Button>
          )}
        </section>
      )}
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
          More product choices
        </summary>
        <h3 className="font-semibold">Standard products</h3>
        <p className="text-sm">
          Review the familiar shawls, scents, Solo/Set options and pillows. Add
          missing choices at the standard prices; keep existing products, prices
          and branch quantities. No stock is received.
        </p>
        <Button
          variant="secondary"
          disabled={busy || reviewing}
          onClick={() => review('standard')}
        >
          Review standard product choices
        </Button>
        <h3 className="font-semibold">
          Import existing products from this device
        </h3>
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
          onClick={() => review('device')}
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
              onClick={() => run(work.refresh, 'Business records reloaded.')}
            >
              Try sharing again
            </Button>
          </>
        )}
        {notice && <p role="status">{notice}</p>}
        {preview && (
          <section aria-label="Product import preview" className="space-y-3">
            <p>
              {preview.kind === 'standard'
                ? 'Standard product choices'
                : 'Existing products from this device'}
            </p>
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
      <ProductPhotoManager
        shared
        products={work.catalog}
        photos={work.photos ?? []}
        uploadPhoto={work.uploadPhoto}
        removePhoto={work.removePhoto}
        disabled={busy || reviewing}
      />
      {work.catalog.length > 0 && (
        <section aria-label="Saved products" className="space-y-3">
          <h2 className="font-heading text-xl">
            Product list · {work.catalog.length}
          </h2>
          <Input
            label="Find saved products"
            type="search"
            placeholder="Product, scent, size, Solo or Set"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ul className="space-y-2">
            {work.catalog
              .filter((product) =>
                [
                  product.name,
                  product.catalog?.scent,
                  product.catalog?.type,
                  product.catalog?.size,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
              )
              .map((product) => (
                <li key={product.id}>
                  <CatalogProductEditor
                    product={product}
                    work={work}
                    busy={busy}
                    run={run}
                  />
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}
