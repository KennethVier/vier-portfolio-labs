import { Fragment } from 'react'
import { Card } from '@/components/ui/Card.jsx'
import { BUSINESS_PAYMENT_LABELS, BUSINESS_PAYMENT_METHODS } from '../constants/businessConstants.js'
import { peso } from './businessPresentation.js'

function PaymentCells({ payments }) {
  return BUSINESS_PAYMENT_METHODS.map((method) => <Fragment key={method}>
    <td className="p-3 text-right font-mono">{payments[method].quantity}</td>
    <td className="business-amount p-3 text-right">{peso(payments[method].centavos)}</td>
  </Fragment>)
}

export function DailyAuditReport({ report }) {
  const { summary, groups } = report
  return <div className="daily-audit space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ...BUSINESS_PAYMENT_METHODS.map((method) => [`${BUSINESS_PAYMENT_LABELS[method]} sales`, peso(summary.payments[method].centavos)]),
        ['Overall sales', peso(summary.totalCentavos)],
        ['Total items sold', summary.totalSold],
        ['Opening inventory', summary.openingQuantity],
        ['Available inventory', summary.availableQuantity],
        ['Remaining inventory', summary.remainingQuantity],
      ].map(([label, value]) => <Card key={label} className={`audit-kpi ${typeof value === 'number' ? 'audit-kpi-quantity' : 'audit-kpi-money'} p-5`}>
        <p className="text-xs uppercase text-content-muted">{label}</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-primary">{value}</p>
      </Card>)}
    </div>
    <p className="text-sm text-content-muted">Stock added on selected date: {summary.addedQuantity}. Non-sale stock removals: {summary.removedQuantity}.
      {' '}Available = opening + additions; remaining = available − sold − non-sale removals.</p>
    {groups.length === 0 ? <Card className="p-5"><p>No inventory or sales recorded for this date.</p></Card> : <>
      {summary.totalSold === 0 ? <p role="status">No confirmed sales for this date. Recorded inventory is shown below.</p> : null}
      <Card className="p-5">
        <h2 className="mb-2 font-heading text-lg font-semibold">Product audit</h2>
        <p className="mb-3 text-sm text-content-muted">Stock appears once per group. Variant sales each consume one unit from that group. Scroll horizontally on smaller screens.</p>
        <div className="audit-table-scroll overflow-x-auto rounded border border-outline-variant" role="region" aria-label="Daily product audit table" tabIndex={0}>
          <table className="w-full whitespace-nowrap text-left text-sm">
            <caption className="sr-only">Daily Sales Audit for {report.date}, Asia/Manila. All amounts are PHP. Group stock is counted once.</caption>
            <thead className="bg-surface-container-low"><tr>
              {['Price (PHP)', 'Item', 'Reload / Available Quantity', 'Cash Payment Quantity', 'Cash Sales (PHP)', 'GCash Payment Quantity', 'GCash Sales (PHP)', 'Coop Payment Quantity', 'Coop Sales (PHP)', 'Total Sold', 'Remaining Stock'].map((label) => <th key={label} scope="col" className="p-3">{label}</th>)}
            </tr></thead>
            {groups.map((group) => <tbody key={group.id} className="border-t border-outline-variant">
              <tr className="audit-group bg-surface-container-low font-semibold">
                <td className="p-3">—</td>
                <th scope="row" className="p-3">{group.name} (stock group)</th>
                <td className="p-3 text-right font-mono">{group.availableQuantity}<span className="block text-xs font-normal text-content-muted">{group.openingQuantity} opening + {group.addedQuantity} added</span></td>
                <PaymentCells payments={group.payments} />
                <td className="p-3 text-right font-mono">{group.totalSold}</td>
                <td className="p-3 text-right font-mono">{group.remainingQuantity}{group.removedQuantity ? <span className="block text-xs font-normal">{group.removedQuantity} non-sale removals</span> : null}</td>
              </tr>
              {group.rows.map((row) => <tr key={row.id} className="border-t border-outline-variant">
                <td className="p-3">{row.priceCentavos === null ? 'Historical price unavailable' : <span className="business-amount">{peso(row.priceCentavos)}</span>}</td>
                <th scope="row" className="business-product-name p-3 pl-6">{row.name}</th>
                <td className="p-3 text-content-muted">Shared above</td>
                <PaymentCells payments={row.payments} />
                <td className="p-3 text-right font-mono">{row.totalSold}</td>
                <td className="p-3 text-content-muted">Shared above</td>
              </tr>)}
            </tbody>)}
            <tfoot className="border-t border-outline-variant bg-surface-container-low font-semibold"><tr>
              <td className="p-3">—</td><th scope="row" className="p-3">Total (groups counted once)</th>
              <td className="p-3 text-right font-mono">{summary.availableQuantity}</td>
              <PaymentCells payments={summary.payments} />
              <td className="p-3 text-right font-mono">{summary.totalSold}</td>
              <td className="p-3 text-right font-mono">{summary.remainingQuantity}</td>
            </tr></tfoot>
          </table>
        </div>
      </Card>
    </>}
  </div>
}
