import { Card } from '@/components/ui/Card.jsx'
import { BUSINESS_PAYMENT_LABELS, BUSINESS_PAYMENT_METHODS } from '../constants/businessConstants.js'
import { peso } from './businessPresentation.js'
import { downloadCsv } from './downloadCsv.js'

export function DailyAuditReport({ report }) {
  const { summary, groups, profit, transactionCount } = report
  const methods = BUSINESS_PAYMENT_METHODS.filter(method => method !== 'coop' || summary.payments[method].quantity)
  const columns = ['Product', 'Available', 'Sold', 'Remaining', ...methods.map(method => BUSINESS_PAYMENT_LABELS[method]), 'Sales']
  const rows = groups.map(group => [
    group.rows.length === 1 ? group.rows[0].name : group.name,
    group.availableQuantity, group.totalSold, group.remainingQuantity,
    ...methods.map(method => peso(group.payments[method].centavos)),
    peso(methods.reduce((sum, method) => sum + group.payments[method].centavos, 0)),
  ])
  return <div className="daily-audit space-y-5">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        ['Overall sales', peso(summary.totalCentavos)],
        ['Cost of goods', profit.uncostedUnits ? '—' : peso(profit.costOfGoods)],
        ['Gross profit', profit.uncostedUnits ? '—' : peso(profit.grossProfit)],
        ['Cash sales', peso(summary.payments.cash.centavos)],
        ['GCash sales', peso(summary.payments.gcash.centavos)],
        ['Transactions', transactionCount],
        ['Available inventory', summary.availableQuantity],
        ['Items sold', summary.totalSold],
        ['Remaining inventory', summary.remainingQuantity],
      ].map(([label, value]) => <Card key={label} className="audit-kpi p-5">
        <p className="text-xs uppercase text-content-muted">{label}</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-primary">{value}</p>
      </Card>)}
    </div>
    {profit.uncostedUnits > 0 && <p className="text-sm">{profit.uncostedUnits} sold units have no recorded cost. Gross profit for units with recorded costs is {peso(profit.grossProfit)}.</p>}
    {summary.payments.coop.quantity > 0 && <p className="text-sm">Coop Pay sales · {peso(summary.payments.coop.centavos)}</p>}
    {summary.removedQuantity > 0 && <p>{summary.removedQuantity} units removed in stock corrections.</p>}
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg">Product audit</h2>
        {rows.length > 0 && <button className="text-primary underline" onClick={() => downloadCsv('audit-' + report.date, [columns, ...rows])}>Export audit CSV</button>}
      </div>
      {rows.length ? <div className="audit-table-scroll overflow-x-auto" role="region" aria-label="Daily product audit table" tabIndex={0}>
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead><tr>{columns.map(label => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead>
          <tbody>{rows.map(([name, ...values], index) => <tr key={groups[index].id} className="border-t border-outline-variant">
            <th scope="row" className="p-3">{name}</th>
            {values.map((value, column) => <td key={columns[column + 1]} className="p-3">{value}</td>)}
          </tr>)}</tbody>
        </table>
      </div> : <p>No inventory or sales recorded for this date.</p>}
    </Card>
  </div>
}
