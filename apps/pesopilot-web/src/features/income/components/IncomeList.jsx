import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'

import { IncomeCard } from './IncomeCard.jsx'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

export function IncomeList({ income, onDelete, onEdit }) {
  if (income.length === 0) {
    return (
      <EmptyState
        title="No income yet"
        message="Add an income record to start tracking money coming in."
      />
    )
  }

  function confirmDelete(incomeRecord) {
    if (window.confirm('Delete this income record?')) {
      onDelete(incomeRecord.id)
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
                Source
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Cutoff
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Amount
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Note
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {income.map((incomeRecord) => (
              <tr key={incomeRecord.id} className="hover:bg-surface-container-low">
                <td className="border-b border-outline-variant px-3 py-2 font-mono text-xs">
                  {incomeRecord.date}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  {incomeRecord.source}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  <Badge>{incomeRecord.cutoffName}</Badge>
                </td>
                <td className="border-b border-outline-variant px-3 py-2 text-right font-mono font-semibold">
                  {currencyFormatter.format(incomeRecord.amount)}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  {incomeRecord.note || '-'}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onEdit(incomeRecord)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => confirmDelete(incomeRecord)}
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
        {income.map((incomeRecord) => (
          <IncomeCard
            key={incomeRecord.id}
            formattedAmount={currencyFormatter.format(incomeRecord.amount)}
            income={incomeRecord}
            onDelete={confirmDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </>
  )
}
