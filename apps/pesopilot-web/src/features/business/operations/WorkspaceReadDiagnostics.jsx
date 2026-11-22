import { useState } from 'react'
import { db } from '../cloud/client.ts'
import { inspectBranchLedgerIds } from './ledgerIdDiagnostic.js'
import { Button } from '@/components/ui/Button.jsx'
export function WorkspaceReadDiagnostics({ profile, report }) {
  const [ledger, setLedger] = useState(null)
  const [reading, setReading] = useState(false)
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
      <Button
        variant="secondary"
        disabled={reading}
        onClick={async () => {
          setReading(true)
          try {
            setLedger(await inspectBranchLedgerIds(db, profile.id))
          } catch {
            setLedger({
              diagnostic:
                'Ledger metadata could not be read. Raw error withheld.',
            })
          } finally {
            setReading(false)
          }
        }}
      >
        Inspect ledger ID metadata
      </Button>
      {ledger && (
        <pre className="overflow-auto whitespace-pre-wrap text-xs">
          {JSON.stringify(ledger, null, 2)}
        </pre>
      )}
      <pre className="overflow-auto whitespace-pre-wrap text-xs">
        {JSON.stringify(report, null, 2)}
      </pre>
      <Button
        variant="secondary"
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob(
              [
                JSON.stringify(
                  { ...report, ...(ledger ? { ledgerIds: ledger } : {}) },
                  null,
                  2,
                ),
              ],
              {
                type: 'application/json',
              },
            ),
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
