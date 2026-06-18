import { useEffect } from 'react'
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

import { KpiGrid, PageHeader, SectionCard, StatCard, StatusBadge } from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { useReports } from '../hooks/useReports.js'

const chartColors = {
  error: 'var(--color-error)',
  outline: 'var(--color-outline-variant)',
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
}

const pieColors = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.tertiary,
  chartColors.error,
  'var(--color-primary-container)',
  'var(--color-secondary-fixed-dim)',
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

function ChartFrame({ children, emptyMessage, hasData }) {
  if (!hasData) {
    return <EmptyState title={emptyMessage} />
  }

  return (
    <div className="h-72 min-w-0">
      {children}
    </div>
  )
}

function ExpenseTrendChart({ data }) {
  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No expenses available for trend reporting."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={formatTooltipValue} />
          <Bar dataKey="expenses" fill={chartColors.error} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

function IncomeExpenseChart({ data }) {
  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No income or expenses available for comparison."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
          <Bar dataKey="income" fill={chartColors.secondary} radius={[2, 2, 0, 0]} />
          <Bar dataKey="expenses" fill={chartColors.error} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

function CategoryBreakdownChart({ data }) {
  if (data.length === 0) {
    return <EmptyState title="No category expense data available." />
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(13rem,0.85fr)] lg:items-center">
      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={52}
              nameKey="name"
              outerRadius={92}
              paddingAngle={2}
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
        </ResponsiveContainer>
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
  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No savings history available."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
      </ResponsiveContainer>
    </ChartFrame>
  )
}

function CashflowTrendChart({ data }) {
  return (
    <ChartFrame
      hasData={data.length > 0}
      emptyMessage="No cashflow data available."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
      </ResponsiveContainer>
    </ChartFrame>
  )
}

function CutoffComparisonTable({ data }) {
  if (data.length === 0) {
    return <EmptyState title="No cutoff data available for comparison." />
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
            <tr key={cutoff.cutoffId} className="hover:bg-surface-container-low">
              <td className="px-3 py-2 font-semibold text-on-surface">
                {cutoff.name}
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
  const { data, error, isLoading } = useReports()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  if (isLoading) {
    return <LoadingState label="Loading reports" />
  }

  if (error) {
    return <ErrorState title="Unable to load reports" message={error} />
  }

  const {
    datasets,
    kpis,
    records,
  } = data
  const hasAnyRecords =
    records.expenses.length > 0 ||
    records.income.length > 0 ||
    records.savings.length > 0 ||
    records.cutoffs.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports and Graphs"
        description="Visual reporting and financial trend analysis."
        actions={<StatusBadge tone="info">Local IndexedDB</StatusBadge>}
      />

      {!hasAnyRecords ? (
        <EmptyState
          title="No report data yet"
          message="Add income, expenses, savings, or salary cutoffs to populate reports."
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
          <CutoffComparisonTable data={datasets.cutoffComparison} />
        </SectionCard>
      </div>
    </div>
  )
}
