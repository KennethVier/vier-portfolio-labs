import { StatusBadge } from '@/components/dashboard'
import {
  RISK_LABELS,
  RISK_LEVELS,
  RISK_SIGNAL_CODES,
} from '../constants/budgetShockConstants.js'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  style: 'currency',
})

function formatMoney(amount) {
  return currencyFormatter.format(Number(amount) || 0)
}

function getToneConfig(level) {
  switch (level) {
    case RISK_LEVELS.red:
      return {
        badgeTone: 'critical',
        borderClass: 'border-error/30',
        bgClass: 'bg-error-container/10',
        icon: 'error',
        iconClass: 'text-error',
        stripeClass: 'bg-error',
        ariaRole: 'alert',
      }
    case RISK_LEVELS.orange:
      return {
        badgeTone: 'warning',
        borderClass: 'border-tertiary/40',
        bgClass: 'bg-tertiary-container/10',
        icon: 'warning',
        iconClass: 'text-tertiary',
        stripeClass: 'bg-tertiary',
        ariaRole: 'alert',
      }
    case RISK_LEVELS.yellow:
      return {
        badgeTone: 'info',
        borderClass: 'border-outline-variant',
        bgClass: 'bg-surface-container-low',
        icon: 'info',
        iconClass: 'text-primary',
        stripeClass: 'bg-primary',
        ariaRole: 'status',
      }
    case RISK_LEVELS.green:
    default:
      return {
        badgeTone: 'success',
        borderClass: 'border-outline-variant',
        bgClass: 'bg-surface-container-lowest',
        icon: 'check_circle',
        iconClass: 'text-secondary',
        stripeClass: 'bg-secondary',
        ariaRole: 'status',
      }
  }
}

function getReasonDescription(risk, forecast) {
  if (!risk) return ''

  switch (risk.primaryReasonCode) {
    case RISK_SIGNAL_CODES.PROJECTED_DEFICIT:
      return risk.projectedDeficit > 0
        ? `Current spending pace projects a cutoff shortfall of ${formatMoney(risk.projectedDeficit)}.`
        : 'Projected closing cashflow is facing a deficit.'

    case RISK_SIGNAL_CODES.NEGATIVE_AVAILABLE_CASH:
      return `Available cash is currently negative (${formatMoney(forecast?.availableCash ?? 0)}).`

    case RISK_SIGNAL_CODES.CATEGORY_OVER_BUDGET:
      return 'Category expenditure has breached 100% of its planned budget.'

    case RISK_SIGNAL_CODES.BURN_EXCEEDS_SAFE:
      return `Daily burn rate (${formatMoney(forecast?.dailyBurnRate ?? 0)}/day) exceeds safe daily spend (${formatMoney(forecast?.safeDailySpend ?? 0)}/day).`

    case RISK_SIGNAL_CODES.CATEGORY_BUDGET_WARNING:
      return 'A category budget has reached 80% or more of its planned allocation.'

    case RISK_SIGNAL_CODES.BURN_NEAR_SAFE:
      return `Daily burn rate (${formatMoney(forecast?.dailyBurnRate ?? 0)}/day) is within 10% of safe daily allowance (${formatMoney(forecast?.safeDailySpend ?? 0)}/day).`

    case RISK_SIGNAL_CODES.CATEGORY_BUDGET_WATCH:
      return 'A category budget has reached 70% of its planned allocation.'

    default:
      return risk.level === RISK_LEVELS.green
        ? 'Current spending is within sustainable cutoff boundaries.'
        : 'Spending trends warrant monitoring for this cutoff.'
  }
}

export function BudgetShockWarningCard({
  risk = null,
  forecast = null,
  recommendation = null,
  className = '',
}) {
  if (!risk) {
    return null
  }

  const tone = getToneConfig(risk.level)
  const statusLabel = RISK_LABELS[risk.level] ?? 'Healthy'
  const reasonText = getReasonDescription(risk, forecast)
  const isCompact = risk.level === RISK_LEVELS.green

  return (
    <section
      role={tone.ariaRole}
      aria-label={`Budget Shock: ${statusLabel}`}
      className={[
        'relative overflow-hidden rounded-xl border p-5 transition-all',
        tone.borderClass,
        tone.bgClass,
        className,
      ].join(' ')}
    >
      <div className={['absolute left-0 top-0 h-full w-1.5', tone.stripeClass].join(' ')} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={['material-symbols-outlined text-xl', tone.iconClass].join(' ')}
              aria-hidden="true"
            >
              {tone.icon}
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Budget Shock Warning
            </h3>
          </div>
          <StatusBadge tone={tone.badgeTone}>
            {statusLabel}
          </StatusBadge>
        </div>

        <p className="text-body-sm leading-relaxed text-on-surface-variant">
          {reasonText}
        </p>

        {!isCompact && (
          <div className="mt-1 grid gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3 sm:grid-cols-2">
            <div>
              <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Daily Burn Rate
              </p>
              <p className="mt-0.5 font-data-mono text-body-md font-semibold text-on-surface">
                {formatMoney(forecast?.dailyBurnRate ?? 0)}/day
              </p>
            </div>
            <div>
              <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Safe Daily Spend
              </p>
              <p className="mt-0.5 font-data-mono text-body-md font-semibold text-primary">
                {formatMoney(forecast?.safeDailySpend ?? 0)}/day
              </p>
            </div>
          </div>
        )}

        {recommendation?.recommendedAction && (
          <div className="flex items-start gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined mt-0.5 text-base text-primary" aria-hidden="true">
              lightbulb
            </span>
            <div>
              <strong className="font-semibold text-on-surface">Recommendation: </strong>
              <span>{recommendation.recommendedAction}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
