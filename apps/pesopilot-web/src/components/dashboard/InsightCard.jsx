import { StatusBadge } from './StatusBadge.jsx'

const severityTones = {
  neutral: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'critical',
}

export function InsightCard({
  actions,
  className = '',
  message,
  severity = 'info',
  sourceLabel,
  title,
}) {
  const tone = severityTones[severity] ?? severityTones.info

  return (
    <section
      className={[
        'rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm shadow-slate-900/[0.02]',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {sourceLabel ? (
            <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.05em] text-content-muted">
              {sourceLabel}
            </p>
          ) : null}
          <h3 className="font-heading text-base font-semibold leading-6 text-content">
            {title}
          </h3>
        </div>
        <StatusBadge tone={tone}>{severity}</StatusBadge>
      </div>
      {message ? <p className="mt-3 text-sm text-content-muted">{message}</p> : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  )
}
