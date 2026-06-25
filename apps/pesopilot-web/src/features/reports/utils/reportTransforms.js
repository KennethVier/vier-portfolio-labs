const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
})

export const REPORT_SCOPES = {
  all: 'all',
  currentCutoff: 'current_cutoff',
  specificCutoff: 'specific_cutoff',
}

function getAmount(record) {
  return Number(record?.amount) || 0
}

function getMonthKey(date) {
  return String(date ?? '').slice(0, 7)
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)

  if (!year || !month) {
    return monthKey
  }

  return monthFormatter.format(new Date(year, month - 1, 1))
}

function sortByMonthKey(firstItem, secondItem) {
  return firstItem.monthKey.localeCompare(secondItem.monthKey)
}

function sortByDate(firstItem, secondItem) {
  return String(firstItem.date).localeCompare(String(secondItem.date))
}

function addToMonth(map, date, key, amount) {
  const monthKey = getMonthKey(date)

  if (!monthKey) {
    return
  }

  const current = map.get(monthKey) ?? { monthKey, month: formatMonthLabel(monthKey) }
  current[key] = (current[key] ?? 0) + amount
  map.set(monthKey, current)
}

function getScopeCutoffId({ currentCutoff = null, scope, selectedCutoffId = null } = {}) {
  if (scope === REPORT_SCOPES.currentCutoff) {
    return currentCutoff?.id ?? null
  }

  if (scope === REPORT_SCOPES.specificCutoff) {
    return selectedCutoffId ?? null
  }

  return null
}

function filterRecordsByCutoff(records = [], cutoffId) {
  if (!cutoffId) {
    return []
  }

  return records.filter(
    (record) =>
      record?.cutoffId &&
      String(record.cutoffId) === String(cutoffId),
  )
}

function sortCutoffsAscending(cutoffs = []) {
  return [...cutoffs].sort((firstCutoff, secondCutoff) => {
    const firstDate = String(firstCutoff.startDate ?? '')
    const secondDate = String(secondCutoff.startDate ?? '')

    if (firstDate === secondDate) {
      return (firstCutoff.id ?? 0) - (secondCutoff.id ?? 0)
    }

    return firstDate.localeCompare(secondDate)
  })
}

export function sumAmounts(records = []) {
  return records.reduce((total, record) => total + getAmount(record), 0)
}

export function filterRecordsForReportScope({
  currentCutoff = null,
  expenses = [],
  income = [],
  savings = [],
  scope = REPORT_SCOPES.all,
  selectedCutoffId = null,
} = {}) {
  if (scope === REPORT_SCOPES.all) {
    return { expenses, income, savings }
  }

  const cutoffId = getScopeCutoffId({ currentCutoff, scope, selectedCutoffId })

  return {
    expenses: filterRecordsByCutoff(expenses, cutoffId),
    income: filterRecordsByCutoff(income, cutoffId),
    savings: filterRecordsByCutoff(savings, cutoffId),
  }
}

export function selectCutoffsForReportScope({
  currentCutoff = null,
  cutoffs = [],
  scope = REPORT_SCOPES.all,
  selectedCutoffId = null,
} = {}) {
  if (scope === REPORT_SCOPES.all) {
    return cutoffs
  }

  const cutoffId = getScopeCutoffId({ currentCutoff, scope, selectedCutoffId })

  if (!cutoffId) {
    return []
  }

  if (scope === REPORT_SCOPES.currentCutoff) {
    return cutoffs.map((cutoff) => ({
      ...cutoff,
      isHighlighted: String(cutoff.id) === String(cutoffId),
    }))
  }

  const sortedCutoffs = sortCutoffsAscending(cutoffs)
  const selectedIndex = sortedCutoffs.findIndex(
    (cutoff) => String(cutoff.id) === String(cutoffId),
  )

  if (selectedIndex === -1) {
    return []
  }

  return sortedCutoffs
    .slice(Math.max(0, selectedIndex - 1), selectedIndex + 2)
    .map((cutoff) => ({
      ...cutoff,
      isHighlighted: String(cutoff.id) === String(cutoffId),
    }))
}

export function buildReportKpis({ expenses = [], income = [], savings = [] } = {}) {
  const totalIncome = sumAmounts(income)
  const totalExpenses = sumAmounts(expenses)
  const totalSavings = sumAmounts(savings)

  return {
    netCashflow: totalIncome - totalExpenses - totalSavings,
    totalExpenses,
    totalIncome,
    totalSavings,
  }
}

