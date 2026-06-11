export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="rounded border border-outline-variant bg-surface-container-lowest p-4 text-sm text-content-muted">
      {label}
    </div>
  )
}
