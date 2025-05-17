// frontend/src/pages/DesignLibraryScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { useCurrentItem } from '../contexts/CurrentItemContext';
import CartIndicator from '../components/common/CartIndicator';

// Constants
const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 330;
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488;
const NUM_QUADRANTS = 4;
const QUADRANT_WIDTH = UI_OUTER_PRINTABLE_PIXEL_WIDTH / 2;
const QUADRANT_HEIGHT = UI_OUTER_PRINTABLE_PIXEL_HEIGHT / 2;
const DESIGN_MIN_WIDTH_IN_QUADRANT = QUADRANT_WIDTH * 0.3;
const DESIGN_MIN_HEIGHT_IN_QUADRANT = QUADRANT_HEIGHT * 0.3;
const DESIGN_DEFAULT_WIDTH_IN_QUADRANT = QUADRANT_WIDTH * 0.8;
const DESIGN_DEFAULT_HEIGHT_IN_QUADRANT = QUADRANT_HEIGHT * 0.8;

const frontColorMap = { black: '/tshirtmockups/blacktshirt.png', red: '/tshirtmockups/redfront.png', navy: '/tshirtmockups/bluefront.png', brown: '/tshirtmockups/brownfront.png', cream: '/tshirtmockups/creamfront.png', white: '/tshirtmockups/whitefront.png', };
const backColorMap = { black: '/tshirtmockups/blackback.png', red: '/tshirtmockups/backred.png', navy: '/tshirtmockups/bluefront.png', brown: '/tshirtmockups/backbrown.png', cream: '/tshirtmockups/backcream.png', white: '/tshirtmockups/backwhite.png',};

