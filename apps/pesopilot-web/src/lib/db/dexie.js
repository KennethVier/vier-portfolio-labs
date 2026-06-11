import Dexie from 'dexie'

import {
  PESOPILOT_DB_NAME,
  PESOPILOT_DB_VERSION,
  pesopilotSchemaV1,
} from './schema.js'

export const db = new Dexie(PESOPILOT_DB_NAME)

db.version(PESOPILOT_DB_VERSION).stores(pesopilotSchemaV1)
