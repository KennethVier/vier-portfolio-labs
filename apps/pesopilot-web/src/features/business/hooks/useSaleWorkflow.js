import { useRef, useState } from 'react'
import { businessService } from '../services/businessService.js'

export function useSaleWorkflow(products, completeSale) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [review, setReview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const pending = useRef(null)
  const locked = useRef(false)
  const product = products.find((item) => item.id === productId)
  let preview = null
  let validation = ''
  try {
    preview = businessService.previewSale(product, Number(quantity))
  } catch (failure) {
    validation = failure.message
  }

  function reviewSale(event) {
    event.preventDefault()
    if (!preview || locked.current) return
    setError('')
    setNotice('')
    setReview({ ...preview, productId, productName: product.name, paymentMethod })
  }

  function editSale() {
    if (locked.current || pending.current) return
    setReview(null)
    setError('')
  }

  async function confirmSale() {
    if (!review || locked.current) return
    locked.current = true
    setSaving(true)
    setError('')
    try {
      if (!pending.current) {
        pending.current = {
          requestKey: globalThis.crypto.randomUUID(),
          ownerConfirmed: true,
          paymentMethod: review.paymentMethod,
          items: [{ productId: review.productId, quantity: review.quantity,
            expectedUnitPriceCentavos: review.unitPriceCentavos }],
        }
      }
      const result = await completeSale(pending.current)
      pending.current = null
      setReview(null)
      setProductId('')
      setQuantity('1')
      setNotice(result.duplicate ? 'This sale was already recorded. Stock was not deducted again.' :
        'Sale recorded. Stock and internal history updated.')
    } catch (failure) {
      if (failure.saleNotRecorded) pending.current = null
      setError(failure.message || 'Unable to confirm the result. Retry this same sale.')
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  return { productId, setProductId, quantity, setQuantity, paymentMethod, setPaymentMethod,
    product, preview, validation, review, reviewSale, editSale, confirmSale, saving, error, notice,
    canEdit: !saving && !pending.current }
}
