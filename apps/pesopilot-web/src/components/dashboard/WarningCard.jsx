import { StatusBadge } from './StatusBadge.jsx'

const levelTones = {
  info: 'info',
  watch: 'warning',
  warning: 'warning',
  critical: 'critical',
}

const borderStyles = {
  info: 'border-primary/25',
  watch: 'border-tertiary/25',
  warning: 'border-tertiary/25',
  critical: 'border-error/25',
}

export function WarningCard({
  actions,
  className = '',
  level = 'info',
  message,
  title,
}) {
  const tone = levelTones[level] ?? 'info'

  return (
    <section
      className={[
        'rounded border bg-surface-container-lowest p-4 shadow-sm shadow-slate-900/[0.02]',
        borderStyles[level] ?? borderStyles.info,
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold leading-6 text-content">
            {title}
          </h3>
          {message ? (
            <p className="mt-1 max-w-prose text-sm text-content-muted">{message}</p>
          ) : null}
        </div>
        <StatusBadge tone={tone}>{level}</StatusBadge>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  )
}
