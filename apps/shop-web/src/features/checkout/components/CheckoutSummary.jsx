import { formatPrice } from '../../../utils/formatters.js';

const CheckoutSummary = ({ itemCount, total }) => (
  <aside className="order-summary checkout-summary">
    <span className="eyebrow">Current bag</span>
    <div className="summary-line">
      <span>Items</span>
      <strong>{itemCount}</strong>
    </div>
    <div className="summary-total">
      <span>Total</span>
      <strong>{formatPrice(total)}</strong>
    </div>
    <p>Your order will be saved by the shop service and inventory will update after checkout.</p>
  </aside>
);

export default CheckoutSummary;