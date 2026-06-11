export function Input({ id, label, error, className = '', ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label ? (
        <span className="mb-1 block text-xs font-semibold text-content">
          {label}
        </span>
      ) : null}
      <input
        id={id}
        className={[
          'min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-error">{error}</span> : null}
    </label>
  )
}
