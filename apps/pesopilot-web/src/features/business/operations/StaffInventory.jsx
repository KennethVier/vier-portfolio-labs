import { DailyStock } from '../components/DailyStock.jsx'
import { InventoryPanel } from '../components/InventoryPanel.jsx'
export function StaffInventory({ work }) {
  const products = work.products.filter(
    (product) => product.catalog?.type !== 'Set' && !product.catalog?.sampleKey,
  )
  if (!products.length)
    return (
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 space-y-2">
        <h2 className="font-heading text-xl">No products available yet</h2>
        <p>
          Connect to receive the shared product list after the owner finishes
          setup. Branch stock starts at zero; no deliveries are created
          automatically.
        </p>
      </section>
    )
  return (
    <InventoryPanel
      operational
      products={products}
      adjustStock={work.service.adjustStock}
      disabled={work.isLoading || Boolean(work.error)}
    >
      <DailyStock
        operational
        branchName={
          work.branches?.find((branch) => branch.id === work.branchId)?.name
        }
        products={products}
        receiveStock={work.receiveStock}
        disabled={work.isLoading || Boolean(work.error)}
      />
    </InventoryPanel>
  )
}
