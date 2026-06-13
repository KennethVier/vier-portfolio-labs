const toneStyles = {
  neutral: 'border-outline-variant',
  info: 'border-primary/25',
  success: 'border-secondary/25',
  warning: 'border-tertiary/25',
  critical: 'border-error/25',
}

const valueStyles = {
  neutral: 'text-content',
  info: 'text-primary',
  success: 'text-secondary',
  warning: 'text-tertiary',
  critical: 'text-error',
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
        'rounded border bg-surface-container-lowest p-3 shadow-sm shadow-slate-900/[0.02]',
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
      <p
        className={[
          'mt-2 text-right font-mono text-xl font-semibold leading-7',
          valueStyles[tone] ?? valueStyles.neutral,
        ].join(' ')}
      >
        {value}
      </p>
      {(helperText || trendLabel) ? (
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
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
