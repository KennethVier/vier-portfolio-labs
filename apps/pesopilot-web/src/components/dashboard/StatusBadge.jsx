const toneStyles = {
  neutral: 'bg-surface-container text-content-muted',
  info: 'bg-primary/10 text-primary',
  success: 'bg-secondary-container text-secondary',
  warning: 'bg-tertiary-container text-white',
  critical: 'bg-error-container text-error',
}

export function StatusBadge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold uppercase leading-4 tracking-[0.05em]',
        toneStyles[tone] ?? toneStyles.neutral,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
