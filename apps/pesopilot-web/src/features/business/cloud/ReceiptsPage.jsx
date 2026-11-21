import { useEffect, useState } from 'react'
import { receiptPrefix } from './receiptOwner.js'
import { businessDb } from '../repositories/businessDb.js'
import { useBusinessAccess } from './access.js'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { dateTime, peso } from '../components/businessPresentation.js'

export function ReceiptsPage() {
  const { profile } = useBusinessAccess()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    receiptPrefix(profile.id)
      .then((prefix) => businessDb.sales.where('requestKey').startsWith(prefix).toArray())
      .then((items) => {
        if (active) setRows(items.sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt)))
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [profile.id])
  return (
    <BusinessShell>
      <h1 className="font-heading text-3xl">My sales on this device</h1>
      {error ? (
        <p role="alert">Unable to load sales.</p>
      ) : rows === null ? (
        <p>Loading…</p>
      ) : rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              {dateTime(row.confirmedAt)} · {row.paymentMethod} · {peso(row.totalCentavos)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No sales recorded by this account yet.</p>
      )}
    </BusinessShell>
  )
}
