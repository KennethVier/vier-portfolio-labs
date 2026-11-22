import { useRef, useState } from 'react'
import { businessService, parsePriceCentavos } from '../services/businessService.js'

export function useSaleWorkflow(products, completeSale, initialProductId = '', onRecorded, { catalogPrices = false } = {}) {
  const [productId, setProductId] = useState(initialProductId)
  const [quantity, setQuantity] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [agreedPrice, setAgreedPrice] = useState('')
  const [mix, setMix] = useState(null)
  const [review, setReview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const pending = useRef(null)
  const locked = useRef(false)
  const product = products.find((item) => item.id === productId)
  const isSet = product?.catalog?.type === 'Set'
  const pieces = products.filter(item => item.catalog?.type === 'Solo' && item.catalog?.scent)
  const pieceQuantity = pieces.reduce((sum, item) => sum + Number(mix?.[item.id] ?? quantity), 0)
  let items = []
  let preview = null
  let validation = ''
  try {
    const count = Number(quantity)
    const unitPriceCentavos = agreedPrice.trim() ? parsePriceCentavos(agreedPrice) : isSet && !catalogPrices ? 15000 : product?.unitPriceCentavos
    if (isSet) {
      if (!Number.isSafeInteger(count) || count < 1 || pieceQuantity !== count * 5) throw new Error('Choose exactly five pieces per set.')
      const remaining = new Map()
      items = pieces.flatMap(item => {
        const units = Number(mix?.[item.id] ?? quantity)
        if (!Number.isSafeInteger(units) || units < 0) throw new Error('Enter whole scent quantities.')
        if (!units) return []
        const available = remaining.get(item.inventoryPoolId) ?? item.stockQuantity
        if (units > available) throw new Error('Add stock or choose a different mix.')
        remaining.set(item.inventoryPoolId, available - units)
        return [{ productId: item.id, quantity: units, expectedUnitPriceCentavos: item.unitPriceCentavos, acceptedUnitPriceCentavos: unitPriceCentavos, saleFormat: isSet ? 'set' : 'solo' }]
      })
    } else {
      businessService.previewSale(product, count)
      items = [{ productId, quantity: count, expectedUnitPriceCentavos: product.unitPriceCentavos, acceptedUnitPriceCentavos: unitPriceCentavos, saleFormat: isSet ? 'set' : 'solo' }]
    }
    const units = isSet ? pieceQuantity : count
    const totalCentavos = units * unitPriceCentavos
    if (!Number.isSafeInteger(totalCentavos)) throw new Error('Sale amount exceeds supported limit')
    preview = { quantity: units, unitPriceCentavos, totalCentavos }
  } catch (failure) {
    validation = failure.message
  }

  function reviewSale(event) {
    event.preventDefault()
    if (!preview || locked.current) return
    setError('')
    setNotice('')
    setReview({ ...preview, productId, productName: isSet ? product.catalog.family + ' Set' : product.name, paymentMethod, items,
      variantLabel: isSet ? items.map(item => item.quantity + ' × ' + pieces.find(piece => piece.id === item.productId).catalog.scent).join(' · ') : [product.catalog?.scent, product.catalog?.type, product.catalog?.size].filter(Boolean).join(' · ') })
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
          items: review.items,
        }
      }
      const result = await completeSale(pending.current)
      pending.current = null
      setReview(null)
      setProductId('')
      setQuantity('1')
      const message = result.duplicate ? 'This sale was already recorded. Stock was not deducted again.' :
        'Sale recorded. Stock and internal history updated.'
      setNotice(message)
      onRecorded?.(message)
    } catch (failure) {
      if (failure.saleNotRecorded) pending.current = null
      setError(failure.message || 'Unable to confirm the result. Retry this same sale.')
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  return { productId, setProductId, quantity, setQuantity, paymentMethod, setPaymentMethod,
    agreedPrice, setAgreedPrice, mix, setMix, isSet, pieces,
    product, preview, validation, review, reviewSale, editSale, confirmSale, saving, error, notice,
    canEdit: !saving && !pending.current }
}
