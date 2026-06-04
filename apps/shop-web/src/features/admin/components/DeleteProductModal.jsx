const DeleteProductModal = ({ product, onCancel, onConfirm }) => {
  if (!product) return null;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label="Delete product confirmation">
      <section className="admin-confirm-modal">
        <span className="eyebrow">Confirm delete</span>
        <h2>Delete {product.productName}?</h2>
        <p>This removes the product from the catalog.</p>
        <div className="admin-actions">
          <button className="btn-primary-shop" type="button" onClick={onConfirm}>Delete product</button>
          <button className="btn-ghost-shop" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </section>
    </div>
  );
};

export default DeleteProductModal;