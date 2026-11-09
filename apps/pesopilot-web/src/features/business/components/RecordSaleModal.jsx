import { ProductVisual } from './ProductVisual.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { BusinessDialog } from './BusinessDialog.jsx'
import { useSaleWorkflow } from '../hooks/useSaleWorkflow.js'
import { peso, selectClass } from './businessPresentation.js'
import { BUSINESS_PAYMENT_LABELS, BUSINESS_PAYMENT_METHODS } from '../constants/businessConstants.js'
import { PRODUCT_SCENTS } from '../constants/catalogMetadata.js'

export function RecordSaleModal({ family, photo, products, completeSale, disabled, onClose, onRecorded }) {
  const variants = products.filter((product) => family.products.some((item) => item.id === product.id))
  const initial = variants.find((product) => product.stockQuantity > 0 && product.catalog?.type !== 'Set') ?? variants.find((product) => product.stockQuantity > 0) ?? variants[0]
  const sale = useSaleWorkflow(variants, completeSale, initial?.id, onRecorded)
  const dimensions = [['scent', 'Scent'], ['type', 'Solo / Set'], ['size', 'Size']]
  const ambiguous = new Set(variants.map((product) => JSON.stringify(dimensions.map(([key]) => product.catalog?.[key] ?? null)))).size !== variants.length ||
    dimensions.some(([key]) => variants.some((product) => product.catalog?.[key]) && variants.some((product) => !product.catalog?.[key]))

  function selectVariant(dimension, value) {
    const choices = variants.filter((product) => product.catalog?.[dimension] === value)
    const exact = choices.find((product) => dimensions.every(([key]) => key === dimension || product.catalog?.[key] === sale.product?.catalog?.[key]))
    sale.setProductId((exact ?? choices[0]).id)
  }

  return <BusinessDialog title={sale.review ? 'Confirm completed sale' : <span className="business-product-name">{family.name}</span>} canClose={sale.canEdit} onClose={onClose}>
    {photo ? <div className="sale-product-visual"><ProductVisual family={family} photo={photo} /><div><p className="business-product-name">{family.name}</p><p className="text-sm text-content-muted">{family.category}</p></div></div> : null}
    {sale.review ? <section aria-label="Review sale" className="space-y-5">
      <p className="text-sm text-content-muted">Review this recording before deducting stock.</p>
      <div className="sale-summary rounded-lg p-4">
        <p className="business-product-name text-xl">{sale.review.productName}</p>
        {sale.review.variantLabel ? <p className="mt-1 text-content-muted">{sale.review.variantLabel}</p> : null}
        <p className="mt-2 text-content-muted">{sale.review.quantity} × <span className="business-amount">{peso(sale.review.unitPriceCentavos)}</span></p>
        <p className="mt-2">Payment method: <strong>{BUSINESS_PAYMENT_LABELS[sale.review.paymentMethod]}</strong></p>
        <p className="business-amount mt-4 text-2xl text-primary">Total: {peso(sale.review.totalCentavos)}</p>
      </div>
      <p className="text-sm text-content-muted">By confirming, you verify this sale is complete. Stock will be deducted once. Payment is recorded manually; no external payment is verified.</p>
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button className="min-h-12 flex-1" disabled={sale.saving || (disabled && sale.canEdit)} onClick={sale.confirmSale}>{sale.saving ? 'Recording…' : sale.error ? 'Retry Confirmed Sale' : 'Owner: Confirm Completed Sale'}</Button>
        <Button variant="secondary" disabled={!sale.canEdit} onClick={sale.editSale}>Back to Edit</Button>
      </div>
    </section> : <form onSubmit={sale.reviewSale}>
      <fieldset disabled={disabled || sale.saving} className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-content-muted">{family.category}</p>
          <p className="business-amount shrink-0 text-xl text-primary">{sale.product ? peso(sale.product.unitPriceCentavos) : '—'}</p>
        </div>
        {ambiguous ? <label className="block text-sm font-semibold">Product variant
          <select className={selectClass} value={sale.productId} onChange={(event) => sale.setProductId(event.target.value)}>
            {variants.map((product) => <option key={product.id} value={product.id}>{product.name} · {peso(product.unitPriceCentavos)} · {product.stockQuantity} available</option>)}
          </select>
        </label> : dimensions.map(([dimension, label]) => {
          const options = [...new Set(variants.map((product) => product.catalog?.[dimension]).filter(Boolean))]
          if (dimension === 'type') options.sort((a, b) => (a === 'Solo' ? 0 : 1) - (b === 'Solo' ? 0 : 1))
          if (dimension === 'scent') options.sort((a, b) => PRODUCT_SCENTS.indexOf(a) - PRODUCT_SCENTS.indexOf(b))
          return options.length ? <fieldset key={dimension}>
            <legend className="mb-2 text-sm font-semibold">{label}</legend>
            <div className="flex flex-wrap gap-2">{options.map((value) => <Button key={value} variant={sale.product?.catalog?.[dimension] === value ? 'primary' : 'secondary'} aria-pressed={sale.product?.catalog?.[dimension] === value} onClick={() => selectVariant(dimension, value)}>{value}</Button>)}</div>
          </fieldset> : null
        })}
        <div className="rounded-lg bg-surface-container-low p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="sale-quantity" className="text-sm font-semibold">Sale quantity<span className="mt-1 block font-normal text-content-muted">{sale.product?.stockQuantity ?? 0} available</span></label>
            <div className="flex items-center gap-2">
              <Button variant="secondary" aria-label="Decrease quantity" disabled={Number(sale.quantity) <= 1} onClick={() => sale.setQuantity(String(Number(sale.quantity) - 1))}>−</Button>
              <Input id="sale-quantity" aria-label="Sale quantity" required type="number" inputMode="numeric" min="1" step="1" max={sale.product?.stockQuantity} value={sale.quantity} className="w-20 text-center font-mono" onChange={(event) => sale.setQuantity(event.target.value)} />
              <Button variant="secondary" aria-label="Increase quantity" disabled={Number(sale.quantity) >= (sale.product?.stockQuantity ?? 0)} onClick={() => sale.setQuantity(String(Number(sale.quantity) + 1))}>+</Button>
            </div>
          </div>
        </div>
        <fieldset><legend className="mb-2 text-sm font-semibold">Method of Payment</legend><div className="payment-options grid grid-cols-3 gap-2">
          {BUSINESS_PAYMENT_METHODS.map((method) => <Button key={method} aria-pressed={sale.paymentMethod === method} variant={sale.paymentMethod === method ? 'primary' : 'secondary'} onClick={() => sale.setPaymentMethod(method)}>{BUSINESS_PAYMENT_LABELS[method]}</Button>)}
        </div></fieldset>
        <div aria-live="polite" className="sale-summary rounded-xl p-4">
          <p className="mb-2 text-sm text-content-muted"><span className="business-product-name">{family.name}</span>{sale.product?.catalog ? ` · ${[sale.product.catalog.scent, sale.product.catalog.type, sale.product.catalog.size].filter(Boolean).join(' · ')}` : ''}</p>
          <p className="mb-3 text-sm text-content-muted">Quantity: {sale.quantity || '—'} · Payment: {BUSINESS_PAYMENT_LABELS[sale.paymentMethod]}</p>
          <div className="flex items-center justify-between"><span className="font-semibold">Total</span><span className="business-amount text-3xl text-primary">{sale.preview ? peso(sale.preview.totalCentavos) : '—'}</span></div>
        </div>
        {!sale.preview ? <p role="alert" className="text-sm text-error">{sale.validation}</p> : null}
        <Button type="submit" className="min-h-12 w-full text-base" disabled={!sale.preview}>Record Sale</Button>
        <p className="text-center text-xs text-content-muted">Review and confirm before saving.</p>
      </fieldset>
    </form>}
    {sale.error ? <p role="alert" className="mt-4 text-sm text-error">{sale.error}</p> : null}
  </BusinessDialog>
}
