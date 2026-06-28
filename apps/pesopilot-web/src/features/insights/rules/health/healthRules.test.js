import { describe, expect, it } from 'vitest'

import { HEALTH_RULE_STATUS } from '../../models/healthRuleResult.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { HEALTH_RULE_IDS, HEALTH_RULE_WEIGHTS } from './healthRuleConstants.js'
import {
  evaluateExpenseRatio,
  evaluateGoalContributionParticipation,
  evaluateIncomeAvailability,
  evaluateRemainingCash,
  evaluateSavingsRatio,
} from './healthRules.js'

function createContext(overrides = {}) {
  return {
    currentCutoff: {
      id: 1,
      name: 'Current Cutoff',
    },
    income: {
      incomeRecords: 1,
      totalIncome: 40000,
    },
    expenses: {
      totalExpenses: 16000,
      transactionCount: 4,
    },
    savings: {
      savingsRecords: 2,
      totalSavings: 8000,
    },
    cashflow: {
      remainingCash: 16000,
    },
    ratios: {
      expenseRate: 40,
      savingsRate: 20,
    },
    goals: {
      activeGoalCount: 1,
      currentCutoffGoalContributionCount: 1,
    },
    ...overrides,
  }
}

describe('health rules', () => {
  it('returns no-data rule results when there is no current cutoff', () => {
    const result = evaluateIncomeAvailability(
      createContext({ currentCutoff: null }),
      HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.incomeAvailability],
    )

    expect(result.score).toBe(0)
    expect(result.status).toBe(HEALTH_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
    expect(result.evidence).toEqual([
      {
        label: 'Current Cutoff',
        value: 'None',
        description: expect.any(String),
      },
    ])
  })

  it('scores income availability from current-cutoff income', () => {
    const passingResult = evaluateIncomeAvailability(
      createContext(),
      HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.incomeAvailability],
    )
    const failingResult = evaluateIncomeAvailability(
      createContext({ income: { incomeRecords: 0, totalIncome: 0 } }),
      HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.incomeAvailability],
    )

    expect(passingResult.score).toBe(100)
    expect(passingResult.status).toBe(HEALTH_RULE_STATUS.pass)
    expect(failingResult.score).toBe(0)
    expect(failingResult.status).toBe(HEALTH_RULE_STATUS.fail)
  })

  it('scores expense ratio thresholds', () => {
    expect(
      evaluateExpenseRatio(
        createContext({ ratios: { expenseRate: 50, savingsRate: 20 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.expenseRatio],
      ).score,
    ).toBe(100)
    expect(
      evaluateExpenseRatio(
        createContext({ ratios: { expenseRate: 85, savingsRate: 20 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.expenseRatio],
      ).score,
    ).toBe(60)
    expect(
      evaluateExpenseRatio(
        createContext({ ratios: { expenseRate: 120, savingsRate: 20 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.expenseRatio],
      ).score,
    ).toBe(0)
  })

  it('scores savings ratio thresholds', () => {
    expect(
      evaluateSavingsRatio(
        createContext({ ratios: { expenseRate: 40, savingsRate: 20 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.savingsRatio],
      ).score,
    ).toBe(100)
    expect(
      evaluateSavingsRatio(
        createContext({ ratios: { expenseRate: 40, savingsRate: 5 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.savingsRatio],
      ).score,
    ).toBe(50)
    expect(
      evaluateSavingsRatio(
        createContext({ ratios: { expenseRate: 40, savingsRate: 0 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.savingsRatio],
      ).score,
    ).toBe(0)
  })

  it('scores remaining cash from computed current-cutoff cashflow', () => {
    expect(
      evaluateRemainingCash(
        createContext({ cashflow: { remainingCash: 1 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.remainingCash],
      ).score,
    ).toBe(100)
    expect(
      evaluateRemainingCash(
        createContext({ cashflow: { remainingCash: 0 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.remainingCash],
      ).score,
    ).toBe(60)
    expect(
      evaluateRemainingCash(
        createContext({ cashflow: { remainingCash: -1 } }),
        HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.remainingCash],
      ).score,
    ).toBe(0)
  })

  it('treats no active goals as informational no-data instead of a warning', () => {
    const result = evaluateGoalContributionParticipation(
      createContext({
        goals: {
          activeGoalCount: 0,
          currentCutoffGoalContributionCount: 0,
        },
      }),
      HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.goalContributionParticipation],
    )

    expect(result.score).toBe(60)
    expect(result.status).toBe(HEALTH_RULE_STATUS.noData)
    expect(result.severity).toBe(INSIGHT_SEVERITY.info)
  })

  it('scores active goal contribution participation', () => {
    const passingResult = evaluateGoalContributionParticipation(
      createContext(),
      HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.goalContributionParticipation],
    )
    const warningResult = evaluateGoalContributionParticipation(
      createContext({
        goals: {
          activeGoalCount: 1,
          currentCutoffGoalContributionCount: 0,
        },
      }),
      HEALTH_RULE_WEIGHTS[HEALTH_RULE_IDS.goalContributionParticipation],
    )

    expect(passingResult.score).toBe(100)
    expect(passingResult.status).toBe(HEALTH_RULE_STATUS.pass)
    expect(warningResult.score).toBe(40)
    expect(warningResult.status).toBe(HEALTH_RULE_STATUS.warning)
  })
})
