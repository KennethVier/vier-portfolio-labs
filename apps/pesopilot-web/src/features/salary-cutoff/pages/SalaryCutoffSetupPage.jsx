import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { SectionCard } from '@/components/dashboard'
import { DismissiblePageHelper } from '@/components/guidance/DismissiblePageHelper.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'

import { CutoffForm } from '../components/CutoffForm.jsx'
import { CutoffList } from '../components/CutoffList.jsx'
import { getCutoffTypeLabel } from '../constants/cutoffConstants.js'
import { useSalaryCutoffs } from '../hooks/useSalaryCutoffs.js'

const moneyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

const statusToneByStatus = {
  active: 'text-secondary',
  closed: 'text-tertiary',
  planned: 'text-content-muted',
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

function getCycleProgress(cutoff) {
  if (!cutoff?.startDate || !cutoff?.endDate) {
    return 0
  }

  const startDate = new Date(`${cutoff.startDate}T00:00:00`)
  const endDate = new Date(`${cutoff.endDate}T00:00:00`)
  const today = new Date()
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return 0
  }

  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1
  const elapsedDays = Math.floor((todayStart.getTime() - startDate.getTime()) / 86400000) + 1

  return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
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

function CutoffKpiCard({
  children,
  footer,
  label,
  value,
  valueClassName = 'text-content',
}) {
  return (
    <div className="flex min-h-28 flex-col justify-between border border-outline-variant bg-surface-container-lowest p-4">
      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
        {label}
      </span>
      {children ?? (
        <div className={['font-heading text-2xl font-semibold leading-8', valueClassName].join(' ')}>
          {value}
        </div>
      )}
      {footer ? <div className="flex justify-end">{footer}</div> : null}
    </div>
  )
}

function CutoffKpiGrid({ activeCutoff, daysRemaining }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <CutoffKpiCard
        label="Current Cutoff"
        value={activeCutoff?.name ?? 'None'}
        footer={
          <span className="text-xs font-bold uppercase text-primary">
            {activeCutoff ? getCutoffTypeLabel(activeCutoff.type) : 'No Active Cycle'}
          </span>
        }
      />
      <CutoffKpiCard
        label="Expected Income"
        value={formatMoney(activeCutoff?.expectedIncome)}
        valueClassName="font-mono text-primary"
        footer={<span className="text-xs text-content-muted">Gross Est.</span>}
      />
      <CutoffKpiCard label="Days Remaining">
        <div className="font-heading text-2xl font-semibold leading-8 text-tertiary">
          {formatDays(daysRemaining)}
        </div>
        <div className="mt-2 h-1 w-full bg-surface-container">
          <div className="h-full w-4/5 bg-tertiary" />
        </div>
      </CutoffKpiCard>
      <CutoffKpiCard label="Status">
        <div className="flex items-center gap-2">
          <span
            className={[
              'h-2 w-2 rounded-full',
              activeCutoff ? 'bg-secondary' : 'bg-outline',
            ].join(' ')}
          />
          <span
            className={[
              'font-heading text-lg font-semibold capitalize leading-6',
              statusToneByStatus[activeCutoff?.status] ?? 'text-content-muted',
            ].join(' ')}
          >
            {activeCutoff?.status ?? 'No Active'}
          </span>
        </div>
        <div className="flex justify-end">
          {activeCutoff ? (
            <span className="bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-secondary-container">
              Live Tracking
            </span>
          ) : (
            <span className="bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase text-content-muted">
              Setup Needed
            </span>
          )}
        </div>
      </CutoffKpiCard>
    </div>
  )
}

