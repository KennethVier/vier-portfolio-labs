import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { CartContext } from '../cart/cartContextValue.js';
import ProductGrid from '../../components/ui/ProductGrid';
import { useProducts } from '../../hooks/useProducts';
import { usePagination } from '../../hooks/usePagination';
import { titleCase } from '../../utils/formatters.js';

const ITEMS_PER_PAGE = 9;

const FootwearAccessories = () => {
  const location = useLocation();
  const { addToCart, addToFavorites } = useContext(CartContext);
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category');
  const { products, status, errorMessage } = useProducts({ scope: 'category', category });
  const { currentItems, currentPage, setCurrentPage, totalPages } = usePagination(products, ITEMS_PER_PAGE, category || '');

  return (
    <ProductGrid
      eyebrow="Accessories and footwear"
      title={`${titleCase(category)} with final-look energy`}
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

export default FootwearAccessories;