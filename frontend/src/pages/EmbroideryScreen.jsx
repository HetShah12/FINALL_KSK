import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd'; // Import Rnd
import { useCurrentItem } from '../contexts/CurrentItemContext';

// --- Data Definitions ---
const fontOptions = [
  { name: 'Arial (System)', family: 'Arial, sans-serif' },
  { name: 'Bebas Neue', family: "'Bebas Neue Custom', sans-serif" },
  { name: 'Dancing Script', family: "'Dancing Script Custom', cursive" },
  { name: 'Flagfies', family: "'Flagfies Custom', cursive" },
  { name: 'Fredoka', family: "'Fredoka Custom', sans-serif" }, // FredokaOne
  { name: 'Great Vibes', family: "'Great Vibes Custom', cursive" },
  { name: 'Lato', family: "'Lato Custom', sans-serif" },
  { name: 'Lobster (From previous list, ensure .ttf is present)', family: "'Lobster Custom', cursive" }, // Assuming you have Lobster.ttf
  { name: 'Montserrat', family: "'Montserrat Custom', sans-serif" },
  { name: 'Orbitron (From previous list, ensure .ttf is present)', family: "'Orbitron Custom', sans-serif" }, // Assuming Orbitron.ttf
  { name: 'Oswald', family: "'Oswald Custom', sans-serif" },
  { name: 'Pacifico', family: "'Pacifico Custom', cursive" },
  { name: 'Raleway', family: "'Raleway Custom', sans-serif" },
  { name: 'Satisfy', family: "'Satisfy Custom', cursive" },
  { name: 'Stencil', family: "'Stencil Custom', sans-serif" },
  // For 'Heavy Heap', you'll need to decide which font represents it best from your list
  // or if you have a specific 'heavy_heap.ttf'. Assuming no direct 'heavy_heap.ttf':
  // { name: 'Anton (Heavy Heap-like)', family: "'Anton Custom', sans-serif" }, // If you add Anton.ttf and its @font-face
  // For 'Varsity Team', same logic. If it's 'Graduate' or 'Staatliches', use those.
  // { name: 'Graduate (Varsity-like)', family: "'Graduate Custom', cursive" }, // If you add Graduate.ttf and its @font-face
];

