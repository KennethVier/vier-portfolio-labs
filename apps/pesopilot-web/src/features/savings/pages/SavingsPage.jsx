import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

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

export function SavingsPage() {
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
  const savingsKpis = getSavingsKpis(savings, salaryCutoffs)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Money Set Aside"
        title="Savings"
        description="Track savings set aside before cashflow calculations begin."
        meta={`${savingsKpis.savingsRecords} visible records`}
      />

      <KpiGrid columns={4}>
        <StatCard
          label="Total Savings"
          value={currencyFormatter.format(savingsKpis.totalSavings)}
          helperText="Visible filtered savings"
          tone="success"
        />
        <StatCard
          label="Current Cutoff Savings"
          value={currencyFormatter.format(savingsKpis.currentCutoffSavings)}
          helperText="Active cutoff only"
          tone="info"
        />
        <StatCard
          label="Largest Savings Type"
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

      <SavingsForm
        editingSavings={editingSavings}
        isSaving={isSaving}
        salaryCutoffs={salaryCutoffs}
        onCancel={clearEditingSavings}
        onSubmit={saveSavings}
      />

      <SectionCard title="Filters">
        <SavingsFilters
          filters={filters}
          framed={false}
          salaryCutoffs={salaryCutoffs}
          onChange={updateFilters}
        />
      </SectionCard>

      <SectionCard title="Savings Records">
        {isLoading ? (
          <LoadingState label="Loading savings" />
        ) : (
          <SavingsList
            savings={savings}
            onDelete={deleteSavings}
            onEdit={setEditingSavings}
          />
        )}
      </SectionCard>
    </div>
  )
}
