import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { KpiGrid, PageHeader, SectionCard, StatCard } from '@/components/dashboard'
import { DismissiblePageHelper } from '@/components/guidance/DismissiblePageHelper.jsx'
import { useHeader } from '@/components/layout/headerContext.js'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { useReports } from '../hooks/useReports.js'
import {
  padSinglePointCashflowTrend,
  padSinglePointSavingsTrend,
  REPORT_SCOPES,
} from '../utils/reportTransforms.js'

const REPORT_SCOPE_STORAGE_KEY = 'pesopilot:reports:scope'
const REPORT_CUTOFF_STORAGE_KEY = 'pesopilot:reports:selected-cutoff-id'

const reportScopeOptions = [
  { label: 'All Data', value: REPORT_SCOPES.all },
  { label: 'Current Cutoff', value: REPORT_SCOPES.currentCutoff },
  { label: 'Specific Cutoff', value: REPORT_SCOPES.specificCutoff },
]

const chartColors = {
  error: 'var(--color-error)',
  outline: 'var(--color-outline-variant)',
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
}

const pieColors = [
  '#004ac6',
  '#006c49',
  '#784b00',
  '#ba1a1a',
  '#2563eb',
  '#4edea3',
]

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(value) {
  return currencyFormatter.format(value ?? 0)
}

function formatTooltipValue(value, name) {
  return [formatMoney(value), name]
}

function getStoredReportScope() {
  if (typeof window === 'undefined') {
    return REPORT_SCOPES.all
  }

  const storedScope = window.sessionStorage.getItem(REPORT_SCOPE_STORAGE_KEY)

  return reportScopeOptions.some((option) => option.value === storedScope)
    ? storedScope
    : REPORT_SCOPES.all
}

function getStoredCutoffId() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.sessionStorage.getItem(REPORT_CUTOFF_STORAGE_KEY) ?? ''
}

function formatCutoffOption(cutoff) {
  return `${cutoff.name} — ${cutoff.startDate} to ${cutoff.endDate}`
}

function ChartFrame({ children, emptyMessage, hasData }) {
  if (!hasData) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <div className="w-full min-w-[1px]">
      {children}
    </div>
  )
}

function ResponsiveChartContainer({ children }) {
  return (
    <ResponsiveContainer width="100%" height={288} minWidth={1}>
      {children}
    </ResponsiveContainer>
  )
}

function ExpenseTrendChart({ data }) {
  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No expenses available for trend reporting."
    >
      <ResponsiveChartContainer>
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={formatTooltipValue} />
          <Bar dataKey="expenses" fill={chartColors.error} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveChartContainer>
    </ChartFrame>
  )
}

function IncomeExpenseChart({ data }) {
  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No income or expenses available for comparison."
    >
      <ResponsiveChartContainer>
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
          <Bar dataKey="income" fill={chartColors.secondary} radius={[2, 2, 0, 0]} />
          <Bar dataKey="expenses" fill={chartColors.error} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveChartContainer>
    </ChartFrame>
  )
}

function CategoryBreakdownChart({ data }) {
  if (data.length === 0) {
    return <EmptyState title="No category expense data available." />
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(13rem,0.85fr)] lg:items-center">
      <div className="w-full min-w-[1px]">
        <ResponsiveChartContainer>
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={data}
              dataKey="value"
              innerRadius={52}
              isAnimationActive={false}
              nameKey="name"
              outerRadius={92}
              paddingAngle={2}
              stroke="var(--color-surface-container-lowest)"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={pieColors[index % pieColors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltipValue} />
          </PieChart>
        </ResponsiveChartContainer>
      </div>

      <div className="space-y-2 border-t border-outline-variant pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        {data.map((category, index) => (
          <div
            key={category.name}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-body-sm"
          >
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: pieColors[index % pieColors.length] }}
              aria-hidden="true"
            />
            <span className="truncate font-medium text-on-surface">
              {category.name}
            </span>
            <span className="font-data-mono text-on-surface">
              {category.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SavingsTrendChart({ data }) {
  const chartData = padSinglePointSavingsTrend(data)

  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No savings history available."
    >
      <ResponsiveChartContainer>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={formatTooltipValue} />
          <Line
            type="monotone"
            dataKey="savings"
            stroke={chartColors.secondary}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveChartContainer>
    </ChartFrame>
  )
}

