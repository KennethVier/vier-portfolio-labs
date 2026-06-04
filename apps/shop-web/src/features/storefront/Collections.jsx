import { useContext, useState } from 'react';
import { CartContext } from '../cart/cartContextValue.js';
import ProductGrid from '../../components/ui/ProductGrid';
import CatalogControls from '../../components/ui/CatalogControls';
import { useFilteredProducts, useProducts } from '../../hooks/useProducts';
import { usePagination } from '../../hooks/usePagination';

const ITEMS_PER_PAGE = 9;

const Collections = () => {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const { addToCart, addToFavorites } = useContext(CartContext);
  const { products, status, errorMessage } = useProducts();
  const filteredProducts = useFilteredProducts(products, { query, section, category, sortBy });
  const { currentItems, currentPage, setCurrentPage, totalPages } = usePagination(
    filteredProducts,
    ITEMS_PER_PAGE,
    `${query}|${section}|${category}|${sortBy}`
  );

  return (
    <ProductGrid
      eyebrow="Full collection"
      title="Latest pieces worth adding to cart"
      products={currentItems}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onAddToCart={addToCart}
      onAddToFavorites={addToFavorites}
      status={status}
      errorMessage={errorMessage}
    >
      <CatalogControls
        query={query}
        section={section}
        category={category}
        sortBy={sortBy}
        onQueryChange={setQuery}
        onSectionChange={setSection}
        onCategoryChange={setCategory}
        onSortChange={setSortBy}
      />
    </ProductGrid>
  );
};

export default Collections;