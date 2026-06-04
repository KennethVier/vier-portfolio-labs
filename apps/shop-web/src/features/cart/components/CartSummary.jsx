import { formatPrice } from '../../../utils/formatters.js';

const CartSummary = ({ subtotal, onCheckout, onClear }) => (
  <aside className="order-summary">
    <span className="eyebrow">Order summary</span>
    <div className="summary-line">
      <span>Subtotal</span>
      <strong>{formatPrice(subtotal)}</strong>
    </div>
    <div className="summary-line muted">
      <span>Shipping</span>
      <strong>Calculated later</strong>
    </div>
    <div className="summary-total">
      <span>Total</span>
      <strong>{formatPrice(subtotal)}</strong>
    </div>
    <button className="btn-primary-shop full" type="button" onClick={onCheckout}>Checkout</button>
    <button className="btn-ghost-shop full" type="button" onClick={onClear}>Clear bag</button>
  </aside>
);

export default CartSummary;