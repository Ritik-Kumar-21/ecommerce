import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      const cart = await api.getCart();
      setItems(cart);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    const updated = await api.addToCart(productId, quantity);
    setItems(updated);
  };

  const updateQuantity = async (itemId, quantity) => {
    const updated = await api.updateCartItem(itemId, quantity);
    setItems(updated);
  };

  const removeItem = async (itemId) => {
    const updated = await api.removeFromCart(itemId);
    setItems(updated);
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
