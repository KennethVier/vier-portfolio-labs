import { Badge } from '@/components/ui/Badge.jsx'

const statusVariants = {
  active: 'success',
  closed: 'warning',
  planned: 'neutral',
}

export function CutoffStatusBadge({ status }) {
  return (
    <Badge variant={statusVariants[status] ?? 'neutral'}>
      {status}
    </Badge>
  )
}
