import Dexie from 'dexie'

export const snapshots = new Dexie('pesopilot-business-snapshots')
snapshots.version(1).stores({ daily: 'day' })
// Additive local archive only. Existing daily Phase 0 backups retain their store/format.
snapshots.version(2).stores({ branchDaily: '[userId+day],userId,day' })
