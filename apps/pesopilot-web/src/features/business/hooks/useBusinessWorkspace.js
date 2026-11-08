import { useCallback, useEffect, useRef, useState } from 'react'
import { businessService } from '../services/businessService.js'
import { posCatalogService } from '../services/posCatalogService.js'

export function useBusinessWorkspace() {
  const [products, setProducts] = useState([])
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
      const [nextProducts, nextSales, nextEvents] = await Promise.all([
        businessService.listProducts(),
        businessService.listSalesHistory(),
        businessService.listAuditEvents(),
      ])
      if (!mounted.current || current !== sequence.current) return
      setProducts(nextProducts)
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

  return {
    products, sales, events, isLoading, error, refresh,
    summary: businessService.summarizeSales(sales),
    addProduct: (value) => mutate(() => businessService.addProduct(value)),
    adjustStock: (value) => mutate(() => businessService.adjustStock(value)),
    completeSale: (value) => mutate(() => businessService.completeSale(value)),
    loadSampleCatalog: (confirmed) => mutate(() => posCatalogService.loadSampleCatalog(confirmed)),
  }
}
