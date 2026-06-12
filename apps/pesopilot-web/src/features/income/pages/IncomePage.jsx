import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { IncomeFilters } from '../components/IncomeFilters.jsx'
import { IncomeForm } from '../components/IncomeForm.jsx'
import { IncomeList } from '../components/IncomeList.jsx'
import { useIncome } from '../hooks/useIncome.js'

export function IncomePage() {
  const {
    clearEditingIncome,
    deleteIncome,
    editingIncome,
    error,
    filters,
    income,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveIncome,
    setEditingIncome,
    updateFilters,
  } = useIncome()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-content">
          Income
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Track money entering your control before dashboard calculations begin.
        </p>
      </div>

      {error ? <ErrorState title="Unable to process income" message={error} /> : null}

      <IncomeForm
        editingIncome={editingIncome}
        isSaving={isSaving}
        salaryCutoffs={salaryCutoffs}
        onCancel={clearEditingIncome}
        onSubmit={saveIncome}
      />

      <IncomeFilters
        filters={filters}
        salaryCutoffs={salaryCutoffs}
        onChange={updateFilters}
      />

      {isLoading ? (
        <LoadingState label="Loading income" />
      ) : (
        <IncomeList
          income={income}
          onDelete={deleteIncome}
          onEdit={setEditingIncome}
        />
      )}
    </div>
  )
}
