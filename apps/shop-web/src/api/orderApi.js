import { apiClient } from './client.js';

export const createOrder = (order) => apiClient.post('/orders', order);

export const listOrders = () => apiClient.get('/orders');

export const getOrderById = (id) => apiClient.get(`/orders/${id}`);