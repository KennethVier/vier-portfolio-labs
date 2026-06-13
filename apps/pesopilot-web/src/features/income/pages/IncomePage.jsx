import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { IncomeFilters } from '../components/IncomeFilters.jsx'
import { IncomeForm } from '../components/IncomeForm.jsx'
import { IncomeList } from '../components/IncomeList.jsx'
import { useIncome } from '../hooks/useIncome.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function getIncomeKpis(income) {
  return income.reduce(
    (kpis, incomeRecord) => {
      const amount = Number(incomeRecord.amount) || 0

      if (incomeRecord.source === 'Salary') {
        kpis.salaryIncome += amount
      } else {
        kpis.otherIncome += amount
      }

      kpis.totalIncome += amount
      kpis.incomeRecords += 1

      return kpis
    },
    {
      incomeRecords: 0,
      otherIncome: 0,
      salaryIncome: 0,
      totalIncome: 0,
    },
  )
}

export function IncomePage() {
  const {
    clearEditingIncome,
    deleteIncome,
    editingIncome,
    error,
    filters,
    income,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveIncome,
    setEditingIncome,
    updateFilters,
  } = useIncome()
  const incomeKpis = getIncomeKpis(income)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Money In"
        title="Income"
        description="Track money entering your control before dashboard calculations begin."
        meta={`${incomeKpis.incomeRecords} visible records`}
      />

      <KpiGrid columns={4}>
        <StatCard
          label="Total Income"
          value={currencyFormatter.format(incomeKpis.totalIncome)}
          helperText="Visible filtered income"
          tone="success"
        />
        <StatCard
          label="Salary Income"
          value={currencyFormatter.format(incomeKpis.salaryIncome)}
          helperText="Salary source only"
          tone="info"
        />
        <StatCard
          label="Other Income"
          value={currencyFormatter.format(incomeKpis.otherIncome)}
          helperText="Non-salary sources"
          tone="neutral"
        />
        <StatCard
          label="Income Records"
          value={incomeKpis.incomeRecords}
          helperText="Visible records"
          tone="warning"
        />
      </KpiGrid>

      {error ? <ErrorState title="Unable to process income" message={error} /> : null}

      <IncomeForm
        editingIncome={editingIncome}
        isSaving={isSaving}
        salaryCutoffs={salaryCutoffs}
        onCancel={clearEditingIncome}
        onSubmit={saveIncome}
      />

      <SectionCard title="Filters">
        <IncomeFilters
          filters={filters}
          framed={false}
          salaryCutoffs={salaryCutoffs}
          onChange={updateFilters}
        />
      </SectionCard>

      <SectionCard title="Income Records">
        {isLoading ? (
          <LoadingState label="Loading income" />
        ) : (
          <IncomeList
            income={income}
            onDelete={deleteIncome}
            onEdit={setEditingIncome}
          />
        )}
      </SectionCard>
    </div>
  )
}
