import { useEffect } from 'react'
import { businessBackupService } from '../services/businessBackupService.js'
import { getManilaDate } from '../services/dailyAuditService.js'
import { snapshots } from '../repositories/businessSnapshots.js'

export function useAutomaticBusinessBackup(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    let running = false
    async function save() {
      if (running || document.hidden) return
      running = true
      try {
        const day = getManilaDate()
        if (
          Date.now() < Date.parse(day + 'T07:00:00+08:00') ||
          (await snapshots.daily.get(day))
        )
          return
        const content = await businessBackupService.exportText()
        await snapshots.transaction('rw', snapshots.daily, async () => {
          if (await snapshots.daily.get(day)) return
          await snapshots.daily.add({ day, content })
          const days = await snapshots.daily
            .orderBy('day')
            .reverse()
            .primaryKeys()
          await snapshots.daily.bulkDelete(days.slice(7))
        })
      } catch {
        // Manual export remains available if local storage is unavailable.
      } finally {
        running = false
      }
    }
    save()
    const timer = setInterval(save, 60000)
    document.addEventListener('visibilitychange', save)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', save)
    }
  }, [enabled])
}
