import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  { id, label, error, className = '', ...props },
  ref,
) {
  return (
    <label className="block" htmlFor={id}>
      {label ? (
        <span className="mb-1 block text-xs font-semibold text-content">
          {label}
        </span>
      ) : null}
      <input
        id={id}
        ref={ref}
        className={[
          'min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm leading-5 text-content outline-none transition placeholder:text-content-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs font-medium text-error">{error}</span>
      ) : null}
    </label>
  )
})
