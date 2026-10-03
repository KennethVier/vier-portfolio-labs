import { createInsightBundle } from '../models/insightBundle.js'
import { generateCashflowInsight } from '../rules/cashflow/cashflowEngine.js'
import { generateCutoffInsight } from '../rules/cutoff/cutoffEngine.js'
import { generateExpenseInsight } from '../rules/expense/expenseEngine.js'
import { generateGoalInsight } from '../rules/goal/goalEngine.js'
import { generateHealthInsight } from '../rules/health/healthEngine.js'
import { generateIncomeInsight } from '../rules/income/incomeEngine.js'
import { generateSavingsInsight } from '../rules/savings/savingsEngine.js'
import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'

export const insightService = {
  async loadInsights({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
    const bundle = createInsightBundle({ scope })

    bundle.health = await generateHealthInsight({ scope })
    bundle.expenses = await generateExpenseInsight({ scope })
    bundle.income = await generateIncomeInsight({ scope })
    bundle.savings = await generateSavingsInsight({ scope })
    bundle.goals = await generateGoalInsight({ scope })
    bundle.cashflow = await generateCashflowInsight({ scope })
    bundle.cutoff = await generateCutoffInsight({ scope })

    return bundle
  },
}
