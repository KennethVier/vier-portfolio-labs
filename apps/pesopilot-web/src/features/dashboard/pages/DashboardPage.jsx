import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  KpiGrid,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { DismissiblePageHelper } from '@/components/guidance/DismissiblePageHelper.jsx'
import { useHeader } from '@/components/layout/headerContext.js'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { AiQuickAddModal } from '@/features/manual-ai-expense/components/AiQuickAddModal.jsx'

import { useDashboard } from '../hooks/useDashboard.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(value) {
  return currencyFormatter.format(value ?? 0)
}

function getAlertToneClasses(tone) {
  const toneClasses = {
    caution: {
      border: 'border-tertiary/30',
      icon: 'bg-tertiary-container text-tertiary',
      stripe: 'bg-tertiary',
    },
    critical: {
      border: 'border-error/20',
      icon: 'bg-error-container text-error',
      stripe: 'bg-error',
    },
    stable: {
      border: 'border-secondary/20',
      icon: 'bg-secondary-container text-secondary',
      stripe: 'bg-secondary',
    },
    warning: {
      border: 'border-tertiary/30',
      icon: 'bg-tertiary-container text-tertiary',
      stripe: 'bg-tertiary',
    },
  }

  return toneClasses[tone] ?? toneClasses.stable
}

function BudgetShockAlert({ alert }) {
  const toneClasses = getAlertToneClasses(alert.tone)

  return (
    <section
      className={[
        'relative flex h-full flex-col overflow-hidden border bg-surface-container-lowest p-4 lg:col-span-5',
        toneClasses.border,
      ].join(' ')}
    >
      <div className={['absolute left-0 top-0 h-full w-1', toneClasses.stripe].join(' ')} />
      <div className="flex items-start gap-3">
        <div className={['rounded p-1.5', toneClasses.icon].join(' ')}>
          <span className="material-symbols-outlined text-[20px]">{alert.icon}</span>
        </div>
        <div className="space-y-1.5">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {alert.title}
          </h3>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            {alert.message}
          </p>
          <button
            type="button"
            className="flex items-center gap-1 font-body-sm font-semibold text-primary hover:underline"
          >
            {alert.actionLabel}
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded border border-outline-variant bg-surface-container-low p-2.5">
        <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
        <span className="font-body-sm text-body-sm text-on-surface">
          {alert.insight}
        </span>
      </div>
    </section>
  )
}

