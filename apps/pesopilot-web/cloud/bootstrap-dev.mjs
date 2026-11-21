// Run from the operator's Dexie CLI directory. Only the public URL config is read.
import { readFile, writeFile } from 'node:fs/promises'
const url = 'https://z5jxogiwe.dexie.cloud'
const realm = 'rlm-pesopilot-business-dev'
const owner = process.argv[2]?.trim().toLowerCase()
if (!owner || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner))
  throw new Error('Supply the verified Dexie email identity.')
const config = JSON.parse(await readFile('dexie-cloud.json', 'utf8'))
if (config.dbUrl !== url) throw new Error('Wrong development database.')
// Use the email-based identity strategy. CLI import uses realm -> table -> primary key.
const bootstrap = {
  schema: { realms: '@realmId', members: '@id', roles: '[realmId+name]', catalogStock: 'id' },
  sealed: true,
  roles: {
    admin: {
      displayName: 'Admin',
      description: 'Manage the business realm',
      permissions: { manage: '*' },
    },
    staff: {
      displayName: 'Staff',
      description: 'Read shared stock and record local POS sales',
      permissions: {},
    },
  },
  data: {
    [realm]: {
      realms: { [realm]: { realmId: realm, owner, name: 'PesoPilot Business Development' } },
      members: {
        'mmb-pesopilot-dev-admin': {
          id: 'mmb-pesopilot-dev-admin',
          realmId: realm,
          owner,
          userId: owner,
          email: owner,
          roles: ['admin'],
          accepted: true,
          invite: false,
        },
      },
    },
  },
}
await writeFile('business-bootstrap.local.json', JSON.stringify(bootstrap, null, 2), {
  mode: 0o600,
  flag: 'wx',
})
console.log('Prepared business-bootstrap.local.json for', url)
