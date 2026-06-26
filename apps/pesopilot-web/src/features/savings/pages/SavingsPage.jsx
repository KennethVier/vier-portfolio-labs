import { useEffect, useState } from 'react'

import {
  KpiGrid,
  PageHeader,
  SectionCard,
  StatCard,
} from '@/components/dashboard'
import { DismissiblePageHelper } from '@/components/guidance/DismissiblePageHelper.jsx'
import { useHeader } from '@/components/layout/headerContext.js'
import { PaginationControls } from '@/components/pagination/PaginationControls.jsx'
import { useLedgerPagination } from '@/components/pagination/useLedgerPagination.js'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Popover } from '@/components/ui/Popover.jsx'
import { Tooltip } from '@/components/ui/Tooltip.jsx'

import { SavingsFilters } from '../components/SavingsFilters.jsx'
import { SavingsForm } from '../components/SavingsForm.jsx'
import { SavingsGoalForm } from '../components/SavingsGoalForm.jsx'
import { SavingsList } from '../components/SavingsList.jsx'
import { useSavings } from '../hooks/useSavings.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function ProgressBar({ tone = 'primary', value }) {
  const toneClassName = {
    critical: 'bg-error',
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
  }[tone]

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
      <div
        className={['h-full rounded-full', toneClassName].join(' ')}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

const priorityLabel = {
  high: 'High',
  low: 'Low',
  medium: 'Medium',
}

const statusTone = {
  active: 'bg-secondary-container text-on-secondary-container',
  archived: 'bg-surface-container-high text-on-surface-variant',
  completed: 'bg-primary-container text-primary',
  paused: 'bg-tertiary-container text-tertiary',
}

function getGoalIcon(goal) {
  if (goal.priority === 'high') {
    return 'flag'
  }

  if (goal.targetDate) {
    return 'event_available'
  }

  return 'savings'
}

