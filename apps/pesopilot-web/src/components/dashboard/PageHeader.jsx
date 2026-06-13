export function PageHeader({
  actions,
  description,
  eyebrow,
  meta,
  title,
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-outline-variant pb-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.05em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-[32px] font-semibold leading-10 text-content">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-content-muted">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-2 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
