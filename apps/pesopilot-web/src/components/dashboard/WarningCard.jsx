import { StatusBadge } from './StatusBadge.jsx'

const levelTones = {
  info: 'info',
  watch: 'warning',
  warning: 'warning',
  critical: 'critical',
}

const borderStyles = {
  info: 'border-primary/40',
  watch: 'border-tertiary/40',
  warning: 'border-tertiary/40',
  critical: 'border-error/40',
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
        'rounded border bg-surface-container-lowest p-4',
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
            <p className="mt-1 text-sm text-content-muted">{message}</p>
          ) : null}
        </div>
        <StatusBadge tone={tone}>{level}</StatusBadge>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  )
}
