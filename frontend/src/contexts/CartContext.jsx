// frontend/src/contexts/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'kioskUserCartItemsV2'; // Use a versioned key to avoid conflicts with old data

const CartContext = createContext(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider. Ensure CartProvider wraps your app.');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Basic validation: ensure it's an array
        return Array.isArray(parsedCart) ? parsedCart : [];
      }
      return [];
    } catch (e) {
      console.error("CartContext: Failed to parse cartItems from localStorage on init.", e);
      localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false); // Example for async operations

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      // console.log("CartContext: Cart saved to localStorage. Items:", cartItems.length);
    } catch (e) {
      console.error("CartContext: Failed to save cart to localStorage", e);
      // Potentially handle quota exceeded errors here
    }
  }, [cartItems]);

  const fetchCartItems = useCallback(async () => {
    // console.log("CartContext: fetchCartItems called (re-loads from localStorage).");
    setIsLoading(true);
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
    } catch (e) {
      console.error("CartContext: Error fetching/parsing cart from localStorage in fetchCartItems:", e);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItemToCart = useCallback(async (itemToAdd) => {
    // console.log("CartContext: addItemToCart called with item:", itemToAdd ? JSON.parse(JSON.stringify(itemToAdd)) : "null");
    
    if (!itemToAdd || !itemToAdd.id) { 
      console.error("CartContext: Attempted to add item without a valid ID.", itemToAdd);
      // alert("Cannot add item: Configuration error.");
      return null; // Indicate failure
    }
    if(typeof itemToAdd.calculatedUnitPrice !== 'number' || itemToAdd.calculatedUnitPrice < 0){
      console.error("CartContext: Item added without a valid calculatedUnitPrice.", itemToAdd);
      // alert("Cannot add item: Price calculation error."); // May be too intrusive here
      return null;
    }

    // Assign a unique cartItemId for managing items within the cart, 
    // distinct from the product's configured id (which might be the same if re-adding a similar config).
    const newItemInCart = { 
      ...itemToAdd, 
      cartItemId: `cartItem_${itemToAdd.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` 
    };

    setCartItems(prevItems => {
      const updatedItems = [...prevItems, newItemInCart];
      console.log("CartContext: Item added. New cart state preview:", updatedItems.map(i => ({id: i.id, qty: i.quantity, price: i.calculatedUnitPrice})));
      return updatedItems;
    });
    return newItemInCart; // Return the item as added to cart (with cartItemId)
  }, []);

  const updateCartItemQuantity = useCallback((cartItemIdToUpdate, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartItemId === cartItemIdToUpdate
            ? { ...item, quantity: Math.max(1, parseInt(newQuantity, 10) || 1) } // Ensure quantity is at least 1
            : item
      )
    );
    // console.log(`CartContext: Quantity updated for ${cartItemIdToUpdate} to ${newQuantity}`);
  }, []);

  const removeCartItem = useCallback((cartItemIdToRemove) => {
    setCartItems(prevItems => {
      const itemBeingRemoved = prevItems.find(item => item.cartItemId === cartItemIdToRemove);
      if (itemBeingRemoved) {
        // If blob URLs were stored directly on cart items (not typical if converted to base64 earlier),
        // this would be a place to revoke them for THIS specific item.
        // However, src should be base64 or server URLs now.
        // if(Array.isArray(itemBeingRemoved._blobUrls)) {
        //    itemBeingRemoved._blobUrls.forEach(url => URL.revokeObjectURL(url));
        // }
      }
      return prevItems.filter(item => item.cartItemId !== cartItemIdToRemove);
    });
    // console.log(`CartContext: Item removed: ${cartItemIdToRemove}`);
  }, []);

  // General clear cart function
  const clearCart = useCallback(() => {
    // console.log("CartContext: clearCart called.");
    // If any client-side resources like blob URLs specific to cart items needed cleanup, it would be here.
    // However, if `src` values are base64 or server URLs, direct client-side revocation isn't needed from cart data.
    // The original source blobs (e.g. from `CurrentItemContext._blobUrls`) are managed by that context.
    cartItems.forEach(item => {
      // Defensive check if somehow blob URLs are on the item structure
      const checkAndRevokeSrc = (cust) => {
        if (cust && cust.src && typeof cust.src === 'string' && cust.src.startsWith('blob:')) {
          // console.warn(`CartContext: Revoking potentially stale blob URL from cart item upon clearing: ${cust.src}`);
          try { URL.revokeObjectURL(cust.src); } catch (e) {}
        }
        if (cust && cust.type === 'multi_library_design' && Array.isArray(cust.elements)) {
          cust.elements.forEach(checkAndRevokeSrc);
        }
      };
      checkAndRevokeSrc(item.frontCustomization);
      checkAndRevokeSrc(item.backCustomization);
    });

    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY); // Also clear from storage
    // console.log("CartContext: Cart cleared fully.");
  }, [cartItems]); // Dependency to ensure it has the latest cartItems to iterate for cleanup
  
  const getTotalCartQuantity = useCallback(() => {
    return cartItems.reduce((total, item) => total + (parseInt(item.quantity, 10) || 0), 0);
  }, [cartItems]);

  const value = {
    cartItems,
    isLoading, 
    fetchCartItems,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart, // Replaced clearCartForCheckout with a general clearCart
    getTotalCartQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};