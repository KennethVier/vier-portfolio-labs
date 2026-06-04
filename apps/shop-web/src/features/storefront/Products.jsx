import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { CartContext } from '../cart/cartContextValue.js';
import ProductGrid from '../../components/ui/ProductGrid';
import { useProducts } from '../../hooks/useProducts';
import { usePagination } from '../../hooks/usePagination';
import { titleCase } from '../../utils/formatters.js';

const ITEMS_PER_PAGE = 9;

const ProductSection = () => {
  const location = useLocation();
  const { addToCart, addToFavorites } = useContext(CartContext);
  const queryParams = new URLSearchParams(location.search);
  const section = queryParams.get('section');
  const { products, status, errorMessage } = useProducts({ scope: 'section', section });
  const { currentItems, currentPage, setCurrentPage, totalPages } = usePagination(products, ITEMS_PER_PAGE, section || '');

  return (
    <ProductGrid
      eyebrow={`${titleCase(section, 'Collection')} apparel`}
      title={`${titleCase(section, 'Collection')} styles with everyday pull`}
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

export default ProductSection;