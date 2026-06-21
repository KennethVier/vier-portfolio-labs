import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useSettingsStore } from '@/app/settingsStore.js'
import { db } from '@/lib/db/dexie.js'
import { clearDatabase } from '@/lib/db/devTools.js'
import { APPROVED_STORE_NAMES, DEFAULT_SETTINGS_ID } from '@/lib/db/schema.js'
import { seedDatabase } from '@/lib/db/seed.js'
import {
  categoryRepository,
  expenseRepository,
  incomeRepository,
  settingsRepository,
} from '@/lib/db/repositories/index.js'

import {
  normalizeSettings,
  settingsService,
} from './settingsService.js'

beforeEach(async () => {
  await db.open()
  await clearDatabase()
  useSettingsStore.getState().clearSettings()
})

afterEach(async () => {
  await clearDatabase()
  useSettingsStore.getState().clearSettings()
  db.close()
})

describe('settingsService', () => {
  it('normalizes settings with MVP defaults while preserving legacy fields', () => {
    expect(
      normalizeSettings({
        aiMode: 'rules_only',
        cloudAiConsent: true,
        customLegacyField: 'preserved',
        salaryMode: 'semi_monthly',
      }),
    ).toMatchObject({
      aiMode: 'rules_only',
      cloudAiConsent: true,
      currency: 'PHP',
      customLegacyField: 'preserved',
      density: 'compact',
      id: DEFAULT_SETTINGS_ID,
      language: 'en',
      lifestyleMode: 'PH',
      salaryMode: 'semi_monthly',
      theme: 'light',
    })
  })

  it('updates currency, theme, and density without dropping legacy fields', async () => {
    await seedDatabase()

    const updatedSettings = await settingsService.updateSettings({
      currency: 'USD',
      density: 'comfortable',
      theme: 'dark',
    })

    expect(updatedSettings).toMatchObject({
      aiMode: 'rules_only',
      cloudAiConsent: false,
      currency: 'USD',
      density: 'comfortable',
      locale: 'en-PH',
      salaryMode: 'semi_monthly',
      theme: 'dark',
    })
    expect(await settingsRepository.getSettings()).toMatchObject({
      currency: 'USD',
      density: 'comfortable',
      theme: 'dark',
    })
    expect(useSettingsStore.getState().settings).toMatchObject({
      currency: 'USD',
    })
  })

  it('builds a backup with approved stores and preserves records as-is', async () => {
    await seedDatabase()

    await expenseRepository.create({
      amount: 250,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-21',
      merchant: 'Jollibee',
      note: 'QA_SEED lunch',
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-21T00:00:00.000Z',
      updatedAt: '2026-06-21T00:00:00.000Z',
    })

    const backupData = await settingsService.buildBackupData()

    expect(backupData).toMatchObject({
      app: 'PesoPilot',
      version: 1,
    })
    expect(Object.keys(backupData.stores).sort()).toEqual(
      [...APPROVED_STORE_NAMES].sort(),
    )
    expect(backupData.stores.expenses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          merchant: 'Jollibee',
          note: 'QA_SEED lunch',
        }),
      ]),
    )
  })

  it('rejects invalid backup shapes', () => {
    expect(() => settingsService.validateBackupData(null)).toThrow(
      'Invalid backup file',
    )
    expect(() => settingsService.validateBackupData({ stores: [] })).toThrow(
      'Invalid backup file',
    )
    expect(() =>
      settingsService.validateBackupData({ stores: { expenses: {} } }),
    ).toThrow('Store "expenses" must be an array')
  })

  it('imports approved stores with replace behavior and ignores unknown stores', async () => {
    await seedDatabase()
    await expenseRepository.create({
      amount: 100,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Old Expense',
      note: null,
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    await settingsService.importBackupData({
      app: 'PesoPilot',
      version: 1,
      stores: {
        expenses: [
          {
            id: 77,
            amount: 500,
            categoryId: 'bills',
            cutoffId: 2,
            date: '2026-06-02',
            merchant: 'Imported Expense',
            note: 'Imported',
            paymentMethod: 'Cash',
            source: 'manual',
            createdAt: '2026-06-02T00:00:00.000Z',
            updatedAt: '2026-06-02T00:00:00.000Z',
          },
        ],
        income: [
          {
            id: 88,
            amount: 40000,
            cutoffId: 2,
            date: '2026-06-02',
            source: 'Salary',
            note: null,
            createdAt: '2026-06-02T00:00:00.000Z',
            updatedAt: '2026-06-02T00:00:00.000Z',
          },
        ],
        unknown_store: [{ id: 1 }],
      },
    })

    expect(await expenseRepository.findAll()).toEqual([
      expect.objectContaining({
        id: 77,
        merchant: 'Imported Expense',
      }),
    ])
    expect(await incomeRepository.findAll()).toEqual([
      expect.objectContaining({
        id: 88,
        source: 'Salary',
      }),
    ])
    expect(await categoryRepository.findAll()).toHaveLength(9)
    expect(await settingsRepository.getSettings()).toMatchObject({
      id: DEFAULT_SETTINGS_ID,
      currency: 'PHP',
    })
  })

  it('resets local data and reseeds defaults', async () => {
    await seedDatabase()
    await expenseRepository.create({
      amount: 300,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Temporary',
      note: null,
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    await settingsService.resetLocalData()

    expect(await expenseRepository.findAll()).toHaveLength(0)
    expect(await categoryRepository.findAll()).toHaveLength(9)
    expect(await settingsRepository.getSettings()).toMatchObject({
      id: DEFAULT_SETTINGS_ID,
      currency: 'PHP',
    })
  })
})
