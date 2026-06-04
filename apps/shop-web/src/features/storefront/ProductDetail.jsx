import { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CartContext } from '../cart/cartContextValue.js';
import { formatPrice } from '../../utils/formatters.js';
import { useProductDetail } from '../../hooks/useProducts';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToFavorites } = useContext(CartContext);
  const { product, status, errorMessage } = useProductDetail(id);
  const [message, setMessage] = useState('');

  const addProductToCart = () => {
    const added = addToCart(product);
    setMessage(added === false ? 'Stock limit reached' : 'Added to cart');
  };

  if (status === 'loading') {
    return (
      <main className="catalog-page">
        <section className="empty-state state-panel">
          <i className="bi bi-arrow-repeat state-spinner" />
          <h2>Loading product...</h2>
          <p>Fetching the latest product details from the shop service.</p>
        </section>
      </main>
    );
  }

  if (status === 'error' || !product) {
    return (
      <main className="catalog-page">
        <section className="empty-state error-state">
          <i className="bi bi-exclamation-circle" />
          <h2>Product not available</h2>
          <p>{errorMessage}</p>
          <button className="btn-primary-shop" type="button" onClick={() => navigate('/collections')}>Back to collection</button>
        </section>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <section className="product-detail-media">
        <img src={product.imageUrl} alt={product.productName} />
      </section>
      <section className="product-detail-info">
        <span className="eyebrow">{product.section} / {product.category}</span>
        <h1>{product.productName}</h1>
        <strong>{formatPrice(product.productPrice)}</strong>
        <p>Designed for daily rotation, styled for attention, and ready to anchor your next outfit.</p>
        <div className="detail-stock-row">
          <span>{product.stocks > 0 ? `${product.stocks} pieces available` : 'Sold out'}</span>
        </div>
        <div className="hero-actions">
          <button className="btn-primary-shop" type="button" disabled={product.stocks <= 0} onClick={addProductToCart}>
            <i className="bi bi-bag-plus" />
            Add to bag
          </button>
          <button className="btn-ghost-shop" type="button" onClick={() => addToFavorites(product)}>
            <i className="bi bi-heart" />
            Save item
          </button>
        </div>
        {message && <p className="detail-message">{message}</p>}
      </section>
    </main>
  );
};

export default ProductDetail;