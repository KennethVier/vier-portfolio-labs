import Dexie, { liveQuery, type Table } from 'dexie'
import dexieCloud from 'dexie-cloud-addon'
import { combineLatest, switchMap, of, from } from 'rxjs'

export const realmId = 'rlm-pesopilot-business-dev'
const devUrl = 'https://z5jxogiwe.dexie.cloud'
type Stock = {
  id: string
  realmId: string
  owner?: string
  name: string
  quantity: number
  priceCentavos: number
}
type CloudDb = Dexie & { catalogStock: Table<Stock, string> }
export function createCloudDb(url: string) {
  if (url !== devUrl) throw new Error('Expected the PesoPilot development database.')
  // Logout may clear a cloud cache. The original POS ledger stays in its own Dexie database.
  const db = new Dexie('pesopilot-business-cloud-dev', { addons: [dexieCloud] }) as CloudDb
  db.version(1).stores({ catalogStock: 'id,realmId' })
  db.cloud.configure({ databaseUrl: url, requireAuth: false, socialAuth: false })
  return db
}
const configured = import.meta.env.VITE_BUSINESS_DEXIE_URL
export const db = configured === devUrl ? createCloudDb(configured) : null

export function observeAccount(database: CloudDb) {
  return database.cloud.currentUser.pipe(
    switchMap((user) => {
      if (user.isLoading) return of({ loading: true })
      if (!user.isLoggedIn || !user.userId) return of({})
      if (
        user.license &&
        (user.license.status !== 'ok' ||
          (user.license.validUntil && new Date(user.license.validUntil).getTime() <= Date.now()))
      )
        return of({ denied: true })
      const id = user.userId
      return from(
        liveQuery(async () => {
          const realm = await database.realms.get(realmId)
          const members = await database.members
            .where('[userId+realmId]')
            .equals([id, realmId])
            .toArray()
          const accepted = members.filter((m) => m.accepted && !m.rejected)
          const role =
            realm?.owner === id ? 'admin' : accepted.find((m) => m.roles?.length === 1)?.roles?.[0]
          if (!realm || !['admin', 'staff'].includes(role ?? '')) return { denied: true }
          return { profile: { id, email: user.email ?? id, role, enabled: true } }
        }),
      )
    }),
  )
}
export function watchAccount(database: CloudDb, update: (state: object) => void) {
  const sub = combineLatest([observeAccount(database), database.cloud.invites]).subscribe({
    next: ([state, invites]) => update({ ...state, invite: invites.find((i) => i.realmId === realmId) }),
    error: () => update({ error: 'Unable to read your Business membership.' }),
  })
  database.open().catch(() => update({ error: 'Unable to open the Business cloud database.' }))
  return () => sub.unsubscribe()
}
export async function changeStaff(database: CloudDb, change: { email: string } | { id: string }) {
  if (!navigator.onLine) throw new Error('Connect to the internet to manage access.')
  await database.cloud.sync({ purpose: 'pull', wait: true })
  await database.transaction('rw', database.realms, database.members, async () => {
    const uid = database.cloud.currentUserId
    const realm = await database.realms.get(realmId)
    const members = await database.members.where('realmId').equals(realmId).toArray()
    if (
      !realm ||
      !(
        realm.owner === uid ||
        members.some((m) => m.userId === uid && m.accepted && !m.rejected && m.roles?.includes('admin'))
      )
    )
      throw new Error('Admin membership required.')
    if ('email' in change) {
      const email = change.email.trim().toLowerCase()
      if (members.some((m) => m.email?.toLowerCase() === email))
        throw new Error('Membership already exists.')
      await database.members.add({ realmId, email, roles: ['staff'], invite: true })
    } else {
      const member = members.find((m) => m.id === change.id)
      if (!member || member.userId === realm.owner || member.roles?.join() !== 'staff')
        throw new Error('Choose a Staff membership.')
      await database.members.delete(member.id)
    }
  })
  await database.cloud.sync({ purpose: 'push', wait: true })
}
