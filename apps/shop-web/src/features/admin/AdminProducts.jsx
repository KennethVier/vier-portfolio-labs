import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProduct, deleteProduct, updateProduct } from '../../api/productApi';
import { getApiErrorMessage } from '../../utils/apiErrors.js';
import { lockAdmin } from './adminAuth.js';
import { useProducts } from '../../hooks/useProducts';
import AdminProductForm from './components/AdminProductForm.jsx';
import AdminProductTable from './components/AdminProductTable.jsx';
import DeleteProductModal from './components/DeleteProductModal.jsx';

const emptyForm = {
  productName: '',
  productPrice: '',
  category: 'tops',
  section: 'women',
  stocks: '',
  imageUrl: ''
};

const AdminProducts = () => {
  const navigate = useNavigate();
  const { products, status, errorMessage, refetch: loadProducts } = useProducts();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => product.productName.toLowerCase().includes(query.toLowerCase().trim()))
      .filter((product) => sectionFilter === 'all' || product.section === sectionFilter);
  }, [products, query, sectionFilter]);

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      productName: form.productName.trim(),
      productPrice: Number(form.productPrice),
      stocks: Number(form.stocks),
      imageUrl: form.imageUrl.trim()
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage('Product updated.');
      } else {
        await addProduct(payload);
        setMessage('Product added.');
      }
      resetForm();
      loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, 'Unable to save product. Check required fields.'));
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      productName: product.productName,
      productPrice: product.productPrice,
      category: product.category,
      section: product.section,
      stocks: product.stocks,
      imageUrl: product.imageUrl || ''
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteProduct(deleteTarget.id);
      setMessage('Product deleted.');
      setDeleteTarget(null);
      loadProducts();
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, 'Unable to delete product.'));
    }
  };

  const handleLockAdmin = () => {
    lockAdmin();
    navigate('/shop');
  };

  return (
    <main className="admin-page">
      <section className="catalog-header admin-header-row">
        <div>
          <span className="eyebrow">Product manager</span>
          <h1>Manage the storefront catalog.</h1>
          <p>Add, edit, and remove products for the ecommerce prototype.</p>
        </div>
        <button className="btn-ghost-shop" type="button" onClick={handleLockAdmin}>Lock admin</button>
      </section>

      <div className="admin-layout">
        <AdminProductForm
          form={form}
          editingId={editingId}
          message={message}
          onCancel={resetForm}
          onChange={updateField}
          onSubmit={submitProduct}
        />
        <AdminProductTable
          products={filteredProducts}
          query={query}
          sectionFilter={sectionFilter}
          status={status}
          errorMessage={errorMessage}
          onQueryChange={setQuery}
          onSectionChange={setSectionFilter}
          onEdit={editProduct}
          onDelete={setDeleteTarget}
        />
      </div>

      <DeleteProductModal product={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </main>
  );
};

export default AdminProducts;