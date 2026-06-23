import { Button } from '@/components/ui/Button.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { DataGrid } from '@/components/ui/DataGrid.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'

import { CutoffCard } from './CutoffCard.jsx'
import { CutoffStatusBadge } from './CutoffStatusBadge.jsx'
import { getCutoffTypeLabel } from '../constants/cutoffConstants.js'

const moneyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(value) {
  return moneyFormatter.format(value ?? 0)
}

export function CutoffList({
  currentCutoff,
  cutoffs,
  onClose,
  onDelete,
  onEdit,
}) {
  if (cutoffs.length === 0) {
    return (
      <EmptyState
        title="No salary cutoffs yet"
        message="Create a cutoff to start grouping local expenses by pay period."
      />
    )
  }

  const rows = cutoffs.map((cutoff) => ({
    id: cutoff.id,
    name: (
      <div>
        <div className="font-semibold text-content">{cutoff.name}</div>
        <div className="text-xs text-content-muted">
          {getCutoffTypeLabel(cutoff.type)}
        </div>
      </div>
    ),
    period: `${cutoff.startDate} to ${cutoff.endDate}`,
    status: (
      <div className="flex flex-wrap gap-2">
        <CutoffStatusBadge status={cutoff.status} />
        {currentCutoff?.id === cutoff.id ? <Badge>Current</Badge> : null}
      </div>
    ),
    expectedIncome: (
      <span className="block text-right font-mono font-semibold">
        {formatMoney(cutoff.expectedIncome)}
      </span>
    ),
    actions: (
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => onEdit(cutoff)}>
          Edit
        </Button>
        {cutoff.status !== 'closed' ? (
          <Button variant="secondary" onClick={() => onClose(cutoff.id)}>
            Close
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => onDelete(cutoff.id)}>
          Delete
        </Button>
      </div>
    ),
  }))

  const columns = [
    { key: 'name', label: 'Cutoff' },
    { key: 'period', label: 'Period' },
    { key: 'status', label: 'Status' },
    { key: 'expectedIncome', label: 'Expected Income' },
    { key: 'actions', label: '' },
  ]

  return (
    <section className="space-y-3">
      <div className="hidden md:block">
        <DataGrid columns={columns} rows={rows} />
      </div>
      <div className="space-y-3 md:hidden">
        {cutoffs.map((cutoff) => (
          <CutoffCard
            key={cutoff.id}
            cutoff={cutoff}
            isCurrent={currentCutoff?.id === cutoff.id}
            onClose={onClose}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  )
}
