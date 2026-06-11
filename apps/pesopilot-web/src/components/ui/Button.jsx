const variants = {
  primary: 'border-primary bg-primary text-white hover:bg-primary-container',
  secondary:
    'border-primary bg-surface-container-lowest text-primary hover:bg-surface-container',
  ghost: 'border-transparent bg-transparent text-content hover:bg-surface-container',
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
        'inline-flex min-h-9 items-center justify-center rounded border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
