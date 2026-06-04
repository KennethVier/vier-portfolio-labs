import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from './cartContextValue.js';
import { usePagination } from '../../hooks/usePagination';
import { formatPrice } from '../../utils/formatters.js';

const ITEMS_PER_PAGE = 6;

export default function Favorites() {
  const { favoritesItems, addToCart, removeFromFavorites, clearFavorites } = useContext(CartContext);
  const navigate = useNavigate();
  const { currentItems, currentPage, setCurrentPage, totalPages } = usePagination(
    favoritesItems,
    ITEMS_PER_PAGE,
    String(favoritesItems.length)
  );

  const handleOrderNow = (item) => {
    addToCart(item);
    removeFromFavorites(item);
    navigate('/cart');
  };

  return (
    <main className="catalog-page">
      <section className="catalog-header">
        <span className="eyebrow">Saved picks</span>
        <h1>Your maybe-later rack.</h1>
        <p>Keep the pieces you are considering, then move them to cart when the fit clicks.</p>
      </section>

      {favoritesItems.length === 0 ? (
        <section className="empty-state">
          <i className="bi bi-heart" />
          <h2>No favorites yet</h2>
          <p>Save pieces while browsing and come back when you are ready.</p>
          <button className="btn-primary-shop" type="button" onClick={() => navigate('/collections')}>Browse pieces</button>
        </section>
      ) : (
        <>
          <section className="product-grid">
            {currentItems.map((item) => (
              <article className="product-card" key={item.id}>
                <button className="product-image-wrap" type="button" onClick={() => navigate(`/product/${item.id}`)}>
                  <img src={item.imageUrl} alt={item.productName} />
                  <span className="stock-pill">Saved</span>
                </button>
                <div className="product-info">
                  <span className="product-meta">{item.section} / {item.category}</span>
                  <h2>{item.productName}</h2>
                  <div className="product-buy-row">
                    <strong>{formatPrice(item.productPrice)}</strong>
                    <button className="add-cart-btn" type="button" onClick={() => handleOrderNow(item)}>
                      <i className="bi bi-bag-plus" />
                      Move to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="center-actions">
            <button className="btn-ghost-shop" type="button" onClick={clearFavorites}>Clear favorites</button>
          </div>

          {totalPages > 1 && (
            <nav className="pagination-bar" aria-label="Favorite pages">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index + 1 === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
          )}
        </>
      )}
    </main>
  );
}