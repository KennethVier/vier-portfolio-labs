import { Card } from '@/components/ui/Card.jsx'

export function SectionCard({
  actions,
  children,
  className = '',
  description,
  title,
}) {
  return (
    <Card className={['p-4', className].join(' ')}>
      {(title || description || actions) ? (
        <div className="mb-3 flex flex-col gap-2 border-b border-outline-variant pb-3 md:flex-row md:items-start md:justify-between">
          <div>
            {title ? (
              <h2 className="font-heading text-base font-semibold leading-6 text-content">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-content-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </Card>
  )
}
