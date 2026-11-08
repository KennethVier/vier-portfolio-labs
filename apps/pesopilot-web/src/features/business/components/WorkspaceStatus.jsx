import { Button } from '@/components/ui/Button.jsx'

export function WorkspaceStatus({ workspace }) {
  return <>
    {workspace.isLoading ? <div role="status" className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 text-content-muted">Loading local business data…</div> : null}
    {workspace.error ? <div role="alert" className="space-y-3 rounded-lg border border-error bg-error-container p-4 text-error"><p>Unable to refresh business data: {workspace.error}. Displayed records may be stale.</p><Button variant="secondary" onClick={workspace.refresh}>Retry Loading</Button></div> : null}
  </>
}
