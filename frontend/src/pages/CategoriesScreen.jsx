// frontend/src/pages/CategoriesScreen.jsx
import React, { useState } /*, useEffect */ from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import CartIndicator from '../components/common/CartIndicator';

const CategoriesScreen = () => {
  const navigate = useNavigate();
  const [activeCardName, setActiveCardName] = useState(null);

  const handleCardClick = (cardName, path, isEnabled = true) => {
    if (!isEnabled) return;
    setActiveCardName(cardName);
    setTimeout(() => {
      navigate(path);
      setActiveCardName(null);
    }, 150); // Short delay for visual click effect
  };

  // Define styles from HTML
  const titleStyle = {
    width: '1007px', // or auto with centering
    height: '120px',
    left: '50%',
    transform: 'translateX(-50%)',
    top: '136px',
    position: 'absolute',
    color: '#00566F',
    fontSize: '96px',
    fontFamily: 'SS Magnetic, sans-serif',
    fontWeight: 400,
    wordWrap: 'break-word',
    textAlign: 'center',
  };

  const backArrowStyle = {
    width: '120px',
    height: '120px',
    left: '127px',
    top: '136px',
    position: 'absolute',
  };

  const categoryCardWrapperStyle = { // Corresponds to the div wrapping a cardone and its content
    position: 'absolute',
    // left & top are specific per card
  };

  const cardOneBaseStyle = { // .cardone
    width: '545px',
    height: '726px',
    background: '#DEEFFF',
    borderRadius: '12px',
    transition: 'box-shadow 0.3s ease',
    // opacity handled per card
  };

  const cardOneActiveStyle = { // For T-shirt card click
    boxShadow: '0px 4px 24.799999237060547px 15px #00566F',
  };

  const cardImageStyle = { // Common for mockup images within cards
    position: 'absolute',
    // Specific top, left, width, height, opacity per card
  };

  const cardTitleTextStyle = {
    position: 'absolute',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    // Specific top, left, fontSize, color, opacity per card
  };

  const lockImageStyle = { // Common for lock icon on disabled cards
    position: 'absolute',
    opacity: 0.7,
    // Specific top, left per card
  };

  const comingSoonTextStyle = {
    position: 'absolute',
    fontSize: '48px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    color: '#00566f', // Note: original HTML used #00566f lowercase sometimes
    opacity: 0.7,
    // Specific top, left per card
  };


  return (
    <>
      {/* <CartIndicator /> */}
      <Link to="/product-selection">
        <img style={backArrowStyle} src="/Categories_Screen_Img/back arrow.png" alt="Back" />
      </Link>
      <div style={titleStyle}>Select and Customize</div>

      {/* T-Shirts Card (Interactive) */}
      <div
        style={{ ...categoryCardWrapperStyle, left: '187px', top: '364px', cursor: 'pointer' }}
        onClick={() => handleCardClick('t-shirts', '/size-selection')}
      >
        <div style={{ ...cardOneBaseStyle, opacity: 1, ...(activeCardName === 't-shirts' && cardOneActiveStyle) }} />
        <img
          src="/Categories_Screen_Img/tshirtmockup.png"
          alt="T-Shirt Mockup"
          style={{ ...cardImageStyle, width: '462px', height: '463.96px', top: '104px', left: '42px' }}
        />
        <div style={{ ...cardTitleTextStyle, top: '580px', left: '150px', fontSize: '62px', color: '#00566F' }}>
          T-Shirts
        </div>
      </div>

      {/* Hoodies Card (Disabled) */}
      <div style={{ ...categoryCardWrapperStyle, left: '812px', top: '364px', cursor: 'default' }}>
        <div style={{ ...cardOneBaseStyle, opacity: 0.35 }} />
        <img
          src="/Categories_Screen_Img/hoodiemockup.png"
          alt="Hoodie Mockup"
          style={{ ...cardImageStyle, width: '403px', height: '403px', top: '157px', left: '71px', opacity: 0.1 }}
        />
        <div style={{ ...cardTitleTextStyle, top: '578px', left: '145px', fontSize: '64px', color: '#00566F', opacity: 0.35 }}>
          Hoodies
        </div>
        <img src="/Categories_Screen_Img/Lock.png" alt="Lock" style={{ ...lockImageStyle, left: '219px', top: '306px' }} />
        <div style={{ ...comingSoonTextStyle, left: '120px', top: '415px' }}>Coming soon</div>
      </div>

      {/* Jackets Card (Disabled) */}
      <div style={{ ...categoryCardWrapperStyle, left: '1437px', top: '364px', cursor: 'default' }}>
        <div style={{ ...cardOneBaseStyle, opacity: 0.35 }} />
        <img
          src="/Categories_Screen_Img/jacket.png"
          alt="Jacket Mockup"
          style={{ ...cardImageStyle, width: '467px', height: '467px', top: '143px', left: '39px', opacity: 0.1 }}
        />
        <div style={{ ...cardTitleTextStyle, top: '580px', left: '150px', fontSize: '62px', color: '#00566F', opacity: 0.35 }}>
          Jackets
        </div>
        {/* Assuming Lock.png from Product_Selection_Img is the same or you have one in Categories_Screen_Img */}
        <img src="/Product_Selection_Img/Lock.png" alt="Lock" style={{ ...lockImageStyle, left: '219px', top: '306px' }} />
        <div style={{ ...comingSoonTextStyle, left: '120px', top: '415px' }}>Coming soon</div>
      </div>
    </>
  );
};

export default CategoriesScreen;