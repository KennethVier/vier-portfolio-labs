import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { formatPrice, titleCase } from '../../utils/formatters.js';

const ProductGrid = ({
  eyebrow,
  title,
  products,
  currentPage,
  totalPages,
  onPageChange,
  onAddToCart,
  onAddToFavorites,
  children,
  status = 'ready',
  errorMessage = 'Unable to load products. Start the shop service and refresh the page.',
  emptyMessage = 'Try another section or come back when the next drop lands.',
  loadingMessage = 'Loading the latest pieces...'
}) => {
  const navigate = useNavigate();
  const isLoading = status === 'loading';
  const hasError = status === 'error';

  return (
    <main className="catalog-page">
      <section className="catalog-header">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{products.length} curated picks ready for your next rotation.</p>
      </section>

      {children}

      {isLoading && (
        <section className="empty-state state-panel">
          <i className="bi bi-arrow-repeat state-spinner" />
          <h2>{loadingMessage}</h2>
          <p>Pulling fresh product data from the shop service.</p>
        </section>
      )}

      {hasError && (
        <section className="empty-state state-panel error-state">
          <i className="bi bi-wifi-off" />
          <h2>Shop service unavailable</h2>
          <p>{errorMessage}</p>
        </section>
      )}

      {!isLoading && !hasError && products.length === 0 ? (
        <section className="empty-state">
          <i className="bi bi-bag-x" />
          <h2>No pieces found</h2>
          <p>{emptyMessage}</p>
        </section>
      ) : null}

      {!isLoading && !hasError && products.length > 0 && (
        <section className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <button className="product-image-wrap" type="button" onClick={() => navigate(`/product/${product.id}`)}>
                <img src={product.imageUrl} alt={product.productName} />
                <span className="stock-pill">{product.stocks > 0 ? `${product.stocks} left` : 'Sold out'}</span>
              </button>
              <div className="product-info">
                <button className="product-title-button" type="button" onClick={() => navigate(`/product/${product.id}`)}>
                  <span className="product-meta">{titleCase(product.section)} / {titleCase(product.category)}</span>
                  <h2>{product.productName}</h2>
                </button>
                <div className="product-buy-row">
                  <strong>{formatPrice(product.productPrice)}</strong>
                  <Button onAddToCart={() => onAddToCart(product)} onAddToFavorites={() => onAddToFavorites(product)} disabled={product.stocks <= 0} />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {!isLoading && !hasError && totalPages > 1 && (
        <nav className="pagination-bar" aria-label="Product pages">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              type="button"
              className={index + 1 === currentPage ? 'active' : ''}
              onClick={() => onPageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </nav>
      )}
    </main>
  );
};

export default ProductGrid;