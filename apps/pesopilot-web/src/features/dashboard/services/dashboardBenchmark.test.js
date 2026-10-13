import { describe, expect, it, vi } from 'vitest'
import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { seedDatabase } from '@/lib/db/seed.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { dashboardService } from './dashboardService.js'

describe('Dashboard Performance Benchmark (< 2 seconds)', () => {
  it('measures 5 consecutive loadDashboard runs with active cutoff', async () => {
    const FIXED_DATE = new Date('2026-06-05T12:00:00.000Z')
    const TS = '2026-06-01T00:00:00.000Z'

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(FIXED_DATE)

    await db.open()
    await clearDatabase()
    await seedDatabase()

    const currentCutoffId = await salaryCutoffRepository.create({
      createdAt: TS,
      endDate: '2026-06-15',
      expectedIncome: 45000,
      name: 'June First Half',
      startDate: '2026-06-01',
      status: 'active',
      type: 'custom',
      updatedAt: TS,
    })

    await incomeRepository.create({
      amount: 45000,
      createdAt: TS,
      cutoffId: currentCutoffId,
      date: '2026-06-02',
      note: 'Salary payout',
      source: 'Salary',
      updatedAt: TS,
    })

    for (let i = 1; i <= 5; i++) {
      await expenseRepository.create({
        amount: 1200 * i,
        categoryId: 'food',
        createdAt: TS,
        cutoffId: currentCutoffId,
        date: `2026-06-0${i}`,
        emotionTag: null,
        merchant: `Store ${i}`,
        note: null,
        paymentMethod: 'Cash',
        source: 'manual',
        updatedAt: TS,
      })
    }

    await savingsRepository.create({
      amount: 7000,
      createdAt: TS,
      cutoffId: currentCutoffId,
      date: '2026-06-04',
      note: 'Emergency savings',
      source: 'Emergency Fund',
      updatedAt: TS,
    })

    const runs = []
    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      const data = await dashboardService.loadDashboard()
      const duration = performance.now() - start
      runs.push(duration)
      expect(data).toBeDefined()
      expect(data.currentCutoff).not.toBeNull()
      expect(duration).toBeLessThan(2000)
    }

    const max = Math.max(...runs)
    console.log(
      'BENCHMARK_OUTPUT:' +
        JSON.stringify({
          run1: `${runs[0].toFixed(2)}ms`,
          run2: `${runs[1].toFixed(2)}ms`,
          run3: `${runs[2].toFixed(2)}ms`,
          run4: `${runs[3].toFixed(2)}ms`,
          run5: `${runs[4].toFixed(2)}ms`,
          maximum: `${max.toFixed(2)}ms`,
          status: max < 2000 ? 'PASS' : 'FAIL',
        }),
    )

    await clearDatabase()
    db.close()
    vi.useRealTimers()
  })
})
