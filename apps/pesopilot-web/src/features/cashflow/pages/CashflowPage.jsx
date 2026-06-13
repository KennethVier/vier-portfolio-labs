import {
  KpiGrid,
  MetricCard,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { useCashflow } from '../hooks/useCashflow.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

const percentFormatter = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'percent',
})

function formatMoney(value) {
  return currencyFormatter.format(value ?? 0)
}

function formatPercent(value) {
  return percentFormatter.format((value ?? 0) / 100)
}

function getRemainingCashTone(cashflow) {
  return (cashflow?.remainingCash ?? 0) < 0 ? 'critical' : 'success'
}

function getVarianceTone(value) {
  if ((value ?? 0) > 0) {
    return 'success'
  }

  if ((value ?? 0) < 0) {
    return 'critical'
  }

  return 'neutral'
}

function getCashflowStatus(remainingCash) {
  if ((remainingCash ?? 0) > 0) {
    return {
      label: 'Healthy',
      tone: 'success',
    }
  }

  if ((remainingCash ?? 0) < 0) {
    return {
      label: 'Critical',
      tone: 'critical',
    }
  }

  return {
    label: 'Neutral',
    tone: 'neutral',
  }
}

export function CashflowPage() {
  const {
    cashflow,
    error,
    hasCurrentCutoff,
    isLoading,
  } = useCashflow()
  const cashflowStatus = getCashflowStatus(cashflow?.remainingCash)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Current State"
        title="Cashflow"
        description="Current cutoff cashflow verification."
        meta={cashflow?.cutoffName ?? 'Read-only engine'}
      />

      {error ? <ErrorState title="Unable to load cashflow" message={error} /> : null}

      {isLoading ? <LoadingState label="Loading cashflow" /> : null}

      {!isLoading && !hasCurrentCutoff ? (
        <EmptyState
          title="No current cutoff"
          message="Create or activate a salary cutoff to verify current cashflow."
        />
      ) : null}

      {!isLoading && cashflow ? (
        <>
          <KpiGrid columns={5}>
            <StatCard
              label="Expected Income"
              value={formatMoney(cashflow.expectedIncome)}
              helperText="Current cutoff"
              tone="info"
            />
            <StatCard
              label="Actual Income"
              value={formatMoney(cashflow.actualIncome)}
              helperText="Income records"
              tone="success"
            />
            <StatCard
              label="Total Expenses"
              value={formatMoney(cashflow.totalExpenses)}
              helperText="Expense records"
              tone="critical"
            />
            <StatCard
              label="Total Savings"
              value={formatMoney(cashflow.totalSavings)}
              helperText="Savings records"
              tone="success"
            />
            <StatCard
              label="Remaining Cash"
              value={formatMoney(cashflow.remainingCash)}
              helperText="After expenses and savings"
              tone={getRemainingCashTone(cashflow)}
            />
          </KpiGrid>

          <SectionCard title="Financial Metrics">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard
                label="Expense Rate"
                value={formatPercent(cashflow.expenseRate)}
                tone="critical"
              />
              <MetricCard
                label="Savings Rate"
                value={formatPercent(cashflow.savingsRate)}
                tone="success"
              />
              <MetricCard
                label="Income Variance"
                value={formatMoney(cashflow.incomeVariance)}
                tone={getVarianceTone(cashflow.incomeVariance)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Current Cutoff Summary">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                align="left"
                label="Current Cutoff"
                value={cashflow.cutoffName}
                tone="info"
              />
              <MetricCard
                label="Expected Income"
                value={formatMoney(cashflow.expectedIncome)}
                tone="info"
              />
              <MetricCard
                label="Actual Income"
                value={formatMoney(cashflow.actualIncome)}
                tone="success"
              />
              <MetricCard
                label="Expenses"
                value={formatMoney(cashflow.totalExpenses)}
                tone="critical"
              />
              <MetricCard
                label="Savings"
                value={formatMoney(cashflow.totalSavings)}
                tone="success"
              />
              <MetricCard
                label="Remaining Cash"
                value={formatMoney(cashflow.remainingCash)}
                tone={getRemainingCashTone(cashflow)}
              />
            </div>

            <div className="mt-4 rounded border border-outline-variant bg-surface-container-lowest p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                    Status
                  </p>
                  <p className="mt-1 text-sm text-content-muted">
                    Current cutoff cash position
                  </p>
                </div>
                <StatusBadge tone={cashflowStatus.tone}>
                  {cashflowStatus.label}
                </StatusBadge>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  )
}
