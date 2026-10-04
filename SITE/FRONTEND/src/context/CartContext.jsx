import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("thenith_cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Keep only items that have rawName (new format) to ensure multilingual support works
        const validItems = parsed.filter(item => item.rawName);
        return validItems;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("thenith_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const item = {
      id: product.id,
      name: product.name,
      rawName: product.rawName,
      price: Number(product.price || 0),
      currency: product.currency || "EGP",
      image: product.image || "",
      sku: product.sku || "",
    };
    setCart((prev) => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => p.id === item.id ? { ...p, ...item, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter(p => p.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeFromCart(id);
    setCart((prev) => prev.map(p => p.id === id ? { ...p, quantity } : p));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
