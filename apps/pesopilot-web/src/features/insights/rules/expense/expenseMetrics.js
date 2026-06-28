import { EXPENSE_TREND } from '../../models/expenseInsight.js'

export const UNCATEGORIZED_CATEGORY = 'Uncategorized'
export const UNKNOWN_MERCHANT = 'Unknown Merchant'

function toAmount(value) {
  return Number(value) || 0
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function roundPercent(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function getCategoryName(categoriesById, categoryId) {
  return categoriesById.get(categoryId)?.name ?? UNCATEGORIZED_CATEGORY
}

function normalizeMerchant(value) {
  const merchant = String(value ?? '').trim()
  return merchant || UNKNOWN_MERCHANT
}

function sortByAmountThenName(firstItem, secondItem) {
  if (secondItem.amount === firstItem.amount) {
    return firstItem.name.localeCompare(secondItem.name)
  }

  return secondItem.amount - firstItem.amount
}

export function sumExpenses(expenses) {
  return roundCurrency(
    expenses.reduce((total, expense) => total + toAmount(expense.amount), 0),
  )
}

export function calculateCategoryDistribution(expenses, categories = []) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const totalExpenses = sumExpenses(expenses)
  const categoryTotals = expenses.reduce((totals, expense) => {
    const categoryId = expense.categoryId ?? null
    const categoryName = getCategoryName(categoriesById, categoryId)
    const key = categoryId ?? UNCATEGORIZED_CATEGORY
    const current = totals.get(key) ?? {
      amount: 0,
      categoryId,
      categoryName,
      count: 0,
      name: categoryName,
    }

    totals.set(key, {
      ...current,
      amount: current.amount + toAmount(expense.amount),
      count: current.count + 1,
    })

    return totals
  }, new Map())

  return [...categoryTotals.values()]
    .map((category) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      amount: roundCurrency(category.amount),
      count: category.count,
      percentage:
        totalExpenses === 0
          ? 0
          : roundPercent((category.amount / totalExpenses) * 100),
    }))
    .sort((firstCategory, secondCategory) =>
      sortByAmountThenName(
        { amount: firstCategory.amount, name: firstCategory.categoryName },
        { amount: secondCategory.amount, name: secondCategory.categoryName },
      ),
    )
}

export function getTopSpendingCategory(categoryDistribution) {
  return categoryDistribution[0] ?? null
}

export function getLargestExpense(expenses, categories = []) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]))

  return [...expenses]
    .sort((firstExpense, secondExpense) => {
      const amountCompare = toAmount(secondExpense.amount) - toAmount(firstExpense.amount)

      if (amountCompare !== 0) {
        return amountCompare
      }

      const dateCompare = String(secondExpense.date ?? '').localeCompare(
        String(firstExpense.date ?? ''),
      )

      if (dateCompare !== 0) {
        return dateCompare
      }

      return (secondExpense.id ?? 0) - (firstExpense.id ?? 0)
    })
    .map((expense) => ({
      id: expense.id ?? null,
      amount: roundCurrency(expense.amount),
      categoryId: expense.categoryId ?? null,
      categoryName: getCategoryName(categoriesById, expense.categoryId),
      date: expense.date ?? null,
      merchant: normalizeMerchant(expense.merchant),
    }))[0] ?? null
}

export function getLargestMerchant(expenses) {
  const merchantTotals = expenses.reduce((totals, expense) => {
    const merchantName = normalizeMerchant(expense.merchant)
    const current = totals.get(merchantName) ?? {
      amount: 0,
      count: 0,
      merchant: merchantName,
    }

    totals.set(merchantName, {
      ...current,
      amount: current.amount + toAmount(expense.amount),
      count: current.count + 1,
    })

    return totals
  }, new Map())

  return [...merchantTotals.values()]
    .map((merchant) => ({
      ...merchant,
      amount: roundCurrency(merchant.amount),
    }))
    .sort((firstMerchant, secondMerchant) =>
      sortByAmountThenName(
        { amount: firstMerchant.amount, name: firstMerchant.merchant },
        { amount: secondMerchant.amount, name: secondMerchant.merchant },
      ),
    )[0] ?? null
}

