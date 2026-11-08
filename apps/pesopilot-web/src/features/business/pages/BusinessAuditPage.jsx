import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { DailyAuditReport } from '../components/DailyAuditReport.jsx'
import { useDailyAudit } from '../hooks/useDailyAudit.js'
import { useWorkspaceRoute } from '../hooks/useWorkspaceRoute.js'

export function BusinessAuditPage() {
  useWorkspaceRoute('business')
  const audit = useDailyAudit()
  return <div className="min-h-screen bg-surface text-content">
    <header className="border-b border-outline-variant bg-surface-container-lowest p-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wider text-primary">PesoPilot Business</p>
          <h1 className="font-heading text-2xl font-semibold">Daily Sales Audit</h1>
          <p className="text-sm text-content-muted">Owner-confirmed sales and recorded inventory · Asia/Manila</p></div>
        <Link to="/business" className="rounded px-3 py-2 text-primary underline focus-visible:outline focus-visible:outline-2">Back to Business</Link>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
      <div className="flex flex-wrap items-end gap-3">
        <Input label="Audit date (Philippines)" type="date" required value={audit.date} onChange={(event) => audit.setDate(event.target.value)} />
        <Button variant="secondary" disabled={audit.loading} onClick={audit.refresh}>Refresh audit</Button>
      </div>
      {audit.loading ? <p role="status">Generating daily audit…</p> : null}
      {audit.error ? <div role="alert" className="space-y-3 text-error"><p>{audit.error}</p><Button variant="secondary" onClick={audit.refresh}>Retry audit</Button></div> : null}
      {audit.report ? <DailyAuditReport report={audit.report} /> : null}
      <div className="space-y-2 rounded border border-outline-variant bg-surface-container-low p-4 text-sm text-content-muted">
        <p>“Reload Qty” provisionally means opening stock plus additions during this date. Its accounting definition still needs client confirmation.</p>
        <p>Cash reconciliation is unresolved: the client’s ₱7,718 panel is separate from the sample’s ₱7,741 Cash Sales. Onhand Cash, JRIDE, GRAB and GCASH PAY entries are not classified here.</p>
        <p>Cash, GCash and Coop Pay are manually confirmed payment labels. No gateway or external settlement verification is performed. Data stays in this browser and can be erased; this URL provides no authentication or private access.</p>
      </div>
    </main>
  </div>
}