function SavingsGoalCard({
  goal,
  isPrimary = false,
  onAddContribution,
  onArchive,
  onDelete,
  onEdit,
  onViewContributions,
}) {
  const hasTarget = Boolean(goal.targetAmount)
  const amount = currencyFormatter.format(goal.totalSaved)
  const target = hasTarget ? currencyFormatter.format(goal.targetAmount) : null
  const progress = goal.progress ?? 0
  const remaining = goal.remainingAmount == null
    ? null
    : currencyFormatter.format(goal.remainingAmount)

  if (isPrimary) {
    return (
      <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-8">
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed-dim text-primary">
                <span className="material-symbols-outlined text-2xl">{getGoalIcon(goal)}</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">
                  {goal.name}
                </h4>
                <p className="text-body-sm text-on-surface-variant">
                  {goal.note || `${priorityLabel[goal.priority]} priority savings goal`}
                </p>
              </div>
            </div>
            <span className={['rounded px-2 py-1 text-[10px] font-bold uppercase', statusTone[goal.status]].join(' ')}>
              {goal.goalMet ? 'Goal Met' : goal.status}
            </span>
          </div>

          <div>
            {hasTarget ? (
              <>
                <div className="mb-2 flex justify-between text-body-sm">
                  <span className="font-data-mono">{amount} / {target}</span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <ProgressBar value={progress} />
              </>
            ) : (
              <div>
                <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Lifetime Saved
                </p>
                <p className="font-data-mono text-headline-sm text-on-surface">
                  {amount}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-outline-variant py-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-label-caps uppercase text-on-surface-variant">
                Contributions
              </p>
              <p className="font-data-mono text-on-surface">{goal.contributionCount}</p>
            </div>
            <div>
              <p className="mb-1 text-label-caps uppercase text-on-surface-variant">
                Remaining
              </p>
              <p className="font-data-mono text-on-surface">{remaining ?? '-'}</p>
            </div>
            <div>
              <p className="mb-1 text-label-caps uppercase text-on-surface-variant">
                Latest
              </p>
              <p className="font-data-mono text-on-surface">
                {goal.latestContributionDate ?? '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center">
          <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">event</span>
            Target date: {goal.targetDate ?? 'No target date'}
          </span>
          <div className="flex flex-wrap gap-2">
            <Tooltip text="Add a savings record linked to this goal">
              <Button type="button" onClick={() => onAddContribution(goal)}>
                Add Contribution
              </Button>
            </Tooltip>
            <Button type="button" variant="secondary" onClick={() => onViewContributions(goal)}>
              View Contributions
            </Button>
            <Button type="button" variant="ghost" onClick={() => onEdit(goal)}>
              Edit
            </Button>
            <Tooltip text="Hide this goal without deleting contribution history">
              <Button type="button" variant="ghost" onClick={() => onArchive(goal.id)}>
                Archive
              </Button>
            </Tooltip>
            {goal.contributionCount === 0 ? (
              <Tooltip text="Delete is available only when no contributions exist">
                <Button type="button" variant="ghost" onClick={() => onDelete(goal.id)}>
                  Delete
                </Button>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-4">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
          <span className="material-symbols-outlined">{getGoalIcon(goal)}</span>
        </div>
        <span className={['rounded px-2 py-1 text-[10px] font-bold uppercase', statusTone[goal.status]].join(' ')}>
          {goal.goalMet ? 'Goal Met' : goal.status}
        </span>
      </div>
      <h4 className="font-headline-sm text-headline-sm text-on-surface">
        {goal.name}
      </h4>
      <p className="mb-4 text-body-sm text-on-surface-variant">
        {goal.note || `${priorityLabel[goal.priority]} priority savings goal`}
      </p>
      <div className="mb-4">
        {hasTarget ? (
          <>
            <div className="mb-2 flex justify-between text-body-sm">
              <span className="font-data-mono">{amount} / {target}</span>
              <span className="font-bold text-on-surface">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </>
        ) : (
          <p className="font-data-mono text-headline-sm text-on-surface">
            {amount}
          </p>
        )}
      </div>
      <div className="mt-auto grid gap-2">
        <Tooltip text="Add a savings record linked to this goal">
          <Button type="button" onClick={() => onAddContribution(goal)}>
            Add Contribution
          </Button>
        </Tooltip>
        <Button type="button" variant="secondary" onClick={() => onViewContributions(goal)}>
          View Contributions
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => onEdit(goal)}>
            Edit
          </Button>
          <Tooltip text="Hide this goal without deleting contribution history">
            <Button type="button" variant="ghost" onClick={() => onArchive(goal.id)}>
              Archive
            </Button>
          </Tooltip>
        </div>
      </div>
    </section>
  )
}

function SavingsGoalsSection({
  goals,
  onAddContribution,
  onArchive,
  onCreateGoal,
  onDelete,
  onEdit,
  onViewContributions,
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Active Savings Goals
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Lifetime goals powered by real savings contributions.
          </p>
        </div>
        <Button type="button" onClick={onCreateGoal}>
          <span className="material-symbols-outlined text-lg">add</span>
          Create Savings Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-6">
          <h4 className="font-heading text-base font-semibold text-on-surface">
            No savings goals yet.
          </h4>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Create your first savings goal and start contributing toward it.
          </p>
          <Button type="button" className="mt-4" onClick={onCreateGoal}>
            Create Savings Goal
          </Button>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {goals.map((goal, index) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              isPrimary={index === 0}
              onAddContribution={onAddContribution}
              onArchive={onArchive}
              onDelete={onDelete}
              onEdit={onEdit}
              onViewContributions={onViewContributions}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function SavingsPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const {
    archiveSavingsGoal,
    clearEditingSavings,
    clearEditingGoal,
    deleteSavings,
    deleteSavingsGoal,
    editingGoal,
    editingSavings,
    error,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveSavings,
    saveSavingsGoal,
    savings,
    savingsGoals,
    savingsKpis,
    setEditingGoal,
    setEditingSavings,
    updateFilters,
  } = useSavings()
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const kpiHelperText = savingsKpis.currentCutoffId ? 'Current Cutoff' : 'No Current Cutoff'
  const pagination = useLedgerPagination({
    items: savings,
    resetKey: JSON.stringify(filters),
    storageKey: 'pesopilot:savings',
  })

  useEffect(() => {
    setHeaderConfig({
      searchPlaceholder: 'Search savings type or note...',
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

  function closeForm() {
    clearEditingSavings()
    setSelectedGoalId(null)
    setIsFormOpen(false)
  }

  function closeGoalForm() {
    clearEditingGoal()
    setIsGoalFormOpen(false)
  }

  async function submitSavings(values) {
    await saveSavings(values)
    setIsFormOpen(false)
    setSelectedGoalId(null)
  }

  async function submitGoal(values) {
    await saveSavingsGoal(values)
    setIsGoalFormOpen(false)
  }

  function openContributionForm(goal) {
    clearEditingSavings()
    setSelectedGoalId(goal.id)
    setIsFormOpen(true)
  }

  function viewContributions(goal) {
    updateFilters({
      ...filters,
      goalId: goal.id,
    })
  }

  function clearGoalFilter() {
    updateFilters({
      ...filters,
      goalId: '',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Strategy"
        description="Allocating intelligence to long-term wealth assets."
        actions={
          <Button type="button" onClick={() => setIsFormOpen(true)}>
            <span className="material-symbols-outlined text-lg">add</span>
            Add Savings
          </Button>
        }
      />

      <KpiGrid columns={4}>
        <StatCard
          label="Total Savings"
          value={currencyFormatter.format(savingsKpis.totalSavings)}
          tone="info"
          valueSize="display"
          icon={<span className="material-symbols-outlined text-lg">account_balance</span>}
          trend={{
            label: kpiHelperText,
            tone: savingsKpis.currentCutoffId ? 'positive' : 'neutral',
          }}
        />
        <StatCard
          label="Current Cutoff Savings"
          value={currencyFormatter.format(savingsKpis.totalSavings)}
          helperText={kpiHelperText}
          tone="success"
        />
        <StatCard
          label="Largest Type"
          value={savingsKpis.largestSavingsType}
          helperText={kpiHelperText}
          tone="warning"
        />
        <StatCard
          label="Savings Records"
          value={savingsKpis.savingsRecords}
          helperText={kpiHelperText}
          tone="neutral"
        />
      </KpiGrid>

      {error ? <ErrorState title="Unable to process savings" message={error} /> : null}

      <DismissiblePageHelper
        pageKey="savings"
        title={
          savingsGoals.length === 0
            ? 'Create your first savings goal'
            : 'Savings goals and contributions'
        }
        message={
          savingsGoals.length === 0
            ? 'Savings goals organize long-term objectives. Contributions are the real amounts you add over time.'
            : 'Savings Goals represent long-term objectives. Savings Contributions are the amounts you add during each cutoff.'
        }
        action={
          savingsGoals.length === 0 ? (
            <Button type="button" variant="secondary" onClick={() => setIsGoalFormOpen(true)}>
              Create Savings Goal
            </Button>
          ) : null
        }
      />

      <SavingsGoalsSection
        goals={savingsGoals}
        onAddContribution={openContributionForm}
        onArchive={archiveSavingsGoal}
        onCreateGoal={() => setIsGoalFormOpen(true)}
        onDelete={deleteSavingsGoal}
        onEdit={(goal) => {
          setEditingGoal(goal)
          setIsGoalFormOpen(true)
        }}
        onViewContributions={viewContributions}
      />

      <SectionCard
        title="Savings Contributions"
        description={
          filters.goalId
            ? 'Filtered to the selected savings goal.'
            : 'Historical savings contributions remain searchable and filterable.'
        }
        className="overflow-visible"
        actions={
          <div className="flex items-center gap-2">
            {filters.goalId ? (
              <Button type="button" variant="ghost" onClick={clearGoalFilter}>
                Clear Goal
              </Button>
            ) : null}
            <Popover
              isOpen={isFilterOpen}
              anchor={
                <button
                  type="button"
                  className="rounded p-1 text-outline transition-colors hover:bg-surface-container hover:text-primary"
                  onClick={() => setIsFilterOpen((value) => !value)}
                  aria-label="Open savings filters"
                  title="Filters"
                >
                  <span className="material-symbols-outlined text-lg">filter_list</span>
                </button>
              }
            >
              <div className="p-3">
                <SavingsFilters
                  compact
                  filters={filters}
                  framed={false}
                  showSearch={false}
                  salaryCutoffs={salaryCutoffs}
                  onChange={updateFilters}
                />
              </div>
            </Popover>
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading savings" />
        ) : (
          <>
            <SavingsList
              emptyAction={
                <Button type="button" onClick={() => setIsFormOpen(true)}>
                  Add Savings
                </Button>
              }
              savings={pagination.paginatedItems}
              onDelete={deleteSavings}
              onEdit={(savingsRecord) => {
                setEditingSavings(savingsRecord)
                setIsFormOpen(true)
              }}
            />
            <PaginationControls
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              rangeLabel={pagination.range.label}
              total={pagination.total}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </SectionCard>

      <Modal
        isOpen={isFormOpen || Boolean(editingSavings)}
        title={editingSavings ? 'Edit Savings' : 'Add Savings'}
        description={
          editingSavings
            ? 'Update an existing savings transfer.'
            : 'Track money set aside from available cash.'
        }
        size="lg"
        onClose={closeForm}
      >
        <SavingsForm
          currentCutoffId={savingsKpis.currentCutoffId}
          editingSavings={editingSavings}
          framed={false}
          isSaving={isSaving}
          salaryCutoffs={salaryCutoffs}
          savingsGoals={savingsGoals}
          selectedGoalId={selectedGoalId}
          onCancel={closeForm}
          onSubmit={submitSavings}
        />
      </Modal>

      <Modal
        isOpen={isGoalFormOpen || Boolean(editingGoal)}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        description="Define a lifetime savings objective and track contributions."
        size="lg"
        onClose={closeGoalForm}
      >
        <SavingsGoalForm
          editingGoal={editingGoal}
          isSaving={isSaving}
          onCancel={closeGoalForm}
          onSubmit={submitGoal}
        />
      </Modal>
    </div>
  )
}
