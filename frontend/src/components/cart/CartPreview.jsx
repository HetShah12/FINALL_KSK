// frontend/src/components/cart/CartPreview.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const TSHIRT_COLOR_MAP = { 
    black: '/tshirtmockups/blacktshirt.png', red: '/tshirtmockups/redfront.png',
    navy: '/tshirtmockups/bluefront.png', brown: '/tshirtmockups/brownfront.png',
    cream: '/tshirtmockups/creamfront.png', white: '/tshirtmockups/whitefront.png'
};
const DEFAULT_TSHIRT_IMAGE = "/placeholder-tshirt.png";

const CartPreview = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cartItems, updateCartItemQuantity, removeCartItem } = useCart();
  // const { revokeItemBlobUrls } = useCurrentItem(); // If needed here

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.calculatedUnitPrice) || 0) * (item.quantity || 1);
  }, 0);

  const handleQuantityChange = (cartItemId, newQuantityInput) => {
    const newQuantity = parseInt(newQuantityInput, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
        // const itemToRemove = cartItems.find(item => item.cartItemId === cartItemId || item.id === cartItemId);
        if (window.confirm("Remove this item from cart? (Invalid quantity)")) {
            // if(itemToRemove && revokeItemBlobUrls) revokeItemBlobUrls(itemToRemove);
            removeCartItem(cartItemId);
        } else {
             updateCartItemQuantity(cartItemId, cartItems.find(item => item.cartItemId === cartItemId || item.id === cartItemId)?.quantity || 1);
        }
    } else {
      updateCartItemQuantity(cartItemId, newQuantity);
    }
  };

  const handleViewFullCart = () => {
    onClose();
    const deliveryType = localStorage.getItem('deliveryType');
    const deliveryDetails = localStorage.getItem('deliveryDetails');
    const pickupDetails = localStorage.getItem('pickupDetails');
    if (!deliveryType) { navigate('/delivery-options'); }
    else if (deliveryType === 'home_delivery' && !deliveryDetails) { navigate('/delivery-form'); }
    else if (deliveryType === 'store_pickup' && !pickupDetails) { navigate('/store-pickup-form'); }
    else { navigate('/final-cart'); }
  };
  
  // --- Styles for CartPreview ---
  // Main container for the entire preview (backdrop + panel)
  // This will be positioned absolutely relative to PageContainer
  const previewContainerStyle = {
    position: 'absolute', // Positioned relative to PageContainer
    top: 0,
    left: 0,
    right: 0, // Or width: '100%'
    bottom: 0, // Or height: '100%'
    zIndex: 1005, // Ensure it's above page content but below global modals
    display: 'flex', // To help position the panel (though panel itself is absolute now)
    pointerEvents: isOpen ? 'auto' : 'none', // Only interactive when open
  };

  const backdropStyle = {
    position: 'absolute', // Covers the PageContainer
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(3px)',
    opacity: isOpen ? 1 : 0, // Fade in/out
    transition: 'opacity 0.3s ease-in-out',
  };

  const previewPanelStyle = { // The actual sidebar
    position: 'absolute', // Positioned relative to PageContainer
    top: 0,
    right: isOpen ? '0px' : '-620px', // Slide in from right (width + padding)
    width: '600px', 
    height: '100%',   // Takes full height of PageContainer
    backgroundColor: '#F4FAFF',
    boxShadow: '-5px 0 15px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    color: '#00566F',
    fontFamily: 'Inter, sans-serif',
    transition: 'right 0.3s ease-in-out', // Slide animation
    zIndex: 1006, // Above the backdrop
  };

  const headerStyle = { /* ... same as before ... */ fontSize: '32px', fontWeight: 700, padding: '20px 20px 15px 20px', borderBottom: '2px solid #00566F', marginBottom: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
  const closeButtonStyle = { /* ... same as before ... */ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#00566F', fontWeight: 'bold' };
  const itemListStyle = { /* ... same as before ... */ flexGrow: 1, overflowY: 'auto', listStyle: 'none', padding: '20px', margin: 0, scrollbarWidth: 'thin', scrollbarColor: '#00566F #DEEFFF' };
  const itemStyle = { /* ... same as before ... */ display: 'flex', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #DEEFFF'};
  const itemImageStyle = { /* ... same as before ... */ width: '80px', height: '80px', objectFit: 'contain', marginRight: '15px', backgroundColor: '#e0efff', borderRadius: '4px' };
  const itemDetailsStyle = { /* ... same as before ... */ flexGrow: 1, fontSize: '20px' };
  const itemNameStyle = { /* ... same as before ... */ fontWeight: 600, marginBottom: '5px', fontSize: '22px' };
  const itemQuantityControlStyle = { /* ... same as before ... */ display: 'flex', alignItems: 'center', marginTop: '8px' };
  const quantityBtnStyle = { /* ... same as before ... */ background: '#DEEFFF', border: '1px solid #AECAD4', color: '#00566F', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold'};
  const quantityInputStyle = { /* ... same as before ... */ width: '40px', textAlign: 'center', margin: '0 8px', fontSize: '18px', border: '1px solid #AECAD4', borderRadius: '4px', height: '26px'};
  const itemPriceStyle = { /* ... same as before ... */ marginLeft: 'auto', fontWeight: 600, fontSize: '22px' };
  const footerStyle = { /* ... same as before ... */ padding: '20px', borderTop: '2px solid #00566F', flexShrink: 0 };
  const subtotalStyle = { /* ... same as before ... */ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 700, marginBottom: '20px' };
  const actionButtonStyle = { /* ... same as before ... */ display: 'block', width: '100%', padding: '15px', textAlign: 'center', borderRadius: '8px', fontSize: '22px', fontWeight: 600, cursor: 'pointer', border: 'none', marginBottom: '10px'};

  return (
    <div style={previewContainerStyle} >
      <div style={backdropStyle} onClick={onClose}></div> {/* Click on backdrop closes */}
      <div style={previewPanelStyle} > {/* Panel slides in/out */}
        <div style={headerStyle}>
          <span>Shopping Cart</span>
          <button style={closeButtonStyle} onClick={onClose}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '20px', color: '#666', flexGrow: 1, display:'flex', alignItems:'center', justifyContent:'center' }}>Your cart is empty.</p>
        ) : (
          <ul style={itemListStyle}>
            {cartItems.map((item) => {
              const itemDisplayImage = item.frontCustomization?.src || item.backCustomization?.src || TSHIRT_COLOR_MAP[item.color] || DEFAULT_TSHIRT_IMAGE;
              const itemPrice = (parseFloat(item.calculatedUnitPrice) || 0) * (item.quantity || 1);
              const cartItemId = item.cartItemId || item.id;

              return (
                <li key={cartItemId} style={itemStyle}>
                  <img src={itemDisplayImage} alt={item.productType || 'Product'} style={itemImageStyle} 
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_TSHIRT_IMAGE;}}
                  />
                  <div style={itemDetailsStyle}>
                    <div style={itemNameStyle}>{item.productType || 'Custom T-Shirt'} - {item.size}</div>
                    <div style={{fontSize: '18px', color: '#555'}}>
                       <div style={itemQuantityControlStyle}>
                        <button style={quantityBtnStyle} onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) - 1)}>-</button>
                        <input 
                            type="number" 
                            style={quantityInputStyle} 
                            value={item.quantity || 1} 
                            onChange={(e) => handleQuantityChange(cartItemId, e.target.value)}
                            min="1"
                        />
                        <button style={quantityBtnStyle} onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) + 1)}>+</button>
                       </div>
                    </div>
                  </div>
                  <span style={itemPriceStyle}>₹{itemPrice.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div style={footerStyle}>
          <div style={subtotalStyle}>
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <button style={{...actionButtonStyle, backgroundColor: '#00566F', color: 'white'}} onClick={handleViewFullCart}>
            View Cart & Checkout
          </button>
          <button style={{...actionButtonStyle, backgroundColor: '#AECAD4', color: '#00566F'}} onClick={onClose}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPreview;