const toneStyles = {
  neutral: 'bg-surface-container text-content-muted ring-outline-variant',
  info: 'bg-primary-fixed text-primary ring-primary/15',
  success: 'bg-secondary-container text-secondary ring-secondary/15',
  warning: 'bg-tertiary-container text-tertiary ring-tertiary/15',
  critical: 'bg-error-container text-error ring-error/15',
}

export function StatusBadge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-[0.05em] ring-1',
        toneStyles[tone] ?? toneStyles.neutral,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
