import { productPhotoService } from '../services/productPhotoService.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { businessService } from '../services/businessService.js'

export function useBusinessWorkspace() {
  const [products, setProducts] = useState([])
  const [photos, setPhotos] = useState([])
  const [sales, setSales] = useState([])
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const mounted = useRef(false)
  const sequence = useRef(0)

  const refresh = useCallback(async () => {
    const current = ++sequence.current
    setIsLoading(true)
    try {
      const [nextProducts, nextSales, nextEvents, nextPhotos] = await Promise.all([
        businessService.listProducts(),
        businessService.listSalesHistory(),
        businessService.listAuditEvents(),
        productPhotoService.list(),
      ])
      if (!mounted.current || current !== sequence.current) return
      setProducts(nextProducts)
      setPhotos(nextPhotos)
      setSales(nextSales)
      setEvents(nextEvents)
      setError(null)
    } catch (failure) {
      if (mounted.current && current === sequence.current) {
        setError(failure.message || 'Unable to read business data')
      }
    } finally {
      if (mounted.current && current === sequence.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      mounted.current = false
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  const mutate = useCallback(async (operation) => {
    try {
      return await operation()
    } finally {
      // Refresh stale stock after a rejected sale too. Read errors are reported
      // separately and never turn an already committed sale into a failed write.
      await refresh()
    }
  }, [refresh])

  const archived = new Set(products.filter((product) => product.catalog?.sampleKey).map((product) => product.id))
  const archivedSales = new Set(sales.filter((sale) => sale.items.some((item) => archived.has(item.productId))).map((sale) => sale.id))
  const actualSales = sales.filter((sale) => !archivedSales.has(sale.id))
  return {
    legacy: archived.size > 0,
    products: products.filter((product) => !archived.has(product.id)), photos, sales: actualSales, events: events.filter((event) => !archivedSales.has(event.saleId) && !archived.has(event.payload.productId)), isLoading, error, refresh,
    summary: businessService.summarizeSales(actualSales),
    uploadPhoto: (file, familyId) => mutate(() => productPhotoService.upload(file, familyId)),
    removePhoto: (familyId) => mutate(() => productPhotoService.remove(familyId)),
    addProduct: (value) => mutate(() => businessService.addProduct(value)),
    adjustStock: (value) => mutate(() => businessService.adjustStock(value)),
    completeSale: (value) => mutate(() => businessService.completeSale(value)),
  }
}
