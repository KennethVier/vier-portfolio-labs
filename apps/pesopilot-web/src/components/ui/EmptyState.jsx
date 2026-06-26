export function EmptyState({ action, title, message }) {
  return (
    <div className="rounded border border-dashed border-outline-variant bg-surface-container-lowest p-4">
      <h2 className="font-heading text-base font-semibold leading-6 text-content">
        {title}
      </h2>
      {message ? <p className="mt-1 text-sm text-content-muted">{message}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
