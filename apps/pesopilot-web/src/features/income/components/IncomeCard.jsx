import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'

export function IncomeCard({
  formattedAmount,
  income,
  onDelete,
  onEdit,
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-semibold text-content">
              {income.source}
            </h3>
            <Badge>{income.cutoffName}</Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-content-muted">{income.date}</p>
        </div>
        <div className="text-right font-mono text-sm font-semibold text-content">
          {formattedAmount}
        </div>
      </div>

      {income.note ? (
        <p className="mt-3 text-sm text-content-muted">{income.note}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onEdit(income)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onDelete(income)}>
          Delete
        </Button>
      </div>
    </Card>
  )
}
