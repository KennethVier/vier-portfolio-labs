import { Card } from '@/components/ui/Card.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'

import { CASHFLOW_METRICS } from '../constants/cashflowConstants.js'
import { useCashflow } from '../hooks/useCashflow.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

const percentFormatter = new Intl.NumberFormat('en-PH', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'percent',
})

function formatMetric(value, format) {
  if (format === 'percent') {
    return percentFormatter.format((value ?? 0) / 100)
  }

  return currencyFormatter.format(value ?? 0)
}

export function CashflowPage() {
  const {
    cashflow,
    error,
    hasCurrentCutoff,
    isLoading,
  } = useCashflow()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-content">
          Cashflow
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Current cutoff cashflow verification.
        </p>
      </div>

      {error ? <ErrorState title="Unable to load cashflow" message={error} /> : null}

      {isLoading ? <LoadingState label="Loading cashflow" /> : null}

      {!isLoading && !hasCurrentCutoff ? (
        <EmptyState
          title="No current cutoff"
          message="Create or activate a salary cutoff to verify current cashflow."
        />
      ) : null}

      {!isLoading && cashflow ? (
        <>
          <Card className="p-4">
            <h2 className="font-heading text-lg font-semibold text-content">
              {cashflow.cutoffName}
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              Current cutoff calculation, read-only.
            </p>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {CASHFLOW_METRICS.map((metric) => (
              <Card key={metric.key} className="p-4">
                <p className="text-xs font-bold uppercase tracking-[0.05em] text-content-muted">
                  {metric.label}
                </p>
                <p className="mt-2 text-right font-mono text-lg font-semibold text-content">
                  {formatMetric(cashflow[metric.key], metric.format)}
                </p>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
