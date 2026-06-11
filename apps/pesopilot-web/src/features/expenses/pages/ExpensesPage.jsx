import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { ExpenseFilters } from '../components/ExpenseFilters.jsx'
import { ExpenseForm } from '../components/ExpenseForm.jsx'
import { ExpenseList } from '../components/ExpenseList.jsx'
import { useExpenses } from '../hooks/useExpenses.js'

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-content">
          Expenses
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Manual expense tracking
        </p>
      </div>

      {error ? <ErrorState title="Unable to process expenses" message={error} /> : null}

      <ExpenseForm
        categories={categories}
        editingExpense={editingExpense}
        isSaving={isSaving}
        salaryCutoffs={salaryCutoffs}
        onCancel={clearEditingExpense}
        onSubmit={saveExpense}
      />

      <ExpenseFilters
        categories={categories}
        filters={filters}
        onChange={updateFilters}
      />

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
    </div>
  )
}
