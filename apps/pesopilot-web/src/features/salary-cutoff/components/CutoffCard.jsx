import { Button } from '@/components/ui/Button.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { Card } from '@/components/ui/Card.jsx'

import { CutoffStatusBadge } from './CutoffStatusBadge.jsx'

const moneyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(value) {
  return moneyFormatter.format(value ?? 0)
}

export function CutoffCard({
  cutoff,
  isCurrent,
  onAssignExpenses,
  onClose,
  onDelete,
  onEdit,
  onMarkActive,
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-semibold text-content">
              {cutoff.name}
            </h3>
            <CutoffStatusBadge status={cutoff.status} />
            {isCurrent ? <Badge>Current</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-content-muted">
            {cutoff.startDate} to {cutoff.endDate}
          </p>
        </div>
        <div className="text-right font-mono text-sm font-semibold text-content">
          {formatMoney(cutoff.expectedIncome)}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase text-content-muted">Type</dt>
          <dd className="text-content">{cutoff.type}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onEdit(cutoff)}>
          Edit
        </Button>
        {cutoff.status !== 'active' ? (
          <Button variant="secondary" onClick={() => onMarkActive(cutoff.id)}>
            Mark Active
          </Button>
        ) : null}
        {cutoff.status !== 'closed' ? (
          <Button variant="secondary" onClick={() => onClose(cutoff.id)}>
            Close
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => onAssignExpenses(cutoff.id)}>
          Assign Expenses
        </Button>
        <Button variant="ghost" onClick={() => onDelete(cutoff.id)}>
          Delete
        </Button>
      </div>
    </Card>
  )
}
