import { Link } from 'react-router-dom'
import { businessSetup } from './businessSetup.js'
export function BusinessSetup({ work }) {
  const steps = businessSetup(work)
  const complete = steps.every((step) => step.done)
  const next = steps.findIndex((step) => !step.done)
  return (
    <details
      key={complete ? 'complete' : 'pending'}
      open={!complete}
      className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4"
    >
      <summary className="cursor-pointer min-h-11 font-semibold">
        Business Setup ·{' '}
        {work.isLoading || work.error
          ? 'Checking saved progress…'
          : complete
            ? 'Setup saved'
            : `${steps.filter((step) => step.done).length} of 4 steps ready`}
      </summary>
      {!work.isLoading && !work.error && (
        <>
          <p className="mb-3 text-sm">
            You add products and manage prices. Staff receives physical stock in
            their branch. POS uses that branch inventory.
          </p>
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className="rounded border border-outline-variant p-3"
                aria-current={index === next ? 'step' : undefined}
              >
                <p className="font-semibold">
                  {step.done ? '✓' : index + 1 + '.'} {step.label}
                </p>
                <p className="mt-1 text-sm">{step.description}</p>
                {!step.done && (
                  <Link
                    className="inline-flex min-h-11 items-center font-semibold text-primary underline"
                    to={step.to}
                  >
                    {step.action}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </details>
  )
}
