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
  expect(await account()).toEqual({ denied: true })
  database.cloud.currentUser.next({ isLoggedIn: true, userId: 'developer' })
  expect((await account()).profile.role).toBe('admin')
})
it('requires accepted Staff membership in the exact realm', async () => {
  const id = await database.members.add({ realmId, userId: 'employee', roles: ['staff'], invite: true })
  expect(await account()).toEqual({ denied: true })
  await database.members.update(id, { accepted: new Date() })
  expect((await account()).profile.role).toBe('staff')
  await expect(changeStaff(database, { email: 'test@example.invalid' })).rejects.toThrow(/Admin/)
  await database.members.update(id, { realmId: 'other' })
  expect(await account()).toEqual({ denied: true })
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
