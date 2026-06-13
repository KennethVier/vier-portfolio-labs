const toneStyles = {
  neutral: 'border-outline-variant',
  info: 'border-primary/40',
  success: 'border-secondary/40',
  warning: 'border-tertiary/40',
  critical: 'border-error/40',
}

const valueToneStyles = {
  neutral: 'text-content',
  info: 'text-primary',
  success: 'text-secondary',
  warning: 'text-tertiary',
  critical: 'text-error',
}

export function MetricCard({
  align = 'right',
  className = '',
  label,
  subValue,
  tone = 'neutral',
  value,
}) {
  const alignment = align === 'left' ? 'text-left' : 'text-right'

  return (
    <section
      className={[
        'rounded border bg-surface-container-lowest p-3',
        toneStyles[tone] ?? toneStyles.neutral,
        className,
      ].join(' ')}
    >
      <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.05em] text-content-muted">
        {label}
      </p>
      <p
        className={[
          'mt-2 font-mono text-base font-semibold leading-6',
          alignment,
          valueToneStyles[tone] ?? valueToneStyles.neutral,
        ].join(' ')}
      >
        {value}
      </p>
      {subValue ? (
        <p className={['mt-1 text-xs text-content-muted', alignment].join(' ')}>
          {subValue}
        </p>
      ) : null}
    </section>
  )
}
