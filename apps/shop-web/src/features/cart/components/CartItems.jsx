import { formatPrice } from '../../../utils/formatters.js';

const CartItems = ({ items, currentPage, totalPages, onPageChange, onAdd, onRemove, onRemoveItem }) => (
  <section className="bag-items">
    {items.map((item) => (
      <article className="bag-item" key={item.id}>
        <img src={item.imageUrl} alt={item.productName} />
        <div className="bag-item-info">
          <span>{item.section} / {item.category}</span>
          <h2>{item.productName}</h2>
          <strong>{formatPrice(item.productPrice)}</strong>
          <button className="text-link-btn" type="button" onClick={() => onRemoveItem(item)}>Remove</button>
        </div>
        <div className="quantity-control" aria-label={`Quantity for ${item.productName}`}>
          <button type="button" onClick={() => onRemove(item)}>-</button>
          <span>{item.quantity}</span>
          <button type="button" onClick={() => onAdd(item)} disabled={item.quantity >= item.stocks}>+</button>
        </div>
      </article>
    ))}

    {totalPages > 1 && (
      <nav className="pagination-bar" aria-label="Cart pages">
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
  </section>
);

export default CartItems;