function CashflowTrendChart({ data }) {
  const chartData = padSinglePointCashflowTrend(data)

  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No cashflow data available."
    >
      <ResponsiveChartContainer>
        <LineChart data={chartData}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={formatTooltipValue} />
          <Line
            type="monotone"
            dataKey="cashflow"
            stroke={chartColors.primary}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveChartContainer>
    </ChartFrame>
  )
}

function CutoffComparisonTable({ data, emptyMessage }) {
  if (data.length === 0) {
    return <EmptyState title={emptyMessage ?? 'No cutoff data available for comparison.'} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-body-sm">
        <thead className="bg-surface-container">
          <tr className="border-b border-outline-variant">
            <th className="px-3 py-2 font-label-caps text-label-caps text-on-surface-variant">
              Cutoff
            </th>
            <th className="px-3 py-2 text-right font-label-caps text-label-caps text-on-surface-variant">
              Expected
            </th>
            <th className="px-3 py-2 text-right font-label-caps text-label-caps text-on-surface-variant">
              Actual
            </th>
            <th className="px-3 py-2 text-right font-label-caps text-label-caps text-on-surface-variant">
              Expenses
            </th>
            <th className="px-3 py-2 text-right font-label-caps text-label-caps text-on-surface-variant">
              Savings
            </th>
            <th className="px-3 py-2 text-right font-label-caps text-label-caps text-on-surface-variant">
              Remaining
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {data.map((cutoff) => (
            <tr
              key={cutoff.cutoffId}
              className={[
                'hover:bg-surface-container-low',
                cutoff.isHighlighted ? 'bg-primary-fixed/70' : '',
              ].join(' ')}
            >
              <td className="px-3 py-2 font-semibold text-on-surface">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{cutoff.name}</span>
                  {cutoff.isHighlighted ? (
                    <span className="rounded border border-primary/30 bg-primary-fixed px-2 py-0.5 font-label-caps text-label-caps text-primary">
                      Selected
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-3 py-2 text-right font-data-mono">
                {formatMoney(cutoff.expectedIncome)}
              </td>
              <td className="px-3 py-2 text-right font-data-mono text-secondary">
                {formatMoney(cutoff.actualIncome)}
              </td>
              <td className="px-3 py-2 text-right font-data-mono">
                {formatMoney(cutoff.totalExpenses)}
              </td>
              <td className="px-3 py-2 text-right font-data-mono">
                {formatMoney(cutoff.totalSavings)}
              </td>
              <td className="px-3 py-2 text-right">
                <span className="font-data-mono">
                  {formatMoney(cutoff.remainingCash)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReportsPage() {
  const [reportScope, setReportScope] = useState(getStoredReportScope)
  const [selectedCutoffId, setSelectedCutoffId] = useState(getStoredCutoffId)
  const reportOptions = useMemo(
    () => ({
      scope: reportScope,
      selectedCutoffId:
        reportScope === REPORT_SCOPES.specificCutoff ? selectedCutoffId : null,
    }),
    [reportScope, selectedCutoffId],
  )
  const { data, error, isLoading } = useReports(reportOptions)
  const { resetHeaderConfig, setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  function handleScopeChange(nextScope) {
    setReportScope(nextScope)
    window.sessionStorage.setItem(REPORT_SCOPE_STORAGE_KEY, nextScope)

    if (nextScope !== REPORT_SCOPES.specificCutoff) {
      setSelectedCutoffId('')
      window.sessionStorage.removeItem(REPORT_CUTOFF_STORAGE_KEY)
    }
  }

  function handleCutoffChange(nextCutoffId) {
    setSelectedCutoffId(nextCutoffId)

    if (nextCutoffId) {
      window.sessionStorage.setItem(REPORT_CUTOFF_STORAGE_KEY, nextCutoffId)
    } else {
      window.sessionStorage.removeItem(REPORT_CUTOFF_STORAGE_KEY)
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading reports" />
  }

  if (error) {
    return <ErrorState title="Unable to load reports" message={error} />
  }

  const {
    datasets,
    kpis,
    meta,
    records,
  } = data
  const hasAnyRecords =
    records.scoped.expenses.length > 0 ||
    records.scoped.income.length > 0 ||
    records.scoped.savings.length > 0 ||
    datasets.cutoffComparison.length > 0
  const isSpecificCutoffScope = reportScope === REPORT_SCOPES.specificCutoff

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports and Graphs"
        description="Analyze income, expenses, savings, cashflow, and cutoffs across your financial history."
      />

      <SectionCard
        title="Report Scope"
        description="Reports are historical by default. Narrow them to the current or selected salary cutoff when needed."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-2 sm:grid-cols-3">
            {reportScopeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={[
                  'rounded border px-3 py-2 text-left text-body-sm font-semibold transition-colors',
                  reportScope === option.value
                    ? 'border-primary bg-primary-fixed text-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary',
                ].join(' ')}
                onClick={() => handleScopeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {isSpecificCutoffScope ? (
            <label className="grid gap-1 md:min-w-80">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Select Cutoff
              </span>
              <select
                className="min-h-9 rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={selectedCutoffId}
                onChange={(event) => handleCutoffChange(event.target.value)}
              >
                <option value="">Choose a cutoff</option>
                {records.cutoffs.map((cutoff) => (
                  <option key={cutoff.id} value={cutoff.id}>
                    {formatCutoffOption(cutoff)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </SectionCard>

      <DismissiblePageHelper
        pageKey="reports"
        title={hasAnyRecords ? 'Analyze cutoff periods' : 'Start building report data'}
        message={
          hasAnyRecords
            ? 'Use the scope selector to analyze all history, the current cutoff, or one selected cutoff.'
            : 'Start recording income and expenses to generate meaningful report charts.'
        }
      />

      {!hasAnyRecords ? (
        <EmptyState
          title="No report data yet"
          message={meta.emptyMessage}
        />
      ) : null}

      <KpiGrid columns={4}>
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">trending_up</span>}
          label="Total Income"
          tone="success"
          value={formatMoney(kpis.totalIncome)}
        />
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">receipt_long</span>}
          label="Total Expenses"
          tone="critical"
          value={formatMoney(kpis.totalExpenses)}
        />
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">swap_calls</span>}
          label="Net Cashflow"
          tone={kpis.netCashflow >= 0 ? 'info' : 'critical'}
          value={formatMoney(kpis.netCashflow)}
        />
        <StatCard
          icon={<span className="material-symbols-outlined text-lg">savings</span>}
          label="Total Savings"
          tone="success"
          value={formatMoney(kpis.totalSavings)}
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Expense Trend" description="Monthly expense totals.">
          <ExpenseTrendChart data={datasets.expenseTrend} />
        </SectionCard>

        <SectionCard
          title="Income vs Expense"
          description="Monthly income and expense comparison."
        >
          <IncomeExpenseChart data={datasets.incomeExpenseComparison} />
        </SectionCard>

        <SectionCard
          title="Category Breakdown"
          description="Expense distribution by category."
        >
          <CategoryBreakdownChart data={datasets.categoryBreakdown} />
        </SectionCard>

        <SectionCard title="Savings Trend" description="Running savings total.">
          <SavingsTrendChart data={datasets.savingsTrend} />
        </SectionCard>

        <SectionCard
          title="Cashflow Trend"
          description="Monthly net cashflow after expenses and savings."
        >
          <CashflowTrendChart data={datasets.cashflowTrend} />
        </SectionCard>

        <SectionCard
          title="Cutoff Comparison"
          description="Cutoff-level actual income, spending, savings, and remaining cash."
        >
          <CutoffComparisonTable
            data={datasets.cutoffComparison}
            emptyMessage={meta.emptyMessage}
          />
        </SectionCard>
      </div>
    </div>
  )
}
