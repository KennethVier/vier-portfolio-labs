const variants = {
  neutral: 'bg-surface-container text-content-muted ring-outline-variant',
  success: 'bg-secondary-container text-secondary ring-secondary/15',
  warning: 'bg-tertiary-container text-tertiary ring-tertiary/15',
  error: 'bg-error-container text-error ring-error/15',
}

export function Badge({ children, className = '', variant = 'neutral' }) {
  return (
    <span
      className={[
        'inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-[0.05em] ring-1',
        variants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
