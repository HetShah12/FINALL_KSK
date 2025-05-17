// frontend/src/contexts/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        // Still try to load from localStorage so UI doesn't totally break if it expects something
        const savedCart = localStorage.getItem('kioskCartItems_stub'); // Use a different key to avoid old data issues
        try {
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            console.error("Failed to parse stubbed cartItems from localStorage", e);
            localStorage.removeItem('kioskCartItems_stub');
            return [];
        }
    });

    // Persist the (likely empty) cart to localStorage
    useEffect(() => {
        localStorage.setItem('kioskCartItems_stub', JSON.stringify(cartItems));
    }, [cartItems]);

    // STUBBED OUT FUNCTIONS
    const fetchCartItems = useCallback(async () => {
        console.log("CartContext (STUBBED): fetchCartItems called.");
        // No actual fetching, cart is managed locally or empty
    }, []);

    const addItemToCart = useCallback(async (itemToAdd) => {
        console.log("CartContext (STUBBED): addItemToCart called with", itemToAdd);
        // For UI testing, we can add it to the local state if needed,
        // or just log and do nothing to fully isolate.
        // To allow some basic UI testing of adding:
        // const newItem = { ...itemToAdd, cartItemId: itemToAdd.cartItemId || itemToAdd.id || Date.now().toString() };
        // setCartItems(prevItems => [...prevItems, newItem]);
        // return newItem;
        alert("Cart functionality is currently minimal for UI testing. Item not fully added.");
        return itemToAdd; // Return the item as if it was added
    }, []);

    const updateCartItemQuantity = useCallback((cartItemIdToUpdate, newQuantity) => {
        console.log("CartContext (STUBBED): updateCartItemQuantity called for", cartItemIdToUpdate, "to quantity", newQuantity);
        // To allow some basic UI testing of quantity changes:
        // setCartItems(prevItems =>
        //     prevItems.map(item =>
        //         (item.cartItemId === cartItemIdToUpdate || item.id === cartItemIdToUpdate)
        //             ? { ...item, quantity: Math.max(0, newQuantity) } 
        //             : item
        //     ).filter(item => item.quantity > 0) 
        // );
        alert("Cart functionality is currently minimal. Quantity not fully updated.");
    }, []);

    const removeCartItem = useCallback((cartItemIdToRemove) => {
        console.log("CartContext (STUBBED): removeCartItem called for", cartItemIdToRemove);
        // To allow some basic UI testing of removal:
        // setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemIdToRemove && item.id !== cartItemIdToRemove));
        alert("Cart functionality is currently minimal. Item not fully removed.");
    }, []);

    const clearCartForCheckout = useCallback(() => {
        console.log("CartContext (STUBBED): clearCartForCheckout called.");
        setCartItems([]); // Clear local stubbed cart
        alert("Cart functionality is currently minimal. Cart cleared locally.");
    }, []);
    
    const getTotalCartQuantity = useCallback(() => {
        // console.log("CartContext (STUBBED): getTotalCartQuantity called.");
        return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
        // return 0; // Or always return 0
    }, [cartItems]);

    // Provide a minimal value so useCart() doesn't return completely undefined
    // if a component only checks for context existence.
    const value = {
        cartItems, // Provide the (likely empty) cartItems array
        fetchCartItems,
        addItemToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCartForCheckout,
        getTotalCartQuantity,
        // Add any other functions that components might try to destructure,
        // even if they are just stubs.
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        // This error should NOT happen if CartProvider is correctly placed in main.jsx
        console.error('CRITICAL: useCart must be used within a CartProvider. Check main.jsx.');
        // Return a minimal structure to prevent immediate crashes in consuming components
        // if they don't have their own undefined checks.
        return { 
            cartItems: [], 
            getTotalCartQuantity: () => 0,
            fetchCartItems: () => console.warn("CartContext not available for fetchCartItems"),
            addItemToCart: () => console.warn("CartContext not available for addItemToCart"),
            updateCartItemQuantity: () => console.warn("CartContext not available for updateCartItemQuantity"),
            removeCartItem: () => console.warn("CartContext not available for removeCartItem"),
            clearCartForCheckout: () => console.warn("CartContext not available for clearCartForCheckout"),
        };
    }
    return context;
};