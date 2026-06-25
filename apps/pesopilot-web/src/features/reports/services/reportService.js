import { categoryRepository } from '@/lib/db/repositories/categoryRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import {
  buildCashflowTrend,
  buildCategoryBreakdown,
  buildCutoffComparison,
  buildExpenseTrend,
  buildIncomeExpenseComparison,
  buildReportKpis,
  buildSavingsTrend,
  filterRecordsForReportScope,
  REPORT_SCOPES,
  selectCutoffsForReportScope,
} from '../utils/reportTransforms.js'

function getScopeEmptyMessage(scope) {
  if (scope === REPORT_SCOPES.currentCutoff) {
    return 'No records found for the current cutoff.'
  }

  if (scope === REPORT_SCOPES.specificCutoff) {
    return 'No records found for the selected cutoff.'
  }

  return 'No records available for reports yet.'
}

export const reportService = {
  async loadReports({ scope = REPORT_SCOPES.all, selectedCutoffId = null } = {}) {
    const [
      categories,
      cutoffs,
      expenses,
      income,
      savings,
      currentCutoff,
    ] = await Promise.all([
      categoryRepository.findAll(),
      salaryCutoffRepository.findAll(),
      expenseRepository.findAll(),
      incomeRepository.findAll(),
      savingsRepository.findAll(),
      cutoffService.findCurrentCutoff(),
    ])
    const scopedRecords = filterRecordsForReportScope({
      currentCutoff,
      expenses,
      income,
      savings,
      scope,
      selectedCutoffId,
    })
    const scopedCutoffs = selectCutoffsForReportScope({
      currentCutoff,
      cutoffs,
      scope,
      selectedCutoffId,
    })

    return {
      datasets: {
        cashflowTrend: buildCashflowTrend(scopedRecords),
        categoryBreakdown: buildCategoryBreakdown(scopedRecords.expenses, categories),
        cutoffComparison: buildCutoffComparison({
          cutoffs: scopedCutoffs,
          expenses: scopedRecords.expenses,
          income: scopedRecords.income,
          savings: scopedRecords.savings,
        }),
        expenseTrend: buildExpenseTrend(scopedRecords.expenses),
        incomeExpenseComparison: buildIncomeExpenseComparison({
          expenses: scopedRecords.expenses,
          income: scopedRecords.income,
        }),
        savingsTrend: buildSavingsTrend(scopedRecords.savings),
      },
      kpis: buildReportKpis(scopedRecords),
      meta: {
        currentCutoff,
        emptyMessage: getScopeEmptyMessage(scope),
        scope,
        selectedCutoffId,
      },
      records: {
        categories,
        cutoffs,
        expenses,
        income,
        savings,
        scoped: scopedRecords,
      },
    }
  },
}
