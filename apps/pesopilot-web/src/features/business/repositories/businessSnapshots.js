import Dexie from 'dexie'

export const snapshots = new Dexie('pesopilot-business-snapshots')
snapshots.version(1).stores({ daily: 'day' })
