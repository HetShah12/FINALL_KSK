// frontend/src/pages/DesignLibraryScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { useCurrentItem } from '../contexts/CurrentItemContext';
import CartIndicator from '../components/common/CartIndicator';

const UI_OUTER_PRINTABLE_PIXEL_WIDTH = 330; // Used for RND bounds on this screen
const UI_OUTER_PRINTABLE_PIXEL_HEIGHT = 488;

// Default and Min sizes for a single design placed on this screen's RND
const DESIGN_DEFAULT_WIDTH = UI_OUTER_PRINTABLE_PIXEL_WIDTH * 0.6;
const DESIGN_DEFAULT_HEIGHT = UI_OUTER_PRINTABLE_PIXEL_HEIGHT * 0.5;
const DESIGN_MIN_WIDTH = UI_OUTER_PRINTABLE_PIXEL_WIDTH * 0.2;
const DESIGN_MIN_HEIGHT = UI_OUTER_PRINTABLE_PIXEL_HEIGHT * 0.2;

const frontColorMap = { black: '/tshirtmockups/blacktshirt.png', red: '/tshirtmockups/redfront.png', navy: '/tshirtmockups/navyfront.png', brown: '/tshirtmockups/brownfront.png', cream: '/tshirtmockups/creamfront.png', white: '/tshirtmockups/whitefront.png', };
const backColorMap = { black: '/tshirtmockups/blackback.png', red: '/tshirtmockups/redback.png', navy: '/tshirtmockups/navyback.png', brown: '/tshirtmockups/brownback.png', cream: '/tshirtmockups/creamback.png', white: '/tshirtmockups/whiteback.png',};

// Your allLibraryDesigns array (make sure paths and prices are correct)
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
const categories = ["All", "Streetwear", "Digital Ink", "Minimalist", "Animals", "Cars", "Vivid"];  


