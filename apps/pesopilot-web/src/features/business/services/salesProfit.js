// Cost corrections are append-only events. Original sale item snapshots remain unchanged.
export function applyHistoricalCostCorrections(items, events = []) {
  const corrected = new Map()
  for (const event of [...events].sort((a, b) => a.id - b.id)) {
    if (event.type === 'cost_correction') {
      corrected.set(event.payload.saleItemId, event.payload.correctedUnitCostCentavos)
    }
  }
  return items.map(item => corrected.has(item.id)
    ? { ...item, unitCostCentavos: corrected.get(item.id), costCorrected: true }
    : item)
}

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
