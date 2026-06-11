import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'

import { ExpenseCard } from './ExpenseCard.jsx'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function getCategoryName(categoriesById, categoryId) {
  return categoriesById.get(categoryId)?.name ?? 'Uncategorized'
}

export function ExpenseList({ categories, expenses, onDelete, onEdit }) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        title="No expenses yet"
        message="Add a manual expense to start tracking spending."
      />
    )
  }

  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  )

  function confirmDelete(expense) {
    if (window.confirm('Delete this expense?')) {
      onDelete(expense.id)
    }
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded border border-outline-variant bg-surface-container-lowest md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container">
            <tr>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Date
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Merchant
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Category
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Amount
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Payment
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Tag
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-surface-container-low">
                <td className="border-b border-outline-variant px-3 py-2 font-mono text-xs">
                  {expense.date}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  {expense.merchant || 'Untitled expense'}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  <Badge>{getCategoryName(categoriesById, expense.categoryId)}</Badge>
                </td>
                <td className="border-b border-outline-variant px-3 py-2 text-right font-mono font-semibold">
                  {currencyFormatter.format(expense.amount)}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  {expense.paymentMethod || '-'}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  {expense.emotionTag || '-'}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onEdit(expense)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => confirmDelete(expense)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            categoryName={getCategoryName(categoriesById, expense.categoryId)}
            expense={expense}
            formattedAmount={currencyFormatter.format(expense.amount)}
            onDelete={confirmDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </>
  )
}
