import { useEffect, useState } from 'react'

import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'

import { ExpenseFilters } from '../components/ExpenseFilters.jsx'
import { ExpenseForm } from '../components/ExpenseForm.jsx'
import { ExpenseList } from '../components/ExpenseList.jsx'
import { useExpenses } from '../hooks/useExpenses.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function ExpenseKpiCard({ helper, label, tone = 'content', value }) {
  const toneClasses = {
    content: 'text-content',
    critical: 'text-error',
    primary: 'text-primary',
    secondary: 'text-secondary',
    warning: 'text-tertiary',
  }

  return (
    <div className="border border-outline-variant bg-surface-container-lowest p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-content-muted">
        {label}
      </p>
      <div className="flex flex-col items-start gap-1 2xl:flex-row 2xl:items-end 2xl:justify-between 2xl:gap-3">
        <span
          className={[
            'min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xl font-semibold leading-7 sm:text-2xl 2xl:leading-8',
            toneClasses[tone],
          ].join(' ')}
        >
          {value}
        </span>
        {helper ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-xs font-medium leading-4 text-content-muted 2xl:text-right 2xl:text-sm 2xl:leading-5">
            {helper}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function ExpensesKpiGrid({ expenseKpis }) {
  const kpiHelperText = expenseKpis.currentCutoffId ? 'Current Cutoff' : 'No Current Cutoff'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <ExpenseKpiCard
        helper={kpiHelperText}
        label="Total Expenses"
        tone="primary"
        value={currencyFormatter.format(expenseKpis.totalExpenses)}
      />
      <ExpenseKpiCard
        helper={kpiHelperText}
        label="Transactions"
        tone="content"
        value={expenseKpis.transactionCount}
      />
      <ExpenseKpiCard
        helper={kpiHelperText}
        label="Largest Category"
        tone="warning"
        value={expenseKpis.largestCategory}
      />
      <ExpenseKpiCard
        helper={kpiHelperText}
        label="Avg Expense"
        tone="content"
        value={currencyFormatter.format(expenseKpis.averageExpense)}
      />
    </div>
  )
}

function ExpensesActionBar({
  categories,
  filters,
  onAddExpense,
  onFilterChange,
}) {
  return (
    <div className="sticky top-0 z-30 flex flex-col gap-2 bg-background py-2 xl:flex-row xl:items-center xl:justify-between">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center sm:justify-end xl:order-2">
        <Button variant="gray">
          <span className="material-symbols-outlined text-lg">
            ios_share
          </span>
          Export
        </Button>
        <Button onClick={onAddExpense}>
          <span className="material-symbols-outlined text-lg">
            add
          </span>
          Add Expense
        </Button>
      </div>
      <div className="min-w-0 flex-1 xl:order-1">
        <ExpenseFilters
          categories={categories}
          compact
          filters={filters}
          framed={false}
          showSearch={false}
          onChange={onFilterChange}
        />
      </div>
    </div>
  )
}

function ExpenseLedgerPanel({
  categories,
  expenses,
  isLoading,
  onDelete,
  onEdit,
}) {
  return (
    <div className="overflow-hidden border border-outline-variant bg-surface-container-lowest">
      {isLoading ? (
        <div className="p-3">
          <LoadingState label="Loading expenses" />
        </div>
      ) : (
        <ExpenseList
          categories={categories}
          expenses={expenses}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      )}
    </div>
  )
}

export function ExpensesPage() {
  const [isExpensePanelOpen, setIsExpensePanelOpen] = useState(false)
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const {
    categories,
    clearEditingExpense,
    deleteExpense,
    editingExpense,
    error,
    expenseKpis,
    expenses,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveExpense,
    setEditingExpense,
    updateFilters,
  } = useExpenses()

  useEffect(() => {
    setHeaderConfig({
      searchPlaceholder: 'Search transactions...',
      searchValue: filters.search,
      showSearch: true,
      onSearchChange: (value) =>
        updateFilters({
          ...filters,
          search: value,
        }),
    })

    return () => resetHeaderConfig()
  }, [filters, resetHeaderConfig, setHeaderConfig, updateFilters])

  function openCreatePanel() {
    clearEditingExpense()
    setIsExpensePanelOpen(true)
  }

  function openEditPanel(expense) {
    setEditingExpense(expense)
    setIsExpensePanelOpen(true)
  }

  function closeExpensePanel() {
    clearEditingExpense()
    setIsExpensePanelOpen(false)
  }

  async function submitExpense(expense) {
    await saveExpense(expense)
    setIsExpensePanelOpen(false)
  }

  return (
    <div className="space-y-6">
      <ExpensesKpiGrid expenseKpis={expenseKpis} />

      {error ? <ErrorState title="Unable to process expenses" message={error} /> : null}

      <ExpensesActionBar
        categories={categories}
        filters={filters}
        onAddExpense={openCreatePanel}
        onFilterChange={updateFilters}
      />

      <Modal
        isOpen={isExpensePanelOpen || Boolean(editingExpense)}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        description={
          editingExpense
            ? 'Update an existing expense record.'
            : 'Add a manual spending entry.'
        }
        size="lg"
        onClose={closeExpensePanel}
      >
        <ExpenseForm
          categories={categories}
          editingExpense={editingExpense}
          framed={false}
          isSaving={isSaving}
          salaryCutoffs={salaryCutoffs}
          onCancel={closeExpensePanel}
          onSubmit={submitExpense}
        />
      </Modal>

      <ExpenseLedgerPanel
        categories={categories}
        expenses={expenses}
        isLoading={isLoading}
        onDelete={deleteExpense}
        onEdit={openEditPanel}
      />
    </div>
  )
}
