// frontend/src/components/common/CartIndicator.jsx
import React from 'react';
import { useCart } from '../../contexts/CartContext'; // Adjust path as needed
import { Link } from 'react-router-dom';

const CartIndicator = ({ onPreviewToggle }) => {
  const contextValue = useCart(); // Get the whole context value

  // --- Defensive check for context availability ---
  if (!contextValue) {
    console.error("CartIndicator Error: CartContext is not available. Ensure this component is rendered within a CartProvider.");
    // Optionally render a fallback or null if the indicator is critical but context is missing
    // For now, we'll render nothing to avoid breaking the UI further if context is missing.
    // You might want a placeholder or a simple non-functional icon.
    return null; 
  }
  // --- End of defensive check ---

  const { cartItems, getTotalCartQuantity } = contextValue; // Destructure safely
  
  const totalQuantity = getTotalCartQuantity ? getTotalCartQuantity() : (cartItems?.length || 0); // Fallback if getTotalCartQuantity isn't ready or provided

  const indicatorStyle = {
    position: 'fixed',
    top: '60px',
    right: '60px',
    backgroundColor: '#00566F',
    color: 'white',
    borderRadius: '50%',
    width: '100px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onPreviewToggle ? 'pointer' : 'default', // Make cursor pointer only if onPreviewToggle is provided
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
    zIndex: 1001, // Ensure it's above most content
    fontSize: '24px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    textAlign: 'center',
    userSelect: 'none',
  };

  const countStyle = {
    fontSize: '32px',
    lineHeight: '1',
  };

  const textStyle = {
    fontSize: '18px',
    lineHeight: '1',
    marginTop: '3px',
  };

  const handleClick = () => {
    if (onPreviewToggle) {
      onPreviewToggle();
    }
    // If no onPreviewToggle, it could navigate directly to cart or do nothing
  };

  // If you want the indicator to be a link to the cart page when not toggling a preview:
  if (!onPreviewToggle) {
    return (
      <Link to="/final-cart" style={{textDecoration: 'none'}}>
        <div style={indicatorStyle}>
          <span style={countStyle}>{totalQuantity}</span>
          <span style={textStyle}>Items</span>
        </div>
      </Link>
    );
  }

  return (
    <div style={indicatorStyle} onClick={handleClick} role="button" tabIndex={0} 
         onKeyPress={(e) => e.key === 'Enter' && handleClick()}>
      <span style={countStyle}>{totalQuantity}</span>
      <span style={textStyle}>Items</span>
    </div>
  );
};

export default CartIndicator;