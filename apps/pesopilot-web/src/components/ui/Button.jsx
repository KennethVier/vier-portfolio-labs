const variants = {
  primary:
    'border-primary bg-primary text-white shadow-sm shadow-primary/10 hover:bg-primary-container focus-visible:ring-primary/20',
  secondary:
    'border-outline-variant bg-surface-container-lowest text-primary hover:border-primary hover:bg-primary-fixed focus-visible:ring-primary/15',
  ghost:
    'border-transparent bg-transparent text-content-muted hover:bg-surface-container hover:text-content focus-visible:ring-primary/15',
  gray:
    'bg-surface-container-lowest border border-outline-variant px-4 py-2 rounded text-body-md font-medium text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2',
}

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-8 items-center justify-center rounded border px-3 py-1.5 text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
