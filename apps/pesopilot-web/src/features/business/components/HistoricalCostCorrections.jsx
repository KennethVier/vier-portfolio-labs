import { useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { businessBackupService } from '../services/businessBackupService.js'
import { applyHistoricalCostCorrections } from '../services/salesProfit.js'
import { getManilaDate } from '../services/dailyAuditService.js'
import { dateTime, peso } from './businessPresentation.js'

const money = (value) => value === null || value === undefined ? 'Not recorded' : peso(value)
const parseCost = (value) => {
  const text = String(value).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  const centavos = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(centavos) ? centavos : null
}

export function HistoricalCostCorrections({ sales, events, correctHistoricalCost, disabled }) {
  const [date, setDate] = useState(getManilaDate())
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [correctedCost, setCorrectedCost] = useState('')
  const [reason, setReason] = useState('')
  const [backupReady, setBackupReady] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const allLines = sales.flatMap(sale => sale.items.map(item => ({
    ...item, confirmedAt: sale.confirmedAt, saleId: sale.id,
  })))
  const effective = new Map(applyHistoricalCostCorrections(allLines, events).map(item => [item.id, item]))
  const matches = allLines
    .filter(item => getManilaDate(new Date(item.confirmedAt)) === date)
    .filter(item => (item.productNameSnapshot + ' ' + item.saleId).toLowerCase().includes(query.toLowerCase().trim()))
    .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt) || b.id - a.id)
  const current = editing && effective.get(editing.id)
  const stale = Boolean(editing && (!current || (current.unitCostCentavos ?? null) !== editing.expectedCostCentavos))
  const next = parseCost(correctedCost)
  const previewValid = Boolean(editing && next !== null &&
    Number.isSafeInteger(next * editing.quantity) &&
    next !== editing.expectedCostCentavos)
  const beforeTotal = editing && editing.expectedCostCentavos !== null
    ? editing.expectedCostCentavos * editing.quantity : null
  const afterTotal = editing && previewValid ? next * editing.quantity : null
  const recent = events.filter(event => event.type === 'cost_correction').slice(0, 10)

  function start(line) {
    const currentCost = effective.get(line.id)?.unitCostCentavos ?? null
    setEditing({ id: line.id, name: line.productNameSnapshot, quantity: line.quantity,
      expectedCostCentavos: currentCost, confirmedAt: line.confirmedAt })
    setCorrectedCost(currentCost === null ? '' : (currentCost / 100).toFixed(2))
    setReason('')
    setBackupReady(false)
    setConfirmed(false)
    setError('')
    setNotice('')
  }

  function cancel() {
    setEditing(null)
    setBackupReady(false)
    setConfirmed(false)
    setError('')
  }

  async function downloadBackup() {
    if (busy || disabled || !editing) return
    setBusy(true)
    setError('')
    setBackupReady(false)
    try {
      const text = await businessBackupService.exportText()
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'pesopilot-before-cost-correction-' + new Date().toISOString().replaceAll(':', '-') + '.json'
      document.body.appendChild(link)
      try { link.click() } finally {
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      setBackupReady(true)
    } catch {
      setError('Backup could not be prepared. No changes were saved. Check local storage and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function save(event) {
    event.preventDefault()
    if (busy || disabled || stale || !backupReady || !confirmed || !previewValid || reason.trim().length < 5) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await correctHistoricalCost({
        saleItemId: editing.id,
        expectedCostCentavos: editing.expectedCostCentavos,
        correctedCost,
        reason,
      })
      cancel()
      setNotice('Historical cost correction recorded. Daily Audit and Sales Analytics now use the corrected cost.')
    } catch (failure) {
      setError(failure?.message || 'Could not save this correction. No cost correction was recorded.')
    } finally {
      setBusy(false)
    }
  }

  return <section aria-label="Historical cost corrections" className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
    <h2 className="font-heading text-xl">Historical Cost Corrections</h2>
    <p className="text-sm text-content-muted">
      Fix an incorrect purchase cost on a previously recorded sale. Original receipts, selling prices,
      stock movements and payment totals remain unchanged. Costs and gross profit are recalculated in reports.
      Each correction is recorded with a reason. This device has no authenticated owner access.
    </p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="Affected sale date (Philippines)" type="date" value={date} max={getManilaDate()}
        onChange={event => { setDate(event.target.value); cancel() }} />
      <Input label="Find a sold product or sale ID" type="search" value={query}
        onChange={event => setQuery(event.target.value)} />
    </div>
    {disabled ? <p role="status">Loading recorded transactions…</p> :
      !matches.length ? <p>No sale items match this date and search. Choose the actual transaction date.</p> :
      <div className="max-h-80 space-y-2 overflow-auto">
        {matches.map(item => <div key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded border border-outline-variant p-3">
          <div className="min-w-0">
            <p className="font-semibold">{item.productNameSnapshot} · {item.quantity} piece(s)</p>
            <p className="text-sm text-content-muted">
              {dateTime(item.confirmedAt)} · Receipt {item.saleId.slice(0, 8)}
            </p>
            <p className="text-sm">Recorded cost: {money(item.unitCostCentavos ?? null)} ·
              Effective cost: {money(effective.get(item.id)?.unitCostCentavos ?? null)}
            </p>
          </div>
          <Button variant="secondary" disabled={busy || Boolean(editing)}
            onClick={() => start(item)}>Correct cost</Button>
        </div>)}
      </div>}
    {editing && <form onSubmit={save} className="space-y-3 rounded-lg border border-outline-variant p-4">
      <h3 className="font-semibold">Correct: {editing.name} · {editing.quantity} piece(s)</h3>
      <p className="text-sm">Current effective unit cost: {money(editing.expectedCostCentavos)}</p>
      <Input label="Correct purchase cost per piece (PHP)" required inputMode="decimal"
        value={correctedCost} onChange={event => { setCorrectedCost(event.target.value); setConfirmed(false) }} />
      <Input label="Reason for correction" required value={reason}
        placeholder="Incorrect costing entered on the sale date"
        maxLength={240} onChange={event => setReason(event.target.value)} />
      {previewValid ? <p role="status" className="rounded-lg bg-surface-container-low p-3 text-sm">
        COGS for this sale line: {money(beforeTotal)} → {money(afterTotal)}.
        {beforeTotal === null
          ? ' The previously unrecorded cost will now be included in profit.'
          : ' Gross profit for this date changes by ' + money(beforeTotal - afterTotal) + '.'}
        Revenue and stock do not change.
      </p> : <p className="text-sm text-content-muted">
        Enter a different valid cost in PHP (zero is allowed, up to two decimal places).
      </p>}
      {stale && <p role="alert">This cost was changed elsewhere. Cancel, then reopen this sale item.</p>}
      <Button type="button" variant="secondary" disabled={busy} onClick={downloadBackup}>
        Download pre-correction backup
      </Button>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed}
          disabled={!backupReady || busy} onChange={event => setConfirmed(event.target.checked)} />
        I saved the downloaded Business backup and verified the correct cost and reason.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={disabled || busy || stale || !backupReady ||
          !confirmed || !previewValid || reason.trim().length < 5}>
          {busy ? 'Saving…' : 'Confirm cost correction'}
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={cancel}>Cancel</Button>
      </div>
      <p className="text-xs text-content-muted">
        Backup files contain sensitive unencrypted sales records; store them privately. Nothing is overwritten
        until you confirm. Corrections remain in the Business backup for restore.
      </p>
    </form>}
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {recent.length > 0 && <details className="border-t border-outline-variant pt-3">
      <summary className="cursor-pointer font-semibold">Recent cost corrections</summary>
      <ul className="mt-2 space-y-2 text-sm">{recent.map(event => <li key={event.id}>
        {dateTime(event.occurredAt)} · {event.payload.productNameSnapshot} ·
        {money(event.payload.previousUnitCostCentavos)} → {money(event.payload.correctedUnitCostCentavos)} ·
        {event.payload.reason}
      </li>)}</ul>
    </details>}
  </section>
}