const embroideryColors = [
  { name: 'Black', value: 'black' },
  { name: 'White', value: 'white', border: '1px solid #ccc' },
  { name: 'Red', value: 'red' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Gold', value: 'gold' },
  { name: 'Silver', value: 'silver' },
];

const embroideryDesigns = [
  { id: 'em1', src: '/embroidery_designs/emone.png', name: 'Emb Design 1' },
  { id: 'em2', src: '/embroidery_designs/emtwo.png', name: 'Emb Design 2' },
  // ... more designs
];

// Constants for Rnd and printable area (from OrderPreviewScreen.jsx for consistency)
const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 300; // Adjusted slightly for typical embroidery area
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 200; // Adjusted slightly for typical embroidery area on chest

const DYNAMIC_MIN_CANVA_WIDTH = UI_OUTER_PRINTABLE_PIXEL_WIDTH / 4; // Min width for Rnd
const DYNAMIC_MIN_CANVA_HEIGHT = UI_OUTER_PRINTABLE_PIXEL_HEIGHT / 4; // Min height for Rnd

// Default position and size for embroidery text Rnd
const DEFAULT_EMBROIDERY_TEXT_POSITION = { x: 10, y: 10 }; // Relative to the printable area
const DEFAULT_EMBROIDERY_TEXT_SIZE = { width: 150, height: 50 }; // Initial size for Rnd

// T-shirt color maps (similar to OrderPreviewScreen)
// Ensure these paths are correct in your public folder
const frontColorMap = {
  black: '/tshirtmockups/blackfront.png', // Assuming you have blackfront.png
  red: '/tshirtmockups/redfront.png',
  navy: '/tshirtmockups/navyfront.png', // Assuming navyfront.png
  brown: '/tshirtmockups/brownfront.png',
  cream: '/tshirtmockups/creamfront.png',
  white: '/tshirtmockups/whitefront.png',
};
// const backColorMap = { /* ... if needed for back view ... */ };


const EmbroideryScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentItem, setCurrentItem, DEFAULT_CUSTOMIZATION_POSITION } = useCurrentItem();

  const queryParams = new URLSearchParams(location.search);
  const view = queryParams.get('view') || 'front';
  const isFrontView = view === 'front';

  const [activeTab, setActiveTab] = useState('text');
  const [embroideryText, setEmbroideryText] = useState('');
  const [selectedFont, setSelectedFont] = useState(fontOptions[0].family);
  const [selectedColor, setSelectedColor] = useState(embroideryColors[0].value);
  const [selectedDesign, setSelectedDesign] = useState(null);

  // Rnd state for embroidery text
  const [rndTextPosition, setRndTextPosition] = useState(DEFAULT_EMBROIDERY_TEXT_POSITION);
  const [rndTextSize, setRndTextSize] = useState(DEFAULT_EMBROIDERY_TEXT_SIZE);

  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);
  const [showInteractiveArea, setShowInteractiveArea] = useState(false);
  
  const outerPrintableAreaRefEmbroidery = useRef(null);


  // Effect for essential item details
  useEffect(() => {
    if (!currentItem || !currentItem.id) {
      console.error("EmbroideryScreen: currentItem missing.");
      return;
    }
    if (!currentItem.size || !currentItem.thickness) {
      alert("Error: T-shirt size or thickness not selected.");
      navigate('/size-selection');
    }
  }, [currentItem, navigate]);

  // Load existing customization and set Rnd state
  useEffect(() => {
    const existingCustomization = isFrontView ? currentItem.frontCustomization : currentItem.backCustomization;
    if (existingCustomization && existingCustomization.type && existingCustomization.type.startsWith('embroidery_')) {
      if (existingCustomization.type === 'embroidery_text') {
        setActiveTab('text');
        setEmbroideryText(existingCustomization.text || '');
        setSelectedFont(existingCustomization.font || fontOptions[0].family);
        setSelectedColor(existingCustomization.color || embroideryColors[0].value);
        setSelectedDesign(null);
        // Load position for Rnd
        setRndTextPosition(existingCustomization.position ? { x: existingCustomization.position.x, y: existingCustomization.position.y } : DEFAULT_EMBROIDERY_TEXT_POSITION);
        setRndTextSize(existingCustomization.position ? { width: existingCustomization.position.width, height: existingCustomization.position.height } : DEFAULT_EMBROIDERY_TEXT_SIZE);

      } else if (existingCustomization.type === 'embroidery_design') {
        setActiveTab('design');
        setSelectedDesign({ src: existingCustomization.src, name: existingCustomization.name });
        setEmbroideryText('');
        // Reset Rnd text position/size if switching from text with position
        setRndTextPosition(DEFAULT_EMBROIDERY_TEXT_POSITION);
        setRndTextSize(DEFAULT_EMBROIDERY_TEXT_SIZE);
      }
    } else {
      setActiveTab('text'); // Default
      setEmbroideryText('');
      setSelectedFont(fontOptions[0].family);
      setSelectedColor(embroideryColors[0].value);
      setSelectedDesign(null);
      setRndTextPosition(DEFAULT_EMBROIDERY_TEXT_POSITION);
      setRndTextSize(DEFAULT_EMBROIDERY_TEXT_SIZE);
    }
  }, [currentItem, isFrontView, view]);

  // Update confirm button and interactive area visibility
  useEffect(() => {
    let isDisabled = true;
    let showArea = false;
    if (activeTab === 'text' && embroideryText.trim() !== '' && selectedFont && selectedColor) {
      isDisabled = false;
      showArea = true;
    } else if (activeTab === 'design' && selectedDesign) {
      isDisabled = false;
      showArea = true; // Show guide for design too, but Rnd only for text
    }
    setIsConfirmDisabled(isDisabled);
    setShowInteractiveArea(showArea);
  }, [activeTab, embroideryText, selectedFont, selectedColor, selectedDesign]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'text') {
      setSelectedDesign(null);
    } else {
      // Optionally clear text related states
      // setEmbroideryText('');
    }
  };

  const handleConfirmEmbroidery = () => {
    let customizationDetails = null;

    if (activeTab === 'text' && embroideryText.trim() !== '' && selectedFont && selectedColor) {
      customizationDetails = {
        type: 'embroidery_text',
        text: embroideryText.trim(),
        font: selectedFont,
        color: selectedColor,
        position: { // Save Rnd position and size
            x: rndTextPosition.x, 
            y: rndTextPosition.y,
            width: rndTextSize.width,
            height: rndTextSize.height,
        },
        price: 80,
      };
    } else if (activeTab === 'design' && selectedDesign) {
      customizationDetails = {
        type: 'embroidery_design',
        src: selectedDesign.src,
        name: selectedDesign.name,
        // For designs, position might be fixed or use a simpler default from DEFAULT_CUSTOMIZATION_POSITION context
        position: DEFAULT_CUSTOMIZATION_POSITION, // Or a specific default for embroidery designs
        price: 50,
      };
    }

    if (customizationDetails) {
      const updatedItem = { ...currentItem };
      if (isFrontView) {
        updatedItem.frontCustomization = customizationDetails;
      } else {
        updatedItem.backCustomization = customizationDetails;
      }

      const frontPrice = updatedItem.frontCustomization?.price || 0;
      const backPrice = updatedItem.backCustomization?.price || 0;
      updatedItem.customizationPrice = frontPrice + backPrice;
      
      setCurrentItem(updatedItem);
      setCurrentItem(updatedItem); // This line was causing the error
      console.log("EmbroideryScreen: Navigating to Order Preview with item:", updatedItem);

      navigate('/order-preview');
    }
  };

  // --- Styles ---
  const pageStyle = { width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif' };
  const backArrowStyle = { width: '120px', height: '120px', left: '50px', top: '50px', position: 'absolute', zIndex:100};
  const pageTitleStyle = { position:'absolute', left:'50%', top: '50px', transform: 'translateX(-50%)', color: '#00566F', fontSize: '72px', fontFamily: 'SS Magnetic, sans-serif', textAlign:'center', width:'100%', whiteSpace:'nowrap' };
  
  const leftPanelStyle = { width: '792px', height: '975px', left: '113px', top: '285px', position: 'absolute',  background: '#F4F9FF', borderRadius: '12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' };
  const mockupSectionStyle = { position: 'relative', width: '80%', height: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center' }; // T-shirt centered here
  const tShirtImageStyle = { width: '100%', height: '100%', objectFit: 'contain', zIndex: 0, position: 'absolute', top: 0, left: 0 };
  
  // This is the container for Rnd, positioned on the T-shirt
  const outerPrintableAreaDynamicStyle = {
    display: showInteractiveArea ? 'block' : 'none', // Show only when relevant
    position: 'absolute',
    width: `${UI_OUTER_PRINTABLE_PIXEL_WIDTH}px`,
    height: `${UI_OUTER_PRINTABLE_PIXEL_HEIGHT}px`,
    border: '2px dashed rgba(0, 86, 111, 0.7)', // Visual guide for the overall embroidery zone
    top: '35%', // Adjust to position on chest area typically
    left: '50%', 
    transform: 'translate(-50%, -50%)',
    boxSizing: 'border-box', 
    zIndex: 1, // Above T-shirt, below Rnd handles if they go outside
  };

  const rndWrapperStyle = { // Style for the Rnd component itself for embroidery text
    border: '1px dashed #003366', // Can be subtle or match Rnd content
    backgroundColor: 'rgba(255,255,255,0.1)', // Slight background for Rnd area
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const embroideryPreviewTextStyleInsideRnd = {
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'center', 
    textAlign: 'center', 
    fontFamily: selectedFont,
    color: selectedColor,
    // Dynamic font size based on Rnd height, adjust multiplier as needed
    fontSize: `${Math.max(10, Math.min(40, (rndTextSize.height / 2.5 )))}px`, 
    whiteSpace: 'pre-wrap', 
    wordBreak: 'break-word',
    padding: '2px', // Small padding within Rnd
    userSelect: 'none', // Prevent text selection during drag
    pointerEvents: 'none', // Text itself shouldn't capture mouse events handled by Rnd
  };

  const embroideryPreviewDesignStyle = { // For static design preview
    display: (activeTab === 'design' && selectedDesign) ? 'block' : 'none',
    position: 'absolute', left: '50%', top: '35%', transform: 'translate(-50%, -50%)',
    maxWidth: '120px', maxHeight: '120px', // Adjust as needed for design preview
    objectFit: 'contain', zIndex: 2, // Above printable area guide, but Rnd is also Z-index 2 for text
  };
  
  const optionsPanelStyle = { left: '1029px', top: '293px', position: 'absolute', width: '1046px', height: '841px', backgroundColor: '#F4FAFF', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' };
  // ... (other styles like tabs, inputs, buttons remain largely the same)
  const tabsContainerStyle = {width: '100%', height: '169px', backgroundColor: '#F4FAFF', display:'flex', justifyContent:'center', alignItems:'center', gap:'20px', borderBottom: '1px solid #ddd', paddingTop:'20px', boxSizing:'border-box'};
  const tabButtonStyle = (isActive) => ({
    width: '45%', height: '98px', borderRadius: '14px', border: `2px solid ${isActive ? '#00566F' : '#AECAD4'}`, 
    backgroundColor: isActive ? '#eaf6ff' : 'white', color: '#00566F', 
    fontSize: '30px', fontFamily: 'Inter', fontWeight: '700', cursor:'pointer', 
    position:'relative', padding: '0 20px 0 70px', boxSizing: 'border-box', display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow: isActive ? '0 4px 12px rgba(0, 86, 111, 0.4)' : 'none',
  });
  const priceTagStyle = { minWidth:'97px', height: '44px', backgroundColor: '#FEE6D1', borderRadius: '46px', position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', justifyContent:'center', color: '#D57218', fontSize:'20px', fontWeight:'600', padding:'0 10px'};
  
  const tabContentStyle = (isCurrentTab) => ({ 
    width: '100%', height: 'calc(100% - 169px)', backgroundColor: '#F4FAFF', 
    padding:'20px', boxSizing:'border-box', overflowY:'auto',
    display: isCurrentTab ? 'block' : 'none',
  });

  const inputStyle = { width: '90%', margin: '20px auto', display:'block', height: '70px', fontSize: '28px', padding:'10px 15px', borderRadius: '8px', border: '1px solid #AECAD4', boxSizing: 'border-box'};
  const selectStyle = { ...inputStyle, height: '70px', padding: '10px' };
  const colorPickerContainerStyle = {textAlign:'center', marginTop: '10px'};
  const colorPickerLabelStyle = {fontSize: '28px', fontFamily: 'Inter', fontWeight: '700', color: '#3B7D92', marginBottom:'10px'};
  const colorDotStyle = (colorValue, isSelected, borderStyle = '2px solid transparent') => ({
    width: '45px',height: '45px',borderRadius: '50%',display: 'inline-block',margin: '8px',cursor: 'pointer', 
    backgroundColor: colorValue,
    border: isSelected ? '2px solid #00566F' : borderStyle, 
    boxShadow: isSelected ? '0 0 5px #00566F': 'none',
  });

  const designGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', padding: '10px' };
  const designItemStyle = (isSelected) => ({
    backgroundColor: '#00566F', borderRadius:'10px', height:'180px', position:'relative', cursor:'pointer', overflow:'hidden',
    boxShadow: isSelected ? '0 0 0 4px #FFD700' : 'none',
  });
  const designItemImgStyle = {maxWidth:'80%', maxHeight:'80%', position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)'};
  
  const confirmBtnStyle = { 
    position: 'absolute', bottom: '40px', right: '50px', 
    padding: '20px 30px', backgroundColor: isConfirmDisabled ? 'rgba(0,86,111,0.5)' : '#00566F', 
    color: 'white', border: 'none', borderRadius: '12px', fontSize: '36px', 
    fontFamily: 'Inter, sans-serif', fontWeight: '600', cursor: isConfirmDisabled ? 'not-allowed' : 'pointer', zIndex: 1000, 
  };
  
  const tShirtSrc = isFrontView 
    ? frontColorMap[currentItem?.color?.toLowerCase() || 'black'] || frontColorMap.black
    : frontColorMap[currentItem?.color?.toLowerCase() || 'black'] || frontColorMap.black; // Assuming back view uses same map for now or define backColorMap


  return (
    <div style={pageStyle}>
      <Link to="/feature-display">
        <img style={backArrowStyle} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={pageTitleStyle}>Embroidery Options ({isFrontView ? 'Front' : 'Back'})</div>

      {/* Left Panel: T-shirt Mockup */}
      <div style={leftPanelStyle}>
        <div style={mockupSectionStyle}>
          <img 
            id="tshirt-image" 
            src={tShirtSrc}
            alt="T-shirt Preview" 
            style={tShirtImageStyle}
          />
          
          {/* Outer Printable Area Guide - this is the parent for Rnd */}
          <div ref={outerPrintableAreaRefEmbroidery} style={outerPrintableAreaDynamicStyle}>
            {activeTab === 'text' && embroideryText.trim() && selectedFont && selectedColor && (
              <Rnd
                style={rndWrapperStyle}
                size={{ width: rndTextSize.width, height: rndTextSize.height }}
                position={{ x: rndTextPosition.x, y: rndTextPosition.y }}
                minWidth={DYNAMIC_MIN_CANVA_WIDTH}
                minHeight={DYNAMIC_MIN_CANVA_HEIGHT}
                bounds="parent" // Constrains to outerPrintableAreaRefEmbroidery
                onDragStop={(e, d) => {
                  setRndTextPosition({ x: d.x, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setRndTextSize({ width: parseFloat(ref.style.width), height: parseFloat(ref.style.height) });
                  setRndTextPosition({ x: position.x, y: position.y }); // Update position as well as it can change with resize from some handles
                }}
                enableResizing={{
                  top: false, right: true, bottom: true, left: false, // Allow right and bottom resize
                  topRight: false, bottomRight: true, bottomLeft: false, topLeft: false
                }}
                resizeHandleComponent={{
                    right: <div style={{width: '10px', height: '30px', background: 'rgba(0,86,111,0.7)', cursor: 'ew-resize', position: 'absolute', right: '-5px', top: 'calc(50% - 15px)'}} />,
                    bottom: <div style={{width: '30px', height: '10px', background: 'rgba(0,86,111,0.7)', cursor: 'ns-resize', position: 'absolute', bottom: '-5px', left: 'calc(50% - 15px)'}} />,
                    bottomRight: <div style={{width: '20px', height: '20px', background: 'rgba(0,86,111,0.7)', borderRadius: '50%', border: '2px solid white', cursor: 'nwse-resize', position: 'absolute', right: '-10px', bottom: '-10px'}} />
                }}
                disableDragging={false}
                dragHandleClassName="drag-handle-embroidery" // Optional: if you want a specific drag handle element inside Rnd
              >
                {/* Content for Rnd: Embroidery Text */}
                 {/* <div className="drag-handle-embroidery" style={{width: '100%', height: '20px', background:'rgba(0,0,0,0.1)', cursor: 'move', position: 'absolute', top: 0, left:0, zIndex:5}} /> */}
                <div style={embroideryPreviewTextStyleInsideRnd}>
                  {embroideryText}
                </div>
              </Rnd>
            )}
          </div>

          {/* Embroidery Design Preview (Static) */}
          {activeTab === 'design' && selectedDesign && (
            <img 
              src={selectedDesign.src} 
              alt={selectedDesign.name} 
              style={embroideryPreviewDesignStyle} // Positioned within mockupSectionStyle
            />
          )}
        </div>
         <p style={{textAlign: 'center', color: '#333', marginTop: '20px'}}>
            T-shirt Color: <strong>{currentItem?.color || 'Not set'}</strong>
            <br/>
            Size: <strong>{currentItem?.size || 'Not set'}</strong>, Thickness: <strong>{currentItem?.thicknessName || 'Not set'}</strong>
        </p>
      </div>

      {/* Right Panel: Embroidery Options */}
      <div style={optionsPanelStyle}>
        <div style={tabsContainerStyle}>
            <button style={tabButtonStyle(activeTab === 'text')} onClick={() => handleTabChange('text')}>
                <i className="fas fa-font" style={{position:'absolute', left: '25px', fontSize:'32px'}}></i>
                Enter your text <div style={priceTagStyle}>+<span>₹</span>80</div>
            </button>
            <button style={tabButtonStyle(activeTab === 'design')} onClick={() => handleTabChange('design')}>
                <i className="fas fa-th-large" style={{position:'absolute', left: '25px', fontSize:'32px'}}></i>
                Design Library <div style={priceTagStyle}>+<span>₹</span>50</div>
            </button>
        </div>

        <div style={tabContentStyle(activeTab === 'text')}>
            <input type="text" style={inputStyle} placeholder="Enter text (max 20 chars)" maxLength="20" value={embroideryText} onChange={(e) => setEmbroideryText(e.target.value)} />
            <select style={selectStyle} value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)}>
                {fontOptions.map(font => (<option key={font.name} value={font.family} style={{fontFamily: font.family}}>{font.name}</option>))}
            </select>
            <div style={colorPickerContainerStyle}>
                <p style={colorPickerLabelStyle}>Font Color:</p>
                {embroideryColors.map(color => (<span key={color.value} style={colorDotStyle(color.value, selectedColor === color.value, color.border)} onClick={() => setSelectedColor(color.value)} title={color.name}></span>))}
            </div>
        </div>

        <div style={tabContentStyle(activeTab === 'design')}>
            <div style={designGridStyle}>
                {embroideryDesigns.map(design => (
                    <div key={design.id} style={designItemStyle(selectedDesign?.src === design.src)} onClick={() => setSelectedDesign(selectedDesign?.src === design.src ? null : design)} title={design.name}>
                        <img src={design.src} alt={design.name} style={designItemImgStyle} />
                        {selectedDesign?.src === design.src && (<i className="fas fa-check" style={{fontSize: '24px', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius:'50%', padding:'5px', position: 'absolute', right: '8px', top: '8px', zIndex: 1}}></i>)}
                    </div>
                ))}
            </div>
        </div>
      </div>

      <button id="confirmEmbroideryBtn" style={confirmBtnStyle} onClick={handleConfirmEmbroidery} disabled={isConfirmDisabled}>
        Confirm Embroidery
      </button>
    </div>
  );
};

export default EmbroideryScreen;