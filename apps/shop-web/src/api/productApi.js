import { apiClient } from './client.js';

export const listProducts = () => apiClient.get('/items');

export const getProductById = (id) => apiClient.get(`/items/${id}`);

export const getProductsBySection = (section) => apiClient.get('/items/section', { params: { section } });

export const getProductsByCategorySection = (category, section) => (
  apiClient.get('/items/categorysection', { params: { section, category } })
);

export const getProductsByCategory = (category) => apiClient.get('/items/category', { params: { category } });

export const addProduct = (product) => apiClient.post('/items', product);

export const updateProduct = (id, product) => apiClient.put(`/items/${id}`, product);

export const deleteProduct = (id) => apiClient.delete(`/items/${id}`);