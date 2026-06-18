import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { StatusBadge } from '@/components/dashboard'

import { INBOX_STATUS } from '../constants/expenseInboxConstants.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function getStatusTone(status) {
  if (status === INBOX_STATUS.approved) {
    return 'success'
  }

  if (status === INBOX_STATUS.rejected) {
    return 'critical'
  }

  return 'warning'
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-outline-variant py-2 last:border-b-0">
      <dt className="font-label-caps text-label-caps uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd className="mt-1 text-body-sm font-medium text-on-surface">
        {value || '—'}
      </dd>
    </div>
  )
}

export function ExpenseInboxPreview({ record }) {
  if (!record) {
    return (
      <EmptyState
        title="No record selected"
        message="Select an inbox item to preview the detected expense."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Preview
          </p>
          <h3 className="mt-1 text-headline-sm font-semibold text-on-surface">
            {record.merchant}
          </h3>
        </div>
        <StatusBadge tone={getStatusTone(record.status)}>
          {record.status}
        </StatusBadge>
      </div>

      <div className="rounded border border-outline-variant bg-surface p-4">
        <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          Amount
        </p>
        <p className="mt-2 font-data-mono text-headline-md font-bold text-on-surface">
          {currencyFormatter.format(record.amount ?? 0)}
        </p>
      </div>

      <dl>
        <DetailRow label="Category" value={record.categoryName} />
        <DetailRow label="Date" value={record.transactionDate} />
        <DetailRow label="Source" value={record.source} />
        <DetailRow label="Payment Method" value={record.suggestedPaymentMethod} />
        <DetailRow label="Notes" value={record.note ?? record.rawText} />
      </dl>
    </div>
  )
}
