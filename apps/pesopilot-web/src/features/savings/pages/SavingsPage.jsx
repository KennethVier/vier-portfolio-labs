import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { SavingsFilters } from '../components/SavingsFilters.jsx'
import { SavingsForm } from '../components/SavingsForm.jsx'
import { SavingsList } from '../components/SavingsList.jsx'
import { useSavings } from '../hooks/useSavings.js'

export function SavingsPage() {
  const {
    clearEditingSavings,
    deleteSavings,
    editingSavings,
    error,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveSavings,
    savings,
    setEditingSavings,
    updateFilters,
  } = useSavings()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-content">
          Savings
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Track savings set aside before cashflow calculations begin.
        </p>
      </div>

      {error ? <ErrorState title="Unable to process savings" message={error} /> : null}

      <SavingsForm
        editingSavings={editingSavings}
        isSaving={isSaving}
        salaryCutoffs={salaryCutoffs}
        onCancel={clearEditingSavings}
        onSubmit={saveSavings}
      />

      <SavingsFilters
        filters={filters}
        salaryCutoffs={salaryCutoffs}
        onChange={updateFilters}
      />

      {isLoading ? (
        <LoadingState label="Loading savings" />
      ) : (
        <SavingsList
          savings={savings}
          onDelete={deleteSavings}
          onEdit={setEditingSavings}
        />
      )}
    </div>
  )
}
