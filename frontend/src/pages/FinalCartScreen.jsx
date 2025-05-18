// frontend/src/pages/FinalCartScreen.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCurrentItem } from '../contexts/CurrentItemContext'; 
import CartIndicator from '../components/common/CartIndicator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// T-shirt color maps for display
const TSHIRT_COLOR_MAP = {
    black: { front: '/tshirtmockups/blacktshirt.png', back: '/tshirtmockups/blackback.png' },
    red: { front: '/tshirtmockups/redfront.png', back: '/tshirtmockups/redback.png' },
    navy: { front: '/tshirtmockups/navyfront.png', back: '/tshirtmockups/navyback.png' },
    blue: { front: '/tshirtmockups/bluefront.png', back: '/tshirtmockups/blueback.png' }, // If 'blue' is distinct
    brown: { front: '/tshirtmockups/brownfront.png', back: '/tshirtmockups/brownback.png' },
    cream: { front: '/tshirtmockups/creamfront.png', back: '/tshirtmockups/creamback.png' },
    white: { front: '/tshirtmockups/whitefront.png', back: '/tshirtmockups/whiteback.png' }
};
const DEFAULT_TSHIRT_IMAGE = "/tshirtmockups/default_tshirt.png"; // General fallback
const DELIVERY_CHARGE_HOME = 179.00; // Updated delivery charge

// Constants for positioning multi-design elements in modal (relative to outer printable area)
const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 330; 
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488;

// For color dot display in cart list
const COLOR_DISPLAY_MAP = {
    black: { display: '#1e1e1e', border: 'none' },
    red: { display: '#8b0000', border: 'none' },
    navy: { display: '#002244', border: 'none' },
    blue: { display: '#0000FF', border: 'none' },
    brown: { display: '#7A4824', border: 'none' },
    cream: { display: '#fdf1dc', border: '1px solid #ddd' },
    white: { display: '#ffffff', border: '1px solid #ccc' },
};

