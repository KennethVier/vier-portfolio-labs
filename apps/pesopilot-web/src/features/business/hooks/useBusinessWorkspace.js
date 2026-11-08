import { useCallback, useEffect, useState } from 'react'
import { businessService } from '../services/businessService.js'

export function useBusinessWorkspace() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const [nextProducts, nextSales, nextEvents] = await Promise.all([
        businessService.listProducts(),
        businessService.listSales(),
        businessService.listAuditEvents(),
      ])
      setProducts(nextProducts)
      setSales(nextSales)
      setEvents(nextEvents)
      setError(null)
    } catch (failure) {
      setError(failure.message || 'Unable to read business data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const mutate = useCallback(async (operation) => {
    const result = await operation()
    await refresh()
    return result
  }, [refresh])

  return {
    products, sales, events, isLoading, error,
    addProduct: (value) => mutate(() => businessService.addProduct(value)),
    receiveStock: (value) => mutate(() => businessService.receiveStock(value)),
    completeSale: (value) => mutate(() => businessService.completeSale(value)),
  }
}
