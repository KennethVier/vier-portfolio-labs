import { useState } from 'react'

import { PageHeader, SectionCard, StatusBadge } from '@/components/dashboard'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import {
  clearQaData,
  seedBasicDataset,
  seedExpenseInboxItems,
  seedLargeDataset,
} from '../services/devQaSeedService.js'

function ResultSummary({ result }) {
  if (!result) {
    return null
  }

  return (
    <div className="grid gap-2 rounded border border-outline-variant bg-surface p-3 text-body-sm md:grid-cols-2">
      {Object.entries(result).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            {key.replace(/([A-Z])/g, ' $1')}
          </span>
          <span className="font-data-mono font-semibold text-on-surface">
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DevToolsPage() {
  const [error, setError] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastAction, setLastAction] = useState(null)
  const [result, setResult] = useState(null)

  async function runAction(label, action) {
    setError(null)
    setIsRunning(true)

    try {
      const nextResult = await action()
      setLastAction(label)
      setResult(nextResult)
    } catch (actionError) {
      setError(actionError.message ?? 'Unable to run dev tool action')
    } finally {
      setIsRunning(false)
    }
  }

  function clearQaSeedData() {
    if (!window.confirm('Clear only QA_SEED records from local IndexedDB?')) {
      return
    }

    runAction('Clear QA Data', clearQaData)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dev Tools"
        description="Local QA seed data utilities for MVP stabilization."
        actions={<StatusBadge tone="warning">Development Only</StatusBadge>}
      />

      <SectionCard title="Developer QA Tools">
        <div className="space-y-4">
          <div className="rounded border border-tertiary/30 bg-tertiary-container p-4 text-body-sm text-tertiary">
            Developer QA tools only. Do not use with real production data.
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Button
              type="button"
              disabled={isRunning}
              onClick={() => runAction('Seed Basic Dataset', seedBasicDataset)}
            >
              Seed Basic Dataset
            </Button>
            <Button
              type="button"
              disabled={isRunning}
              onClick={() => runAction('Seed Large Dataset', seedLargeDataset)}
            >
              Seed Large Dataset
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isRunning}
              onClick={() =>
                runAction('Seed Expense Inbox Items', seedExpenseInboxItems)
              }
            >
              Seed Expense Inbox Items
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isRunning}
              onClick={clearQaSeedData}
            >
              Clear QA Data
            </Button>
          </div>

          {isRunning ? <LoadingState label="Running dev tool action" /> : null}

          {error ? (
            <ErrorState title="Dev tool action failed" message={error} />
          ) : null}

          {lastAction && !isRunning && !error ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-body-sm">
                <StatusBadge tone="success">Complete</StatusBadge>
                <span className="text-on-surface-variant">{lastAction}</span>
              </div>
              <ResultSummary result={result} />
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
