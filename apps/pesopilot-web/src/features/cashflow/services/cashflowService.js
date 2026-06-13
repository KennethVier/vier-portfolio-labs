import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import { EMPTY_CASHFLOW_RESULT } from '../constants/cashflowConstants.js'
import { createCashflowModel } from '../models/cashflowModel.js'

function sumAmounts(records) {
  return records.reduce((total, record) => total + (record.amount ?? 0), 0)
}

export const cashflowService = {
  async calculateCashflowForCutoff(cutoffId) {
    const cutoff = await salaryCutoffRepository.findById(cutoffId)

    if (!cutoff) {
      return EMPTY_CASHFLOW_RESULT
    }

    const [incomeRecords, expenseRecords, savingsRecords] = await Promise.all([
      incomeRepository.findByCutoff(cutoff.id),
      expenseRepository.findByCutoff(cutoff.id),
      savingsRepository.findByCutoff(cutoff.id),
    ])

    return {
      cashflow: createCashflowModel({
        actualIncome: sumAmounts(incomeRecords),
        cutoff,
        totalExpenses: sumAmounts(expenseRecords),
        totalSavings: sumAmounts(savingsRecords),
      }),
      hasCurrentCutoff: true,
    }
  },

  async getCurrentCashflow(date) {
    const cutoff = await cutoffService.findCurrentCutoff(date)

    if (!cutoff) {
      return EMPTY_CASHFLOW_RESULT
    }

    return this.calculateCashflowForCutoff(cutoff.id)
  },
}

export const cashflowServiceInternals = {
  sumAmounts,
}
