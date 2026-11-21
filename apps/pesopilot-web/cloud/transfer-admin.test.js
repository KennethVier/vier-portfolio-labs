import { it, expect, vi } from 'vitest'
import { transferAdmin } from './transfer-admin.mjs'
const realmId = 'rlm-pesopilot-business-dev'
const old = 'kennethcerrado23@gmail.com',
  next = 'pesopilotbusiness@gmail.com'
function fixture() {
  const rows = new Map([
    ['/all/realms/' + realmId, { realmId, owner: old, name: 'Preserve', custom: { value: 3 } }],
    [
      '/all/members/mmb-pesopilot-dev-admin',
      {
        id: 'mmb-pesopilot-dev-admin',
        realmId,
        userId: old,
        email: old,
        roles: ['admin'],
        accepted: true,
        owner: old,
      },
    ],
    ['/users/' + encodeURIComponent(old), { userId: old, type: 'prod' }],
  ])
  const api = vi.fn(async (path, body) => {
    if (!body) return structuredClone(rows.get(path) ?? null)
    for (const row of body) {
      const key =
        path === '/users'
          ? '/users/' + encodeURIComponent(row.userId)
          : path + '/' + (row.id ?? row.realmId)
      rows.set(key, structuredClone(row))
    }
  })
  return { api, rows }
}
it('creates business user and Admin before changing owner, preserving metadata and developer access', async () => {
  const { api, rows } = fixture()
  await transferAdmin(api, 'transfer', vi.fn())
  expect(rows.get('/all/realms/' + realmId)).toEqual({
    realmId,
    owner: next,
    name: 'Preserve',
    custom: { value: 3 },
  })
  expect(rows.get('/all/members/mmb-pesopilot-dev-admin').userId).toBe(old)
  expect(api.mock.calls.filter(([, b]) => b).map(([p]) => p)).toEqual([
    '/users',
    '/all/members',
    '/all/realms',
  ])
  api.mockClear()
  await transferAdmin(api, 'transfer', vi.fn())
  await transferAdmin(api, 'verify', vi.fn())
  expect(api.mock.calls.filter(([, b]) => b)).toEqual([])
  await transferAdmin(api, 'rollback', vi.fn())
  expect(rows.get('/all/realms/' + realmId).owner).toBe(old)
  expect(rows.get('/all/members/mmb-pesopilot-business-admin').userId).toBe(next)
})
it('resumes a failure after user creation without resetting the license', async () => {
  const { api, rows } = fixture()
  const fail = async (p, b) => {
    if (p === '/all/members' && b) throw Error('interrupted')
    return api(p, b)
  }
  await expect(transferAdmin(fail, 'transfer', vi.fn())).rejects.toThrow('interrupted')
  rows.get('/users/' + encodeURIComponent(next)).type = 'prod'
  await transferAdmin(api, 'transfer', vi.fn())
  expect(rows.get('/users/' + encodeURIComponent(next)).type).toBe('prod')
})
it('rejects an unexpected owner before writing', async () => {
  const { api, rows } = fixture()
  rows.get('/all/realms/' + realmId).owner = 'someone'
  await expect(transferAdmin(api, 'transfer', vi.fn())).rejects.toThrow('Unexpected')
  expect(api.mock.calls.filter(([, b]) => b)).toEqual([])
})
it('does not transfer without retained developer Admin membership', async () => {
  const { api, rows } = fixture()
  rows.get('/all/members/mmb-pesopilot-dev-admin').roles = ['staff']
  await expect(transferAdmin(api, 'transfer', vi.fn())).rejects.toThrow('membership')
  expect(api.mock.calls.filter(([, b]) => b)).toEqual([])
})
