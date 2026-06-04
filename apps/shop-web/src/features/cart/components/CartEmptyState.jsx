const CartEmptyState = ({ onBrowse }) => (
  <section className="empty-state">
    <i className="bi bi-bag" />
    <h2>Your cart is empty</h2>
    <p>Start with the latest collection and build a fit worth checking out.</p>
    <button className="btn-primary-shop" type="button" onClick={onBrowse}>Shop collection</button>
  </section>
);

export default CartEmptyState;