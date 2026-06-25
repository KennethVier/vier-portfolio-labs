import { useState, useEffect } from 'react'
import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

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
        // sidebar={
        //   <div className="space-y-gutter">
        //     <IncomeStabilityCard />
        //     <QuickMetrics />
        //     <InsightCard />
        //   </div>
        // }
        // placeholder sidebar content while we work on the actual cards
        sidebar={
          <div className="space-y-gutter">
            <SectionCard title="Income Stability">
              <div className="h-48 flex items-end gap-2">
                <div className="h-20 flex-1 bg-primary/20" />
                <div className="h-24 flex-1 bg-primary/20" />
                <div className="h-16 flex-1 bg-primary/20" />
                <div className="h-32 flex-1 bg-primary/60" />
                <div className="h-24 flex-1 bg-primary/20" />
                <div className="h-40 flex-1 bg-primary" />
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Confidence Score</span>
                  <span className="font-mono font-semibold text-secondary">
                    High (98%)
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Est. Q4 Total</span>
                  <span className="font-mono font-semibold">
                    PHP 38,200
                  </span>
                </div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3">
              <SectionCard>
                <p className="text-[10px] font-bold uppercase text-primary">
                  Quick Ratio
                </p>

                <p className="mt-2 font-mono text-2xl font-semibold text-primary">
                  4.2
                </p>
              </SectionCard>

              <SectionCard>
                <p className="text-[10px] font-bold uppercase text-secondary">
                  Burn Offset
                </p>

                <p className="mt-2 font-mono text-2xl font-semibold text-secondary">
                  180%
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
                    Diversification Insight
                  </p>

                  <p className="mt-1 text-sm text-content-muted">
                    68% of income originates from one source.
                    Consider expanding additional income streams.
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
            <IncomeList
              income={income}
              onDelete={deleteIncome}
              onEdit={(incomeRecord) => {
                setEditingIncome(incomeRecord)
                setIsFormOpen(true)
              }}
            />
          )}
        </SectionCard>
      </TwoColumnLayout>

    </div>
  )
}
