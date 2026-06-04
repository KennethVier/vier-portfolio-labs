import { formatPrice } from '../../../utils/formatters.js';

const AdminProductTable = ({ products, query, sectionFilter, status, errorMessage, onQueryChange, onSectionChange, onEdit, onDelete }) => (
  <section className="admin-table-wrap">
    <div className="admin-table-toolbar">
      <label className="search-box admin-search">
        <i className="bi bi-search" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search products" />
      </label>
      <select value={sectionFilter} onChange={(event) => onSectionChange(event.target.value)}>
        <option value="all">All sections</option>
        <option value="women">Women</option>
        <option value="men">Men</option>
      </select>
    </div>

    {status === 'loading' && (
      <section className="empty-state state-panel compact-state">
        <i className="bi bi-arrow-repeat state-spinner" />
        <h2>Loading catalog...</h2>
        <p>Fetching products from the shop service.</p>
      </section>
    )}

    {status === 'error' && (
      <section className="empty-state state-panel error-state compact-state">
        <i className="bi bi-wifi-off" />
        <h2>Catalog unavailable</h2>
        <p>{errorMessage}</p>
      </section>
    )}

    {status === 'ready' && products.length === 0 && (
      <section className="empty-state compact-state">
        <i className="bi bi-box-seam" />
        <h2>No products found</h2>
        <p>Add a product or adjust the current filter.</p>
      </section>
    )}

    {status === 'ready' && products.length > 0 && (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="admin-product-cell">
                  <img src={product.imageUrl} alt={product.productName} />
                  <span>{product.productName}</span>
                </div>
              </td>
              <td>{product.section} / {product.category}</td>
              <td>{formatPrice(product.productPrice)}</td>
              <td>{product.stocks}</td>
              <td>
                <button type="button" onClick={() => onEdit(product)}>Edit</button>
                <button type="button" onClick={() => onDelete(product)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
);

export default AdminProductTable;