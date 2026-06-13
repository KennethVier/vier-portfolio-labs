export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="rounded border border-outline-variant bg-surface-container-lowest p-3 text-sm text-content-muted">
      <span className="font-medium">{label}</span>
    </div>
  )
}
