// frontend/src/pages/SizeSelectionScreen.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentItem } from '../contexts/CurrentItemContext';

const thicknessOptions = {
  standard: {
    id: 'standard-card',
    name: 'Forma flow',
    gsm: 180,      // Numeric GSM value
    price: 349,    // Display price on card
    description: 'Tailored softness with subtle stretch made to move with you.',
  },
  premium: {
    id: 'premium-card',
    name: 'Forma dense',
    gsm: 240,      // Numeric GSM value
    price: 499,    // Display price on card
    description: 'Pure cotton. Elevated weight. Solid feel.',
  },
};

const sizeDetails = {
  S: { measurement: 'Chest: 40" | Length: 27"' },
  M: { measurement: 'Chest: 42" | Length: 28"' },
  L: { measurement: 'Chest: 44" | Length: 28.5"' },
  XL: { measurement: 'Chest: 46" | Length: 29"' },
};


const SizeSelectionScreen = ({debugMessageFromApp }) => { // Assuming debugMessageFromApp is still passed for testing
  if (debugMessageFromApp) { // Only log if the debug prop is actually passed
    console.log("DEBUG SizeSelectionScreen received debugMessageFromApp:", debugMessageFromApp);
  }
  
  const navigate = useNavigate();
  const contextValue = useCurrentItem();

  if (!contextValue) {
    console.error("SizeSelectionScreen FATAL Error: CurrentItemContext is not available. Ensure CurrentItemProvider wraps this part of the app in main.jsx or App.jsx.");
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '24px', color: 'red' }}>
        <p><b>Critical Error: Product configuration system failed to load.</b></p>
        <p>Please ensure the application is set up correctly. You might need to restart the application.</p>
        <Link to="/" style={{ color: '#00566F', textDecoration: 'underline', marginTop: '20px', display: 'inline-block' }}>
          Return to Home Page
        </Link>
      </div>
    );
  }

  const { currentItem, updateCurrentItem } = contextValue;

  const [selectedThicknessKey, setSelectedThicknessKey] = useState(null);
  const [selectedSizeKey, setSelectedSizeKey] = useState(null);
  const [measurementText, setMeasurementText] = useState('');
  const [isSizeChartModalOpen, setIsSizeChartModalOpen] = useState(false);

  useEffect(() => {
    console.log("SizeSelectionScreen EFFECT: currentItem updated or component mounted. CurrentItem:", currentItem);
    if (currentItem) {
      // Initialize selected thickness based on currentItem.thickness (numeric GSM)
      if (currentItem.thickness) {
        const matchingKey = Object.keys(thicknessOptions).find(
          key => thicknessOptions[key].gsm === currentItem.thickness
        );
        if (matchingKey) {
          setSelectedThicknessKey(matchingKey);
           console.log(`SizeSelectionScreen EFFECT: Initialized selectedThicknessKey to '${matchingKey}' based on currentItem.thickness: ${currentItem.thickness}`);
        } else {
          setSelectedThicknessKey(null);
          console.log(`SizeSelectionScreen EFFECT: currentItem.thickness (${currentItem.thickness}) didn't match any option, resetting selectedThicknessKey.`);
        }
      } else {
        setSelectedThicknessKey(null);
        console.log("SizeSelectionScreen EFFECT: currentItem.thickness is null/undefined, selectedThicknessKey set to null.");
      }

      // Initialize selected size
      if (currentItem.size) {
        setSelectedSizeKey(currentItem.size);
        setMeasurementText(sizeDetails[currentItem.size]?.measurement || '');
        console.log(`SizeSelectionScreen EFFECT: Initialized selectedSizeKey to '${currentItem.size}'.`);
      } else {
        setSelectedSizeKey(null);
        setMeasurementText('');
        console.log("SizeSelectionScreen EFFECT: currentItem.size is null/undefined, selectedSizeKey set to null.");
      }
    } else {
      // currentItem is null (e.g., after context clear or error)
      setSelectedThicknessKey(null);
      setSelectedSizeKey(null);
      setMeasurementText('');
      console.log("SizeSelectionScreen EFFECT: currentItem from context is null, resetting local UI state.");
    }
  }, [currentItem]); // Re-run when currentItem from context changes

  const handleThicknessSelect = (thicknessKey) => {
    const selectedOption = thicknessOptions[thicknessKey];
    console.log(`SizeSelectionScreen ACTION: Thickness selected - Key: ${thicknessKey}, GSM: ${selectedOption.gsm}, Name: ${selectedOption.name}`);
    
    setSelectedThicknessKey(thicknessKey); // Update local UI state immediately
    
    updateCurrentItem({
      thickness: selectedOption.gsm,         // This is the numeric GSM value for pricing
      thicknessName: selectedOption.name,
      // Reset price details when thickness changes, as base cost is affected
      calculatedUnitPrice: 0, 
      priceBreakdown: null
    });
  };

  const handleSizeSelect = (sizeKey) => {
    console.log(`SizeSelectionScreen ACTION: Size selected - Key: ${sizeKey}`);

    setSelectedSizeKey(sizeKey); // Update local UI state immediately
    setMeasurementText(sizeDetails[sizeKey].measurement);

    updateCurrentItem({
      size: sizeKey,
      // Reset price details when size changes, as print area costs are affected
      calculatedUnitPrice: 0,
      priceBreakdown: null
    });
  };

  const isNextButtonActive = currentItem && currentItem.thickness !== null && typeof currentItem.thickness === 'number' && currentItem.size;

  const handleNext = () => {
    if (isNextButtonActive) {
      console.log("SizeSelectionScreen ACTION: Navigating to /feature-display with currentItem:", JSON.parse(JSON.stringify(currentItem)));
      navigate('/feature-display');
    } else {
        let missing = [];
        if (!currentItem || currentItem.thickness === null || typeof currentItem.thickness !== 'number') missing.push("thickness");
        if (!currentItem || !currentItem.size) missing.push("size");
        alert(`Please select both thickness and size. Missing: ${missing.join(', ')}`);
        console.warn("SizeSelectionScreen ACTION: Next button clicked but prerequisites not met. CurrentItem:", currentItem);
    }
  };

  // --- Styles --- (Copied from your provided code)
  const pageTitleStyle = { width: 'auto', height: '120px', left: '50%', transform: 'translateX(-50%)', top: '94px', position: 'absolute', color: '#00566F', fontSize: '96px', fontFamily: "'SS Magnetic', sans-serif", fontWeight: 400, whiteSpace: 'nowrap' };
  const leftPanelStyle = { width: '792px', height: '975px', left: '113px', top: '285px', position: 'absolute', opacity: 0.35, background: '#DEEFFF', borderRadius: '12px' };
  const mockupTextStyle = { width: '277.37px', left: '370px', top: '325px', position: 'absolute', color: '#00566F', fontSize: '62px', fontFamily: 'Inter, sans-serif', fontWeight: 600, wordWrap: 'break-word' };
  const mockupImageStyle = { width: '688.53px', height: '691.46px', left: '165px', top: '460px', position: 'absolute' };
  const backArrowStyle = { width: '120px', height: '120px', left: '127px', top: '94px', position: 'absolute', cursor: 'pointer' };
  const sectionTitleStyle = { color: 'rgba(0, 0, 0, 0.89)', fontSize: '52px', fontFamily: 'Inter, sans-serif', fontWeight: 700, wordWrap: 'break-word', position: 'absolute' };
  const cardBaseStyle = { width: '526px', height: '208px', position: 'absolute', background: '#F3F9FF', borderRadius: '12px', border: '2.90px solid #00566F', cursor: 'pointer', transition: 'all 0.3s ease', };
  const cardActiveStyle = { opacity: 1, boxShadow: '0px 8px 20px rgba(0, 86, 111, 0.3)', backgroundColor: '#FFFFFF', };
  const cardTitleTextStyle = { left: '31px', top: '36px', position: 'absolute', color: '#00566F', fontSize: '40px', fontFamily: 'Inter, sans-serif', fontWeight: 600, wordWrap: 'break-word' };
  const cardPriceTextStyle = { left: '31px', top: '89px', position: 'absolute', color: '#00566F', fontSize: '48px', fontFamily: 'Inter, sans-serif', fontWeight: 800, wordWrap: 'break-word' };
  const descriptionTextStyle = { position: 'absolute', left: '957px', top: '697px', width: '526px', color: '#00566F', fontSize: '32px', fontFamily: 'Inter, sans-serif', fontWeight: 500, wordWrap: 'break-word', };
  const sizeOptionBaseStyle = { width: '132.41px', height: '132.41px', position: 'absolute', background: '#EEF7FF', borderRadius: '33.10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease', };
  const sizeOptionActiveStyle = { boxShadow: '0px 8px 20px rgba(0, 86, 111, 0.3)', background: '#FFFFFF', opacity: 1, };
  const sizeOptionTextStyle = { color: '#00566F', fontSize: '57.38px', fontFamily: 'Inter, sans-serif', fontWeight: 700 };
  const measurementDisplayStyle = { left: '987px', top: '1020px', position: 'absolute', fontSize: '28px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#00566F' };
  const nextButtonStyle = { width: '344px', height: '120.44px', left: '1750px', top: '1140px', position: 'absolute', borderRadius: '12.04px', border: 'none', color: 'white', fontSize: '48px', fontFamily: 'Inter, sans-serif', fontWeight: 600, transition: 'background-color 0.3s', background: isNextButtonActive ? '#00566F' : 'rgba(0, 86, 111, 0.34)', pointerEvents: isNextButtonActive ? 'auto' : 'none', cursor: isNextButtonActive ? 'pointer' : 'default', };
  const viewSizeChartStyle = { left: '1859px', top: '784px', position: 'absolute', color: '#00566F', fontSize: '32px', fontFamily: 'Inter, sans-serif', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' };
  const modalOverlayStyle = { display: isSizeChartModalOpen ? 'flex' : 'none', position: 'fixed', zIndex: 1002, left: 0, top: 0, width: '100%', height: '100%', backdropFilter: 'blur(5px)', background: 'rgba(0, 0, 0, 0.2)', justifyContent: 'center', alignItems: 'center' };
  const modalContentStyle = { position: 'relative', background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };
  const modalCloseBtnStyle = { position: 'absolute', top: '10px', right: '10px', width: '69px', height: '69px', cursor: 'pointer', zIndex: 10 };
  const modalSizeChartImgStyle = { display: 'block', maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '10px' };

  return (
    <>
      <div style={leftPanelStyle} />
      <div style={mockupTextStyle}>Mockup</div>
      <img style={mockupImageStyle} src="/Size_Selection_Img/tshirtmockupt.png" alt="T-shirt Mockup"/>
      <Link to="/categories">
        <img style={backArrowStyle} src="/Size_Selection_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={pageTitleStyle}>Find your Perfect Fit</div>
      <div style={{ ...sectionTitleStyle, left: '957px', top: '368px' }}>Pick thickness</div>
      {Object.entries(thicknessOptions).map(([key, option]) => (
        <React.Fragment key={option.id}>
          <div id={option.id} style={{...cardBaseStyle, left: key === 'standard' ? '957px' : '1568px', top: '460px', ...(selectedThicknessKey === key ? cardActiveStyle : {})}} onClick={() => handleThicknessSelect(key)} >
            <div style={cardTitleTextStyle}>{option.name}</div>
            <div style={cardPriceTextStyle}><span>₹</span>{option.price}</div>
          </div>
          {selectedThicknessKey === key && ( <div id={`${key}-desc`} style={descriptionTextStyle}>{option.description}</div> )}
        </React.Fragment>
      ))}
      <div style={{ ...sectionTitleStyle, left: '957px', top: '773px' }}>Size options</div>
      {Object.entries(sizeDetails).map(([sizeKey, detailValue], index) => (
         <div key={sizeKey} id={`size-${sizeKey.toLowerCase()}`} style={{ ...sizeOptionBaseStyle, left: `${987 + index * (132.41 + 47.45)}px`, top: '865px', ...(selectedSizeKey === sizeKey ? sizeOptionActiveStyle : {})}} onClick={() => handleSizeSelect(sizeKey)} >
            <div style={sizeOptionTextStyle}>{sizeKey}</div>
        </div>
       ))}
      <div id="measurement-display" style={measurementDisplayStyle}>{measurementText}</div>
      <button id="next-button" style={nextButtonStyle} onClick={handleNext} disabled={!isNextButtonActive}>Next</button>
      <div id="viewsizechart" style={viewSizeChartStyle} onClick={() => setIsSizeChartModalOpen(true)}> View size chart </div>
      {isSizeChartModalOpen && ( <div id="sizechartmodal" style={modalOverlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setIsSizeChartModalOpen(false);}}> <div style={modalContentStyle}> <img style={modalCloseBtnStyle} src="/Size_Selection_Img/closeicon.png" alt="Close" onClick={() => setIsSizeChartModalOpen(false)} /> <img style={modalSizeChartImgStyle} src="/Size_Selection_Img/sizechart.png" alt="Size Chart" /> </div> </div> )}
    </>
  );
};
export default SizeSelectionScreen;