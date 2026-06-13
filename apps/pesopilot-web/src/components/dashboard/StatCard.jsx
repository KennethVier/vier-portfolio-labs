const toneStyles = {
  neutral: 'border-outline-variant',
  info: 'border-primary/40',
  success: 'border-secondary/40',
  warning: 'border-tertiary/40',
  critical: 'border-error/40',
}

const trendStyles = {
  neutral: 'text-content-muted',
  positive: 'text-secondary',
  warning: 'text-tertiary',
  negative: 'text-error',
}

export function StatCard({
  className = '',
  helperText,
  icon,
  label,
  tone = 'neutral',
  trend,
  value,
}) {
  const trendTone = typeof trend === 'object' ? trend.tone : 'neutral'
  const trendLabel = typeof trend === 'object' ? trend.label : trend

  return (
    <section
      className={[
        'rounded border bg-surface-container-lowest p-4',
        toneStyles[tone] ?? toneStyles.neutral,
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.05em] text-content-muted">
          {label}
        </p>
        {icon ? <div className="text-content-muted">{icon}</div> : null}
      </div>
      <p className="mt-3 text-right font-mono text-xl font-semibold leading-7 text-content">
        {value}
      </p>
      {(helperText || trendLabel) ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-content-muted">{helperText}</span>
          {trendLabel ? (
            <span className={trendStyles[trendTone] ?? trendStyles.neutral}>
              {trendLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
