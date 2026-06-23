import { useEffect, useState } from 'react'

import { KpiGrid, PageHeader, SectionCard, StatCard } from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'

import { ExpenseInboxFilters } from '../components/ExpenseInboxFilters.jsx'
import { ExpenseInboxForm } from '../components/ExpenseInboxForm.jsx'
import { ExpenseInboxList } from '../components/ExpenseInboxList.jsx'
import { ExpenseInboxPreview } from '../components/ExpenseInboxPreview.jsx'
import { useExpenseInbox } from '../hooks/useExpenseInbox.js'

export function ExpenseInboxPage() {
  const {
    approveRecord,
    categories,
    editRecord,
    editingRecord,
    error,
    filters,
    inboxRecords,
    isLoading,
    isSaving,
    kpis,
    rejectRecord,
    resetEditingRecord,
    selectedRecord,
    selectRecord,
    updateFilters,
    updateRecord,
  } = useExpenseInbox()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const [reviewRecord, setReviewRecord] = useState(null)
  const [reviewNotice, setReviewNotice] = useState('')

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  useEffect(() => {
    if (!editingRecord) {
      setReviewRecord(null)
      setReviewNotice('')
      return
    }

    setReviewRecord(editingRecord)
  }, [editingRecord])

  async function handleApprove(record) {
    if (!record.suggestedPaymentMethod) {
      setReviewNotice('Choose a payment method before approving this expense.')
      editRecord(record)
      return
    }

    await approveRecord(record.id, record)
    setReviewRecord(null)
    setReviewNotice('')
  }

  async function handleReject(record) {
    if (!window.confirm(`Reject ${record.merchant}?`)) {
      return
    }

    await rejectRecord(record.id)
  }

  async function handleSave(values) {
    await updateRecord(reviewRecord.id, values)
  }

  async function handleSaveAndApprove(values) {
    await approveRecord(reviewRecord.id, values)
    setReviewRecord(null)
    setReviewNotice('')
  }

  if (isLoading) {
    return <LoadingState label="Loading expense inbox" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Review Inbox"
        description="Review and approve detected expenses before posting."
      />

      {error ? (
        <ErrorState title="Expense inbox issue" message={error} />
      ) : null}

      <KpiGrid columns={4}>
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">pending_actions</span>}
          label="Pending Records"
          tone="warning"
          value={kpis.pending}
        />
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">task_alt</span>}
          label="Approved Today"
          tone="success"
          value={kpis.approvedToday}
        />
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">block</span>}
          label="Rejected Today"
          tone="critical"
          value={kpis.rejectedToday}
        />
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">inbox</span>}
          label="Total Records"
          tone="info"
          value={kpis.total}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <SectionCard
          title="Inbox Table"
          description="Pending, approved, and rejected review records."
        >
          <div className="mb-4">
            <ExpenseInboxFilters
              categories={categories}
              filters={filters}
              onChange={updateFilters}
            />
          </div>
          <ExpenseInboxList
            records={inboxRecords}
            selectedRecord={selectedRecord}
            onApprove={handleApprove}
            onEdit={editRecord}
            onReject={handleReject}
            onSelect={selectRecord}
          />
        </SectionCard>

        <SectionCard
          title="Preview Panel"
          description="Selected expense review details."
          actions={
            selectedRecord ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => editRecord(selectedRecord)}
              >
                Edit
              </Button>
            ) : null
          }
        >
          <ExpenseInboxPreview record={selectedRecord} />
        </SectionCard>
      </div>

      <Modal
        title="Review Expense"
        description="Edit the detected record before approving it into Expenses."
        isOpen={Boolean(reviewRecord)}
        onClose={resetEditingRecord}
        size="xl"
      >
        {reviewRecord ? (
          <>
            {reviewNotice ? (
              <div className="mb-4 border border-tertiary/30 bg-tertiary-container px-3 py-2 text-body-sm text-on-tertiary-container">
                {reviewNotice}
              </div>
            ) : null}
            <ExpenseInboxForm
              categories={categories}
              isSaving={isSaving}
              record={reviewRecord}
              onApprove={handleSaveAndApprove}
              onCancel={resetEditingRecord}
              onSubmit={handleSave}
            />
          </>
        ) : null}
      </Modal>

    </div>
  )
}
