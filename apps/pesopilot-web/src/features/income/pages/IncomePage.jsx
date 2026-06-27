import { useState, useEffect } from 'react'
import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { PaginationControls } from '@/components/pagination/PaginationControls.jsx'
import { useLedgerPagination } from '@/components/pagination/useLedgerPagination.js'
import { DismissiblePageHelper } from '@/components/guidance/DismissiblePageHelper.jsx'

import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { Popover } from '@/components/ui/Popover.jsx'
import { IncomeFilters } from '../components/IncomeFilters.jsx'
import { IncomeForm } from '../components/IncomeForm.jsx'
import { IncomeList } from '../components/IncomeList.jsx'
import { useIncome } from '../hooks/useIncome.js'
import { Modal } from '@/components/ui/Modal.jsx'
import { TwoColumnLayout } from '@/components/layout/TwoColumnLayout.jsx'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

export function IncomePage() {
  const {
    clearEditingIncome,
    deleteIncome,
    editingIncome,
    error,
    filters,
    income,
    incomeKpis,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveIncome,
    setEditingIncome,
    updateFilters,
  } = useIncome();

  const { setHeaderConfig, resetHeaderConfig } = useHeader()
  const pagination = useLedgerPagination({
    items: income,
    resetKey: JSON.stringify(filters),
    storageKey: 'pesopilot:income',
  })

  useEffect(() => {
    setHeaderConfig({
      searchPlaceholder: 'Search income sources...',
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

  const kpiHelperText = incomeKpis.currentCutoffId ? 'Current Cutoff' : 'No Current Cutoff'

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="space-y-3">
      <PageHeader
        title="Income Management"
        description="Track, verify, and project your financial inflows."
        actions={
          <Button onClick={() => setIsFormOpen(true)}>
            <span className="material-symbols-outlined text-lg">
              add
            </span>
            Add Income
          </Button>
        }
      />

      <KpiGrid columns={4}>
        <StatCard
          label="Total Income"
          value={currencyFormatter.format(incomeKpis.totalIncome)}
          tone="info"
          valueSize="display"
          icon={
            <span className="material-symbols-outlined text-lg">
              trending_up
            </span>
          }
          trend={{
            label: kpiHelperText,
            tone: incomeKpis.currentCutoffId ? 'positive' : 'neutral',
          }}
        />

        <StatCard
          label="Salary"
          value={currencyFormatter.format(incomeKpis.salaryIncome)}
          helperText={kpiHelperText}
          tone="info"
          progress={68}
        />

        <StatCard
          label="Other Income"
          value={currencyFormatter.format(incomeKpis.otherIncome)}
          helperText={kpiHelperText}
          tone="success"
          progress={32}
        />

        <StatCard
          label="Records"
          value={incomeKpis.incomeRecords}
          tone="neutral"
          helperText={
            <>
              <span className="material-symbols-outlined text-sm">
                schedule
              </span>
              {kpiHelperText}
            </>
          }
        />
      </KpiGrid>

      <DismissiblePageHelper
        pageKey="income"
        title="Record income first"
        message="Income anchors your current cutoff. After recording income, PesoPilot can compare spending and savings against the funded cycle."
      />

      {error ? <ErrorState title="Unable to process income" message={error} /> : null}

      <Modal
        isOpen={isFormOpen || Boolean(editingIncome)}
        title={editingIncome ? 'Edit Income' : 'Add Income'}
        description={
          editingIncome
            ? 'Update an existing income record.'
            : 'Track money entering your control.'
        }
        size="lg"
        onClose={() => {
          clearEditingIncome()
          setIsFormOpen(false)
        }}
      >
        <IncomeForm
          currentCutoffId={incomeKpis.currentCutoffId}
          editingIncome={editingIncome}
          isSaving={isSaving}
          salaryCutoffs={salaryCutoffs}
          onCancel={() => {
            clearEditingIncome()
            setIsFormOpen(false)
          }}
          onSubmit={async (values) => {
            await saveIncome(values)
            setIsFormOpen(false)
          }}
        />
      </Modal>

      <TwoColumnLayout
        sidebar={
          <div className="space-y-gutter">
            <SectionCard title="Income Stability">
              <div className="flex min-h-48 items-center justify-center rounded border border-dashed border-outline-variant bg-surface-container-low p-4 text-center">
                <div>
                  <span className="material-symbols-outlined text-3xl text-primary">
                    auto_awesome
                  </span>
                  <p className="mt-2 font-semibold text-content">
                    AI income stability analysis is underway.
                  </p>
                  <p className="mt-1 text-sm text-content-muted">
                    Forecast confidence and projected income summaries are not
                    active in this MVP release.
                  </p>
                </div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3">
              <SectionCard>
                <p className="text-[10px] font-bold uppercase text-primary">
                  Income Ratio
                </p>

                <p className="mt-2 text-sm leading-relaxed text-content-muted">
                  Ratio analysis is still underway.
                </p>
              </SectionCard>

              <SectionCard>
                <p className="text-[10px] font-bold uppercase text-secondary">
                  Burn Offset
                </p>

                <p className="mt-2 text-sm leading-relaxed text-content-muted">
                  Offset analytics are still underway.
                </p>
              </SectionCard>
            </div>

            <SectionCard>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-tertiary">
                  lightbulb
                </span>

                <div>
                  <p className="font-semibold text-tertiary">
                    Income Insight
                  </p>

                  <p className="mt-1 text-sm text-content-muted">
                    AI-generated income diversification guidance is still
                    underway. Current income records remain available in the
                    transaction history.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        }
      >
        <SectionCard
          title="Transaction History"
          className="overflow-visible"
          actions={
            <Popover
              isOpen={isFilterOpen}
              anchor={
                <button
                  type="button"
                  className="text-outline transition-colors hover:text-primary"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  aria-label="Open income filters"
                >
                  <span className="material-symbols-outlined text-lg">
                    filter_list
                  </span>
                </button>
              }
            >
              <div className="p-3">
                <IncomeFilters
                  compact
                  filters={filters}
                  framed={false}
                  showSearch={false}
                  salaryCutoffs={salaryCutoffs}
                  onChange={updateFilters}
                />
              </div>
            </Popover>
          }
        >
          {isLoading ? (
            <LoadingState label="Loading income" />
          ) : (
            <>
              <IncomeList
                income={pagination.paginatedItems}
                onDelete={deleteIncome}
                onEdit={(incomeRecord) => {
                  setEditingIncome(incomeRecord)
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
      </TwoColumnLayout>

    </div>
  )
}
