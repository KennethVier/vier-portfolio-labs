export function summarizeProfit(items) {
  let grossProfit = 0
  let costOfGoods = 0
  let uncostedUnits = 0
  for (const item of items) {
    if (item.unitCostCentavos === undefined) {
      uncostedUnits += item.quantity
    } else {
      const cost = item.unitCostCentavos * item.quantity
      costOfGoods += cost
      grossProfit += item.lineTotalCentavos - cost
    }
  }
  return { costOfGoods, grossProfit, uncostedUnits }
}
