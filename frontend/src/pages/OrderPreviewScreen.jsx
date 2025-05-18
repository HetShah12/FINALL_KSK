// frontend/src/pages/OrderPreviewScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { useCurrentItem } from '../contexts/CurrentItemContext';
import { useCart } from '../contexts/CartContext';
import { calculatePriceDetailsForUI } from '../services/priceService';
import CartIndicator from '../components/common/CartIndicator';

const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 330;
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488;
const DYNAMIC_MIN_CANVA_WIDTH = UI_OUTER_PRINTABLE_PIXEL_WIDTH / 4;
const DYNAMIC_MIN_CANVA_HEIGHT = UI_OUTER_PRINTABLE_PIXEL_HEIGHT / 4;

// Constants from priceService.js, used in processAndAddItemToCart for cart item structure
const BASE_COSTS = {
    "180": 399.00, // Updated
    "240": 499.00  // Updated
};

const frontColorMap = { black: '/tshirtmockups/blacktshirt.png', red: '/tshirtmockups/redfront.png', navy: '/tshirtmockups/navyfront.png', brown: '/tshirtmockups/brownfront.png', cream: '/tshirtmockups/creamfront.png', white: '/tshirtmockups/whitefront.png', };
const backColorMap = {  black: '/tshirtmockups/blackback.png', red: '/tshirtmockups/redback.png', navy: '/tshirtmockups/navyback.png', brown: '/tshirtmockups/brownback.png', cream: '/tshirtmockups/creamback.png', white: '/tshirtmockups/whiteback.png',};


