// @vitest-environment happy-dom
import Dexie from 'dexie'
import { BehaviorSubject, firstValueFrom, filter } from 'rxjs'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { changeStaff, observeAccount, realmId, createCloudDb } from './client.ts'

let database
beforeEach(async () => {
  database = new Dexie('business-role-test')
  database.version(1).stores({ realms: 'realmId', members: '++id,realmId,[userId+realmId]' })
  database.cloud = {
    currentUser: new BehaviorSubject({ isLoggedIn: true, userId: 'employee' }),
    currentUserId: 'employee',
    sync: vi.fn().mockResolvedValue(undefined),
  }
  await database.realms.add({ realmId, owner: 'developer' })
})
afterEach(async () => database.delete())
function account() {
  return firstValueFrom(observeAccount(database).pipe(filter((state) => !state.loading)))
}
it('grants the seeded realm owner Admin access and rejects an unrelated signed-in account', async () => {
  expect(await account()).toMatchObject({ denied: true })
  database.cloud.currentUser.next({ isLoggedIn: true, userId: 'developer' })
  expect((await account()).profile.role).toBe('admin')
})
it('requires accepted Staff membership in the exact realm', async () => {
  const id = await database.members.add({ realmId, userId: 'employee', roles: ['staff'], invite: true })
  expect(await account()).toMatchObject({ denied: true })
  await database.members.update(id, { accepted: new Date() })
  expect((await account()).profile.role).toBe('staff')
  await expect(changeStaff(database, { email: 'test@example.invalid' })).rejects.toThrow(/Admin/)
  await database.members.update(id, { realmId: 'other' })
  expect(await account()).toMatchObject({ denied: true })
})
it('invites only Staff, rejects duplicate invitations and removes Staff membership', async () => {
  database.cloud.currentUserId = 'developer'
  await changeStaff(database, { email: 'Staff@example.invalid' })
  const [member] = await database.members.toArray()
  expect(member).toMatchObject({
    realmId,
    email: 'staff@example.invalid',
    roles: ['staff'],
    invite: true,
  })
  await expect(changeStaff(database, { email: member.email })).rejects.toThrow(/exists/)
  await changeStaff(database, { id: member.id })
  expect(await database.members.count()).toBe(0)
})
it('configures the actual addon only for the specified development endpoint', () => {
  expect(() => createCloudDb('https://other.dexie.cloud')).toThrow()
  const cloud = createCloudDb('https://z5jxogiwe.dexie.cloud')
  expect(cloud.cloud.options.databaseUrl).toBe('https://z5jxogiwe.dexie.cloud')
  expect(cloud.catalogStock.schema.primKey.name).toBe('id')
  expect(cloud.name).not.toBe('pesopilot-business')
  cloud.close()
})

it('waits for transferred Admin realm and membership before deciding access on first login', async () => {
  await database.realms.clear()
  const email = 'pesopilotbusiness@gmail.com'
  database.cloud.currentUser.next({ isLoggedIn: true, userId: email, license: { status: 'ok' } })
  let finish
  database.cloud.sync.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const states = []
  const sub = observeAccount(database).subscribe((state) => states.push(state))
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(states).toHaveLength(1)
  expect(states[0]).toMatchObject({
    loading: true,
    synchronizing: true,
    diagnostics: { userId: email, license: 'ok' },
  })
  expect(database.cloud.sync).toHaveBeenCalledWith({ purpose: 'pull', wait: true })
  await database.realms.add({ realmId, owner: email })
  await database.members.add({ realmId, userId: email, roles: ['admin'], accepted: new Date() })
  expect(states.some((state) => state.denied)).toBe(false)
  finish()
  await vi.waitFor(() => expect(states.at(-1).profile?.role).toBe('admin'))
  expect(states.at(-1).diagnostics).toMatchObject({
    realmVisible: true,
    realmOwner: email,
    acceptedMemberships: 1,
  })
  sub.unsubscribe()
})
it('reports sync failure separately from missing permission', async () => {
  database.cloud.sync.mockRejectedValue(new Error('network'))
  const result = await account()
  expect(result.error).toContain('synchronization failed')
  expect(result.denied).toBeUndefined()
})
it('denies only after a completed pull returns no visible membership', async () => {
  const result = await account()
  expect(database.cloud.sync).toHaveBeenCalledWith({ purpose: 'pull', wait: true })
  expect(result).toMatchObject({
    denied: true,
    diagnostics: { userId: 'employee', acceptedMemberships: 0 },
  })
})
it('ignores a delayed result after logout or account switch', async () => {
  let finish
  database.cloud.sync.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const states = []
  const sub = observeAccount(database).subscribe((state) => states.push(state))
  database.cloud.currentUser.next({ isLoggedIn: false })
  finish()
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(states.at(-1)).toEqual({})
  sub.unsubscribe()
})

it('restores cached Admin access offline without waiting for the network', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  database.cloud.currentUser.next({ isLoggedIn: true, userId: 'developer' })
  try {
    expect((await account()).profile.role).toBe('admin')
    expect(database.cloud.sync).not.toHaveBeenCalled()
  } finally {
    vi.restoreAllMocks()
  }
})