const DesignLibraryScreen = () => {
  const navigate = useNavigate();
  const { currentItem, updateCurrentItem, setCustomization, DEFAULT_CUSTOMIZATION_POSITION } = useCurrentItem();

  const queryParams = new URLSearchParams(useLocation().search);
  const view = queryParams.get('view') || 'front';

  const [isFrontViewLocal, setIsFrontViewLocal] = useState(view === 'front');
  const [selectedTshirtColor, setSelectedTshirtColor] = useState(currentItem?.color || 'black');
  
  // --- State for ONE placed/selected design ---
  const [placedDesignObject, setPlacedDesignObject] = useState(null); // Stores { designId, src, name, price, category }
  const [rndPosition, setRndPosition] = useState(DEFAULT_CUSTOMIZATION_POSITION);
  const [rndSize, setRndSize] = useState({width: DESIGN_DEFAULT_WIDTH, height: DESIGN_DEFAULT_HEIGHT});
  // --------------------------------------------

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [displayedLibraryDesigns, setDisplayedLibraryDesigns] = useState(allLibraryDesigns);
  
  const mockupPrintableAreaRef = useRef(null); // For the dashed guide

  useEffect(() => {
    if (!currentItem || !currentItem.size || !currentItem.thicknessName) {
        alert("Important: T-shirt size or thickness is not selected. Please go back.");
        navigate('/size-selection');
        return;
    }
    setIsFrontViewLocal(view === 'front');
    setSelectedTshirtColor(currentItem?.color || 'black');

    const activeSideKey = view === 'front' ? 'frontCustomization' : 'backCustomization';
    const existingCust = currentItem[activeSideKey];

    if (existingCust && existingCust.type === 'library_design') {
        const foundDesign = allLibraryDesigns.find(d => d.id === existingCust.designId || d.src === existingCust.src);
        setPlacedDesignObject(foundDesign ? { ...foundDesign } : null);
        setRndPosition(existingCust.position || DEFAULT_CUSTOMIZATION_POSITION);
        setRndSize(existingCust.position 
            ? { width: existingCust.position.width, height: existingCust.position.height } 
            : { width: DESIGN_DEFAULT_WIDTH, height: DESIGN_DEFAULT_HEIGHT });
    } else {
        setPlacedDesignObject(null);
        setRndPosition(DEFAULT_CUSTOMIZATION_POSITION);
        setRndSize({width: DESIGN_DEFAULT_WIDTH, height: DESIGN_DEFAULT_HEIGHT});
    }
  }, [currentItem, view, navigate, DEFAULT_CUSTOMIZATION_POSITION]);

  useEffect(() => { 
    let designs = allLibraryDesigns;
    if (activeCategory !== 'All') designs = designs.filter(d => d.category === activeCategory);
    if (searchTerm.trim() !== '') designs = designs.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setDisplayedLibraryDesigns(designs);
  }, [searchTerm, activeCategory]);


  const handleSelectDesignFromLibrary = (libraryDesign) => {
    if (placedDesignObject && placedDesignObject.id === libraryDesign.id) {
        setPlacedDesignObject(null); // Deselect if clicking the same design
        setRndPosition(DEFAULT_CUSTOMIZATION_POSITION); // Reset RND
        setRndSize({ width: DESIGN_DEFAULT_WIDTH, height: DESIGN_DEFAULT_HEIGHT });
    } else {
        setPlacedDesignObject({ ...libraryDesign });
        // Center the newly placed design within the printable area by default
        setRndPosition({ 
            x: (UI_OUTER_PRINTABLE_PIXEL_WIDTH - DESIGN_DEFAULT_WIDTH) / 2, 
            y: (UI_OUTER_PRINTABLE_PIXEL_HEIGHT - DESIGN_DEFAULT_HEIGHT) / 2 
        });
        setRndSize({ width: DESIGN_DEFAULT_WIDTH, height: DESIGN_DEFAULT_HEIGHT });
    }
  };
  
  const handleDeletePlacedDesign = () => {
    setPlacedDesignObject(null);
    setRndPosition(DEFAULT_CUSTOMIZATION_POSITION);
    setRndSize({width: DESIGN_DEFAULT_WIDTH, height: DESIGN_DEFAULT_HEIGHT});
  };

  const handleTshirtColorChange = (colorName) => { setSelectedTshirtColor(colorName); updateCurrentItem({ color: colorName }); };

  const handleFlipView = () => {
    if (placedDesignObject) {
        const customizationDetails = {
            type: 'library_design',
            designId: placedDesignObject.id,
            src: placedDesignObject.src, name: placedDesignObject.name, price: placedDesignObject.price, category: placedDesignObject.category,
            position: { x: rndPosition.x, y: rndPosition.y, width: rndSize.width, height: rndSize.height },
        };
        setCustomization(view, customizationDetails);
    } else {
        setCustomization(view, null);
    }
    const newView = view === 'front' ? 'back' : 'front';
    navigate(`/design-library?view=${newView}`);
  };

  const handleConfirmDesigns = () => {
    if (!placedDesignObject) {
        if (window.confirm("No design is selected. Proceed to order preview with an empty design for this side?")) {
            setCustomization(view, null);
            navigate('/order-preview');
        }
        return;
    }

    const customizationDetails = {
      type: 'library_design',
      designId: placedDesignObject.id,
      src: placedDesignObject.src,
      name: placedDesignObject.name,
      price: placedDesignObject.price, // The fixed +20 from library item
      category: placedDesignObject.category,
      position: { 
        x: rndPosition.x, y: rndPosition.y, 
        width: rndSize.width, height: rndSize.height,
      },
    };
    setCustomization(view, customizationDetails);
    navigate('/order-preview');
  };

  const tshirtSrcToDisplay = isFrontViewLocal 
    ? frontColorMap[selectedTshirtColor.toLowerCase()] || frontColorMap.black
    : backColorMap[selectedTshirtColor.toLowerCase()] || backColorMap.black;

  // Styles (Mostly similar, RND area is now single, not quadrant based)
  const pageContainerStyle = { width: '2240px', height: '1400px', position: 'relative', background: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif' };
  const pageTitleStyle = { position:'absolute', left:'50%', top: '60px', transform: 'translateX(-50%)', color: '#00566F', fontSize: '72px', fontFamily: "'SS Magnetic', sans-serif", textAlign:'center', width:'100%', whiteSpace:'nowrap'};
  const backArrowStyle = { width: '100px', height: '100px', left: '80px', top: '50px', position: 'absolute', zIndex:100, cursor:'pointer'};
  const leftPreviewPanelStyle = { width: '792px', height: '975px', left: '113px', top: '200px', position: 'absolute',  background: '#F4FAFF', borderRadius: '12px' };
  const colorBarBgStyle = { width: '100%', height: '134px', position: 'absolute', bottom: 0, background: 'rgba(0, 86, 111, 0.08)', boxShadow: '0px -1px 4px rgba(0, 0, 0, 0.13)' };
  const mockupSectionStyle = { position: 'absolute', left: '50%', top: 'calc(50% - 134px/2)', transform:'translate(-50%, -50%)', width: '689px', height: '691px', display:'flex', justifyContent:'center', alignItems:'center' };
  const tshirtImageStyle = { width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top:0, left:0, zIndex:0};
  
  const outerPrintableAreaStyleForSingle = { // For the single RND on this screen
    width: `${UI_OUTER_PRINTABLE_PIXEL_WIDTH}px`, 
    height: `${UI_OUTER_PRINTABLE_PIXEL_HEIGHT}px`, 
    border: '2px dashed rgba(0, 86, 111, 0.6)', 
    position: 'absolute', 
    zIndex: 1 
  };
  const rndLibraryStyle = { 
    border: '1px solid #007bff', 
    backgroundColor: 'rgba(0,123,255,0.05)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    overflow: 'hidden', cursor: 'grab' 
  };
  const designPreviewStyleInRnd = { width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' };

  const colorOptionsStyle = { position:'absolute', bottom:'38px', left:'50%', transform:'translateX(-50%)', display: 'flex', gap: '30px'};
  const colorDotStyle = (c, isSel) => ({ width: '59px', height: '59px', borderRadius: '50%', cursor: 'pointer', backgroundColor: c.code, border: isSel ? '3px solid #00566F' : c.borderStyle || (c.code === '#ffffff' ? '1px solid #ccc':'transparent'), boxShadow: isSel ? '0 0 8px #00566F':'none'});
  const flipIconStyle = { width: '80px', height: '80px', position: 'absolute', right: '20px', top: '20px', cursor:'pointer', zIndex: 7 };
  const deleteDesignButtonStyle = { position: 'absolute', bottom: '150px', /* Adjust as needed */ left: '50%', transform: 'translateX(-50%)', zIndex: 6, background: 'rgba(220, 53, 69, 0.9)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '20px', cursor: 'pointer'};


  const rightPanelDesignsStyle = { position: 'absolute', left: 'calc(113px + 792px + 40px)', top: '200px', width: 'calc(2240px - (113px + 792px + 40px) - 113px)', height: '975px', display:'flex', flexDirection:'column' };
  const designGridScrollContainerStyle = { flexGrow:1, position: 'relative', backgroundColor: '#F4FAFF', overflowY: 'auto', borderRadius: '10px', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)' };
  const designGridHeaderStyle = { width: '100%', position: 'sticky', top:0, backgroundColor: '#F4FAFF', zIndex:10, padding: '25px 30px', boxSizing: 'border-box', borderBottom: '2px solid #E0E8EF' };
  const searchBarStyle = {display:'flex', alignItems:'center', marginBottom:'25px'};
  const searchInputStyle = {flexGrow:1, height: '70px', border: '2px solid #B0CADD',borderRadius: '10px',fontFamily: 'Inter',fontSize: '28px', padding: '0 20px', marginRight:'15px'};
  const chipsContainerStyle = { display:'flex', flexWrap:'wrap', gap:'12px', justifyContent:'flex-start'};
  const chipStyle = (isActive) => ({height: '55px', borderRadius: '30px', border: `2px solid ${isActive ? '#00566F' : '#AECAD4'}`, backgroundColor: isActive ? '#D6EFFF' : '#F0F8FF', color: '#00566F', fontSize: '22px', fontFamily: 'Inter', fontWeight: 500, padding: '0 25px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease'});
  const designItemsGridStyle = { padding: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '30px'};
  const designItemContainerStyle = (isSelected) => ({ 
    width: '100%', aspectRatio: '1 / 1', position: 'relative', backgroundColor: '#003A4D', 
    borderRadius: '10px', cursor: 'pointer', overflow: 'hidden', 
    border: isSelected ? '4px solid #FFD700' : '4px solid transparent', // Highlight selected
    transition: 'transform 0.1s ease, border-color 0.2s', 
    userSelect: 'none', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
  });
  const designItemImageStyle = {maxWidth: '85%', maxHeight: '85%', position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', objectFit: 'contain'};
  const confirmDesignBtnContainerStyle = { padding: '25px 30px', borderTop:'2px solid #E0E8EF', marginTop:'auto', backgroundColor: '#F4FAFF'};
  const confirmDesignBtnStyle = { width: '100%', height:'75px', backgroundColor: placedDesignObject ? '#00566F' : '#B0C4DE', color: 'white', border: 'none', borderRadius: '10px', fontSize: '30px', fontFamily: 'Inter', fontWeight: 600, cursor: placedDesignObject ? 'pointer' : 'not-allowed'};

  if (!currentItem) return <div style={{padding: "50px", fontSize: "30px", textAlign: "center"}}>Loading...</div>;

  return (
    <div style={pageContainerStyle}>
      {/* <CartIndicator /> */}
      <Link to="/feature-display">
        <img style={backArrowStyle} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={pageTitleStyle}>Design Library ({isFrontViewLocal ? 'Front' : 'Back'})</div>

      <div style={leftPreviewPanelStyle}>
        <div style={mockupSectionStyle}>
          <img id="tshirt-image" src={tshirtSrcToDisplay} alt="T-shirt Preview" style={tshirtImageStyle} 
            onError={(e) => { e.target.src = isFrontViewLocal ? frontColorMap.black : backColorMap.black; }}/>
          <div ref={mockupPrintableAreaRef} style={outerPrintableAreaStyleForSingle}>
            {placedDesignObject && (
              <Rnd
                style={rndLibraryStyle}
                size={{ width: rndSize.width, height: rndSize.height }}
                position={{ x: rndPosition.x, y: rndPosition.y }}
                minWidth={DESIGN_MIN_WIDTH}
                minHeight={DESIGN_MIN_HEIGHT}
                bounds="parent"
                onDragStop={(e, d) => setRndPosition({ x: d.x, y: d.y })}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setRndSize({ width: parseFloat(ref.style.width), height: parseFloat(ref.style.height) });
                  setRndPosition({ x: position.x, y: position.y });
                }}
                enableResizing={{ bottomRight: true }}
                resizeHandleComponent={{ bottomRight: <div style={{width: '20px', height: '20px', background: 'rgba(0,86,111,0.8)', borderRadius: '50%', border:'1px solid white', cursor: 'nwse-resize', position:'absolute', right:'-10px', bottom:'-10px'}}/> }}
              >
                <img src={placedDesignObject.src} alt={placedDesignObject.name} style={designPreviewStyleInRnd} />
              </Rnd>
            )}
          </div>
        </div>
        {placedDesignObject && (
            <button style={deleteDesignButtonStyle} onClick={handleDeletePlacedDesign} title="Remove this design">
                Clear Design
            </button>
        )}
        <div style={colorBarBgStyle}>
          <div style={colorOptionsStyle}>
            {[{ name: 'black', code: '#1e1e1e', borderStyle: 'none' }, { name: 'red', code: '#8b0000', borderStyle: 'none' }, { name: 'navy', code: '#002244', borderStyle: 'none' }, { name: 'brown', code: '#7A4824', borderStyle: 'none' }, { name: 'cream', code: '#fdf1dc', borderStyle: 'none' }, { name: 'white', code: '#ffffff', borderStyle: '1px solid #ccc' }].map(c => (
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
                   style={designItemContainerStyle(placedDesignObject?.id === design.id)} // Highlight if it's the currently placed one
                   onClick={() => handleSelectDesignFromLibrary(design)} 
                   title={design.name}
              >
                <img src={design.src} alt={design.name} style={designItemImageStyle} />
                {/* No selected icon needed if only one can be placed on RND */}
              </div>
            ))}
            {displayedLibraryDesigns.length === 0 && <p style={{gridColumn: '1 / -1', textAlign:'center', fontSize:'22px', color:'#777', padding:'40px'}}>No designs found for "{activeCategory}" category {searchTerm && `with term "${searchTerm}"`}.</p>}
          </div>    
        </div>
        <div style={confirmDesignBtnContainerStyle}>
             <button id="confirmDesignBtn" style={confirmDesignBtnStyle} onClick={handleConfirmDesigns}>
                {placedDesignObject ? "Confirm Design" : "Skip / Done"}
            </button>
        </div>
      </div>
    </div>
  );
};
export default DesignLibraryScreen;