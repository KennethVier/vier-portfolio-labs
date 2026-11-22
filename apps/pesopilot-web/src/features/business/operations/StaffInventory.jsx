import { DailyStock } from '../components/DailyStock.jsx'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { selectClass } from '../components/businessPresentation.js'
function label(product) {
  return [
    product.name,
    ...[
      product.catalog?.scent,
      product.catalog?.type,
      product.catalog?.size,
    ].filter(
      (value) =>
        value && !product.name.toLowerCase().includes(value.toLowerCase()),
    ),
  ].join(' · ')
}
export function StaffInventory({ work }) {
  const [search, setSearch] = useState('')
  const [productId, setProductId] = useState('')
  const [direction, setDirection] = useState('add')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [review, setReview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const key = useRef(crypto.randomUUID())
  const lock = useRef(false)
  const products = work.products.filter(
    (product) => product.catalog?.type !== 'Set' && !product.catalog?.sampleKey,
  )
  const matches = products.filter((product) =>
    label(product).toLowerCase().includes(search.trim().toLowerCase()),
  )
  const selected = products.find((product) => product.id === productId)
  function prepare(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (
      !selected ||
      !Number.isSafeInteger(Number(quantity)) ||
      Number(quantity) <= 0 ||
      !reason.trim()
    ) {
      setError(
        'Choose a product, enter a whole quantity and explain the stock change.',
      )
      return
    }
    setReview({
      productId,
      direction,
      quantity: Number(quantity),
      reason: reason.trim(),
      name: label(selected),
    })
  }
  async function confirm() {
    if (!review || lock.current) return
    lock.current = true
    setSaving(true)
    setError('')
    try {
      await work.service.adjustStock({
        productId: review.productId,
        quantity: review.quantity,
        direction: review.direction,
        reason: review.reason,
        requestKey: key.current,
      })
      setNotice(
        `${review.quantity} units ${review.direction === 'add' ? 'received' : 'removed'} for ${review.name}. Saved on this device; other devices update after changes are shared.`,
      )
      setReview(null)
      setQuantity('')
      setReason('')
      key.current = crypto.randomUUID()
    } catch (failure) {
      setError(
        failure.message ||
          'Stock could not be saved. Your entries are kept; retry this change.',
      )
    } finally {
      lock.current = false
      setSaving(false)
    }
  }
  if (!products.length)
    return (
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 space-y-2">
        <h2 className="font-heading text-xl">No products available yet</h2>
        <p>
          No products are available for this branch yet. Ask the owner to add
          products in Products.
        </p>
        <p className="text-sm">
          Once the owner shares the product list, select a product or scent here
          and record the units physically present. POS will use that branch
          stock.
        </p>
      </section>
    )
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 space-y-4">
      <h2 className="font-heading text-xl">Receive or remove stock</h2>
      <p className="text-sm">
        Receive the units physically present in your branch. A stock removal
        needs a reason. Both update the same inventory used by POS.
      </p>
      {notice && (
        <p role="status">
          {notice}{' '}
          <Link
            to="/business"
            className="inline-flex min-h-11 items-center font-semibold underline"
          >
            Open POS
          </Link>
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <form onSubmit={prepare} aria-label="Receive or remove stock">
        <fieldset
          disabled={saving || Boolean(review) || work.isLoading}
          className="space-y-3"
        >
          <Input
            label="Find a product or scent"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setProductId('')
            }}
          />
          {matches.length ? (
            <label className="block font-semibold">
              Product / scent
              <select
                name="productId"
                className={selectClass}
                value={productId}
                required
                onChange={(event) => setProductId(event.target.value)}
              >
                <option value="">Choose product or scent</option>
                {matches.map((product) => (
                  <option key={product.id} value={product.id}>
                    {label(product)} · {product.stockQuantity} in branch
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>
              No matching products.{' '}
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setProductId('')
                }}
              >
                Clear search
              </Button>
            </p>
          )}
          {selected && (
            <p>
              Current branch stock: <strong>{selected.stockQuantity}</strong>{' '}
              units.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              Stock change
              <select
                name="direction"
                className={selectClass}
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
              >
                <option value="add">Receive stock</option>
                <option value="remove">Remove stock</option>
              </select>
            </label>
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <Input
            label="Reason"
            name="reason"
            placeholder="For example: delivery checked or damaged unit"
            maxLength={240}
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <Button type="submit" disabled={!selected}>
            Review stock change
          </Button>
        </fieldset>
      </form>
      {review && (
        <section
          aria-label="Review stock change"
          className="rounded-lg border border-outline-variant p-4 space-y-3"
        >
          <p className="font-semibold">
            {review.direction === 'add' ? 'Receive' : 'Remove'}{' '}
            {review.quantity} units · {review.name}
          </p>
          <p>Reason: {review.reason}</p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={saving} onClick={confirm}>
              {saving ? 'Saving…' : 'Confirm stock change'}
            </Button>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setReview(null)
                setError('')
              }}
            >
              Back to edit
            </Button>
          </div>
        </section>
      )}
      <DailyStock
        operational
        products={work.products}
        receiveStock={work.receiveStock}
        disabled={work.isLoading || Boolean(work.error)}
      />
    </section>
  )
}
