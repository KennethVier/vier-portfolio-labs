import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'

export function ExpenseCard({ expense, categoryName, formattedAmount, onDelete, onEdit }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-base font-semibold text-content">
            {expense.merchant || 'Untitled expense'}
          </p>
          <p className="mt-1 text-sm text-content-muted">{expense.date}</p>
        </div>
        <p className="shrink-0 whitespace-nowrap font-mono text-sm font-semibold text-content">
          {formattedAmount}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{categoryName}</Badge>
        {expense.paymentMethod ? <Badge>{expense.paymentMethod}</Badge> : null}
        {expense.emotionTag ? <Badge>{expense.emotionTag}</Badge> : null}
      </div>
      {expense.note ? (
        <p className="mt-3 text-sm text-content-muted">{expense.note}</p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="secondary" onClick={() => onEdit(expense)}>
          Edit
        </Button>
        <Button type="button" variant="ghost" onClick={() => onDelete(expense)}>
          Delete
        </Button>
      </div>
    </Card>
  )
}
