import { useEffect, useState } from 'react'

import {
  KpiGrid,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { expenseService } from '@/features/expenses/services/expenseService.js'
import { incomeService } from '@/features/income/services/incomeService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(value) {
  return currencyFormatter.format(value ?? 0)
}

function getDaysLeft(cutoff) {
  if (!cutoff?.endDate) {
    return 0
  }

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endDate = new Date(`${cutoff.endDate}T00:00:00`)
  const difference = Math.ceil((endDate.getTime() - todayStart.getTime()) / 86400000)

  return Math.max(0, difference)
}

function normalizeTransaction(record, type) {
  const amountDirection = type === 'income' ? 1 : -1

  return {
    amount: Number(record.amount ?? 0) * amountDirection,
    date: record.date,
    id: `${type}-${record.id}`,
    label: record.source ?? record.categoryName ?? record.categoryId ?? 'Transaction',
    type,
  }
}

function buildRecentTransactions({ expenses, income, savings }) {
  return [
    ...income.map((record) => normalizeTransaction(record, 'income')),
    ...expenses.map((record) => normalizeTransaction(record, 'expense')),
    ...savings.map((record) => normalizeTransaction(record, 'savings')),
  ]
    .sort((firstTransaction, secondTransaction) => {
      if (secondTransaction.date === firstTransaction.date) {
        return secondTransaction.id.localeCompare(firstTransaction.id)
      }

      return secondTransaction.date.localeCompare(firstTransaction.date)
    })
    .slice(0, 5)
}

function BudgetShockAlert() {
  return (
    <section className="relative flex h-full flex-col overflow-hidden border border-error/20 bg-surface-container-lowest p-4 lg:col-span-5">
      <div className="absolute left-0 top-0 h-full w-1 bg-error" />
      <div className="flex items-start gap-3">
        <div className="rounded bg-error-container p-1.5">
          <span className="material-symbols-outlined text-[20px] text-error">warning</span>
        </div>
        <div className="space-y-1.5">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Budget Shock Alert
          </h3>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            Spending velocity in <span className="font-bold text-on-surface">Dining</span>{' '}
            has increased by 42% over the last 48 hours. At this rate, you will
            exceed your category limit in 4 days.
          </p>
          <button
            type="button"
            className="flex items-center gap-1 font-body-sm font-semibold text-primary hover:underline"
          >
            Adjust Allocation
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded border border-outline-variant bg-surface-container-low p-2.5">
        <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
        <span className="font-body-sm text-body-sm text-on-surface">
          AI Insight: Consider deferring the Tech Hardware purchase to next cycle.
        </span>
      </div>
    </section>
  )
}

