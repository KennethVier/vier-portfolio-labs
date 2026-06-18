import { Button } from '@/components/ui/Button.jsx'
import { DataGrid } from '@/components/ui/DataGrid.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { StatusBadge } from '@/components/dashboard'

import { INBOX_STATUS } from '../constants/expenseInboxConstants.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(value) {
  return currencyFormatter.format(value ?? 0)
}

function getStatusTone(status) {
  if (status === INBOX_STATUS.approved) {
    return 'success'
  }

  if (status === INBOX_STATUS.rejected) {
    return 'critical'
  }

  return 'warning'
}

function InboxActions({ onApprove, onEdit, onReject, onSelect, record }) {
  if (record.status !== INBOX_STATUS.pending) {
    return (
      <Button type="button" variant="secondary" onClick={() => onSelect(record)}>
        View
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" onClick={() => onApprove(record)}>
        Approve
      </Button>
      <Button type="button" variant="secondary" onClick={() => onEdit(record)}>
        Edit
      </Button>
      <Button type="button" variant="ghost" onClick={() => onReject(record)}>
        Reject
      </Button>
    </div>
  )
}

export function ExpenseInboxList({
  records,
  selectedRecord,
  onApprove,
  onEdit,
  onReject,
  onSelect,
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        title="Inbox is clear."
        message="No expenses require review."
      />
    )
  }

  const rows = records.map((record) => ({
    actions: (
      <InboxActions
        record={record}
        onApprove={onApprove}
        onEdit={onEdit}
        onReject={onReject}
        onSelect={onSelect}
      />
    ),
    amount: (
      <span className="block text-right font-data-mono">
        {formatMoney(record.amount)}
      </span>
    ),
    category: record.categoryName,
    date: record.transactionDate,
    id: record.id,
    merchant: (
      <button
        type="button"
        className="text-left font-semibold text-on-surface hover:text-primary"
        onClick={() => onSelect(record)}
      >
        {record.merchant}
      </button>
    ),
    source: record.source,
    status: (
      <StatusBadge tone={getStatusTone(record.status)}>
        {record.status}
      </StatusBadge>
    ),
  }))

  return (
    <>
      <div className="hidden md:block">
        <DataGrid
          columns={[
            { key: 'merchant', label: 'Merchant' },
            { key: 'amount', label: 'Amount' },
            { key: 'category', label: 'Category' },
            { key: 'date', label: 'Date' },
            { key: 'source', label: 'Source' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: 'Actions' },
          ]}
          rows={rows}
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {records.map((record) => (
          <article
            key={record.id}
            className={[
              'rounded border bg-surface-container-lowest p-4',
              selectedRecord?.id === record.id
                ? 'border-primary'
                : 'border-outline-variant',
            ].join(' ')}
          >
            <button
              type="button"
              className="mb-3 flex w-full items-start justify-between gap-3 text-left"
              onClick={() => onSelect(record)}
            >
              <span>
                <span className="block font-semibold text-on-surface">
                  {record.merchant}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  {record.transactionDate}
                </span>
              </span>
              <span className="font-data-mono font-bold">
                {formatMoney(record.amount)}
              </span>
            </button>

            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge tone={getStatusTone(record.status)}>
                {record.status}
              </StatusBadge>
              <StatusBadge>{record.categoryName}</StatusBadge>
            </div>

            <InboxActions
              record={record}
              onApprove={onApprove}
              onEdit={onEdit}
              onReject={onReject}
              onSelect={onSelect}
            />
          </article>
        ))}
      </div>
    </>
  )
}
