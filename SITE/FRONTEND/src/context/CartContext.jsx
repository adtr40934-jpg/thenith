import React, { createContext, useContext, useState, useEffect } from "react";

import { deleteCardDraftImages } from "../utils/customCardStorage.js";

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
    try {
      localStorage.setItem("thenith_cart", JSON.stringify(cart));
    } catch (e) {
      console.warn("[cart] Could not save to localStorage quota:", e);
    }
  }, [cart]);

  const addToCart = (product, quantity = 1, customDesign = null, explicitCartItemId = null) => {
    const isCustomizable = Boolean(product.isCustomizable);
    const isCustom = Boolean(customDesign || product.customDesign);

    // Customizable products can NEVER be added directly without going through the 3D customizer
    if (isCustomizable && !isCustom) {
      window.location.href = `/custom-card?productId=${product.id}`;
      return false;
    }

    const resolvedCustom = customDesign || product.customDesign || null;
    const cartItemId = explicitCartItemId || (isCustom ? `${product.id}_${Date.now()}` : product.id);

    const item = {
      id: product.id,
      cartItemId,
      name: product.name,
      rawName: product.rawName,
      price: Number(product.price || 0),
      currency: product.currency || "EGP",
      image: resolvedCustom?.image || product.image || "",
      sku: product.sku || "",
      customDesign: resolvedCustom,
    };

    setCart((prev) => {
      if (!isCustom) {
        const existing = prev.find((p) => (p.cartItemId || p.id) === item.id && !p.customDesign);
        if (existing) {
          return prev.map((p) =>
            (p.cartItemId || p.id) === item.id && !p.customDesign
              ? { ...p, ...item, quantity: p.quantity + quantity }
              : p,
          );
        }
      }
      return [...prev, { ...item, quantity: Math.max(1, quantity) }];
    });
  };

  const removeFromCart = (id) => {
    // Delete any high-res draft from IndexedDB
    deleteCardDraftImages(id).catch(() => {});

    setCart((prev) =>
      prev.filter((p) => {
        // 1. Exact match on unique cartItemId
        if (p.cartItemId && p.cartItemId === id) return false;
        // 2. Exact match on composite primary key
        const primaryKey = p.cartItemId || p.id;
        if (primaryKey === id) return false;
        // 3. Match standard product id when no custom cartItemId is present
        if (!p.cartItemId && p.id === id) return false;
        // 4. Fallback if product id was passed and exactly one item of this id exists
        if (p.id === id && !String(id).includes("_") && prev.filter((x) => x.id === id).length === 1) return false;
        return true;
      })
    );
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeFromCart(id);
    setCart((prev) =>
      prev.map((p) => ((p.cartItemId || p.id) === id ? { ...p, quantity } : p)),
    );
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
