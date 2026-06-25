import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { expenseService } from './expenseService.js'

const validExpense = {
  amount: 500,
  merchant: 'Jollibee',
  categoryId: 'food',
  paymentMethod: 'Cash',
  date: '2026-06-11',
  emotionTag: 'Normal',
  note: 'Lunch',
  source: 'manual',
}

beforeEach(async () => {
  await db.open()
  await clearDatabase()
  await seedDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
})

describe('expenseService', () => {
  it('loads expense categories from seeded categories', async () => {
    const categories = await expenseService.loadCategories()

    expect(categories.map((category) => category.id)).toEqual(
      expect.arrayContaining(['food', 'transport', 'bills', 'groceries']),
    )
    expect(categories.every((category) => category.type === 'expense')).toBe(true)
  })

  it('creates, updates, and deletes expenses through the repository layer', async () => {
    const createdExpense = await expenseService.createExpense(validExpense)

    expect(createdExpense).toMatchObject({
      amount: 500,
      merchant: 'Jollibee',
      categoryId: 'food',
      paymentMethod: 'Cash',
      source: 'manual',
    })

    const updatedExpense = await expenseService.updateExpense(createdExpense.id, {
      ...validExpense,
      amount: 625,
      paymentMethod: 'GCash',
    })

    expect(updatedExpense).toMatchObject({
      id: createdExpense.id,
      amount: 625,
      paymentMethod: 'GCash',
      createdAt: createdExpense.createdAt,
    })

    await expenseService.deleteExpense(createdExpense.id)

    expect(await expenseRepository.findById(createdExpense.id)).toBeUndefined()
  })

  it('defaults new expenses to the current cutoff when cutoffId is empty', async () => {
    const activeCutoffId = await salaryCutoffRepository.create({
      name: 'Active Cutoff',
      type: 'semi_monthly',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      expectedIncome: 40000,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const createdExpense = await expenseService.createExpense(validExpense)

    expect(createdExpense).toMatchObject({
      cutoffId: activeCutoffId,
      merchant: 'Jollibee',
    })
  })

  it('does not override a user-selected cutoff when creating expenses', async () => {
    await salaryCutoffRepository.create({
      name: 'Active Cutoff',
      type: 'semi_monthly',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      expectedIncome: 40000,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const selectedCutoffId = await salaryCutoffRepository.create({
      name: 'Selected Cutoff',
      type: 'semi_monthly',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      expectedIncome: 40000,
      status: 'planned',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const createdExpense = await expenseService.createExpense({
      ...validExpense,
      cutoffId: selectedCutoffId,
    })

    expect(createdExpense.cutoffId).toBe(selectedCutoffId)
  })

  it('does not auto-assign current cutoff during expense updates', async () => {
    const selectedCutoffId = await salaryCutoffRepository.create({
      name: 'Selected Cutoff',
      type: 'semi_monthly',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      expectedIncome: 40000,
      status: 'planned',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const createdExpense = await expenseService.createExpense({
      ...validExpense,
      cutoffId: selectedCutoffId,
    })
    await salaryCutoffRepository.create({
      name: 'Active Cutoff',
      type: 'semi_monthly',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      expectedIncome: 40000,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const updatedExpense = await expenseService.updateExpense(createdExpense.id, {
      ...validExpense,
      amount: 725,
      cutoffId: '',
    })

    expect(updatedExpense).toMatchObject({
      amount: 725,
      cutoffId: null,
    })
  })

  it('filters expenses by category, payment method, and date range', async () => {
    await expenseService.createExpense(validExpense)
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'Meralco',
      categoryId: 'bills',
      paymentMethod: 'Bank Transfer',
      date: '2026-06-20',
    })
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'Shopee',
      categoryId: 'shopping',
      paymentMethod: 'Maya',
      date: '2026-05-01',
    })

    await expect(
      expenseService.loadExpenses({ categoryId: 'bills' }),
    ).resolves.toHaveLength(1)
    await expect(
      expenseService.loadExpenses({ paymentMethod: 'Cash' }),
    ).resolves.toHaveLength(1)
    await expect(
      expenseService.loadExpenses({
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      }),
    ).resolves.toHaveLength(2)
  })

  it('searches expenses by merchant, note, payment method, and category name', async () => {
    await expenseService.createExpense(validExpense)
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'Meralco',
      categoryId: 'bills',
      paymentMethod: 'Bank Transfer',
      date: '2026-06-20',
      note: 'Monthly utilities',
    })
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'Shopee',
      categoryId: 'shopping',
      paymentMethod: 'Maya',
      date: '2026-06-21',
      note: 'Office supplies',
    })
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'Tricycle',
      categoryId: 'transport',
      paymentMethod: 'GCash',
      date: '2026-06-22',
      note: 'Commute',
    })

    await expect(
      expenseService.loadExpenses({ search: 'jollibee' }),
    ).resolves.toHaveLength(1)
    await expect(
      expenseService.loadExpenses({ search: 'utilities' }),
    ).resolves.toHaveLength(1)
    await expect(
      expenseService.loadExpenses({ search: 'gcash' }),
    ).resolves.toHaveLength(1)
    await expect(
      expenseService.loadExpenses({ search: 'bank transfer' }),
    ).resolves.toHaveLength(1)
    await expect(
      expenseService.loadExpenses({ search: 'shopping' }),
    ).resolves.toHaveLength(1)
  })

  it('keeps search case-insensitive and combined with category filters', async () => {
    await expenseService.createExpense(validExpense)
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'Jollibee',
      categoryId: 'bills',
      paymentMethod: 'GCash',
      date: '2026-06-20',
      note: 'Reimbursement',
    })
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'McDo',
      categoryId: 'food',
      paymentMethod: 'Cash',
      date: '2026-06-21',
      note: 'Dinner',
    })

    await expect(
      expenseService.loadExpenses({ search: 'JOLLIBEE' }),
    ).resolves.toHaveLength(2)
    await expect(
      expenseService.loadExpenses({ categoryId: 'food', search: 'jollibee' }),
    ).resolves.toHaveLength(1)
  })

  it('returns normal filtered results when search is empty', async () => {
    await expenseService.createExpense(validExpense)
    await expenseService.createExpense({
      ...validExpense,
      merchant: 'Meralco',
      categoryId: 'bills',
      paymentMethod: 'Bank Transfer',
      date: '2026-06-20',
    })

    await expect(
      expenseService.loadExpenses({ categoryId: 'food', search: '' }),
    ).resolves.toHaveLength(1)
    await expect(
      expenseService.loadExpenses({ categoryId: 'food', search: '   ' }),
    ).resolves.toHaveLength(1)
  })

  it('calculates current-cutoff expense KPIs independently from table filters', async () => {
    const activeCutoffId = await salaryCutoffRepository.create({
      name: 'Active Cutoff',
      type: 'semi_monthly',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      expectedIncome: 40000,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const historicalCutoffId = await salaryCutoffRepository.create({
      name: 'Historical Cutoff',
      type: 'semi_monthly',
      startDate: '2026-06-01',
      endDate: '2026-06-15',
      expectedIncome: 40000,
      status: 'planned',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const deletedCutoffId = await salaryCutoffRepository.create({
      name: 'Deleted Cutoff',
      type: 'semi_monthly',
      startDate: '2026-05-16',
      endDate: '2026-05-31',
      expectedIncome: 40000,
      status: 'planned',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    await expenseService.createExpense({
      ...validExpense,
      amount: 500,
      categoryId: 'food',
      cutoffId: activeCutoffId,
      merchant: 'Jollibee',
    })
    await expenseService.createExpense({
      ...validExpense,
      amount: 1500,
      categoryId: 'bills',
      cutoffId: activeCutoffId,
      merchant: 'Meralco',
    })
    await expenseService.createExpense({
      ...validExpense,
      amount: 900,
      categoryId: 'food',
      cutoffId: historicalCutoffId,
      merchant: 'McDo',
    })
    await expenseService.createExpense({
      ...validExpense,
      amount: 700,
      categoryId: 'shopping',
      cutoffId: deletedCutoffId,
      merchant: 'Shopee',
    })
    await expenseRepository.create({
      amount: 300,
      categoryId: 'food',
      createdAt: '2026-06-01T00:00:00.000Z',
      date: validExpense.date,
      emotionTag: validExpense.emotionTag,
      cutoffId: null,
      merchant: 'Unlinked',
      note: validExpense.note,
      paymentMethod: validExpense.paymentMethod,
      source: validExpense.source,
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    await salaryCutoffRepository.remove(deletedCutoffId)

    await expect(expenseService.loadExpenses({ search: 'Meralco' })).resolves.toHaveLength(1)
    await expect(expenseService.loadExpenseKpis()).resolves.toEqual({
      averageExpense: 1000,
      currentCutoffId: activeCutoffId,
      largestCategory: 'Bills',
      totalExpenses: 2000,
      transactionCount: 2,
    })
  })

  it('returns zero expense KPIs when no current cutoff exists', async () => {
    await expenseService.createExpense(validExpense)

    await expect(expenseService.loadExpenseKpis()).resolves.toEqual({
      averageExpense: 0,
      currentCutoffId: null,
      largestCategory: 'None',
      totalExpenses: 0,
      transactionCount: 0,
    })
  })

  it('rejects invalid expenses before persistence', async () => {
    await expect(
      expenseService.createExpense({
        ...validExpense,
        amount: 0,
        categoryId: '',
      }),
    ).rejects.toThrow()

    await expect(expenseRepository.findAll()).resolves.toHaveLength(0)
  })
})
