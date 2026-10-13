import { useEffect, useState } from 'react'

import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { DismissiblePageHelper } from '@/components/guidance/DismissiblePageHelper.jsx'
import { useHeader } from '@/components/layout/headerContext.js'
import { PaginationControls } from '@/components/pagination/PaginationControls.jsx'
import { useLedgerPagination } from '@/components/pagination/useLedgerPagination.js'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Popover } from '@/components/ui/Popover.jsx'

import { SavingsFilters } from '../components/SavingsFilters.jsx'
import { SavingsForm } from '../components/SavingsForm.jsx'
import { SavingsList } from '../components/SavingsList.jsx'
import { useSavings } from '../hooks/useSavings.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

export function SavingsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const {
    clearEditingSavings,
    deleteSavings,
    editingSavings,
    error,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveSavings,
    savings,
    savingsKpis,
    setEditingSavings,
    updateFilters,
  } = useSavings()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const kpiHelperText = savingsKpis.currentCutoffId ? 'Current Cutoff' : 'No Current Cutoff'
  const pagination = useLedgerPagination({
    items: savings,
    resetKey: JSON.stringify(filters),
    storageKey: 'pesopilot:savings',
  })

  useEffect(() => {
    setHeaderConfig({
      searchPlaceholder: 'Search savings type or note...',
      searchValue: filters.search,
      showSearch: true,
      onSearchChange: (value) =>
        updateFilters({
          ...filters,
          search: value,
        }),
    })

    return () => resetHeaderConfig()
  }, [filters, resetHeaderConfig, setHeaderConfig, updateFilters])

  function closeForm() {
    clearEditingSavings()
    setIsFormOpen(false)
  }

  async function submitSavings(values) {
    await saveSavings(values)
    setIsFormOpen(false)
  }

  function openGeneralSavingsForm() {
    clearEditingSavings()
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Strategy"
        description="Allocating intelligence to long-term wealth assets."
        actions={
          <Button type="button" onClick={openGeneralSavingsForm}>
            <span className="material-symbols-outlined text-lg">add</span>
            Add Savings
          </Button>
        }
      />

      <KpiGrid columns={4}>
        <StatCard
          label="Total Savings"
          value={currencyFormatter.format(savingsKpis.totalSavings)}
          tone="info"
          valueSize="display"
          icon={<span className="material-symbols-outlined text-lg">account_balance</span>}
          trend={{
            label: kpiHelperText,
            tone: savingsKpis.currentCutoffId ? 'positive' : 'neutral',
          }}
        />
        <StatCard
          label="Current Cutoff Savings"
          value={currencyFormatter.format(savingsKpis.totalSavings)}
          helperText={kpiHelperText}
          tone="success"
        />
        <StatCard
          label="Largest Type"
          value={savingsKpis.largestSavingsType}
          helperText={kpiHelperText}
          tone="warning"
        />
        <StatCard
          label="Savings Records"
          value={savingsKpis.savingsRecords}
          helperText={kpiHelperText}
          tone="neutral"
        />
      </KpiGrid>

      {error ? <ErrorState title="Unable to process savings" message={error} /> : null}

      <DismissiblePageHelper
        pageKey="savings"
        title="Savings Records"
        message="Record your savings transfers and monitor how much you set aside each cutoff."
      />

      <SectionCard
        title="Savings Records"
        description="Historical savings contributions remain searchable and filterable."
        className="overflow-visible"
        actions={
          <div className="flex items-center gap-2">
            <Popover
              isOpen={isFilterOpen}
              anchor={
                <button
                  type="button"
                  className="rounded p-1 text-outline transition-colors hover:bg-surface-container hover:text-primary"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  aria-label="Open savings filters"
                  title="Filters"
                >
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                </button>
              }
            >
              <div className="p-3">
                <SavingsFilters
                  compact
                  filters={filters}
                  framed={false}
                  showSearch={false}
                  salaryCutoffs={salaryCutoffs}
                  onChange={updateFilters}
                />
              </div>
            </Popover>
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading savings" />
        ) : (
          <>
            <SavingsList
              emptyAction={
                <Button type="button" onClick={openGeneralSavingsForm}>
                  Add Savings
                </Button>
              }
              savings={pagination.paginatedItems}
              onDelete={deleteSavings}
              onEdit={(savingsRecord) => {
                setEditingSavings(savingsRecord)
                setIsFormOpen(true)
              }}
            />
            <PaginationControls
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              rangeLabel={pagination.range.label}
              total={pagination.total}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </SectionCard>

      <Modal
        isOpen={isFormOpen || Boolean(editingSavings)}
        title={editingSavings ? 'Edit Savings' : 'Add Savings'}
        description={
          editingSavings
            ? 'Update an existing savings transfer.'
            : 'Track money set aside from available cash.'
        }
        size="lg"
        onClose={closeForm}
      >
        <SavingsForm
          currentCutoffId={savingsKpis.currentCutoffId}
          editingSavings={editingSavings}
          framed={false}
          isSaving={isSaving}
          salaryCutoffs={salaryCutoffs}
          onCancel={closeForm}
          onSubmit={submitSavings}
        />
      </Modal>
    </div>
  )
}
