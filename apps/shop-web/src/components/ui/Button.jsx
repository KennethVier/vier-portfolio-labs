import { useState } from 'react';

const Button = ({ onAddToCart, onAddToFavorites, disabled = false }) => {
  const [message, setMessage] = useState('');

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 1800);
  };

  const handleAddToCart = () => {
    if (disabled) return;
    const added = onAddToCart();
    showMessage(added === false ? 'Stock limit reached' : 'Added to cart');
  };

  const handleAddToFavorites = () => {
    onAddToFavorites();
    showMessage('Saved');
  };

  return (
    <div className="product-actions">
      <button className="add-cart-btn" type="button" onClick={handleAddToCart} disabled={disabled}>
        <i className="bi bi-bag-plus" />
        {disabled ? 'Sold out' : 'Add'}
      </button>
      <button className="save-btn" type="button" onClick={handleAddToFavorites} aria-label="Save to favorites">
        <i className="bi bi-heart" />
      </button>
      {message && <span className="action-toast">{message}</span>}
    </div>
  );
};

export default Button;