function SpendingOverview() {
  const bars = [
    ['MON', 45],
    ['TUE', 65],
    ['WED', 35],
    ['THU', 85],
    ['FRI', 55],
    ['SAT', 95],
    ['SUN', 40],
  ]

  return (
    <SectionCard
      title="Spending Overview"
      className="h-full lg:col-span-7"
      actions={
        <select
          className="rounded border-none bg-surface-container px-3 py-1 text-body-sm outline-none"
          disabled
          value="Last 7 Days"
          onChange={() => {}}
        >
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      }
    >
      <div className="flex h-24 items-end justify-between gap-2 px-2">
        {bars.map(([label, height]) => (
          <div
            key={label}
            className="group relative flex-1 rounded-t-sm bg-primary transition-colors hover:bg-primary-container"
            style={{ height: `${height}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-on-surface px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {label}: {height}%
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between px-2 font-label-caps text-label-caps text-on-surface-variant">
        {bars.map(([label]) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </SectionCard>
  )
}

function AllocationMatrix() {
  const rows = [
    ['Housing', 'PHP 3,200.00', 'PHP 3,150.00', 'Safe', 'success', 'bg-primary'],
    ['Lifestyle', 'PHP 800.00', 'PHP 640.00', 'Watch', 'warning', 'bg-tertiary'],
    ['Dining', 'PHP 500.00', 'PHP 495.20', 'Tight', 'critical', 'bg-error'],
    ['Transport', 'PHP 1,000.00', 'PHP 420.00', 'Safe', 'success', 'bg-secondary'],
    ['Tech', 'PHP 1,200.00', 'PHP 200.00', 'Safe', 'success', 'bg-primary-container'],
  ]

  return (
    <section className="overflow-hidden border border-outline-variant bg-surface-container-lowest lg:col-span-8">
      <div className="flex items-center justify-between border-b border-outline-variant p-5">
        <h3 className="font-headline-sm text-headline-sm">Allocation Matrix</h3>
        <button type="button" className="text-body-sm font-semibold text-primary">
          View All Categories
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline-variant">
              <th className="px-6 py-3 font-label-caps text-label-caps text-on-surface-variant">
                Category
              </th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-on-surface-variant">
                Budget
              </th>
              <th className="px-6 py-3 text-right font-label-caps text-label-caps text-on-surface-variant">
                Spent
              </th>
              <th className="px-6 py-3 text-center font-label-caps text-label-caps text-on-surface-variant">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-md">
            {rows.map(([category, budget, spent, status, tone, colorClassName]) => (
              <tr key={category} className="transition-colors hover:bg-surface-container-low">
                <td className="px-6 py-4 font-semibold">
                  <span className="flex items-center gap-2">
                    <span className={['h-2.5 w-2.5 rounded-full', colorClassName].join(' ')} />
                    {category}
                  </span>
                </td>
                <td className="px-6 py-4 font-data-mono">{budget}</td>
                <td className="px-6 py-4 text-right font-data-mono">{spent}</td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge tone={tone}>{status}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AIFinancialCoach() {
  return (
    <section className="h-full rounded-lg bg-primary p-4 text-on-primary shadow-sm lg:col-span-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined">auto_awesome</span>
        <h3 className="font-headline-sm text-headline-sm">AI Financial Coach</h3>
      </div>
      <div className="space-y-3">
        <div className="rounded border border-white/10 bg-white/10 p-2.5">
          <div className="mb-1 font-label-caps text-label-caps uppercase opacity-80">
            Surplus Detection
          </div>
          <div className="font-body-md text-body-md">
            You have unallocated cash. Move excess funds to your savings buffer?
          </div>
        </div>
        <div className="rounded border border-white/10 bg-white/10 p-2.5">
          <div className="mb-1 font-label-caps text-label-caps uppercase opacity-80">
            Pattern Analysis
          </div>
          <div className="font-body-md text-body-md">
            Recurring subscription variance will appear here when AI insights are implemented.
          </div>
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded border border-white/30 py-2 font-body-md transition-colors hover:bg-white/10"
        >
          Generate Weekly Report
        </button>
      </div>
    </section>
  )
}

function NextCutoffCard({ currentCutoff }) {
  const daysLeft = getDaysLeft(currentCutoff)

  return (
    <section className="border border-outline-variant bg-surface-container-lowest p-5 lg:col-span-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Next Cutoff
          </span>
          <div className="mt-1 font-headline-sm text-headline-sm">
            {currentCutoff?.endDate ?? 'No active cutoff'}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
          <span className="material-symbols-outlined text-primary">calendar_today</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full w-3/4 bg-primary" />
        </div>
        <span className="font-body-sm text-on-surface-variant">
          {daysLeft} days left
        </span>
      </div>
    </section>
  )
}

function RecentTransactions({ className = '', transactions }) {
  return (
    <section
      className={[
        'overflow-hidden border border-outline-variant bg-surface-container-lowest',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-outline-variant p-5">
        <div>
          <h3 className="font-headline-sm text-headline-sm">Recent Transactions</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Latest 5 income, expense, and savings records
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-body-sm font-semibold text-primary hover:underline"
        >
          View All
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No recent transactions"
            message="Income, expenses, and savings will appear here after records are added."
          />
        </div>
      ) : (
        <div className="divide-y divide-outline-variant">
          {transactions.map((transaction) => {
            const isPositive = transaction.amount > 0

            return (
              <div
                key={transaction.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-5 py-3 transition-colors hover:bg-surface-container-low"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={isPositive ? 'success' : transaction.type === 'savings' ? 'info' : 'critical'}
                    >
                      {transaction.type}
                    </StatusBadge>
                    <p className="truncate font-body-md text-body-md font-semibold text-on-surface">
                      {transaction.label}
                    </p>
                  </div>
                  <p className="mt-1 font-data-mono text-body-sm text-on-surface-variant">
                    {transaction.date}
                  </p>
                </div>
                <p
                  className={[
                    'self-center whitespace-nowrap text-right font-data-mono text-body-md font-semibold',
                    isPositive ? 'text-secondary' : 'text-on-surface',
                  ].join(' ')}
                >
                  {isPositive ? '+' : '-'}
                  {formatMoney(Math.abs(transaction.amount))}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function DashboardPage() {
  const [dashboardState, setDashboardState] = useState({
    cashflow: null,
    currentCutoff: null,
    error: null,
    isLoading: true,
    transactions: [],
  })
  const { resetHeaderConfig, setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
      statusSize: 'lg',
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const [
          cashflowResult,
          currentCutoff,
          expenses,
          income,
          savings,
        ] = await Promise.all([
          cashflowService.getCurrentCashflow(),
          cutoffService.findCurrentCutoff(),
          expenseService.loadExpenses(),
          incomeService.loadIncome(),
          savingsService.loadSavings(),
        ])

        if (!isMounted) {
          return
        }

        setDashboardState({
          cashflow: cashflowResult.cashflow,
          currentCutoff,
          error: null,
          isLoading: false,
          transactions: buildRecentTransactions({ expenses, income, savings }),
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setDashboardState((state) => ({
          ...state,
          error: error.message,
          isLoading: false,
        }))
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const { cashflow, currentCutoff, error, isLoading, transactions } = dashboardState

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorState title="Unable to load dashboard" message={error} />
      ) : null}

      {isLoading ? (
        <LoadingState label="Loading dashboard" />
      ) : (
        <>
          <KpiGrid columns={4}>
            <StatCard
              label="Health Score"
              value="94"
              tone="info"
              valueSize="display"
              icon={<span className="material-symbols-outlined text-lg">monitoring</span>}
              progress={94}
              trend={{ label: '+2.4%', tone: 'positive' }}
            />
            <StatCard
              label="Expected Income"
              value={formatMoney(cashflow?.expectedIncome)}
              helperText={currentCutoff?.endDate ? `Due by ${currentCutoff.endDate}` : 'No active cutoff'}
              tone="neutral"
              icon={<span className="material-symbols-outlined text-lg">payments</span>}
            />
            <StatCard
              label="Total Expenses"
              value={formatMoney(cashflow?.totalExpenses)}
              helperText="Within limit"
              tone="neutral"
              icon={<span className="material-symbols-outlined text-lg">receipt_long</span>}
            />
            <StatCard
              label="Remaining Cash"
              value={formatMoney(cashflow?.remainingCash)}
              helperText={(cashflow?.remainingCash ?? 0) >= 0 ? 'Net Surplus' : 'Deficit Risk'}
              tone={(cashflow?.remainingCash ?? 0) >= 0 ? 'info' : 'critical'}
              icon={<span className="material-symbols-outlined text-lg">account_balance_wallet</span>}
            />
          </KpiGrid>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <BudgetShockAlert />
            <SpendingOverview />
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <RecentTransactions className="lg:col-span-8" transactions={transactions} />
            <AIFinancialCoach />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <AllocationMatrix />
            <NextCutoffCard currentCutoff={currentCutoff} />
          </div>
        </>
      )}
    </div>
  )
}
