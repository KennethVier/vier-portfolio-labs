import { useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { CartContext } from './cartContextValue.js';
import { useCartSummary } from '../../hooks/useCartSummary';
import { usePagination } from '../../hooks/usePagination';
import CartEmptyState from './components/CartEmptyState.jsx';
import CartItems from './components/CartItems.jsx';
import CartSummary from './components/CartSummary.jsx';

const ITEMS_PER_PAGE = 6;

export default function Cart() {
  const { cartItems, addToCart, removeFromCart, removeItemFromCart, clearCart } = useContext(CartContext);
  const { subtotal, isEmpty } = useCartSummary(cartItems);
  const { currentItems, currentPage, setCurrentPage, totalPages } = usePagination(cartItems, ITEMS_PER_PAGE, String(cartItems.length));
  const navigate = useNavigate();

  return (
    <main className="bag-page">
      <section className="bag-header">
        <span className="eyebrow">Shopping bag</span>
        <h1>Your next look is almost yours.</h1>
        <p>{cartItems.length} item{cartItems.length === 1 ? '' : 's'} saved in your cart.</p>
      </section>

      {isEmpty ? (
        <CartEmptyState onBrowse={() => navigate('/collections')} />
      ) : (
        <div className="bag-layout">
          <CartItems
            items={currentItems}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onRemoveItem={removeItemFromCart}
          />
          <CartSummary subtotal={subtotal} onCheckout={() => navigate('/payment')} onClear={clearCart} />
        </div>
      )}
    </main>
  );
}

Cart.propTypes = {
  showModal: PropTypes.bool,
  toggle: PropTypes.func
};