const FinalCartScreen = () => {
  const navigate = useNavigate();
  const { cartItems, updateCartItemQuantity, removeCartItem, clearCart, fetchCartItems } = useCart();
  const { clearCurrentItemForNewProduct } = useCurrentItem();

  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [pickupDetails, setPickupDetails] = useState(null);
  const [deliveryType, setDeliveryType] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const orderDetailsForPdfRef = useRef(null); // For PDF generation
  const modalContentRef = useRef(null); // For potential modal PDF capture (not used currently for PDF)


  useEffect(() => {
    fetchCartItems();
    const type = localStorage.getItem('deliveryType');
    setDeliveryType(type);

    if (type === 'home_delivery') {
      const detailsRaw = localStorage.getItem('deliveryDetails');
      if(detailsRaw) try { setDeliveryDetails(JSON.parse(detailsRaw)); } catch(e) { console.error("Error parsing deliveryDetails from localStorage:", e); setDeliveryDetails(null); localStorage.removeItem('deliveryDetails'); }
      else setDeliveryDetails(null);
    } else if (type === 'store_pickup') {
      const detailsRaw = localStorage.getItem('pickupDetails');
      if(detailsRaw) try { setPickupDetails(JSON.parse(detailsRaw)); } catch(e) { console.error("Error parsing pickupDetails from localStorage:", e); setPickupDetails(null); localStorage.removeItem('pickupDetails');}
      else setPickupDetails(null);
    } else { // No delivery type or invalid type
        setDeliveryDetails(null);
        setPickupDetails(null);
    }
  }, [fetchCartItems]);

  const handleQuantityChange = (cartItemId, newQuantity) => {
    const item = cartItems.find(i => (i.cartItemId || i.id) === cartItemId); // Use cartItemId if available
    if (newQuantity < 1) {
      if (window.confirm("Are you sure you want to remove this item from your cart?")) {
        removeCartItem(cartItemId); // Assumes removeCartItem handles blob revocation for THIS item if needed by CartContext logic
      }
    } else {
      updateCartItemQuantity(cartItemId, newQuantity);
    }
  };

  const handleShowItemDetails = (item) => setSelectedItemForModal(item);
  const handleCloseModal = () => setSelectedItemForModal(null);

  const handleBackNavigation = () => {
    if (deliveryType === 'home_delivery') navigate('/delivery-form');
    else if (deliveryType === 'store_pickup') navigate('/store-pickup-form');
    else navigate('/delivery-options');
  };

  const formatShortCustomizationForDisplay = (cust) => {
    if (!cust) return 'None';
    const limit = 20;
    switch (cust.type) {
        case 'ai_text_image': return `AI Image ${cust.removedBackground ? '(No BG)' : ''}`;
        case 'embroidery_text': return `Emb. Text: "${cust.text?.substring(0, limit)}${cust.text?.length > limit ? "..." : ""}"`;
        case 'embroidery_design': return `Emb. Design: ${cust.name || 'Library'}`;
        case 'uploaded_image': return `Uploaded: ${cust.originalFileName?.substring(0, limit)}${cust.originalFileName?.length > limit ? "..." : (cust.src ? "Image" : "None")}`;
        case 'library_design': return `Library: ${cust.name || 'Design'}`;
        case 'ai_draw_image': return `AI Drawn: ${cust.prompt?.substring(0, limit)}${cust.prompt?.length > limit ? "..." : ""}`;
        case 'multi_library_design': return `Multi-Design (${cust.elements?.length || 0})`;
        default: return cust.type ? cust.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Custom';
    }
  };
  
    const formatFullCustomizationForDisplay = (cust) => { // Used in Modal and PDF
    if (!cust) return 'None.';
    let outputLines = []; // <<<<<<<<<<<< DECLARE outputLines HERE
    outputLines.push(`Type: ${cust.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}`);
    const detailLimitModal = 70; 

    if (cust.name) outputLines.push(`  Name: ${cust.name}`);
    if (cust.text) outputLines.push(`  Text: "${cust.text}"`);
    if (cust.font) outputLines.push(`  Font: ${cust.font.split(',')[0].replace(/'| Custom/g,'')}`);
    if (cust.type === 'embroidery_text' && cust.color) outputLines.push(`  Emb. Color: ${cust.color}`);
    else if (cust.color && cust.type !== 'embroidery_text') outputLines.push(`  Color: ${cust.color}`); // For other potential color fields
    if (cust.prompt) outputLines.push(`  Prompt: ${cust.prompt.substring(0,detailLimitModal)}${cust.prompt.length > detailLimitModal ? "..." : ""}`);
    if (cust.originalFileName) outputLines.push(`  Filename: ${cust.originalFileName}`);
    if (cust.imageId) outputLines.push(`  Ref. ID: ${cust.imageId.substring(0,15)}...`);
    if (cust.category) outputLines.push(`  Category: ${cust.category}`);
    if (cust.removedBackground) outputLines.push(`  Background Removed: Yes`);
    
    if (cust.type === 'multi_library_design' && Array.isArray(cust.elements)) {
        outputLines.push(`  Elements (${cust.elements.length}):`);
        cust.elements.forEach((el, i) => { 
            let elDetail = `    ${i+1}. ${el.name || `ID:${el.designId||'N/A'}`}`; 
            if (el.price) elDetail += ` (+₹${parseFloat(el.price).toFixed(2)})`; 
            if(el.position) { // Position for each element
                elDetail += ` (Pos: W${el.position.width?.toFixed(0)},H${el.position.height?.toFixed(0)} @X${el.position.x?.toFixed(0)},Y${el.position.y?.toFixed(0)})`;
            }
            outputLines.push(elDetail);
        });
    } else if(cust.position) { // Position for single customizations
        outputLines.push(`  Position (px): W ${cust.position.width?.toFixed(0)}, H ${cust.position.height?.toFixed(0)} @ X ${cust.position.x?.toFixed(0)}, Y ${cust.position.y?.toFixed(0)}`);
    }
    return outputLines.join('\n');
  };

  const { subtotal, deliveryChargeCalculated, grandTotal } = useMemo(() => {
    let currentSubtotal = 0;
    if (Array.isArray(cartItems)) {
        cartItems.forEach(item => {
          const unitPrice = parseFloat(item.calculatedUnitPrice);
          const quantity = parseInt(item.quantity, 10) || 0;
          if(!isNaN(unitPrice) && unitPrice >= 0 && quantity > 0) { currentSubtotal += unitPrice * quantity; }
        });
    }
    const currentDeliveryCharge = deliveryType === 'home_delivery' ? DELIVERY_CHARGE_HOME : 0;
    const currentGrandTotal = currentSubtotal + currentDeliveryCharge;
    return { subtotal: currentSubtotal, deliveryChargeCalculated: currentDeliveryCharge, grandTotal: currentGrandTotal };
  }, [cartItems, deliveryType]);

const downloadImage = async (imageDataUrl, filename) => {
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        console.warn("downloadImage: Invalid imageDataUrl provided.", imageDataUrl);
        return;
    }
    try {
        let finalImageDataUrl = imageDataUrl;
        // If it's a direct server path (not base64 or blob) that needs fetching first
        if (!imageDataUrl.startsWith('data:image') && !imageDataUrl.startsWith('blob:')) {
            // console.log("downloadImage: Fetching image from server path:", imageDataUrl);
            const response = await fetch(imageDataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${imageDataUrl}`);
            const blob = await response.blob();
            finalImageDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } else if (imageDataUrl.startsWith('blob:')) { // If somehow a blob URL still exists here
            // console.log("downloadImage: Converting existing blob URL to data URL:", imageDataUrl);
             const blob = await fetch(imageDataUrl).then(res => res.blob());
             finalImageDataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        if (finalImageDataUrl && finalImageDataUrl.startsWith('data:image')) {
            const link = document.createElement('a');
            link.href = finalImageDataUrl;
            link.download = filename || `custom-design-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // console.log(`Image "${link.download}" download initiated.`);
        } else {
            console.warn("downloadImage: Could not obtain a valid data URL for download.", finalImageDataUrl);
        }
    } catch (error) {
        console.error(`Error in downloadImage for "${filename}":`, error);
        // alert(`Could not download image: ${filename}. Please check console.`);
    }
  };

 const generateOrderPdf = async (orderPayload, mockOrderId) => {
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4'});
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    let currentY = margin;
    const lineH = 15; // Base line height for 10pt font
    const sectionSpacing = 20;
    const smallTextSize = 8;
    const normalTextSize = 10;
    const subHeaderSize = 12;
    const headerSize = 14;
    const titleSize = 18;

    const addText = (text, x, y, size = normalTextSize, style = 'normal', options = {}) => {
        if (y + (size * 1.2) > pageHeight - margin) { // Check if NEW text will overflow
            pdf.addPage();
            currentY = margin;
            y = currentY;
        }
        pdf.setFontSize(size);
        pdf.setFont(undefined, style); // Resets to default font, then applies style
        pdf.text(text, x, y, options);
        currentY = y + (size * 1.2); // Approximate next Y
        return currentY;
    };
    
    const addWrappedText = (text, x, y, maxWidth, size = normalTextSize, style = 'normal') => {
        if (y + (size * 1.2) > pageHeight - margin) { 
            pdf.addPage(); currentY = margin; y = currentY;
        }
        pdf.setFontSize(size); pdf.setFont(undefined, style);
        const splitText = pdf.splitTextToSize(text, maxWidth);
        pdf.text(splitText, x, y);
        const linesAdded = splitText.length;
        currentY = y + (linesAdded * (size * 1.15)); // Adjust line height factor slightly
        return currentY;
    };

    // --- PDF Header ---
    currentY = addText(`Order Summary - ID: ${mockOrderId}`, pageWidth / 2, currentY, titleSize, 'bold', {align: 'center'});
    currentY += lineH * 0.5; 
    pdf.setDrawColor(180, 180, 180); pdf.line(margin, currentY, pageWidth - margin, currentY); 
    currentY += sectionSpacing;

    // --- Delivery / Pickup Details ---
    currentY = addText('Delivery Information:', margin, currentY, headerSize, 'bold');
    currentY += lineH * 0.8;
    let deliveryInfo = `Method: ${orderPayload.deliveryType === 'home_delivery' ? 'Home Delivery' : 'Store Pickup'}\n`;
    if (orderPayload.deliveryType === 'home_delivery' && orderPayload.deliveryDetails) {
        const dd = orderPayload.deliveryDetails;
        deliveryInfo += `To: ${dd.firstName} ${dd.lastName}\nAddress: ${dd.addressLine1}, ${dd.addressLine2}\nPincode: ${dd.pincode}\nPhone: ${dd.phoneNumber}\nEmail: ${dd.emailAddress}`;
    } else if (orderPayload.deliveryType === 'store_pickup' && orderPayload.pickupDetails) {
        const pd = orderPayload.pickupDetails;
        deliveryInfo += `Pickup By: ${pd.pickupFirstName} ${pd.pickupLastName}\nPhone: ${pd.pickupPhoneNumber}\nEmail: ${pd.pickupEmailAddress}`;
    }
    currentY = addWrappedText(deliveryInfo, margin + 10, currentY, pageWidth - (2 * margin) - 20, normalTextSize);
    currentY += 5; pdf.line(margin, currentY, pageWidth - margin, currentY); currentY += sectionSpacing;

    // --- Cart Items ---
    currentY = addText('Ordered Items:', margin, currentY, headerSize, 'bold');
    currentY += lineH * 0.8;

    for (const item of orderPayload.cartItems) {
        // Check if enough space for a new item entry, estimate ~100pts per item roughly
        if (currentY > pageHeight - (margin + 100)) { 
            pdf.addPage(); currentY = margin;
            currentY = addText('Order Items (Continued):', margin, currentY, headerSize, 'bold'); currentY += lineH*0.8;
        }
        
        let itemTitle = `${item.productType || 'Custom T-Shirt'} (Qty: ${item.quantity})`;
        currentY = addText(itemTitle, margin +10, currentY, subHeaderSize, 'bold');
        currentY += lineH * 0.7;
        currentY = addText(`  Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'}, Type: ${item.thicknessName || item.thickness + ' GSM'}`, margin + 15, currentY, normalTextSize);
        currentY += lineH * 0.7;
        currentY = addText(`  Unit Price: ₹${parseFloat(item.unitPriceAtOrder || 0).toFixed(2)} | Item Total: ₹${((parseFloat(item.unitPriceAtOrder) || 0) * (item.quantity || 1)).toFixed(2)}`, margin + 15, currentY, normalTextSize);
        currentY += lineH * 0.7;

        if(item.frontCustomization) {
            if (currentY > pageHeight - (margin + 40)) { pdf.addPage(); currentY = margin; }
            currentY = addText(`  Front Details:`, margin + 15, currentY, normalTextSize, 'italic');
            currentY = addWrappedText(formatFullCustomizationForDisplay(item.frontCustomization), margin + 25, currentY + 2, pageWidth - (2*margin) - 40, smallTextSize);
            currentY += lineH * 0.5;
        }
        if(item.backCustomization) {
             if (currentY > pageHeight - (margin + 40)) { pdf.addPage(); currentY = margin; }
            currentY = addText(`  Back Details:`, margin + 15, currentY, normalTextSize, 'italic');
            currentY = addWrappedText(formatFullCustomizationForDisplay(item.backCustomization), margin + 25, currentY + 2, pageWidth - (2*margin) - 40, smallTextSize);
            currentY += lineH * 0.5;
        }
        if (item.frontCustomization || item.backCustomization) currentY += lineH * 0.3; // Small space after customizations

        pdf.setDrawColor(220, 220, 220); 
        pdf.line(margin + 5, currentY, pageWidth - margin - 5, currentY); // Item separator
        currentY += lineH;
    }
    
    // --- Financial Summary ---
    if (currentY > pageHeight - (margin + 120)) { pdf.addPage(); currentY = margin; }
    // Try to push summary to bottom if enough space, else just continue
    if (pageHeight - currentY < 120 && orderPayload.cartItems.length > 1) { // Heuristic: if not much space left, start on new page
         pdf.addPage(); currentY = margin;
    } else {
        currentY = Math.max(currentY, pageHeight - margin - 120); // Attempt to push to bottom
         pdf.line(margin, currentY -10, pageWidth - margin, currentY -10); currentY += 5;
    }


    currentY = addText('Payment Summary:', margin, currentY, headerSize, 'bold');
    currentY += lineH;
    currentY = addText(`Subtotal: ₹${orderPayload.orderSubtotal.toFixed(2)}`, margin + 10, currentY, subHeaderSize);
    currentY += lineH;
    currentY = addText(`Delivery Charges: ₹${orderPayload.deliveryCharge.toFixed(2)}`, margin + 10, currentY, subHeaderSize);
    currentY += lineH + 5;
    pdf.setDrawColor(100,100,100); pdf.setLineWidth(1.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY); currentY += lineH + 2;
    pdf.setFontSize(titleSize); pdf.setFont(undefined, 'bold');
    pdf.text(`GRAND TOTAL: ₹${orderPayload.orderTotal.toFixed(2)}`, margin + 10, currentY);
    
    pdf.save(`Order_Summary_${mockOrderId}.pdf`);
    // console.log(`PDF Generation: order_summary_${mockOrderId}.pdf download initiated.`);
  };

  const handleCheckout = async () => {
    if (!cartItems || cartItems.length === 0) { alert("Your cart is empty."); return; }
    if (!deliveryType) { alert("Please select delivery option."); navigate('/delivery-options'); return; }
    if (deliveryType === 'home_delivery' && !deliveryDetails) { alert("Delivery address missing."); navigate('/delivery-form'); return; }
    if (deliveryType === 'store_pickup' && !pickupDetails) { alert("Pickup contact details missing."); navigate('/store-pickup-form'); return; }

    setIsCheckingOut(true);
    const orderItemsForBackend = cartItems.map(item => { 
      const { _blobUrls, _blobDataForUpload, priceBreakdown, ...cartItemData } = item;
      let finalFrontCustomization = null; if (cartItemData.frontCustomization) { const { _blobDataForUpload: ffBlob, ...fc} = cartItemData.frontCustomization; finalFrontCustomization = fc; if (fc.type === 'multi_library_design' && Array.isArray(fc.elements)) { finalFrontCustomization.elements = fc.elements.map(el => { const { _blobDataForUpload: elBlob, ...cleanEl } = el; return cleanEl; }); } }
      let finalBackCustomization = null; if (cartItemData.backCustomization) { const { _blobDataForUpload: bfBlob, ...bc} = cartItemData.backCustomization; finalBackCustomization = bc; if (bc.type === 'multi_library_design' && Array.isArray(bc.elements)) { finalBackCustomization.elements = bc.elements.map(el => { const { _blobDataForUpload: elBlob, ...cleanEl } = el; return cleanEl; }); } }
      return {...cartItemData, frontCustomization: finalFrontCustomization, backCustomization: finalBackCustomization, unitPriceAtOrder: item.calculatedUnitPrice, quantity: item.quantity };
    });
    const orderPayload = { cartItems: orderItemsForBackend, deliveryType, deliveryDetails, pickupDetails, orderSubtotal: subtotal, deliveryCharge: deliveryChargeCalculated, orderTotal: grandTotal,};
    const mockOrderId = `KSO-${Date.now().toString().slice(-6)}`;
    
    // Download Customization Images (if any)
    for (const item of cartItems) {
        const processAndDownload = async (customization, side) => {
            if (customization?.src && (customization.type !== 'embroidery_text')) { // Only download if src exists and not just text
                if (customization.type === 'multi_library_design' && Array.isArray(customization.elements)) {
                    for (let i = 0; i < customization.elements.length; i++) {
                        const el = customization.elements[i];
                        if (el.src) {
                            await downloadImage(el.src, `${mockOrderId}_${item.id}_${side}_el${i + 1}_${el.designId}.png`);
                        }
                    }
                } else {
                    await downloadImage(customization.src, `${mockOrderId}_${item.id}_${side}_${customization.name || customization.type}.png`);
                }
            }
        };
        await processAndDownload(item.frontCustomization, 'front');
        await processAndDownload(item.backCustomization, 'back');
    }

    // Generate and Download Order Summary PDF
    if (orderDetailsForPdfRef.current) {
        await generateOrderPdf(orderPayload, mockOrderId); // Pass orderPayload to include in PDF eventually
    } else { console.error("PDF Ref not found."); }

    await new Promise(resolve => setTimeout(resolve, 1500)); 
    const mockOrderResponseFromServer = { success: true, orderId: mockOrderId, message: "Order Placed & Downloads Initiated!", orderDetails: { orderTotal: grandTotal, deliveryType, recipientName: deliveryType === 'home_delivery' ? `${deliveryDetails?.firstName} ${deliveryDetails?.lastName}` : `${pickupDetails?.pickupFirstName} ${pickupDetails?.pickupLastName}`}};
    
    setIsCheckingOut(false);
    if(mockOrderResponseFromServer.success) {
        alert(mockOrderResponseFromServer.message);
        if (typeof clearCart === 'function') clearCart(); 
        if (typeof clearCurrentItemForNewProduct === 'function') clearCurrentItemForNewProduct(); 
        localStorage.removeItem('deliveryDetails'); localStorage.removeItem('pickupDetails'); localStorage.removeItem('deliveryType');
        navigate('/order-confirmation', { state: { orderConfirmationDetails: mockOrderResponseFromServer } }); 
    } else { alert(mockOrderResponseFromServer.message || "Order placement failed."); }
  };


  // --- Styles ---
  const pageContainerStyle = { width: '2240px', minHeight: '1400px', position: 'relative', background: 'white', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', paddingBottom: '100px' };
  const cartTitleBarStyle = { display: 'flex', alignItems: 'center', padding: '80px 127px 40px 127px' };
  const cartTitleText = { color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400 };
  const backArrowImgStyle = { width: '120px', height: '120px', marginRight: '60px', cursor: 'pointer' };
  const cartContentAreaStyle = { display: 'flex', justifyContent: 'space-between', padding: '0 100px', gap: '50px', alignItems: 'flex-start' };
  const cartItemsListStyle = { flex: 2.5, maxWidth: '1200px' };
  const cartSummaryPanelOuterStyle = { flex: 1.5, minWidth:'700px', maxWidth: '815px', position: 'sticky', top: '30px', alignSelf: 'flex-start' };
  const cartSummaryPanelInnerStyle = { backgroundColor: '#F4FAFF', borderRadius: '12px', padding: '35px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 3px 12px rgba(0,0,0,0.08)', minHeight:'600px' };
  const summaryTitleStyle = { color: '#00566F', fontSize: '32px', fontFamily:'Inter', fontWeight: 700, marginBottom: '25px', textAlign: 'left', borderBottom: '2px solid #C5DDE8', paddingBottom: '15px' };
  const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontSize: '28px', fontFamily:'Inter' };
  const summaryLabelStyle = { fontWeight: 500, color: '#4A6B78' };
  const summaryValueStyle = { fontWeight: 600, color: '#00566F' };
  const summaryDividerStyle = { border: 0, borderTop: '1.5px solid #C5DDE8', margin: '25px 0' };
  const deliveryInfoContainerStyle = { marginTop: '20px', marginBottom: '30px' };
  const deliveryHeaderStyle = {color: '#00566F', fontSize: '30px', fontWeight: 700, marginBottom: '10px'};
  const deliveryInfoTextStyle = { fontSize: '26px', color: '#333', lineHeight: 1.5, margin:'4px 0'};
  const changeDeliveryBtnStyle = { fontSize: '22px', padding: '8px 18px', marginTop:'15px', cursor:'pointer', background:'#007bff', color:'white', border:'none', borderRadius:'6px', fontWeight:500};
  const chooseDeliveryBtnStyle = { fontSize: '26px', padding: '10px 20px', marginTop:'10px', cursor:'pointer', background:'#00566F', color:'white', border:'none', borderRadius:'8px'};
  const grandTotalRowStyle = {...summaryRowStyle, marginTop:'15px', alignItems:'center'};
  const grandTotalLabelStyle = { ...summaryLabelStyle, color: '#00566F', fontSize: '44px', fontWeight: 800 };
  const grandTotalValueStyle = { ...summaryValueStyle, color: '#00566F', fontSize: '44px', fontWeight: 800 };
  const checkoutButtonStyle = { width: '100%', height: '80px', border: 'none', borderRadius: '10px', color: 'white', fontSize: '36px', fontWeight: 700, marginTop: '30px', fontFamily:'Inter', transition: 'background-color 0.2s ease' };
  const cartItemCardStyle = { display: 'flex', alignItems: 'flex-start', gap:'30px', marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #E0E8EF' };
  const cartItemImageContainerStyle = { width: '220px', height: '220px', flexShrink:0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E0E8EF'};
  const cartItemImageStyle = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
  const cartItemInfoStyle = { flexGrow: 1, display:'flex', flexDirection:'column', justifyContent:'space-between' }; 
  const cartItemTopRowStyle = {display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'};
  const cartItemNameStyle = { color: '#00566F', fontSize: '40px', fontFamily: 'Inter', fontWeight: 600, marginRight:'20px' };
  const cartItemSpecsLineStyle = { fontSize: '28px', color: '#334750', marginBottom: '6px', lineHeight: 1.4 };
  const cartItemColorIndicatorStyle = (colorInfo) => ({ display:'inline-block', width:'22px', height:'22px', backgroundColor:colorInfo.display, borderRadius:'50%', marginRight:'8px', border: colorInfo.border || 'none', verticalAlign:'middle' });
  const itemActionsStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' };  
  const quantityContainerCartStyle = { width: '160px', height: '70px', display: 'flex', backgroundColor: '#F4FAFF', border: '2px solid #A8CADB', borderRadius: '10px', color: '#00566F', alignItems:'center' };
  const quantityCartBtnSpanStyle = { flex:1, textAlign: 'center', fontSize: '32px', fontWeight: 600, cursor: 'pointer', userSelect: 'none', display:'flex', alignItems:'center', justifyContent:'center', height:'100%' };
  const cartItemTotalPriceStyle = { color: '#00566F', fontSize: '44px', fontWeight: 700, textAlign:'right'};
  const viewDetailsLinkStyle = { color: '#00566F', fontSize: '26px', fontWeight: 500, textDecoration: 'underline', cursor: 'pointer', marginTop: '15px', display: 'inline-block' };
  
  const modalOverlayStyle = { display: 'flex', position: 'fixed', zIndex: 1002, left: 0, top: 0, width: '100%', height: '100%', backdropFilter: 'blur(5px)', background: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding:'20px', boxSizing:'border-box' };
  const modalContentStyle = { position: 'relative', width: '1400px', maxWidth:'95vw', maxHeight: '90vh', overflowY: 'auto', background: '#EBF5FF', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.15)', padding: '40px 50px', boxSizing: 'border-box' };
  const modalCloseBtnStyle = { position: 'absolute', top: '30px', right: '30px', width: '60px', height: '60px', cursor: 'pointer', zIndex: 10, background: 'transparent', border: 'none', fontSize: '40px', color: '#00566F', display:'flex', justifyContent:'center', alignItems:'center'};
  const modalHeaderStyle = { textAlign: 'center', color: '#00566F', fontSize: '64px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400, marginBottom: '30px' };
  const modalImagePreviewsContainerStyle = { display: 'flex', justifyContent: 'space-around', gap: '30px', marginBottom: '30px', flexWrap:'wrap' };
  const modalImageContainerStyle = { width: '380px', height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: '10px', overflow: 'hidden', border: '1px solid #B0CADD', padding:'10px', position:'relative' };
  const modalImageStyle = { maxWidth: '100%', maxHeight: 'calc(100% - 30px)', objectFit: 'contain', zIndex:0 };
  const modalImageCaptionStyle = { color: '#00566F', fontSize:'20px', fontWeight:600, marginTop:'auto', paddingTop:'5px'};
  const modalDetailsGridStyle = { display: 'grid', gridTemplateColumns: 'minmax(220px, auto) 1fr', gap: '12px 20px', fontSize: '30px', fontFamily: 'Inter', color: '#333' };
  const modalDetailsGridItemStyle = { paddingBottom:'5px', display:'contents' }; 
  const modalDetailsGridLabelStyle = { color: '#00495F', fontWeight: 600, textAlign: 'right', paddingRight:'15px', alignSelf:'flex-start' };
  const modalDetailsGridValueStyle = { color: '#1A2B33', fontWeight: 500, whiteSpace:'pre-wrap', wordBreak:'break-word', alignSelf:'flex-start' };
  const modalCustomizationOverlayStyle = {position:'absolute', width:'70%', height:'70%', objectFit:'contain', top:'15%', left:'15%', zIndex:1, opacity: 0.95};
  const modalEmbroideryTextStyle = {position:'absolute', color:'black', fontFamily:'Arial', fontSize:'24px', textAlign:'center', padding:'5px', background:'rgba(255,255,255,0.4)', zIndex:1, whiteSpace:'pre-wrap', maxWidth:'80%', wordBreak: 'break-word'};

  if (!cartItems) return <div style={{textAlign:'center', fontSize:'24px', padding:'50px'}}>Loading cart items...</div>;

  return (
    <div style={pageContainerStyle}>
      <CartIndicator />
      <div style={cartTitleBarStyle}>
        <img style={backArrowImgStyle} src="/Features_Display_Img/back arrow.png" alt="Back" onClick={handleBackNavigation} />
        <div style={cartTitleText}>My Cart ({cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0)})</div>
      </div>

      {/* The ref `orderDetailsForPdfRef` wraps the main content area for PDF generation */}
      <div ref={orderDetailsForPdfRef} style={{padding: '0 100px'}}> {/* Added padding here for PDF spacing if needed */}
        <div style={cartContentAreaStyle}>
          <div style={cartItemsListStyle}>
            {cartItems.length === 0 ? ( <p style={{ fontSize: '32px', color: '#777', textAlign: 'center', padding: '50px 0' }}>Your shopping cart is empty.</p>
            ) : ( cartItems.map(item => {
                const itemColorKey = item.color?.toLowerCase() || 'black';
                const colorInfo = COLOR_DISPLAY_MAP[itemColorKey] || {display:'#777', border:'1px solid #ccc'};
                let displaySideForImage = 'front'; 
                let mainCustomizationSrc = item.frontCustomization?.src;
                if (item.frontCustomization?.type === 'multi_library_design' && item.frontCustomization.elements?.[0]?.src) mainCustomizationSrc = item.frontCustomization.elements[0].src;
                if (!mainCustomizationSrc) { 
                    if (item.backCustomization?.src) { displaySideForImage = 'back'; mainCustomizationSrc = item.backCustomization.src; }
                    else if (item.backCustomization?.type === 'multi_library_design' && item.backCustomization.elements?.[0]?.src) { displaySideForImage = 'back'; mainCustomizationSrc = item.backCustomization.elements[0].src;}
                }
                const baseTshirtImage = TSHIRT_COLOR_MAP[itemColorKey]?.[displaySideForImage] || TSHIRT_COLOR_MAP[itemColorKey]?.front || DEFAULT_TSHIRT_IMAGE;
                const itemDisplayImageForList = mainCustomizationSrc || baseTshirtImage;
                const unitPrice = parseFloat(item.calculatedUnitPrice) || 0;
                const itemTotalPrice = unitPrice * (item.quantity || 1);
                const cartItemId = item.cartItemId || item.id;
                return (
                  <div key={cartItemId} style={cartItemCardStyle}>
                    <div style={cartItemImageContainerStyle}><img src={itemDisplayImageForList} style={cartItemImageStyle} alt={item.productType || 'Product'} onError={(e) => { e.target.onerror = null; e.target.src = baseTshirtImage; }} /></div>
                    <div style={cartItemInfoStyle}>
                      <div> 
                        <div style={cartItemTopRowStyle}><span style={cartItemNameStyle}>{item.productType || 'Custom T-Shirt'}</span><span style={cartItemTotalPriceStyle}>₹{itemTotalPrice.toFixed(2)}</span></div>
                        <div style={cartItemSpecsLineStyle}><span style={cartItemColorIndicatorStyle(colorInfo)}></span>{item.color ? item.color.charAt(0).toUpperCase() + item.color.slice(1) : 'N/A'} / {item.size||'N/A'} / {item.thicknessName||`${item.thickness||''} GSM`}</div>
                        <div style={{...cartItemSpecsLineStyle, color:'#555', fontSize: '24px'}}>Unit Price: ₹{unitPrice.toFixed(2)}</div>
                        <div style={{...cartItemSpecsLineStyle, fontSize:'22px', color:'#666', maxHeight:'2.8em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>Front: {formatShortCustomizationForDisplay(item.frontCustomization)} <br/>Back: {formatShortCustomizationForDisplay(item.backCustomization)}</div>
                      </div>
                      <div style={itemActionsStyle}> 
                        <div style={quantityContainerCartStyle}><span style={quantityCartBtnSpanStyle} onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) - 1)}>-</span><span style={{...quantityCartBtnSpanStyle, borderRight:'1px solid #A8CADB', borderLeft:'1px solid #A8CADB', cursor:'default', fontSize:'26px' }}>{(item.quantity || 1).toString().padStart(2, '0')}</span><span style={{...quantityCartBtnSpanStyle, borderRight: 'none'}} onClick={() => handleQuantityChange(cartItemId, (item.quantity || 1) + 1)}>+</span></div>
                        <div style={viewDetailsLinkStyle} onClick={()=>handleShowItemDetails(item)}>View Full Details</div>
                      </div>
                    </div>
                  </div>);
              }))}
          </div>
          <div style={cartSummaryPanelOuterStyle}>
              <div style={cartSummaryPanelInnerStyle}>
                  <div style={summaryTitleStyle}>ORDER SUMMARY</div>
                  <div style={summaryRowStyle}><span style={summaryLabelStyle}>Total MRP</span><span style={summaryValueStyle}>₹{subtotal.toFixed(2)}</span></div>
                  <hr style={summaryDividerStyle} />
                  {deliveryType ? (<div style={deliveryInfoContainerStyle}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h4 style={deliveryHeaderStyle}>{deliveryType === 'home_delivery' ? 'Home Delivery':'Store Pickup'}</h4><button onClick={()=>navigate('/delivery-options')} style={changeDeliveryBtnStyle}>Change</button></div> {deliveryType==='home_delivery' && deliveryDetails && (<div><p style={deliveryInfoTextStyle}><b>To: {deliveryDetails.firstName} {deliveryDetails.lastName}</b></p><p style={deliveryInfoTextStyle}>{deliveryDetails.addressLine1}, {deliveryDetails.addressLine2}</p><p style={deliveryInfoTextStyle}>Pincode: {deliveryDetails.pincode}</p><p style={deliveryInfoTextStyle}>Ph: {deliveryDetails.phoneNumber}</p></div>)} {deliveryType==='store_pickup' && pickupDetails && (<div><p style={deliveryInfoTextStyle}><b>By: {pickupDetails.pickupFirstName} {pickupDetails.pickupLastName}</b></p><p style={deliveryInfoTextStyle}>Ph: {pickupDetails.pickupPhoneNumber}</p></div>)}</div>)
                   : (<div style={deliveryInfoContainerStyle}><p style={{...deliveryInfoTextStyle, color: '#dc3545', fontWeight: 'bold'}}>No delivery option selected.</p><button onClick={()=>navigate('/delivery-options')} style={chooseDeliveryBtnStyle}>Choose Delivery</button></div>)}
                  <div style={summaryRowStyle}><span style={summaryLabelStyle}>Delivery Charge</span><span style={summaryValueStyle}>₹{deliveryChargeCalculated.toFixed(2)}</span></div>
                  <hr style={summaryDividerStyle} />
                  <div style={grandTotalRowStyle}><span style={grandTotalLabelStyle}>Grand Total</span><span style={grandTotalValueStyle}>₹{grandTotal.toFixed(2)}</span></div>
                  <button style={{...checkoutButtonStyle, backgroundColor:(!deliveryType||cartItems.length===0||isCheckingOut)?'#B0C4DE':'#00566F', cursor:(!deliveryType||cartItems.length===0||isCheckingOut)?'not-allowed':'pointer'}} onClick={handleCheckout} disabled={!deliveryType||cartItems.length===0||isCheckingOut}>
                      {isCheckingOut ? 'Processing Order...' : 'Confirm & Place Order'}
                  </button>
              </div>
          </div>
        </div>
      </div>

      {selectedItemForModal && ( <div style={modalOverlayStyle} onClick={handleCloseModal}> <div ref={modalContentRef} style={modalContentStyle} onClick={(e) => e.stopPropagation()}> <button style={modalCloseBtnStyle} onClick={handleCloseModal}>×</button> <div style={modalHeaderStyle}>{selectedItemForModal.productType || 'Custom T-Shirt'} - Configuration</div> <div style={modalImagePreviewsContainerStyle}> <div style={{textAlign:'center'}}> <div style={modalImageCaptionStyle}>Front View</div> <div style={modalImageContainerStyle}> <img src={TSHIRT_COLOR_MAP[selectedItemForModal.color?.toLowerCase()]?.front || DEFAULT_TSHIRT_IMAGE} style={modalImageStyle} alt="Front Base"/> {selectedItemForModal.frontCustomization?.type === 'embroidery_text' && (<div style={{...modalEmbroideryTextStyle, color:selectedItemForModal.frontCustomization.color, fontFamily:selectedItemForModal.frontCustomization.font}}>{selectedItemForModal.frontCustomization.text}</div>)} {selectedItemForModal.frontCustomization?.src && selectedItemForModal.frontCustomization.type !== 'embroidery_text' && !selectedItemForModal.frontCustomization.elements && (<img src={selectedItemForModal.frontCustomization.src} alt="Front Design" style={modalCustomizationOverlayStyle} onError={(e)=>{e.target.style.display='none'}}/>)} {selectedItemForModal.frontCustomization?.type === 'multi_library_design' && selectedItemForModal.frontCustomization.elements?.map((el, idx)=>(el.src && <img key={`fm-${idx}`} src={el.src} alt={el.name||'d'} style={{...modalCustomizationOverlayStyle, left:`${(el.position.x/UI_OUTER_PRINTABLE_PIXEL_WIDTH)*100}%`, top:`${(el.position.y/UI_OUTER_PRINTABLE_PIXEL_HEIGHT)*100}%`, width:`${(el.position.width/UI_OUTER_PRINTABLE_PIXEL_WIDTH)*100}%`, height:`${(el.position.height/UI_OUTER_PRINTABLE_PIXEL_HEIGHT)*100}%`, objectFit:'contain', zIndex:idx+1}} onError={(e)=>e.target.style.display='none'}/> ))}</div></div><div style={{textAlign:'center'}}> <div style={modalImageCaptionStyle}>Back View</div><div style={modalImageContainerStyle}><img src={TSHIRT_COLOR_MAP[selectedItemForModal.color?.toLowerCase()]?.back || DEFAULT_TSHIRT_IMAGE} style={modalImageStyle} alt="Back Base"/> {selectedItemForModal.backCustomization?.type === 'embroidery_text' && (<div style={{...modalEmbroideryTextStyle, color:selectedItemForModal.backCustomization.color, fontFamily:selectedItemForModal.backCustomization.font}}>{selectedItemForModal.backCustomization.text}</div>)} {selectedItemForModal.backCustomization?.src && selectedItemForModal.backCustomization.type !== 'embroidery_text' && !selectedItemForModal.backCustomization.elements && (<img src={selectedItemForModal.backCustomization.src} alt="Back Design" style={modalCustomizationOverlayStyle} onError={(e)=>{e.target.style.display='none'}}/>)} {selectedItemForModal.backCustomization?.type === 'multi_library_design' && selectedItemForModal.backCustomization.elements?.map((el, idx)=>( el.src && <img key={`bm-${idx}`} src={el.src} alt={el.name||'d'} style={{...modalCustomizationOverlayStyle, left:`${(el.position.x/UI_OUTER_PRINTABLE_PIXEL_WIDTH)*100}%`, top:`${(el.position.y/UI_OUTER_PRINTABLE_PIXEL_HEIGHT)*100}%`, width:`${(el.position.width/UI_OUTER_PRINTABLE_PIXEL_WIDTH)*100}%`, height:`${(el.position.height/UI_OUTER_PRINTABLE_PIXEL_HEIGHT)*100}%`, objectFit:'contain', zIndex:idx+1}} onError={(e)=>e.target.style.display='none'}/>))} </div></div></div><div style={modalDetailsGridStyle}> <React.Fragment><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Quantity:</span></div><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridValueStyle}>{selectedItemForModal.quantity}</span></div></React.Fragment> <React.Fragment><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Unit Price:</span></div><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridValueStyle}>₹{(parseFloat(selectedItemForModal.calculatedUnitPrice) || 0).toFixed(2)}</span></div></React.Fragment> <React.Fragment><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Item Total:</span></div><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridValueStyle}>₹{((parseFloat(selectedItemForModal.calculatedUnitPrice) || 0) * (selectedItemForModal.quantity || 1)).toFixed(2)}</span></div></React.Fragment> <div style={{...modalDetailsGridItemStyle, gridColumn:'1 / -1', borderBottom: '1px solid #B0CADD', paddingBottom:'10px', marginBottom:'10px'}}></div><React.Fragment><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Color:</span></div><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridValueStyle}>{selectedItemForModal.color ? selectedItemForModal.color.charAt(0).toUpperCase() + selectedItemForModal.color.slice(1) : 'N/A'}</span></div></React.Fragment> <React.Fragment><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>Size:</span></div><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridValueStyle}>{selectedItemForModal.size || 'N/A'}</span></div></React.Fragment> <React.Fragment><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridLabelStyle}>T-shirt Type:</span></div><div style={modalDetailsGridItemStyle}><span style={modalDetailsGridValueStyle}>{selectedItemForModal.thicknessName || `${selectedItemForModal.thickness || ''} GSM`}</span></div></React.Fragment> <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', marginTop:'15px', borderTop: '1px dashed #B0CADD', paddingTop:'15px'}}><strong style={{...modalDetailsGridLabelStyle, textAlign:'left', display:'block', marginBottom:'8px', fontSize:'28px'}}>Front Design:</strong><pre style={{...modalDetailsGridValueStyle, paddingLeft:'15px', fontSize:'26px'}}>{formatFullCustomizationForDisplay(selectedItemForModal.frontCustomization)}</pre></div> {selectedItemForModal.frontCustomization?.position && (<div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', paddingLeft: '15px', fontSize:'24px'}}><span style={{color:'#2C758C'}}>Position (W,H @ X,Y):</span><span style={{color:'#004053'}}> {(selectedItemForModal.frontCustomization.position.width || 0).toFixed(0)},{(selectedItemForModal.frontCustomization.position.height || 0).toFixed(0)} @ {(selectedItemForModal.frontCustomization.position.x || 0).toFixed(0)},{(selectedItemForModal.frontCustomization.position.y || 0).toFixed(0)}px</span></div> )} <div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', marginTop:'10px', borderTop: '1px dashed #B0CADD', paddingTop:'15px'}}><strong style={{...modalDetailsGridLabelStyle, textAlign:'left', display:'block', marginBottom:'8px', fontSize:'28px'}}>Back Design:</strong><pre style={{...modalDetailsGridValueStyle, paddingLeft:'15px', fontSize:'26px'}}>{formatFullCustomizationForDisplay(selectedItemForModal.backCustomization)}</pre></div> {selectedItemForModal.backCustomization?.position && (<div style={{...modalDetailsGridItemStyle, gridColumn: '1 / -1', paddingLeft: '15px', fontSize:'24px'}}><span style={{color:'#2C758C'}}>Position (W,H @ X,Y):</span><span style={{color:'#004053'}}> {(selectedItemForModal.backCustomization.position.width || 0).toFixed(0)},{(selectedItemForModal.backCustomization.position.height || 0).toFixed(0)} @ {(selectedItemForModal.backCustomization.position.x || 0).toFixed(0)},{(selectedItemForModal.backCustomization.position.y || 0).toFixed(0)}px</span></div>)} {selectedItemForModal.priceBreakdown && Object.keys(selectedItemForModal.priceBreakdown).filter(k => parseFloat(selectedItemForModal.priceBreakdown[k]) !== 0 && k !== 'baseGSM' && k!== 'totalUnit').length > 0 && (<><div style={{gridColumn: '1 / -1', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #aacdd9', color:'#00566F', fontWeight:700, fontSize:'30px'}}>Item Addons (per unit):</div>{Object.entries(selectedItemForModal.priceBreakdown).map(([key, value]) => { if (key === 'baseGSM' || key === 'totalUnit' || parseFloat(value) === 0 || value === "0.00" ) return null; const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Ui','').trim(); return (<React.Fragment key={key}><div style={{gridColumn:'1/1', paddingTop:'3px'}}><span style={{fontSize:'28px', color:'#00495F', textAlign:'right', paddingRight:'10px'}}>{displayKey}:</span></div><div style={{gridColumn:'2/2', paddingTop:'3px'}}><span style={{fontSize:'28px', color:'#1A2B33'}}>₹{parseFloat(value).toFixed(2)}</span></div></React.Fragment>);})}</>)}</div></div></div>)}
    </div>
  );
};
export default FinalCartScreen;