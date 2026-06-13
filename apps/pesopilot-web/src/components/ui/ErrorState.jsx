export function ErrorState({ title = 'Unable to load', message }) {
  return (
    <div className="rounded border border-error/25 bg-error-container/40 p-4">
      <h2 className="font-heading text-base font-semibold leading-6 text-error">
        {title}
      </h2>
      {message ? <p className="mt-1 text-sm text-content-muted">{message}</p> : null}
    </div>
  )
}