const allLibraryDesigns = [
    { id: 'sw1', src: '/library_designs/swone.png', name: 'Street Style 1', category: 'Streetwear', price: 20 },
    { id: 'sw2', src: '/library_designs/swtwo.png', name: 'Street Style 2', category: 'Streetwear', price: 20 },
    { id: 'sw3', src: '/library_designs/swthree.png', name: 'Street Style 3', category: 'Streetwear', price: 20 },
    { id: 'sw4', src: '/library_designs/swfour.png', name: 'Street Style 4', category: 'Streetwear', price: 20 },
    { id: 'sw5', src: '/library_designs/swfive.png', name: 'Street Style 5', category: 'Streetwear', price: 20 },
    { id: 'sw6', src: '/library_designs/swsix.png', name: 'Street Style 6', category: 'Streetwear', price: 20 },
    { id: 'sw7', src: '/library_designs/swseven.png', name: 'Street Style 7', category: 'Streetwear', price: 20 },
    { id: 'sw8', src: '/library_designs/sweight.png', name: 'Street Style 8', category: 'Streetwear', price: 20 },
    { id: 'sw9', src: '/library_designs/swnine.png', name: 'Street Style 9', category: 'Streetwear', price: 20 },
    { id: 'di1', src: '/library_designs/dione.png', name: 'Digital Ink 1', category: 'Digital Ink', price: 20 },
    { id: 'di2', src: '/library_designs/ditwo.png', name: 'Digital Ink 2', category: 'Digital Ink', price: 20 },
    { id: 'di3', src: '/library_designs/dithree.png', name: 'Digital Ink 3', category: 'Digital Ink', price: 20 },
    { id: 'di4', src: '/library_designs/difour.png', name: 'Digital Ink 4', category: 'Digital Ink', price: 20 },
    { id: 'di6', src: '/library_designs/disix.png', name: 'Digital Ink 6', category: 'Digital Ink', price: 20 },
    { id: 'di7', src: '/library_designs/diseven.png', name: 'Digital Ink 7', category: 'Digital Ink', price: 20 },
    { id: 'di8', src: '/library_designs/dieight.png', name: 'Digital Ink 8', category: 'Digital Ink', price: 20 },
    { id: 'min1', src: '/library_designs/minimalone.png', name: 'Minimalist 1', category: 'Minimalist', price: 20 },
    { id: 'min2', src: '/library_designs/minimaltwo.png', name: 'Minimalist 2', category: 'Minimalist', price: 20 },
    { id: 'min3', src: '/library_designs/minimalthree.png', name: 'Minimalist 3', category: 'Minimalist', price: 20 },
    { id: 'an1', src: '/library_designs/animalone.png', name: 'Animal 1', category: 'Animals', price: 20 },
    { id: 'an2', src: '/library_designs/animaltwo.png', name: 'Animal 2', category: 'Animals', price: 20 },
    { id: 'car1', src: '/library_designs/carone.png', name: 'Car 1', category: 'Cars', price: 20 }, { id: 'car2', src: '/library_designs/cartwo.png', name: 'Car 2', category: 'Cars', price: 20 }, { id: 'car3', src: '/library_designs/carthree.png', name: 'Car 3', category: 'Cars', price: 20 }, { id: 'car4', src: '/library_designs/carfour.png', name: 'Car 4', category: 'Cars', price: 20 }, { id: 'car5', src: '/library_designs/carfive.png', name: 'Car 5', category: 'Cars', price: 20 }, { id: 'car6', src: '/library_designs/carsix.png', name: 'Car 6', category: 'Cars', price: 20 }, { id: 'car7', src: '/library_designs/carseven.png', name: 'Car 7', category: 'Cars', price: 20 }, { id: 'car8', src: '/library_designs/careight.png', name: 'Car 8', category: 'Cars', price: 20 }, { id: 'car9', src: '/library_designs/carnine.png', name: 'Car 9', category: 'Cars', price: 20 }, { id: 'car10', src: '/library_designs/carten.png', name: 'Car 10', category: 'Cars', price: 20 }, { id: 'car11', src: '/library_designs/careleven.png', name: 'Car 11', category: 'Cars', price: 20 }, { id: 'car12', src: '/library_designs/cartwelve.png', name: 'Car 12', category: 'Cars', price: 20 }, { id: 'car13', src: '/library_designs/carthirteen.png', name: 'Car 13', category: 'Cars', price: 20 }, { id: 'car14', src: '/library_designs/carfourteen.png', name: 'Car 14', category: 'Cars', price: 20 }, { id: 'car15', src: '/library_designs/carfifteen.png', name: 'Car 15', category: 'Cars', price: 20 }, { id: 'car16', src: '/library_designs/carsixteen.png', name: 'Car 16', category: 'Cars', price: 20 }, { id: 'car17', src: '/library_designs/carseventeen.png', name: 'Car 17', category: 'Cars', price: 20 },
    { id: 'viv1', src: '/library_designs/vividone.png', name: 'Vivid 1', category: 'Vivid', price: 20 }, { id: 'viv2', src: '/library_designs/vividtwo.png', name: 'Vivid 2', category: 'Vivid', price: 20 }, { id: 'viv3', src: '/library_designs/vividthree.png', name: 'Vivid 3', category: 'Vivid', price: 20 },
];
const categories = ["All", "Streetwear", "Digital Ink", "Minimalist", "Animals", "Cars", "Vivid"]; // Corrected "Viviyd" typo

