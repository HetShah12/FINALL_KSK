// frontend/src/pages/FinalCartScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCurrentItem } from '../contexts/CurrentItemContext'; // For global revoke on currentConfiguredItem
import CartIndicator from '../components/common/CartIndicator';

const TSHIRT_COLOR_MAP = {
    black: '/tshirtmockups/blacktshirt.png',
    red: '/tshirtmockups/redfront.png',
    navy: '/tshirtmockups/navyfront.png', // Ensure your color map uses consistent keys like 'navy' if currentItem.color is 'navy'
    blue: '/tshirtmockups/bluefront.png', // If 'blue' is a distinct color
    brown: '/tshirtmockups/brownfront.png',
    cream: '/tshirtmockups/creamfront.png',
    white: '/tshirtmockups/whitefront.png'
};
const DEFAULT_TSHIRT_IMAGE = "/placeholder-tshirt.png"; // Create a generic placeholder in your /public folder

const FinalCartScreen = () => {
  const navigate = useNavigate();
  const { cartItems, updateCartItemQuantity, removeCartItem, clearCart, fetchCartItems } = useCart();
  const { revokeItemBlobUrls: revokeContextBlobs, clearCurrentItemForNewProduct } = useCurrentItem();

  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [pickupDetails, setPickupDetails] = useState(null);
  const [deliveryType, setDeliveryType] = useState(null);

  useEffect(() => {
    // console.log("FinalCartScreen: Fetching cart items on mount/update.");
    fetchCartItems();
    const type = localStorage.getItem('deliveryType');
    setDeliveryType(type);

    const deliveryDetailsRaw = localStorage.getItem('deliveryDetails');
    const pickupDetailsRaw = localStorage.getItem('pickupDetails');

    if (type === 'home_delivery' && deliveryDetailsRaw) {
      try { setDeliveryDetails(JSON.parse(deliveryDetailsRaw)); } catch (e) { console.error("Error parsing deliveryDetails:", e); setDeliveryDetails(null); }
    } else if (type === 'store_pickup' && pickupDetailsRaw) {
      try { setPickupDetails(JSON.parse(pickupDetailsRaw)); } catch (e) { console.error("Error parsing pickupDetails:", e); setPickupDetails(null); }
    }
  }, [fetchCartItems]);

  const handleQuantityChange = (cartItemId, newQuantity) => {
    const itemToUpdate = cartItems.find(item => (item.cartItemId || item.id) === cartItemId);
    if (newQuantity < 1) {
      if (window.confirm("Are you sure you want to remove this item from your cart?")) {
        if (itemToUpdate && Array.isArray(itemToUpdate._blobUrls)) {
            // console.log(`FinalCartScreen: Revoking blobs for item ID ${cartItemId}:`, itemToUpdate._blobUrls);
            itemToUpdate._blobUrls.forEach(url => URL.revokeObjectURL(url));
        }
        removeCartItem(cartItemId);
      }
    } else {
      updateCartItemQuantity(cartItemId, newQuantity);
    }
  };

  const handleShowItemDetails = (item) => setSelectedItemForModal(item);
  const handleCloseModal = () => setSelectedItemForModal(null);

  const handleBackNavigation = () => {
    if (deliveryType === 'home_delivery' && deliveryDetails) navigate('/delivery-form');
    else if (deliveryType === 'store_pickup' && pickupDetails) navigate('/store-pickup-form');
    else navigate('/delivery-options');
  };

  const formatCustomizationForDisplay = (cust, isModal = false) => {
    if (!cust) return 'None';
    let text = '';
    let details = [];
    const detailLimit = isModal ? 50 : 15;

    switch (cust.type) {
        case 'ai_text_image':
            text = "AI Image";
            if (cust.prompt) details.push(`"${cust.prompt.length > detailLimit ? cust.prompt.substring(0, detailLimit - 3) + '...' : cust.prompt}"`);
            if (cust.removedBackground) details.push('BG Removed');
            break;
        case 'embroidery_text':
            text = "Embroidery"; // Made generic title for brevity
            if (cust.text) details.push(`Text: "${cust.text}"`);
            if (isModal && cust.font) details.push(`Font: ${cust.font.split(',')[0].replace(/'/g, '').replace(' Custom', '')}`);
            if (isModal && cust.color) details.push(`Color: ${cust.color}`);
            break;
        case 'embroidery_design':
            text = "Emb. Design";
            if (cust.name) details.push(cust.name);
            break;
        case 'uploaded_image':
            text = "Uploaded";
            if (cust.originalFileName) details.push(cust.originalFileName.length > detailLimit ? cust.originalFileName.substring(0,detailLimit-3) + '...' : cust.originalFileName);
            else details.push("Image");
            break;
        case 'library_design': // Single library design
            text = "Library";
            if (cust.name) details.push(cust.name);
            else details.push("Design");
            break;
        case 'ai_draw_image':
            text = "AI Drawn";
            if (cust.prompt) details.push(`"${cust.prompt.length > detailLimit ? cust.prompt.substring(0, detailLimit - 3) + '...' : cust.prompt}"`);
            break;
        case 'multi_library_design':
            text = `Multi-Designs (${cust.elements?.length || 0})`;
            if (Array.isArray(cust.elements) && isModal) { // Show more detail in modal
                details = cust.elements.map(e => e.name || 'design');
            } else if (Array.isArray(cust.elements)) {
                const elNames = cust.elements.slice(0,1).map(e => e.name || 'design').join(', ');
                if(elNames) details.push(elNames + (cust.elements.length > 1 ? '...' : ''));
            }
            break;
        default:
            text = cust.type ? cust.type.replace(/_/g, ' ') : 'Custom';
    }
    return details.length > 0 ? `${text}: ${details.join(isModal ? '; ' : ', ')}` : text;
  };

  const { subtotal, deliveryCharge, grandTotal } = useMemo(() => {
    let currentSubtotal = 0;
    cartItems.forEach(item => {
      const unitPrice = parseFloat(item.calculatedUnitPrice) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      currentSubtotal += unitPrice * quantity;
    });
    const currentDeliveryCharge = deliveryType === 'home_delivery' ? 49.00 : 0;
    const currentGrandTotal = currentSubtotal + currentDeliveryCharge;
    return { subtotal: currentSubtotal, deliveryCharge: currentDeliveryCharge, grandTotal: currentGrandTotal };
  }, [cartItems, deliveryType]);


  const handleCheckout = async () => {
    if (cartItems.length === 0) { alert("Your cart is empty."); return; }
    if (!deliveryType) { alert("Please choose a delivery option."); navigate('/delivery-options'); return; }
    if (deliveryType === 'home_delivery' && !deliveryDetails) { alert("Please fill in your delivery address."); navigate('/delivery-form'); return; }
    if (deliveryType === 'store_pickup' && !pickupDetails) { alert("Please fill in your pickup contact details."); navigate('/store-pickup-form'); return; }

    try {
      const orderPayload = {
        cartItems: cartItems.map(item => {
          const { _blobUrls, _blobDataForUpload, ...cartItemData } = item;
          let finalFrontCustomization = cartItemData.frontCustomization;
          if (finalFrontCustomization) {
              const { _blobDataForUpload: ffBlob, ...fc } = finalFrontCustomization;
              finalFrontCustomization = fc;
              if (finalFrontCustomization.type === 'multi_library_design' && Array.isArray(finalFrontCustomization.elements)) {
                finalFrontCustomization.elements = finalFrontCustomization.elements.map(el => {
                    const { _blobDataForUpload: elBlob, ...cleanEl } = el;
                    return cleanEl;
                });
              }
          }
          let finalBackCustomization = cartItemData.backCustomization;
          if (finalBackCustomization) {
              const { _blobDataForUpload: bfBlob, ...bc } = finalBackCustomization;
              finalBackCustomization = bc;
               if (finalBackCustomization.type === 'multi_library_design' && Array.isArray(finalBackCustomization.elements)) {
                finalBackCustomization.elements = finalBackCustomization.elements.map(el => {
                    const { _blobDataForUpload: elBlob, ...cleanEl } = el;
                    return cleanEl;
                });
              }
          }
          return {...cartItemData, frontCustomization: finalFrontCustomization, backCustomization: finalBackCustomization};
        }),
        deliveryType,
        deliveryDetails: deliveryType === 'home_delivery' ? deliveryDetails : null,
        pickupDetails: deliveryType === 'store_pickup' ? pickupDetails : null,
        orderSubtotal: subtotal,
        deliveryCharge,
        orderTotal: grandTotal,
      };
        
      console.log("FINAL_CART: Simulating Order Placement. Payload:", JSON.stringify(orderPayload, null, 2));
      // ---- SIMULATED API CALL (Replace with actual backend call)----
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      const mockOrderConfirmation = { orderId: `SIM-${Date.now()}`, status: 'success', ...orderPayload };
      console.log("Order Placed Successfully (Simulated):", mockOrderConfirmation);
      // --------------------------------------------------------------
        
      alert('Thank You! Your Order has been Placed Successfully (Simulated).');
      
      cartItems.forEach(item => {
          if (Array.isArray(item._blobUrls)) {
            item._blobUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch(e){ console.warn("Error revoking blob from cart item on checkout:", e)} });
          }
      });
      if(currentItem && currentItem.id) revokeContextBlobs(); // Revoke any remaining blobs from the *global currentItem being configured*
      
      clearCart();
      clearCurrentItemForNewProduct(); // Fully reset the item configurator state

      localStorage.removeItem('deliveryDetails');
      localStorage.removeItem('pickupDetails');
      localStorage.removeItem('deliveryType');
      // localStorage.removeItem('currentConfiguredItem'); // clearCurrentItemForNewProduct handles the context part of this

      navigate('/order-confirmation', { state: { orderDetails: mockOrderConfirmation } }); 
    } catch (error) {
      console.error("FINAL_CART_ERROR: Checkout process failed:", error);
      alert(`Order placement failed: ${error.message || 'An unexpected error occurred.'}`);
    }
  };

  // Styles (ensure these are comprehensive and correct as per your setup)
  const pageContainerStyle = { width: '2240px', minHeight: '1400px', position: 'relative', background: 'white', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', paddingBottom: '50px' };
  const cartTitleBarStyle = { display: 'flex', alignItems: 'center', padding: '94px 127px 50px 127px' };
  const cartTitleText = { color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400 };
  const backArrowImgStyle = { width: '120px', height: '120px', marginRight: '60px', cursor: 'pointer' };
  const cartContentAreaStyle = { display: 'flex', justifyContent: 'space-between', padding: '0 109px', gap: '50px', alignItems: 'flex-start' };
  const cartItemsListStyle = { flexGrow: 1, maxWidth: '1144px' };
  const cartSummaryPanelStyle = { width: '815px', minHeight: '700px', backgroundColor: '#F4FAFF', borderRadius: '10px', padding: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', position: 'sticky', top: '30px' };
  const summaryTitleStyle = { color: '#00566F', fontSize: '36px', fontWeight: 700, marginBottom: '20px', textAlign: 'center', borderBottom: '2px solid #00566F', paddingBottom: '15px' };
  const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' };
  const summaryLabelStyle = { fontSize: '30px', fontWeight: 500, color: '#333' };
  const summaryValueStyle = { fontSize: '30px', fontWeight: 600, color: '#00566F' };
  const summaryDividerStyle = { border: 0, borderTop: '1px solid #cce0e8', margin: '25px 0' };
  const deliveryInfoSummaryStyle = { marginTop: '20px', marginBottom: '25px', padding: '20px', backgroundColor: '#e6f3fb', borderRadius: '8px', fontSize: '28px', borderLeft: '5px solid #00566F' };
  const checkoutButtonStyle = { width: '100%', height: '90px', border: 'none', borderRadius: '8px', color: 'white', fontSize: '40px', fontWeight: 600, marginTop: 'auto', alignSelf: 'center', transition: 'background-color 0.2s ease' };
  const cartItemStyle = { display: 'flex', alignItems: 'flex-start', marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #eee', backgroundColor: '#fdfdfd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'};
  const cartItemImageContainerStyle = { width: '200px', height: '200px', marginRight: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' };
  const cartItemImageStyle = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
  const cartItemDetailsStyle = { flexGrow: 1, display:'flex', flexDirection:'column', justifyContent:'space-between' };
  const itemNameStyle = { color: '#00566F', fontSize: '36px', fontWeight: 600, marginBottom: '10px' };
  const itemSpecsListStyle = { listStyle: 'none', paddingLeft: 0, margin: '0 0 10px 0' };
  const itemSpecsListItemStyle = { fontSize: '26px', color: '#444', marginBottom: '4px', lineHeight: 1.3 };
  const itemActionsStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' };
  const quantityContainerCartStyle = { width: '150px', height: '60px', display: 'flex', backgroundColor: '#F4FAFF', border: '2px solid #5D94A6', borderRadius: '8px', color: '#00566F' };
  const quantityCartBtnSpanStyle = { width: '33.33%', textAlign: 'center', fontSize: '28px', fontWeight: 600, cursor: 'pointer', lineHeight: '56px', userSelect: 'none' };
  const viewDetailsLinkStyle = { color: '#00566F', fontSize: '26px', fontWeight: 500, textDecoration: 'underline', cursor: 'pointer', marginTop: '10px', display: 'block', textAlign: 'left' };
  const itemPriceDisplayStyle = { color: '#00566F', fontSize: '40px', fontWeight: 700 };
  const modalOverlayStyle = { display: 'flex', position: 'fixed', zIndex: 1002, left: 0, top: 0, width: '100%', height: '100%', backdropFilter: 'blur(5px)', background: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' };
  const modalContentStyle = { position: 'relative', width: '1343px', maxHeight: '90vh', overflowY: 'auto', background: '#DEEFFF', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,0,0,0.2)', padding: '40px', boxSizing: 'border-box' };
  const modalCloseBtnStyle = { position: 'absolute', top: '25px', left: '25px', width: '80px', height: '80px', cursor: 'pointer', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', padding: '10px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center' };
  const modalHeaderStyle = { textAlign: 'center', color: '#00566F', fontSize: '72px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400, marginBottom: '35px', marginTop: '10px' };
  const modalImageContainerStyle = { width: '400px', height: '400px', margin: '0 auto 35px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f8ff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #ccc' };
  const modalImageStyle = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
  const modalDetailsGridStyle = { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 25px', fontSize: '32px', fontFamily: 'Inter', color: '#333' };
  const modalDetailsGridItemStyle = { paddingBottom:'5px' }; 
  const modalDetailsGridLabelStyle = { color: '#00566F', fontWeight: 600, textAlign: 'right', paddingRight: '10px', fontSize: '30px' }; // Updated from 700 to 600 for slight differentiation
  const modalDetailsGridValueStyle = { color: '#111', fontWeight: 500, fontSize: '30px' };


  return (
    <div style={pageContainerStyle}>
      <div style={cartTitleBarStyle}>
        <img style={backArrowImgStyle} src="/Features_Display_Img/back arrow.png" alt="Back" onClick={handleBackNavigation} />
        <div style={cartTitleText}>My Shopping Cart ({cartItems.length})</div>
      </div>

      <div style={cartContentAreaStyle}>
        <div style={cartItemsListStyle}>
          {cartItems.length === 0 ? (
            <p style={{ fontSize: '32px', color: '#777', textAlign: 'center', padding: '50px' }}>Your cart is empty. Time to design something amazing!</p>
          ) : (
            cartItems.map(item => {
              let itemDisplayImage = DEFAULT_TSHIRT_IMAGE;
              if (item.frontCustomization?.src || item.frontCustomization?.text) {
                  // Prioritize image source; if not available and text exists (like embroidery), fallback to T-shirt color
                  itemDisplayImage = item.frontCustomization.src || TSHIRT_COLOR_MAP[item.color?.toLowerCase()] || DEFAULT_TSHIRT_IMAGE;
              } else if (item.backCustomization?.src || item.backCustomization?.text) {
                  itemDisplayImage = item.backCustomization.src || TSHIRT_COLOR_MAP[item.color?.toLowerCase()] || DEFAULT_TSHIRT_IMAGE;
              } else {
                  itemDisplayImage = TSHIRT_COLOR_MAP[item.color?.toLowerCase()] || DEFAULT_TSHIRT_IMAGE;
              }

              const unitPrice = parseFloat(item.calculatedUnitPrice) || 0;
              const itemTotalPrice = unitPrice * (item.quantity || 1);
              const cartItemId = item.cartItemId || item.id;

              return (
                <div key={cartItemId} style={cartItemStyle} data-cart-item-id={cartItemId}>
                  <div style={cartItemImageContainerStyle}>
                    <img 
                        src={itemDisplayImage} 
                        style={cartItemImageStyle} 
                        alt={item.productType || 'Product'}
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = TSHIRT_COLOR_MAP[item.color?.toLowerCase()] || DEFAULT_TSHIRT_IMAGE; 
                        }}
                    />
                  </div>
                  <div style={cartItemDetailsStyle}>
                    <div> 
                      <div style={itemNameStyle}>{item.productType || 'Custom T-Shirt'}</div>
                      <ul style={itemSpecsListStyle}>
                        <li style={itemSpecsListItemStyle}><strong>Color:</strong> {item.color ? item.color.charAt(0).toUpperCase() + item.color.slice(1) : 'N/A'} | <strong>Size:</strong> {item.size || 'N/A'}</li>
                        <li style={itemSpecsListItemStyle}><strong>Thickness:</strong> {item.thicknessName || `${item.thickness || ''} GSM`}</li>
                        <li style={itemSpecsListItemStyle}><strong>Front:</strong> {formatCustomizationForDisplay(item.frontCustomization)}</li>
                        <li style={itemSpecsListItemStyle}><strong>Back:</strong> {formatCustomizationForDisplay(item.backCustomization)}</li>
                      </ul>
                    </div>
                    <div style={itemActionsStyle}> 
                      <div style={quantityContainerCartStyle}>
                        <span style={quantityCartBtnSpanStyle} onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) - 1)}>-</span>
                        <span style={{...quantityCartBtnSpanStyle, borderRight: '1px solid #5D94A6', borderLeft: '1px solid #5D94A6', pointerEvents: 'none', cursor: 'default' }}>
                          {(item.quantity || 1).toString().padStart(2, '0')}
                        </span>
                        <span style={quantityCartBtnSpanStyle} onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) + 1)}>+</span>
                      </div>
                      <div style={itemPriceDisplayStyle}>₹{itemTotalPrice.toFixed(2)}</div>
                    </div>
                     <div style={viewDetailsLinkStyle} onClick={() => handleShowItemDetails(item)}>View Details & Customizations</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={cartSummaryPanelStyle}>
          <div style={summaryTitleStyle}>ORDER SUMMARY</div>
          <div style={summaryRowStyle}>
            <span style={summaryLabelStyle}>Subtotal ({cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0)} items)</span>
            <span style={summaryValueStyle}>₹{subtotal.toFixed(2)}</span>
          </div>
          <hr style={summaryDividerStyle} />

          {deliveryType && (
            <div style={deliveryInfoSummaryStyle}>
              <h4 style={{marginTop:0, marginBottom:'12px', color:'#00566F', fontSize:'30px', fontWeight:700}}>Delivery Method</h4>
              <p id="deliveryTypeDisplay" style={{margin:'6px 0', lineHeight:1.5}}>{deliveryType === 'home_delivery' ? 'Home Delivery To:' : 'Store Pickup By:'}</p>
              {deliveryType === 'home_delivery' && deliveryDetails && (
                <div id="deliveryAddressDisplay">
                  <p style={{margin:'6px 0', lineHeight:1.5}}><b>{deliveryDetails.firstName || ''} {deliveryDetails.lastName || ''}</b></p>
                  <p style={{margin:'6px 0', lineHeight:1.5}}>{deliveryDetails.addressLine1 || ''}</p>
                  <p style={{margin:'6px 0', lineHeight:1.5}}>{deliveryDetails.addressLine2 || ''}, Pincode: {deliveryDetails.pincode || ''}</p>
                  <p style={{margin:'6px 0', lineHeight:1.5}}>Ph: {deliveryDetails.phoneNumber || ''}, Email: {deliveryDetails.emailAddress || ''}</p>
                </div>
              )}
              {deliveryType === 'store_pickup' && pickupDetails && (
                <div id="pickupContactDisplay">
                  <p style={{margin:'6px 0', lineHeight:1.5}}><b>{pickupDetails.pickupFirstName || ''} {pickupDetails.pickupLastName || ''}</b></p>
                  <p style={{margin:'6px 0', lineHeight:1.5}}>Ph: {pickupDetails.pickupPhoneNumber || ''}, Email: {pickupDetails.pickupEmailAddress || ''}</p>
                </div>
              )}
            </div>
          )}
           {!deliveryType && (
             <div style={deliveryInfoSummaryStyle}>
                <p style={{margin:'6px 0', lineHeight:1.5, color: 'red'}}>Delivery method not selected.</p>
                <button onClick={() => navigate('/delivery-options')} style={{fontSize: '24px', padding: '8px 15px', marginTop:'10px', cursor:'pointer', background:'#00566F', color:'white', border:'none', borderRadius:'5px'}}>Select Delivery</button>
             </div>
           )}

          <div style={summaryRowStyle}>
            <span style={summaryLabelStyle}>Delivery Charges</span>
            <span style={summaryValueStyle}>₹{deliveryCharge.toFixed(2)}</span>
          </div>
          <hr style={summaryDividerStyle} />
          <div style={{...summaryRowStyle, marginTop:'10px'}}>
            <span style={{...summaryLabelStyle, color: '#00566F', fontSize: '48px', fontWeight: 800}}>Grand Total</span>
            <span style={{...summaryValueStyle, color: '#00566F', fontSize: '48px', fontWeight: 800}}>₹{grandTotal.toFixed(2)}</span>
          </div>
          <button 
            style={{...checkoutButtonStyle, backgroundColor: (!deliveryType || cartItems.length === 0) ? '#adb5bd' : '#00566F', cursor: (!deliveryType || cartItems.length === 0) ? 'not-allowed' : 'pointer' }} 
            onClick={handleCheckout}
            disabled={!deliveryType || cartItems.length === 0}
          >
            Confirm & Place Order
          </button>
        </div>
      </div>

      {selectedItemForModal && (
        <div style={modalOverlayStyle} onClick={handleCloseModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <img src="/Size_Selection_Img/closeicon.png" alt="Close" style={modalCloseBtnStyle} onClick={handleCloseModal}/>
            <div style={modalHeaderStyle}>{selectedItemForModal.productType || 'Custom T-Shirt'} - Details</div>
            <div style={modalImageContainerStyle}>
              <img 
                src={selectedItemForModal.frontCustomization?.src || selectedItemForModal.backCustomization?.src || TSHIRT_COLOR_MAP[selectedItemForModal.color?.toLowerCase()] || DEFAULT_TSHIRT_IMAGE} 
                style={modalImageStyle} 
                alt="Item Preview"
                onError={(e) => {e.target.onerror = null; e.target.src=TSHIRT_COLOR_MAP[selectedItemForModal.color?.toLowerCase()] || DEFAULT_TSHIRT_IMAGE;}}
              />
            </div>
            <div style={modalDetailsGridStyle}>
              <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', display:'flex', justifyContent:'space-between'}}>
                <span><span style={modalDetailsGridLabelStyle}>Quantity:</span><span style={modalDetailsGridValueStyle}>{selectedItemForModal.quantity}</span></span>
                <span><span style={modalDetailsGridLabelStyle}>Unit Price:</span><span style={modalDetailsGridValueStyle}>₹{(parseFloat(selectedItemForModal.calculatedUnitPrice) || 0).toFixed(2)}</span></span>
              </div>
              <div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Color:</span><span style={modalDetailsGridValueStyle}>{selectedItemForModal.color ? selectedItemForModal.color.charAt(0).toUpperCase() + selectedItemForModal.color.slice(1) : 'N/A'}</span></div>
              <div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Size:</span><span style={modalDetailsGridValueStyle}>{selectedItemForModal.size || 'N/A'}</span></div>
              <div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Thickness:</span><span style={modalDetailsGridValueStyle}>{selectedItemForModal.thicknessName || `${selectedItemForModal.thickness || ''} GSM`}</span></div>
              <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', height:'10px'}}></div> {/* Spacer */}
              
              <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1'}}><span style={{...modalDetailsGridLabelStyle, textAlign:'left'}}>Front Customization:</span></div>
              <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', paddingLeft: '30px'}}><span style={modalDetailsGridValueStyle}> {formatCustomizationForDisplay(selectedItemForModal.frontCustomization, true)}</span></div>
              {selectedItemForModal.frontCustomization?.position && (<div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', paddingLeft: '30px'}}><span style={{...modalDetailsGridLabelStyle, fontSize:'26px', color:'#2C758C', textAlign:'left'}}>  Position (W,H @ X,Y):</span><span style={{...modalDetailsGridValueStyle, fontSize:'26px', color:'#004053'}}> {(selectedItemForModal.frontCustomization.position.width || 0).toFixed(0)},{(selectedItemForModal.frontCustomization.position.height || 0).toFixed(0)} @ {(selectedItemForModal.frontCustomization.position.x || 0).toFixed(0)},{(selectedItemForModal.frontCustomization.position.y || 0).toFixed(0)}px</span></div> )}
              
              <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', marginTop:'5px'}}><span style={{...modalDetailsGridLabelStyle, textAlign:'left'}}>Back Customization:</span></div>
              <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', paddingLeft: '30px'}}><span style={modalDetailsGridValueStyle}> {formatCustomizationForDisplay(selectedItemForModal.backCustomization, true)}</span></div>
               {selectedItemForModal.backCustomization?.position && (<div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', paddingLeft: '30px'}}><span style={{...modalDetailsGridLabelStyle, fontSize:'26px', color:'#2C758C', textAlign:'left'}}>  Position (W,H @ X,Y):</span><span style={{...modalDetailsGridValueStyle, fontSize:'26px', color:'#004053'}}> {(selectedItemForModal.backCustomization.position.width || 0).toFixed(0)},{(selectedItemForModal.backCustomization.position.height || 0).toFixed(0)} @ {(selectedItemForModal.backCustomization.position.x || 0).toFixed(0)},{(selectedItemForModal.backCustomization.position.y || 0).toFixed(0)}px</span></div>)}

              {selectedItemForModal.priceBreakdown && Object.keys(selectedItemForModal.priceBreakdown).length > 0 && (
                  <>
                    <div style={{gridColumn: '1 / -1', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #aacdd9', color:'#00566F', fontWeight:700, fontSize:'32px'}}>Price Breakdown (per unit):</div>
                    {Object.entries(selectedItemForModal.priceBreakdown).map(([key, value]) => {
                        if (key === 'totalUnit' || value === 0 || value === "0.00" ) return null; // Don't show total or zero-cost items in breakdown section
                        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        const displayValue = parseFloat(value);
                        return (
                            <React.Fragment key={key}>
                                <div style={{...modalDetailsGridItemStyle, gridColumn:'1/1'}}><span style={{...modalDetailsGridLabelStyle, fontSize:'28px', color:'#2C758C'}}>{displayKey}:</span></div>
                                <div style={{...modalDetailsGridItemStyle, gridColumn:'2/2'}}><span style={{...modalDetailsGridValueStyle, fontSize:'28px', color:'#004053'}}>₹{displayValue.toFixed(2)}</span></div>
                            </React.Fragment>
                        );
                    })}
                  </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalCartScreen;