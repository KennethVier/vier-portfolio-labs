const AdminProductForm = ({ form, editingId, message, onCancel, onChange, onSubmit }) => (
  <form className="admin-form" onSubmit={onSubmit}>
    <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
    <label>
      Product name
      <input required value={form.productName} onChange={(event) => onChange('productName', event.target.value)} />
    </label>
    <div className="admin-form-row">
      <label>
        Price
        <input required min="0" type="number" value={form.productPrice} onChange={(event) => onChange('productPrice', event.target.value)} />
      </label>
      <label>
        Stock
        <input required min="0" type="number" value={form.stocks} onChange={(event) => onChange('stocks', event.target.value)} />
      </label>
    </div>
    <div className="admin-form-row">
      <label>
        Section
        <select value={form.section} onChange={(event) => onChange('section', event.target.value)}>
          <option value="women">Women</option>
          <option value="men">Men</option>
        </select>
      </label>
      <label>
        Category
        <select value={form.category} onChange={(event) => onChange('category', event.target.value)}>
          <option value="tops">Tops</option>
          <option value="bottoms">Bottoms</option>
          <option value="dress">Dress</option>
          <option value="footwear">Footwear</option>
          <option value="accessories">Accessories</option>
          <option value="others">Others</option>
        </select>
      </label>
    </div>
    <label>
      Image URL
      <input value={form.imageUrl} onChange={(event) => onChange('imageUrl', event.target.value)} placeholder="/images/product.jpg" />
    </label>
    {form.imageUrl && (
      <div className="admin-image-preview">
        <img src={form.imageUrl} alt="Product preview" />
        <span>Image preview</span>
      </div>
    )}
    <div className="admin-actions">
      <button className="btn-primary-shop" type="submit">{editingId ? 'Update product' : 'Add product'}</button>
      {editingId && <button className="btn-ghost-shop" type="button" onClick={onCancel}>Cancel</button>}
    </div>
    {message && <p className="admin-message">{message}</p>}
  </form>
);

export default AdminProductForm;