const DesignLibraryScreen = () => {
  const navigate = useNavigate();
  const { currentItem, updateCurrentItem, setCustomization, DEFAULT_CUSTOMIZATION_POSITION } = useCurrentItem();

  const queryParams = new URLSearchParams(useLocation().search);
  const initialView = queryParams.get('view') || 'front';

  const [isFrontView, setIsFrontView] = useState(initialView === 'front');
  const [selectedTshirtColor, setSelectedTshirtColor] = useState(currentItem?.color || 'black');
  const [placedDesigns, setPlacedDesigns] = useState([]); 
  const [activeQuadrantIndex, setActiveQuadrantIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [displayedLibraryDesigns, setDisplayedLibraryDesigns] = useState(allLibraryDesigns);

  const safeDefaultPos = DEFAULT_CUSTOMIZATION_POSITION || { x: 20, y: 20, width: DESIGN_DEFAULT_WIDTH_IN_QUADRANT, height: DESIGN_DEFAULT_HEIGHT_IN_QUADRANT };
  const isFrontViewRef = useRef(isFrontView);
  useEffect(() => { isFrontViewRef.current = isFrontView; }, [isFrontView]);
  const mockupPrintableAreaRef = useRef(null); 

  useEffect(() => {
    if (!currentItem || !currentItem.size || !currentItem.thicknessName) {
        console.warn("DesignLibraryScreen: Size or Thickness missing. CurrentItem:", currentItem);
        alert("Important: T-shirt size or thickness is not selected. Please go back to 'Size Selection'.");
        navigate('/size-selection'); // Redirect if essential product info is missing
        return; // Prevent further execution in this effect if redirecting
    }

    const activeSideKey = isFrontViewRef.current ? 'frontCustomization' : 'backCustomization';
    const existingCust = currentItem[activeSideKey];
    if (existingCust && existingCust.type === 'multi_library_design' && Array.isArray(existingCust.elements)) {
        const loadedElements = existingCust.elements.map(el => ({
            design: allLibraryDesigns.find(d => d.id === el.designId) || 
                    { id: el.designId, src: el.src, name: el.name, price: el.price || 20, category: el.category || "Unknown"}, // Add category from el if present
            position: el.position || {x:0, y:0, width: DESIGN_DEFAULT_WIDTH_IN_QUADRANT, height:DESIGN_DEFAULT_HEIGHT_IN_QUADRANT},
            quadrantIndex: typeof el.quadrantIndex === 'number' ? el.quadrantIndex : -1, // Ensure quadrantIndex is a number
            id: `${el.designId}_q${typeof el.quadrantIndex === 'number' ? el.quadrantIndex : 'x'}_${Date.now()}_load` // Unique ID for loaded instance
        })).filter(el => el.quadrantIndex !== -1); // Filter out any elements that didn't have a valid quadrantIndex
        setPlacedDesigns(loadedElements);
    } else {
        setPlacedDesigns([]);
    }
    setActiveQuadrantIndex(null); // Reset active quadrant when view or item changes
  }, [currentItem, isFrontView, navigate]); // isFrontView drives reloading for front/back

  useEffect(() => { 
    let designs = allLibraryDesigns;
    if (activeCategory !== 'All') designs = designs.filter(d => d.category === activeCategory);
    if (searchTerm.trim() !== '') designs = designs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setDisplayedLibraryDesigns(designs);
  }, [searchTerm, activeCategory]);

  const handleQuadrantClick = (quadrantIndex) => {
    setActiveQuadrantIndex(prev => (prev === quadrantIndex ? null : quadrantIndex));
  };

  const handleSelectDesignFromLibrary = (libraryDesign) => {
    if (activeQuadrantIndex === null) {
      alert("Please select a quadrant on the T-shirt first.");
      return;
    }

    const existingDesignInQuadrant = placedDesigns.find(d => d.quadrantIndex === activeQuadrantIndex);

    if (existingDesignInQuadrant) {
      if (existingDesignInQuadrant.design.id === libraryDesign.id) {
        // Re-selecting the same design in the same quadrant - do nothing or re-confirm.
        return;
      } else {
        if (!window.confirm("This quadrant already has a design. Replace it with the new selection?")) {
          return; 
        }
      }
    } else { // Quadrant is empty, trying to add a new design
      if (placedDesigns.length >= NUM_QUADRANTS) {
        alert(`You can place a maximum of ${NUM_QUADRANTS} designs.`);
        return; 
      }
    }
    
    const newPlacedDesign = {
        design: { ...libraryDesign },
        position: { x: 0, y: 0, width: DESIGN_DEFAULT_WIDTH_IN_QUADRANT, height: DESIGN_DEFAULT_HEIGHT_IN_QUADRANT },
        quadrantIndex: activeQuadrantIndex,
        id: `${libraryDesign.id}_q${activeQuadrantIndex}_${Date.now()}`
    };

    setPlacedDesigns(prevDesigns => {
        const otherDesigns = prevDesigns.filter(d => d.quadrantIndex !== activeQuadrantIndex);
        const updatedDesigns = [...otherDesigns, newPlacedDesign];
        return updatedDesigns.slice(0, NUM_QUADRANTS); // Safeguard
    });
    // setActiveQuadrantIndex(null); // Optional: deselect quadrant
  };

  const handleRndInteractionForPlacedDesign = useCallback((quadrantIndex, newRndPositionAndSize) => {
    setPlacedDesigns(prevDesigns =>
      prevDesigns.map(pd =>
        pd.quadrantIndex === quadrantIndex
          ? { ...pd, position: { x: newRndPositionAndSize.x, y: newRndPositionAndSize.y, width: newRndPositionAndSize.width, height: newRndPositionAndSize.height } }
          : pd
      )
    );
  }, []); 
  
  const handleDeletePlacedDesign = (quadrantIndex) => {
    setPlacedDesigns(prev => prev.filter(d => d.quadrantIndex !== quadrantIndex));
    if(activeQuadrantIndex === quadrantIndex) setActiveQuadrantIndex(null);
  };

  const handleTshirtColorChange = (color) => { setSelectedTshirtColor(color); updateCurrentItem({ color }); };

  const handleFlipView = () => {
    // Save current designs before flipping
    if (placedDesigns.length > 0) { // Only save if there's something to save
        const currentSideCustomization = {
            type: 'multi_library_design',
            elements: placedDesigns.map(pd => ({
                designId: pd.design.id, src: pd.design.src, name: pd.design.name, price: pd.design.price,
                category: pd.design.category, // Persist category for re-loading
                position: pd.position, quadrantIndex: pd.quadrantIndex,
            })),
            // The overall position for multi-design could be the bounding box of all elements,
            // or simply the default position for the RND on OrderPreviewScreen to use as its overall bounds.
            // For now, priceService handles summing element prices.
            position: { ...DEFAULT_CUSTOMIZATION_POSITION } // Use context default for the main container
        };
        setCustomization(isFrontViewRef.current ? 'front' : 'back', currentSideCustomization);
    } else {
        // If no designs are placed, ensure the side is cleared in the context
        setCustomization(isFrontViewRef.current ? 'front' : 'back', null);
    }
    setIsFrontView(prev => !prev);
    // Placed designs and active quadrant will be re-evaluated by useEffect for the new view
  };

  const handleConfirmDesigns = () => {
    if (placedDesigns.length === 0 && !window.confirm("No designs are placed. Proceed to order preview with an empty design?")) {
        // If user doesn't want to proceed with an empty design, stay on the page
        // Or, if you want to strictly require at least one design:
        // alert("Please add at least one design to a quadrant.");
        // return;
        
        // Setting the side to null if no designs confirmed
        setCustomization(isFrontViewRef.current ? 'front' : 'back', null);
        navigate('/order-preview');
        return;
    }

    const elementsForContext = placedDesigns.map(pd => {
     let quadrantBaseX = (pd.quadrantIndex % 2) * QUADRANT_WIDTH;
     let quadrantBaseY = Math.floor(pd.quadrantIndex / 2) * QUADRANT_HEIGHT;
     
     return {
         designId: pd.design.id,
         src: pd.design.src,
         name: pd.design.name,
         price: pd.design.price,
         category: pd.design.category,
         position: { 
             x: quadrantBaseX + pd.position.x,
             y: quadrantBaseY + pd.position.y,
             width: pd.position.width,
             height: pd.position.height,
         },
         // quadrantIndex can be useful for debugging or if OrderPreviewScreen needs it
     };
  });
    const customizationDetails = {
      type: 'multi_library_design',
      elements: elementsForContext,
      // The overall position for this 'multi_library_design' container
      // can be the default, as OrderPreviewScreen's Rnd will use it.
      position: { ...DEFAULT_CUSTOMIZATION_POSITION }
    };
    setCustomization(isFrontViewRef.current ? 'front' : 'back', customizationDetails);
    navigate('/order-preview');
  };

  const tshirtSrcToDisplay = isFrontViewRef.current 
    ? frontColorMap[selectedTshirtColor.toLowerCase()] || frontColorMap.black
    : backColorMap[selectedTshirtColor.toLowerCase()] || backColorMap.black;

  // --- STYLES --- (Copied from your previous submission)
  const pageContainerStyle = { width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif' };
  const pageTitleStyle = { position:'absolute', left:'50%', top: '60px', transform: 'translateX(-50%)', color: '#00566F', fontSize: '72px', fontFamily: "'SS Magnetic', sans-serif", textAlign:'center', width:'100%', whiteSpace:'nowrap'};
  const backArrowStyle = { width: '100px', height: '100px', left: '80px', top: '50px', position: 'absolute', zIndex:100, cursor:'pointer'};
  const leftPreviewPanelStyle = { width: '792px', height: '975px', left: '113px', top: '200px', position: 'absolute',  background: '#F4FAFF', borderRadius: '12px' };
  const colorBarBgStyle = { width: '100%', height: '134px', position: 'absolute', bottom: 0, background: 'rgba(0, 86, 111, 0.08)', boxShadow: '0px -1px 4px rgba(0, 0, 0, 0.13)' };
  const mockupSectionStyle = { position: 'absolute', left: '50%', top: 'calc(50% - 134px/2)', transform:'translate(-50%, -50%)', width: '689px', height: '691px', display:'flex', justifyContent:'center', alignItems:'center' };
  const tshirtImageStyle = { width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top:0, left:0, zIndex:0};
  const outerPrintableAreaStyle = { width: `${UI_OUTER_PRINTABLE_PIXEL_WIDTH}px`, height: `${UI_OUTER_PRINTABLE_PIXEL_HEIGHT}px`, border: '2px dashed rgba(0, 86, 111, 0.6)', position: 'absolute', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px', padding: '1px', zIndex: 1 };
  const quadrantStyle = (isActive) => ({ width: '100%', height: '100%', border: `2px dashed ${isActive ? '#007bff' : 'rgba(0,86,111,0.3)'}`, backgroundColor: isActive ? 'rgba(0,123,255,0.1)' : 'rgba(0,86,111,0.02)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', cursor: 'pointer', boxSizing: 'border-box', transition: 'border-color 0.2s, background-color 0.2s' });
  const rndInQuadrantStyle = { border: '1px solid #00566F', backgroundColor: 'rgba(0,86,111,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', touchAction: 'none' };
  const designPreviewStyleInRnd = { width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' };
  const colorOptionsStyle = { position:'absolute', bottom:'38px', left:'50%', transform:'translateX(-50%)', display: 'flex', gap: '30px'};
  const colorDotStyle = (c, isSel) => ({ width: '59px', height: '59px', borderRadius: '50%', cursor: 'pointer', backgroundColor: c.code, border: isSel ? '3px solid #00566F' : c.borderStyle || (c.code === '#ffffff' ? '1px solid #ccc':'transparent'), boxShadow: isSel ? '0 0 8px #00566F':'none'});
  const flipIconStyle = { width: '80px', height: '80px', position: 'absolute', right: '20px', top: '20px', cursor:'pointer' };
  const rightPanelDesignsStyle = { position: 'absolute', left: 'calc(113px + 792px + 40px)', top: '200px', width: 'calc(2240px - (113px + 792px + 40px) - 113px)', height: '975px', display:'flex', flexDirection:'column' };
  const designGridScrollContainerStyle = { flexGrow:1, position: 'relative', backgroundColor: '#F4FAFF', overflowY: 'auto', borderRadius: '10px', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)' };
  const designGridHeaderStyle = { width: '100%', position: 'sticky', top:0, backgroundColor: '#F4FAFF', zIndex:10, padding: '25px 30px', boxSizing: 'border-box', borderBottom: '2px solid #E0E8EF' };
  const searchBarStyle = {display:'flex', alignItems:'center', marginBottom:'25px'};
  const searchInputStyle = {flexGrow:1, height: '70px', border: '2px solid #B0CADD',borderRadius: '10px',fontFamily: 'Inter',fontSize: '28px', padding: '0 20px', marginRight:'15px'};
  const chipsContainerStyle = { display:'flex', flexWrap:'wrap', gap:'12px', justifyContent:'flex-start'};
  const chipStyle = (isActive) => ({height: '55px', borderRadius: '30px', border: `2px solid ${isActive ? '#00566F' : '#AECAD4'}`, backgroundColor: isActive ? '#D6EFFF' : '#F0F8FF', color: '#00566F', fontSize: '22px', fontFamily: 'Inter', fontWeight: 500, padding: '0 25px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease'});
  const designItemsGridStyle = { padding: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '30px'};
  const designItemContainerStyle = (isActiveQuadrantContext) => ({ 
    width: '100%', aspectRatio: '1 / 1', position: 'relative', backgroundColor: '#003A4D', 
    borderRadius: '10px', cursor: isActiveQuadrantContext ? 'copy' : 'pointer', overflow: 'hidden', 
    border: '4px solid transparent', transition: 'transform 0.1s ease', userSelect: 'none', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
  });
  const designItemImageStyle = {maxWidth: '85%', maxHeight: '85%', position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', objectFit: 'contain'};
  const placedDesignDeleteButtonStyle = { position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,53,69,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '14px', cursor: 'pointer', zIndex: 10, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:'26px', fontWeight:'bold' };
  const selectedIconContainerStyle = { position: 'absolute', right: '10px', top: '10px', backgroundColor: 'rgba(0, 180, 0, 0.7)', color: 'white', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontSize: '16px', fontWeight:'bold' };
  const confirmDesignBtnContainerStyle = { padding: '25px 30px', borderTop:'2px solid #E0E8EF', marginTop:'auto', backgroundColor: '#F4FAFF'};
  const confirmDesignBtnStyle = { width: '100%', height:'75px', backgroundColor: placedDesigns.length > 0 ? '#00566F' : '#B0C4DE', color: 'white', border: 'none', borderRadius: '10px', fontSize: '30px', fontFamily: 'Inter', fontWeight: 600, cursor: placedDesigns.length > 0 ? 'pointer' : 'not-allowed'};


  if (!currentItem) {
    return <div style={{padding: "50px", fontSize: "30px", textAlign: "center"}}>Loading item configuration...</div>;
  }

  return (
    <div style={pageContainerStyle}>
      <CartIndicator />
      <Link to="/feature-display">
        <img style={backArrowStyle} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={pageTitleStyle}>Design Library ({isFrontViewRef.current ? 'Front' : 'Back'})</div>

      <div style={leftPreviewPanelStyle}>
        <div style={mockupSectionStyle}>
          <img id="tshirt-image" src={tshirtSrcToDisplay} alt="T-shirt Preview" style={tshirtImageStyle} 
            onError={(e) => { e.target.src = isFrontViewRef.current ? frontColorMap.black : backColorMap.black; }}
          />
          <div ref={mockupPrintableAreaRef} style={outerPrintableAreaStyle}>
            {[0, 1, 2, 3].map(quadIndex => {
              const placedDesign = placedDesigns.find(d => d.quadrantIndex === quadIndex);
              return (
                <div 
                    key={quadIndex} 
                    style={quadrantStyle(activeQuadrantIndex === quadIndex)}
                    onClick={() => handleQuadrantClick(quadIndex)}
                    className={`quadrant quadrant-${quadIndex}`}
                >
                  {placedDesign && (
                    <Rnd
                      style={rndInQuadrantStyle}
                      size={{ width: placedDesign.position.width, height: placedDesign.position.height }}
                      position={{ x: placedDesign.position.x, y: placedDesign.position.y }}
                      minWidth={DESIGN_MIN_WIDTH_IN_QUADRANT}
                      minHeight={DESIGN_MIN_HEIGHT_IN_QUADRANT}
                      maxWidth={QUADRANT_WIDTH -4} // Account for borders
                      maxHeight={QUADRANT_HEIGHT -4} // Account for borders
                      bounds="parent"
                      onDragStop={(e, d) => {
                        handleRndInteractionForPlacedDesign(quadIndex, { x: d.x, y: d.y, width: placedDesign.position.width, height: placedDesign.position.height });
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        const newWidth = parseFloat(ref.style.width);
                        const newHeight = parseFloat(ref.style.height);
                        handleRndInteractionForPlacedDesign(quadIndex, { x: position.x, y: position.y, width: newWidth, height: newHeight });
                      }}
                      enableResizing={{ bottomRight: true }}
                      resizeHandleComponent={{ bottomRight: <div style={{width: '18px', height: '18px', background: 'rgba(0,86,111,0.8)', borderRadius: '50%', border:'1px solid white', cursor: 'nwse-resize', position:'absolute', right:'-9px', bottom:'-9px'}}/> }}
                    >
                      <img src={placedDesign.design.src} alt={placedDesign.design.name} style={designPreviewStyleInRnd} />
                      <button 
                        style={placedDesignDeleteButtonStyle}
                        onClick={(e) => { e.stopPropagation(); handleDeletePlacedDesign(quadIndex);}}
                        title="Remove this design"
                      >X</button>
                    </Rnd>
                  )}
                  {!placedDesign && activeQuadrantIndex === quadIndex && (
                    <div style={{fontSize:'14px', color: '#007bff', fontWeight:'500', textAlign:'center', padding: '5px', pointerEvents: 'none'}}>Select a design from library</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={colorBarBgStyle}>
          <div style={colorOptionsStyle}>
            {[{ name: 'black', code: '#1e1e1e', borderStyle: 'none' },
              { name: 'red', code: '#8b0000', borderStyle: 'none' },
              { name: 'navy', code: '#002244', borderStyle: 'none' },
              { name: 'brown', code: '#7A4824', borderStyle: 'none' },
              { name: 'cream', code: '#fdf1dc', borderStyle: 'none' },
              { name: 'white', code: '#ffffff', borderStyle: '1px solid #ccc' }].map(c => (
              <div key={c.name} style={colorDotStyle(c, selectedTshirtColor === c.name)} onClick={() => handleTshirtColorChange(c.name)} />
            ))}
          </div>
        </div>
        <img id="flip-icon" style={flipIconStyle} src="/Features_Display_Img/flip.png" alt="Flip View" onClick={handleFlipView}/>
      </div>
  
      <div style={rightPanelDesignsStyle}>
        <div style={designGridScrollContainerStyle}>
          <div style={designGridHeaderStyle}>
            <div style={searchBarStyle}>
              <input type="text" style={searchInputStyle} placeholder="Search designs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div style={chipsContainerStyle}>
              {categories.map(category => (
                <button key={category} style={chipStyle(activeCategory === category)} onClick={() => setActiveCategory(category)}>
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div style={designItemsGridStyle}>
            {displayedLibraryDesigns.map(design => (
              <div key={design.id} 
                   style={designItemContainerStyle(activeQuadrantIndex !== null)} 
                   onClick={() => handleSelectDesignFromLibrary(design)} 
                   title={design.name}
              >
                <img src={design.src} alt={design.name} style={designItemImageStyle} />
                {/* Check if this design is placed in ANY quadrant for the current view */}
                {placedDesigns.some(pd => pd.design.id === design.id) && ( 
                    <div style={selectedIconContainerStyle}>✓</div> 
                )}
              </div>
            ))}
            {displayedLibraryDesigns.length === 0 && <p style={{gridColumn: '1 / -1', textAlign:'center', fontSize:'22px', color:'#777', padding:'40px'}}>No designs found.</p>}
          </div>    
        </div>
        <div style={confirmDesignBtnContainerStyle}>
             <button id="confirmDesignBtn" style={confirmDesignBtnStyle} onClick={handleConfirmDesigns} disabled={placedDesigns.length === 0 && !(currentItem?.frontCustomization || currentItem?.backCustomization)}>
                {placedDesigns.length > 0 ? `Confirm Designs (${placedDesigns.length}/${NUM_QUADRANTS})` : "Skip Designs / Done"}
            </button>
        </div>
      </div>
    </div>
  );
};
export default DesignLibraryScreen;