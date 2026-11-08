import { Link } from 'react-router-dom'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { DailyAuditReport } from '../components/DailyAuditReport.jsx'
import { useDailyAudit } from '../hooks/useDailyAudit.js'
import { useWorkspaceRoute } from '../hooks/useWorkspaceRoute.js'

export function BusinessAuditPage() {
  useWorkspaceRoute('business')
  const audit = useDailyAudit()
  return <BusinessShell>
    <div className="business-page-heading flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-heading text-3xl font-semibold">Daily Sales Audit</h1>
        <p className="mt-2 text-content-muted">Owner-confirmed sales and recorded inventory - Asia/Manila</p></div>
      <Link to="/business" className="inline-flex min-h-11 items-center px-3 text-primary underline">Back to Business</Link>
    </div>
    <p className="text-sm text-content-muted">Sample recordings and fictional stock are labeled Sample and are included in these totals.</p>
      <div className="business-audit-controls flex flex-wrap items-end gap-3">
        <Input label="Audit date (Philippines)" type="date" required value={audit.date} onChange={(event) => audit.setDate(event.target.value)} />
        <Button variant="secondary" disabled={audit.loading} onClick={audit.refresh}>Refresh audit</Button>
      </div>
      {audit.loading ? <p role="status">Generating daily audit…</p> : null}
      {audit.error ? <div role="alert" className="business-audit-error space-y-3 text-error"><p>{audit.error}</p><Button variant="secondary" onClick={audit.refresh}>Retry audit</Button></div> : null}
      {audit.report ? <DailyAuditReport report={audit.report} /> : null}
      <div className="space-y-2 rounded border border-outline-variant bg-surface-container-low p-4 text-sm text-content-muted">
        <p>“Reload Qty” provisionally means opening stock plus additions during this date. Its accounting definition still needs client confirmation.</p>
        <p>Cash reconciliation is unresolved: the client’s ₱7,718 panel is separate from the sample’s ₱7,741 Cash Sales. Onhand Cash, JRIDE, GRAB and GCASH PAY entries are not classified here.</p>
        <p>Cash, GCash and Coop Pay are manually confirmed payment labels. No gateway or external settlement verification is performed. Data stays in this browser and can be erased; this URL provides no authentication or private access.</p>
      </div>
  </BusinessShell>
}