function SpendingOverview({ bars }) {
  return (
    <SectionCard
      title="Spending Overview"
      className="h-full lg:col-span-7"
      actions={
        <span className="rounded bg-surface-container px-3 py-1 text-body-sm font-semibold text-on-surface-variant">
          Current Cycle Spending
        </span>
      }
    >
      <div className="flex h-24 items-end justify-between gap-2 px-2">
        {bars.map((bar) => (
          <div
            key={bar.label}
            className="group relative flex-1 rounded-t-sm bg-primary transition-colors hover:bg-primary-container"
            style={{ height: `${bar.percent}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-on-surface px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {bar.label}: {formatMoney(bar.amount)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between px-2 font-label-caps text-label-caps text-on-surface-variant">
        {bars.map((bar) => (
          <span key={bar.label}>{bar.label}</span>
        ))}
      </div>
    </SectionCard>
  )
}

function AllocationMatrix({ rows }) {
  return (
    <section className="overflow-hidden border border-outline-variant bg-surface-container-lowest lg:col-span-8">
      <div className="flex items-center justify-between border-b border-outline-variant p-5">
        <div>
          <h3 className="font-headline-sm text-headline-sm">Allocation Matrix</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Top current-cutoff expense categories
          </p>
        </div>
        <Link to="/reports" className="text-body-sm font-semibold text-primary hover:underline">
          View All Categories
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No current-cycle expense allocation"
            message="Expenses assigned to the current cutoff will appear here."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container">
              <tr className="border-b border-outline-variant">
                <th className="px-6 py-3 font-label-caps text-label-caps text-on-surface-variant">
                  Category
                </th>
                <th className="px-6 py-3 text-right font-label-caps text-label-caps text-on-surface-variant">
                  Spent
                </th>
                <th className="px-6 py-3 text-right font-label-caps text-label-caps text-on-surface-variant">
                  Share
                </th>
                <th className="px-6 py-3 text-center font-label-caps text-label-caps text-on-surface-variant">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md">
              {rows.map((row) => (
                <tr
                  key={row.category}
                  className="transition-colors hover:bg-surface-container-low"
                >
                  <td className="px-6 py-4 font-semibold">
                    <span className="flex items-center gap-2">
                      <span
                        className={['h-2.5 w-2.5 rounded-full', row.colorClassName].join(' ')}
                      />
                      {row.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-data-mono">
                    {formatMoney(row.spent)}
                  </td>
                  <td className="px-6 py-4 text-right font-data-mono">
                    {row.share}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function AiUnavailableModal({ isOpen, onClose }) {
  return (
    <Modal
      title="AI Features Are Underway"
      description="PesoPilot v1.0 keeps your financial workflow local and review-first."
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
          AI coaching, generated reports, and deeper financial insights are still
          being prepared for a future phase.
        </p>
        <p>
          For now, the dashboard uses local deterministic summaries from your
          current cutoff, income, expenses, and savings records.
        </p>
      </div>
    </Modal>
  )
}

function AIFinancialCoach({ messages, onGenerateReport }) {
  return (
    <section className="h-full rounded-lg bg-primary p-4 text-on-primary shadow-sm lg:col-span-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined">auto_awesome</span>
        <h3 className="font-headline-sm text-headline-sm">AI Financial Coach</h3>
      </div>
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.label}
            className="rounded border border-white/10 bg-white/10 p-2.5"
          >
            <div className="mb-1 font-label-caps text-label-caps uppercase opacity-80">
              {message.label}
            </div>
            <div className="font-body-md text-body-md">
              {message.message}
            </div>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 w-full rounded border border-white/30 py-2 font-body-md transition-colors hover:bg-white/10"
          onClick={onGenerateReport}
        >
          Generate Weekly Report
        </button>
      </div>
    </section>
  )
}

function NextCutoffCard({ currentCutoff, cutoffProgress }) {
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
          <div
            className="h-full bg-primary"
            style={{ width: `${cutoffProgress.progress}%` }}
          />
        </div>
        <span className="font-body-sm text-on-surface-variant">
          {cutoffProgress.daysLeft} days left
        </span>
      </div>
    </section>
  )
}

function QuickActions({ onAiQuickAdd }) {
  const actions = [
    { icon: 'add', label: 'Expense', to: '/expenses' },
    { icon: 'add', label: 'Income', to: '/income' },
    { icon: 'add', label: 'Savings', to: '/savings' },
    { icon: 'inbox', label: 'Review Inbox', to: '/expense-inbox' },
  ]

  return (
    <section className="border border-outline-variant bg-surface-container-lowest p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            Quick Actions
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Jump into common daily money workflows.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
            onClick={onAiQuickAdd}
          >
            <span className="material-symbols-outlined text-base">
              auto_awesome
            </span>
            AI Quick Add
          </button>
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">
                {action.icon}
              </span>
              {action.label}
            </Link>
          ))}
        </div>
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
        <Link
          to="/reports"
          className="flex items-center gap-1 text-body-sm font-semibold text-primary hover:underline"
        >
          View All
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
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
  const [isAiQuickAddOpen, setIsAiQuickAddOpen] = useState(false)
  const [isAiUnavailableOpen, setIsAiUnavailableOpen] = useState(false)
  const { data, error, isLoading } = useDashboard()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
      statusSize: 'lg',
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorState title="Unable to load dashboard" message={error} />
      ) : null}

      {isLoading || !data ? (
        <LoadingState label="Loading dashboard" />
      ) : (
        <>
          <DismissiblePageHelper
            pageKey="dashboard"
            title={data.currentCutoff ? 'Current cutoff dashboard' : 'Create your first salary cutoff'}
            message={
              data.currentCutoff
                ? 'Dashboard summarizes your current salary cutoff. Historical analysis is available in Reports.'
                : 'PesoPilot needs a salary cutoff before current-cycle dashboard widgets can show meaningful totals.'
            }
            action={
              data.currentCutoff ? (
                <Link to="/reports" className="text-body-sm font-semibold text-primary hover:underline">
                  Open Reports
                </Link>
              ) : (
                <Link to="/salary-cutoff" className="text-body-sm font-semibold text-primary hover:underline">
                  Create Cutoff
                </Link>
              )
            }
          />

          <KpiGrid columns={4}>
            <StatCard
              label="Health Score"
              value={data.healthScore ?? '--'}
              tone="info"
              valueSize="display"
              icon={<span className="material-symbols-outlined text-lg">monitoring</span>}
              progress={data.healthScore ?? undefined}
              helperText={data.healthScore === null ? 'No current cutoff data' : 'Current cycle score'}
            />
            <StatCard
              label="Expected Income"
              value={formatMoney(data.cashflow?.expectedIncome)}
              helperText={data.currentCutoff?.endDate ? `Due by ${data.currentCutoff.endDate}` : 'No active cutoff'}
              tone="neutral"
              icon={<span className="material-symbols-outlined text-lg">payments</span>}
            />
            <StatCard
              label="Total Expenses"
              value={formatMoney(data.cashflow?.totalExpenses)}
              helperText={data.expenseHelperText}
              tone="neutral"
              icon={<span className="material-symbols-outlined text-lg">receipt_long</span>}
            />
            <StatCard
              label="Remaining Cash"
              value={formatMoney(data.cashflow?.remainingCash)}
              helperText={(data.cashflow?.remainingCash ?? 0) >= 0 ? 'Net Surplus' : 'Deficit Risk'}
              tone={(data.cashflow?.remainingCash ?? 0) >= 0 ? 'info' : 'critical'}
              icon={<span className="material-symbols-outlined text-lg">account_balance_wallet</span>}
            />
          </KpiGrid>

          <QuickActions onAiQuickAdd={() => setIsAiQuickAddOpen(true)} />

          {isAiQuickAddOpen ? (
            <AiQuickAddModal
              isOpen={isAiQuickAddOpen}
              onClose={() => setIsAiQuickAddOpen(false)}
            />
          ) : null}

          <AiUnavailableModal
            isOpen={isAiUnavailableOpen}
            onClose={() => setIsAiUnavailableOpen(false)}
          />

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <BudgetShockAlert alert={data.budgetAlert} />
            <SpendingOverview bars={data.spendingOverview} />
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            <RecentTransactions
              className="lg:col-span-8"
              transactions={data.recentTransactions}
            />
            <AIFinancialCoach
              messages={data.coachMessages}
              onGenerateReport={() => setIsAiUnavailableOpen(true)}
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <AllocationMatrix rows={data.allocationRows} />
            <NextCutoffCard
              currentCutoff={data.currentCutoff}
              cutoffProgress={data.cutoffProgress}
            />
          </div>
        </>
      )}
    </div>
  )
}
