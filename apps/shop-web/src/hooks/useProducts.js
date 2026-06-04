import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getProductById,
  getProductsByCategory,
  getProductsByCategorySection,
  getProductsBySection,
  listProducts
} from '../api/productApi';
import { getApiErrorMessage } from '../utils/apiErrors.js';
import { BACKEND_DISABLED_MESSAGE, shouldUseDemoFallback } from '../utils/demoMode.js';
import { getDemoProductById, getDemoProducts } from '../utils/demoProducts.js';

const normalizeProducts = (data) => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

const requiresValue = (scope, values) => {
  if (scope === 'section') return Boolean(values.section);
  if (scope === 'category') return Boolean(values.category);
  if (scope === 'categorySection') return Boolean(values.category && values.section);
  return true;
};

export const useProducts = ({ scope = 'all', section, category } = {}) => {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    if (!requiresValue(scope, { section, category })) {
      setProducts([]);
      setStatus('ready');
      setError(null);
      return [];
    }

    setStatus('loading');
    setError(null);

    try {
      let response;

      if (scope === 'section') {
        response = await getProductsBySection(section);
      } else if (scope === 'category') {
        response = await getProductsByCategory(category);
      } else if (scope === 'categorySection') {
        response = await getProductsByCategorySection(category, section);
      } else {
        response = await listProducts();
      }

      const nextProducts = normalizeProducts(response.data);
      setProducts(nextProducts);
      setStatus('ready');
      return nextProducts;
    } catch (requestError) {
      console.error('Error fetching products:', requestError);
      if (shouldUseDemoFallback(requestError)) {
        const fallbackProducts = getDemoProducts({ scope, section, category });
        setProducts(fallbackProducts);
        setError(BACKEND_DISABLED_MESSAGE);
        setStatus('demo');
        return fallbackProducts;
      }
      setError(requestError);
      setStatus('error');
      return [];
    }
  }, [category, scope, section]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    data: products,
    products,
    status,
    error,
    isDemoFallback: status === 'demo',
    errorMessage: status === 'demo' ? BACKEND_DISABLED_MESSAGE : getApiErrorMessage(error),
    refetch: loadProducts
  };
};

export const useProductDetail = (id) => {
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadProduct = async () => {
      if (!id) {
        setProduct(null);
        setStatus('error');
        return;
      }

      setStatus('loading');
      setError(null);

      try {
        const response = await getProductById(id);
        if (!isActive) return;
        setProduct(response.data);
        setStatus('ready');
      } catch (requestError) {
        console.error(requestError);
        if (!isActive) return;
        if (shouldUseDemoFallback(requestError)) {
          setProduct(getDemoProductById(id));
          setError(BACKEND_DISABLED_MESSAGE);
          setStatus('demo');
          return;
        }
        setError(requestError);
        setStatus('error');
      }
    };

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [id]);

  return {
    data: product,
    product,
    status,
    error,
    isDemoFallback: status === 'demo',
    errorMessage: status === 'demo' ? BACKEND_DISABLED_MESSAGE : getApiErrorMessage(error, 'Unable to load this product. Check the shop service and try again.')
  };
};

export const useFilteredProducts = (products, { query = '', section = 'all', category = 'all', sortBy = 'featured' } = {}) => {
  return useMemo(() => {
    return [...products]
      .filter((product) => product.productName.toLowerCase().includes(query.toLowerCase().trim()))
      .filter((product) => section === 'all' || product.section?.toLowerCase() === section)
      .filter((product) => category === 'all' || product.category?.toLowerCase() === category)
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.productName.localeCompare(b.productName);
        if (sortBy === 'price-asc') return a.productPrice - b.productPrice;
        if (sortBy === 'price-desc') return b.productPrice - a.productPrice;
        if (sortBy === 'stock-desc') return b.stocks - a.stocks;
        return 0;
      });
  }, [category, products, query, section, sortBy]);
};
