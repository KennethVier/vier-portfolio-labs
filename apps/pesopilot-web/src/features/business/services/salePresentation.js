const scentedName = /^(Hallelujah (?:Rub|Roll)|Reigna Aroma (?:Rub|Roll)) · [^·]+ · (Solo|Set)$/

export function productScentName(name) {
  return scentedName.test(name) ? name.replace(/ · (Solo|Set)$/, '') : name
}

export function inferredSet(saleItems) {
  if (saleItems.length < 2) return false
  const first = scentedName.exec(saleItems[0].productNameSnapshot)
  if (!first || first[2] !== 'Solo') return false
  const units = saleItems.reduce((sum, item) => sum + item.quantity, 0)
  return units % 5 === 0 && saleItems.every(item => {
    const match = scentedName.exec(item.productNameSnapshot)
    return item.saleFormat === undefined && match?.[1] === first[1] && match?.[2] === 'Solo' &&
      item.unitPriceCentavos === saleItems[0].unitPriceCentavos
  })
}

export function soldAs(item, inferred) {
  if (item.saleFormat) return item.saleFormat === 'set' ? 'Set' : 'Solo'
  if (inferred) return 'Set (inferred)'
  const match = scentedName.exec(item.productNameSnapshot)
  if (match?.[2] === 'Set') return 'Set'
  if (match?.[2] === 'Solo') return item.quantity % 5 === 0 ? 'Unrecorded' : 'Solo'
  return ''
}
