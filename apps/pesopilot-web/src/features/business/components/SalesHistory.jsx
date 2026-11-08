import { Card } from '@/components/ui/Card.jsx'
import { dateTime, peso } from './businessPresentation.js'

export function SalesHistory({ sales }) {
  return (
    <Card className="p-5">
      <h2 className="font-heading text-lg font-semibold">Sales History</h2>
      <p className="mb-3 text-sm text-content-muted">Completed transactions, newest first. Details use the original sale snapshots and cannot be edited here.</p>
      {sales.length === 0 ? <p className="text-sm text-content-muted">No completed sales yet. Review and confirm a sale to record it here.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Completed sales with original product and price snapshots</caption>
            <thead><tr className="border-b border-outline-variant">
              {['Date', 'Product', 'Quantity', 'Unit price', 'Total', 'Payment', 'Details'].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}
            </tr></thead>
            <tbody>{sales.map((sale) => (
              <tr key={sale.id} className="border-b border-outline-variant align-top">
                <td className="p-2"><time dateTime={sale.confirmedAt}>{dateTime(sale.confirmedAt)}</time></td>
                <td className="p-2">{sale.items.map((item) => <p key={item.id}>{item.productNameSnapshot}</p>)}</td>
                <td className="p-2 font-mono">{sale.items.map((item) => <p key={item.id}>{item.quantity}</p>)}</td>
                <td className="p-2 font-mono">{sale.items.map((item) => <p key={item.id}>{peso(item.unitPriceCentavos)}</p>)}</td>
                <td className="p-2 font-mono">{peso(sale.totalCentavos)}</td>
                <td className="p-2">{sale.paymentMethod === 'cash' ? 'Cash' : 'Coop (manual)'}</td>
                <td className="p-2">
                  <details>
                    <summary className="cursor-pointer text-primary">View transaction</summary>
                    <dl className="mt-2 space-y-1 break-all">
                      <dt className="font-semibold">Transaction ID</dt><dd>{sale.id}</dd>
                      <dt className="font-semibold">Line totals</dt>
                      <dd>{sale.items.map((item) => <p key={item.id}>{item.productNameSnapshot}: {peso(item.lineTotalCentavos)}</p>)}</dd>
                      <dt className="font-semibold">Status</dt><dd>Owner-confirmed completed sale</dd>
                    </dl>
                  </details>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
