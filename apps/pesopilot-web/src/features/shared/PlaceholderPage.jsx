import { Badge } from '@/components/ui/Badge.jsx'
import { Card } from '@/components/ui/Card.jsx'

export function PlaceholderPage({ title }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[32px] font-semibold leading-10 text-content">
            {title}
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Phase 0 placeholder
          </p>
        </div>
        <Badge>Scaffold</Badge>
      </div>
      <Card className="p-4">
        <p className="text-sm text-content-muted">
          This route is intentionally limited to project foundation setup.
        </p>
      </Card>
    </div>
  )
}
