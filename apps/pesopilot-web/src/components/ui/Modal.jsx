export function Modal({ title, children, isOpen, onClose }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-lg rounded border border-outline-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <header className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="rounded px-2 py-1 text-content-muted hover:bg-surface-container"
            onClick={onClose}
            aria-label="Close modal"
          >
            Close
          </button>
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  )
}
