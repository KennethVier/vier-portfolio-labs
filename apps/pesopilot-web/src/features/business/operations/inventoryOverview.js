export function inventoryOverviewRows(overviews) {
  const rows = []
  for (const view of overviews) {
    const groups = new Map()
    for (const product of view.products) {
      const group = groups.get(product.inventoryPoolId) ?? []
      group.push(product)
      groups.set(product.inventoryPoolId, group)
    }
    for (const [poolId, products] of groups) {
      const physical = products.filter(
        (product) => product.catalog?.type !== 'Set',
      )
      const pool = view.pools?.find((row) => row.id === poolId)
      if (!physical.length && pool?.stockQuantity === 0) continue // Price-only Set option.
      const display = physical.length ? physical : products
      const available = Number.isSafeInteger(pool?.stockQuantity)
        ? pool.stockQuantity
        : null
      const categories = [
        ...new Set(display.map((p) => p.catalog?.category ?? 'Other products')),
      ].sort()
      const names = [
        ...new Set(display.map((p) => p.catalog?.family ?? p.name)),
      ].sort()
      const variants = [
        ...new Set(
          display.map(
            (p) =>
              [p.catalog?.scent, p.catalog?.size, p.catalog?.type]
                .filter(Boolean)
                .join(' · ') || p.name,
          ),
        ),
      ].sort()
      rows.push({
        key: JSON.stringify([view.branch.id, poolId]),
        branchId: view.branch.id,
        branch: view.branch.name,
        categories,
        names,
        variants,
        products,
        available,
        shared: products.length > 1,
        status:
          available === null
            ? 'Unavailable'
            : !physical.length || available < 0
              ? 'Needs review'
              : available === 0
                ? 'Out of stock'
                : available <= 2
                  ? 'Low stock'
                  : 'Available',
      })
    }
  }
  return rows.sort(
    (a, b) =>
      a.categories.join().localeCompare(b.categories.join()) ||
      a.names.join().localeCompare(b.names.join()) ||
      a.variants.join().localeCompare(b.variants.join()) ||
      a.branch.localeCompare(b.branch),
  )
}
