// frontend/src/pages/FeatureDisplayScreen.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentItem } from '../contexts/CurrentItemContext';
// import CartIndicator from '../components/common/CartIndicator';

const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 330;
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488;

// IMPORTANT: Verify these paths and add all supported colors
const frontColorMap = {
  black: '/tshirtmockups/blacktshirt.png', // Ensure this is a FRONT view
  red: '/tshirtmockups/redfront.png',
  navy: '/tshirtmockups/bluefront.png', // Use a specific navy front
  brown: '/tshirtmockups/brownfront.png',
  cream: '/tshirtmockups/creamfront.png',
  white: '/tshirtmockups/whitefront.png',
};
const backColorMap = {
  black: '/tshirtmockups/blackback.png',
  red: '/tshirtmockups/backred.png',     // e.g., redback.png
  navy: '/tshirtmockups/backblue.png',    // e.g., navyback.png
  brown: '/tshirtmockups/backbrown.png',  // e.g., brownback.png
  cream: '/tshirtmockups/backcream.png',  // e.g., creamback.png
  white: '/tshirtmockups/backwhite.png',  // e.g., whiteback.png
};

const colors = [
    { name: 'black', code: '#1e1e1e', borderStyle: 'none' },
    { name: 'red', code: '#8b0000', borderStyle: 'none' },
    { name: 'navy', code: '#002244', borderStyle: 'none' },
    { name: 'brown', code: '#7A4824', borderStyle: 'none' },
    { name: 'cream', code: '#fdf1dc', borderStyle: 'none' },
    { name: 'white', code: '#ffffff', borderStyle: '1px solid #ccc' },
];

const featuresData = [
    { name: 'AI Text to Image', icon: '/Features_Display_Img/aiicon.png', price: 50, path: '/ai-text-to-image', top: '421px', left: '993px', titleLeft: '130px' },
    { name: 'AI Draw to Image', icon: '/Features_Display_Img/drawimgai.png', price: 50, path: '/ai-draw-to-image', top: '421px', left: '1590px', titleLeft: '132px', iconStyle: { height: '62px'} },
    { name: 'Upload Image', icon: '/Features_Display_Img/galleryicon.png', price: 50, path: '/upload-image', top: '625px', left: '993px', titleLeft: '132px' },
    { name: 'Design Library', icon: '/Features_Display_Img/designlibrary.png', price: 20, path: '/design-library', top: '625px', left: '1590px', titleLeft: '132px', iconStyle: {width: '77px', height: '77px'} },
    { name: 'Embroidery', icon: '/Features_Display_Img/embroideryicon.png', price: null, path: '/embroidery', top: '860px', left: '1340px', titleLeft: '132px', titleTop: '60px', iconStyle: {width: '85px', height: '85px'}, id: 'embroidery-card' },
];

