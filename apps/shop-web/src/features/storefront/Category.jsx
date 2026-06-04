import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { CartContext } from '../cart/cartContextValue.js';
import ProductGrid from '../../components/ui/ProductGrid';
import { useProducts } from '../../hooks/useProducts';
import { usePagination } from '../../hooks/usePagination';
import { titleCase } from '../../utils/formatters.js';

const ITEMS_PER_PAGE = 9;

const Category = () => {
  const location = useLocation();
  const { addToCart, addToFavorites } = useContext(CartContext);
  const queryParams = new URLSearchParams(location.search);
  const section = queryParams.get('section');
  const category = queryParams.get('category');
  const { products, status, errorMessage } = useProducts({ scope: 'categorySection', section, category });
  const { currentItems, currentPage, setCurrentPage, totalPages } = usePagination(
    products,
    ITEMS_PER_PAGE,
    `${category}|${section}`
  );

  return (
    <ProductGrid
      eyebrow={`${titleCase(section)} / ${titleCase(category)}`}
      title={`${titleCase(category)} that complete the look`}
      products={currentItems}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onAddToCart={addToCart}
      onAddToFavorites={addToFavorites}
      status={status}
      errorMessage={errorMessage}
    />
  );
};

export default Category;