const variants = {
  neutral: 'bg-surface-container text-content-muted',
  success: 'bg-secondary-container text-secondary',
  warning: 'bg-tertiary-container text-white',
  error: 'bg-error-container text-error',
}

export function Badge({ children, variant = 'neutral' }) {
  return (
    <span
      className={[
        'inline-flex rounded-md px-2 py-1 text-[11px] font-bold uppercase leading-4 tracking-[0.05em]',
        variants[variant],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
