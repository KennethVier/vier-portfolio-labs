import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from './dexie.js'
import { clearDatabase, resetDatabase, verifyDatabase } from './devTools.js'
import { migrations } from './migrations.js'
import {
  APPROVED_STORE_NAMES,
  DEFAULT_SETTINGS_ID,
  pesopilotSchemaV2,
} from './schema.js'
import {
  defaultCategories,
  defaultMerchantRules,
  seedDatabase,
} from './seed.js'
import {
  categoryRepository,
  expenseRepository,
  merchantRuleRepository,
  settingsRepository,
} from './repositories/index.js'

function parseSchemaDefinition(schemaDefinition) {
  return schemaDefinition.split(',').map((index) => index.trim())
}

beforeEach(async () => {
  await db.open()
  await clearDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
})

describe('PesoPilot Dexie foundation', () => {
  it('opens the database and exposes only approved stores', async () => {
    await db.open()

    const storeNames = db.tables.map((table) => table.name).sort()

    expect(db.isOpen()).toBe(true)
    expect(storeNames).toEqual([...APPROVED_STORE_NAMES].sort())
  })

  it('keeps the schema indexes aligned with the current authority', async () => {
    await db.open()

    const schemaByStore = Object.fromEntries(
      db.tables.map((table) => [
        table.name,
        [
          table.schema.primKey.src,
          ...table.schema.indexes.map((index) => index.src),
        ],
      ]),
    )

    expect(Object.keys(pesopilotSchemaV2).sort()).toEqual(
      [...APPROVED_STORE_NAMES].sort(),
    )

    Object.entries(pesopilotSchemaV2).forEach(([storeName, schemaDefinition]) => {
      expect(schemaByStore[storeName]).toEqual(
        parseSchemaDefinition(schemaDefinition),
      )
    })
  })

  it('seeds default settings, categories, and merchant rules once', async () => {
    await seedDatabase()
    await seedDatabase()

    const settings = await settingsRepository.getSettings()
    const categories = await categoryRepository.findAll()
    const merchantRules = await db.merchant_rules.toArray()

    expect(settings).toMatchObject({
      id: DEFAULT_SETTINGS_ID,
      currency: 'PHP',
      locale: 'en-PH',
      aiMode: 'rules_only',
      salaryMode: 'semi_monthly',
      theme: 'light',
      cloudAiConsent: false,
    })
    expect(categories).toHaveLength(defaultCategories.length)
    expect(merchantRules).toHaveLength(defaultMerchantRules.length)
    expect(await merchantRuleRepository.findByKeyword('Jollibee')).toMatchObject({
      keyword: 'Jollibee',
      categoryId: 'food',
      createdBy: 'system',
    })
  })

  it('supports repository create, read, update, delete, and indexed queries', async () => {
    await seedDatabase()

    const id = await expenseRepository.create({
      amount: 250,
      merchant: 'Jollibee',
      categoryId: 'food',
      paymentMethod: 'cash',
      date: '2026-06-11',
      cutoffId: 1,
      emotionTag: null,
      note: null,
      source: 'manual',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    })

    expect(await expenseRepository.findById(id)).toMatchObject({
      merchant: 'Jollibee',
      categoryId: 'food',
    })
    expect(await expenseRepository.findByCutoff(1)).toHaveLength(1)
    expect(await expenseRepository.findByCategory('food')).toHaveLength(1)
    expect(
      await expenseRepository.findByDateRange('2026-06-01', '2026-06-30'),
    ).toHaveLength(1)

    await expenseRepository.update(id, { amount: 300 })
    expect(await expenseRepository.findById(id)).toMatchObject({ amount: 300 })

    await expenseRepository.remove(id)
    expect(await expenseRepository.findById(id)).toBeUndefined()
  })

  it('resets the database by clearing data and reseeding defaults', async () => {
    await expenseRepository.create({
      amount: 100,
      merchant: 'Temporary',
      categoryId: 'other',
      paymentMethod: 'cash',
      date: '2026-06-11',
      cutoffId: 1,
      source: 'manual',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    })

    await resetDatabase()

    expect(await expenseRepository.findAll()).toHaveLength(0)
    expect(await categoryRepository.findAll()).toHaveLength(defaultCategories.length)
    expect(await settingsRepository.getSettings()).toMatchObject({
      id: DEFAULT_SETTINGS_ID,
    })
  })

  it('verifies database structure without putting dev tools in migrations', async () => {
    const verification = await verifyDatabase()

    expect(verification).toMatchObject({
      isOpen: true,
      isValid: true,
      missingStores: [],
      unexpectedStores: [],
    })
    expect(migrations).toEqual([])
  })
})
