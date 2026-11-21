import { describe, expect, it, vi } from 'vitest'
import { provision } from './bootstrap-dev.mjs'

const email = 'owner@example.test'
const user = { userId: email, type: 'prod', data: { email } }
const realmId = 'rlm-pesopilot-business-dev'
const memberId = 'mmb-pesopilot-dev-admin'
const realm = { realmId, owner: email }
const member = {
  realmId,
  id: memberId,
  owner: email,
  userId: email,
  email,
  accepted: true,
  roles: ['admin'],
}
const userPath = '/users/' + encodeURIComponent(email)

function registry({ user, realm, member } = {}) {
  const state = new Map([
    [userPath, user],
    ['/all/realms/' + realmId, realm],
    ['/all/members/' + memberId, member],
  ])
  const api = vi.fn(async (path, body) => {
    if (path === '/users' && body) {
      state.set(userPath, body[0])
      return null
    }
    if (!state.has(path)) throw new Error('Unexpected endpoint')
    return state.get(path) ?? null
  })
  return { api, writes: () => api.mock.calls.filter(([, body]) => body) }
}

describe('development first Admin provisioning', () => {
  it('registers exactly the verified identity and prepares the matching realm and accepted member', async () => {
    const { api, writes } = registry()
    const plan = await provision(email, api, true, vi.fn())
    expect(writes()).toEqual([
      ['/users', [{ userId: email, type: 'eval', evalDaysLeft: 30, data: { email } }]],
    ])
    expect(plan.data[realmId].realms[realmId]).toMatchObject(realm)
    expect(plan.data[realmId].members[memberId]).toMatchObject(member)
    expect(plan.roles.staff.permissions).toEqual({})
  })
  it('repairs an imported membership with no registered login, then reruns without writing', async () => {
    const { api, writes } = registry({ realm, member })
    const log = vi.fn()
    expect(await provision(email, api, true, log)).toBeNull()
    expect(await provision(email, api, true, log)).toBeNull()
    expect(writes()).toHaveLength(1)
    expect(log).toHaveBeenCalledWith('Application user: already registered (eval)')
  })
  it('preserves an existing account license and creates only a missing membership', async () => {
    const { api, writes } = registry({ realm, user })
    const plan = await provision(email, api, true, vi.fn())
    expect(writes()).toEqual([])
    expect(plan.data[realmId].realms).toBeUndefined()
    expect(plan.data[realmId].members[memberId]).toMatchObject(member)
  })
  it('diagnoses a missing registration in verify-only mode without changes', async () => {
    const { api, writes } = registry({ realm, member })
    await expect(provision(email, api, false, vi.fn())).rejects.toThrow('incomplete')
    expect(writes()).toEqual([])
  })
  it.each([
    { realm: { ...realm, owner: 'another' } },
    { member: { ...member, userId: 'another' } },
    { member: { ...member, roles: ['staff'] } },
    { user: { ...user, deactivated: '2026-01-01' } },
  ])('refuses conflicting or inactive records', async (conflict) => {
    const { api, writes } = registry(conflict)
    await expect(provision(email, api, true, vi.fn())).rejects.toThrow()
    expect(writes()).toEqual([])
  })
})
