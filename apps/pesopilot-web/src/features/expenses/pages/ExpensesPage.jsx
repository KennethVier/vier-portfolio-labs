import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { ExpenseFilters } from '../components/ExpenseFilters.jsx'
import { ExpenseForm } from '../components/ExpenseForm.jsx'
import { ExpenseList } from '../components/ExpenseList.jsx'
import { useExpenses } from '../hooks/useExpenses.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function getExpenseKpis(expenses, categories) {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  )
  const categoryTotals = new Map()
  const totalExpenses = expenses.reduce((total, expense) => {
    const amount = Number(expense.amount) || 0
    const categoryName = categoriesById.get(expense.categoryId)?.name ?? 'Uncategorized'

    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + amount)

    return total + amount
  }, 0)
  const largestCategory =
    [...categoryTotals.entries()].sort((firstCategory, secondCategory) => {
      if (secondCategory[1] === firstCategory[1]) {
        return firstCategory[0].localeCompare(secondCategory[0])
      }

      return secondCategory[1] - firstCategory[1]
    })[0]?.[0] ?? 'None'
  const transactionCount = expenses.length

  return {
    averageExpense: transactionCount === 0 ? 0 : totalExpenses / transactionCount,
    largestCategory,
    totalExpenses,
    transactionCount,
  }
}

export function ExpensesPage() {
  const {
    categories,
    clearEditingExpense,
    deleteExpense,
    editingExpense,
    error,
    expenses,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveExpense,
    setEditingExpense,
    updateFilters,
  } = useExpenses()
  const expenseKpis = getExpenseKpis(expenses, categories)

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Spending"
        title="Expenses"
        description="Manual expense tracking"
        meta={`${expenseKpis.transactionCount} visible transactions`}
      />

      <KpiGrid columns={4}>
        <StatCard
          label="Total Expenses"
          value={currencyFormatter.format(expenseKpis.totalExpenses)}
          helperText="Visible filtered spend"
          tone="critical"
        />
        <StatCard
          label="Transactions"
          value={expenseKpis.transactionCount}
          helperText="Visible records"
          tone="info"
        />
        <StatCard
          label="Largest Category"
          value={expenseKpis.largestCategory}
          helperText="By visible spend"
          tone="warning"
        />
        <StatCard
          label="Average Expense"
          value={currencyFormatter.format(expenseKpis.averageExpense)}
          helperText="Visible average"
          tone="neutral"
        />
      </KpiGrid>

      {error ? <ErrorState title="Unable to process expenses" message={error} /> : null}

      <ExpenseForm
        categories={categories}
        editingExpense={editingExpense}
        isSaving={isSaving}
        salaryCutoffs={salaryCutoffs}
        onCancel={clearEditingExpense}
        onSubmit={saveExpense}
      />

      <SectionCard title="Filters">
        <ExpenseFilters
          categories={categories}
          filters={filters}
          framed={false}
          onChange={updateFilters}
        />
      </SectionCard>

      <SectionCard title="Expense Records">
        {isLoading ? (
          <LoadingState label="Loading expenses" />
        ) : (
          <ExpenseList
            categories={categories}
            expenses={expenses}
            onDelete={deleteExpense}
            onEdit={setEditingExpense}
          />
        )}
      </SectionCard>
    </div>
  )
}
