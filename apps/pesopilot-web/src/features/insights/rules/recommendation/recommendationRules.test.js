import { describe, expect, it } from 'vitest'

import {
  evaluateCashflowFastSpendingPace,
  evaluateCashflowIncomeCoverage,
  evaluateCashflowNegativePosition,
  evaluateCutoffCashTrendDown,
  evaluateCutoffExpensesUp,
  evaluateExpenseCategoryConcentration,
  evaluateExpenseRisingSpending,
  evaluateGoalNoContributions,
  evaluateHealthLowStatus,
  evaluateIncomeMissingIncome,
  evaluateIncomeUnstable,
  evaluateSavingsLowRate,
} from './recommendationRules.js'

describe('recommendationRules', () => {
  const bannedAdviceTerms = ['invest', 'loan', 'tax advice', 'legal advice', 'stocks', 'portfolio allocation']

  function assertNoPrescriptiveAdvice(rec) {
    if (!rec) return
    const combined = `${rec.title} ${rec.explanation}`.toLowerCase()
    for (const term of bannedAdviceTerms) {
      expect(combined.includes(term)).toBe(false)
    }
  }

  describe('cashflow rules', () => {
    it('evaluateCashflowNegativePosition returns critical recommendation with evidence', () => {
      const bundle = {
        cashflow: {
          metrics: { position: 'Negative' },
          evidence: [
            { ruleId: 'remaining_cash', label: 'Remaining Cash', value: -500 },
            { ruleId: 'net_cashflow', label: 'Net Cashflow', value: -1200 },
          ],
        },
      }

      const rec = evaluateCashflowNegativePosition(bundle)
      expect(rec).not.toBeNull()
      expect(rec.id).toBe('cashflow_negative_position')
      expect(rec.domain).toBe('cashflow')
      expect(rec.severity).toBe('critical')
      expect(rec.priority).toBe('urgent')
      expect(rec.sourceRuleIds).toContain('remaining_cash')
      expect(rec.evidence.length).toBeGreaterThan(0)
      assertNoPrescriptiveAdvice(rec)
    })

    it('evaluateCashflowNegativePosition returns null when position is Positive or missing', () => {
      expect(
        evaluateCashflowNegativePosition({
          cashflow: { metrics: { position: 'Positive' }, evidence: [] },
        }),
      ).toBeNull()
      expect(evaluateCashflowNegativePosition(null)).toBeNull()
      expect(evaluateCashflowNegativePosition({})).toBeNull()
    })

    it('evaluateCashflowFastSpendingPace triggers on Fast pace', () => {
      const bundle = {
        cashflow: {
          metrics: { spendingPace: { status: 'Fast' } },
          evidence: [{ ruleId: 'spending_pace', label: 'Pace Delta', value: 25 }],
        },
      }

      const rec = evaluateCashflowFastSpendingPace(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('warning')
      expect(rec.priority).toBe('high')
      expect(rec.sourceRuleIds).toEqual(['spending_pace'])
      assertNoPrescriptiveAdvice(rec)
    })

    it('evaluateCashflowIncomeCoverage triggers on Uncovered and Partial', () => {
      const uncoveredBundle = {
        cashflow: {
          metrics: { incomeCoverage: { status: 'Uncovered' } },
          evidence: [{ ruleId: 'income_coverage', label: 'Coverage', value: 0 }],
        },
      }
      const recUncovered = evaluateCashflowIncomeCoverage(uncoveredBundle)
      expect(recUncovered.severity).toBe('critical')
      expect(recUncovered.priority).toBe('urgent')

      const partialBundle = {
        cashflow: {
          metrics: { incomeCoverage: { status: 'Partial' } },
          evidence: [{ ruleId: 'income_coverage', label: 'Coverage', value: 50 }],
        },
      }
      const recPartial = evaluateCashflowIncomeCoverage(partialBundle)
      expect(recPartial.severity).toBe('warning')
      expect(recPartial.priority).toBe('high')
    })
  })

  describe('expense rules', () => {
    it('evaluateExpenseCategoryConcentration triggers when top category >= 40%', () => {
      const bundle = {
        expenses: {
          metrics: {
            topSpendingCategory: {
              categoryName: 'Dining',
              percentage: 45,
              amount: 4500,
            },
          },
          evidence: [
            { ruleId: 'top_spending_category', label: 'Category', value: 'Dining' },
          ],
        },
      }

      const rec = evaluateExpenseCategoryConcentration(bundle)
      expect(rec).not.toBeNull()
      expect(rec.explanation).toContain('Dining accounts for 45% of current spending')
      expect(rec.sourceRuleIds).toEqual(['top_spending_category'])
      assertNoPrescriptiveAdvice(rec)
    })

    it('evaluateExpenseCategoryConcentration returns null below 40%', () => {
      const bundle = {
        expenses: {
          metrics: {
            topSpendingCategory: { categoryName: 'Dining', percentage: 35 },
          },
          evidence: [{ ruleId: 'top_spending_category', label: 'Category', value: 'Dining' }],
        },
      }
      expect(evaluateExpenseCategoryConcentration(bundle)).toBeNull()
    })

    it('evaluateExpenseRisingSpending triggers on Increasing trend', () => {
      const bundle = {
        expenses: {
          metrics: { trend: { direction: 'Increasing', percentageChange: 20 } },
          breakdown: [{ id: 'expense_trend', severity: 'warning' }],
          evidence: [{ ruleId: 'expense_trend', label: 'Change', value: 20 }],
        },
      }

      const rec = evaluateExpenseRisingSpending(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('warning')
      expect(rec.sourceRuleIds).toEqual(['expense_trend'])
    })
  })

  describe('income rules', () => {
    it('evaluateIncomeMissingIncome triggers when missing is true', () => {
      const bundle = {
        income: {
          metrics: { missingIncome: { missing: true, expectedIncome: 25000, gap: 25000 } },
          evidence: [{ ruleId: 'missing_income_detection', label: 'Gap', value: 25000 }],
        },
      }

      const rec = evaluateIncomeMissingIncome(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('critical')
      expect(rec.sourceRuleIds).toEqual(['missing_income_detection'])
    })

    it('evaluateIncomeUnstable triggers when stability is Unstable', () => {
      const bundle = {
        income: {
          metrics: { stability: { status: 'Unstable' } },
          evidence: [{ ruleId: 'income_stability', label: 'Stability', value: 'Unstable' }],
        },
      }

      const rec = evaluateIncomeUnstable(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('warning')
      expect(rec.sourceRuleIds).toEqual(['income_stability'])
    })
  })

  describe('savings rules', () => {
    it('evaluateSavingsLowRate triggers when rate status is Low', () => {
      const bundle = {
        savings: {
          metrics: { savingsRate: { status: 'Low', rate: 4 } },
          evidence: [{ ruleId: 'savings_rate', label: 'Savings Rate', value: 4 }],
        },
      }

      const rec = evaluateSavingsLowRate(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('warning')
      expect(rec.sourceRuleIds).toEqual(['savings_rate'])
    })
  })

  describe('goal rules', () => {
    it('evaluateGoalNoContributions triggers when goalsWithoutContributions is non-empty', () => {
      const bundle = {
        goals: {
          metrics: { goalsWithoutContributions: [{ goalId: 'g1', name: 'Emergency Fund' }] },
          evidence: [{ ruleId: 'goals_without_contributions', label: 'Count', value: 1 }],
        },
      }

      const rec = evaluateGoalNoContributions(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('info')
      expect(rec.priority).toBe('low')
      expect(rec.sourceRuleIds).toEqual(['goals_without_contributions'])
    })
  })

  describe('cutoff rules', () => {
    it('evaluateCutoffExpensesUp triggers when expenses are Increasing', () => {
      const bundle = {
        cutoff: {
          metrics: {
            previousCutoffComparison: {
              expenses: { direction: 'Increasing', percentageChange: 15 },
            },
          },
          evidence: [{ ruleId: 'expense_comparison', label: 'Change', value: 15 }],
        },
      }

      const rec = evaluateCutoffExpensesUp(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('warning')
      expect(rec.sourceRuleIds).toEqual(['expense_comparison'])
    })

    it('evaluateCutoffCashTrendDown triggers when cutoff trend is Decreasing', () => {
      const bundle = {
        cutoff: {
          metrics: { trend: { direction: 'Decreasing' } },
          evidence: [{ ruleId: 'cutoff_trend', label: 'Trend Direction', value: 'Decreasing' }],
        },
      }

      const rec = evaluateCutoffCashTrendDown(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('warning')
      expect(rec.sourceRuleIds).toEqual(['cutoff_trend'])
    })
  })

  describe('health rules', () => {
    it('evaluateHealthLowStatus populates sourceRuleIds from contributing rules', () => {
      const bundle = {
        health: {
          status: 'Needs Attention',
          score: 55,
          breakdown: [
            { id: 'expense_ratio', severity: 'warning' },
            { id: 'savings_ratio', severity: 'warning' },
            { id: 'income_availability', severity: 'success' },
          ],
          evidence: [
            { ruleId: 'expense_ratio', label: 'Expense Ratio', value: 85 },
            { ruleId: 'savings_ratio', label: 'Savings Ratio', value: 5 },
            { ruleId: 'income_availability', label: 'Income', value: 20000 },
          ],
        },
      }

      const rec = evaluateHealthLowStatus(bundle)
      expect(rec).not.toBeNull()
      expect(rec.severity).toBe('warning')
      expect(rec.sourceRuleIds).toEqual(['expense_ratio', 'savings_ratio'])
      expect(rec.evidence.every((e) => ['expense_ratio', 'savings_ratio'].includes(e.ruleId))).toBe(true)
    })

    it('evaluateHealthLowStatus returns null when health is Healthy or Excellent', () => {
      const bundle = {
        health: {
          status: 'Healthy',
          score: 85,
          breakdown: [{ id: 'income_availability', severity: 'success' }],
          evidence: [{ ruleId: 'income_availability', label: 'Income', value: 20000 }],
        },
      }

      expect(evaluateHealthLowStatus(bundle)).toBeNull()
    })
  })
})
