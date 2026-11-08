import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useBusinessAction } from '../hooks/useBusinessAction.js'
import { peso, selectClass } from './businessPresentation.js'
import { PRODUCT_CATEGORIES, PRODUCT_SCENTS, SHAWL_OPTIONS, PILLOW_OPTIONS, PACKAGE_OPTIONS,
  findDuplicateProduct, availableSharedStock } from '../constants/productCatalog.js'
import { productCreationService } from '../services/productCreationService.js'

const emptySelection = { category: '', shawl: '', scent: '', type: '', size: '', name: '', price: '' }

export function ProductForm({ addProduct, disabled, products = [] }) {
  const [selection, setSelection] = useState(emptySelection)
  const [openingStock, setOpeningStock] = useState('0')
  const [poolId, setPoolId] = useState('')
  const action = useBusinessAction()
  const { category } = selection
  const preview = productCreationService.preview(selection)
  const duplicate = preview.input ? findDuplicateProduct(products, preview.input) : null
  const pools = availableSharedStock(products)
  const sharedStock = pools.find((product) => product.inventoryPoolId === poolId)
  const staleSelection = Boolean(poolId && !sharedStock)
  const hasScent = category && !['Shawls', 'Magic Pillows', 'Other product'].includes(category)
  const hasPackage = hasScent && category !== 'Hallelujah Inhaler'

  function select(key, value) {
    setSelection((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (disabled || action.saving || !preview.input || duplicate || staleSelection) return
    if (await action.run(() => addProduct({ ...preview.input,
      openingStock: poolId ? 0 : openingStock.trim() === '' ? NaN : Number(openingStock),
      ...(poolId ? { inventoryPoolId: poolId } : {}),
    }), 'Product saved. Add an optional photo in Product photos below.')) {
      setSelection(emptySelection)
      setOpeningStock('0')
      setPoolId('')
    }
  }

  return <Card className="product-creation p-5">
    <h2 className="font-heading text-xl">Add Product</h2>
    <p className="mb-5 mt-2 text-sm text-content-muted">Choose a category, select your item, then check the details before saving.</p>
    <form onSubmit={submit}>
      <fieldset disabled={disabled || action.saving} className="space-y-5">
        <label className="block text-sm font-semibold">Product Category
          <select required className={selectClass} value={category} onChange={(event) => {
            setSelection({ ...emptySelection, category: event.target.value })
            setOpeningStock('0')
            setPoolId('')
          }}>
            <option value="">Choose a category</option>
            {PRODUCT_CATEGORIES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        {category ? <>
          <div className="grid gap-4 sm:grid-cols-2">
            {category === 'Shawls' ? <label className="text-sm font-semibold">Shawl
              <select required className={selectClass} value={selection.shawl} onChange={(event) => select('shawl', event.target.value)}>
                <option value="">Choose a shawl</option>{SHAWL_OPTIONS.map((option) => <option key={option.name} value={option.name}>{option.name} — {peso(option.priceCentavos)}</option>)}
              </select>
            </label> : null}
            {hasScent ? <label className="text-sm font-semibold">Scent
              <select required className={selectClass} value={selection.scent} onChange={(event) => select('scent', event.target.value)}>
                <option value="">Choose a scent</option>{PRODUCT_SCENTS.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label> : null}
            {hasPackage ? <label className="text-sm font-semibold">Solo / Set
              <select required className={selectClass} value={selection.type} onChange={(event) => select('type', event.target.value)}>
                <option value="">Choose Solo or Set</option>{PACKAGE_OPTIONS.map((option) => <option key={option.type} value={option.type}>{option.type} — {peso(option.priceCentavos)}</option>)}
              </select>
            </label> : null}
            {category === 'Magic Pillows' ? <label className="text-sm font-semibold">Pillow size
              <select required className={selectClass} value={selection.size} onChange={(event) => select('size', event.target.value)}>
                <option value="">Choose a size</option>{PILLOW_OPTIONS.map((option) => <option key={option.size} value={option.size}>{option.label} — {peso(option.priceCentavos)}</option>)}
              </select>
            </label> : null}
            {category === 'Other product' ? <>
              <Input label="Custom product name" required maxLength={120} value={selection.name} onChange={(event) => select('name', event.target.value)} />
              <Input label="Custom unit price (PHP)" required inputMode="decimal" placeholder="0.00" value={selection.price} onChange={(event) => select('price', event.target.value)} />
            </> : <Input label="Unit price (PHP)" readOnly value={preview.input?.pricePesos ?? ''} placeholder="Select your item first" />}
            {!poolId ? <Input label="Opening Stock Quantity" required type="number" inputMode="numeric" min="0" step="1" value={openingStock} onChange={(event) => setOpeningStock(event.target.value)} /> : null}
          </div>
          {!poolId ? <p className="text-sm text-content-muted">Enter the quantity you have now. Stock is kept separately for this item. Add later deliveries using stock adjustment below.</p> : null}
          <details className="rounded-lg border border-outline-variant p-4">
            <summary className="flex cursor-pointer items-center text-sm font-semibold text-primary">Advanced · Shared stock{poolId ? ' selected' : ''}</summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm text-content-muted">Only use this if two items intentionally draw from the same physical stock.</p>
              <label className="block text-sm font-semibold">Use existing stock group
                <select className={selectClass} value={poolId} onChange={(event) => setPoolId(event.target.value)}>
                  <option value="">Keep separate stock (recommended)</option>
                  {pools.map((product) => <option key={product.inventoryPoolId} value={product.inventoryPoolId}>{product.inventoryPoolName} · {product.stockQuantity} available</option>)}
                </select>
              </label>
              {sharedStock ? <p className="rounded-lg bg-surface-container-low p-3 text-sm">This product will use the current quantity of <strong>{sharedStock.stockQuantity}</strong> in “{sharedStock.inventoryPoolName}”. No opening stock will be added. Sales and stock adjustments affect every item sharing this stock.</p> : null}
              {pools.length === 0 ? <p className="text-sm text-content-muted">No existing stock is available to share yet.</p> : null}
            </div>
          </details>
          <section aria-label="Product summary" className="sale-summary space-y-2 rounded-xl p-4">
            <h3 className="text-sm">Check before saving</h3>
            {preview.input ? <>
              <p className="business-product-name">{preview.input.name}</p>
              <p className="text-sm text-content-muted">{category}</p>
              <p className="business-amount text-xl">{peso(preview.unitPriceCentavos)} <span className="text-sm font-normal text-content-muted">per item</span></p>
              <p className="text-sm">{sharedStock ? `Uses existing stock: ${sharedStock.stockQuantity} available. No quantity added.` : `Opening stock: ${openingStock || '—'}. Kept separately.`}</p>
            </> : <p className="text-sm text-content-muted">{preview.error}</p>}
            {duplicate ? <p role="alert" className="text-sm text-error">This item is already in your inventory as “{duplicate.name}”. Use stock adjustment below to add more.</p> : null}
            {staleSelection ? <p role="alert" className="text-sm text-error">The selected shared stock is unavailable. Choose another option in Advanced.</p> : null}
          </section>
          <p className="text-sm text-content-muted">Photos are optional. After saving, add or replace a photo in <a className="font-semibold text-primary underline underline-offset-4" href="#product-photos">Product photos below</a>.</p>
          <Button type="submit" className="min-h-12 w-full sm:w-auto" disabled={!preview.input || Boolean(duplicate) || staleSelection}>{action.saving ? 'Saving…' : 'Save Product'}</Button>
        </> : null}
      </fieldset>
    </form>
    {action.error ? <p role="alert" className="mt-3 text-sm text-error">{action.error}</p> : null}
    {action.notice ? <p role="status" className="mt-3 text-sm text-secondary">{action.notice}</p> : null}
  </Card>
}
