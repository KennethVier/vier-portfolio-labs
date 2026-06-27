import { useState } from 'react'
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
import { Modal } from '@/components/ui/Modal.jsx'

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

function FlowComparisonCard() {
  return (
    <SectionCard
      title="Flow Comparison"
      description="Inflow vs outflow velocity per cycle"
      className="lg:col-span-2"
    >
      <div className="flex min-h-64 items-center justify-center rounded border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
        <div>
          <span className="material-symbols-outlined text-3xl text-primary">
            stacked_line_chart
          </span>
          <p className="mt-2 font-semibold text-on-surface">
            Cycle comparison analytics are underway.
          </p>
          <p className="mt-1 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
            Future cashflow reports will compare inflow and outflow movement
            across cutoff periods. This MVP keeps cashflow totals read-only and
            current-cutoff based.
          </p>
        </div>
      </div>
    </SectionCard>
  )
}

function HealthStatusPanel({ cashflowStatus, onDeepDive }) {
  return (
    <section className="flex flex-col rounded-xl border border-outline-variant bg-surface-container p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">insights</span>
        <h3 className="font-headline-sm text-headline-sm">Health Status</h3>
      </div>

      <div className="flex-1 space-y-4">
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-caps font-label-caps">Liquidity Score</span>
            <StatusBadge tone={cashflowStatus.tone}>{cashflowStatus.label}</StatusBadge>
          </div>
          <p className="text-body-sm italic leading-relaxed text-on-surface-variant">
            Current cash position is evaluated from the active cutoff totals.
            Runway and projection details are still underway.
          </p>
        </div>

        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-caps font-label-caps">AI Commentary</span>
          </div>
          <p className="text-body-sm leading-relaxed text-on-surface-variant">
            AI commentary, forecasting, burn rate, and safe spend calculations
            are still underway. No generated cashflow recommendation is running
            in this MVP release.
          </p>
        </div>

        <div className="border-t border-outline-variant pt-4">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded bg-on-primary-fixed py-2 text-body-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant"
            onClick={onDeepDive}
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Deep Dive Report
          </button>
        </div>
      </div>
    </section>
  )
}

function AiUnderwayModal({ isOpen, onClose }) {
  return (
    <Modal
      title="AI Features Are Underway"
      description="Cashflow deep dives and AI-generated reports are planned for a future phase."
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <button
          type="button"
          className="rounded bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
          onClick={onClose}
        >
          Got it
        </button>
      }
    >
      <div className="space-y-3 text-body-sm text-on-surface-variant">
        <p>
          PesoPilot currently calculates cashflow from your local current-cutoff
          income, expense, and savings records.
        </p>
        <p>
          AI deep dives, forecasting, and report generation are not active in
          this MVP release.
        </p>
      </div>
    </Modal>
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
  const [isAiUnderwayOpen, setIsAiUnderwayOpen] = useState(false)
  const {
    cashflow,
    error,
    hasCurrentCutoff,
    isLoading,
  } = useCashflow()
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
            ? 'Cashflow is read-only and calculated from current-cutoff income, expense, and savings records.'
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <FlowComparisonCard />
            <HealthStatusPanel
              cashflowStatus={cashflowStatus}
              onDeepDive={() => setIsAiUnderwayOpen(true)}
            />
          </div>

          <MetricsGrid cashflow={cashflow} />

          <CurrentCutoffSummary
            cashflow={cashflow}
            cashflowStatus={cashflowStatus}
          />

          <RecentCashflowsPreview />

          <AiUnderwayModal
            isOpen={isAiUnderwayOpen}
            onClose={() => setIsAiUnderwayOpen(false)}
          />
        </>
      ) : null}
    </div>
  )
}
