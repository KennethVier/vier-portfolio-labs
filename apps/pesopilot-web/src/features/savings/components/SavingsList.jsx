import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'

import { SavingsCard } from './SavingsCard.jsx'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

export function SavingsList({ emptyAction, onDelete, onEdit, savings }) {
  if (savings.length === 0) {
    return (
      <EmptyState
        title="No savings contributions yet"
        message="Add a savings contribution to start tracking money set aside."
        action={emptyAction}
      />
    )
  }

  function confirmDelete(savingsRecord) {
    if (window.confirm('Delete this savings record?')) {
      onDelete(savingsRecord.id)
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
                Type
              </th>
              <th className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Goal
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
            {savings.map((savingsRecord) => (
              <tr key={savingsRecord.id} className="hover:bg-surface-container-low">
                <td className="border-b border-outline-variant px-3 py-2 font-mono text-xs">
                  {savingsRecord.date}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  {savingsRecord.source}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  <Badge>{savingsRecord.goalName}</Badge>
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  <Badge>{savingsRecord.cutoffName}</Badge>
                </td>
                <td className="border-b border-outline-variant px-3 py-2 text-right font-mono font-semibold">
                  {currencyFormatter.format(savingsRecord.amount)}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  {savingsRecord.note || '-'}
                </td>
                <td className="border-b border-outline-variant px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onEdit(savingsRecord)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => confirmDelete(savingsRecord)}
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
        {savings.map((savingsRecord) => (
          <SavingsCard
            key={savingsRecord.id}
            formattedAmount={currencyFormatter.format(savingsRecord.amount)}
            savings={savingsRecord}
            onDelete={confirmDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </>
  )
}
