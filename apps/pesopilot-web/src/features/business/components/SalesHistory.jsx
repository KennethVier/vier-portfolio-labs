import { downloadCsv } from './downloadCsv.js'
import { useState } from 'react'
import { getManilaDate } from '../services/dailyAuditService.js'
import { Card } from '@/components/ui/Card.jsx'
import { dateTime, peso } from './businessPresentation.js'
import { BUSINESS_PAYMENT_LABELS } from '../constants/businessConstants.js'

function periodKey(date, period) {
  if (period === 'Month') return date.slice(0, 7)
  if (period === 'Year') return date.slice(0, 4)
  if (period === 'Week') {
    const monday = new Date(date + 'T00:00:00Z')
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7)
    return monday.toISOString().slice(0, 10)
  }
  return date
}

export function SalesHistory({ sales: history }) {
  const [period, setPeriod] = useState('All time')
  const [date, setDate] = useState(() => getManilaDate())
  const sales = period === 'All time' ? history : history.filter(sale =>
    periodKey(getManilaDate(new Date(sale.confirmedAt)), period) === periodKey(date, period))
  const units = sales.reduce((sum, sale) => sum + sale.items.reduce((count, item) => count + item.quantity, 0), 0)
  const byProduct = new Map()
  const byDate = new Map()
  for (const sale of sales) {
    const day = getManilaDate(new Date(sale.confirmedAt))
    byDate.set(day, (byDate.get(day) ?? 0) + sale.totalCentavos)
    for (const item of sale.items) byProduct.set(item.productNameSnapshot, (byProduct.get(item.productNameSnapshot) ?? 0) + item.quantity)
  }
  const dates = [...byDate].sort(([a], [b]) => a.localeCompare(b))
  const best = [...byProduct].sort((a, b) => b[1] - a[1]).slice(0, 8)
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label>Sales period<select className="block rounded border p-2" value={period} onChange={event => setPeriod(event.target.value)}>
          {['Day', 'Week', 'Month', 'Year', 'All time'].map(value => <option key={value}>{value}</option>)}
        </select></label>
        {period !== 'All time' && <label>Date in period<input className="block rounded border p-2" type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value) }} /></label>}
        <p aria-live="polite"><strong>{peso(sales.reduce((sum, sale) => sum + sale.totalCentavos, 0))}</strong> · {units} units · {sales.length} transactions</p>
      </div>
      {sales.length > 0 && <>
        <div className="grid gap-5 md:grid-cols-2">
          {[['Revenue by day', dates, peso], ['Most units sold', best, value => String(value)]].map(([title, entries, format]) => {
            const max = entries.reduce((highest, [, value]) => Math.max(highest, value), 1)
            return <section key={title} className="max-h-96 space-y-2 overflow-auto rounded border border-outline-variant p-4">
              <h2 className="font-semibold">{title}</h2>
              {entries.map(([label, value]) => <div key={label}>
                <p className="flex justify-between gap-2 text-sm"><span>{label}</span><strong>{format(value)}</strong></p>
                <div aria-hidden="true" className="h-2 rounded bg-primary" style={{ width: 100 * value / max + '%' }} />
              </div>)}
            </section>
          })}
        </div>
        <button className="my-4 text-primary underline" onClick={() => downloadCsv('sales-' + period.toLowerCase().replace(' ', '-'), [
          ['Sale ID', 'Confirmed at', 'Product', 'Quantity', 'Unit price (PHP)', 'Line total (PHP)', 'Payment'],
          ...sales.flatMap(sale => sale.items.map(item => [sale.id, sale.confirmedAt, item.productNameSnapshot,
            item.quantity, item.unitPriceCentavos / 100, item.lineTotalCentavos / 100, BUSINESS_PAYMENT_LABELS[sale.paymentMethod]])),
        ])}>Export sales CSV</button>
      </>}
      {sales.length === 0 ? <p className="text-sm text-content-muted">{history.length ? 'No completed sales for this period.' : 'No completed sales yet. Review and confirm a sale to record it here.'}</p> : (
        <details><summary className="cursor-pointer font-semibold">Transactions</summary><div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Completed sales with original product and price snapshots</caption>
            <thead><tr className="border-b border-outline-variant">
              {['Date', 'Product', 'Quantity', 'Unit price', 'Total', 'Payment', 'Details'].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}
            </tr></thead>
            <tbody>{sales.map((sale) => (
              <tr key={sale.id} className="border-b border-outline-variant align-top">
                <td className="p-2"><time dateTime={sale.confirmedAt}>{dateTime(sale.confirmedAt)}</time></td>
                <td className="business-product-name p-2">{sale.items.map((item) => <p key={item.id}>{item.productNameSnapshot}</p>)}</td>
                <td className="p-2 font-mono">{sale.items.map((item) => <p key={item.id}>{item.quantity}</p>)}</td>
                <td className="business-amount p-2">{sale.items.map((item) => <p key={item.id}>{peso(item.unitPriceCentavos)}</p>)}</td>
                <td className="business-amount p-2">{peso(sale.totalCentavos)}</td>
                <td className="p-2">{BUSINESS_PAYMENT_LABELS[sale.paymentMethod] ?? 'Unknown payment method'}</td>
                <td className="p-2">
                  <details>
                    <summary className="cursor-pointer text-primary">View transaction</summary>
                    <dl className="mt-2 space-y-1 break-all">
                      <dt className="font-semibold">Transaction ID</dt><dd>{sale.id}</dd>
                      <dt className="font-semibold">Line totals</dt>
                      <dd>{sale.items.map((item) => <p key={item.id}><span className="business-product-name">{item.productNameSnapshot}</span>: <span className="business-amount">{peso(item.lineTotalCentavos)}</span></p>)}</dd>
                      <dt className="font-semibold">Status</dt><dd>Owner-confirmed completed sale</dd>
                    </dl>
                  </details>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div></details>
      )}
    </Card>
  )
}
