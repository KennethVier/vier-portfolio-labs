export function ErrorState({ title = 'Unable to load', message }) {
  return (
    <div className="rounded border border-error-container bg-surface-container-lowest p-4">
      <h2 className="font-heading text-lg font-semibold text-error">{title}</h2>
      {message ? <p className="mt-1 text-sm text-content-muted">{message}</p> : null}
    </div>
  )
}
