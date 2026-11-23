// One-way staging smoke check. All origins are fixed; customer input cannot select a destination.
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
const source = 'https://z5jxogiwe.dexie.cloud'
const destination = 'https://zamlyidelptkxouikwcj.supabase.co'
const realmId = 'rlm-pesopilot-business-dev'
const stock = z.object({
  realmId: z.literal(realmId),
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  quantity: z.number().int().nonnegative(),
  priceCentavos: z.number().int().positive(),
})
export async function copyStock(id, readToken, serverKey, request = fetch) {
  if (!id || !readToken || !serverKey) throw new Error('Supply a source ID and server-only credentials.')
  const response = await request(source + '/all/catalogStock/' + encodeURIComponent(id), {
    headers: { Authorization: 'Bearer ' + readToken },
    redirect: 'error',
  })
  if (!response.ok) throw new Error('Dexie read failed: ' + response.status)
  const row = stock.parse(await response.json())
  if (row.id !== id) throw new Error('Unexpected source ID.')
  const result = await request(destination + '/rest/v1/rpc/observe_business_stock', {
    method: 'POST',
    redirect: 'error',
    headers: {
      apikey: serverKey,
      ...(serverKey.startsWith('eyJ') ? { Authorization: 'Bearer ' + serverKey } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_id: id,
      name: row.name,
      quantity: row.quantity,
      price_centavos: row.priceCentavos,
    }),
  })
  if (!result.ok) throw new Error('Recovery write failed: ' + result.status)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await copyStock(process.argv[2], process.env.DEXIE_READ_TOKEN, process.env.SUPABASE_SERVER_KEY)
  console.log('Staging stock observation saved.')
}
