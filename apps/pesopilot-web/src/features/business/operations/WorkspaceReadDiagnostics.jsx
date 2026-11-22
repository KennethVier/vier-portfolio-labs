import { Button } from '@/components/ui/Button.jsx'
export function WorkspaceReadDiagnostics({ profile, report }) {
  if (!import.meta.env.DEV || profile?.role !== 'admin' || !report) return null
  return (
    <details className="rounded border border-outline-variant p-3 text-sm">
      <summary className="cursor-pointer min-h-11">
        Developer read diagnostics
      </summary>
      <p>
        Read stage, redacted exception and schema metadata only. No business
        records or credentials.
      </p>
      <pre className="overflow-auto whitespace-pre-wrap text-xs">
        {JSON.stringify(report, null, 2)}
      </pre>
      <Button
        variant="secondary"
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([JSON.stringify(report, null, 2)], {
              type: 'application/json',
            }),
          )
          const link = document.createElement('a')
          link.href = url
          link.download = 'pesopilot-workspace-read.json'
          link.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }}
      >
        Download read diagnostic
      </Button>
    </details>
  )
}