export function buildExpenseTrend(expenses = []) {
  const monthTotals = new Map()

  expenses.forEach((expense) => {
    addToMonth(monthTotals, expense.date, 'expenses', getAmount(expense))
  })

  return [...monthTotals.values()]
    .sort(sortByMonthKey)
    .map(({ expenses = 0, month }) => ({ month, expenses }))
}

export function buildIncomeExpenseComparison({ expenses = [], income = [] } = {}) {
  const monthTotals = new Map()

  income.forEach((incomeRecord) => {
    addToMonth(monthTotals, incomeRecord.date, 'income', getAmount(incomeRecord))
  })

  expenses.forEach((expense) => {
    addToMonth(monthTotals, expense.date, 'expenses', getAmount(expense))
  })

  return [...monthTotals.values()]
    .sort(sortByMonthKey)
    .map(({ expenses = 0, income: incomeTotal = 0, month }) => ({
      expenses,
      income: incomeTotal,
      month,
    }))
}

export function buildCategoryBreakdown(expenses = [], categories = []) {
  const categoriesById = new Map(
    categories.map((category) => [String(category.id), category]),
  )
  const totalsByCategory = new Map()

  expenses.forEach((expense) => {
    const categoryName =
      categoriesById.get(String(expense.categoryId))?.name ?? 'Uncategorized'
    totalsByCategory.set(
      categoryName,
      (totalsByCategory.get(categoryName) ?? 0) + getAmount(expense),
    )
  })

  const total = [...totalsByCategory.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  )

  return [...totalsByCategory.entries()]
    .sort((firstCategory, secondCategory) => secondCategory[1] - firstCategory[1])
    .map(([name, value]) => ({
      name,
      percentage: total === 0 ? 0 : Math.round((value / total) * 100),
      value,
    }))
}

export function buildSavingsTrend(savings = []) {
  const dailyTotals = new Map()

  savings.forEach((savingsRecord) => {
    if (!savingsRecord.date) {
      return
    }

    dailyTotals.set(
      savingsRecord.date,
      (dailyTotals.get(savingsRecord.date) ?? 0) + getAmount(savingsRecord),
    )
  })

  let runningTotal = 0

  return [...dailyTotals.entries()]
    .map(([date, amount]) => ({ amount, date }))
    .sort(sortByDate)
    .map(({ amount, date }) => {
      runningTotal += amount

      return {
        date,
        savings: runningTotal,
      }
    })
}

export function padSinglePointSavingsTrend(data = []) {
  if (data.length !== 1) {
    return data
  }

  return [
    { date: 'Start', savings: 0 },
    data[0],
  ]
}

export function buildCashflowTrend({ expenses = [], income = [], savings = [] } = {}) {
  const monthTotals = new Map()

  income.forEach((incomeRecord) => {
    addToMonth(monthTotals, incomeRecord.date, 'income', getAmount(incomeRecord))
  })

  expenses.forEach((expense) => {
    addToMonth(monthTotals, expense.date, 'expenses', getAmount(expense))
  })

  savings.forEach((savingsRecord) => {
    addToMonth(monthTotals, savingsRecord.date, 'savings', getAmount(savingsRecord))
  })

  return [...monthTotals.values()]
    .sort(sortByMonthKey)
    .map((monthRecord) => ({
      cashflow:
        (monthRecord.income ?? 0) -
        (monthRecord.expenses ?? 0) -
        (monthRecord.savings ?? 0),
      month: monthRecord.month,
    }))
}

export function padSinglePointCashflowTrend(data = []) {
  if (data.length !== 1) {
    return data
  }

  return [
    { month: 'Start', cashflow: 0 },
    data[0],
  ]
}

function sumByCutoff(records, cutoffId) {
  return records
    .filter((record) => String(record.cutoffId) === String(cutoffId))
    .reduce((total, record) => total + getAmount(record), 0)
}

export function buildCutoffComparison({
  cutoffs = [],
  expenses = [],
  income = [],
  savings = [],
} = {}) {
  return [...cutoffs]
    .sort((firstCutoff, secondCutoff) =>
      String(secondCutoff.startDate ?? '').localeCompare(
        String(firstCutoff.startDate ?? ''),
      ),
    )
    .map((cutoff) => {
      const actualIncome = sumByCutoff(income, cutoff.id)
      const totalExpenses = sumByCutoff(expenses, cutoff.id)
      const totalSavings = sumByCutoff(savings, cutoff.id)

      return {
        actualIncome,
        cutoffId: cutoff.id,
        expectedIncome: Number(cutoff.expectedIncome) || 0,
        isHighlighted: Boolean(cutoff.isHighlighted),
        name: cutoff.name,
        remainingCash: actualIncome - totalExpenses - totalSavings,
        totalExpenses,
        totalSavings,
      }
    })
}