const FeatureDisplayScreen = () => {
  const navigate = useNavigate();
  const { currentItem, updateCurrentItem, DEFAULT_CUSTOMIZATION_POSITION } = useCurrentItem();

  const [isFrontView, setIsFrontView] = useState(true);
  const [activeFeatureCard, setActiveFeatureCard] = useState(null);

  useEffect(() => {
    if (!currentItem || !currentItem.id) {
        updateCurrentItem({ color: 'black' }); // Ensure default color if item is brand new
    } else if (!currentItem.color) {
         updateCurrentItem({ color: 'black' });
    }

    if (!currentItem || !currentItem.size || !currentItem.thicknessName) {
        console.warn("FeatureDisplayScreen: Size or Thickness missing. CurrentItem:", currentItem);
        // alert("Important: T-shirt size or thickness is not selected. Please go back to 'Size Selection'."); // Consider if this alert is too disruptive
        navigate('/size-selection'); // Redirect if essential product info is missing
    }
  }, [currentItem, updateCurrentItem, navigate]);

  const handleColorSelection = (colorName) => {
    updateCurrentItem({ color: colorName });
  };

  const handleFlip = () => {
    setIsFrontView(prev => !prev);
  };

  const handleNavigateToFeature = (path, featureName) => {
    setActiveFeatureCard(featureName);
    setTimeout(() => {
        // Pass current view (front/back) to the feature screen
        navigate(`${path}?view=${isFrontView ? 'front' : 'back'}`);
        setActiveFeatureCard(null);
    }, 150);
  };

  // activeCustomization now correctly reflects front or back based on isFrontView
  const activeCustomization = isFrontView ? currentItem?.frontCustomization : currentItem?.backCustomization;
  
  // tshirtSrc now uses backColorMap when isFrontView is false
  const tshirtSrc = isFrontView
    ? frontColorMap[currentItem?.color?.toLowerCase() || 'black'] || frontColorMap.black
    : backColorMap[currentItem?.color?.toLowerCase() || 'black'] || backColorMap.black;

  // Determine if there is any visual content for the active view
  const hasActiveVisualContent = activeCustomization && 
                               (activeCustomization.text || 
                                activeCustomization.src || 
                                (activeCustomization.type === 'multi_library_design' && activeCustomization.elements?.length > 0));

  // --- Styles ---
  const pageTitleStyle = { width: 'auto', height: '127px', left: '50%', transform: 'translateX(-50%)', top: '91px', position: 'absolute', color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400, whiteSpace: 'nowrap' };
  const backArrowStyle = { width: '120px', height: '120px', left: '127px', top: '94px', position: 'absolute', cursor:'pointer' };
  const leftPanelStyle = { width: '792px', height: '975px', left: '113px', top: '285px', position: 'absolute', background: '#F4F9FF', borderRadius: '12px' };
  const colorBarBackgroundStyle = { width: '100%', height: '134px', left: '0', top: '841px', position: 'absolute', background: 'rgba(0, 86, 111, 0.08)', boxShadow: '0px -1px 4px rgba(0, 0, 0, 0.13)' };
  const mockupSectionStyle = { position: 'absolute', width: '689px', height: '691px', left: '52px', top: '98px' };
  const tshirtImageStyle = { width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top:0, left:0, zIndex:0 };
  
  const canvaGuideOuterStyle = {
    // This guide is always visible on FeatureDisplayScreen to indicate the printable zone
    display: 'block', 
    width: `${UI_OUTER_PRINTABLE_PIXEL_WIDTH}px`,
    height: `${UI_OUTER_PRINTABLE_PIXEL_HEIGHT}px`,
    border: '2px dashed rgba(0, 86, 111, 0.5)',
    position: 'absolute', left: '50%', top: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none', opacity: 0.7, zIndex: 1, 
    boxSizing: 'border-box',
  };

  // This container shows the *preview* of the active customization
  const appliedDesignPreviewContainerStyle = {
    position: 'absolute', zIndex: 2, overflow: 'hidden',
    display: hasActiveVisualContent ? 'block' : 'none',
    // Use position from activeCustomization, or default if not set
    left: `${((activeCustomization?.position?.x || DEFAULT_CUSTOMIZATION_POSITION.x) / UI_OUTER_PRINTABLE_PIXEL_WIDTH) * 100}%`,
    top: `${((activeCustomization?.position?.y || DEFAULT_CUSTOMIZATION_POSITION.y) / UI_OUTER_PRINTABLE_PIXEL_HEIGHT) * 100}%`,
    width: `${((activeCustomization?.position?.width || DEFAULT_CUSTOMIZATION_POSITION.width) / UI_OUTER_PRINTABLE_PIXEL_WIDTH) * 100}%`,
    height: `${((activeCustomization?.position?.height || DEFAULT_CUSTOMIZATION_POSITION.height) / UI_OUTER_PRINTABLE_PIXEL_HEIGHT) * 100}%`,
    // These percentages are relative to canvaGuideOuterStyle
    // The container itself should be inside canvaGuideOuterStyle conceptually for correct relative positioning,
    // or its parent needs to be the reference for these %s. For simplicity, assuming it's positioned absolutely within mockupSectionStyle for now,
    // and calculations are to place it within the visual guide.
  };
  
  const appliedDesignContentStyle = { 
    width: '100%', height: '100%', objectFit: 'contain', display: 'flex',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    wordBreak: 'break-word'
  };

  // Styles for color selection and flip icon
  const colorOptionsStyle = { left: '142px', top: '879px', position: 'absolute', display: 'flex', gap: '30px' };
  const colorDotBaseStyle = { width: '59px', height: '59px', borderRadius: '50%', cursor: 'pointer', border: '2px solid transparent', transition: 'border 0.2s, box-shadow 0.2s' };
  const flipIconStyle = { width: '100px', height: '100px', left: '632px', top: '33px', position: 'absolute', cursor: 'pointer' };
  // Feature card styles
  const featureCardBaseStyle = { position: 'absolute', width: '564px', height: '170px' };
  const featureCardBgBaseStyle = { width: '544px', height: '160px', top: '10px', left: '0px', position: 'absolute', background: '#F4FAFF', borderRadius: '16px', transition: 'box-shadow 0.3s' };
  const featureCardActiveStyle = { boxShadow: '0px 4px 26.5px rgba(0, 86, 111, 0.42)'};
  const featureIconStyle = { position: 'absolute', left: '43px', top: '50px', width: '60px', height: '60px', objectFit: 'contain' };
  const featureTitleStyle = { position: 'absolute', top: '59px', color: '#00566F', fontSize: '36px', fontFamily: 'Inter, sans-serif', fontWeight: 700 };
  const featurePriceTagStyle = { minWidth:'97px', padding:'0 10px', height: '44px', backgroundColor: '#FEE6D1', position: 'absolute', borderRadius: '46px', right: '20px', top: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#D57218', fontSize: '20px', fontWeight: 600, fontFamily: 'Inter, sans-serif'};

  return (
    <>
      {/* <CartIndicator /> */}
      <div style={leftPanelStyle}>
        <div style={colorBarBackgroundStyle} />
        <div style={mockupSectionStyle}>
          <img 
            id="tshirt-image" 
            src={tshirtSrc} 
            alt="T-shirt Mockup" 
            style={tshirtImageStyle} 
            onError={(e) => { 
                console.error(`Error loading T-shirt image: ${e.target.src}. Defaulting to black.`); 
                e.target.src = isFrontView ? frontColorMap.black : backColorMap.black; 
            }}
          />
          {/* Outer dashed guide, always shown on this screen relative to the mockup */}
          <div style={canvaGuideOuterStyle}>
            {/* Preview of the active customization for the current view */}
            {hasActiveVisualContent && (
              <div style={{
                position: 'absolute', // Positioned within the canvaGuideOuterStyle
                left: `${((activeCustomization.position?.x || 0) / UI_OUTER_PRINTABLE_PIXEL_WIDTH) * 100}%`,
                top: `${((activeCustomization.position?.y || 0) / UI_OUTER_PRINTABLE_PIXEL_HEIGHT) * 100}%`,
                width: `${((activeCustomization.position?.width || DEFAULT_CUSTOMIZATION_POSITION.width) / UI_OUTER_PRINTABLE_PIXEL_WIDTH) * 100}%`,
                height: `${((activeCustomization.position?.height || DEFAULT_CUSTOMIZATION_POSITION.height) / UI_OUTER_PRINTABLE_PIXEL_HEIGHT) * 100}%`,
                overflow: 'hidden', // Ensure content stays within these bounds
              }}>
                {activeCustomization.type === 'embroidery_text' && activeCustomization.text && (
                  <div style={{
                    ...appliedDesignContentStyle,
                    fontFamily: activeCustomization.font || 'Arial',
                    color: activeCustomization.color || 'black', // Embroidery uses 'color' for thread
                    fontSize: '20px', // Simplified font size for this preview
                  }}>
                    {activeCustomization.text}
                  </div>
                )}
                {activeCustomization.src && 
                 (activeCustomization.type === 'embroidery_design' || 
                  activeCustomization.type === 'uploaded_image' ||
                  activeCustomization.type === 'ai_text_image' ||
                  activeCustomization.type === 'ai_draw_image' ||
                  (activeCustomization.type === 'library_design' && !activeCustomization.elements)) && (
                  <img 
                    src={activeCustomization.src} 
                    alt={activeCustomization.name || activeCustomization.type} 
                    style={appliedDesignContentStyle} />
                )}
                {activeCustomization.type === 'multi_library_design' && activeCustomization.elements?.length > 0 && (
                    <div style={{position: 'relative', width: '100%', height: '100%'}}>
                        {activeCustomization.elements.map((el, index) => (
                            <img
                                key={el.designId || index}
                                src={el.src}
                                alt={el.name || `design-${index}`}
                                style={{
                                    position: 'absolute',
                                    left: `${(el.position.x / (activeCustomization.position?.width || DEFAULT_CUSTOMIZATION_POSITION.width)) * 100}%`, // Relative to parent RND box size
                                    top: `${(el.position.y / (activeCustomization.position?.height || DEFAULT_CUSTOMIZATION_POSITION.height)) * 100}%`,
                                    width: `${(el.position.width / (activeCustomization.position?.width || DEFAULT_CUSTOMIZATION_POSITION.width)) * 100}%`,
                                    height: `${(el.position.height / (activeCustomization.position?.height || DEFAULT_CUSTOMIZATION_POSITION.height)) * 100}%`,
                                    objectFit: 'contain',
                                }}
                            />
                        ))}
                    </div>
                )}
              </div>
            )}
          </div> {/* End canvaGuideOuterStyle */}
        </div> {/* End mockupSectionStyle */}
        
        <div style={colorOptionsStyle}>
          {colors.map(colorInfo => (
            <div
              key={colorInfo.name}
              style={{
                ...colorDotBaseStyle,
                backgroundColor: colorInfo.code,
                border: currentItem?.color === colorInfo.name ? '2px solid #00566F' : colorInfo.borderStyle,
              }}
              onClick={() => handleColorSelection(colorInfo.name)}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0px 4px 10.9px 7px rgba(21,59,90,0.44)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            />
          ))}
        </div>
        <img
          id="flip-icon" style={flipIconStyle} src="/Features_Display_Img/flip.png"
          alt="Flip T-shirt view" onClick={handleFlip}
        />
      </div>

      <Link to="/size-selection">
        <img style={backArrowStyle} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={pageTitleStyle}>Customize your Style</div>

      {featuresData.map(feature => {
        // Embroidery is disabled for back view on this screen
        const isDisabled = feature.id === 'embroidery-card' && !isFrontView;
        const isCardActive = activeFeatureCard === feature.name;
        return (
          <div
            key={feature.name}
            style={{
              ...featureCardBaseStyle,
              left: feature.left,
              top: feature.top,
              cursor: isDisabled ? 'default' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
            }}
            onClick={() => !isDisabled && handleNavigateToFeature(feature.path, feature.name)}
          >
            <div style={{ ...featureCardBgBaseStyle, ...(isCardActive ? featureCardActiveStyle : {}) }}>
              <img src={feature.icon} alt={feature.name} style={{...featureIconStyle, ...feature.iconStyle}} />
              <div style={{ ...featureTitleStyle, left: feature.titleLeft, top: feature.titleTop || '59px' }}>
                {feature.name}
              </div>
            </div>
            {feature.price !== null && (
              <div style={featurePriceTagStyle}>+<span>₹</span>{feature.price}</div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default FeatureDisplayScreen;