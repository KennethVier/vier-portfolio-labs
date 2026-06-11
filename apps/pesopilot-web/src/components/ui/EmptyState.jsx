export function EmptyState({ title, message }) {
  return (
    <div className="rounded border border-dashed border-outline-variant bg-surface-container-lowest p-6">
      <h2 className="font-heading text-lg font-semibold text-content">{title}</h2>
      {message ? <p className="mt-1 text-sm text-content-muted">{message}</p> : null}
    </div>
  )
}
