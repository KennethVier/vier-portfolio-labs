import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSettingsStore } from '@/app/settingsStore.js'
import { db } from '@/lib/db/dexie.js'
import { clearDatabase } from '@/lib/db/devTools.js'
import { APPROVED_STORE_NAMES, DEFAULT_SETTINGS_ID } from '@/lib/db/schema.js'
import { seedDatabase } from '@/lib/db/seed.js'
import {
  categoryRepository,
  expenseRepository,
  incomeRepository,
  merchantRuleRepository,
  savingsRepository,
  settingsRepository,
} from '@/lib/db/repositories/index.js'

import {
  IMPORT_MODES,
  normalizeSettings,
  settingsService,
  settingsServiceInternals,
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

async function snapshotAllStores() {
  const stores = {}
  for (const name of APPROVED_STORE_NAMES) {
    stores[name] = await db.table(name).toArray()
  }
  return stores
}

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

    await settingsService.importBackupData(
      {
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
      },
      { mode: 'selective' },
    )

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

  // --------------------------------------------------------------------------
  // MANDATORY SAFETY CONTRACT REGRESSION TESTS
  // --------------------------------------------------------------------------
  function createCompleteTestBackup(overrides = {}) {
    const stores = {}
    APPROVED_STORE_NAMES.forEach((name) => {
      stores[name] = []
    })
    const { stores: overrideStores, ...otherOverrides } = overrides
    return {
      app: 'PesoPilot',
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        ...stores,
        ...(overrideStores || {}),
      },
      ...otherOverrides,
    }
  }

  it('1. restores a valid complete PesoPilot backup successfully', async () => {
    await seedDatabase()
    await expenseRepository.create({
      amount: 450,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-25',
      merchant: 'Jollibee Original',
      note: 'Pre-export',
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
    })

    const exportedBackup = await settingsService.buildBackupData()

    // Mutate local state
    await expenseRepository.create({
      amount: 9999,
      categoryId: 'shopping',
      cutoffId: 1,
      date: '2026-06-26',
      merchant: 'Unwanted Expense',
      note: 'Should be overwritten',
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-26T00:00:00.000Z',
      updatedAt: '2026-06-26T00:00:00.000Z',
    })

    const result = await settingsService.importBackupData(exportedBackup, {
      requireComplete: true,
    })

    expect(result.importedStores).toEqual(
      expect.arrayContaining([...APPROVED_STORE_NAMES]),
    )
    const expenses = await expenseRepository.findAll()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].merchant).toBe('Jollibee Original')
  })

  it('2. rejects an invalid app name', () => {
    const backup = createCompleteTestBackup({ app: 'NotPesoPilot' })
    expect(() => settingsService.validateBackupData(backup)).toThrow(
      'Application must be "PesoPilot"',
    )
  })

  it('3. rejects a missing app identity', () => {
    const backup = createCompleteTestBackup()
    delete backup.app
    expect(() => settingsService.validateBackupData(backup)).toThrow(
      'Application must be "PesoPilot"',
    )
  })

  it('4. rejects a missing backup version', () => {
    const backup = createCompleteTestBackup()
    delete backup.version
    expect(() => settingsService.validateBackupData(backup)).toThrow(
      'Unsupported backup version',
    )
  })

  it('5. rejects an unsupported or future backup version', () => {
    const backupV2 = createCompleteTestBackup({ version: 2 })
    expect(() => settingsService.validateBackupData(backupV2)).toThrow(
      'Unsupported backup version: 2',
    )
    const backupV0 = createCompleteTestBackup({ version: 0 })
    expect(() => settingsService.validateBackupData(backupV0)).toThrow(
      'Unsupported backup version: 0',
    )
  })

  it('6. rejects an empty backup with { stores: {} }', () => {
    expect(() =>
      settingsService.validateBackupData({
        app: 'PesoPilot',
        version: 1,
        stores: {},
      }),
    ).toThrow('No recognized PesoPilot stores found')

    expect(() =>
      settingsService.validateBackupData({ stores: {} }),
    ).toThrow('Invalid backup file')
  })

  it('7. rejects missing required stores for full replacement', () => {
    const partialBackup = {
      app: 'PesoPilot',
      version: 1,
      stores: {
        expenses: [],
        income: [],
      },
    }

    expect(() =>
      settingsService.validateBackupData(partialBackup, {
        requireComplete: true,
      }),
    ).toThrow('Missing required stores for full replacement')
  })

  it('8. rejects malformed recognized stores and malformed records', () => {
    // Non-array store
    expect(() =>
      settingsService.validateBackupData(
        createCompleteTestBackup({
          stores: { expenses: 'invalid-string' },
        }),
      ),
    ).toThrow('Store "expenses" must be an array')

    // Null record inside store array
    expect(() =>
      settingsService.validateBackupData(
        createCompleteTestBackup({
          stores: { expenses: [null] },
        }),
      ),
    ).toThrow('Record at index 0 in store "expenses" must be a valid object')

    // Primitive record inside store array
    expect(() =>
      settingsService.validateBackupData(
        createCompleteTestBackup({
          stores: { expenses: ['not-an-object'] },
        }),
      ),
    ).toThrow('Record at index 0 in store "expenses" must be a valid object')
  })

  it('9. accepts legitimately empty expense and savings arrays in a complete valid backup', async () => {
    const emptyCompleteBackup = createCompleteTestBackup({
      stores: {
        expenses: [],
        savings: [],
      },
    })

    expect(
      settingsService.validateBackupData(emptyCompleteBackup, {
        requireComplete: true,
      }),
    ).toBe(true)

    await seedDatabase()
    await settingsService.importBackupData(emptyCompleteBackup, {
      requireComplete: true,
    })

    expect(await expenseRepository.findAll()).toHaveLength(0)
    expect(await savingsRepository.findAll()).toHaveLength(0)
    expect(await categoryRepository.findAll()).toHaveLength(9)
  })

  it('10. handles unknown stores safely according to compatibility policy', async () => {
    await seedDatabase()
    const backupWithUnknown = createCompleteTestBackup({
      stores: {
        unknown_experimental_table: [{ id: 999, data: 'future_data' }],
      },
    })

    expect(
      settingsService.validateBackupData(backupWithUnknown, {
        requireComplete: true,
      }),
    ).toBe(true)

    const result = await settingsService.importBackupData(backupWithUnknown, {
      requireComplete: true,
    })

    expect(result.importedStores).not.toContain('unknown_experimental_table')
    expect(result.importedStores).toEqual(
      expect.arrayContaining([...APPROVED_STORE_NAMES]),
    )
  })

  it('11. preserves original financial records intact after every rejected import attempt', async () => {
    await seedDatabase()
    await expenseRepository.create({
      amount: 1234,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-20',
      merchant: 'Persistent Merchant',
      note: 'Must survive rejected imports',
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    })

    // Attempt 1: Empty stores
    await expect(
      settingsService.importBackupData({ stores: {} }),
    ).rejects.toThrow()

    // Attempt 2: Wrong app
    await expect(
      settingsService.importBackupData({
        app: 'EvilApp',
        version: 1,
        stores: { expenses: [] },
      }),
    ).rejects.toThrow()

    // Attempt 3: Malformed record
    await expect(
      settingsService.importBackupData(
        createCompleteTestBackup({
          stores: { expenses: [null] },
        }),
      ),
    ).rejects.toThrow()

    // Verify record remains 100% intact
    const expenses = await expenseRepository.findAll()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].merchant).toBe('Persistent Merchant')
    expect(expenses[0].amount).toBe(1234)
  })

  it('12. replaces records correctly during valid full import', async () => {
    await seedDatabase()
    await expenseRepository.create({
      amount: 100,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Old Expense To Be Replaced',
      note: null,
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const newBackup = createCompleteTestBackup({
      stores: {
        expenses: [
          {
            id: 901,
            amount: 777,
            categoryId: 'bills',
            cutoffId: 1,
            date: '2026-06-15',
            merchant: 'Replacement Merchant',
            note: 'Fresh data',
            paymentMethod: 'Cash',
            source: 'manual',
            createdAt: '2026-06-15T00:00:00.000Z',
            updatedAt: '2026-06-15T00:00:00.000Z',
          },
        ],
      },
    })

    await settingsService.importBackupData(newBackup, {
      requireComplete: true,
    })

    const expenses = await expenseRepository.findAll()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].id).toBe(901)
    expect(expenses[0].merchant).toBe('Replacement Merchant')
    expect(expenses[0].amount).toBe(777)
  })

  it('13. rolls back without partial data loss when a transaction fails', async () => {
    await seedDatabase()
    await expenseRepository.create({
      amount: 500,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Original Protected Expense',
      note: null,
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const newBackup = createCompleteTestBackup({
      stores: {
        expenses: [
          {
            id: 999,
            amount: 1200,
            categoryId: 'food',
            cutoffId: 1,
            date: '2026-06-02',
            merchant: 'Should Fail BulkPut',
            note: null,
            paymentMethod: 'Cash',
            source: 'manual',
            createdAt: '2026-06-02T00:00:00.000Z',
            updatedAt: '2026-06-02T00:00:00.000Z',
          },
        ],
      },
    })

    // Mock bulkPut on expenses to throw inside the transaction
    const bulkPutSpy = vi
      .spyOn(db.table('expenses'), 'bulkPut')
      .mockImplementationOnce(() => {
        throw new Error('Simulated Database Write Failure')
      })

    try {
      await expect(
        settingsService.importBackupData(newBackup, { requireComplete: true }),
      ).rejects.toThrow('Simulated Database Write Failure')
    } finally {
      bulkPutSpy.mockRestore()
    }

    // Verify original expense was NOT cleared because transaction rolled back
    const expenses = await expenseRepository.findAll()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].merchant).toBe('Original Protected Expense')
    expect(expenses[0].amount).toBe(500)
  })

  it('14. preserves historical savings goalId values across export and restore', async () => {
    await seedDatabase()
    await savingsRepository.create({
      amount: 15000,
      cutoffId: 1,
      date: '2026-06-10',
      goalId: 889900,
      note: 'Contribution to historical Goal 889900',
      source: 'Emergency Fund',
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z',
    })

    const exported = await settingsService.buildBackupData()
    expect(exported.stores.savings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: 889900,
          amount: 15000,
        }),
      ]),
    )

    // Clear and restore
    await clearDatabase()
    await settingsService.importBackupData(exported, { requireComplete: true })

    const restoredSavings = await savingsRepository.findAll()
    expect(restoredSavings).toHaveLength(1)
    expect(restoredSavings[0].goalId).toBe(889900)
    expect(restoredSavings[0].amount).toBe(15000)
  })

  it('15. ensures no destructive database operation occurs before validation succeeds', async () => {
    await seedDatabase()
    await expenseRepository.create({
      amount: 888,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Safeguarded Expense',
      note: null,
      paymentMethod: 'Cash',
      source: 'manual',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const clearSpy = vi.spyOn(db.table('expenses'), 'clear')

    try {
      // Invalid app name
      await expect(
        settingsService.importBackupData({
          app: 'InvalidIdentity',
          version: 1,
          stores: { expenses: [] },
        }),
      ).rejects.toThrow('Application must be "PesoPilot"')

      // Clear was NEVER called
      expect(clearSpy).not.toHaveBeenCalled()
    } finally {
      clearSpy.mockRestore()
    }

    const expenses = await expenseRepository.findAll()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].merchant).toBe('Safeguarded Expense')
  })

  // --------------------------------------------------------------------------
  // FINDING 1 — IMPORT MODE SAFETY REGRESSION TESTS
  // --------------------------------------------------------------------------
  describe('Finding 1 — Import mode safety', () => {
    it('1. omitted import options default to full replacement and succeed with complete backup', async () => {
      await seedDatabase()
      const completeBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 101,
              amount: 50,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-01',
              merchant: 'Full Test',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      })

      // Options completely omitted
      const result = await settingsService.importBackupData(completeBackup)
      expect(result.importedStores).toEqual(
        expect.arrayContaining([...APPROVED_STORE_NAMES]),
      )
      expect(await expenseRepository.findAll()).toEqual([
        expect.objectContaining({ id: 101, merchant: 'Full Test' }),
      ])
    })

    it('2. an incomplete backup with omitted options is rejected', async () => {
      await seedDatabase()
      const incompleteBackup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [],
        },
      }

      await expect(
        settingsService.importBackupData(incompleteBackup),
      ).rejects.toThrow('Missing required stores for full replacement')
    })

    it('3. no existing records change when that rejection occurs', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 850,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-15',
        merchant: 'Safe Original Expense',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-15T00:00:00.000Z',
        updatedAt: '2026-06-15T00:00:00.000Z',
      })

      const incompleteBackup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [{ id: 999, amount: 10, merchant: 'Should Not Import' }],
        },
      }

      await expect(
        settingsService.importBackupData(incompleteBackup),
      ).rejects.toThrow()

      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Safe Original Expense')
      expect(expenses[0].amount).toBe(850)
    })

    it('4. explicit full replacement requires all approved stores', async () => {
      const incompleteBackup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [],
          income: [],
        },
      }

      expect(() =>
        settingsService.validateBackupData(incompleteBackup, { mode: IMPORT_MODES.FULL }),
      ).toThrow('Missing required stores for full replacement')

      await expect(
        settingsService.importBackupData(incompleteBackup, { mode: IMPORT_MODES.FULL }),
      ).rejects.toThrow('Missing required stores for full replacement')
    })

    it('5. explicit selective mode works', async () => {
      await seedDatabase()
      const selectiveBackup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [
            {
              id: 201,
              amount: 120,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-05',
              merchant: 'Selective Coffee',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      }

      const result = await settingsService.importBackupData(selectiveBackup, {
        mode: IMPORT_MODES.SELECTIVE,
      })

      expect(result.importedStores).toEqual(['expenses'])
      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Selective Coffee')
    })

    it('6. selective import preserves all omitted stores', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 300,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Old Expense',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await incomeRepository.create({
        amount: 50000,
        cutoffId: 1,
        date: '2026-06-01',
        source: 'Main Salary',
        note: 'Preserve me',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await savingsRepository.create({
        amount: 10000,
        cutoffId: 1,
        date: '2026-06-01',
        goalId: 12345,
        note: 'Savings preservation',
        source: 'Bank',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      const selectiveBackup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [
            {
              id: 555,
              amount: 99,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-10',
              merchant: 'New Selective Expense',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      }

      await settingsService.importBackupData(selectiveBackup, {
        mode: IMPORT_MODES.SELECTIVE,
      })

      // Expenses was replaced
      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('New Selective Expense')

      // Income and savings were omitted and preserved
      const income = await incomeRepository.findAll()
      expect(income).toHaveLength(1)
      expect(income[0].source).toBe('Main Salary')

      const savings = await savingsRepository.findAll()
      expect(savings).toHaveLength(1)
      expect(savings[0].goalId).toBe(12345)
    })

    it('7. unknown mode is rejected', async () => {
      const backup = createCompleteTestBackup()
      expect(() =>
        settingsService.validateBackupData(backup, { mode: 'invalid_mode' }),
      ).toThrow('Unsupported import mode: "invalid_mode"')

      await expect(
        settingsService.importBackupData(backup, { mode: 'invalid_mode' }),
      ).rejects.toThrow('Unsupported import mode: "invalid_mode"')
    })

    it('8. unknown-only selective import is rejected', async () => {
      const unknownOnlyBackup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          future_table: [{ id: 1, val: 'foo' }],
        },
      }

      expect(() =>
        settingsService.validateBackupData(unknownOnlyBackup, {
          mode: IMPORT_MODES.SELECTIVE,
        }),
      ).toThrow('No recognized PesoPilot stores found')

      await expect(
        settingsService.importBackupData(unknownOnlyBackup, {
          mode: IMPORT_MODES.SELECTIVE,
        }),
      ).rejects.toThrow('No recognized PesoPilot stores found')
    })

    it('9. historical savings goalId survives when its store is omitted', async () => {
      await seedDatabase()
      await savingsRepository.create({
        amount: 25000,
        cutoffId: 1,
        date: '2026-06-01',
        goalId: 998877,
        note: 'Crucial historical goalId',
        source: 'Emergency Fund',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      const backupWithoutSavings = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [
            {
              id: 1,
              amount: 50,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-02',
              merchant: 'Lunch',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      }

      await settingsService.importBackupData(backupWithoutSavings, {
        mode: IMPORT_MODES.SELECTIVE,
      })

      const savings = await savingsRepository.findAll()
      expect(savings).toHaveLength(1)
      expect(savings[0].goalId).toBe(998877)
      expect(savings[0].amount).toBe(25000)
    })

    it('10. all existing legitimate backup functionality remains intact', async () => {
      await seedDatabase()
      const exported = await settingsService.buildBackupData()
      expect(exported.app).toBe('PesoPilot')
      expect(exported.version).toBe(1)
      expect(Object.keys(exported.stores).sort()).toEqual(
        [...APPROVED_STORE_NAMES].sort(),
      )

      const importResult = await settingsService.importBackupData(exported)
      expect(importResult.importedStores).toEqual(
        expect.arrayContaining([...APPROVED_STORE_NAMES]),
      )
    })
  })

  // --------------------------------------------------------------------------
  // FINDING 2 — ATOMICITY AND FAILURE INJECTION TESTS
  // --------------------------------------------------------------------------
  describe('Finding 2 — Atomicity and failure injection', () => {
    it('1. valid full replacement succeeds', async () => {
      await seedDatabase()
      const newBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 701,
              amount: 450,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-15',
              merchant: 'Replacement Merchant',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      })

      const result = await settingsService.importBackupData(newBackup)
      expect(result.importedStores).toEqual(
        expect.arrayContaining([...APPROVED_STORE_NAMES]),
      )
      const expenses = await expenseRepository.findAll()
      expect(expenses).toEqual([
        expect.objectContaining({ id: 701, merchant: 'Replacement Merchant' }),
      ])
    })

    it('2. required default initialization succeeds within the transaction', async () => {
      // Complete backup with empty categories, merchant rules, and settings
      const emptyDefaultsBackup = createCompleteTestBackup({
        stores: {
          categories: [],
          merchant_rules: [],
          settings: [],
        },
      })

      await settingsService.importBackupData(emptyDefaultsBackup)
      expect(await categoryRepository.findAll()).toHaveLength(9)
      expect(await merchantRuleRepository.findAll()).toHaveLength(13)
      expect(await settingsRepository.getSettings()).toMatchObject({
        id: DEFAULT_SETTINGS_ID,
        currency: 'PHP',
      })
    })

    it('3. failure before data replacement leaves records unchanged', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 555,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-10',
        merchant: 'Original Pre-Failure',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-10T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
      })

      await expect(
        settingsService.importBackupData({
          app: 'WrongApp',
          version: 1,
          stores: {},
        }),
      ).rejects.toThrow()

      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Original Pre-Failure')
      expect(expenses[0].amount).toBe(555)
    })

    it('4. failure during bulkPut rolls back without partial data mutation', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 800,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Rollback Protected Expense',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      const validBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 999,
              amount: 200,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-02',
              merchant: 'Never Committed',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      })

      const spy = vi
        .spyOn(db.table('expenses'), 'bulkPut')
        .mockImplementationOnce(() => {
          throw new Error('Simulated bulkPut Write Failure')
        })

      try {
        await expect(
          settingsService.importBackupData(validBackup),
        ).rejects.toThrow('Simulated bulkPut Write Failure')
      } finally {
        spy.mockRestore()
      }

      // Rollback assertion: original record remains
      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Rollback Protected Expense')
      expect(expenses[0].amount).toBe(800)
    })

    it('5. failure during required default initialization rolls back within the transaction', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 1500,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Protected From Init Failure',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      const beforeSnapshot = await snapshotAllStores()

      const validBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 888,
              amount: 99,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-02',
              merchant: 'Should Roll Back',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      })

      // Simulate failure during settings.put inside ensureDefaultsWithinTransaction in transaction
      const settingsPutSpy = vi
        .spyOn(db.settings, 'put')
        .mockImplementationOnce(() => {
          throw new Error('Simulated Settings Initialization Failure')
        })

      try {
        await expect(
          settingsService.importBackupData(validBackup),
        ).rejects.toThrow('Simulated Settings Initialization Failure')
      } finally {
        settingsPutSpy.mockRestore()
      }

      // Assert entire transaction rolled back: original expense remains untouched
      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Protected From Init Failure')
      expect(expenses[0].amount).toBe(1500)
      expect(await snapshotAllStores()).toEqual(beforeSnapshot)
    })

    it('6. post-commit zustand synchronization failure reports committed: true with syncWarning and preserves database records', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 500,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Old Expense To Be Overwritten',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      const completeBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 444,
              amount: 60,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-01',
              merchant: 'Committed Cleanly',
              paymentMethod: 'Cash',
              source: 'manual',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
      })

      const setSettingsSpy = vi
        .spyOn(useSettingsStore.getState(), 'setSettings')
        .mockImplementationOnce(() => {
          throw new Error('Simulated Zustand Sync Failure')
        })

      try {
        const result = await settingsService.importBackupData(completeBackup)
        expect(result.committed).toBe(true)
        expect(result.syncWarning).toBe('Simulated Zustand Sync Failure')
        expect(result.settings).toBeDefined()
        expect(result.importedStores).toHaveLength(13)

        // Assert database records: imported records remain present, old records removed
        const expenses = await expenseRepository.findAll()
        expect(expenses).toHaveLength(1)
        expect(expenses[0].merchant).toBe('Committed Cleanly')
        expect(expenses[0].amount).toBe(60)
      } finally {
        setSettingsSpy.mockRestore()
      }
    })

    it('7. Zustand settings state corresponds to the committed database state', async () => {
      await seedDatabase()
      const completeBackup = createCompleteTestBackup({
        stores: {
          settings: [
            { id: DEFAULT_SETTINGS_ID, currency: 'USD', theme: 'dark' },
          ],
        },
      })

      await settingsService.importBackupData(completeBackup)

      const dbSettings = await settingsRepository.getSettings()
      expect(dbSettings.currency).toBe('USD')
      expect(dbSettings.theme).toBe('dark')

      const memorySettings = useSettingsStore.getState().settings
      expect(memorySettings.currency).toBe('USD')
      expect(memorySettings.theme).toBe('dark')
    })

    it('8. failed import rejects before commit and never reports success or committed state', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 350,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Protected From Failed Import',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      // Pre-commit validation failure
      await expect(
        settingsService.importBackupData({
          app: 'InvalidApp',
          version: 1,
          stores: { expenses: [] },
        }),
      ).rejects.toThrow('Application must be "PesoPilot"')

      // Transaction failure
      const failingBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 99,
              amount: 100,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-01',
              merchant: 'Never Inserted',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      })

      const bulkPutSpy = vi
        .spyOn(db.table('expenses'), 'bulkPut')
        .mockImplementationOnce(() => {
          throw new Error('Simulated DB Insertion Failure')
        })

      try {
        await expect(
          settingsService.importBackupData(failingBackup),
        ).rejects.toThrow('Simulated DB Insertion Failure')
      } finally {
        bulkPutSpy.mockRestore()
      }

      // Existing records remain 100% untouched
      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Protected From Failed Import')
    })

    it('9. successful import returns committed: true with null syncWarning and replaces data cleanly', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 100,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Original Expense',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      const completeBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 777,
              amount: 999,
              categoryId: 'bills',
              cutoffId: 1,
              date: '2026-06-15',
              merchant: 'Successfully Imported Expense',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      })

      const result = await settingsService.importBackupData(completeBackup)
      expect(result.committed).toBe(true)
      expect(result.syncWarning).toBeNull()
      expect(result.settings).toBeDefined()

      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Successfully Imported Expense')
      expect(expenses[0].amount).toBe(999)
    })

    it('10. financial totals and historical savings references remain correct', async () => {
      await seedDatabase()
      await savingsRepository.create({
        amount: 35000,
        cutoffId: 1,
        date: '2026-06-01',
        goalId: 777666,
        note: 'Untouched savings',
        source: 'Emergency Fund',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      // Attempt failing import with non-empty expenses to trigger bulkPut
      const failingBackup = createCompleteTestBackup({
        stores: {
          expenses: [
            {
              id: 99,
              amount: 100,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-01',
              merchant: 'Test',
              paymentMethod: 'Cash',
              source: 'manual',
            },
          ],
        },
      })

      const spy = vi
        .spyOn(db.table('expenses'), 'bulkPut')
        .mockImplementationOnce(() => {
          throw new Error('Forced failure')
        })

      try {
        await expect(
          settingsService.importBackupData(failingBackup),
        ).rejects.toThrow('Forced failure')
      } finally {
        spy.mockRestore()
      }

      const allSavings = await savingsRepository.findAll()
      expect(allSavings).toHaveLength(1)
      expect(allSavings[0].amount).toBe(35000)
      expect(allSavings[0].goalId).toBe(777666)
    })
  })

  // --------------------------------------------------------------------------
  // FINDING 4 — IMPORT SUMMARY AND UNKNOWN STORE EXCLUSION
  // --------------------------------------------------------------------------
  describe('Finding 4 — Import summary and unknown store filtering', () => {
    it('counts only recognized stores and safely ignores unknown stores in backup', async () => {
      await seedDatabase()

      // Valid backup with all 13 recognized stores and 1 unknown store
      const backupWithUnknown = createCompleteTestBackup({
        stores: {
          experimental_future_store: [{ id: 1, data: 'ignored' }],
        },
      })

      // 14 total store keys in the backup file
      expect(Object.keys(backupWithUnknown.stores)).toHaveLength(14)

      // Participating recognized stores must count exactly 13
      const participatingStoreCount = Object.keys(backupWithUnknown.stores).filter(
        (storeName) => APPROVED_STORE_NAMES.includes(storeName),
      ).length
      expect(participatingStoreCount).toBe(13)

      // Service imports only the 13 approved stores and ignores unknown
      const result = await settingsService.importBackupData(backupWithUnknown)
      expect(result.importedStores).toHaveLength(13)
      expect(result.importedStores).not.toContain('experimental_future_store')
      expect(result.importedStores).toEqual(
        expect.arrayContaining([...APPROVED_STORE_NAMES]),
      )
    })
  })

  // --------------------------------------------------------------------------
  // FINDING 2 — SELECTIVE IMPORT STORE VALIDATION & INTEGRITY
  // --------------------------------------------------------------------------
  describe('Finding 2 — Selective import store validation', () => {
    async function seedAll13Stores() {
      await seedDatabase()
      await db.income.put({
        id: 1,
        amount: 30000,
        cutoffId: 1,
        date: '2026-06-01',
        source: 'Primary Job',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.expenses.put({
        id: 1,
        amount: 450,
        cutoffId: 1,
        categoryId: 'food',
        merchant: 'Initial Expense',
        paymentMethod: 'Cash',
        source: 'manual',
        date: '2026-06-01',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.savings.put({
        id: 1,
        amount: 5000,
        cutoffId: 1,
        goalId: 888,
        date: '2026-06-01',
        source: 'Bank',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.savings_goals.put({
        id: 888,
        name: 'Emergency Fund Goal',
        targetAmount: 100000,
        status: 'active',
        priority: 'high',
        targetDate: '2026-12-31',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.salary_cutoffs.put({
        id: 1,
        type: 'semi_monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.budgets.put({
        id: 1,
        cutoffId: 1,
        categoryId: 'food',
        limit: 8000,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.detected_expenses.put({
        id: 1,
        status: 'pending',
        merchant: 'SMS Detection Grab',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.ai_insights.put({
        id: 1,
        type: 'cashflow',
        cutoffId: 1,
        content: 'Healthy cashflow trajectory',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.cashflow_snapshots.put({
        id: 1,
        cutoffId: 1,
        totalIncome: 30000,
        totalExpenses: 450,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.budget_shock_alerts.put({
        id: 1,
        cutoffId: 1,
        level: 'normal',
        message: 'No shock detected',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
    }

    async function captureAll13StoresSnapshot() {
      const snapshot = {}
      for (const name of APPROVED_STORE_NAMES) {
        snapshot[name] = await db.table(name).toArray()
      }
      return snapshot
    }

    it('rejects selective import when an explicitly selected store is missing from backup and leaves database intact', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      // Backup contains expenses, but options select income
      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [],
        },
      }

      const options = {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['income'],
      }

      expect(() =>
        settingsService.validateBackupData(backup, options),
      ).toThrow('Selected store "income" is missing from backup')

      await expect(
        settingsService.importBackupData(backup, options),
      ).rejects.toThrow('Selected store "income" is missing from backup')

      // All 13 stores remain byte-for-byte identical, income was NOT cleared
      const afterSnapshot = await captureAll13StoresSnapshot()
      expect(afterSnapshot).toEqual(beforeSnapshot)
    })

    it('rejects selective import when selected store payload is not an array', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          income: 'invalid-string-not-an-array',
        },
      }

      const options = {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['income'],
      }

      expect(() =>
        settingsService.validateBackupData(backup, options),
      ).toThrow('Store "income" must be an array')

      await expect(
        settingsService.importBackupData(backup, options),
      ).rejects.toThrow('Store "income" must be an array')

      const afterSnapshot = await captureAll13StoresSnapshot()
      expect(afterSnapshot).toEqual(beforeSnapshot)
    })

    it('accepts selective import with an explicitly present empty array and intentionally clears only that store', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [],
        },
      }

      const options = {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['expenses'],
      }

      const result = await settingsService.importBackupData(backup, options)
      expect(result.committed).toBe(true)
      expect(result.importedStores).toEqual(['expenses'])

      // Expenses was intentionally cleared
      expect(await db.expenses.toArray()).toHaveLength(0)

      // All 12 unselected stores remain completely untouched
      for (const storeName of APPROVED_STORE_NAMES) {
        if (storeName !== 'expenses') {
          const after = await db.table(storeName).toArray()
          expect(after).toEqual(beforeSnapshot[storeName])
        }
      }
    })

    it('rejects mixed valid and missing selections before modifying any store', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [
            {
              id: 99,
              amount: 50,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-01',
              merchant: 'New Expense',
              paymentMethod: 'Cash',
              source: 'manual',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
      }

      const options = {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['expenses', 'income'], // income is missing from backup
      }

      expect(() =>
        settingsService.validateBackupData(backup, options),
      ).toThrow('Selected store "income" is missing from backup')

      await expect(
        settingsService.importBackupData(backup, options),
      ).rejects.toThrow('Selected store "income" is missing from backup')

      // Both expenses and income and all other stores remain completely intact
      const afterSnapshot = await captureAll13StoresSnapshot()
      expect(afterSnapshot).toEqual(beforeSnapshot)
    })

    it('rejects selective import with unapproved store selection before starting transaction', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [],
          unknown_store: [],
        },
      }

      const options = {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['unknown_store'],
      }

      expect(() =>
        settingsService.validateBackupData(backup, options),
      ).toThrow('Selected store "unknown_store" is not a recognized PesoPilot store')

      await expect(
        settingsService.importBackupData(backup, options),
      ).rejects.toThrow('Selected store "unknown_store" is not a recognized PesoPilot store')

      const afterSnapshot = await captureAll13StoresSnapshot()
      expect(afterSnapshot).toEqual(beforeSnapshot)
    })
  })

  // --------------------------------------------------------------------------
  // FINDING 3 — STRICT SELECTIVE IMPORT BOUNDARIES
  // --------------------------------------------------------------------------
  describe('Finding 3 — Selective import unselected store boundary preservation', () => {
    async function seedAll13Stores() {
      await seedDatabase()
      await db.income.put({
        id: 1,
        amount: 25000,
        cutoffId: 1,
        date: '2026-06-01',
        source: 'Base Salary',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.expenses.put({
        id: 1,
        amount: 300,
        cutoffId: 1,
        categoryId: 'food',
        merchant: 'Base Expense',
        paymentMethod: 'Cash',
        source: 'manual',
        date: '2026-06-01',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.savings.put({
        id: 1,
        amount: 4000,
        cutoffId: 1,
        goalId: 777,
        date: '2026-06-01',
        source: 'Bank',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.savings_goals.put({
        id: 777,
        name: 'Tuition Goal',
        targetAmount: 50000,
        status: 'active',
        priority: 'high',
        targetDate: '2026-12-31',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.salary_cutoffs.put({
        id: 1,
        type: 'semi_monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.budgets.put({
        id: 1,
        cutoffId: 1,
        categoryId: 'food',
        limit: 6000,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.detected_expenses.put({
        id: 1,
        status: 'pending',
        merchant: 'SMS Detection Maya',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.ai_insights.put({
        id: 1,
        type: 'cashflow',
        cutoffId: 1,
        content: 'Snapshot insight',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.cashflow_snapshots.put({
        id: 1,
        cutoffId: 1,
        totalIncome: 25000,
        totalExpenses: 300,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
      await db.budget_shock_alerts.put({
        id: 1,
        cutoffId: 1,
        level: 'normal',
        message: 'No shock',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })
    }

    async function captureAll13StoresSnapshot() {
      const snapshot = {}
      for (const name of APPROVED_STORE_NAMES) {
        snapshot[name] = await db.table(name).toArray()
      }
      return snapshot
    }

    it('selectively importing expenses only leaves all 12 other stores byte-for-byte identical', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      // Codex reproduction scenario: importing expenses only
      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [
            {
              id: 901,
              amount: 199,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-05',
              merchant: 'Only Expenses Selective',
              paymentMethod: 'Cash',
              source: 'manual',
              createdAt: '2026-06-05T00:00:00.000Z',
              updatedAt: '2026-06-05T00:00:00.000Z',
            },
          ],
        },
      }

      await settingsService.importBackupData(backup, {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['expenses'],
      })

      // Verify expenses replaced
      const expenses = await db.expenses.toArray()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].id).toBe(901)
      expect(expenses[0].merchant).toBe('Only Expenses Selective')

      // Verify every single unselected store is byte-for-byte identical
      for (const storeName of APPROVED_STORE_NAMES) {
        if (storeName !== 'expenses') {
          const after = await db.table(storeName).toArray()
          expect(after).toEqual(beforeSnapshot[storeName])
        }
      }

      // Explicitly check categories, merchant_rules, settings
      expect(await db.categories.toArray()).toHaveLength(beforeSnapshot.categories.length)
      expect(await db.merchant_rules.toArray()).toHaveLength(beforeSnapshot.merchant_rules.length)
      expect(await db.settings.toArray()).toEqual(beforeSnapshot.settings)
    })

    it('selectively importing categories only updates categories and leaves other 12 stores untouched', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          categories: [
            {
              id: 'custom-cat-1',
              name: 'Custom Category',
              type: 'expense',
              icon: 'tag',
              color: '#123456',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
      }

      await settingsService.importBackupData(backup, {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['categories'],
      })

      // Categories updated (contains custom category + required missing defaults inserted)
      const categories = await db.categories.toArray()
      expect(categories.some((c) => c.id === 'custom-cat-1')).toBe(true)

      // All 12 other stores remain 100% untouched
      for (const storeName of APPROVED_STORE_NAMES) {
        if (storeName !== 'categories') {
          const after = await db.table(storeName).toArray()
          expect(after).toEqual(beforeSnapshot[storeName])
        }
      }
    })

    it('selectively importing merchant_rules only updates rules and leaves other 12 stores untouched', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          merchant_rules: [
            {
              id: 999,
              keyword: 'CustomMerchant',
              categoryId: 'food',
              confidence: 1,
              createdBy: 'user',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
      }

      await settingsService.importBackupData(backup, {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['merchant_rules'],
      })

      const rules = await db.merchant_rules.toArray()
      expect(rules.some((r) => r.keyword === 'CustomMerchant')).toBe(true)

      // All 12 other stores remain 100% untouched
      for (const storeName of APPROVED_STORE_NAMES) {
        if (storeName !== 'merchant_rules') {
          const after = await db.table(storeName).toArray()
          expect(after).toEqual(beforeSnapshot[storeName])
        }
      }
    })

    it('selectively importing settings only updates settings and leaves other 12 stores untouched', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          settings: [
            {
              id: DEFAULT_SETTINGS_ID,
              currency: 'USD',
              theme: 'dark',
              density: 'comfortable',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
      }

      await settingsService.importBackupData(backup, {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['settings'],
      })

      const currentSettings = await db.settings.get(DEFAULT_SETTINGS_ID)
      expect(currentSettings.currency).toBe('USD')
      expect(currentSettings.theme).toBe('dark')

      // All 12 other stores remain 100% untouched
      for (const storeName of APPROVED_STORE_NAMES) {
        if (storeName !== 'settings') {
          const after = await db.table(storeName).toArray()
          expect(after).toEqual(beforeSnapshot[storeName])
        }
      }
    })

    it('selectively importing multiple stores updates only selected stores and preserves all others', async () => {
      await seedAll13Stores()
      const beforeSnapshot = await captureAll13StoresSnapshot()

      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          income: [
            {
              id: 77,
              amount: 60000,
              cutoffId: 1,
              date: '2026-06-01',
              source: 'New Consulting',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
          expenses: [
            {
              id: 88,
              amount: 1200,
              cutoffId: 1,
              categoryId: 'bills',
              merchant: 'Fiber Internet',
              paymentMethod: 'Cash',
              source: 'manual',
              date: '2026-06-01',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
      }

      await settingsService.importBackupData(backup, {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['income', 'expenses'],
      })

      // Verify selected stores updated
      expect(await db.income.toArray()).toHaveLength(1)
      expect((await db.income.toArray())[0].source).toBe('New Consulting')
      expect(await db.expenses.toArray()).toHaveLength(1)
      expect((await db.expenses.toArray())[0].merchant).toBe('Fiber Internet')

      // All 11 other stores remain 100% untouched
      for (const storeName of APPROVED_STORE_NAMES) {
        if (storeName !== 'income' && storeName !== 'expenses') {
          const after = await db.table(storeName).toArray()
          expect(after).toEqual(beforeSnapshot[storeName])
        }
      }
    })
  })

  // --------------------------------------------------------------------------
  // FINDING 4 — IDENTITY-BASED MISSING-DEFAULT INITIALIZATION
  // --------------------------------------------------------------------------
  describe('Finding 4 — Identity-based missing-default initialization', () => {
    it('full restore containing 9 custom categories without food inserts missing food and preserves all 9 custom categories', async () => {
      await seedDatabase()

      // 9 custom categories, none of which have id 'food'
      const customCategories = Array.from({ length: 9 }, (_, index) => ({
        id: `custom-category-${index + 1}`,
        name: `Custom Category ${index + 1}`,
        type: 'expense',
        icon: 'tag',
        color: '#10b981',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      }))

      const backup = createCompleteTestBackup({
        stores: {
          categories: customCategories,
        },
      })

      await settingsService.importBackupData(backup)

      const categories = await db.categories.toArray()
      const categoryIds = new Set(categories.map((c) => c.id))

      // Must have inserted the canonical 'food' default
      expect(categoryIds.has('food')).toBe(true)

      // Must preserve all 9 custom categories
      for (let i = 1; i <= 9; i++) {
        expect(categoryIds.has(`custom-category-${i}`)).toBe(true)
      }

      // Total categories is 9 custom + 9 defaults (or 18 total)
      expect(categories.length).toBeGreaterThanOrEqual(10)
    })

    it('full restore containing 13 custom merchant rules without Jollibee inserts missing Jollibee and preserves all 13 custom rules', async () => {
      await seedDatabase()

      // 13 custom rules, none of which have keyword 'Jollibee'
      const customRules = Array.from({ length: 13 }, (_, index) => ({
        id: index + 1,
        keyword: `CustomStore${index + 1}`,
        categoryId: 'shopping',
        confidence: 1,
        createdBy: 'user',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      }))

      const backup = createCompleteTestBackup({
        stores: {
          merchant_rules: customRules,
        },
      })

      await settingsService.importBackupData(backup)

      const rules = await db.merchant_rules.toArray()
      const keywords = new Set(rules.map((r) => r.keyword?.toLowerCase().trim()))

      // Must have inserted the canonical 'jollibee' default
      expect(keywords.has('jollibee')).toBe(true)

      // Must preserve all 13 custom rules
      for (let i = 1; i <= 13; i++) {
        expect(keywords.has(`customstore${i}`)).toBe(true)
      }
    })

    it('full restore with required defaults already present does not duplicate any records', async () => {
      await seedDatabase()
      const exported = await settingsService.buildBackupData()

      await settingsService.importBackupData(exported)

      const categories = await db.categories.toArray()
      expect(categories).toHaveLength(9)

      const rules = await db.merchant_rules.toArray()
      expect(rules).toHaveLength(13)
    })

    it('mixture of default and custom records inserts only missing defaults and preserves custom records', async () => {
      await seedDatabase()

      // 3 default categories + 2 custom categories
      const mixedCategories = [
        { id: 'food', name: 'Food Custom Label', type: 'expense', icon: 'utensils', color: '#2563eb' },
        { id: 'transport', name: 'Transport', type: 'expense', icon: 'bus', color: '#004ac6' },
        { id: 'bills', name: 'Bills', type: 'expense', icon: 'receipt', color: '#f59e0b' },
        { id: 'custom-hobby', name: 'Hobby', type: 'expense', icon: 'heart', color: '#ec4899' },
        { id: 'custom-invest', name: 'Investments', type: 'savings', icon: 'trending-up', color: '#10b981' },
      ]

      const backup = createCompleteTestBackup({
        stores: {
          categories: mixedCategories,
        },
      })

      await settingsService.importBackupData(backup)

      const categories = await db.categories.toArray()
      const categoryIds = new Set(categories.map((c) => c.id))

      // Preserved custom
      expect(categoryIds.has('custom-hobby')).toBe(true)
      expect(categoryIds.has('custom-invest')).toBe(true)

      // Existing imported food retained its custom name
      const foodCategory = categories.find((c) => c.id === 'food')
      expect(foodCategory.name).toBe('Food Custom Label')

      // Missing defaults (e.g. groceries, shopping, savings, income, emergency, other) were inserted
      expect(categoryIds.has('groceries')).toBe(true)
      expect(categoryIds.has('shopping')).toBe(true)
      expect(categoryIds.has('savings')).toBe(true)
      expect(categoryIds.has('income')).toBe(true)
      expect(categoryIds.has('emergency')).toBe(true)
      expect(categoryIds.has('other')).toBe(true)

      // Exactly 9 defaults + 2 custom = 11 categories
      expect(categories).toHaveLength(11)
    })

    it('repeated default initialization is idempotent and never creates duplicate records', async () => {
      await seedDatabase()

      // Call ensureDefaultsWithinTransaction directly twice
      await db.transaction('rw', db.categories, db.merchant_rules, db.settings, async () => {
        await settingsServiceInternals.ensureDefaultsWithinTransaction(APPROVED_STORE_NAMES)
      })

      await db.transaction('rw', db.categories, db.merchant_rules, db.settings, async () => {
        await settingsServiceInternals.ensureDefaultsWithinTransaction(APPROVED_STORE_NAMES)
      })

      const categories = await db.categories.toArray()
      expect(categories).toHaveLength(9)

      const rules = await db.merchant_rules.toArray()
      expect(rules).toHaveLength(13)
    })

    it('selective import never performs default initialization on unselected stores', async () => {
      await seedDatabase()

      // Delete 'food' category from database to simulate missing default
      await db.categories.delete('food')
      expect(await db.categories.toArray()).toHaveLength(8)

      // Selectively import expenses only
      const backup = {
        app: 'PesoPilot',
        version: 1,
        stores: {
          expenses: [
            {
              id: 99,
              amount: 10,
              categoryId: 'bills',
              cutoffId: 1,
              date: '2026-06-01',
              merchant: 'Test',
              paymentMethod: 'Cash',
              source: 'manual',
              createdAt: '2026-06-01T00:00:00.000Z',
              updatedAt: '2026-06-01T00:00:00.000Z',
            },
          ],
        },
      }

      await settingsService.importBackupData(backup, {
        mode: IMPORT_MODES.SELECTIVE,
        selectedStores: ['expenses'],
      })

      // Categories was unselected: must remain 8, 'food' must NOT have been reseeded!
      const categories = await db.categories.toArray()
      expect(categories).toHaveLength(8)
      expect(categories.some((c) => c.id === 'food')).toBe(false)
    })

    it('failure during category default initialization rolls back entire transaction', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 888,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Protected From Category Init Failure',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      // Backup with missing defaults to trigger categories.bulkPut
      const beforeSnapshot = await snapshotAllStores()

      const backup = createCompleteTestBackup({
        stores: {
          categories: [],
          expenses: [
            {
              id: 900,
              amount: 100,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-02',
              merchant: 'Should Roll Back',
              paymentMethod: 'Cash',
              source: 'manual',
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
          ],
        },
      })

      const categorySpy = vi
        .spyOn(db.categories, 'bulkPut')
        .mockImplementationOnce(() => {
          throw new Error('Simulated Category Initialization Failure')
        })

      try {
        await expect(
          settingsService.importBackupData(backup),
        ).rejects.toThrow('Simulated Category Initialization Failure')
      } finally {
        categorySpy.mockRestore()
      }

      // Assert transaction rolled back: original expense remains
      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Protected From Category Init Failure')
      expect(expenses[0].amount).toBe(888)
      expect(await snapshotAllStores()).toEqual(beforeSnapshot)
    })

    it('failure during merchant rule default initialization rolls back entire transaction', async () => {
      await seedDatabase()
      await expenseRepository.create({
        amount: 999,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-01',
        merchant: 'Protected From Rule Init Failure',
        paymentMethod: 'Cash',
        source: 'manual',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      })

      // Backup with missing defaults to trigger merchant_rules.bulkAdd
      const beforeSnapshot = await snapshotAllStores()

      const backup = createCompleteTestBackup({
        stores: {
          merchant_rules: [],
          expenses: [
            {
              id: 900,
              amount: 100,
              categoryId: 'food',
              cutoffId: 1,
              date: '2026-06-02',
              merchant: 'Should Roll Back',
              paymentMethod: 'Cash',
              source: 'manual',
              createdAt: '2026-06-02T00:00:00.000Z',
              updatedAt: '2026-06-02T00:00:00.000Z',
            },
          ],
        },
      })

      const ruleSpy = vi
        .spyOn(db.merchant_rules, 'bulkAdd')
        .mockImplementationOnce(() => {
          throw new Error('Simulated Merchant Rule Initialization Failure')
        })

      try {
        await expect(
          settingsService.importBackupData(backup),
        ).rejects.toThrow('Simulated Merchant Rule Initialization Failure')
      } finally {
        ruleSpy.mockRestore()
      }

      // Assert transaction rolled back: original expense remains
      const expenses = await expenseRepository.findAll()
      expect(expenses).toHaveLength(1)
      expect(expenses[0].merchant).toBe('Protected From Rule Init Failure')
      expect(expenses[0].amount).toBe(999)
      expect(await snapshotAllStores()).toEqual(beforeSnapshot)
    })
  })
})


describe('Committed import synchronization regressions', () => {
  const replacement = { id: 901, amount: 725, merchant: 'Committed replacement' }

  async function populatedBackup() {
    await seedDatabase()
    for (const name of APPROVED_STORE_NAMES) {
      if (!(await db.table(name).count())) {
        await db.table(name).put({ id: 1, amount: 100, marker: name })
      }
    }
    const stores = await snapshotAllStores()
    stores.expenses = [replacement]
    stores.settings = stores.settings.map(normalizeSettings)
    return { app: 'PesoPilot', version: 1, stores }
  }

  it('guards failed settings read after selective commit and preserves all 13 stores', async () => {
    const backup = await populatedBackup()
    const before = await snapshotAllStores()
    const getSpy = vi.spyOn(db.settings, 'get').mockImplementationOnce(async () => {
      expect(Dexie.currentTransaction).toBeNull()
      expect(await db.expenses.toArray()).toEqual([replacement])
      throw new Error('Post-commit settings read failed')
    })
    const writeSpy = vi.spyOn(db.table('expenses'), 'bulkPut')
    try {
      const result = await settingsService.importBackupData(backup, {
        mode: 'selective', selectedStores: ['expenses'],
      })
      expect(result).toEqual({ committed: true, importedStores: ['expenses'], settings: null,
        syncWarning: 'Post-commit settings read failed' })
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(writeSpy).toHaveBeenCalledTimes(1)
      expect(await snapshotAllStores()).toEqual({ ...before, expenses: [replacement] })
      expect(APPROVED_STORE_NAMES).toHaveLength(13)
    } finally {
      getSpy.mockRestore()
      writeSpy.mockRestore()
    }
  })

  it.each([
    ['null', null], ['undefined', undefined], ['string', 'sync failed'],
    ['Error', new Error('sync failed')], ['object', { reason: 'sync failed' }],
    ['number', 42], ['throwing message getter', { get message() { throw null } }],
  ])('preserves a full commit when Zustand throws %s', async (_label, thrown) => {
    const backup = await populatedBackup()
    const spy = vi.spyOn(useSettingsStore.getState(), 'setSettings').mockImplementationOnce(() => {
      throw thrown
    })
    try {
      const result = await settingsService.importBackupData(backup)
      expect(result.committed).toBe(true)
      expect(result.importedStores).toEqual(APPROVED_STORE_NAMES)
      expect(result.syncWarning).toBe(
        typeof thrown === 'string' ? thrown : typeof thrown === 'number' ? '42' :
          thrown instanceof Error ? thrown.message : 'Settings synchronization could not be completed.',
      )
      expect(await snapshotAllStores()).toEqual(backup.stores)
    } finally { spy.mockRestore() }
  })

  it('does not invent or persist settings when none exist after selective commit', async () => {
    const backup = await populatedBackup()
    await db.settings.clear()
    const before = await snapshotAllStores()
    const result = await settingsService.importBackupData(backup, {
      mode: 'selective', selectedStores: ['expenses'],
    })
    expect(result.committed).toBe(true)
    expect(result.settings).toBeNull()
    expect(result.syncWarning).toBeTruthy()
    expect(await snapshotAllStores()).toEqual({ ...before, expenses: [replacement] })
  })
})
