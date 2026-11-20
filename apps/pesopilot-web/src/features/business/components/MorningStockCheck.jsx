import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { businessDb } from '../repositories/businessDb.js'
import { getManilaDate } from '../services/dailyAuditService.js'

const key = 'pesopilot.business.morningStockCheck'
export function MorningStockCheck() {
  const [report, setReport] = useState(null)
  const dialog = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    async function check() {
      const day = getManilaDate()
      if (document.hidden || Date.now() < Date.parse(day + 'T07:00:00+08:00') || localStorage.getItem(key) === day ||
          document.querySelector('[aria-modal="true"],dialog[open]')) return
      const low = await businessDb.transaction('r', [businessDb.products, businessDb.inventoryPools, businessDb.inventoryMovements], async () => {
        const tracked = new Set((await businessDb.products.toArray()).filter(p => !p.catalog?.sampleKey).map(p => p.inventoryPoolId))
        const baseline = new Map()
        await businessDb.inventoryMovements.orderBy('id').each(m => {
          if (m.delta > 0) baseline.set(m.inventoryPoolId, m.afterQuantity)
        })
        return (await businessDb.inventoryPools.toArray()).filter(pool => tracked.has(pool.id) &&
          pool.stockQuantity <= (baseline.get(pool.id) ?? 0) * 0.2)
      })
      if (active && !document.hidden && !document.querySelector('[aria-modal="true"],dialog[open]') && localStorage.getItem(key) !== day) setReport({ day, low })
    }
    function refresh() { check().catch(() => {}) }
    refresh()
    const timer = setInterval(refresh, 30000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh) }
  }, [])
  useEffect(() => {
    if (report && dialog.current?.showModal && !dialog.current.open) dialog.current.showModal()
  }, [report])
  function dismiss() {
    localStorage.setItem(key, report.day)
    setReport(null)
  }
  if (!report) return null
  return <dialog ref={dialog} aria-label="Morning stock check" className="m-auto w-11/12 max-w-md rounded-xl p-6 backdrop:bg-black/60" onCancel={dismiss}>
    <h2 className="font-heading text-xl">Morning stock check</h2>
    <p className="my-3">Any deliveries to record today?</p>
    {report.low.length > 0 && <><p>At or below 20% of the stock on hand after the last delivery</p>
      <ul className="my-3 max-h-48 overflow-auto">{report.low.map(pool => <li key={pool.id}>{pool.name} · {pool.stockQuantity} left</li>)}</ul></>}
    <div className="flex flex-wrap gap-2"><Button onClick={() => { dismiss(); navigate('/business/inventory') }}>Receive stock</Button>
      <Button variant="secondary" onClick={dismiss}>Skip today</Button></div>
  </dialog>
}
