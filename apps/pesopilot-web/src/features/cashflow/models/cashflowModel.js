export function createCashflowModel({
  actualIncome,
  cutoff,
  totalExpenses,
  totalSavings,
}) {
  const expectedIncome = cutoff.expectedIncome ?? 0
  const remainingCash = actualIncome - totalExpenses - totalSavings

  return {
    cutoffId: cutoff.id,
    cutoffName: cutoff.name,
    expectedIncome,
    actualIncome,
    totalExpenses,
    totalSavings,
    remainingCash,
    expenseRate: actualIncome === 0 ? 0 : (totalExpenses / actualIncome) * 100,
    savingsRate: actualIncome === 0 ? 0 : (totalSavings / actualIncome) * 100,
    incomeVariance: actualIncome - expectedIncome,
  }
}
