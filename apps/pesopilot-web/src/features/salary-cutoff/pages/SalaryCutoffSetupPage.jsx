import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { CutoffForm } from '../components/CutoffForm.jsx'
import { CutoffList } from '../components/CutoffList.jsx'
import { useSalaryCutoffs } from '../hooks/useSalaryCutoffs.js'

const moneyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

const statusToneByStatus = {
  active: 'success',
  closed: 'warning',
  planned: 'neutral',
}

function formatMoney(value) {
  return moneyFormatter.format(value ?? 0)
}

function getDaysRemaining(endDate) {
  if (!endDate) {
    return 0
  }

  const today = new Date()
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  const cutoffEnd = new Date(`${endDate}T00:00:00`)
  const difference = cutoffEnd.getTime() - todayStart.getTime()
  const daysRemaining = Math.ceil(difference / 86400000)

  return Math.max(0, daysRemaining)
}

function formatDays(days) {
  return `${days} ${days === 1 ? 'Day' : 'Days'}`
}

function getCutoffKpis(cutoffs) {
  const activeCutoff = cutoffs.find((cutoff) => cutoff.status === 'active')

  return {
    activeCutoff,
    daysRemaining: getDaysRemaining(activeCutoff?.endDate),
  }
}

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
  const cutoffKpis = getCutoffKpis(cutoffs)
  const activeCutoff = cutoffKpis.activeCutoff

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
      <PageHeader
        eyebrow="Pay Periods"
        title="Salary Cutoff"
        description="Local pay-period setup for grouping expenses."
        meta={`${cutoffs.length} cutoff records`}
      />

      <KpiGrid columns={4}>
        <StatCard
          label="Current Cutoff"
          value={activeCutoff?.name ?? 'None'}
          helperText="Active status only"
          tone="info"
        />
        <StatCard
          label="Expected Income"
          value={formatMoney(activeCutoff?.expectedIncome)}
          helperText="Active cutoff"
          tone="success"
        />
        <StatCard
          label="Days Remaining"
          value={formatDays(cutoffKpis.daysRemaining)}
          helperText="Until cutoff end"
          tone="warning"
        />
        <StatCard
          label="Cutoff Status"
          value={
            activeCutoff ? (
              <StatusBadge tone={statusToneByStatus[activeCutoff.status]}>
                {activeCutoff.status}
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral">No Active Cutoff</StatusBadge>
            )
          }
          helperText="Active cutoff state"
          tone={activeCutoff ? 'success' : 'neutral'}
        />
      </KpiGrid>

      {error ? <ErrorState title="Unable to process salary cutoffs" message={error} /> : null}

      <CutoffForm
        editingCutoff={editingCutoff}
        isSaving={isSaving}
        onCancel={clearEditingCutoff}
        onSubmit={saveCutoff}
      />

      <SectionCard title="Current Cutoff">
        {activeCutoff ? (
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Start Date
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-content">
                {activeCutoff.startDate}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                End Date
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-content">
                {activeCutoff.endDate}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Expected Income
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-content">
                {formatMoney(activeCutoff.expectedIncome)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Status
              </p>
              <div className="mt-1">
                <StatusBadge tone={statusToneByStatus[activeCutoff.status]}>
                  {activeCutoff.status}
                </StatusBadge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-content-muted">No active cutoff found.</p>
        )}
      </SectionCard>

      <SectionCard title="Cutoff Records">
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
      </SectionCard>
    </div>
  )
}
