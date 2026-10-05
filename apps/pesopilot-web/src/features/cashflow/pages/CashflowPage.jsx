import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { DismissiblePageHelper } from '@/components/guidance/DismissiblePageHelper.jsx'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { BudgetShockWarningCard } from '@/features/budget-shock/components/BudgetShockWarningCard.jsx'
import { useBudgetShock } from '@/features/budget-shock/hooks/useBudgetShock.js'
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

function ForecastProjectionCard({ forecast }) {
  if (!forecast) {
    return null
  }

  const isShortfall = forecast.projectedRemaining < 0

  return (
    <SectionCard
      title="Cutoff Cashflow Forecast"
      description={`Deterministic projection for ${forecast.cutoffName || 'Current Cutoff'} through ${forecast.endDate}`}
      className="lg:col-span-2"
      actions={
        <StatusBadge tone={isShortfall ? 'error' : 'success'}>
          {isShortfall ? 'Projected Shortfall' : 'Projected Surplus'}
        </StatusBadge>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded border border-outline-variant bg-surface p-4">
            <p className="text-label-caps font-label-caps uppercase text-on-surface-variant">
              Daily Burn Rate
            </p>
            <p className="mt-1 font-data-mono text-title-md font-semibold text-on-surface">
              {formatMoney(forecast.dailyBurnRate)}
              <span className="text-body-sm font-normal text-on-surface-variant">/day</span>
            </p>
            <p className="mt-1 text-body-xs text-on-surface-variant">
              Across {forecast.elapsedDays} elapsed {forecast.elapsedDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          <div className="rounded border border-outline-variant bg-surface p-4">
            <p className="text-label-caps font-label-caps uppercase text-on-surface-variant">
              Safe Daily Spend
            </p>
            <p className="mt-1 font-data-mono text-title-md font-semibold text-primary">
              {formatMoney(forecast.safeDailySpend)}
              <span className="text-body-sm font-normal text-on-surface-variant">/day</span>
            </p>
            <p className="mt-1 text-body-xs text-on-surface-variant">
              Across {forecast.remainingDays} remaining {forecast.remainingDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          <div className="rounded border border-outline-variant bg-surface p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-label-caps font-label-caps uppercase text-on-surface-variant">
              Projected Remaining
            </p>
            <p
              className={[
                'mt-1 font-data-mono text-title-md font-semibold',
                isShortfall ? 'text-error' : 'text-secondary',
              ].join(' ')}
            >
              {formatMoney(forecast.projectedRemaining)}
            </p>
            <p className="mt-1 text-body-xs text-on-surface-variant">
              {isShortfall
                ? `Shortfall of ${formatMoney(forecast.projectedDeficit)}`
                : 'Projected closing cash'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-on-surface-variant">
            <span>
              Cycle Timeline: <strong className="font-semibold text-on-surface">{forecast.startDate}</strong> to{' '}
              <strong className="font-semibold text-on-surface">{forecast.endDate}</strong>
            </span>
            <span>
              Progress: <strong className="font-semibold text-on-surface">{forecast.elapsedDays}</strong> of{' '}
              <strong className="font-semibold text-on-surface">{forecast.totalDays}</strong> days ({forecast.remainingDays} remaining)
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${forecast.totalDays > 0 ? Math.min(100, Math.round((forecast.elapsedDays / forecast.totalDays) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function ForecastExplanationCard({ explanation, forecast }) {
  if (!explanation) {
    return null
  }

  const isShortfall = (forecast?.projectedRemaining ?? 0) < 0

  return (
    <section className="flex flex-col rounded-xl border border-outline-variant bg-surface-container p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          <h3 className="font-headline-sm text-headline-sm">Forecast Explanation</h3>
        </div>
        <StatusBadge tone={isShortfall ? 'error' : 'info'}>
          {isShortfall ? 'Shortfall Projected' : 'On Track'}
        </StatusBadge>
      </div>

      <div className="flex-1 space-y-3">
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4">
          <p className="font-semibold text-on-surface text-body-sm">{explanation.headline}</p>
          <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">
            {explanation.summary}
          </p>
        </div>

        {explanation.details && explanation.details.length > 0 ? (
          <ul className="space-y-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3">
            {explanation.details.map((detail, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-body-xs leading-relaxed text-on-surface-variant"
              >
                <span className="material-symbols-outlined mt-0.5 text-xs text-primary">
                  check_circle
                </span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

function MetricPanel({
  icon,
  label,
  tone = 'primary',
  value,
  tag,
}) {
  const toneClasses = {
    critical: {
      bar: 'bg-error',
      tag: 'bg-error-container/30 text-error',
    },
    primary: {
      bar: 'bg-primary',
      tag: 'bg-primary-container/10 text-primary',
    },
    secondary: {
      bar: 'bg-secondary',
      tag: 'bg-secondary-container/30 text-secondary',
    },
  }[tone]

  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-label-caps font-label-caps uppercase text-on-surface-variant">
          {label}
        </span>
        <span className="material-symbols-outlined text-on-surface-variant/40">
          {icon}
        </span>
      </div>
      <div className="flex items-end gap-3">
        <span className="font-display-lg text-[28px] font-bold text-on-surface">
          {value}
        </span>
        <span className={['mb-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase', toneClasses.tag].join(' ')}>
          {tag}
        </span>
      </div>
      <div className="mt-4 flex gap-1">
        <div className={['h-1 flex-1 rounded-full', toneClasses.bar].join(' ')} />
        <div className={['h-1 flex-1 rounded-full', toneClasses.bar].join(' ')} />
        <div className="h-1 flex-1 rounded-full bg-surface-container" />
      </div>
    </section>
  )
}

function MetricsGrid({ cashflow }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <MetricPanel
        icon="shopping_cart"
        label="Expense Rate"
        value={formatPercent(cashflow.expenseRate)}
        tag="Current cutoff"
        tone="primary"
      />
      <MetricPanel
        icon="savings"
        label="Savings Rate"
        value={formatPercent(cashflow.savingsRate)}
        tag="Current cutoff"
        tone="secondary"
      />
      <MetricPanel
        icon="query_stats"
        label="Variance"
        value={formatMoney(cashflow.incomeVariance)}
        tag={getVarianceTone(cashflow.incomeVariance) === 'critical' ? 'Deficit Risk' : 'Stable'}
        tone={getVarianceTone(cashflow.incomeVariance) === 'critical' ? 'critical' : 'secondary'}
      />
    </div>
  )
}

function CurrentCutoffSummary({ cashflow, cashflowStatus }) {
  return (
    <SectionCard
      title="Current Cutoff Summary"
      actions={<StatusBadge tone={cashflowStatus.tone}>{cashflowStatus.label}</StatusBadge>}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {[
          ['Current Cutoff', cashflow.cutoffName, 'text-primary'],
          ['Expected Income', formatMoney(cashflow.expectedIncome), 'text-primary'],
          ['Actual Income', formatMoney(cashflow.actualIncome), 'text-secondary'],
          ['Expenses', formatMoney(cashflow.totalExpenses), 'text-error'],
          ['Savings', formatMoney(cashflow.totalSavings), 'text-secondary'],
          ['Remaining Cash', formatMoney(cashflow.remainingCash), getRemainingCashTone(cashflow) === 'critical' ? 'text-error' : 'text-secondary'],
        ].map(([label, value, valueClassName]) => (
          <div
            key={label}
            className="rounded border border-outline-variant bg-surface p-3"
          >
            <p className="text-label-caps font-label-caps uppercase text-on-surface-variant">
              {label}
            </p>
            <p className={['mt-1 font-data-mono text-body-sm font-semibold', valueClassName].join(' ')}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function RecentCashflowsPreview() {
  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
        <h3 className="font-headline-sm text-headline-sm">Recent Cashflows</h3>
        <Link
          to="/reports"
          className="flex items-center gap-1 text-body-sm font-semibold text-primary hover:underline"
        >
          View All
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
      <div className="p-6">
        <EmptyState
          title="Cashflow history preview is underway"
          message="Use Reports for historical analysis. This cashflow page currently focuses on the active cutoff summary."
        />
      </div>
    </section>
  )
}

export function CashflowPage() {
  const {
    cashflow,
    error,
    explanation,
    forecast,
    hasCurrentCutoff,
    isLoading,
  } = useCashflow()
  const { recommendation, risk } = useBudgetShock(cashflow?.cutoff?.id)
  const cashflowStatus = getCashflowStatus(cashflow?.remainingCash)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashflow Management"
        description="Analyze liquidity cycles and transactional velocity."
        actions={
          <span className="rounded bg-surface-container px-3 py-1 text-body-sm font-semibold text-on-surface-variant">
            Current Cutoff
          </span>
        }
      />

      <DismissiblePageHelper
        pageKey="cashflow"
        title={hasCurrentCutoff ? 'Current-cutoff cashflow' : 'Create a cutoff to enable cashflow'}
        message={
          hasCurrentCutoff
            ? 'Cashflow and forecast are calculated deterministically from current-cutoff income, expense, and savings records.'
            : 'Cashflow needs a current salary cutoff before it can summarize your funded cycle.'
        }
        action={
          hasCurrentCutoff ? null : (
            <Link to="/salary-cutoff" className="text-body-sm font-semibold text-primary hover:underline">
              Create Cutoff
            </Link>
          )
        }
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
              label="Expenses"
              value={formatMoney(cashflow.totalExpenses)}
              helperText="Expense records"
              tone="critical"
            />
            <StatCard
              label="Savings"
              value={formatMoney(cashflow.totalSavings)}
              helperText="Savings records"
              tone="success"
            />
            <StatCard
              label="Remaining Cash"
              value={formatMoney(cashflow.remainingCash)}
              helperText="Net cash"
              tone={getRemainingCashTone(cashflow)}
            />
          </KpiGrid>

          {forecast ? (
            <div className="space-y-6">
              {risk ? (
                <BudgetShockWarningCard
                  risk={risk}
                  forecast={forecast}
                  recommendation={recommendation}
                />
              ) : null}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <ForecastProjectionCard forecast={forecast} />
                <ForecastExplanationCard explanation={explanation} forecast={forecast} />
              </div>
            </div>
          ) : null}


          <MetricsGrid cashflow={cashflow} />

          <CurrentCutoffSummary
            cashflow={cashflow}
            cashflowStatus={cashflowStatus}
          />

          <RecentCashflowsPreview />
        </>
      ) : null}
    </div>
  )
}
