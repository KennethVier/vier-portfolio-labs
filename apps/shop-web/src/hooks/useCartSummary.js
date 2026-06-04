import { useMemo } from 'react';

export const useCartSummary = (cartItems) => {
  return useMemo(() => {
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cartItems.reduce((total, item) => total + item.productPrice * item.quantity, 0);

    return {
      itemCount,
      subtotal,
      total: subtotal,
      isEmpty: cartItems.length === 0
    };
  }, [cartItems]);
};