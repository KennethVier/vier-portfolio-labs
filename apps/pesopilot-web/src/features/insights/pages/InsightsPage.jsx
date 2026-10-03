import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { useInsights } from '../hooks/useInsights.js'
import {
  filterSummarySectionsByHorizon,
  formatGeneratedAt,
  formatMoney,
  formatPercent,
  getHorizonCoverageNotice,
  mapHealthStatusToTone,
  mapSeverityToTone,
} from '../utils/insightsViewTransforms.js'

const horizonOptions = [
  { label: 'All Horizons', value: 'all' },
  { label: 'Current Cutoff', value: 'current' },
  { label: 'Monthly Comparison', value: 'monthly' },
  { label: 'Historical Trend', value: 'historical' },
]

export function InsightsPage() {
  const [selectedHorizon, setSelectedHorizon] = useState('all')
  const { error, insights, loading } = useInsights()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
      statusSize: 'lg',
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  if (loading || !insights) {
    return <LoadingState label="Loading financial insights" />
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load insights"
        message={error?.message ?? 'Unable to load financial insights.'}
      />
    )
  }

  const currentCutoff = insights.cutoff?.metrics?.currentCutoff
  const isSummaryEmpty = insights.summary?.diagnostics?.state === 'empty'
  const coverage = insights.summary?.diagnostics?.coverage
  const recommendations = Array.isArray(insights.recommendations)
    ? insights.recommendations
    : []

  if (!currentCutoff) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="FINANCIAL INTELLIGENCE"
          title="Financial Insights"
          description="Deterministic financial health, horizon comparisons, and priority recommendations for your active cutoff."
          meta={
            insights.generatedAt
              ? `Generated ${formatGeneratedAt(insights.generatedAt)}`
              : null
          }
          actions={
            <Link
              to="/reports"
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">bar_chart</span>
              View Reports
            </Link>
          }
        />

        <EmptyState
          title="No Active Salary Cutoff"
          message="PesoPilot needs an active salary cutoff before insights can evaluate current-cycle performance."
          action={
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/salary-cutoff"
                className="rounded bg-primary px-3 py-1.5 text-body-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                Create Cutoff
              </Link>
              <Link
                to="/reports"
                className="text-body-sm font-semibold text-primary hover:underline"
              >
                View Historical Reports
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  // 1. Current Cutoff Overview KPI values (Correction 9: strict no-data semantics)
  const cashflowPosition = insights.cashflow?.metrics?.position
  const remainingCashValue =
    cashflowPosition && cashflowPosition !== 'No Data'
      ? formatMoney(insights.cashflow?.metrics?.remainingCash)
      : '--'
  const remainingCashHelper =
    cashflowPosition && cashflowPosition !== 'No Data'
      ? `Position: ${cashflowPosition}`
      : 'No data'

  const spendingPaceStatus = insights.cashflow?.metrics?.spendingPace?.status
  const spendingPaceValue =
    spendingPaceStatus && spendingPaceStatus !== 'No Data'
      ? spendingPaceStatus
      : '--'
  const spendingPaceHelper =
    spendingPaceStatus && spendingPaceStatus !== 'No Data'
      ? `Daily rate: ${formatMoney(insights.cashflow?.metrics?.spendingPace?.dailySpendingRate)}`
      : 'No pace data'

  const savingsRateStatus = insights.savings?.metrics?.savingsRate?.status
  const savingsRateValue =
    savingsRateStatus && savingsRateStatus !== 'No Data'
      ? formatPercent(insights.savings?.metrics?.savingsRate?.rate)
      : '--'
  const savingsRateHelper =
    savingsRateStatus && savingsRateStatus !== 'No Data'
      ? `Status: ${savingsRateStatus}`
      : 'No savings data'

  const activeGoalCount = insights.goals?.metrics?.activeGoals
  const hasGoalsBaseline =
    typeof activeGoalCount === 'number' && activeGoalCount > 0
  const goalProgressValue = hasGoalsBaseline
    ? formatPercent(insights.goals?.metrics?.overallCompletionRate)
    : '--'
  const goalProgressHelper = hasGoalsBaseline
    ? `${activeGoalCount} active goal(s)`
    : 'No active goals'

  // Summary sections & horizon filtering (Correction 7 & 8)
  const filteredSummarySections = filterSummarySectionsByHorizon(
    insights.summary?.sections,
    selectedHorizon,
  )
  const horizonCoverageNotice = getHorizonCoverageNotice(
    selectedHorizon,
    coverage,
  )

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="FINANCIAL INTELLIGENCE"
        title="Financial Insights"
        description="Deterministic financial health, horizon comparisons, and priority recommendations for your active cutoff."
        meta={
          insights.generatedAt
            ? `Generated ${formatGeneratedAt(insights.generatedAt)}`
            : null
        }
        actions={
          <Link
            to="/reports"
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">bar_chart</span>
            View Reports
          </Link>
        }
      />

      {/* 2. Current Cutoff Overview & Health Banner */}
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Active Cutoff Cycle
            </span>
            <h2 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
              {currentCutoff.name ?? 'Current Salary Cutoff'}
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              {currentCutoff.startDate} to {currentCutoff.endDate}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <div className="text-right">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Financial Health
              </span>
              <div className="font-data-mono text-2xl font-bold text-on-surface">
                {insights.health?.score != null ? insights.health.score : '--'}
              </div>
            </div>
            <StatusBadge
              tone={mapHealthStatusToTone(insights.health?.status)}
              className="text-xs"
            >
              {insights.health?.status ?? 'No Data'}
            </StatusBadge>
          </div>
        </div>

        {insights.health?.explanation ? (
          <p className="mt-4 border-t border-outline-variant pt-3 font-body-md text-on-surface">
            {insights.health.explanation}
          </p>
        ) : null}
      </section>

      {/* 3. Core Current-Cutoff KPI Bar */}
      <KpiGrid columns={4}>
        <StatCard
          label="Remaining Cash"
          value={remainingCashValue}
          helperText={remainingCashHelper}
          tone="neutral"
          icon={<span className="material-symbols-outlined text-lg">account_balance_wallet</span>}
        />
        <StatCard
          label="Spending Pace"
          value={spendingPaceValue}
          helperText={spendingPaceHelper}
          tone="neutral"
          icon={<span className="material-symbols-outlined text-lg">speed</span>}
        />
        <StatCard
          label="Savings Rate"
          value={savingsRateValue}
          helperText={savingsRateHelper}
          tone="neutral"
          icon={<span className="material-symbols-outlined text-lg">savings</span>}
        />
        <StatCard
          label="Goal Progress"
          value={goalProgressValue}
          helperText={goalProgressHelper}
          tone="neutral"
          icon={<span className="material-symbols-outlined text-lg">flag</span>}
        />
      </KpiGrid>

      {/* 4. Horizon Selector & Deterministic Financial Summary */}
      <SectionCard
        title="Financial Summary by Horizon"
        description="Filter deterministic narrative insights across current-cycle, monthly comparison, and historical horizons."
        actions={
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Summary Horizons">
            {horizonOptions.map((option) => {
              const isSelected = selectedHorizon === option.value
              const isAvailable =
                option.value === 'all' || coverage?.[option.value] === 'available'

              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedHorizon(option.value)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-body-sm font-semibold transition-colors',
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                  ].join(' ')}
                >
                  <span>{option.label}</span>
                  {option.value !== 'all' ? (
                    <span
                      className={[
                        'h-1.5 w-1.5 rounded-full',
                        isAvailable ? 'bg-secondary' : 'bg-outline',
                      ].join(' ')}
                      title={isAvailable ? 'Data Available' : 'Insufficient Comparison History'}
                    />
                  ) : null}
                </button>
              )
            })}
          </div>
        }
      >
        {isSummaryEmpty ? (
          <EmptyState
            title="Insufficient Financial Data"
            message="Not enough financial information is currently available to generate a financial summary for this cutoff."
          />
        ) : horizonCoverageNotice ? (
          <div className="rounded border border-outline-variant bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
            {horizonCoverageNotice}
          </div>
        ) : filteredSummarySections.length === 0 ? (
          <div className="rounded border border-outline-variant bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
            No summary narrative available for this horizon.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSummarySections.map((section) => (
              <div
                key={section.type || section.title}
                className="rounded border border-outline-variant bg-surface-container-lowest p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    {section.title}
                  </h3>
                  <span className="font-data-mono text-xs uppercase text-on-surface-variant">
                    {section.paragraphs?.length ?? 0} observation(s)
                  </span>
                </div>

                <div className="divide-y divide-outline-variant/60">
                  {section.paragraphs?.map((paragraph) => (
                    <div
                      key={paragraph.key || paragraph.text}
                      className="py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          {paragraph.horizon}
                        </span>
                      </div>
                      <p className="font-body-md text-on-surface leading-relaxed">
                        {paragraph.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 5. Priority Recommendations (Correction 4, 5, 6) */}
      <SectionCard
        title="Priority Recommendations"
        description="Deterministic action sequence generated for your active cutoff cycle."
      >
        {recommendations.length === 0 ? (
          <div className="rounded border border-outline-variant bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
            No priority recommendations available for this cutoff.
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const hasEvidence =
                Array.isArray(rec.evidence) && rec.evidence.length > 0
              const hasRules =
                Array.isArray(rec.sourceRuleIds) && rec.sourceRuleIds.length > 0
              const hasTransparencyDetails = hasEvidence || hasRules

              return (
                <div
                  key={rec.id || `rec-${index}`}
                  className="rounded border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-outline"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-primary-container px-2 py-0.5 font-data-mono text-xs font-bold text-on-primary-container">
                        #{rec.rank ?? index + 1}
                      </span>
                      <h3 className="font-body-md text-body-md font-semibold text-on-surface">
                        {rec.title}
                      </h3>
                      {rec.domain ? (
                        <span className="rounded bg-surface-container px-2 py-0.5 text-xs uppercase font-medium text-on-surface-variant">
                          {rec.domain}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rec.priority ? (
                        <span className="text-xs uppercase font-semibold text-on-surface-variant">
                          {rec.priority}
                        </span>
                      ) : null}
                      {rec.severity ? (
                        <StatusBadge tone={mapSeverityToTone(rec.severity)}>
                          {rec.severity}
                        </StatusBadge>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-2 font-body-md text-on-surface leading-relaxed">
                    {rec.explanation}
                  </p>

                  {/* Recommendation Transparency (Correction 5) */}
                  {hasTransparencyDetails ? (
                    <details className="mt-3 rounded border border-outline-variant bg-surface-container-low p-3 text-body-sm">
                      <summary className="cursor-pointer font-semibold text-primary select-none hover:underline">
                        Why this recommendation?
                      </summary>
                      <div className="mt-2 space-y-2 border-t border-outline-variant/60 pt-2 text-on-surface-variant">
                        {hasEvidence ? (
                          <div>
                            <span className="font-semibold text-on-surface">
                              Evidence:
                            </span>
                            <ul className="mt-1 list-inside list-disc space-y-1">
                              {rec.evidence.map((item, evIndex) => (
                                <li key={`${item.label}-${evIndex}`}>
                                  <span className="font-medium text-on-surface">
                                    {item.label}:
                                  </span>{' '}
                                  <span className="font-data-mono">
                                    {String(item.value)}
                                  </span>
                                  {item.description ? ` (${item.description})` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {hasRules ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-on-surface">
                              Related rules:
                            </span>
                            {rec.sourceRuleIds.map((ruleId) => (
                              <code
                                key={ruleId}
                                className="rounded bg-surface-container-high px-1.5 py-0.5 text-xs font-data-mono text-on-surface"
                              >
                                {ruleId}
                              </code>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* 6. Domain Insight Deep Dive (Correction 12 & 13) */}
      <SectionCard
        title="Domain Intelligence Deep Dive"
        description="Comprehensive evaluations across cashflow, income, spending, savings, goals, and multi-cutoff trends."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Cashflow */}
          <div className="flex flex-col justify-between rounded border border-outline-variant bg-surface-container-lowest p-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Cashflow
                </span>
                <span className="material-symbols-outlined text-primary text-base">
                  swap_calls
                </span>
              </div>
              <p className="mt-2 font-body-sm text-on-surface">
                {insights.cashflow?.explanation || 'No cashflow evaluation.'}
              </p>
            </div>
            <div className="mt-3 border-t border-outline-variant/60 pt-2 text-xs text-on-surface-variant">
              <div>Position: <span className="font-semibold text-on-surface">{insights.cashflow?.metrics?.position ?? '--'}</span></div>
              <div>Income Coverage: <span className="font-semibold text-on-surface">{insights.cashflow?.metrics?.incomeCoverage?.status ?? '--'}</span></div>
              <div>Stability: <span className="font-semibold text-on-surface">{insights.cashflow?.metrics?.stability?.status ?? '--'}</span></div>
            </div>
          </div>

          {/* Income */}
          <div className="flex flex-col justify-between rounded border border-outline-variant bg-surface-container-lowest p-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Income
                </span>
                <span className="material-symbols-outlined text-primary text-base">
                  account_balance_wallet
                </span>
              </div>
              <p className="mt-2 font-body-sm text-on-surface">
                {insights.income?.explanation || 'No income evaluation.'}
              </p>
            </div>
            <div className="mt-3 border-t border-outline-variant/60 pt-2 text-xs text-on-surface-variant">
              <div>Stability: <span className="font-semibold text-on-surface">{insights.income?.metrics?.stability?.status ?? '--'}</span></div>
              <div>Missing Income: <span className="font-semibold text-on-surface">{insights.income?.metrics?.missingIncome?.missing ? 'Shortfall detected' : 'None'}</span></div>
              <div>Primary Source: <span className="font-semibold text-on-surface">{insights.income?.metrics?.primarySource?.source ?? 'None'}</span></div>
            </div>
          </div>

          {/* Expenses */}
          <div className="flex flex-col justify-between rounded border border-outline-variant bg-surface-container-lowest p-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Expenses
                </span>
                <span className="material-symbols-outlined text-primary text-base">
                  payments
                </span>
              </div>
              <p className="mt-2 font-body-sm text-on-surface">
                {insights.expenses?.explanation || 'No expense evaluation.'}
              </p>
            </div>
            <div className="mt-3 border-t border-outline-variant/60 pt-2 text-xs text-on-surface-variant">
              <div>Top Category: <span className="font-semibold text-on-surface">{insights.expenses?.metrics?.topSpendingCategory?.categoryName ?? 'None'}</span></div>
              <div>Transactions: <span className="font-semibold text-on-surface">{insights.expenses?.metrics?.expenseCount ?? 0}</span></div>
            </div>
          </div>

          {/* Savings */}
          <div className="flex flex-col justify-between rounded border border-outline-variant bg-surface-container-lowest p-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Savings
                </span>
                <span className="material-symbols-outlined text-primary text-base">
                  savings
                </span>
              </div>
              <p className="mt-2 font-body-sm text-on-surface">
                {insights.savings?.explanation || 'No savings evaluation.'}
              </p>
            </div>
            <div className="mt-3 border-t border-outline-variant/60 pt-2 text-xs text-on-surface-variant">
              <div>Rate Status: <span className="font-semibold text-on-surface">{insights.savings?.metrics?.savingsRate?.status ?? '--'}</span></div>
              <div>Consistency: <span className="font-semibold text-on-surface">{insights.savings?.metrics?.consistency?.status ?? '--'}</span></div>
            </div>
          </div>

          {/* Goals */}
          <div className="flex flex-col justify-between rounded border border-outline-variant bg-surface-container-lowest p-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Goals
                </span>
                <span className="material-symbols-outlined text-primary text-base">
                  flag
                </span>
              </div>
              <p className="mt-2 font-body-sm text-on-surface">
                {insights.goals?.explanation || 'No goals evaluation.'}
              </p>
            </div>
            <div className="mt-3 border-t border-outline-variant/60 pt-2 text-xs text-on-surface-variant">
              <div>Active Goals: <span className="font-semibold text-on-surface">{insights.goals?.metrics?.activeGoals ?? 0}</span></div>
              <div>Completed Goals: <span className="font-semibold text-on-surface">{insights.goals?.metrics?.completedGoals ?? 0}</span></div>
            </div>
          </div>

          {/* Cutoff Performance */}
          <div className="flex flex-col justify-between rounded border border-outline-variant bg-surface-container-lowest p-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Cutoff Performance
                </span>
                <span className="material-symbols-outlined text-primary text-base">
                  event_busy
                </span>
              </div>
              <p className="mt-2 font-body-sm text-on-surface">
                {insights.cutoff?.explanation || 'No cutoff performance evaluation.'}
              </p>
            </div>
            <div className="mt-3 border-t border-outline-variant/60 pt-2 text-xs text-on-surface-variant">
              <div>Trend: <span className="font-semibold text-on-surface">{insights.cutoff?.metrics?.trend?.direction ?? '--'}</span></div>
              <div>Previous Cutoff: <span className="font-semibold text-on-surface">{insights.cutoff?.metrics?.previousCutoff ? insights.cutoff.metrics.previousCutoff.cutoffName : 'None'}</span></div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
