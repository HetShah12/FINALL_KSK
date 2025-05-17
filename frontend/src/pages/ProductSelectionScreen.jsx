// frontend/src/pages/ProductSelectionScreen.jsx
import React, { useState } /* useEffect */ from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import CartIndicator from '../components/common/CartIndicator';

const ProductSelectionScreen = () => {
  const navigate = useNavigate();
  const [activeCardName, setActiveCardName] = useState(null);

  const handleCardClick = (cardName, path, isEnabled = true) => {
    if (!isEnabled) return;

    setActiveCardName(cardName);
    // Original HTML had a timeout for visual effect, we can replicate if needed
    // For now, direct navigation or a small timeout
    setTimeout(() => {
      navigate(path);
      setActiveCardName(null); // Reset after navigation for visual consistency
    }, 150); // Short delay for click visual
  };

  // Define styles based on the HTML for better reusability
  const titleStyle = {
    width: '1007px', // Or auto with text-align center and positioning
    height: '120px',
    position: 'absolute',
    left: '50%', // Centering technique
    transform: 'translateX(-50%)', // Centering technique
    top: '177px',
    color: '#00566F',
    fontSize: '96px',
    fontFamily: 'SS Magnetic, sans-serif', // Ensure this font is loaded globally or via @font-face
    fontWeight: 400,
    wordWrap: 'break-word',
    textAlign: 'center',
  };

  const backArrowStyle = {
    width: '120px',
    height: '120px',
    left: '50px', // As per original, ensure PageContainer handles padding/overall layout if needed
    top: '50px',
    position: 'absolute',
    zIndex: 100,
  };

  const cardContainerBaseStyle = { // Style for the <a> tag's div child
    width: '545px',
    height: '443px',
    position: 'absolute',
    borderRadius: '12px',
  };

  const cardoBaseStyle = {
    width: '100%',
    height: '100%',
    background: '#DEEFFF',
    opacity: 0.35,
    boxShadow: '0px 0px 20.3px #00566F',
    borderRadius: '12px',
    position: 'absolute',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const cardoActiveStyle = {
    transform: 'scale(1.02)',
    boxShadow: '0px 0px 23.416027069091797px 13.841986656188965px #00566F',
  };

  const cardIconStyle = {
    position: 'absolute',
    top: '107px',
    left: '197px',
  };

  const cardTitleStyle = {
    position: 'absolute',
    top: '324px',
    fontSize: '64px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    textAlign: 'center', // Ensure text aligns center
    width: '100%', // Take full width of parent for centering text
    left: 0, // Align relative to parent
  };

  const comingSoonLockStyle = {
    width: '103px',
    height: '103px',
    position: 'absolute',
    left: '220px',
    top: '155px',
  };
  const comingSoonTextStyle = {
    position: 'absolute',
    top: '250px', // Adjusted from original for better placement within card
    left: 0, // Center text by taking full width
    right: 0,
    textAlign: 'center',
    color: '#00566F',
    fontSize: '48px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    wordWrap: 'break-word',
  };

  return (
    <>
      {/* <CartIndicator /> */}
      <Link to="/home">
        <img style={backArrowStyle} src="/Features_Display_Img/back arrow.png" alt="Back" />
      </Link>

      <div style={titleStyle}>Choose your Product</div>

      {/* Clothing Card */}
      <div
        style={{ ...cardContainerBaseStyle, left: '187px', top: '499px', cursor: 'pointer' }}
        onClick={() => handleCardClick('clothing', '/categories')}
        className={activeCardName === 'clothing' ? 'tshirtcard active' : 'tshirtcard'} // For CSS active state
      >
        <div style={{ ...cardoBaseStyle, ...(activeCardName === 'clothing' && cardoActiveStyle) }} />
        <img src="/Product_Selection_Img/tshirticon.png" alt="Clothing" style={{...cardIconStyle, width: '150px', height: '150px'}} />
        <div style={{ ...cardTitleStyle, color: '#00566F' }}>Clothing</div>
      </div>

      {/* 3D Prints Card (Disabled) */}
      <div style={{ ...cardContainerBaseStyle, left: '861px', top: '499px', cursor: 'default' }}>
        <div style={{ ...cardoBaseStyle, opacity: 0.35 }} /> {/* Explicit disabled opacity */}
        <img src="/Product_Selection_Img/printicon.png" alt="3D Prints" style={{...cardIconStyle, width: '157px', height: '193px', opacity: 0.3 }} />
        <img src="/Product_Selection_Img/Lock.png" alt="Lock" style={comingSoonLockStyle} />
        <div style={{ ...cardTitleStyle, color: 'rgba(0, 86, 111, 0.44)', opacity: 0.35 }}>3D Prints</div>
        <div style={comingSoonTextStyle}>Coming soon</div>
      </div>

      {/* Mugs Card (Disabled) */}
      <div style={{ ...cardContainerBaseStyle, left: '1467px', top: '499px', cursor: 'default' }}>
        <div style={{ ...cardoBaseStyle, opacity: 0.35 }} /> {/* Explicit disabled opacity */}
        <img src="/Product_Selection_Img/mugicon.png" alt="Mugs" style={{...cardIconStyle, width: '150px', height: '150px', opacity: 0.3 }} />
        <img src="/Product_Selection_Img/Lock.png" alt="Lock" style={comingSoonLockStyle} />
        <div style={{ ...cardTitleStyle, color: 'rgba(0, 86, 111, 0.44)', opacity: 0.35 }}>Mugs</div>
        <div style={comingSoonTextStyle}>Coming soon</div>
      </div>
    </>
  );
};

export default ProductSelectionScreen;