export function Modal({
  title,
  description,
  children,
  footer,
  isOpen,
  onClose,
  size = 'lg',
}) {
  if (!isOpen) {
    return null
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/35 p-4 backdrop-blur-[1px]">
      <section
        className={[
          'w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
          sizeClasses[size] ?? sizeClasses.lg,
        ].join(' ')}
      >
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant bg-surface px-5 py-4">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="rounded px-2 py-1 text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            onClick={onClose}
            aria-label="Close modal"
          >
            Close
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-outline-variant bg-surface px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  )
}