export function calculateDailySpendingRate(totalExpenses, periodDays) {
  if (!periodDays) {
    return 0
  }

  return roundCurrency(totalExpenses / periodDays)
}

export function calculateExpenseTrend(currentTotal, comparisonTotal) {
  const difference = roundCurrency(currentTotal - comparisonTotal)

  if (!comparisonTotal && !currentTotal) {
    return {
      direction: EXPENSE_TREND.noData,
      currentTotal: 0,
      comparisonTotal: 0,
      difference: 0,
      percentageChange: 0,
    }
  }

  if (!comparisonTotal && currentTotal > 0) {
    return {
      direction: EXPENSE_TREND.increasing,
      currentTotal: roundCurrency(currentTotal),
      comparisonTotal: 0,
      difference,
      percentageChange: 100,
    }
  }

  const percentageChange = roundPercent((difference / comparisonTotal) * 100)
  const absoluteChange = Math.abs(percentageChange)
  let direction = EXPENSE_TREND.stable

  if (absoluteChange >= 10) {
    direction =
      percentageChange > 0 ? EXPENSE_TREND.increasing : EXPENSE_TREND.decreasing
  }

  return {
    direction,
    currentTotal: roundCurrency(currentTotal),
    comparisonTotal: roundCurrency(comparisonTotal),
    difference,
    percentageChange,
  }
}

export function detectSpendingAnomalies(expenses, categories = []) {
  if (expenses.length < 5) {
    return []
  }

  const average = sumExpenses(expenses) / expenses.length
  const variance =
    expenses.reduce((total, expense) => {
      const difference = toAmount(expense.amount) - average
      return total + difference * difference
    }, 0) / expenses.length
  const threshold = average + 2 * Math.sqrt(variance)

  return expenses
    .filter((expense) => toAmount(expense.amount) > threshold)
    .map((expense) => ({
      ...getLargestExpense([expense], categories),
      threshold: roundCurrency(threshold),
    }))
}

export function buildExpenseMetrics(context) {
  const totalExpenses = sumExpenses(context.expenses.current)
  const categoryDistribution = calculateCategoryDistribution(
    context.expenses.current,
    context.categories,
  )
  const trend =
    context.expenses.hasComparisonPeriod && context.expenses.comparison.length > 0
      ? calculateExpenseTrend(totalExpenses, sumExpenses(context.expenses.comparison))
      : {
          direction: EXPENSE_TREND.noData,
          currentTotal: totalExpenses,
          comparisonTotal: 0,
          difference: 0,
          percentageChange: 0,
        }

  return {
    totalExpenses,
    expenseCount: context.expenses.current.length,
    dailySpendingRate: calculateDailySpendingRate(
      totalExpenses,
      context.period.currentPeriodDays,
    ),
    currentPeriodDays: context.period.currentPeriodDays,
    categoryDistribution,
    topSpendingCategory: getTopSpendingCategory(categoryDistribution),
    largestExpense: getLargestExpense(context.expenses.current, context.categories),
    largestMerchant: getLargestMerchant(context.expenses.current),
    trend,
    increase:
      trend.direction === EXPENSE_TREND.increasing
        ? {
            amount: trend.difference,
            percentage: trend.percentageChange,
            significant: trend.percentageChange >= 25,
          }
        : null,
    decrease:
      trend.direction === EXPENSE_TREND.decreasing
        ? {
            amount: Math.abs(trend.difference),
            percentage: Math.abs(trend.percentageChange),
            significant: trend.percentageChange <= -25,
          }
        : null,
    anomalies: detectSpendingAnomalies(context.expenses.current, context.categories),
  }
}
