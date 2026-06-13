export function PageHeader({
  actions,
  description,
  eyebrow,
  meta,
  title,
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-primary">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="font-headline-md text-headline-md text-on-surface">
          {title}
        </h2>

        {description ? (
          <p className="text-body-sm text-on-surface-variant">
            {description}
          </p>
        ) : null}

        {meta ? (
          <div className="mt-2 text-xs font-medium uppercase tracking-[0.05em] text-content-muted">
            {meta}
          </div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  )
}