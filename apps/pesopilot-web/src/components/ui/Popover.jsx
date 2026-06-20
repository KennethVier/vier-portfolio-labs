export function Popover({
  anchor,
  children,
  className = '',
  isOpen,
}) {
  return (
    <div className="relative inline-flex">
      {anchor}

      {isOpen ? (
        <div
          className={[
            'absolute right-0 top-9 z-40 w-[min(calc(100vw-2rem),320px)] rounded border border-outline-variant bg-surface-container-lowest shadow-[0_8px_20px_rgba(0,0,0,0.08)]',
            className,
          ].join(' ')}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
