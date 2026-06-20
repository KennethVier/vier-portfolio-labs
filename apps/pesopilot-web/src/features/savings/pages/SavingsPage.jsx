import { useEffect, useState } from 'react'

import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
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

function getSavingsKpis(savings, salaryCutoffs) {
  const activeCutoff = salaryCutoffs.find((cutoff) => cutoff.status === 'active')
  const typeTotals = new Map()

  const totals = savings.reduce(
    (kpis, savingsRecord) => {
      const amount = Number(savingsRecord.amount) || 0

      kpis.totalSavings += amount
      kpis.savingsRecords += 1

      if (
        activeCutoff &&
        String(savingsRecord.cutoffId) === String(activeCutoff.id)
      ) {
        kpis.currentCutoffSavings += amount
      }

      typeTotals.set(
        savingsRecord.source,
        (typeTotals.get(savingsRecord.source) ?? 0) + amount,
      )

      return kpis
    },
    {
      currentCutoffSavings: 0,
      savingsRecords: 0,
      totalSavings: 0,
    },
  )
  const largestSavingsType =
    [...typeTotals.entries()].sort((firstType, secondType) => {
      if (secondType[1] === firstType[1]) {
        return firstType[0].localeCompare(secondType[0])
      }

      return secondType[1] - firstType[1]
    })[0]?.[0] ?? 'None'

  return {
    ...totals,
    largestSavingsType,
  }
}

function ProgressBar({ tone = 'primary', value }) {
  const toneClassName = {
    critical: 'bg-error',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
  }[tone]

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
      <div
        className={['h-full rounded-full', toneClassName].join(' ')}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function SavingsGoalCard({
  amount,
  description,
  icon,
  isPrimary = false,
  progress,
  status,
  statusTone = 'bg-surface-container-high text-on-surface-variant',
  title,
  tone = 'primary',
  target,
}) {
  if (isPrimary) {
    return (
      <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-8">
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed-dim text-primary">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">
                  {title}
                </h4>
                <p className="text-body-sm text-on-surface-variant">
                  {description}
                </p>
              </div>
            </div>
            <span className={['rounded px-2 py-1 text-[10px] font-bold uppercase', statusTone].join(' ')}>
              {status}
            </span>
          </div>

          <div>
            <div className="mb-2 flex justify-between text-body-sm">
              <span className="font-data-mono">{amount} / {target}</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <ProgressBar value={progress} tone={tone} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-outline-variant py-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-label-caps uppercase text-on-surface-variant">
                Monthly Yield
              </p>
              <p className="font-data-mono text-on-surface">PHP 245.12</p>
            </div>
            <div>
              <p className="mb-1 text-label-caps uppercase text-on-surface-variant">
                APY
              </p>
              <p className="font-data-mono text-on-surface">4.50%</p>
            </div>
            <div>
              <p className="mb-1 text-label-caps uppercase text-on-surface-variant">
                Projected Completion
              </p>
              <p className="font-data-mono text-on-surface">Oct 2025</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center">
          <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">update</span>
            Auto-transfer: PHP 1,200/mo
          </span>
          <button
            type="button"
            className="flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Manage Fund
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={['rounded px-2 py-1 text-[10px] font-bold uppercase', statusTone].join(' ')}>
          {status}
        </span>
      </div>
      <h4 className="font-headline-sm text-headline-sm text-on-surface">
        {title}
      </h4>
      <p className="mb-4 text-body-sm text-on-surface-variant">
        {description}
      </p>
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-body-sm">
          <span className="font-data-mono">{amount} / {target}</span>
          <span className="font-bold text-on-surface">{progress}%</span>
        </div>
        <ProgressBar value={progress} tone={tone} />
      </div>
      <button
        type="button"
        className="mt-auto w-full rounded-lg border border-outline-variant py-2 font-semibold text-on-surface transition-colors hover:bg-surface-container"
      >
        Manage
      </button>
    </section>
  )
}

function SavingsGoalsSection() {
  return (
    <section>
      <h3 className="mb-4 font-headline-sm text-headline-sm text-on-surface">
        Active Savings Goals
      </h3>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SavingsGoalCard
          isPrimary
          amount="PHP 65,000"
          description="Primary safety net (12 months expenses)"
          icon="medical_services"
          progress={65}
          status="Stable"
          statusTone="bg-secondary-container text-on-secondary-container"
          target="PHP 100,000"
          title="Emergency Fund"
        />
        <SavingsGoalCard
          amount="PHP 8,400"
          description="Tokyo, Kyoto & Osaka 2024"
          icon="flight_takeoff"
          progress={70}
          status="Planning"
          target="PHP 12,000"
          title="Japan Trip"
          tone="secondary"
        />
        <SavingsGoalCard
          amount="PHP 42,000"
          description="New primary residence"
          icon="house"
          progress={28}
          status="Lagging"
          statusTone="bg-error-container text-error"
          target="PHP 150,000"
          title="Down Payment"
          tone="critical"
        />
        <SavingsGoalCard
          amount="PHP 25,000"
          description="Vehicle replacement fund"
          icon="directions_car"
          progress={41}
          status="Stable"
          statusTone="bg-secondary-container text-on-secondary-container"
          target="PHP 60,000"
          title="Next Vehicle"
        />
        <section className="flex min-h-48 cursor-default flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant p-6 text-on-surface-variant transition-all hover:border-primary hover:text-primary lg:col-span-4">
          <span className="material-symbols-outlined mb-2 text-3xl">add_circle</span>
          <span className="font-semibold">New Savings Goal</span>
        </section>
      </div>
    </section>
  )
}

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
    setEditingSavings,
    updateFilters,
  } = useSavings()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const savingsKpis = getSavingsKpis(savings, salaryCutoffs)

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Strategy"
        description="Allocating intelligence to long-term wealth assets."
        actions={
          <>
            <Button type="button" variant="gray" disabled>
              <span className="material-symbols-outlined text-lg">file_download</span>
              Export Ledger
            </Button>
            <Button type="button" onClick={() => setIsFormOpen(true)}>
              <span className="material-symbols-outlined text-lg">add</span>
              Add Savings
            </Button>
          </>
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
            label: '+1.2% from last month',
            tone: 'positive',
          }}
        />
        <StatCard
          label="Cutoff Savings"
          value={currencyFormatter.format(savingsKpis.currentCutoffSavings)}
          helperText="Active cutoff only"
          tone="success"
        />
        <StatCard
          label="Largest Fund"
          value={savingsKpis.largestSavingsType}
          helperText="By visible savings"
          tone="warning"
        />
        <StatCard
          label="Savings Records"
          value={savingsKpis.savingsRecords}
          helperText="Visible records"
          tone="neutral"
        />
      </KpiGrid>

      {error ? <ErrorState title="Unable to process savings" message={error} /> : null}

      <SavingsGoalsSection />

      <SectionCard
        title="Recent Savings Transfers"
        className="overflow-visible"
        actions={
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
        }
      >
        {isLoading ? (
          <LoadingState label="Loading savings" />
        ) : (
          <SavingsList
            savings={savings}
            onDelete={deleteSavings}
            onEdit={(savingsRecord) => {
              setEditingSavings(savingsRecord)
              setIsFormOpen(true)
            }}
          />
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
