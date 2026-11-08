import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { useSaleWorkflow } from '../hooks/useSaleWorkflow.js'
import { peso, selectClass } from './businessPresentation.js'

export function SaleForm({ products, completeSale, disabled }) {
  const sale = useSaleWorkflow(products, completeSale)
  return (
    <Card className="p-5">
      <h2 className="mb-2 font-heading text-lg font-semibold">Complete Sale</h2>
      <p className="mb-3 text-sm text-content-muted">Record a completed sale after owner verification. Coop is a manual label; this does not verify external settlement.</p>
      {sale.review ? (
        <section aria-label="Review sale" className="space-y-3">
          <h3 className="font-semibold">Confirm completed sale</h3>
          <p>{sale.review.productName} · {sale.review.quantity} × {peso(sale.review.unitPriceCentavos)}</p>
          <p className="font-mono font-semibold">Total: {peso(sale.review.totalCentavos)}</p>
          <p>Payment method: {sale.review.paymentMethod === 'cash' ? 'Cash' : 'Coop (manual)'}</p>
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
                <option value="cash">Cash</option><option value="coop">Coop (manual)</option>
              </select>
            </label>
            {sale.preview ? <p className="font-mono" aria-live="polite">{sale.preview.quantity} × {peso(sale.preview.unitPriceCentavos)} = {peso(sale.preview.totalCentavos)}</p> :
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
