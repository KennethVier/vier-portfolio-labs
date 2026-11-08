import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useSaleWorkflow } from '../hooks/useSaleWorkflow.js'
import { peso, selectClass } from './businessPresentation.js'
import { BUSINESS_PAYMENT_LABELS, BUSINESS_PAYMENT_METHODS } from '../constants/businessConstants.js'

export function SaleForm({ products, completeSale, disabled }) {
  const sale = useSaleWorkflow(products, completeSale)
  return (
    <Card className="p-5">
      <h2 className="mb-2 font-heading text-lg font-semibold">Complete Sale</h2>
      <p className="mb-3 text-sm text-content-muted">Record a completed sale after owner verification. Cash, GCash and Coop Pay are manual labels; this does not verify external settlement.</p>
      <p className="mb-3 text-sm text-content-muted">If the page closes during confirmation, check Sales History before entering the sale again. Retry protection uses the request key in this form.</p>
      {sale.review ? (
        <section aria-label="Review sale" className="space-y-3">
          <h3 className="font-semibold">Confirm completed sale</h3>
          <p>{sale.review.productName} · {sale.review.quantity} × {peso(sale.review.unitPriceCentavos)}</p>
          <p className="business-amount">Total: {peso(sale.review.totalCentavos)}</p>
          <p>Payment method: {BUSINESS_PAYMENT_LABELS[sale.review.paymentMethod]}</p>
          <p className="text-sm text-content-muted">By confirming, you verify this sale is complete. Stock will be deducted once.</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={sale.confirmSale} disabled={disabled || sale.saving}>
              {sale.saving ? 'Recording…' : sale.error ? 'Retry Confirmed Sale' : 'Owner: Confirm Completed Sale'}
            </Button>
            <Button variant="secondary" onClick={sale.editSale} disabled={!sale.canEdit}>Back to Edit</Button>
          </div>
        </section>
      ) : (
        <form onSubmit={sale.reviewSale}>
          <fieldset disabled={disabled || sale.saving} className="space-y-3">
            <label className="block text-sm">Sale product
              <select required className={selectClass} value={sale.productId} onChange={(e) => sale.setProductId(e.target.value)}>
                <option value="">Select product</option>
                {products.map((item) => <option key={item.id} value={item.id} disabled={item.stockQuantity === 0}>
                  {item.name} · {peso(item.unitPriceCentavos)} · {item.stockQuantity} available
                </option>)}
              </select>
            </label>
            <Input label="Sale quantity" required type="number" min="1" step="1" max={sale.product?.stockQuantity} value={sale.quantity} onChange={(e) => sale.setQuantity(e.target.value)} />
            <label className="block text-sm">Payment method
              <select className={selectClass} value={sale.paymentMethod} onChange={(e) => sale.setPaymentMethod(e.target.value)}>
                {BUSINESS_PAYMENT_METHODS.map((method) => <option key={method} value={method}>{BUSINESS_PAYMENT_LABELS[method]}</option>)}
              </select>
            </label>
            {sale.preview ? <p aria-live="polite">{sale.preview.quantity} × <span className="business-amount">{peso(sale.preview.unitPriceCentavos)}</span> = <span className="business-amount">{peso(sale.preview.totalCentavos)}</span></p> :
              <p className="text-sm text-content-muted">{sale.validation}</p>}
            <Button type="submit" disabled={!sale.preview}>Review Sale</Button>
          </fieldset>
        </form>
      )}
      {sale.error ? <p role="alert" className="mt-3 text-sm text-error">{sale.error}</p> : null}
      {sale.notice ? <p role="status" className="mt-3 text-sm text-secondary">{sale.notice}</p> : null}
    </Card>
  )
}