// Helper component to display images, handling blob URLs and fallbacks
const CustomizationImage = ({ customization }) => {
  const [imageUrlToDisplay, setImageUrlToDisplay] = useState(null);
  const [imageError, setImageError] = useState(false);
  const { addBlobUrlToItem } = useCurrentItem(); // Get from context
  const localCreatedBlobUrlRef = useRef(null); 

  useEffect(() => {
    let newSrc = customization?.src || null;
    let isNewCollectionBlob = false; // Flag if WE create a new blob URL in this effect run

    // Clear previous local blob if the source fundamentally changes (e.g. different customization object)
    // This specific revoke here can be tricky and often safer to let the context manage ALL revokes when item is fully done.
    // If customization.src is ALREADY the localCreatedBlobUrlRef.current, don't revoke it yet.
    if (localCreatedBlobUrlRef.current && newSrc !== localCreatedBlobUrlRef.current) {
        // URL.revokeObjectURL(localCreatedBlobUrlRef.current); // Potentially too aggressive. Context is better.
        localCreatedBlobUrlRef.current = null;
    }
    
    setImageError(false); // Reset error status on customization change

    if (newSrc && typeof newSrc === 'string') { // Check if newSrc is a string
        if (newSrc.startsWith('blob:')) {
            // console.log("CustomizationImage: Using existing blob URL:", newSrc);
            setImageUrlToDisplay(newSrc);
        } else { // Server URL or other non-blob URL
            // console.log("CustomizationImage: Using server/direct URL:", newSrc);
            setImageUrlToDisplay(newSrc);
        }
    } else if (customization?._blobDataForUpload instanceof Blob) {
      // console.log("CustomizationImage: No valid src, creating new blob URL from _blobDataForUpload for:", customization?.originalFileName || customization?.name);
      try {
        newSrc = URL.createObjectURL(customization._blobDataForUpload);
        setImageUrlToDisplay(newSrc);
        localCreatedBlobUrlRef.current = newSrc; 
        if (addBlobUrlToItem && typeof addBlobUrlToItem === 'function') {
             addBlobUrlToItem(newSrc); 
        }
        isNewCollectionBlob = true; // Mark that this instance created the blob URL
      } catch (e) {
        console.error("CustomizationImage: Error creating blob URL from _blobDataForUpload:", e);
        setImageError(true);
        newSrc = null; // Ensure newSrc is null if creation fails
      }
    } else {
        // console.log("CustomizationImage: No src and no _blobDataForUpload for:", customization?.originalFileName || customization?.name);
        setImageUrlToDisplay(null); // No valid source
    }

    return () => {
        // If this specific effect instance created a blob URL from _blobDataForUpload,
        // it was added to the context's tracking. The context should handle revocation
        // when the item is cleared or processed for cart (where it might be converted to base64).
        // Avoid revoking here to prevent issues if other components might still need the URL.
        // if (isNewCollectionBlob && newSrc && newSrc.startsWith('blob:')) {
            // URL.revokeObjectURL(newSrc); // This might be too early if used by other parts during this render cycle.
        // }
    };
  }, [customization, addBlobUrlToItem]);


  const handleError = () => {
    // console.error("CustomizationImage: Initial src FAILED TO LOAD:", imageUrlToDisplay, "Customization details:", customization);
    
    // Check if we have _blobDataForUpload AND we haven't already tried to use/create a URL from it
    // which is now stored in localCreatedBlobUrlRef.current (and likely in imageUrlToDisplay).
    // If imageUrlToDisplay *is* localCreatedBlobUrlRef.current, it means the blob created from data also failed.
    if (customization?._blobDataForUpload instanceof Blob && imageUrlToDisplay !== localCreatedBlobUrlRef.current) {
      // console.log("CustomizationImage: onError, attempting to recreate blob URL from _blobDataForUpload as fallback.");
      try {
        const fallbackBlobUrl = URL.createObjectURL(customization._blobDataForUpload);
        // Revoke previous instance's local blob if different.
        if(localCreatedBlobUrlRef.current && localCreatedBlobUrlRef.current !== fallbackBlobUrl) {
            // URL.revokeObjectURL(localCreatedBlobUrlRef.current); // Context manages this better.
        }
        localCreatedBlobUrlRef.current = fallbackBlobUrl;
        
        if(addBlobUrlToItem && typeof addBlobUrlToItem === 'function') addBlobUrlToItem(fallbackBlobUrl);
        setImageUrlToDisplay(fallbackBlobUrl); 
        setImageError(false); // We've tried a fallback, reset error
        return; // Exit, new URL will trigger re-render.
      } catch (e) {
        console.error("CustomizationImage: onError, FAILED to create fallback blob URL.", e);
      }
    }
    // If all else fails, set error true
    setImageError(true); 
  };

  if (imageError || !imageUrlToDisplay) {
    // console.warn(`CustomizationImage: Rendering placeholder or error for customization:`, customization);
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e74c3c', fontSize: '12px', padding: '5px', boxSizing:'border-box', background: '#fceded', border: '1px dashed #e74c3c' }}>Image Error</div>;
  }

  return (
    <img 
      src={imageUrlToDisplay} 
      alt={customization?.name || customization?.originalFileName || customization?.type || 'Custom Design'} 
      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
      draggable={false}
      onError={handleError}
    />
  );
};


const OrderPreviewScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentItem, 
    updateCurrentItem, 
    clearCurrentItemForNewProduct, 
    DEFAULT_CUSTOMIZATION_POSITION, 
    revokeItemBlobUrls,
    setCustomization,
    // addBlobUrlToItem // This is used by CustomizationImage, not directly here
  } = useCurrentItem();
  const { addItemToCart } = useCart();

  // console.log("OrderPreviewScreen RENDER/UPDATE. currentItem:", currentItem ? JSON.parse(JSON.stringify(currentItem)) : "null");


  const [isFrontView, setIsFrontView] = useState(true);
  const [uiTotalPrice, setUiTotalPrice] = useState(0);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  const [showAnimationModal, setShowAnimationModal] = useState(false);
  
  const outerPrintableAreaRef = useRef(null);
  const activeCust = isFrontView ? currentItem?.frontCustomization : currentItem?.backCustomization;
  
  const [rndPosition, setRndPosition] = useState(DEFAULT_CUSTOMIZATION_POSITION);
  const [rndSize, setRndSize] = useState(DEFAULT_CUSTOMIZATION_POSITION);

  useEffect(() => {
    const custToSync = isFrontView ? currentItem?.frontCustomization : currentItem?.backCustomization;
    const posToUse = custToSync?.position || DEFAULT_CUSTOMIZATION_POSITION;
    const defaultSizeForRnd = DEFAULT_CUSTOMIZATION_POSITION;
    // console.log(`OrderPreviewScreen RND Sync (View: ${isFrontView ? 'Front' : 'Back'}): Cust to sync:`, custToSync, "Pos to use:", posToUse);
    setRndPosition({ x: posToUse.x, y: posToUse.y });
    setRndSize({ 
        width: posToUse.width || defaultSizeForRnd.width, 
        height: posToUse.height || defaultSizeForRnd.height 
    });
  }, [isFrontView, currentItem, DEFAULT_CUSTOMIZATION_POSITION]);

  const handleInteractionEnd = (newPositionAndSize) => { 
    const currentActiveCustForSave = isFrontView ? currentItem?.frontCustomization : currentItem?.backCustomization;
    if (currentActiveCustForSave) {
      const { x, y, width, height } = newPositionAndSize;
      const currentPosInContext = currentActiveCustForSave.position || {};
      if (Math.abs(currentPosInContext.x - x) > 0.1 ||
          Math.abs(currentPosInContext.y - y) > 0.1 ||
          Math.abs(currentPosInContext.width - width) > 0.1 ||
          Math.abs(currentPosInContext.height - height) > 0.1 ||
          !currentActiveCustForSave.position ) {
          const updatedCustomization = { ...currentActiveCustForSave, position: {x, y, width, height} };
          setCustomization(isFrontView ? 'front' : 'back', updatedCustomization);
        }
    }
  };

  useEffect(() => {
    // console.log("OrderPreviewScreen: Pricing useEffect TRIGGERED for item:", currentItem);
    if ( currentItem && currentItem.size && currentItem.thickness ) {
        // console.log("OrderPreviewScreen (Pricing useEffect): CONDITIONS MET for calculation.");
        const priceDetailsResult = calculatePriceDetailsForUI(currentItem);
        // console.log("OrderPreviewScreen (Pricing useEffect): Price RESULT:", priceDetailsResult);
        const newTotalUnitPrice = (priceDetailsResult.totalUnitPrice || 0);
        const newGrandTotalForQuantity = newTotalUnitPrice * (currentItem.quantity || 1);
        setUiTotalPrice(newGrandTotalForQuantity);
        if (currentItem.calculatedUnitPrice !== newTotalUnitPrice || JSON.stringify(currentItem.priceBreakdown) !== JSON.stringify(priceDetailsResult.priceBreakdownForDisplay)) {
            updateCurrentItem({ calculatedUnitPrice: newTotalUnitPrice, priceBreakdown: priceDetailsResult.priceBreakdownForDisplay });
        }
        if (priceDetailsResult.errors && priceDetailsResult.errors.length > 0) {
            console.warn("OrderPreviewScreen: Price Calculation Errors:", priceDetailsResult.errors.join("; "));
        }
    } else {
        setUiTotalPrice(0);
        // console.warn("OrderPreviewScreen (Pricing useEffect): CONDITIONS NOT MET (item, size, or thickness missing). Item:", currentItem);
        if(currentItem && (currentItem.calculatedUnitPrice !== 0 || Object.keys(currentItem.priceBreakdown || {}).length > 0)){
             updateCurrentItem({ calculatedUnitPrice: 0, priceBreakdown: {} });
        }
    }
  }, [currentItem, updateCurrentItem]);
  
  const handleQuantityChange = (amount) => { 
    const newQuantity = Math.max(1, (currentItem.quantity || 1) + amount);
    updateCurrentItem({ quantity: newQuantity });
  };

  const formatCustTextForDisplay = (cust) => { 
    if (!cust) return 'None';
    if (cust.type === 'ai_text_image') return `AI: ${cust.prompt ? cust.prompt.substring(0, 20) + '...' : 'Image'}${cust.removedBackground ? ' (BG Removed)' : ''}`;
    if (cust.type === 'uploaded_image') return `Uploaded: ${cust.originalFileName || cust.src?.substring(cust.src.lastIndexOf('/') + 1).split('?')[0]?.substring(0,20) || 'Image'}`;
    if (cust.type === 'multi_library_design' && cust.elements && cust.elements.length > 0) {
        return `Multi-Lib: ${cust.elements.length} designs`;
    } else if (cust.type === 'library_design') { 
        return `Library: ${cust.name || 'Design'}`;
    }
    if (cust.type === 'embroidery_text') {
        const fontFamily = cust.font?.split(',')[0].replace(/'/g, '').replace(' Custom', '') || 'Default';
        return `Embroidery: "${cust.text}" (${fontFamily})`;
    }
    if (cust.type === 'embroidery_design') return `Emb. Design: ${cust.name || 'Design'}`;
    if (cust.type === 'ai_draw_image') return `AI Drawn: ${cust.prompt ? cust.prompt.substring(0,20)+'...' : 'Image'}`;
    return cust.type ? cust.type.replace(/_/g, ' ') : 'Custom Design';
  };

  const tshirtSrc = isFrontView
    ? frontColorMap[currentItem?.color?.toLowerCase() || 'black'] || frontColorMap.black
    : backColorMap[currentItem?.color?.toLowerCase() || 'black'] || backColorMap.black;

  const handleFlip = () => { 
    const currentActiveCustBeforeFlip = isFrontView ? currentItem?.frontCustomization : currentItem?.backCustomization;
    if (currentActiveCustBeforeFlip) {
      handleInteractionEnd({ x: rndPosition.x, y: rndPosition.y, width: rndSize.width, height: rndSize.height});
    }
    setIsFrontView(prev => !prev);
  };
  
  const processAndAddItemToCart = async () => { 
    if (!currentItem || !currentItem.size || !currentItem.thickness) {
        alert("Please ensure all t-shirt options are selected before adding to cart."); return null;
      }
      if (typeof currentItem.calculatedUnitPrice !== 'number') {
          console.error("OrderPreviewScreen: calculatedUnitPrice is missing. Cart item price will be inaccurate.");
          alert("Error: Price not finalized. Cannot add to cart."); return null; 
      }
      const itemForCart = JSON.parse(JSON.stringify(currentItem));
      itemForCart.productVariant = {
        productType: itemForCart.productType || 'T-Shirt', size: itemForCart.size,
        thickness: itemForCart.thickness, thicknessName: itemForCart.thicknessName,
        color: itemForCart.color || 'black',
        basePrice: BASE_COSTS[String(itemForCart.thickness)], // Make sure BASE_COSTS keys are strings if thickness is number
        id: String(itemForCart.thickness) === '180' ? (itemForCart.size === 'M' ? 1 : 2) : 3
      };
      itemForCart.calculatedUnitPrice = currentItem.calculatedUnitPrice;
      itemForCart.priceBreakdown = currentItem.priceBreakdown;
      const convertIfNeeded = async (customization) => {
          if (!customization) return null;
          const customizationCopy = { ...customization };
          if (customizationCopy.type === 'multi_library_design' && Array.isArray(customizationCopy.elements)) {
            customizationCopy.elements = await Promise.all(
              customizationCopy.elements.map(async (el) => {
                const elCopy = { ...el };
                if (elCopy.src && elCopy.src.startsWith('blob:')) {
                  if (elCopy._blobDataForUpload instanceof Blob) {
                    const reader = new FileReader();
                    elCopy.src = await new Promise((resolve) => { reader.onloadend = () => resolve(reader.result); reader.readAsDataURL(elCopy._blobDataForUpload); });
                  } delete elCopy._blobDataForUpload;
                } return elCopy;
              })
            );
          } else if (customizationCopy.src && customizationCopy.src.startsWith('blob:')) {
            if (customizationCopy._blobDataForUpload instanceof Blob) {
              const reader = new FileReader();
              customizationCopy.src = await new Promise((resolve) => { reader.onloadend = () => resolve(reader.result); reader.readAsDataURL(customizationCopy._blobDataForUpload);});
            } delete customizationCopy._blobDataForUpload;
          } return customizationCopy;
        };
      itemForCart.frontCustomization = await convertIfNeeded(itemForCart.frontCustomization);
      itemForCart.backCustomization = await convertIfNeeded(itemForCart.backCustomization);
      try { const addedItem = await addItemToCart(itemForCart); return addedItem; } 
      catch (error) { console.error('Add to cart error:', error); alert(`Failed to add to cart: ${error.message}`); return null; }
  };
  const handleAddToCartAndDesignNew = async () => { /* ... same: save RND state, processAndAddItemToCart, clear, navigate ... */ };
  const handleProceedToCheckout = async () => { 
    const currentActiveCustForSave = isFrontView ? currentItem?.frontCustomization : currentItem?.backCustomization;
    if (currentActiveCustForSave && rndPosition && rndSize) { // Save RND for current view
        handleInteractionEnd({ x: rndPosition.x, y: rndPosition.y, width: rndSize.width, height: rndSize.height});
    }
    await new Promise(resolve => setTimeout(resolve, 50)); // Allow state to settle
    const added = await processAndAddItemToCart();
    if (added) { 
        console.log("OrderPreviewScreen: Item added to cart successfully for checkout. Navigating to /delivery-options.");
        navigate('/delivery-options'); 
    } else {
        console.warn("OrderPreviewScreen: Item NOT added to cart (processAndAddItemToCart returned falsy). Cannot proceed to checkout.");
    }
  };const handleStartOverConfirmed = () => {
    console.log("OrderPreviewScreen: Start Over Confirmed by user.");
    if (typeof clearCurrentItemForNewProduct === 'function') {
        try {
            clearCurrentItemForNewProduct(); 
            console.log("OrderPreviewScreen: currentItem cleared by context via clearCurrentItemForNewProduct.");
        } catch (e) {
            console.error("OrderPreviewScreen: Error calling clearCurrentItemForNewProduct from context:", e);
        }
    } else {
        console.error("OrderPreviewScreen: clearCurrentItemForNewProduct function not found in context!");
    }
    navigate('/categories', { state: { fromStartOver: true } });
    setShowStartOverModal(false);
  };
  // --- Styles ---
  const pageTitleStyle = { position:'absolute', left:'50%', transform:'translateX(-50%)', top: '98px', color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400, whiteSpace:'nowrap', textAlign: 'center' };
  const backArrowStyle = { width: '120px', height: '120px', left: '127px', top: '94px', position: 'absolute', cursor: 'pointer'};
  const productSummaryContainerStyle = { width: 'calc(100% - 256px)', maxWidth: '1954px', height: 'auto', left: '50%', transform: 'translateX(-50%)', top: '260px', position: 'absolute',  background: '#ECF5FF', borderRadius: '12px', padding: '30px', boxSizing: 'border-box', display: 'flex', gap: '30px'};
  const tshirtPreviewAreaStyle = { width: '750px', height: '700px', background: '#F0F8FF', borderRadius: '12px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #ccc', padding:'15px', boxSizing:'border-box'};
  const mockupSectionPreviewStyle = { position: 'relative', width: '100%', height: '100%' };
  const tshirtPreviewImageStyle = { width: '100%', height: '100%', objectFit: 'contain', position:'absolute', top:0, left:0, zIndex:0};
  const outerPrintableAreaDynamicStyle = { display: (activeCust && (activeCust.text || activeCust.src || (activeCust.type === 'multi_library_design' && activeCust.elements?.length > 0))) ? 'block' : 'none', position: 'absolute', width: `${UI_OUTER_PRINTABLE_PIXEL_WIDTH}px`, height: `${UI_OUTER_PRINTABLE_PIXEL_HEIGHT}px`, border: '2px dashed rgba(0, 86, 111, 0.6)',  top: '50%', left: '50%', transform: 'translate(-50%, -50%)', boxSizing: 'border-box', zIndex: 1,};
  const rndStyle = { border: '1px solid rgba(0, 86, 111, 0.5)', backgroundColor: 'rgba(0, 86, 111, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box',};
  const designTextStyle = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', wordBreak: 'break-word', color: activeCust?.type === 'embroidery_text' ? activeCust?.color : (activeCust?.textColor || 'black'), pointerEvents: 'none', boxSizing: 'border-box', padding: '2px', fontFamily: activeCust?.font || 'Inter, sans-serif', fontSize: activeCust?.type === 'embroidery_text' ? `${Math.max(8, Math.min(rndSize.height * 0.6, 28, (rndSize.height / 2.5 )))}px` : '16px',};
  const flipPreviewBtnStyle = { position:'absolute', top:'20px', right:'20px', padding:'12px 18px', backgroundColor:'#00566F', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', zIndex:20, fontSize:'20px' };
  const detailsSectionStyle = { flexGrow:1, display:'flex', flexDirection:'column', justifyContent:'space-around', fontFamily: 'Inter, sans-serif', fontSize:'36px', paddingLeft: '20px', paddingRight: '20px'};
  const detailLineStyle = { marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const detailLabelStyle = { color: '#333', fontWeight: 500, marginRight:'10px', whiteSpace: 'nowrap' };
  const detailValueStyle = { color: '#00566F', fontWeight: 700, textAlign: 'right', flexGrow:1, wordBreak: 'break-word' };
  const totalLineStyle = { ...detailLineStyle, marginTop: '25px', paddingTop:'25px', borderTop: '2px solid #00566F'};
  const totalLabelStyle = { ...detailLabelStyle, fontSize:'48px', fontWeight: 600 };
  const totalValueStyle = { ...detailLabelStyle, fontSize:'52px', fontWeight: 800 };
  const quantityControlsStyle = { marginTop:'25px', display:'flex', alignItems:'center' };
  const quantityContainerPreviewStyle = { width: '250px', height: '60px', display: 'flex', backgroundColor: '#F4FAFF', borderRadius: '8px', fontFamily: 'Inter', color: '#00566F', border: '1px solid #00566F'};
  const quantityBtnSpanStyle = { width: '33.33%', textAlign: 'center', fontSize: '36px', fontWeight: 600, cursor:'pointer', lineHeight:'58px', userSelect: 'none' };
  const quantityNumSpanStyle = { ...quantityBtnSpanStyle, borderRight: '1px solid #5D94A6', borderLeft: '1px solid #5D94A6', pointerEvents: 'none', cursor:'default' };
  const bottomNavButtonsStyle = { position: 'absolute', bottom: '40px', width: 'calc(100% - 256px)', left:'128px', display: 'flex', justifyContent: 'space-between' };
  const actionButtonStyle = { height: '143px', borderRadius: '16px', fontSize: '40px', fontFamily: 'Inter', fontWeight: 600, border: 'none', cursor:'pointer', padding:'0 30px'};
  const addMoreBtnStyle = { ...actionButtonStyle, width: 'auto', backgroundColor: '#F4FAFF', color: '#00566F', padding: '0 50px' };
  const nextFromPreviewBtnStyle = { ...actionButtonStyle, width: 'auto', backgroundColor: '#00566F', color: 'white', padding: '0 50px', height:'123px' };
  const modalOverlayStyle = { display: 'none', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1002, justifyContent: 'center', alignItems: 'center'};
  const confirmationModalContentStyle = { width: '1406px', minHeight: '400px', background: 'white', boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', boxSizing: 'border-box'};
  const modalMessageLargeStyle = { width: '90%', textAlign: 'center', color: 'black', fontSize: '48px', fontFamily: 'Inter', fontWeight: 700, marginBottom: '30px'};
  const modalMessageSmallStyle = { width: '90%', textAlign: 'center', color: 'black', fontSize: '40px', fontFamily: 'Inter', fontWeight: 500, marginBottom: '60px'};
  const modalButtonsContainerStyle = { display: 'flex', justifyContent: 'space-around', width: '80%', gap: '30px'};
  const modalActionButtonStyle = { width: '400px', height: '113px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontFamily: 'Inter', fontWeight: 500};
  const animationModalStyle = {...modalOverlayStyle, background: 'rgba(0,0,0,0.3)', zIndex: 1000 };
  const animationModalContentInnerStyle = { width: '1000px', height: '500px', background: 'white', borderRadius: '10px', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(0,0,0,0.2)'};
  const blackBoxStyle = { width: '550px', height: '120px', background: '#00566F', borderRadius: '20px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom:'30px'};
  const cartAnimateStyle = { width: '80px', height: '80px', position: 'absolute', left: '-100px', opacity: 0, transition: 'all 0.8s ease'};
  const productAnimateStyle = { width: '41px', height: '41px', position: 'absolute', top: '-50px', opacity: 0, transition: 'all 0.8s ease', zIndex: 1};
  const textMsgStyle = { color: '#00566F', fontSize: '48px', fontFamily: 'Inter', fontWeight: 700, display: 'none'};


  if (!currentItem || !currentItem.id ) { /* ... same initial error/loading check ... */ }

  const hasActiveVisualContent = activeCust && (activeCust.text || activeCust.src || (activeCust.type === 'multi_library_design' && activeCust.elements?.length > 0));

  return (
    <>
      <CartIndicator />
      <img style={backArrowStyle} src="/Features_Display_Img/back arrow.png" alt="Back" onClick={() => setShowStartOverModal(true)} />
      <div style={pageTitleStyle}>Order Preview</div>

      {showStartOverModal && ( /* ...Modal JSX... */ <div style={{...modalOverlayStyle, display: 'flex' }}><div style={confirmationModalContentStyle}><div style={modalMessageLargeStyle}>You've made some cool changes!</div><div style={modalMessageSmallStyle}>Going back will clear current T-shirt configurations. Still want to discard and browse other products?</div><div style={modalButtonsContainerStyle}><button style={{...modalActionButtonStyle, background: 'rgba(217, 217, 217, 0.1)', border: '2px black solid', color: 'black'}} onClick={handleStartOverConfirmed}>Start Over</button><button style={{...modalActionButtonStyle, background: '#00566F', border: '1px #00566F solid', color: 'white'}} onClick={() => setShowStartOverModal(false)}>Cancel</button></div></div></div>)}

      <div style={productSummaryContainerStyle}>
        <div style={tshirtPreviewAreaStyle}>
          <div style={mockupSectionPreviewStyle}>
            <img id="tshirtPreviewImage" src={tshirtSrc} alt="T-Shirt Preview" style={tshirtPreviewImageStyle} 
              onError={(e) => { e.target.src = isFrontView ? frontColorMap.black : backColorMap.black; }}/>
            
            {hasActiveVisualContent && (
              <div ref={outerPrintableAreaRef} style={outerPrintableAreaDynamicStyle}>
                <Rnd
                  style={rndStyle}
                  size={{ width: rndSize.width, height: rndSize.height }}
                  position={{ x: rndPosition.x, y: rndPosition.y }}
                  minWidth={DYNAMIC_MIN_CANVA_WIDTH} minHeight={DYNAMIC_MIN_CANVA_HEIGHT}
                  bounds="parent"
                  onDragStop={(e, d) => { setRndPosition({ x: d.x, y: d.y }); handleInteractionEnd({ x: d.x, y: d.y, width: rndSize.width, height: rndSize.height }); }}
                  onResizeStop={(e, dir, ref, delta, pos) => { const newW = parseFloat(ref.style.width), newH = parseFloat(ref.style.height); setRndSize({ width: newW, height: newH }); setRndPosition({x: pos.x, y: pos.y }); handleInteractionEnd({ x: pos.x, y: pos.y, width: newW, height: newH });}}
                  enableResizing={{top:false,right:false,bottom:false,left:false,topRight:false,bottomRight:true,bottomLeft:false,topLeft:false}}
                  resizeHandleComponent={{ bottomRight: <div style={{width:'30px',height:'30px',background:'rgba(0,86,111,0.7)',borderRadius:'50%',border:'2px solid white',cursor:'nwse-resize',position:'absolute',right:'-15px',bottom:'-15px'}}/> }}
                  disableDragging={false}
                >
                  {activeCust.type === 'embroidery_text' && activeCust.text && (
                    <div style={designTextStyle}>{activeCust.text}</div>
                  )}

                  {activeCust.src && 
                   (activeCust.type === 'embroidery_design' || 
                    activeCust.type === 'uploaded_image' || 
                    activeCust.type === 'ai_text_image' ||
                    activeCust.type === 'ai_draw_image' ||
                    (activeCust.type === 'library_design' && !activeCust.elements) 
                   ) && (
                    // Use the CustomizationImage component for all src-based single images
                    <CustomizationImage customization={activeCust} />
                  )}
                  
                  {activeCust.type === 'multi_library_design' && Array.isArray(activeCust.elements) && activeCust.elements.length > 0 && (
                    <div style={{position: 'relative', width: '100%', height: '100%', pointerEvents: 'none'}}>
                        {activeCust.elements.map((el, index) => (
                           el.src ? (
                            <div key={el.designId || index}
                                style={{ position: 'absolute', 
                                         left: `${(el.position.x / UI_OUTER_PRINTABLE_PIXEL_WIDTH) * 100}%`, 
                                         top: `${(el.position.y / UI_OUTER_PRINTABLE_PIXEL_HEIGHT) * 100}%`, 
                                         width: `${(el.position.width / UI_OUTER_PRINTABLE_PIXEL_WIDTH) * 100}%`, 
                                         height: `${(el.position.height / UI_OUTER_PRINTABLE_PIXEL_HEIGHT) * 100}%` }}>
                                <CustomizationImage customization={el} /> 
                            </div>
                           ) : null
                        ))}
                    </div>
                  )}
                </Rnd>
              </div>
            )}
          </div>
          <button style={flipPreviewBtnStyle} onClick={handleFlip}>{isFrontView ? "View Back" : "View Front"}</button>
        </div>
        <div style={detailsSectionStyle}>
            <div style={detailLineStyle}><span style={detailLabelStyle}>Product:</span><span style={detailValueStyle}>{currentItem.productType || 'T-Shirt'}</span></div>
            <div style={detailLineStyle}><span style={detailLabelStyle}>Color:</span><span style={detailValueStyle}>{currentItem.color ? currentItem.color.charAt(0).toUpperCase() + currentItem.color.slice(1) : 'N/A'}</span></div>
            <div style={detailLineStyle}><span style={detailLabelStyle}>Size:</span><span style={detailValueStyle}>{currentItem.size || 'N/A'}</span></div>
            <div style={detailLineStyle}><span style={detailLabelStyle}>Thickness:</span><span style={detailValueStyle}>{currentItem.thicknessName || `${currentItem.thickness || ''} GSM`}</span></div>
            <div style={detailLineStyle}><span style={detailLabelStyle}>Front:</span><span style={detailValueStyle}>{formatCustTextForDisplay(currentItem.frontCustomization)}</span></div>
            <div style={detailLineStyle}><span style={detailLabelStyle}>Back:</span><span style={detailValueStyle}>{formatCustTextForDisplay(currentItem.backCustomization)}</span></div>
            <div style={quantityControlsStyle}>
                <span style={{...detailLabelStyle, marginRight:'20px', fontSize:'36px'}}>Quantity:</span>
                <div style={quantityContainerPreviewStyle}>
                    <span style={quantityBtnSpanStyle} onClick={() => handleQuantityChange(-1)}>-</span>
                    <span style={quantityNumSpanStyle}>{(currentItem.quantity || 1).toString().padStart(2, '0')}</span>
                    <span style={{...quantityBtnSpanStyle, borderRight: 'none'}} onClick={() => handleQuantityChange(1)}>+</span>
                </div>
            </div>
            <div style={totalLineStyle}>
                <span style={totalLabelStyle}>TOTAL:</span>
                <span style={totalValueStyle}>₹{uiTotalPrice.toFixed(2)}</span>
            </div>
        </div>
      </div>
      <div style={bottomNavButtonsStyle}>
        <button style={addMoreBtnStyle} onClick={handleAddToCartAndDesignNew}>Add to Cart & Design New</button>
        <button style={nextFromPreviewBtnStyle} onClick={handleProceedToCheckout}>Proceed to Checkout</button>
      </div>
      {showAnimationModal && ( /* ...Animation Modal... */ <div style={{...animationModalStyle, display: 'flex' }}><div style={animationModalContentInnerStyle}><div style={blackBoxStyle}><img src="/Home_Screen_Img/animatecart.png" alt="cart" style={{...cartAnimateStyle, opacity: 1, left: 'calc(50% - 40px)'}} /></div><div style={{...textMsgStyle, display: 'block'}}>Item Added to Cart!</div></div></div>)}
    </>
  );
};

export default OrderPreviewScreen;