import { it, expect, vi } from 'vitest'
import { copyStock } from '../../../../scripts/cloud/recover-stock.mjs'
const row = {
  realmId: 'rlm-pesopilot-business-dev',
  id: 'test',
  name: 'Fixture',
  quantity: 2,
  priceCentavos: 9900,
}
it('reads the approved realm and sends only the bounded stock projection to the recovery RPC', async () => {
  const http = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ ...row, owner: 'private', cost: 1 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  await copyStock('test', 'read-only', 'server-only', http)
  expect(http.mock.calls[0][0]).toBe('https://z5jxogiwe.dexie.cloud/all/catalogStock/test')
  expect(http.mock.calls[1][0]).toMatch(/supabase.co\/rest\/v1\/rpc\/observe_business_stock$/)
  expect(JSON.parse(http.mock.calls[1][1].body)).toEqual({
    source_id: 'test',
    name: 'Fixture',
    quantity: 2,
    price_centavos: 9900,
  })
})
it.each([{ realmId: 'rlm-other' }, { id: 'another' }, { quantity: -1 }])(
  'stops before writing for invalid source %o',
  async (changes) => {
    const http = vi.fn().mockResolvedValue(Response.json({ ...row, ...changes }))
    await expect(copyStock('test', 'read', 'write', http)).rejects.toThrow()
    expect(http).toHaveBeenCalledTimes(1)
  },
)
