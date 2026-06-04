import { useState, useEffect } from 'react';
import { CartContext } from './cartContextValue.js';

const readStoredItems = (key) => {
  try {
    return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(readStoredItems('cartItems'));
  const [favoritesItems, setFavoritesItems] = useState(readStoredItems('favoritesItems'));

  const addToCart = (item) => {
    if (item.stocks <= 0) return false;

    const isItemInCart = cartItems.find((cartItem) => cartItem.id === item.id);

    if (isItemInCart) {
      if (isItemInCart.quantity >= item.stocks) return false;

      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1, stocks: item.stocks }
            : cartItem
        )
      );
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }

    return true;
  };

  const removeFromCart = (item) => {
    const isItemInCart = cartItems.find((cartItem) => cartItem.id === item.id);
    if (!isItemInCart) return;

    if (isItemInCart.quantity === 1) {
      setCartItems(cartItems.filter((cartItem) => cartItem.id !== item.id));
    } else {
      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      );
    }
  };

  const removeItemFromCart = (item) => {
    setCartItems(cartItems.filter((cartItem) => cartItem.id !== item.id));
  };

  const clearCart = () => {
    setCartItems([]);
  };


  const addToFavorites = (item) => {
    const isItemInFavorites = favoritesItems.find((favoriteItem) => favoriteItem.id === item.id);

    if (isItemInFavorites) {
      setFavoritesItems(
        favoritesItems.map((favoriteItem) =>
          favoriteItem.id === item.id ? { ...favoriteItem, ...item } : favoriteItem
        )
      );
    } else {
      setFavoritesItems([...favoritesItems, { ...item, quantity: 1 }]);
    }
  };

  const removeFromFavorites = (item) => {
    setFavoritesItems(favoritesItems.filter((favoriteItem) => favoriteItem.id !== item.id));
  };

  const clearFavorites = () => {
    setFavoritesItems([]);
  };

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('favoritesItems', JSON.stringify(favoritesItems));
  }, [favoritesItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        favoritesItems,
        addToCart,
        removeFromCart,
        removeItemFromCart,
        clearCart,
        addToFavorites,
        removeFromFavorites,
        clearFavorites,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};