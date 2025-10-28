import React, { createContext, useState, useMemo } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = sessionStorage.getItem('cartItems');
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.warn('Failed to parse cart from sessionStorage', e);
      return [];
    }
  });
 
  React.useEffect(() => {
    try {
      sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save cart to sessionStorage', e);
    }
  }, [cartItems]);

  const addItem = (item) => {
    setCartItems((prev) => [...prev, item]);
  };

  const removeItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const emptyCart = () => {
    setCartItems([]);
  };

  const contextValue = useMemo(() => ({
    cartItems, addItem, removeItem, emptyCart
  }), [cartItems]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
