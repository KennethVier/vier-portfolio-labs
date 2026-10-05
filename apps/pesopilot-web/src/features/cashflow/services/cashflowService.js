import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

import {
  EMPTY_CASHFLOW_AND_FORECAST_RESULT,
  EMPTY_CASHFLOW_RESULT,
  EMPTY_FORECAST_RESULT,
} from '../constants/cashflowConstants.js'
import { createCashflowModel } from '../models/cashflowModel.js'
import { calculateForecast } from './forecastEngine.js'
import { generateForecastExplanation } from './forecastExplanationService.js'

function sumAmounts(records) {
  return records.reduce((total, record) => total + (record.amount ?? 0), 0)
}

async function fetchCutoffRecordBundle(cutoffId) {
  const cutoff = await salaryCutoffRepository.findById(cutoffId)

  if (!cutoff) {
    return null
  }

  const [incomeRecords, expenseRecords, savingsRecords] = await Promise.all([
    incomeRepository.findByCutoff(cutoff.id),
    expenseRepository.findByCutoff(cutoff.id),
    savingsRepository.findByCutoff(cutoff.id),
  ])

  return {
    cutoff,
    actualIncome: sumAmounts(incomeRecords),
    totalExpenses: sumAmounts(expenseRecords),
    totalSavings: sumAmounts(savingsRecords),
  }
}

export const cashflowService = {
  async calculateCashflowForCutoff(cutoffId) {
    const bundle = await fetchCutoffRecordBundle(cutoffId)

    if (!bundle) {
      return EMPTY_CASHFLOW_RESULT
    }

    return {
      cashflow: createCashflowModel({
        actualIncome: bundle.actualIncome,
        cutoff: bundle.cutoff,
        totalExpenses: bundle.totalExpenses,
        totalSavings: bundle.totalSavings,
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

  async calculateForecastForCutoff(cutoffId, asOfDate) {
    const bundle = await fetchCutoffRecordBundle(cutoffId)

    if (!bundle) {
      return EMPTY_FORECAST_RESULT
    }

    const forecast = calculateForecast({
      cutoffId: bundle.cutoff.id,
      cutoffName: bundle.cutoff.name,
      startDate: bundle.cutoff.startDate,
      endDate: bundle.cutoff.endDate,
      asOfDate,
      expectedIncome: bundle.cutoff.expectedIncome,
      actualIncome: bundle.actualIncome,
      totalExpenses: bundle.totalExpenses,
      totalSavings: bundle.totalSavings,
    })

    const explanation = generateForecastExplanation(forecast)

    return {
      forecast,
      explanation,
      hasCurrentCutoff: true,
    }
  },

  async getCurrentForecast(asOfDate) {
    const cutoff = await cutoffService.findCurrentCutoff(asOfDate)

    if (!cutoff) {
      return EMPTY_FORECAST_RESULT
    }

    return this.calculateForecastForCutoff(cutoff.id, asOfDate)
  },

  async calculateCashflowAndForecastForCutoff(cutoffId, asOfDate) {
    const bundle = await fetchCutoffRecordBundle(cutoffId)

    if (!bundle) {
      return EMPTY_CASHFLOW_AND_FORECAST_RESULT
    }

    const cashflow = createCashflowModel({
      actualIncome: bundle.actualIncome,
      cutoff: bundle.cutoff,
      totalExpenses: bundle.totalExpenses,
      totalSavings: bundle.totalSavings,
    })

    const forecast = calculateForecast({
      cutoffId: bundle.cutoff.id,
      cutoffName: bundle.cutoff.name,
      startDate: bundle.cutoff.startDate,
      endDate: bundle.cutoff.endDate,
      asOfDate,
      expectedIncome: bundle.cutoff.expectedIncome,
      actualIncome: bundle.actualIncome,
      totalExpenses: bundle.totalExpenses,
      totalSavings: bundle.totalSavings,
    })

    const explanation = generateForecastExplanation(forecast)

    return {
      cashflow,
      forecast,
      explanation,
      hasCurrentCutoff: true,
    }
  },

  async getCurrentCashflowAndForecast(asOfDate) {
    const cutoff = await cutoffService.findCurrentCutoff(asOfDate)

    if (!cutoff) {
      return EMPTY_CASHFLOW_AND_FORECAST_RESULT
    }

    return this.calculateCashflowAndForecastForCutoff(cutoff.id, asOfDate)
  },
}

export const cashflowServiceInternals = {
  fetchCutoffRecordBundle,
  sumAmounts,
}
