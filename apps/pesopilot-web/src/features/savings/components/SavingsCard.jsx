import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'

export function SavingsCard({
  formattedAmount,
  onDelete,
  onEdit,
  savings,
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-semibold text-content">
              {savings.source}
            </h3>
            <Badge>{savings.cutoffName}</Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-content-muted">{savings.date}</p>
        </div>
        <div className="text-right font-mono text-sm font-semibold text-content">
          {formattedAmount}
        </div>
      </div>

      {savings.note ? (
        <p className="mt-3 text-sm text-content-muted">{savings.note}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onEdit(savings)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onDelete(savings)}>
          Delete
        </Button>
      </div>
    </Card>
  )
}
