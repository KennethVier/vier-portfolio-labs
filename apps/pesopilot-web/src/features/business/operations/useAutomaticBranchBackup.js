import { useEffect } from 'react'
import { saveBranchDailyBackup } from './automaticBranchBackup.js'
export function useAutomaticBranchBackup(workspace) {
  const database = workspace?.database
  const userId = workspace?.profile?.id
  const ready =
    workspace?.profile?.role === 'admin' && workspace?.readStatus === 'ready'
  useEffect(() => {
    if (!database || !userId || !ready) return
    let running = false
    async function save() {
      if (running || document.hidden) return
      running = true
      try {
        await saveBranchDailyBackup(database, userId)
      } catch {
        /* Manual business backup remains available when archival storage is full. */
      } finally {
        running = false
      }
    }
    void save()
    const timer = setInterval(save, 60000)
    document.addEventListener('visibilitychange', save)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', save)
    }
  }, [database, userId, ready])
}
