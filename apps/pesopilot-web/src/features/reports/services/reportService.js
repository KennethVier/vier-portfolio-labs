import { categoryRepository } from '@/lib/db/repositories/categoryRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'

import {
  buildCashflowTrend,
  buildCategoryBreakdown,
  buildCutoffComparison,
  buildExpenseTrend,
  buildIncomeExpenseComparison,
  buildReportKpis,
  buildSavingsTrend,
} from '../utils/reportTransforms.js'

export const reportService = {
  async loadReports() {
    const [categories, cutoffs, expenses, income, savings] = await Promise.all([
      categoryRepository.findAll(),
      salaryCutoffRepository.findAll(),
      expenseRepository.findAll(),
      incomeRepository.findAll(),
      savingsRepository.findAll(),
    ])

    return {
      datasets: {
        cashflowTrend: buildCashflowTrend({ expenses, income, savings }),
        categoryBreakdown: buildCategoryBreakdown(expenses, categories),
        cutoffComparison: buildCutoffComparison({
          cutoffs,
          expenses,
          income,
          savings,
        }),
        expenseTrend: buildExpenseTrend(expenses),
        incomeExpenseComparison: buildIncomeExpenseComparison({
          expenses,
          income,
        }),
        savingsTrend: buildSavingsTrend(savings),
      },
      kpis: buildReportKpis({ expenses, income, savings }),
      records: {
        categories,
        cutoffs,
        expenses,
        income,
        savings,
      },
    }
  },
}