function CutoffManagementPanel({
  activeCutoff,
  onCreateNextCutoff,
  onEdit,
}) {
  const progress = getCycleProgress(activeCutoff)
  const canCreateNextCutoff = ['monthly', 'semi_monthly'].includes(activeCutoff?.type)

  return (
    <SectionCard
      title="Cutoff Management"
      titleClassName="font-heading text-lg font-bold normal-case tracking-normal text-content"
      description="Current cycle timeline and future AI cutoff insights."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!activeCutoff}
            onClick={() => activeCutoff && onEdit(activeCutoff)}
          >
            Edit Schedule
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canCreateNextCutoff}
            onClick={() => activeCutoff && onCreateNextCutoff(activeCutoff.id)}
          >
            Create Next Cutoff
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Cycle Progression
              </span>
              <span className="font-mono text-sm">{progress.toFixed(1)}%</span>
            </div>
            <div className="relative h-6 overflow-hidden rounded border border-outline-variant bg-surface-container">
              <div className="h-full bg-primary-container" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-[10px] font-medium text-content-muted">
                {activeCutoff?.startDate ?? 'START'}
              </span>
              <span className="text-[10px] font-bold text-primary">CURRENT CYCLE</span>
              <span className="text-[10px] font-medium text-content-muted">
                {activeCutoff?.endDate ?? 'END'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded border border-outline-variant bg-surface p-3">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Velocity Analysis
              </div>
              <p className="text-sm leading-relaxed text-content-muted">
                Spending velocity insights are still underway.
              </p>
            </div>
            <div className="rounded border border-outline-variant bg-surface p-3">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
                Budget Guidance
              </div>
              <p className="text-sm leading-relaxed text-content-muted">
                Target velocity and budget recommendations are not active yet.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded border border-outline-variant bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.05em]">
              AI Insight
            </span>
          </div>
          <p className="text-sm leading-relaxed text-content">
            AI insights for spending velocity, projected grades, and budget
            recommendations are still underway. Current cutoff dates and actions
            remain available.
          </p>
          <div className="border-t border-outline-variant pt-2">
            <p className="text-sm text-content-muted">
              No AI-generated cutoff grade is calculated in this MVP release.
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function HistoricalRecordsPanel({
  currentCutoff,
  cutoffs,
  isLoading,
  onCreate,
  onClose,
  onDelete,
  onEdit,
}) {
  return (
    <section className="border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-4">
        <h2 className="font-heading text-lg font-semibold leading-6 text-content">
          Historical Performance
        </h2>
        <Button type="button" variant="secondary" onClick={onCreate}>
          Add Cutoff
        </Button>
      </div>
      <div className="p-3">
        {isLoading ? (
          <LoadingState label="Loading salary cutoffs" />
        ) : (
          <CutoffList
            currentCutoff={currentCutoff}
            cutoffs={cutoffs}
            onClose={onClose}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </div>
    </section>
  )
}

export function SalaryCutoffSetupPage() {
  const navigate = useNavigate()
  const [createdCutoffGuidance, setCreatedCutoffGuidance] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const {
    clearError,
    clearEditingCutoff,
    closeCutoff,
    currentCutoff,
    createNextCutoff,
    cutoffs,
    deleteCutoff,
    editingCutoff,
    error,
    isLoading,
    isSaving,
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

  async function handleCreateNextCutoff(id) {
    try {
      await createNextCutoff(id)
    } catch {
      // The hook owns the user-facing error state for this page action.
    }
  }

  function openCreateForm() {
    clearError()
    clearEditingCutoff()
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(cutoff) {
    clearError()
    setFormError(null)
    setEditingCutoff(cutoff)
    setIsFormOpen(true)
  }

  function closeForm() {
    clearError()
    clearEditingCutoff()
    setFormError(null)
    setIsFormOpen(false)
  }

  async function submitCutoff(values) {
    setFormError(null)

    try {
      const wasEditing = Boolean(editingCutoff)
      const savedCutoff = await saveCutoff(values)
      setIsFormOpen(false)

      if (!wasEditing) {
        setCreatedCutoffGuidance(savedCutoff)
      }
    } catch (saveError) {
      setFormError(saveError.message || 'Unable to save salary cutoff')
      throw saveError
    }
  }

  return (
    <div className="space-y-6">
      <CutoffKpiGrid
        activeCutoff={activeCutoff}
        daysRemaining={cutoffKpis.daysRemaining}
      />

      <DismissiblePageHelper
        pageKey="salary-cutoff"
        title={activeCutoff ? 'Salary-funded cycle tracking' : 'Create the current salary cycle'}
        message={
          activeCutoff
            ? 'Current-cycle KPIs use the active cutoff. Planned cutoffs can prepare the next salary-funded period.'
            : 'Start with a salary cutoff so income, expenses, savings, dashboard, and cashflow share the same period.'
        }
      />

      {error && !isFormOpen ? (
        <ErrorState title="Unable to process salary cutoffs" message={error} />
      ) : null}

      {createdCutoffGuidance ? (
        <section className="border border-secondary/25 bg-secondary-container/20 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-content">
                Cutoff created
              </h2>
              <p className="mt-1 text-sm text-content-muted">
                Next step: record your income for this cutoff so PesoPilot can
                calculate your cashflow accurately.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => navigate('/income')}
              >
                Record Income
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreatedCutoffGuidance(null)}
              >
                Later
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <CutoffManagementPanel
        activeCutoff={activeCutoff}
        onCreateNextCutoff={handleCreateNextCutoff}
        onEdit={openEditForm}
      />

      <HistoricalRecordsPanel
        currentCutoff={currentCutoff}
        cutoffs={cutoffs}
        isLoading={isLoading}
        onCreate={openCreateForm}
        onClose={closeCutoff}
        onDelete={handleDelete}
        onEdit={openEditForm}
      />

      <Modal
        isOpen={isFormOpen || Boolean(editingCutoff)}
        title={editingCutoff ? 'Edit Salary Cutoff' : 'Create Salary Cutoff'}
        description="Define the local period used for expense grouping."
        size="lg"
        onClose={closeForm}
      >
        <CutoffForm
          editingCutoff={editingCutoff}
          framed={false}
          isSaving={isSaving}
          submitError={formError}
          onCancel={closeForm}
          onSubmit={submitCutoff}
        />
      </Modal>
    </div>
  )
}
