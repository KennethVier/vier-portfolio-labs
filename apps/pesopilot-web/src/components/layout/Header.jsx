export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-workspace items-center justify-between px-6">
        <div>
          <p className="font-heading text-lg font-semibold text-content">
            Project Setup
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-content-muted">
            Phase 0
          </p>
        </div>
      </div>
    </header>
  )
}
