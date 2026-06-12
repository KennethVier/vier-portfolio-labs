import { Card } from '@/components/ui/Card.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { CutoffForm } from '../components/CutoffForm.jsx'
import { CutoffList } from '../components/CutoffList.jsx'
import { CutoffStatusBadge } from '../components/CutoffStatusBadge.jsx'
import { useSalaryCutoffs } from '../hooks/useSalaryCutoffs.js'

export function SalaryCutoffSetupPage() {
  const {
    assignExpensesToCutoff,
    clearEditingCutoff,
    closeCutoff,
    currentCutoff,
    cutoffs,
    deleteCutoff,
    editingCutoff,
    error,
    isLoading,
    isSaving,
    markCutoffActive,
    saveCutoff,
    setEditingCutoff,
  } = useSalaryCutoffs()

  async function handleDelete(id) {
    if (window.confirm('Delete this salary cutoff?')) {
      await deleteCutoff(id)
    }
  }

  async function handleAssignExpenses(id) {
    await assignExpensesToCutoff(id)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-content">
          Salary Cutoff
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Local pay-period setup for grouping expenses.
        </p>
      </div>

      {error ? <ErrorState title="Unable to process salary cutoffs" message={error} /> : null}

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-content">
              Current Cutoff
            </h2>
            <p className="text-sm text-content-muted">
              {currentCutoff
                ? `${currentCutoff.name} · ${currentCutoff.startDate} to ${currentCutoff.endDate}`
                : 'No active or date-matching cutoff found.'}
            </p>
          </div>
          {currentCutoff ? <CutoffStatusBadge status={currentCutoff.status} /> : null}
        </div>
      </Card>

      <CutoffForm
        editingCutoff={editingCutoff}
        isSaving={isSaving}
        onCancel={clearEditingCutoff}
        onSubmit={saveCutoff}
      />

      {isLoading ? (
        <LoadingState label="Loading salary cutoffs" />
      ) : (
        <CutoffList
          currentCutoff={currentCutoff}
          cutoffs={cutoffs}
          onAssignExpenses={handleAssignExpenses}
          onClose={closeCutoff}
          onDelete={handleDelete}
          onEdit={setEditingCutoff}
          onMarkActive={markCutoffActive}
        />
      )}
    </div>
  )
}
