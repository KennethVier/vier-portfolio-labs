import { Card } from '@/components/ui/Card.jsx'

export function SectionCard({
  actions,
  children,
  className = '',
  description,
  title,
  titleClassName = '',
}) {
  return (
    <Card className={[' p-0', className].join(' ')}>
      {(title || description || actions) ? (
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
          <div>
            {title ? (
              <h2
                className={[
                  'font-label-caps text-label-caps uppercase text-on-surface-variant',
                  titleClassName,
                ].join(' ')}
              >
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}

      <div className="p-4">{children}</div>
    </Card>
  )
}
