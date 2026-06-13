const toneStyles = {
  neutral: 'border-outline-variant',
  info: 'border-primary/25',
  success: 'border-secondary/25',
  warning: 'border-tertiary/25',
  critical: 'border-error/25',
}

const valueStyles = {
  neutral: 'text-on-surface',
  info: 'text-primary',
  success: 'text-secondary',
  warning: 'text-tertiary',
  critical: 'text-error',
}

const progressStyles = {
  neutral: 'bg-outline',
  info: 'bg-primary',
  success: 'bg-secondary',
  warning: 'bg-tertiary',
  critical: 'bg-error',
}

const trendStyles = {
  neutral: 'bg-surface-container text-on-surface-variant',
  positive: 'bg-secondary-container/20 text-secondary',
  warning: 'bg-tertiary-container/20 text-tertiary',
  negative: 'bg-error-container text-error',
}

const valueSizeStyles = {
  display: 'text-display-lg',
  headline: 'text-headline-md',
  normal: 'text-xl leading-7',
}

export function StatCard({
  className = '',
  helperText,
  icon,
  label,
  progress,
  tone = 'neutral',
  trend,
  value,
  valueSize = 'headline',
}) {
  const trendTone = typeof trend === 'object' ? trend.tone : 'neutral'
  const trendLabel = typeof trend === 'object' ? trend.label : trend

  return (
    <section
      className={[
        'flex flex-col justify-between rounded-lg border bg-surface-container-lowest p-4 shadow-sm',
        toneStyles[tone] ?? toneStyles.neutral,
        className,
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-label-caps text-label-caps uppercase text-outline">
          {label}
        </span>

        {icon ? (
          <span className={valueStyles[tone] ?? valueStyles.neutral}>
            {icon}
          </span>
        ) : null}
      </div>

      <div
        className={[
          'font-data-mono',
          valueSizeStyles[valueSize] ?? valueSizeStyles.headline,
          valueStyles[tone] ?? valueStyles.neutral,
        ].join(' ')}
      >
        {value}
      </div>

      {progress !== undefined ? (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-container">
          <div
            className={[
              'h-full',
              progressStyles[tone] ?? progressStyles.neutral,
            ].join(' ')}
            style={{
              width: `${Math.max(0, Math.min(100, Number(progress) || 0))}%`,
            }}
          />
        </div>
      ) : null}

      {(helperText || trendLabel) ? (
        <div className="mt-2 flex items-center gap-1 text-body-sm text-on-surface-variant">
          {helperText ? <span>{helperText}</span> : null}

          {trendLabel ? (
            <span
              className={[
                'inline-block w-max rounded-full px-2 py-0.5 text-[10px] font-bold',
                trendStyles[trendTone] ?? trendStyles.neutral,
              ].join(' ')}
            >
              {trendLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}