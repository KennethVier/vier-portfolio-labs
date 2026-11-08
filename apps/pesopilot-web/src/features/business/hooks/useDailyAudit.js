import { useCallback, useEffect, useState } from 'react'
import { dailyAuditService, getManilaDate } from '../services/dailyAuditService.js'

export function useDailyAudit() {
  const [date, setDate] = useState(() => getManilaDate())
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState({ date: null, report: null, loading: true, error: null })
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    let active = true
    setResult({ date, report: null, loading: true, error: null })
    dailyAuditService.getReport(date).then((report) => {
      if (active) setResult({ date, report, loading: false, error: null })
    }).catch(() => {
      if (active) setResult({ date, report: null, loading: false, error: 'Unable to generate this audit. Check local inventory and sales history, then retry.' })
    })
    window.addEventListener('focus', refresh)
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [date, revision, refresh])

  // Hide the preceding date's data immediately, before the new effect runs.
  return { date, setDate, refresh,
    report: result.date === date ? result.report : null,
    loading: result.date !== date || result.loading,
    error: result.date === date ? result.error : null }
}
